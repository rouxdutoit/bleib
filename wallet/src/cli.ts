#!/usr/bin/env node
import { spawn } from 'node:child_process';
import { readFile, realpath } from 'node:fs/promises';
import { homedir } from 'node:os';
import { join, resolve } from 'node:path';
import { createInterface } from 'node:readline/promises';
import { Writable } from 'node:stream';
import { parseArgs } from 'node:util';
import { callOwner, redeemCode, startDaemon, walletOrigin } from './daemon.js';
import { credentialPattern, UserError, type ProxyProtocol, type Receipt } from './domain.js';
import { proxyRoutes } from './proxy.js';
import { serveStdio } from './mcp.js';
import { clientName, setupSnippet } from './setup.js';
import { prepareKit } from './store.js';

const help = `bleib — a local wallet for what you share with your AI

Usage: bleib [--home <directory>] <command>

  init [--recovery-kit <file>]            Set up a wallet and save a recovery kit
  serve [--idle-minutes <minutes>]       Run the wallet locally (default 15 minutes)
  unlock                                Unlock with a passphrase
  lock                                  Lock now
  recover <kit-file>                    Set a new passphrase from your recovery kit
  import openclaw|hermes <workspace>      Import workspace notes
  pair <agent> --destination <place> [--model <name>] [--via-proxy openai|anthropic]
                                        Create a one-time pairing code
  connect                               Redeem a pairing code for an agent credential
  setup <client> [--paired]             Print a client config. Enter a credential with --paired
  ui                                    Open the local wallet page
  revoke <agent-or-permission-id>        Revoke access
  summary                               See what your AI saw this week
  receipts [receipt-id]                 List receipts or open one
  verify-receipts                       Verify the receipt chain on disk
  export-receipts [receipt-id]          Export disclosure records as JSON
  mcp                                   Start the paired stdio connection

Places: local, provider:<name>, third-party:<name>
`;

async function prompt<T>(action: (ask: (label: string) => Promise<string>) => Promise<T>) {
  const sink = new Writable({ write(_chunk, _encoding, callback) { callback(); } });
  const interactive = Boolean(process.stdin.isTTY);
  const reader = createInterface({ input: process.stdin, output: sink, terminal: interactive });
  const lines = reader[Symbol.asyncIterator]();
  try {
    return await action(async label => {
      process.stderr.write(label);
      const result = interactive ? { value: await reader.question(''), done: false } : await lines.next();
      process.stderr.write('\n');
      if (result.done) throw new UserError('Input ended before setup was complete.');
      return result.value;
    });
  } finally {
    reader.close();
  }
}

async function newPassphrase(ask: (label: string) => Promise<string>) {
  const passphrase = await ask('Choose a passphrase (at least 12 characters): ');
  if (passphrase !== await ask('Repeat your passphrase: ')) throw new UserError('The passphrases did not match.');
  return passphrase;
}

function settings(home: string, origin: string, credential: string, proxy?: ProxyProtocol) {
  return {
    stdio: { type: 'stdio', command: 'bleib', args: ['mcp'], env: { BLEIB_HOME: home, BLEIB_AGENT_TOKEN: credential } },
    ...(proxy ? { modelProxy: { protocol: proxy, baseUrl: `${origin}/v1`, apiKey: credential } } : {}),
    http: { type: 'http', url: `${origin}/mcp`, headers: { Authorization: `Bearer ${credential}` } },
  };
}

function openBrowser(url: string) {
  const command = process.platform === 'darwin' ? 'open' : 'xdg-open';
  const child = spawn(command, [url], { stdio: 'ignore', detached: true });
  child.on('error', () => {});
  child.unref();
}

async function main(argv: string[]) {
  const { values, positionals } = parseArgs({
    args: argv, allowPositionals: true, options: {
      home: { type: 'string' }, 'recovery-kit': { type: 'string' }, 'idle-minutes': { type: 'string' },
      destination: { type: 'string' }, 'via-proxy': { type: 'string' }, paired: { type: 'boolean' }, model: { type: 'string' }, help: { type: 'boolean', short: 'h' },
    },
  });
  const [command, first, second] = positionals;
  if (values.help || !command) return console.log(help);
  const directory = resolve(values.home ?? process.env.BLEIB_HOME ?? join(homedir(), '.bleib'));
  const home = await realpath(directory).catch(() => directory);
  switch (command) {
    case 'init': {
      const kit = resolve(values['recovery-kit'] ?? join(homedir(), `bleib-recovery-${Date.now()}.txt`));
      const setup = await prepareKit(home, kit);
      console.log(`Recovery kit saved to ${kit}. Save a separate copy now.`);
      await prompt(async ask => {
        const word = await ask('Type the confirmation word from the kit: ');
        await setup.confirm(word, await newPassphrase(ask));
      });
      console.log('Wallet created. Start bleib serve, then run bleib unlock.');
      break;
    }
    case 'serve': {
      const idle = Number(values['idle-minutes'] ?? '15');
      if (!Number.isFinite(idle) || idle <= 0 || idle > 1440) throw new UserError('Set an idle time above zero and at most 1,440 minutes.');
      const daemon = await startDaemon(home, { idleMs: Math.max(1, Math.round(idle * 60_000)), routes: proxyRoutes(process.env) });
      console.log(`Wallet available at ${daemon.origin} · locked`);
      const stop = () => { void daemon.close().then(() => { process.exitCode = 0; }); };
      process.once('SIGINT', stop);
      process.once('SIGTERM', stop);
      break;
    }
    case 'unlock':
      await prompt(async ask => { await callOwner(home, { action: 'unlock', passphrase: await ask('Passphrase: ') }); });
      console.log('Wallet unlocked.');
      break;
    case 'lock':
      await callOwner(home, { action: 'lock' });
      console.log('Wallet locked.');
      break;
    case 'recover': {
      if (!first) throw new UserError('Usage: bleib recover <kit-file>');
      const file = await readFile(resolve(first), 'utf8').catch(() => { throw new UserError('That recovery kit could not be opened.'); });
      const identity = /^Recovery key: (AGE-SECRET-KEY-1[A-Z0-9]{58})\r?$/m.exec(file)?.[1];
      if (!identity) throw new UserError('That file does not contain a bleib recovery key.');
      await prompt(async ask => { await callOwner(home, { action: 'recover', identity, passphrase: await newPassphrase(ask) }); });
      console.log('Passphrase reset. Run bleib unlock to open the wallet.');
      break;
    }
    case 'import': {
      if ((first !== 'openclaw' && first !== 'hermes') || !second) throw new UserError('Usage: bleib import openclaw|hermes <workspace>');
      const report = await callOwner(home, { action: 'import', dialect: first, path: resolve(second) }) as { imported: number; skipped: number };
      console.log(`Imported ${report.imported} notes. ${report.skipped} already in the wallet.`);
      break;
    }
    case 'pair': {
      if (!first || !values.destination) throw new UserError('Usage: bleib pair <agent> --destination <place> [--model <name>] [--via-proxy openai|anthropic]');
      const proxy = values['via-proxy'];
      if (proxy !== undefined && proxy !== 'openai' && proxy !== 'anthropic') throw new UserError('Choose openai or anthropic for the proxy.');
      const result = await callOwner(home, {
        action: 'pair', name: first, destination: values.destination, model: values.model, proxy,
      }) as { code: string; expiresInMinutes: number };
      console.log(`Pairing code (one use, ${result.expiresInMinutes} minutes): ${result.code}\nRun bleib connect with the same wallet home to redeem it.`);
      console.log(JSON.stringify(settings(home, walletOrigin(home), '<credential from bleib connect>', proxy), null, 2));
      break;
    }
    case 'connect': {
      const result = await prompt(async ask => redeemCode(home, (await ask('Pairing code: ')).trim()));
      console.log(JSON.stringify(settings(home, result.origin, result.credential, result.proxy), null, 2));
      break;
    }
    case 'setup': {
      const client = clientName(first);
      const credential = values.paired ? await prompt(ask => ask('Agent credential: ')) : '<credential from bleib connect>';
      if (values.paired && !credentialPattern.test(credential)) throw new UserError('Enter the credential from bleib connect.');
      const { location, snippet } = setupSnippet(
        client, home, walletOrigin(home), credential, process.execPath, await realpath(process.argv[1]!),
      );
      process.stderr.write(`Merge the bleib entry into ${location}. Keep your other entries and store the credential privately.\n`);
      console.log(snippet);
      break;
    }
    case 'ui': {
      const origin = walletOrigin(home);
      const path = await callOwner(home, { action: 'ui' }) as string;
      console.log(origin);
      openBrowser(new URL(path, origin).href);
      break;
    }
    case 'mcp':
      await serveStdio(walletOrigin(home), process.env.BLEIB_AGENT_TOKEN ?? '');
      break;
    case 'revoke':
      if (!first) throw new UserError('Usage: bleib revoke <agent-or-permission-id>');
      await callOwner(home, { action: 'revoke', target: first });
      console.log('Access revoked.');
      break;
    case 'summary': {
      const result = await callOwner(home, { action: 'summary' }) as { summary: string; health: string };
      console.log(`${result.summary} ${result.health}`);
      break;
    }
    case 'verify-receipts': {
      const report = await callOwner(home, { action: 'verify-receipts' }) as { count: number; head: string | null };
      console.log(`Verified ${report.count} ${report.count === 1 ? 'receipt' : 'receipts'}.`);
      if (report.head) console.log(`Latest receipt fingerprint ${report.head}`);
      break;
    }
    case 'export-receipts':
      console.log(JSON.stringify(await callOwner(home, { action: 'export-receipts', id: first }), null, 2));
      break;
    case 'receipts': {
      const receipts = await callOwner(home, { action: 'receipts', id: first }) as Receipt[];
      if (first) console.log(JSON.stringify(receipts[0], null, 2));
      else if (!receipts.length) console.log('No receipts yet.');
      else for (const receipt of receipts) console.log([receipt.receipt_id, receipt.time, JSON.stringify(receipt.agent),
        JSON.stringify(receipt.purpose), JSON.stringify(receipt.destination)].join('\t'));
      break;
    }
    default: throw new UserError('Unknown command. Run bleib --help for the command list.');
  }
}

try {
  await main(process.argv.slice(2));
} catch (error) {
  process.stderr.write(`${error instanceof UserError ? error.message : 'bleib could not complete that command. Check the command with bleib --help.'}\n`);
  process.exitCode = 1;
}
