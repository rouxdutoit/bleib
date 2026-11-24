import { chmod, lstat, realpath, rm } from 'node:fs/promises';
import { createServer, request, type IncomingMessage, type Server, type ServerResponse } from 'node:http';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { z } from 'zod';
import { credentialPattern, sha256, UserError } from './domain.js';
import { json, jsonBody, text } from './http.js';
import { handleBridge, McpHttp } from './mcp.js';
import { verifyHome } from './store.js';
import { Browser } from './ui.js';
import { Wallet } from './wallet.js';

const socketPath = (home: string) => join(home, 'owner.sock');

export function walletOrigin(home: string) {
  const port = home === join(homedir(), '.bleib') ? 8847 : 20000 + parseInt(sha256(home).slice(0, 8), 16) % 25000;
  return `http://127.0.0.1:${port}`;
}

const command = z.discriminatedUnion('action', [
  z.object({ action: z.literal('unlock'), passphrase: z.string().max(1024) }),
  z.object({ action: z.literal('lock') }),
  z.object({ action: z.literal('recover'), identity: z.string().max(100), passphrase: z.string().max(1024) }),
  z.object({ action: z.literal('import'), path: z.string().max(4096), dialect: z.enum(['openclaw', 'hermes']) }),
  z.object({ action: z.literal('pair'), name: z.string().max(100), destination: z.string().max(115), model: z.string().max(100).optional() }),
  z.object({ action: z.literal('revoke'), target: z.string().max(100) }),
  z.object({ action: z.literal('ui') }),
  z.object({ action: z.literal('receipts'), id: z.string().max(100).optional() }),
]);

type OwnerCommand = z.infer<typeof command>;
const redeemSchema = z.object({ code: z.string().regex(/^[A-Za-z0-9_-]{24}$/) }).strict();

async function runOwner(wallet: Wallet, browser: Browser, req: IncomingMessage, res: ServerResponse) {
  if (req.method !== 'POST' || req.url !== '/owner') return text(res, 404, 'Page not found.');
  const parsed = command.safeParse(await jsonBody(req));
  if (!parsed.success) throw new UserError('The wallet command was not understood.');
  const cmd = parsed.data;
  let value: unknown;
  switch (cmd.action) {
    case 'unlock': value = await wallet.unlock(cmd.passphrase); break;
    case 'lock': value = await wallet.lock(); break;
    case 'recover': value = await wallet.recover(cmd.identity, cmd.passphrase); break;
    case 'import': value = await wallet.importWorkspace(cmd.path, cmd.dialect); break;
    case 'pair': value = await wallet.pair(cmd.name, cmd.destination, cmd.model); break;
    case 'revoke': value = await wallet.revoke(cmd.target); break;
    case 'ui': value = await browser.openFromCli(); break;
    case 'receipts': value = await wallet.receipts(cmd.id); break;
  }
  json(res, 200, { value: value ?? null });
}

function handle(handler: (req: IncomingMessage, res: ServerResponse) => Promise<unknown>) {
  return (req: IncomingMessage, res: ServerResponse) => {
    void handler(req, res).catch((error: unknown) => {
      if (res.destroyed) return;
      if (res.headersSent) return res.end();
      if (error instanceof UserError) json(res, 400, { error: error.message });
      else json(res, 503, { error: 'The wallet could not complete that request.' });
    });
  };
}

function listen(server: Server, options: { host: string; port: number } | { path: string }) {
  return new Promise<void>((resolve, reject) => {
    server.once('error', reject);
    server.listen(options, () => {
      server.removeListener('error', reject);
      resolve();
    });
  });
}

function close(server: Server) {
  return new Promise<void>(resolve => {
    server.close(() => resolve());
    server.closeAllConnections();
  });
}

export async function startDaemon(directory: string, options: Omit<ConstructorParameters<typeof Wallet>[2], 'onLock'>) {
  await verifyHome(directory);
  const home = await realpath(directory);
  const origin = walletOrigin(home);
  const address = new URL(origin);
  const wallet = new Wallet(home, origin, { ...options, onLock: () => browser.clear() });
  const browser = new Browser(wallet, origin);
  const mcp = new McpHttp(wallet);
  let stopping = false;
  const ui = createServer({ requestTimeout: 15_000, headersTimeout: 10_000 }, handle(async (req, res) => {
    if (stopping) return text(res, 503, 'The wallet is stopping.');
    if (req.headers.host !== address.host || (req.headers.origin && req.headers.origin !== origin)) {
      return text(res, 403, 'This address is blocked.');
    }
    if (!req.url?.startsWith('/') || req.url.startsWith('//')) return text(res, 400, 'Invalid address.');
    const { pathname, origin: requestOrigin } = new URL(req.url, origin);
    if (requestOrigin !== origin) return text(res, 400, 'Invalid address.');
    if (pathname === '/stdio' && req.method === 'POST') return handleBridge(wallet, req, res);
    if (pathname === '/mcp') return mcp.handle(req, res);
    if (pathname === '/pair' && req.method === 'POST') {
      const parsed = redeemSchema.safeParse(await jsonBody(req));
      if (!parsed.success) throw new UserError('The pairing code is invalid.');
      return json(res, 200, await wallet.redeem(parsed.data.code));
    }
    return browser.handle(req, res, pathname);
  }));

  const owner = createServer({ requestTimeout: 15_000, headersTimeout: 10_000 },
    handle(async (req, res) => {
      if (stopping) return text(res, 503, 'The wallet is stopping.');
      return runOwner(wallet, browser, req, res);
    }));
  try {
    await listen(ui, { host: '127.0.0.1', port: Number(address.port) });
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'EADDRINUSE') {
      throw new UserError('The wallet daemon address is busy. Check whether bleib serve is already running.');
    }
    throw error;
  }
  try {
    // The per-home loopback listener is the writer lock. Only its holder may replace a stale socket.
    await rm(socketPath(home), { force: true });
    await listen(owner, { path: socketPath(home) });
    await chmod(socketPath(home), 0o600);
  } catch (error) {
    if (owner.listening) await close(owner);
    await close(ui);
    throw error;
  }
  return {
    origin,
    wallet,
    async close() {
      stopping = true;
      await close(owner);
      await mcp.close();
      await wallet.lock();
      await close(ui);
    },
  };
}

export async function callOwner(home: string, input: OwnerCommand): Promise<unknown> {
  await verifyHome(home);
  const socket = socketPath(home);
  const info = await lstat(socket).catch(() => undefined);
  if (!info?.isSocket() || (process.getuid && (info.uid !== process.getuid() || (info.mode & 0o077) !== 0))) {
    throw new UserError('Start bleib serve in another terminal, then try again.');
  }
  const packet = JSON.stringify(input);
  return new Promise((resolve, reject) => {
    const req = request({
      socketPath: socket, method: 'POST', path: '/owner',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(packet) },
    }, res => {
      const parts: Buffer[] = [];
      res.on('data', chunk => parts.push(chunk));
      res.on('error', () => reject(new UserError('The daemon connection ended.')));
      res.on('end', () => {
        try {
          const report = JSON.parse(Buffer.concat(parts).toString('utf8')) as { value?: unknown; error?: string };
          if (res.statusCode === 200) resolve(report.value);
          else reject(new UserError(report.error ?? 'The wallet command failed.'));
        } catch {
          reject(new UserError('The daemon response could not be read.'));
        }
      });
    });
    req.on('error', () => reject(new UserError('Start bleib serve in another terminal, then try again.')));
    req.end(packet);
  });
}

export async function redeemCode(home: string, code: string) {
  const origin = walletOrigin(await realpath(home));
  const res = await fetch(`${origin}/pair`, {
    method: 'POST', redirect: 'error',
    headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ code }),
  }).catch(() => { throw new UserError('Start bleib serve in another terminal, then try again.'); });
  const result = await res.json() as { credential?: string; error?: string };
  if (!res.ok || !result.credential || !credentialPattern.test(result.credential)) {
    throw new UserError(result.error ?? 'The pairing code could not be used.');
  }
  return { origin, credential: result.credential };
}
