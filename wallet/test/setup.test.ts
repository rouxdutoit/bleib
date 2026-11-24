import { spawn } from 'node:child_process';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';
import { afterAll, beforeAll, expect, it } from 'vitest';
import { parse as parseYaml } from 'yaml';
import { startDaemon } from '../src/daemon.js';
import type { ToolReply } from '../src/domain.js';
import { clients } from '../src/setup.js';
import { prepareKit } from '../src/store.js';

const bin = fileURLToPath(new URL('../dist/cli.js', import.meta.url));
const fixture = fileURLToPath(new URL('fixtures/openclaw', import.meta.url));
const passphrase = 'synthetic setup test passphrase';
let root: string;
let home: string;
let daemon: Awaited<ReturnType<typeof startDaemon>>;

beforeAll(async () => {
  root = await mkdtemp(join(tmpdir(), 'bl-setup-'));
  home = join(root, 'notes');
  const kit = join(root, 'kit.txt');
  const setup = await prepareKit(home, kit);
  await setup.confirm(/Confirmation word: (\S+)/.exec(await readFile(kit, 'utf8'))![1]!, passphrase);
  daemon = await startDaemon(home, { idleMs: 120_000, now: () => Date.parse('2026-11-24T12:00:00Z') });
  await daemon.wallet.unlock(passphrase);
  await daemon.wallet.importWorkspace(fixture, 'openclaw');
  await writeFile(join(root, '.claude.json'), '{"existing":"keep"}');
}, 20_000);

afterAll(async () => {
  await daemon?.close();
  if (root) await rm(root, { recursive: true, force: true });
});

function cli(args: string[], input = '') {
  const child = spawn(process.execPath, [bin, '--home', home, ...args], {
    env: { ...process.env, HOME: root }, stdio: ['pipe', 'pipe', 'pipe'],
  });
  let output = '';
  child.stdout.setEncoding('utf8').on('data', chunk => { output += chunk; });
  child.stderr.resume();
  const done = new Promise<string>((resolve, reject) => {
    child.once('error', reject);
    child.once('close', code => code === 0 ? resolve(output) : reject(new Error(`CLI exited with ${code}`)));
  });
  child.stdin.end(input);
  return done;
}

type Stdio = { command: string; args: string[]; env: Record<string, string> };

it.each(clients)('prints usable %s config and connects from the generated entry', async name => {
  const { code } = await daemon.wallet.pair(name, 'local');
  const { credential } = await daemon.wallet.redeem(code);
  const output = await cli(['setup', name, '--paired'], credential + '\n');
  const config = name === 'hermes' ? parseYaml(output) : JSON.parse(output);
  const sdk = new Client({ name, version: 'test' });
  if (name === 'openclaw') {
    const entry = config.mcp.servers.bleib as { url: string; headers: Record<string, string> };
    await sdk.connect(new StreamableHTTPClientTransport(new URL(entry.url), { requestInit: { headers: entry.headers } }));
  } else {
    const entry = (name === 'hermes' ? config.mcp_servers.bleib : config.mcpServers.bleib) as Stdio;
    await sdk.connect(new StdioClientTransport({ ...entry, stderr: 'pipe' }));
  }
  try {
    expect((await sdk.callTool({ name: 'bleib_status' })).structuredContent).toMatchObject({ state: 'ready', agent: name });
    const ask = () => sdk.callTool({ name: 'bleib_context_request',
      arguments: { purpose: 'Pick tea', kinds: ['preferences'], question: 'Which tea?' } });
    const pending = (await ask()).structuredContent as ToolReply;
    if (pending.state !== 'approval_required') throw new Error('Missing approval');
    await daemon.wallet.approve(pending.grant_request_id, 'once', false);
    expect((await ask()).content).toEqual([{ type: 'text', text: 'My preferred tea is jasmine.' }]);
    expect(await readFile(join(root, '.claude.json'), 'utf8')).toBe('{"existing":"keep"}');
  } finally {
    await sdk.close();
  }
}, 15_000);

it('verifies and exports receipts through the packaged CLI entry point', async () => {
  expect(await cli(['verify-receipts'])).toContain('Verified 5 receipts.');
  const raw = await cli(['export-receipts']);
  expect(raw).not.toContain('My preferred tea');
  const report = JSON.parse(raw);
  expect(report.chain.count).toBe(5);
  expect(report.receipts[0].resources[0].category).toBe('https://w3id.org/dpv/pd#Preference');
  expect(await cli(['summary'])).toContain('5 AIs saw 5 facts');
});
