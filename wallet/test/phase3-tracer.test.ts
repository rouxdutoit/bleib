import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { createServer } from 'node:http';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';
import { afterAll, beforeAll, expect, it } from 'vitest';
import { callOwner, startDaemon } from '../src/daemon.js';
import { sha256, type Ask, type ToolReply } from '../src/domain.js';
import { proxyRoutes } from '../src/proxy.js';
import { prepareKit } from '../src/store.js';

let root: string;
let home: string;
let daemon: Awaited<ReturnType<typeof startDaemon>>;
let origin: string;
let host: string;
const upstreamRequests: { raw: Buffer; auth?: string; path?: string; persisted: boolean }[] = [];
let failReceiptWrite = false;
const upstream = createServer(async (req, res) => {
  const chunks: Buffer[] = [];
  for await (const chunk of req) chunks.push(chunk);
  const raw = Buffer.concat(chunks);
  const persisted = (await daemon.wallet.receipts()).some(receipt => receipt.outbound_digest === sha256(raw));
  upstreamRequests.push({ raw, auth: req.headers.authorization ?? req.headers['x-api-key'] as string, path: req.url, persisted });
  if (JSON.parse(raw.toString()).stream) {
    res.writeHead(200, { 'Content-Type': 'text/event-stream' });
    res.end('data: streamed\n\n');
  } else {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end('{"ok":true}');
  }
});

const preference: Ask = { kinds: ['preferences'], purpose: 'Pick tea', question: 'Which tea?' };
const fixture = fileURLToPath(new URL('fixtures/openclaw', import.meta.url));
const passphrase = 'synthetic Phase 3 test passphrase';

beforeAll(async () => {
  root = await mkdtemp(join(tmpdir(), 'bleib-p3-'));
  home = join(root, 'wallet');
  const kit = join(root, 'kit.txt');
  const setup = await prepareKit(home, kit);
  await setup.confirm(/Confirmation word: (\S+)/.exec(await readFile(kit, 'utf8'))![1]!, passphrase);
  await new Promise<void>(resolve => upstream.listen(0, '127.0.0.1', resolve));
  const address = upstream.address();
  if (!address || typeof address === 'string') throw new Error('Upstream did not start');
  host = `127.0.0.1:${address.port}`;
  daemon = await startDaemon(home, {
    idleMs: 60_000,
    routes: proxyRoutes({
      BLEIB_OPENAI_UPSTREAM: `http://${host}/v1/chat/completions`, BLEIB_OPENAI_API_KEY: 'upstream-openai-key',
      BLEIB_ANTHROPIC_UPSTREAM: `http://${host}/v1/messages`, BLEIB_ANTHROPIC_API_KEY: 'upstream-anthropic-key',
    }),
    beforeCommit(change) {
      if (failReceiptWrite && change.receipts?.length) throw new Error('simulated receipt write failure');
    },
  });
  origin = daemon.origin;
  await daemon.wallet.unlock(passphrase);
  await daemon.wallet.importWorkspace(fixture, 'openclaw');
}, 20_000);

afterAll(async () => {
  await daemon?.close();
  upstream.closeAllConnections();
  await new Promise<void>(resolve => upstream.close(() => resolve()));
  await rm(root, { recursive: true, force: true });
});

async function pair(name: string, protocol?: 'openai' | 'anthropic', model?: string, destination = 'local') {
  const { code } = await daemon.wallet.pair(name, destination, model, protocol);
  return (await daemon.wallet.redeem(code)).credential;
}

function pending(reply: ToolReply) {
  if (reply.state !== 'approval_required') throw new Error(`Expected an approval, got ${reply.state}`);
  return reply.grant_request_id;
}

function proxy(token: string, model: string, content: string, protocol: 'openai' | 'anthropic' = 'openai') {
  const anthropic = protocol === 'anthropic';
  return fetch(origin + (anthropic ? '/v1/messages' : '/v1/chat/completions'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...(anthropic ? { 'x-api-key': token } : { Authorization: `Bearer ${token}` }) },
    body: JSON.stringify({ model, stream: anthropic, messages: anthropic
      ? [{ role: 'user', content: [{ type: 'tool_result', tool_use_id: 'tool1', content: [{ type: 'text', text: content }] }] }]
      : [{ role: 'tool', tool_call_id: 'tool1', content }] }),
  });
}

async function ownerCookie() {
  const path = await callOwner(home, { action: 'ui' }) as string;
  const response = await fetch(origin + path, { redirect: 'manual' });
  return response.headers.get('set-cookie')!.split(';')[0]!;
}

it('traces owner rule confirmation, MCP reference, exact observed release and timeline', async () => {
  const cookie = await ownerCookie();
  const get = (path: string) => fetch(origin + path, { headers: { Cookie: cookie } }).then(response => response.text());
  const put = (fields: Record<string, string>) => fetch(`${origin}/rules`, {
    method: 'POST', redirect: 'manual', headers: {
      Cookie: cookie, Origin: origin, 'Content-Type': 'application/x-www-form-urlencoded',
    }, body: new URLSearchParams(fields),
  });
  const field = (html: string, name: string) => new RegExp(`name="${name}" value="([^"]+)"`).exec(html)![1]!;
  const token = await pair('Tracer agent', 'openai', 'actual-model');
  const sdk = new Client({ name: 'phase3-tracer', version: '1' });
  await sdk.connect(new StreamableHTTPClientTransport(new URL(`${origin}/mcp`), {
    requestInit: { headers: { Authorization: `Bearer ${token}` } },
  }));
  try {
    const context = (arguments_: Ask) => sdk.callTool({ name: 'bleib_context_request', arguments: arguments_ });
    const health: Ask = { kinds: ['health'], purpose: 'Plan visit' };
    const rule = 'Never share health';
    const preview = await (await put({ action: 'preview-rule', rule, csrf: field(await get('/rules'), 'csrf') })).text();
    expect(preview).toContain('Block health for all agents.');
    expect(await daemon.wallet.rules()).toEqual([]);
    expect((await put({ action: 'save-rule', rule, csrf: field(preview, 'csrf'), fingerprint: field(preview, 'fingerprint') })).status).toBe(303);
    expect((await context(health)).structuredContent).toEqual({ state: 'denied' });
    expect((await sdk.listTools()).tools.map(tool => tool.name)).toEqual([
      'bleib_status', 'bleib_context_request', 'bleib_propose_memory',
    ]);
    const request = (await context(preference)).structuredContent as ToolReply;
    await daemon.wallet.approve(pending(request), 'once', false);
    const ready = await context(preference);
    expect(ready.structuredContent).toEqual({ state: 'proxy_ready' });
    const marker = (ready.content as { text: string }[])[0]!.text;
    expect(marker).toMatch(/^bleib-projection:/);
    expect(await daemon.wallet.receipts()).toEqual([]);
    expect((await proxy(token, 'other-model', marker)).status).toBe(409);
    expect(upstreamRequests).toEqual([]);
    expect(await get('/approvals')).toContain('bleib blocked Tracer agent');
    expect((await proxy(token, 'actual-model', marker)).status).toBe(200);
    const [outbound] = upstreamRequests;
    expect(outbound).toMatchObject({ auth: 'Bearer upstream-openai-key', path: '/v1/chat/completions', persisted: true });
    expect(outbound!.raw.toString()).toContain('My preferred tea is jasmine.');
    expect(outbound!.raw.toString()).not.toContain(token);
    const [receipt] = await daemon.wallet.receipts();
    expect(receipt).toMatchObject({
      destination_basis: 'observed', provider: 'OpenAI', model: 'actual-model', destination_host: host,
      purpose: 'Pick tea', content_digest: sha256('My preferred tea is jasmine.'), outbound_digest: sha256(outbound!.raw),
    });
    expect(await get(`/receipts?agent=${receipt!.agent_id}&kind=preferences`)).toContain('Tracer agent');
    expect(await get('/receipts?kind=health')).not.toContain(`/receipts/${receipt!.receipt_id}`);
    expect(await get(`/receipts/${receipt!.receipt_id}`)).toContain('(observed)');
    expect(await callOwner(home, { action: 'summary' })).toMatchObject({ facts: 1, agents: 1 });
    expect((await proxy(token, 'actual-model', marker)).status).toBe(200);
    expect(upstreamRequests).toHaveLength(2);
    expect(upstreamRequests[1]!.raw.toString()).toContain('expired or already been shared');
    expect(upstreamRequests[1]!.raw.toString()).not.toContain('My preferred tea');
    expect(await daemon.wallet.receipts()).toHaveLength(1);
  } finally {
    await sdk.close();
  }
});

it('checks stored rules before existing grants and binds agent exceptions by identity', async () => {
  const hosted = await pair('Hosted Claude', undefined, undefined, 'provider:Anthropic');
  const health: Ask = { kinds: ['health'], purpose: 'Health question' };
  await daemon.wallet.removeRule((await daemon.wallet.rules())[0]!.id);
  await daemon.wallet.approve(pending(await daemon.wallet.ask(hosted, health)), 'always', true);
  const rule = await daemon.wallet.previewRule('never share health with hosted models');
  await daemon.wallet.saveRule(rule.text, rule.fingerprint);
  expect(await daemon.wallet.ask(hosted, health)).toEqual({ state: 'denied' });
  const allowed = await pair('Claude');
  const only = await daemon.wallet.previewRule('only Claude may see work');
  await daemon.wallet.saveRule(only.text, only.fingerprint);
  const sameName = await pair('Claude');
  const work: Ask = { kinds: ['work'], purpose: 'Check work' };
  expect(await daemon.wallet.ask(allowed, work)).toMatchObject({ state: 'approval_required' });
  expect(await daemon.wallet.ask(sameName, work)).toEqual({ state: 'denied' });
  const budget = await daemon.wallet.previewRule('keep dinner plans under €30');
  await daemon.wallet.saveRule(budget.text, budget.fingerprint);
  const dinner = { ...preference, purpose: 'Make dinner plans' };
  await daemon.wallet.approve(pending(await daemon.wallet.ask(allowed, dinner)), 'always', false);
  expect(await daemon.wallet.ask(allowed, dinner)).toMatchObject({ state: 'released', constraints: ['Keep dinner plans under €30.'] });
  expect(await daemon.wallet.ask(allowed, { ...dinner, question: 'Amethyst?' }))
    .toMatchObject({ state: 'no_match', constraints: ['Keep dinner plans under €30.'] });
  expect(await daemon.wallet.ask(allowed, preference)).not.toHaveProperty('constraints');
});

it('streams Anthropic responses, binds the reference to its agent and stops on receipt failure', async () => {
  const token = await pair('Anthropic agent', 'anthropic');
  const other = await pair('Other Anthropic agent', 'anthropic');
  await daemon.wallet.approve(pending(await daemon.wallet.ask(token, preference)), 'always', false);
  const ready = await daemon.wallet.ask(token, preference);
  if (ready.state !== 'proxy_ready') throw new Error('Missing reference');
  const start = upstreamRequests.length;
  expect((await proxy(other, 'observed-claude', ready.reference, 'anthropic')).status).toBe(409);
  failReceiptWrite = true;
  try {
    expect((await proxy(token, 'observed-claude', ready.reference, 'anthropic')).status).toBe(503);
    expect(upstreamRequests).toHaveLength(start);
    expect(await daemon.wallet.ownerStatus()).toEqual({ unlocked: false });
  } finally {
    failReceiptWrite = false;
  }
  await daemon.wallet.unlock(passphrase);
  const fresh = await daemon.wallet.ask(token, preference);
  if (fresh.state !== 'proxy_ready') throw new Error('Missing reference after unlock');
  const response = await proxy(token, 'observed-claude', fresh.reference, 'anthropic');
  expect(await response.text()).toBe('data: streamed\n\n');
  expect(upstreamRequests.at(-1)).toMatchObject({ auth: 'upstream-anthropic-key', path: '/v1/messages', persisted: true });
  expect((await daemon.wallet.receipts())[0]).toMatchObject({ model: 'observed-claude', destination_basis: 'observed' });
});
