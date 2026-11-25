import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { once } from 'node:events';
import { createConnection, createServer } from 'node:net';
import { chromium, firefox } from 'playwright';

async function localPort() {
  const server = createServer().listen(0, '127.0.0.1');
  await once(server, 'listening');
  const { port } = server.address();
  await new Promise(resolve => server.close(resolve));
  return port;
}

async function* packets(socket) {
  let pending = Buffer.alloc(0);
  for await (const chunk of socket) {
    pending = Buffer.concat([pending, chunk]);
    for (let colon = pending.indexOf(58); colon !== -1; colon = pending.indexOf(58)) {
      const end = colon + Number(pending.subarray(0, colon).toString()) + 1;
      if (pending.length < end) break;
      yield JSON.parse(pending.subarray(colon + 1, end).toString());
      pending = pending.subarray(end);
    }
  }
}

async function installFirefox(port, addonPath) {
  // Firefox's temporary install API is available through its loopback DevTools server.
  const socket = createConnection({ host: '127.0.0.1', port });
  socket.setTimeout(10_000, () => socket.destroy(new Error('Firefox temporary install timed out.')));
  const replies = packets(socket);
  async function request(body) {
    const packet = JSON.stringify(body);
    socket.write(`${Buffer.byteLength(packet)}:${packet}`);
    while (true) {
      const { value, done } = await replies.next();
      assert(!done, 'Firefox DevTools disconnected.');
      if (value.from !== body.to) continue;
      assert.equal(value.error, undefined, value.message);
      return value;
    }
  }
  try {
    assert.equal((await replies.next()).value.from, 'root');
    const root = await request({ to: 'root', type: 'getRoot' });
    const result = await request({ to: root.addonsActor, type: 'installTemporaryAddon', addonPath });
    assert.equal(result.addon.id, 'local-model-spike@bleib.dev');
    const { addons } = await request({ to: 'root', type: 'listAddons' });
    return new URL('page.html', addons.find(addon => addon.id === result.addon.id).manifestURL).href;
  } finally {
    socket.destroy();
  }
}

export async function launch(engine, profile, addon) {
  const opts = { headless: true, proxy: { server: 'http://127.0.0.1:1' } };
  if (engine === 'chromium') {
    const context = await chromium.launchPersistentContext(profile, {
      ...opts, channel: 'chromium',
      args: [`--disable-extensions-except=${addon}`, `--load-extension=${addon}`, '--disable-background-networking'],
    });
    const worker = context.serviceWorkers()[0] ?? await context.waitForEvent('serviceworker');
    return { context, url: new URL('page.html', worker.url()).href };
  }
  const port = await localPort();
  const context = await firefox.launchPersistentContext(profile, {
    ...opts, args: ['-start-debugger-server', String(port)],
    firefoxUserPrefs: { 'devtools.debugger.remote-enabled': true, 'devtools.debugger.prompt-connection': false },
  });
  try {
    const url = await installFirefox(port, addon);
    return { context, url };
  } catch (error) {
    await context.close();
    throw error;
  }
}

export function browserRss(profile) {
  const processes = execFileSync('ps', ['-eo', 'pid=,ppid=,rss=,args='], { encoding: 'utf8' })
    .trim().split('\n').map(line => /^\s*(\d+)\s+(\d+)\s+(\d+)\s+(.*)$/.exec(line)).filter(Boolean);
  const root = processes.find(([, , , , args]) =>
    /(?:^|\/)(?:chrome|firefox) /.test(args) && args.includes(profile));
  assert(root, 'Unable to identify the browser process.');
  const descendants = new Set([root[1]]);
  for (let size = 0; size !== descendants.size;) {
    size = descendants.size;
    for (const [, pid, parent] of processes) if (descendants.has(parent)) descendants.add(pid);
  }
  return processes.reduce((sum, [, pid, , rss]) => sum + (descendants.has(pid) ? Number(rss) * 1024 : 0), 0);
}
