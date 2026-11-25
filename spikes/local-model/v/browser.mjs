import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { createReadStream } from 'node:fs';
import { copyFile, mkdir, mkdtemp, readFile, rm, stat, writeFile } from 'node:fs/promises';
import { createServer } from 'node:http';
import { dirname, resolve } from 'node:path';
import { once } from 'node:events';
import { createRequire } from 'node:module';
import { build } from 'esbuild';
import { chromium, firefox } from 'playwright';
import { profiles, rows, slots, vaults } from './corpus.mjs';
import { encoders, llms, mlc } from './weights.mjs';

const require = createRequire(import.meta.url);
const moduleFor = {
  minilm: 'classifier', granite: 'classifier', gemma: 'gemma', qwen3: 'wllama',
  qwen35: 'wllama', mlc: 'webllm', profile: 'baseline', cascade: 'cascade', static: 'static', similarity: 'similarity',
};
const [name, engine = 'chromium'] = process.argv.slice(2);
const module = moduleFor[name];
assert(module && ['chromium', 'firefox'].includes(engine));
const weights = { cascade: 'qwen35', similarity: 'minilm' }[name] ?? name;
const launchFlags = process.env.BLEIB_WEBGPU_FLAGS?.split(/ +/).filter(Boolean) ?? [];
const html = '<!doctype html><meta charset="utf-8"><script type="module" src="page.js"></script>';
const extensionPage = !['wllama', 'cascade'].includes(module);
const chromeExtension = engine === 'chromium' && extensionPage;
const firefoxExtension = engine === 'firefox' && extensionPage;
const probeOnly = name === 'mlc' && process.env.BLEIB_PROBE_ONLY === '1';
const csp = "script-src 'self' 'wasm-unsafe-eval'; object-src 'none'; connect-src 'self'";
const peer = await mkdtemp(resolve('.cache', 'run-'));
const directory = peer + '/addon';
const profileDir = peer + '/profile';
const manifest = {
  manifest_version: 3, name: 'bleib Run V benchmark', version: '0.1.0',
  content_security_policy: { extension_pages: csp },
  ...(chromeExtension ? { background: { service_worker: 'background.js' } } : {
    browser_specific_settings: { gecko: { id: 'local-model-spike@bleib.dev' } },
    web_accessible_resources: [{ resources: ['page.html'], matches: ['http://127.0.0.1/*'] }],
  }),
};

const bundle = {
  bundle: true, format: 'esm', platform: 'browser', minify: true, legalComments: 'eof',
  nodePaths: [resolve('node_modules')],
  plugins: [{
    name: 'browser-slot-ids',
    setup(api) {
      api.onResolve({ filter: /^\.\/corpus\.mjs$/ }, args =>
        args.importer.endsWith('/q2/selection.mjs') ? { path: 'slot-ids', namespace: 'fixture' } : undefined);
      api.onResolve({ filter: /^node:fs\/promises$/ }, args =>
        args.importer.endsWith('/q2/subwords.mjs') ? { path: 'unused-node-fs', namespace: 'fixture' } : undefined);
      api.onLoad({ filter: /.*/, namespace: 'fixture' }, args => ({
        contents: args.path === 'slot-ids' ? `export const slotIds = ${JSON.stringify(slots.map(slot => slot.id))};`
          : 'export function readFile() { throw new Error("Node-only helper"); }',
      }));
    },
  }],
};

function runtimeFiles() {
  const files = [];
  if (['wllama', 'cascade'].includes(module)) {
    files.push(require.resolve('@wllama/wllama/esm/wasm/wllama.wasm'));
  }
  if (['similarity', 'classifier', 'gemma', 'cascade'].includes(module)) {
    const resolver = module === 'gemma' ? createRequire(require.resolve('@huggingface/transformers')) : require;
    const dir = dirname(resolver.resolve('onnxruntime-web'));
    const prefix = 'ort-wasm-simd-threaded';
    files.push(...['mjs', 'wasm'].map(ext => `${dir}/${prefix}.${ext}`));
  }
  return files;
}

async function prepare() {
  const byModel = {};
  for (const id of name === 'cascade' ? [weights, 'minilm'] : [weights]) {
    if ((encoders[id] || llms[id] || id === 'mlc') && !probeOnly) {
      byModel[id] = JSON.parse(await readFile(`.cache/${id}-assets.json`, 'utf8'));
    }
  }
  const modelFiles = Object.entries(byModel).flatMap(([id, files]) =>
    Object.keys(files).map(file => [id, file]));
  const modelDir = module === 'webllm' ? mlc.localRoot : 'model/';
  if (['classifier', 'cascade'].includes(module)) {
    const id = name === 'cascade' ? 'minilm' : weights;
    modelFiles.push([id, 'save-int8.onnx'], [id, 'request-int8.onnx']);
  }
  if (module === 'static') {
    modelFiles.push([weights, 'save-static.bin'], [weights, 'request-static.bin']);
  }
  const copy = async (from, to) => {
    await mkdir(dirname(to), { recursive: true });
    await copyFile(from, to);
  };
  await mkdir(directory);
  await Promise.all([
    build({ ...bundle, entryPoints: ['page.mjs', `${module}.mjs`], outdir: directory,
      // The standalone build includes the WASM GatherBlockQuantized kernel that the WebGPU build drops.
      alias: module === 'gemma' ? { 'onnxruntime-web/webgpu': 'onnxruntime-web/wasm' } : {},
      external: [`./${module}.js`] }),
    writeFile(directory + '/page.html', html),
    writeFile(directory + '/manifest.json', JSON.stringify(manifest)),
    writeFile(directory + '/background.js', 'chrome.runtime.onInstalled.addListener(() => {});'),
    ...modelFiles.map(([id, file]) => copy(`.cache/models/${id}/${file}`, `${directory}/${modelDir}${file}`)),
    ...runtimeFiles().map(file => copy(file, `${directory}/runtime/${file.split('/').at(-1)}`)),
  ]);
  return Object.assign({}, ...Object.values(byModel));
}

async function loopback() {
  const types = { html: 'text/html', js: 'text/javascript', mjs: 'text/javascript', wasm: 'application/wasm',
    json: 'application/json' };
  const server = createServer(async (request, reply) => {
    const path = new URL(request.url, 'http://127.0.0.1').pathname;
    const file = resolve(directory, '.' + path);
    const info = file.startsWith(directory + '/') && await stat(file).catch(() => null);
    if (!info?.isFile()) return reply.writeHead(404).end();
    reply.writeHead(200, {
      'Content-Security-Policy': csp + "; worker-src 'self' blob:",
      'Cross-Origin-Opener-Policy': 'same-origin', 'Cross-Origin-Embedder-Policy': 'require-corp',
      'Content-Type': types[path.split('.').at(-1)] ?? 'application/octet-stream',
      'Content-Length': info.size,
    });
    createReadStream(file).pipe(reply);
  }).listen(0, '127.0.0.1');
  await once(server, 'listening');
  return { server, url: `http://127.0.0.1:${server.address().port}/page.html` };
}

function rss() {
  const processes = execFileSync('ps', ['-eo', 'pid=,ppid=,rss=,args='], { encoding: 'utf8' })
    .split('\n').map(line => /^\s*(\d+)\s+(\d+)\s+(\d+)\s+(.*)/.exec(line)).filter(Boolean);
  const root = processes.find(([, , , , args]) =>
    /(?:^|\/)(?:chrome|firefox) /.test(args) && args.includes(profileDir));
  assert(root, 'Could not identify browser process.');
  const tree = new Set([root[1]]);
  for (let size = 0; size < tree.size;) {
    size = tree.size;
    for (const [, id, parent] of processes) if (tree.has(parent)) tree.add(id);
  }
  return processes.reduce((sum, [, id, , memory]) => sum + (tree.has(id) ? Number(memory) * 1024 : 0), 0);
}

async function launch() {
  if (firefoxExtension) {
    await build({ entryPoints: ['../browser/launch.mjs'], outfile: '.cache/firefox-launch.mjs',
      bundle: true, packages: 'external', format: 'esm', platform: 'node',
      plugins: [{
        name: 'use-local-firefox',
        setup(api) {
          api.onLoad({ filter: /browser\/launch\.mjs$/ }, async args => ({
            loader: 'js', contents: (await readFile(args.path, 'utf8'))
              .replace("...opts, args:", "...opts, executablePath: process.env.BLEIB_FIREFOX, acceptDownloads: false, args:"),
          }));
        },
      }] });
    const { launch: launchAddon } = await import('./.cache/firefox-launch.mjs');
    return launchAddon('firefox', profileDir, directory);
  }
  const chromiumOptions = {
    channel: 'chromium', executablePath: process.env.BLEIB_CHROMIUM,
    args: ['--disable-background-networking', ...launchFlags, ...(chromeExtension ? [
      `--disable-extensions-except=${directory}`, `--load-extension=${directory}`,
    ] : [])],
  };
  const options = engine === 'chromium' ? chromiumOptions : { executablePath: process.env.BLEIB_FIREFOX };
  const browser = engine === 'chromium' ? chromium : firefox;
  return { context: await browser.launchPersistentContext(profileDir, {
    ...options, headless: true, acceptDownloads: false, proxy: { server: 'http://127.0.0.1:1', bypass: '127.0.0.1' },
  }) };
}

function firefoxRun(page, origin, args) {
  return page.evaluate(([origin, args]) => new Promise((resolve, reject) => {
    const frame = document.querySelector('iframe').contentWindow;
    addEventListener('message', function handle(event) {
      if (event.source !== frame || event.origin !== origin) return;
      removeEventListener('message', handle);
      if (event.data.error) reject(new Error(event.data.error));
      else resolve(event.data.result);
    });
    frame.postMessage({ args }, origin);
  }), [origin, args]);
}

async function run() {
  const assets = await prepare();
  const loop = extensionPage ? null : await loopback();
  let context;
  try {
    const launched = await launch();
    context = launched.context;
    const worker = chromeExtension && (context.serviceWorkers()[0] ??
      await context.waitForEvent('serviceworker', { timeout: 15000 }));
    const url = worker ? new URL('page.html', worker.url()).href : launched.url ?? loop.url;
    const origin = url.slice(0, url.lastIndexOf('/'));
    const outside = [];
    await context.route(/^(?:https?|wss?):/u, route => {
      if (route.request().url().startsWith(origin + '/')) return route.continue();
      outside.push(route.request().url());
      return route.abort();
    });
    if (chromeExtension) await context.setOffline(true);
    const page = context.pages()[0] ?? await context.newPage();
    page.on('pageerror', error => console.error(String(error)));
    page.on('console', message => {
      if (message.text().startsWith('[run-v]')) console.log(message.text());
      if (message.type() === 'error') console.error(message.text().slice(0, 1200));
    });
    if (firefoxExtension) {
      const harness = 'http://127.0.0.1/run-v';
      await context.route(harness, route => route.fulfill({
        contentType: 'text/html', body: `<!doctype html><iframe src="${url}"></iframe>`,
      }));
      await page.goto(harness);
      await context.unroute(harness);
      await context.setOffline(true);
    } else {
      await page.goto(url);
      await page.waitForFunction(() => typeof runBenchmark === 'function');
    }
    const baselineRss = rss();
    let peakRss = baselineRss;
    const interval = setInterval(() => { peakRss = Math.max(peakRss, rss()); }, 200);
    let outcome;
    try {
      const ordered = name === 'qwen35' ? [...rows].sort((a, b) =>
        a.vault.localeCompare(b.vault) || a.lang.localeCompare(b.lang)) : rows;
      const workload = {
        slots, profiles, vaults: ['classifier', 'static', 'similarity', 'cascade'].includes(module) ? vaults : Object.fromEntries(Object.entries(vaults)
          .map(([id, entries]) => [id, entries.map(({ id, slot }) => ({ id, slot }))])),
        rows: ordered.map(({ id, lang, text, vault }) => ({ id, lang, text, vault })),
      };
      const smoke = process.env.BLEIB_SMOKE;
      if (smoke) {
        workload.rows = workload.rows.filter(row => smoke === 'hero' ? row.vault === 'hero' :
          row.id === (smoke === '1' ? 'H-DINNER-en' : smoke));
        assert(workload.rows.length, 'The smoke fixture ID was not found.');
      }
      const args = [module, weights, workload];
      const invocation = firefoxExtension ? firefoxRun(page, origin, args) :
        page.evaluate(args => globalThis.runBenchmark(...args), args);
      const timer = AbortSignal.timeout(smoke === 'hero' ? 150_000 : smoke ? 90_000 : 3_600_000);
      outcome = await Promise.race([invocation,
        new Promise((_, reject) => timer.addEventListener('abort', () => reject(timer.reason), { once: true }))]);
      peakRss = Math.max(peakRss, rss());
    } finally {
      clearInterval(interval);
    }
    assert.deepEqual(outside, []);
    assert.deepEqual(outcome.diagnostics.violations, []);
    if (extensionPage) {
      assert(outcome.diagnostics.runtimeId);
      assert(outcome.diagnostics.resources.every(url => url.startsWith(origin + '/')));
    }
    const zipPath = peer + '/bundle.zip';
    execFileSync('zip', ['-q', '-r', zipPath, '.'], { cwd: directory });
    return { ...outcome, engine, name, assets, zipBytes: (await stat(zipPath)).size,
      baselineRss, peakRss, userAgent: await page.evaluate(() => navigator.userAgent), outside };
  } finally {
    await context?.close();
    loop?.server.close();
  }
}

try {
  const result = await run();
  const path = `.cache/${engine}-${name}${process.env.BLEIB_SMOKE === 'hero' ? '-hero' : process.env.BLEIB_SMOKE ? '-smoke' : ''}.json`;
  await writeFile(path, JSON.stringify(result, null, 2));
  console.log(path, result.output.length, result.coldMs, result.peakRss - result.baselineRss);
} catch (error) {
  console.error(error);
  await writeFile(`.cache/${engine}-${name}-failure.json`, JSON.stringify({ error: String(error) }, null, 2));
  process.exitCode = 1;
} finally {
  await rm(peer, { recursive: true, force: true });
}
