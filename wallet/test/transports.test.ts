import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { request } from 'node:http';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';
import { ElicitRequestSchema, type ClientCapabilities } from '@modelcontextprotocol/sdk/types.js';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { callOwner, startDaemon } from '../src/daemon.js';
import { secret, type ToolReply } from '../src/domain.js';
import { prepareKit } from '../src/store.js';

const passphrase = 'synthetic minimum lengthy passphrase';
const packageBin = fileURLToPath(new URL('../dist/cli.js', import.meta.url));
const fixture = fileURLToPath(new URL('fixtures/openclaw', import.meta.url));

let root: string;
let home: string;
let daemon: Awaited<ReturnType<typeof startDaemon>>;
let origin: string;
let failReceiptWrite = false;

beforeAll(async () => {
  root = await mkdtemp(join(tmpdir(), 'bl-sdk-'));
  home = join(root, 'wallet');
  const kit = join(root, 'kit.txt');
  const setup = await prepareKit(home, kit);
  const word = /Confirmation word: (\S+)/.exec(await readFile(kit, 'utf8'))![1]!;
  await setup.confirm(word, passphrase);
  daemon = await startDaemon(home, {
    idleMs: 120_000,
    beforeCommit(change) {
      if (failReceiptWrite && change.receipts?.length) throw new Error('simulated crash');
    },
  });
  origin = daemon.origin;
  await callOwner(home, { action: 'unlock', passphrase });
  await callOwner(home, { action: 'import', dialect: 'openclaw', path: fixture });
}, 20_000);

afterAll(async () => {
  await daemon?.close();
  if (root) await rm(root, { recursive: true, force: true });
});

const client = (name: string, capabilities?: ClientCapabilities) =>
  new Client({ name, version: '1' }, { capabilities });
async function pair(name: string) {
  const { code } = await daemon.wallet.pair(name, 'provider:ExampleProvider', 'ExampleModel');
  return (await daemon.wallet.redeem(code)).credential;
}
const ask = (tool: Client, purpose: string, kinds = ['preferences']) => tool.callTool({
  name: 'bleib_context_request', arguments: { purpose, kinds, question: 'Which tea?' },
});
const http = (credential: string) => new StreamableHTTPClientTransport(new URL(`${origin}/mcp`),
  { requestInit: { headers: { Authorization: `Bearer ${credential}` } } });

const csrf = (html: string) => /name="csrf" value="([^"]+)"/.exec(html)?.[1] ?? '';
async function browserSession() {
  const handoff = await callOwner(home, { action: 'ui' }) as string;
  const response = await fetch(origin + handoff, { redirect: 'manual' });
  expect(response.status).toBe(303);
  const cookie = response.headers.get('set-cookie')!;
  expect(cookie).toMatch(/HttpOnly; SameSite=Strict/);
  const replay = await fetch(origin + handoff, { redirect: 'manual' });
  expect(replay.headers.get('set-cookie')).toBeNull();
  return cookie.split(';')[0]!;
}
const form = (url: string, cookie: string, values: Record<string, string>, requestOrigin = origin) =>
  fetch(url, {
    method: 'POST', redirect: 'manual',
    headers: { Cookie: cookie, Origin: requestOrigin, 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams(values),
  });

describe('SDK transports and loopback browser', { timeout: 20_000 }, () => {
  it('uses URL elicitation on HTTP and never treats the client response as consent', async () => {
    const credential = await pair('HTTP agent');
    const sdk = client('http-url', { elicitation: { url: {} } });
    let elicited: unknown;
    sdk.setRequestHandler(ElicitRequestSchema, async ({ params }) => {
      elicited = params;
      return { action: 'accept' };
    });
    try {
      await sdk.connect(http(credential));
      expect((await sdk.callTool({ name: 'bleib_status' })).structuredContent).toMatchObject({ state: 'ready' });
      const result = await ask(sdk, 'HTTP URL');
      const pending = result.structuredContent as Extract<ToolReply, { state: 'approval_required' }>;
      expect(pending).toMatchObject({ state: 'approval_required' });
      expect(elicited).toMatchObject({ mode: 'url', url: pending.approve_url });
      expect(JSON.stringify(elicited)).not.toContain('jasmine');
      const id = pending.grant_request_id;
      await daemon.wallet.approve(id, 'once', false);
      expect((await ask(sdk, 'HTTP URL')).content).toEqual([{ type: 'text', text: 'My preferred tea is jasmine.' }]);
      const receiptId = (await daemon.wallet.receipts()).find(receipt => receipt.purpose === 'HTTP URL')!.receipt_id;
      const cookie = await browserSession();
      const receiptPage = await fetch(`${origin}/receipts/${receiptId}`, { headers: { Cookie: cookie } });
      expect(receiptPage.status).toBe(200);
      const html = await receiptPage.text();
      for (const value of ['My preferred tea is jasmine.', 'ExampleProvider', 'ExampleModel', '(declared)']) {
        expect(html).toContain(value);
      }
    } finally {
      await sdk.close();
    }
  });

  it('uses form-only elicitation over real stdio and keeps credentials bound to their agent', async () => {
    const credential = await pair('Stdio agent');
    const sdk = client('stdio-form', { elicitation: {} });
    const cookie = await browserSession();
    let previewed = false;
    sdk.setRequestHandler(ElicitRequestSchema, async ({ params }) => {
      expect(params.mode).toBe('form');
      expect(JSON.stringify(params)).not.toContain('jasmine');
      const url = params.message.match(/http:\/\/127\.0\.0\.1:\d+\/approvals\/[\w-]+/)?.[0];
      if (!url) throw new Error('Approval link missing.');
      const html = await (await fetch(url, { headers: { Cookie: cookie } })).text();
      previewed = html.includes('My preferred tea is jasmine.');
      const decision = await form(url, cookie, { action: 'approve', csrf: csrf(html), choice: 'once' });
      expect(decision.status).toBe(303);
      return { action: 'accept', content: {} };
    });
    const transport = new StdioClientTransport({
      command: process.execPath, args: [packageBin, 'mcp'],
      env: { BLEIB_HOME: home, BLEIB_AGENT_TOKEN: credential }, stderr: 'pipe',
    });
    try {
      await sdk.connect(transport);
      expect((await sdk.callTool({ name: 'bleib_status' })).structuredContent)
        .toMatchObject({ state: 'ready', agent: 'Stdio agent' });
      const reply = await ask(sdk, 'Stdio form');
      expect(previewed).toBe(true);
      expect(reply.content).toEqual([{ type: 'text', text: 'My preferred tea is jasmine.' }]);
      expect((await sdk.callTool({ name: 'bleib_propose_memory',
        arguments: { content: 'Synthetic tagged suggestion', kind: 'preferences', reason: 'Test only' } })))
        .toMatchObject({ structuredContent: { state: 'proposal_pending' } });
      await daemon.wallet.revoke('Stdio agent');
      expect((await sdk.callTool({ name: 'bleib_status' })).structuredContent).toEqual({ state: 'denied' });
    } finally {
      await sdk.close();
    }
  });

  it('denies unknown tokens and HTTP session substitution, and exposes no unlock tool', async () => {
    const credential = await pair('HTTP identity');
    const sessionTransport = http(credential);
    const good = client('good');
    const bad = client('bad');
    try {
      await good.connect(sessionTransport);
      await bad.connect(http(secret()));
      expect((await bad.callTool({ name: 'bleib_status' })).structuredContent).toEqual({ state: 'denied' });
      expect((await good.listTools()).tools.map(tool => tool.name)).toEqual([
        'bleib_status', 'bleib_context_request', 'bleib_propose_memory',
      ]);
      const other = await pair('Other HTTP identity');
      const mismatch = await fetch(`${origin}/mcp`, {
        headers: { Authorization: `Bearer ${other}`, 'Mcp-Session-Id': sessionTransport.sessionId!,
          Accept: 'text/event-stream' },
      });
      expect(mismatch.status).toBe(401);
      const fakeUnlock = await fetch(`${origin}/stdio`, {
        method: 'POST', headers: { Authorization: `Bearer ${credential}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'unlock', passphrase }),
      });
      expect(fakeUnlock.status).toBe(400);
    } finally {
      await good.close();
      await bad.close();
    }
  });

  it('returns a structured state and no excerpt when the receipt cannot be made durable', async () => {
    const credential = await pair('Failure test agent');
    const sdk = client('crash-test');
    try {
      await sdk.connect(http(credential));
      const purpose = 'Check durability';
      const pending = (await ask(sdk, purpose)).structuredContent as Extract<ToolReply, { state: 'approval_required' }>;
      await daemon.wallet.approve(pending.grant_request_id, 'once', false);
      failReceiptWrite = true;
      const answer = await ask(sdk, purpose);
      expect(answer.structuredContent).toEqual({ state: 'unavailable' });
      expect(JSON.stringify(answer)).not.toContain('jasmine');
      expect((await sdk.callTool({ name: 'bleib_status' })).structuredContent).toEqual({ state: 'locked' });
      failReceiptWrite = false;
      await callOwner(home, { action: 'unlock', passphrase });
      expect((await daemon.wallet.receipts()).some(receipt => receipt.purpose === purpose)).toBe(false);
      expect((await ask(sdk, purpose)).structuredContent).toMatchObject({ state: 'released' });
    } finally {
      failReceiptWrite = false;
      await sdk.close();
    }
  });

  it('enforces Host, Origin, local session and CSRF, and saves escaped note edits', async () => {
    const status = await new Promise<number | undefined>((resolve, reject) => {
      const req = request(origin, { headers: { Host: 'rebound.example' } }, res => {
        res.resume();
        resolve(res.statusCode);
      });
      req.on('error', reject);
      req.end();
    });
    expect(status).toBe(403);
    const cors = await fetch(`${origin}/mcp`, { method: 'OPTIONS', headers: { Origin: 'https://other.example' } });
    expect(cors.status).toBe(403);
    expect(cors.headers.has('access-control-allow-origin')).toBe(false);
    const otherOwner = await startDaemon(home, { idleMs: 120_000 }).then(
      async duplicate => { await duplicate.close(); return false; }, () => true);
    expect(otherOwner).toBe(true);

    const cookie = await browserSession();
    const entry = (await daemon.wallet.entries()).find(item => item.title === 'Tastes')!;
    const url = `${origin}/entries/${entry.id}`;
    expect(await (await fetch(url)).text()).toContain('Unlock your wallet');
    const preview = await fetch(url, { headers: { Cookie: cookie } });
    expect(preview.headers.get('content-security-policy')).toContain("frame-ancestors 'none'");
    expect(preview.headers.get('cache-control')).toBe('no-store');
    expect(preview.headers.get('referrer-policy')).toBe('strict-origin');
    const csrfToken = csrf(await preview.text());
    expect(csrfToken).not.toBe('');
    const edit = { action: 'edit', csrf: csrfToken, version: String(entry.version),
      title: 'Tea <script>', body: 'My tea is now peppermint. <script>ignored</script>', kind: 'preferences' };
    expect((await form(url, cookie, { ...edit, csrf: secret() })).status).toBe(403);
    expect((await form(url, cookie, edit, 'http://127.0.0.1:9999')).status).toBe(403);
    expect((await form(url, cookie, edit)).status).toBe(303);
    expect((await form(url, cookie, edit)).status).toBe(400);
    const changed = await daemon.wallet.entry(entry.id);
    expect(changed).toMatchObject({ version: 2, title: edit.title, body: edit.body });
    const changedPage = await (await fetch(url, { headers: { Cookie: cookie } })).text();
    expect(changedPage).toContain('&lt;script&gt;ignored&lt;/script&gt;');
    expect(changedPage).not.toContain('<script>');
    expect((await readFile(join(home, 'entries', changed.file))).includes('peppermint')).toBe(false);
    await callOwner(home, { action: 'lock' });
    expect((await form(url, cookie, { ...edit, version: '2' })).status).toBe(403);
    expect(await (await fetch(url, { headers: { Cookie: cookie } })).text()).toContain('Unlock your wallet');
    await callOwner(home, { action: 'unlock', passphrase });
    expect(await (await fetch(url, { headers: { Cookie: cookie } })).text()).toContain('Unlock your wallet');
  });
});
