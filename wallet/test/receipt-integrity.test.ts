import { createHmac } from 'node:crypto';
import { mkdtemp, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { expect, it } from 'vitest';
import { identityToRecipient, journalKey, seal } from '../src/crypto.js';
import { canonical, sha256, type Receipt } from '../src/domain.js';
import { prepareKit } from '../src/store.js';
import { Wallet } from '../src/wallet.js';

const passphrase = 'synthetic receipt test passphrase';
const fixture = fileURLToPath(new URL('fixtures/openclaw', import.meta.url));

async function walletForTest(run: (wallet: Wallet, home: string, identity: string) => Promise<void>) {
  const root = await mkdtemp(join(tmpdir(), 'bl-chain-'));
  const home = join(root, 'wallet');
  const kit = join(root, 'kit.txt');
  const setup = await prepareKit(home, kit);
  const contents = await readFile(kit, 'utf8');
  await setup.confirm(/Confirmation word: (\S+)/.exec(contents)![1]!, passphrase);
  const identity = /Recovery key: (\S+)/.exec(contents)![1]!;
  const wallet = new Wallet(home, 'http://127.0.0.1:8847', { idleMs: 60_000 });
  try {
    await run(wallet, home, identity);
  } finally {
    await wallet.lock();
    await rm(root, { recursive: true, force: true });
  }
}

it('detects an edited journal and a deleted final disclosure while running and after restart', async () => {
  await walletForTest(async (wallet, home) => {
    await wallet.unlock(passphrase);
    await wallet.importWorkspace(fixture, 'openclaw');
    const { code } = await wallet.pair('Receipt agent', 'local');
    const { credential } = await wallet.redeem(code);
    const ask = { purpose: 'Pick tea', kinds: ['preferences'] as const, question: 'Which tea?' };
    const request = { ...ask, kinds: [...ask.kinds] };
    const pending = await wallet.ask(credential, request);
    if (pending.state !== 'approval_required') throw new Error('Missing approval');
    await wallet.approve(pending.grant_request_id, 'always', false);
    await wallet.ask(credential, request);
    await wallet.ask(credential, { ...request, purpose: 'Compare tea' });
    expect(await wallet.verifyReceipts()).toMatchObject({ count: 2 });
    const journal = join(home, 'journal');
    const files = (await readdir(journal)).sort();
    const tail = join(journal, files.at(-1)!);
    const original = await readFile(tail);
    const edited = Buffer.from(original);
    edited[edited.length - 5] = edited[edited.length - 5]! ^ 1;
    await writeFile(tail, edited);
    await expect(wallet.verifyReceipts()).rejects.toThrow('Receipt verification failed');
    expect(await wallet.ownerStatus()).toEqual({ unlocked: false });
    await writeFile(tail, original);
    await wallet.unlock(passphrase);
    await rm(tail);
    await expect(wallet.verifyReceipts()).rejects.toThrow('Receipt verification failed');
    await expect(wallet.unlock(passphrase)).rejects.toThrow('history could not be verified');
    await writeFile(tail, original);
    // A status change can leave the receipt journal tail intact; a missing checkpoint must still fail.
    await rm(join(home, 'receipt-head.age'));
    await new Promise(resolve => setTimeout(resolve, 1_050));
    await expect(wallet.unlock(passphrase)).rejects.toThrow('history could not be verified');
  });
}, 15_000);

it('opens a Phase 2 ledger and exports its evidence without inventing consent timestamps', async () => {
  await walletForTest(async (wallet, home, identity) => {
    const body: Omit<Receipt, 'hash'> = {
      receipt_id: 'phase-2-id', time: '2026-11-24T10:00:00Z', agent: 'Legacy client', agent_id: 'agent-1',
      destination: 'provider:Example', destination_basis: 'declared', provider: 'Example', model: null,
      purpose: 'Select dinner', kinds: ['preferences'], grant_id: 'grant-1', grant_ids: ['grant-1'],
      content: 'I prefer apples.', content_digest: sha256('I prefer apples.'), entries: [{ id: 'entry-1', version: 1 }],
      prev_hash: null,
    };
    const receipt = { ...body, hash: sha256(canonical(body)) };
    const transaction = { sequence: 1, previous: null, change: { receipts: [receipt] } };
    const mac = createHmac('sha256', journalKey(identity)).update(canonical(transaction)).digest('hex');
    const legacy = await seal(await identityToRecipient(identity), JSON.stringify({ transaction, mac }));
    await writeFile(join(home, 'journal', '0000000000000001.jsonl.age'), legacy);
    await wallet.unlock(passphrase);
    expect(await wallet.verifyReceipts()).toEqual({ count: 1, head: receipt.hash });
    const exported = await wallet.exportReceipts('phase-2-id');
    expect(JSON.parse(JSON.stringify(exported)).receipts[0]).toMatchObject({
      receipt_id: 'phase-2-id', audience: { basis: 'declared' }, consent: { grant_ids: ['grant-1'] },
      evidence: { projection: { encoding: 'utf-8', byte_length: 16, digest: { hex: body.content_digest } } },
    });
    expect(JSON.stringify(exported)).not.toMatch(/decided_at|I prefer apples/);
  });
}, 15_000);
