import { randomUUID } from 'node:crypto';
import type { IncomingMessage, ServerResponse } from 'node:http';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { isInitializeRequest, type CallToolResult } from '@modelcontextprotocol/sdk/types.js';
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
    description: 'Ask for brief matching excerpts. Use a consistent, specific purpose for a repeated task.',
    inputSchema: askSchema,
  }, async input => format(await safe(() => ops.ask(input))));
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
