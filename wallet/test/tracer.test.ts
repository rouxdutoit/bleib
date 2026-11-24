import { mkdtemp, readFile, rm, stat } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';
import { expect, it } from 'vitest';
import { callOwner, startDaemon } from '../src/daemon.js';
import { sha256 } from '../src/domain.js';
import { prepareKit } from '../src/store.js';

const passphrase = 'synthetic correct horse battery staple';
const fixture = fileURLToPath(new URL('fixtures/openclaw', import.meta.url));

it('runs init → import → pair → SDK ask → browser consent → durable receipt', async () => {
  const root = await mkdtemp(join(tmpdir(), 'bleib-tracer-'));
  const home = join(root, 'wallet');
  const kit = join(root, 'kit.txt');
  let daemon: Awaited<ReturnType<typeof startDaemon>> | undefined;
  const client = new Client({ name: 'tracer-sdk', version: '1' });
  try {
    const setup = await prepareKit(home, kit);
    await expect(stat(home)).rejects.toMatchObject({ code: 'ENOENT' });
    await expect(setup.confirm('wrong', passphrase)).rejects.toThrow('confirmation word');
    await expect(stat(home)).rejects.toMatchObject({ code: 'ENOENT' });
    const word = /Confirmation word: (\S+)/.exec(await readFile(kit, 'utf8'))?.[1] ?? '';
    await setup.confirm(word, passphrase);
    daemon = await startDaemon(home, { idleMs: 120_000 });
    const { origin } = daemon;
    await callOwner(home, { action: 'unlock', passphrase });
    await expect(callOwner(home, { action: 'import', dialect: 'openclaw', path: fixture }))
      .resolves.toEqual({ imported: 3, skipped: 0 });
    const { code } = await callOwner(home, {
      action: 'pair', name: 'tracer agent', destination: 'provider:ExampleProvider', model: 'ExampleModel',
    }) as { code: string };
    const pairing = await fetch(`${origin}/pair`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ code }),
    });
    expect(pairing.status).toBe(200);
    const { credential } = await pairing.json() as { credential: string };
    await callOwner(home, { action: 'lock' });
    await client.connect(new StreamableHTTPClientTransport(new URL(`${origin}/mcp`), {
      requestInit: { headers: { Authorization: `Bearer ${credential}` } },
    }));
    expect((await client.callTool({ name: 'bleib_status' })).structuredContent).toEqual({ state: 'locked' });

    const ask = () => client.callTool({
      name: 'bleib_context_request',
      arguments: { purpose: 'Choose tea', question: 'What tea is preferred?', kinds: ['preferences'] },
    });
    const firstPage = await fetch(origin);
    const cookie = firstPage.headers.get('set-cookie')!.split(';')[0]!;
    const unlockCsrf = /name="csrf" value="([^"]+)"/.exec(await firstPage.text())![1]!;
    const unlocked = await fetch(origin, {
      method: 'POST', redirect: 'manual',
      headers: { Cookie: cookie, Origin: origin, 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ action: 'unlock', csrf: unlockCsrf, passphrase }),
    });
    expect(unlocked.status).toBe(303);
    const owner = unlocked.headers.get('set-cookie')!.split(';')[0]!;
    expect((await client.callTool({ name: 'bleib_status' })).structuredContent)
      .toMatchObject({ state: 'ready', agent: 'tracer agent', destination: 'provider:ExampleProvider' });
    const pending = (await ask()).structuredContent as { state: string; approve_url: string };
    expect(pending.state).toBe('approval_required');
    expect(JSON.stringify(pending)).not.toContain('jasmine');
    const preview = await (await fetch(pending.approve_url, { headers: { Cookie: owner } })).text();
    expect(preview).toContain('My preferred tea is jasmine.');
    expect(preview).not.toContain('I plan trips');
    const csrf = /name="csrf" value="([^"]+)"/.exec(preview)![1]!;
    const approved = await fetch(pending.approve_url, {
      method: 'POST', redirect: 'manual',
      headers: { Cookie: owner, Origin: origin, 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ action: 'approve', csrf, choice: 'once' }),
    });
    expect(approved.status).toBe(303);

    const answer = await ask();
    expect(answer.content).toEqual([{ type: 'text', text: 'My preferred tea is jasmine.' }]);
    expect(answer.structuredContent).toMatchObject({ state: 'released' });
    const id = (answer.structuredContent as { receipt_id: string }).receipt_id;
    const [receipt] = await callOwner(home, { action: 'receipts', id }) as unknown[];
    expect(receipt).toMatchObject({
      receipt_id: id, agent: 'tracer agent', destination: 'provider:ExampleProvider',
      destination_basis: 'declared', provider: 'ExampleProvider', model: 'ExampleModel',
      content: 'My preferred tea is jasmine.', content_digest: sha256('My preferred tea is jasmine.'),
      purpose: 'Choose tea', kinds: ['preferences'], prev_hash: null,
    });
    expect((await ask()).structuredContent).toMatchObject({ state: 'approval_required' });
    await callOwner(home, { action: 'lock' });
    await callOwner(home, { action: 'unlock', passphrase });
    await expect(callOwner(home, { action: 'receipts', id })).resolves.toEqual([receipt]);
  } finally {
    await client.close();
    await daemon?.close();
    await rm(root, { recursive: true, force: true });
  }
}, 20_000);
