import { constants } from 'node:fs';
import { lstat, mkdtemp, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { generateIdentity, identityToRecipient, seal, unseal, unwrapIdentity, wrapIdentity } from '../src/crypto.js';
import { secret, sha256, type Ask, type ToolReply } from '../src/domain.js';
import { splitMarkdown } from '../src/memory.js';
import { prepareKit, Store } from '../src/store.js';
import { Wallet } from '../src/wallet.js';

const passphrase = 'synthetic snow and stone 984';
const fixture = (name: string) => fileURLToPath(new URL(`fixtures/${name}`, import.meta.url));
const day = 24 * 60 * 60 * 1000;
const ask: Ask = { purpose: 'Choose tea', kinds: ['preferences'], question: 'Which tea?' };

async function fresh(options: Partial<ConstructorParameters<typeof Wallet>[2]> = {}) {
  const root = await mkdtemp(join(tmpdir(), 'bl-w-'));
  const home = join(root, 'wallet');
  const kit = join(root, 'kit.txt');
  const init = await prepareKit(home, kit);
  const recovery = await readFile(kit, 'utf8');
  await init.confirm(/Confirmation word: (\S+)/.exec(recovery)![1]!, passphrase);
  let now = Date.parse('2026-11-24T12:00:00Z');
  const wallet = new Wallet(home, 'http://127.0.0.1:8847', {
    now: () => now, idleMs: 20 * day, ...options,
  });
  await wallet.unlock(passphrase);
  return {
    home, kit, root, wallet, recovery,
    advance: (ms: number) => { now += ms; },
    close: async () => { await wallet.lock(); await rm(root, { recursive: true, force: true }); },
  };
}

async function paired(wallet: Wallet, name = 'Test agent', destination = 'provider:Example', model = 'Example 1') {
  const { code } = await wallet.pair(name, destination, model);
  return { code, ...await wallet.redeem(code) };
}

function pending(reply: ToolReply) {
  expect(reply.state).toBe('approval_required');
  if (reply.state !== 'approval_required') throw new Error('Expected approval request.');
  return reply.grant_request_id;
}

async function filesBelow(path: string): Promise<string[]> {
  const entries = await readdir(path, { withFileTypes: true });
  const files = await Promise.all(entries.map(entry => entry.isDirectory() ? filesBelow(join(path, entry.name))
    : entry.isFile() ? [join(path, entry.name)] : []));
  return files.flat();
}

describe('crypto and wallet storage', { timeout: 15_000 }, () => {
  it('round-trips an age file and a scrypt-wrapped identity, rejecting wrong keys and modified bytes', async () => {
    const identity = await generateIdentity();
    const envelope = await wrapIdentity(identity, passphrase);
    expect(await unwrapIdentity(envelope, passphrase)).toBe(identity);
    await expect(unwrapIdentity(envelope, 'synthetic wrong passphrase')).rejects.toThrow('could not unlock');
    const ciphertext = await seal(await identityToRecipient(identity), 'A private synthetic sentence.');
    expect(Buffer.from(ciphertext).toString('utf8')).toMatch(/^age-encryption.org\/v1\n/);
    expect(await unseal(identity, ciphertext)).toBe('A private synthetic sentence.');
    await expect(unseal(await generateIdentity(), ciphertext)).rejects.toThrow();
    ciphertext[ciphertext.length - 1]! ^= 1;
    await expect(unseal(identity, ciphertext)).rejects.toThrow();
  });

  it('gates setup, recovers the same data with the kit, and detects a corrupted journal', async () => {
    const x = await fresh();
    try {
      expect((await lstat(x.home)).mode & 0o777).toBe(0o700);
      expect((await lstat(x.kit)).mode & 0o777).toBe(0o600);
      await x.wallet.importWorkspace(fixture('openclaw'), 'openclaw');
      const kitIdentity = /Recovery key: (\S+)/.exec(x.recovery)![1]!;
      const newPassphrase = 'fresh synthetic sesame phrase';
      await expect(x.wallet.recover(await generateIdentity(), newPassphrase)).rejects.toThrow('does not belong');
      await x.wallet.recover(kitIdentity, newPassphrase);
      await expect(x.wallet.entries()).rejects.toThrow('Unlock');
      await x.wallet.unlock(newPassphrase);
      expect(await x.wallet.entries()).toHaveLength(3);
      await x.wallet.lock();
      const [first] = await readdir(join(x.home, 'journal'));
      const file = join(x.home, 'journal', first!);
      const original = await readFile(file);
      original[original.length - 1]! ^= 1;
      await writeFile(file, original);
      await expect(x.wallet.unlock(newPassphrase)).rejects.toThrow('history could not be verified');
    } finally {
      await x.close();
    }
  });

  it('imports OpenClaw and native Hermes as encrypted Markdown and scans all wallet files after use', async () => {
    const x = await fresh();
    try {
      expect(await x.wallet.importWorkspace(fixture('openclaw'), 'openclaw')).toEqual({ imported: 3, skipped: 0 });
      expect(await x.wallet.importWorkspace(fixture('openclaw'), 'openclaw')).toEqual({ imported: 0, skipped: 3 });
      expect(await x.wallet.importWorkspace(fixture('hermes'), 'hermes')).toEqual({ imported: 2, skipped: 0 });
      const { credential, code } = await paired(x.wallet, 'AGENT-MARKER');
      const id = pending(await x.wallet.ask(credential, ask));
      await x.wallet.approve(id, 'once', false);
      expect((await x.wallet.ask(credential, ask)).state).toBe('released');
      await x.wallet.propose(credential, { kind: 'preferences', content: 'SUGGESTION-CLOVE', reason: 'sample' });
      const [entry] = (await x.wallet.entries()).filter(entry => entry.title === 'Work notes');
      const store = await Store.unlock(x.home, passphrase);
      try {
        const markdown = await store.readEntry(entry!);
        expect(splitMarkdown(markdown)).toMatchObject({
          body: '# Work\nThe release is named Cedar.\n',
          metadata: { x_category: 'work', sensitivity: 'normal', valid_until: '2027-01-01',
            source: { basis: 'observed', origin: 'import' } },
        });
      } finally {
        store.close();
      }
      const files = await filesBelow(x.home);
      expect(files.filter(file => file.endsWith('.md.age'))).toHaveLength(5);
      const secrets = [passphrase, 'The release is named Cedar', 'MEMORY-PAPAYA-618', 'jasmine',
        'AGENT-MARKER', 'SUGGESTION-CLOVE', credential, code, 'AGE-SECRET-KEY-1'];
      for (const file of files) {
        expect((await lstat(file)).mode & 0o777).toBe(0o600);
        const bytes = await readFile(file);
        for (const secret of secrets) expect(bytes.includes(secret)).toBe(false);
      }
    } finally {
      await x.close();
    }
  });

  it('keeps invalid or expired notes readable by the owner and excludes them from sharing', async () => {
    const { mkdir } = await import('node:fs/promises');
    const x = await fresh();
    try {
      const workspace = join(x.root, 'dated');
      await mkdir(workspace);
      await writeFile(join(workspace, 'USER.md'),
        '---\ncategory: preferences\nvalid_until: indefinite\n---\nBergamot tea.\n');
      await writeFile(join(workspace, 'MEMORY.md'),
        '---\ncategory: preferences\nvalid_until: 2026-11-23\n---\nCeylon tea.\n');
      await x.wallet.importWorkspace(workspace, 'openclaw');
      expect(await x.wallet.entries()).toHaveLength(2);
      const { credential } = await paired(x.wallet);
      const id = pending(await x.wallet.ask(credential, ask));
      expect((await x.wallet.approvals()).find(item => item.id === id)?.content).toBe('');
      await x.wallet.approve(id, 'once', false);
      expect(await x.wallet.ask(credential, ask)).toEqual({ state: 'no_match' });
      expect(await x.wallet.receipts()).toEqual([]);
    } finally {
      await x.close();
    }
  });

  it('excludes symlinked daily files and memory folders from import', async () => {
    const { mkdir, symlink } = await import('node:fs/promises');
    const x = await fresh();
    try {
      const workspace = join(x.root, 'source');
      await mkdir(join(workspace, 'memory'), { recursive: true });
      await writeFile(join(workspace, 'USER.md'), 'Normal source note.');
      const target = join(x.root, 'outside.md');
      await writeFile(target, 'Outside source note.');
      await symlink(target, join(workspace, 'memory', '2026-11-24.md'));
      await symlink(fixture('hermes') + '/memories', join(workspace, 'memories'));
      expect(await x.wallet.importWorkspace(workspace, 'hermes')).toEqual({ imported: 1, skipped: 0 });
      expect((await x.wallet.entries()).map(entry => entry.title)).toEqual(['USER.md']);
      expect(constants.O_NOFOLLOW).toBeGreaterThan(0);
    } finally {
      await x.close();
    }
  });
});

describe('pairing and consent', { timeout: 15_000 }, () => {
  it('expires codes at ten minutes, consumes one exactly once, and rejects other credentials', async () => {
    const x = await fresh();
    try {
      const expired = await x.wallet.pair('Expired', 'local');
      x.advance(10 * 60 * 1000);
      await expect(x.wallet.redeem(expired.code)).rejects.toThrow('expired');
      const active = await x.wallet.pair('Agent', 'third-party:Vendor', 'Exact model');
      const contenders = await Promise.allSettled([x.wallet.redeem(active.code), x.wallet.redeem(active.code)]);
      expect(contenders.map(result => result.status)).toEqual(['fulfilled', 'rejected']);
      const winner = contenders[0];
      if (winner?.status !== 'fulfilled') throw new Error('Pairing winner missing.');
      const { credential } = winner.value;
      expect(await x.wallet.status(credential)).toMatchObject({ state: 'ready', agent: 'Agent', destination: 'third-party:Vendor' });
      await expect(x.wallet.status(secret())).resolves.toEqual({ state: 'denied' });
      await expect(x.wallet.status('Agent')).resolves.toEqual({ state: 'denied' });
    } finally {
      await x.close();
    }
  });

  it('matches remembered grants by agent, information kind and destination across purposes', async () => {
    const x = await fresh();
    try {
      await x.wallet.importWorkspace(fixture('openclaw'), 'openclaw');
      const a = await paired(x.wallet, 'Same display name', 'local');
      const b = await paired(x.wallet, 'Same display name', 'third-party:Cloud');
      const c = await paired(x.wallet, 'Another agent', 'local');
      await x.wallet.approve(pending(await x.wallet.ask(a.credential, ask)), 'always', false);
      expect((await x.wallet.ask(a.credential, { ...ask, purpose: ' CHOOSE   tea ' })).state).toBe('released');
      expect((await x.wallet.ask(a.credential, { ...ask, question: 'What is preferred?' })).state).toBe('released');
      for (const token of [b.credential, c.credential]) {
        pending(await x.wallet.ask(token, ask));
      }
      expect((await x.wallet.ask(a.credential, { ...ask, purpose: 'Write an ad' })).state).toBe('released');
      pending(await x.wallet.ask(a.credential, { ...ask, kinds: ['identity'] }));
      expect((await x.wallet.receipts()).map(receipt => receipt.destination)).toEqual(['local', 'local', 'local']);
      expect((await x.wallet.receipts())[0]?.purpose).toBe('Write an ad');
    } finally {
      await x.close();
    }
  });

  it('requires extra confirmation for sensitive always and supports one exact release under contention', async () => {
    const x = await fresh();
    try {
      await x.wallet.importWorkspace(fixture('openclaw'), 'openclaw');
      const { credential } = await paired(x.wallet);
      const sensitive: Ask = { purpose: 'Find a visit date', kinds: ['private'], question: 'When is the dentist visit?' };
      const id = pending(await x.wallet.ask(credential, sensitive));
      expect((await x.wallet.approvals()).find(item => item.id === id)?.sensitiveKinds).toEqual(['private']);
      await expect(x.wallet.approve(id, 'always', false)).rejects.toThrow('Confirm ongoing access');
      await x.wallet.approve(id, 'once', false);
      const results = await Promise.all([x.wallet.ask(credential, sensitive), x.wallet.ask(credential, sensitive)]);
      expect(results.map(result => result.state)).toEqual(['released', 'approval_required']);
      await x.wallet.approve(pending(results[1]!), 'always', true);
      expect((await x.wallet.ask(credential, sensitive)).state).toBe('released');
      const receipts = await x.wallet.receipts();
      expect(receipts).toHaveLength(2);
      expect(receipts[0]!.prev_hash).toBe(receipts[1]!.hash);
      expect(receipts[0]!.content_digest).toBe(sha256('My dentist visit moved to Friday.'));
    } finally {
      await x.close();
    }
  });

  it('does not expose whether an unapproved question matched, and remembers a denial', async () => {
    const x = await fresh();
    try {
      await x.wallet.importWorkspace(fixture('openclaw'), 'openclaw');
      const { credential } = await paired(x.wallet);
      const request = { ...ask, question: 'Amethyst?' };
      const pendingId = pending(await x.wallet.ask(credential, request));
      expect((await x.wallet.approvals()).find(item => item.id === pendingId)?.content).toBe('');
      await x.wallet.approve(pendingId, 'no', false);
      expect(await x.wallet.ask(credential, ask)).toEqual({ state: 'denied' });
      expect(await x.wallet.receipts()).toEqual([]);
      await x.wallet.revoke((await x.wallet.grants()).grants[0]!.id);
      pending(await x.wallet.ask(credential, ask));
    } finally {
      await x.close();
    }
  });

  it('expires unused always decisions at 90 days and refreshes expiry on release', async () => {
    const x = await fresh();
    try {
      await x.wallet.importWorkspace(fixture('openclaw'), 'openclaw');
      const { credential } = await paired(x.wallet);
      const used = ask;
      const neverUsed = { ...ask, purpose: 'An unused purpose' };
      await x.wallet.approve(pending(await x.wallet.ask(credential, used)), 'always', false);
      const unusedAgent = await paired(x.wallet, 'Unused grant');
      await x.wallet.approve(pending(await x.wallet.ask(unusedAgent.credential, neverUsed)), 'always', false);
      x.advance(89 * day);
      await x.wallet.unlock(passphrase);
      expect((await x.wallet.ask(credential, used)).state).toBe('released');
      x.advance(day);
      pending(await x.wallet.ask(unusedAgent.credential, neverUsed));
      expect((await x.wallet.ask(credential, used)).state).toBe('released');
    } finally {
      await x.close();
    }
  });

  it('revokes a grant and an agent on their next request', async () => {
    const x = await fresh();
    try {
      await x.wallet.importWorkspace(fixture('openclaw'), 'openclaw');
      const { credential } = await paired(x.wallet, 'Revoke me');
      await x.wallet.approve(pending(await x.wallet.ask(credential, ask)), 'always', false);
      expect((await x.wallet.ask(credential, ask)).state).toBe('released');
      await x.wallet.revoke((await x.wallet.grants()).grants[0]!.id);
      const next = pending(await x.wallet.ask(credential, ask));
      await x.wallet.revoke('Revoke me');
      await expect(x.wallet.approve(next, 'once', false)).rejects.toThrow('no longer active');
      expect(await x.wallet.ask(credential, ask)).toEqual({ state: 'denied' });
    } finally {
      await x.close();
    }
  });

  it('invalidates stale previews and does not use a normal grant to release a sensitive revision', async () => {
    const x = await fresh();
    try {
      await x.wallet.importWorkspace(fixture('openclaw'), 'openclaw');
      const { credential } = await paired(x.wallet);
      const stale = pending(await x.wallet.ask(credential, ask));
      const item = (await x.wallet.entries()).find(entry => entry.kind === 'preferences')!;
      await x.wallet.edit(item.id, item.version, {
        title: item.title, body: 'Tea is peppermint.', kind: item.kind, sensitive: false,
      });
      await expect(x.wallet.approve(stale, 'once', false)).rejects.toThrow('notes changed');
      await x.wallet.approve(pending(await x.wallet.ask(credential, ask)), 'always', false);
      expect((await x.wallet.ask(credential, ask)).state).toBe('released');
      await x.wallet.edit(item.id, item.version + 1, {
        title: item.title, body: 'Sensitive tea note.', kind: item.kind, sensitive: true,
      });
      const id = pending(await x.wallet.ask(credential, ask));
      await expect(x.wallet.approve(id, 'always', false)).rejects.toThrow('Confirm ongoing access');
    } finally {
      await x.close();
    }
  });

  it('auto-locks on owner inactivity and proposals never change read access', async () => {
    const x = await fresh({ idleMs: 1_000 });
    try {
      const { credential } = await paired(x.wallet);
      const result = await x.wallet.propose(credential, { kind: 'preferences', content: 'Suggested tea', reason: 'Synthetic' });
      expect(result.state).toBe('proposal_pending');
      expect((await x.wallet.proposals())[0]?.content).toBe('Suggested tea');
      expect(await x.wallet.entries()).toEqual([]);
      pending(await x.wallet.ask(credential, ask));
      x.advance(1000);
      expect(await x.wallet.status(credential)).toEqual({ state: 'locked' });
      expect(await x.wallet.propose(credential, { kind: 'preferences', content: 'Tea', reason: 'Test' })).toEqual({ state: 'locked' });
    } finally {
      await x.close();
    }
  });

  it('withholds a release when publication crashes and recovers the once grant on the next key load', async () => {
    let fail = true;
    const x = await fresh({
      beforeCommit(change) {
        if (fail && change.receipts?.length) throw new Error('simulated storage crash before publish');
      },
    });
    try {
      await x.wallet.importWorkspace(fixture('openclaw'), 'openclaw');
      const { credential } = await paired(x.wallet);
      await x.wallet.approve(pending(await x.wallet.ask(credential, ask)), 'once', false);
      const previous = await readdir(join(x.home, 'journal'));
      await expect(x.wallet.ask(credential, ask)).rejects.toThrow('simulated storage crash');
      expect(await x.wallet.status(credential)).toEqual({ state: 'locked' });
      expect(await readdir(join(x.home, 'journal'))).toEqual(previous);
      fail = false;
      await x.wallet.unlock(passphrase);
      expect(await x.wallet.receipts()).toEqual([]);
      const answer = await x.wallet.ask(credential, ask);
      expect(answer).toMatchObject({ state: 'released', content: 'My preferred tea is jasmine.' });
      expect((await x.wallet.receipts())[0]).toMatchObject({ content: 'My preferred tea is jasmine.' });
      pending(await x.wallet.ask(credential, ask));
    } finally {
      await x.close();
    }
  });
});
