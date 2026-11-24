import { randomUUID } from 'node:crypto';
import type { IncomingMessage, ServerResponse } from 'node:http';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { isInitializeRequest, type CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';
import { askSchema, credentialPattern, equal, proposeSchema, sha256 } from './domain.js';
import type { Ask, Proposed, ToolReply } from './domain.js';
import { json, jsonBody } from './http.js';
import type { Wallet } from './wallet.js';

export interface AgentOperations {
  status(): Promise<ToolReply>;
  ask(input: Ask): Promise<ToolReply>;
  propose(input: Proposed): Promise<ToolReply>;
}

export function operations(wallet: Wallet, credential: string): AgentOperations {
  return {
    status: () => wallet.status(credential),
    ask: input => wallet.ask(credential, input),
    propose: input => wallet.propose(credential, input),
  };
}

function format(result: ToolReply): CallToolResult {
  if (result.state === 'proxy_ready') {
    const { reference, ...status } = result;
    return { content: [{ type: 'text', text: reference }], structuredContent: status };
  }
  if (result.state === 'released') {
    const { content, ...status } = result;
    return { content: [{ type: 'text', text: content }], structuredContent: status };
  }
  const status = { ...result };
  if ('fresh' in status) delete status.fresh;
  return { content: [{ type: 'text', text: JSON.stringify(status) }], structuredContent: status };
}

async function safe(action: () => Promise<ToolReply>): Promise<ToolReply> {
  try {
    return await action();
  } catch {
    return { state: 'unavailable' };
  }
}

export function createMcp(ops: AgentOperations) {
  const server = new McpServer({ name: 'bleib', version: '0.2.0' }, {
    instructions: 'Call bleib_status first. If asked for approval, show the person the approval link and retry after they decide.',
  });
  server.registerTool('bleib_status', {
    description: 'Call first to check wallet availability and your connection.',
  }, async () => format(await safe(ops.status)));
  server.registerTool('bleib_context_request', {
    description: 'Ask for brief matching excerpts. State the specific purpose. If a proxy reference is returned, preserve it as tool-result text.',
    inputSchema: askSchema,
  }, async (input, extra) => {
    const result = await safe(() => ops.ask(input));
    if (result.state !== 'approval_required' || !result.fresh) return format(result);
    const capability = server.server.getClientCapabilities()?.elicitation;
    if (!capability || extra.signal.aborted) return format(result);
    const options = { relatedRequestId: extra.requestId, signal: extra.signal, timeout: 45_000 };
    try {
      const reply = capability.url
        ? await server.server.elicitInput({
          mode: 'url', elicitationId: result.grant_request_id, url: result.approve_url,
          message: 'Open your bleib wallet to review a sharing request.',
        }, options)
        : await server.server.elicitInput({
          mode: 'form', requestedSchema: { type: 'object', properties: {} },
          message: `Review the sharing request in your bleib wallet: ${result.approve_url}`,
        }, options);
      // Elicitation only surfaces the link. The wallet checks the independent owner decision.
      if (reply.action === 'accept' && !extra.signal.aborted) return format(await safe(() => ops.ask(input)));
    } catch {
      // The same link remains actionable if the client dismisses or cannot render the prompt.
    }
    return format(result);
  });
  server.registerTool('bleib_propose_memory', {
    description: 'Suggest a note for the owner to review. This gives no permission to read anything.',
    inputSchema: proposeSchema,
  }, async input => format(await safe(() => ops.propose(input))));
  return server;
}

export function bearer(req: IncomingMessage) {
  const header = req.headers.authorization;
  const token = header?.startsWith('Bearer ') ? header.slice(7) : '';
  return credentialPattern.test(token) ? token : '';
}

const sessionLifetime = 30 * 60 * 1000;
interface Session {
  server: McpServer;
  transport: StreamableHTTPServerTransport;
  tokenHash: string;
  touched: number;
}

export class McpHttp {
  private sessions = new Map<string, Session>();

  constructor(private wallet: Wallet) {}

  async handle(req: IncomingMessage, res: ServerResponse) {
    const token = bearer(req);
    if (!token) return json(res, 401, { state: 'denied' });
    const tokenHash = sha256(token);
    const now = Date.now();
    for (const [id, session] of this.sessions) {
      if (session.touched + sessionLifetime <= now) {
        this.sessions.delete(id);
        await session.server.close();
      }
    }

    const id = req.headers['mcp-session-id'];
    if (typeof id === 'string') {
      const session = this.sessions.get(id);
      if (!session) return json(res, 404, { state: 'unavailable' });
      if (!equal(session.tokenHash, tokenHash)) return json(res, 401, { state: 'denied' });
      session.touched = now;
      const message = req.method === 'POST' ? await jsonBody(req) : undefined;
      return session.transport.handleRequest(req, res, message);
    }

    if (req.method !== 'POST') return json(res, 400, { state: 'denied' });
    const message = await jsonBody(req);
    if (!isInitializeRequest(message)) return json(res, 400, { state: 'denied' });
    if (this.sessions.size >= 128) return json(res, 503, { state: 'unavailable' });

    const server = createMcp(operations(this.wallet, token));
    const transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: randomUUID,
      onsessioninitialized: id => { this.sessions.set(id, { server, transport, tokenHash, touched: now }); },
    });
    transport.onclose = () => { if (transport.sessionId) this.sessions.delete(transport.sessionId); };
    await server.connect(transport);
    try {
      await transport.handleRequest(req, res, message);
    } finally {
      if (!transport.sessionId) await server.close();
    }
  }

  async close() {
    await Promise.all([...this.sessions.values()].map(session => session.server.close()));
    this.sessions.clear();
  }
}

const bridgeSchema = z.discriminatedUnion('action', [
  z.object({ action: z.literal('status') }).strict(),
  z.object({ action: z.literal('ask'), input: askSchema }).strict(),
  z.object({ action: z.literal('propose'), input: proposeSchema }).strict(),
]);
type BridgeRequest = z.infer<typeof bridgeSchema>;

export async function handleBridge(wallet: Wallet, req: IncomingMessage, res: ServerResponse) {
  const credential = bearer(req);
  if (!credential) return json(res, 401, { state: 'denied' });
  const parsed = bridgeSchema.safeParse(await jsonBody(req));
  if (!parsed.success) return json(res, 400, { state: 'denied' });
  const ops = operations(wallet, credential);
  const request = parsed.data;
  const result = await safe(() => {
    switch (request.action) {
      case 'status': return ops.status();
      case 'ask': return ops.ask(request.input);
      case 'propose': return ops.propose(request.input);
    }
  });
  return json(res, 200, result);
}

export async function serveStdio(origin: string, credential: string) {
  async function send(request: BridgeRequest): Promise<ToolReply> {
    if (!credentialPattern.test(credential)) return { state: 'denied' };
    return safe(async () => {
      const response = await fetch(`${origin}/stdio`, {
        method: 'POST', redirect: 'error', signal: AbortSignal.timeout(20_000),
        headers: { Authorization: `Bearer ${credential}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(request),
      });
      if (!response.ok) return { state: response.status === 401 ? 'denied' : 'unavailable' };
      return await response.json() as ToolReply;
    });
  }

  const server = createMcp({
    status: () => send({ action: 'status' }),
    ask: input => send({ action: 'ask', input }),
    propose: input => send({ action: 'propose', input }),
  });
  await server.connect(new StdioServerTransport());
}
