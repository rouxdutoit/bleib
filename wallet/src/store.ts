import { createHmac, randomUUID } from 'node:crypto';
import { link, mkdir, open, readFile, readdir, realpath, rename, rm, stat } from 'node:fs/promises';
import { basename, dirname, join, relative, isAbsolute, resolve } from 'node:path';
import { generateX25519Identity, identityToRecipient, journalKey, parseEnvelope, seal, unseal, unwrapIdentity, wrapIdentity } from './crypto.js';
import { canonical, equal, secret, sha256, UserError } from './domain.js';
import type { Agent, Approval, Entry, Grant, Pairing, Proposal, Receipt } from './domain.js';

export const missing = (error: unknown) => (error as NodeJS.ErrnoException).code === 'ENOENT';
const exists = (error: unknown) => (error as NodeJS.ErrnoException).code === 'EEXIST';
const walletFile = (home: string) => join(home, 'identity.json');

export async function syncDirectory(directory: string) {
  const handle = await open(directory, 'r');
  try {
    await handle.sync();
  } finally {
    await handle.close();
  }
}

async function writeNew(path: string, bytes: Uint8Array | string) {
  const handle = await open(path, 'wx', 0o600);
  try {
    await handle.writeFile(bytes);
    await handle.sync();
  } finally {
    await handle.close();
  }
}

async function publish(path: string, bytes: Uint8Array | string, replace = false, beforePublish?: () => void) {
  const temp = join(dirname(path), `.${basename(path)}.${randomUUID()}.tmp`);
  try {
    await writeNew(temp, bytes);
    beforePublish?.();
    if (replace) await rename(temp, path);
    else await link(temp, path);
    await syncDirectory(dirname(path));
  } finally {
    await rm(temp, { force: true }).catch(() => {});
  }
}

export async function initialized(home: string) {
  try {
    await stat(walletFile(home));
    return true;
  } catch (error) {
    if (missing(error)) return false;
    throw error;
  }
}

export async function prepareKit(home: string, kitPath: string) {
  if (await initialized(home)) throw new UserError('A wallet already exists here.');
  const kitDirectory = await realpath(dirname(kitPath));
  const kitTarget = join(kitDirectory, basename(kitPath));
  const separation = relative(resolve(home), kitTarget);
  if (separation !== '..' && !separation.startsWith('../') && !isAbsolute(separation)) {
    throw new UserError('Save the recovery kit outside the wallet directory.');
  }
  const identity = await generateX25519Identity();
  const word = `bleib-${secret(9)}`;
  try {
    await publish(kitTarget, [
      'bleib recovery kit', '',
      'Keep this file private. Anyone with the recovery key and your wallet files can read them.',
      'Save a separate copy of this kit and back up your encrypted wallet directory.',
      'To reset a forgotten passphrase, start bleib serve and run bleib recover <kit-file>.', '',
      `Recovery key: ${identity}`, `Confirmation word: ${word}`, '',
    ].join('\n'));
  } catch (error) {
    if (exists(error)) throw new UserError('The recovery kit path already exists. Choose another file.');
    throw error;
  }
  return {
    async confirm(response: string, passphrase: string) {
      if (!equal(word, response.trim())) throw new UserError('The confirmation word did not match. Wallet setup stopped.');
      const envelope = await wrapIdentity(identity, passphrase);
      await mkdir(home, { mode: 0o700, recursive: true });
      await requirePrivateHome(home);
      await syncDirectory(dirname(home));
      await mkdir(join(home, 'entries'), { mode: 0o700, recursive: true });
      await mkdir(join(home, 'journal'), { mode: 0o700, recursive: true });
      await publish(walletFile(home), JSON.stringify(envelope));
    },
  };
}

export async function verifyHome(home: string) {
  if (!await initialized(home)) throw new UserError('Create a wallet first with bleib init.');
  await requirePrivateHome(home);
}

async function requirePrivateHome(home: string) {
  const details = await stat(home);
  if (process.getuid && (details.uid !== process.getuid() || (details.mode & 0o077) !== 0)) {
    throw new UserError('The wallet directory must be owned by your account and accessible only to you.');
  }
}

export async function recover(home: string, identity: string, passphrase: string) {
  const previous = parseEnvelope(await readFile(walletFile(home), 'utf8'));
  if (!/^AGE-SECRET-KEY-1[A-Z0-9]{58}$/.test(identity) ||
      await identityToRecipient(identity).catch(() => '') !== previous.recipient) {
    throw new UserError('This recovery kit does not belong to the wallet.');
  }
  const envelope = await wrapIdentity(identity, passphrase);
  await publish(walletFile(home), JSON.stringify(envelope), true);
}

interface Change {
  agents?: Agent[];
  pairings?: Pairing[];
  entries?: Entry[];
  grants?: Grant[];
  approvals?: Approval[];
  proposals?: Proposal[];
  receipts?: Receipt[];
}
interface Transaction { sequence: number; previous: string | null; change: Change }
type BeforeCommit = (change: Readonly<Change>) => void;

export class Store {
  readonly agents = new Map<string, Agent>();
  readonly pairings = new Map<string, Pairing>();
  readonly entries = new Map<string, Entry>();
  readonly grants = new Map<string, Grant>();
  readonly approvals = new Map<string, Approval>();
  readonly proposals = new Map<string, Proposal>();
  readonly receipts = new Map<string, Receipt>();
  lastReceipt: string | null = null;
  #sequence = 0;
  #head: string | null = null;
  #journalKey: Buffer;

  private constructor(
    private readonly home: string,
    private identity: string,
    private readonly recipient: string,
    private readonly beforeCommit?: BeforeCommit,
  ) {
    this.#journalKey = journalKey(identity);
  }

  static async unlock(home: string, passphrase: string, beforeCommit?: BeforeCommit) {
    const envelope = parseEnvelope(await readFile(walletFile(home), 'utf8'));
    const identity = await unwrapIdentity(envelope, passphrase);
    const store = new Store(home, identity, envelope.recipient, beforeCommit);
    try {
      await store.replay();
      return store;
    } catch {
      store.close();
      throw new UserError('The wallet history could not be verified.');
    }
  }

  close() {
    this.identity = '';
    this.#journalKey.fill(0);
  }

  private mac(transaction: Transaction) {
    return createHmac('sha256', this.#journalKey).update(canonical(transaction)).digest('hex');
  }

  private async replay() {
    const dir = join(this.home, 'journal');
    const files = (await readdir(dir)).filter(name => !name.startsWith('.')).sort();
    for (const file of files) {
      if (file !== this.segment(this.#sequence + 1)) throw new Error('Journal gap');
      const raw = await unseal(this.identity, await readFile(join(dir, file)));
      const { transaction, mac } = JSON.parse(raw) as { transaction: Transaction; mac: string };
      if (transaction.sequence !== this.#sequence + 1 || transaction.previous !== this.#head ||
          !equal(this.mac(transaction), mac)) throw new Error('Journal authentication failed');
      this.apply(transaction, mac);
    }
  }

  private segment(sequence: number) {
    return `${String(sequence).padStart(16, '0')}.jsonl.age`;
  }

  private apply(transaction: Transaction, mac: string) {
    const { change } = transaction;
    for (const agent of change.agents ?? []) this.agents.set(agent.id, agent);
    for (const pairing of change.pairings ?? []) this.pairings.set(pairing.id, pairing);
    for (const entry of change.entries ?? []) this.entries.set(entry.id, entry);
    for (const grant of change.grants ?? []) this.grants.set(grant.id, grant);
    for (const approval of change.approvals ?? []) this.approvals.set(approval.id, approval);
    for (const proposal of change.proposals ?? []) this.proposals.set(proposal.id, proposal);
    for (const receipt of change.receipts ?? []) {
      const { hash, ...body } = receipt;
      if (body.prev_hash !== this.lastReceipt || sha256(canonical(body)) !== hash ||
          sha256(body.content) !== body.content_digest) throw new Error('Receipt chain verification failed');
      this.receipts.set(receipt.receipt_id, receipt);
      this.lastReceipt = hash;
    }
    this.#sequence = transaction.sequence;
    this.#head = mac;
  }

  async commit(change: Change) {
    const transaction = { sequence: this.#sequence + 1, previous: this.#head, change };
    const mac = this.mac(transaction);
    const ciphertext = await seal(this.recipient, JSON.stringify({ transaction, mac }) + '\n');
    await publish(join(this.home, 'journal', this.segment(transaction.sequence)), ciphertext, false,
      () => this.beforeCommit?.(change));
    this.apply(transaction, mac);
  }

  async putEntry(entry: Omit<Entry, 'file' | 'digest'>, markdown: string): Promise<Entry> {
    const file = `${entry.id}.${entry.version}.${randomUUID()}.md.age`;
    const ciphertext = await seal(this.recipient, markdown);
    await publish(join(this.home, 'entries', file), ciphertext);
    return { ...entry, file, digest: sha256(ciphertext) };
  }

  async readEntry(entry: Entry) {
    const ciphertext = await readFile(join(this.home, 'entries', entry.file));
    if (!equal(sha256(ciphertext), entry.digest)) throw new Error('Entry integrity check failed');
    return unseal(this.identity, ciphertext);
  }
}
