import { createReadStream } from 'node:fs';
import { copyFile, mkdir, stat } from 'node:fs/promises';
import { createServer } from 'node:http';
import { once } from 'node:events';
import { dirname, extname, resolve, sep } from 'node:path';
import { createRequire } from 'node:module';
import { build } from 'esbuild';
import { chromium } from 'playwright';
import { slots } from '../v/corpus.mjs';

const require = createRequire(import.meta.url);
const buildDir = resolve('.cache/build');
export const extension = resolve(buildDir, 'extension');
const web = resolve(buildDir, 'web');

export async function buildPages({ webAlias } = {}) {
  await Promise.all([mkdir(extension, { recursive: true }), mkdir(web, { recursive: true })]);
  const options = {
    bundle: true, format: 'esm', platform: 'browser', nodePaths: [resolve('node_modules')],
    plugins: [{
      name: 'slot-ids',
      setup(api) {
        // The browser needs the fixed slot IDs and never reads the labelled corpus.
        api.onResolve({ filter: /^\.\/corpus\.mjs$/ }, args =>
          args.importer.endsWith('/q2/selection.mjs') ? { path: 'slots', namespace: 'run-x' } : undefined);
        api.onLoad({ filter: /^slots$/, namespace: 'run-x' }, () =>
          ({ contents: `export const slotIds = ${JSON.stringify(slots.map(slot => slot.id))};` }));
      },
    }],
  };
  await Promise.all([
    build({ ...options, entryPoints: ['nano-page.mjs'], outdir: extension }),
    build({ ...options, alias: webAlias, entryPoints: ['gpu-page.mjs', 'web-page.mjs'], outdir: web }),
    ...['manifest.json', 'index.html'].map(file => copyFile('extension/' + file, resolve(extension, file))),
  ]);
}

export async function launch(profile, { nano = false, offline = false } = {}) {
  const chrome = process.env.BLEIB_CHROME ??
    '/home/roux/.local/opt/google-chrome/opt/google/chrome/chrome';
  const flags = ['--remote-debugging-pipe', '--no-first-run', `--user-data-dir=${profile}`];
  if (nano) flags.push('--enable-unsafe-extension-debugging');
  if (!nano || offline) flags.push('--disable-background-networking', '--disable-component-update');
  if (process.env.BLEIB_X_CHROME_SANDBOX === '1') flags.push('--disable-setuid-sandbox');
  else flags.push('--no-sandbox');
  if (process.env.BLEIB_X_HEADLESS === '1') flags.push('--headless');
  if (!nano && process.env.BLEIB_X_WEBGPU_FLAGS) flags.push(...process.env.BLEIB_X_WEBGPU_FLAGS.trim().split(/\s+/u));

  const start = performance.now();
  const context = await chromium.launchPersistentContext(profile, {
    executablePath: chrome, ignoreDefaultArgs: true, args: [...flags, 'about:blank'], timeout: 30_000,
    env: { ...process.env, CHROME_CONFIG_HOME: resolve('.cache/chrome-config'),
      XDG_CACHE_HOME: resolve('.cache/chrome-cache') },
  });
  return { context, flags, launchMs: performance.now() - start, chrome };
}

export async function loadExtension(context) {
  const session = await context.browser().newBrowserCDPSession();
  const { id } = await session.send('Extensions.loadUnpacked', { path: extension });
  await session.detach();
  return `chrome-extension://${id}/index.html`;
}

export function logPage(page, name) {
  page.on('console', message => {
    if (message.text().startsWith('[run-x]')) console.log(message.text());
    if (message.type() === 'error') console.error(`[run-x] ${name} · ${message.text().slice(0, 800)}`);
  });
  page.on('pageerror', error => console.error(`[run-x] ${name} · ${error.message}`));
}

export function localOnly(context, origin) {
  const blocked = [];
  return context.route(/^(https?|wss?):/u, route => {
    const url = route.request().url();
    if (url.startsWith(origin + '/')) return route.continue();
    blocked.push(url);
    return route.abort();
  }).then(() => blocked);
}

const mime = { '.js': 'text/javascript', '.mjs': 'text/javascript', '.json': 'application/json', '.wasm': 'application/wasm' };
const ortDir = dirname(require.resolve('onnxruntime-web'));
const runtimeFiles = new Set(['ort-wasm-simd-threaded.mjs', 'ort-wasm-simd-threaded.wasm']);

function staticFile(path) {
  const routes = [['/models/', '.cache/models'], ['/model/', '.cache/models/minilm'], ['/runtime/', ortDir], ['/', web]];
  const [prefix, dir] = routes.find(([base]) => path.startsWith(base));
  const suffix = path.slice(prefix.length);
  if (prefix === '/runtime/' && !runtimeFiles.has(suffix)) return null;
  const file = resolve(dir, suffix);
  return file.startsWith(resolve(dir) + sep) ? file : null;
}

async function serve(request, reply) {
  const path = new URL(request.url, 'http://127.0.0.1').pathname;
  const headers = {
    'Content-Security-Policy': "default-src 'none'; script-src 'self' 'wasm-unsafe-eval'; connect-src 'self'; worker-src 'self' blob:",
    'Cross-Origin-Opener-Policy': 'same-origin',
    'Cross-Origin-Embedder-Policy': 'require-corp',
    'Cache-Control': 'no-store',
  };
  if (['/probe.html', '/web.html'].includes(path)) {
    reply.writeHead(200, { ...headers, 'Content-Type': 'text/html; charset=utf-8' });
    const script = path === '/probe.html' ? 'gpu-page' : 'web-page';
    return reply.end(`<!doctype html><html lang="en"><meta charset="utf-8"><title>bleib Run X</title><script type="module" src="/${script}.js"></script></html>`);
  }
  const file = staticFile(path);
  const info = file && await stat(file).catch(() => null);
  if (!info?.isFile()) return reply.writeHead(404).end();
  reply.writeHead(200, { ...headers, 'Content-Type': mime[extname(file)] ?? 'application/octet-stream',
    'Content-Length': info.size });
  const stream = createReadStream(file);
  reply.once('close', () => stream.destroy());
  stream.once('error', () => reply.destroy());
  stream.pipe(reply);
}

export async function loopback() {
  const server = createServer((request, reply) => serve(request, reply).catch(() => reply.destroy()));
  server.listen({ port: 0, host: '127.0.0.1' });
  await once(server, 'listening');
  return { origin: `http://127.0.0.1:${server.address().port}`, close: () => server.close() };
}
