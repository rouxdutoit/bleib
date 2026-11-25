import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { copyFile, mkdir, mkdtemp, readFile, rm, stat, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { build } from 'esbuild';
import { candidates } from '../candidates.mjs';
import { drafts, memory } from '../corpus.mjs';
import { browserRss, launch } from './launch.mjs';

async function pack(folder, name, engine) {
  const candidate = candidates[name];
  const { repository, graph = 'onnx/model_quantized.onnx' } = candidate;
  const assets = JSON.parse(await readFile(`.cache/${name}-assets.json`));
  const isChromium = engine === 'chromium';
  const manifest = {
    name: 'bleib local model benchmark', version: '0.1.0', manifest_version: 3,
    ...(isChromium ? { background: { service_worker: 'background.js' } } : {}),
    content_security_policy: {
      extension_pages: "script-src 'self' 'wasm-unsafe-eval'; object-src 'none'; connect-src 'self';",
    },
    ...(!isChromium ? {
      browser_specific_settings: { gecko: { id: 'local-model-spike@bleib.dev' } },
      web_accessible_resources: [{ resources: ['page.html'], matches: ['http://127.0.0.1/*'] }],
    } : {}),
  };
  const wasm = 'ort-wasm-simd-threaded';
  await Promise.all([
    build({ entryPoints: ['browser/page.mjs'], outfile: `${folder}/page.js`, bundle: true, format: 'esm',
      target: 'es2022', minify: true, legalComments: 'eof' }),
    writeFile(`${folder}/manifest.json`, JSON.stringify(manifest)),
    ...(isChromium ? [writeFile(`${folder}/background.js`, 'chrome.runtime.onInstalled.addListener(() => {});\n')] : []),
    writeFile(`${folder}/page.html`,
      '<!doctype html><meta charset="utf-8"><title>bleib local model benchmark</title><script type="module" src="page.js"></script>'),
    writeFile(`${folder}/fixture.json`, JSON.stringify({
      candidate, graph,
      memory: memory.map(({ id, text }) => ({ id, text })),
      drafts: drafts.map(({ id, text }) => ({ id, text })),
    })),
    ...Object.keys(assets).map(async file => {
      await mkdir(dirname(`${folder}/${file}`), { recursive: true });
      await copyFile(`.cache/models/${repository}/${file}`, `${folder}/${file}`);
    }),
    ...['mjs', 'wasm'].map(ext => copyFile(`node_modules/onnxruntime-web/dist/${wasm}.${ext}`,
      `${folder}/${wasm}.${ext}`)),
  ]);
  return assets;
}

async function benchmarkPage(context, url, engine) {
  const page = context.pages().find(page => page.url() === url) ?? await context.newPage();
  if (engine === 'chromium') {
    if (page.url() !== url) await page.goto(url);
    await page.waitForFunction(() => typeof window.run === 'function');
    return page;
  }
  const harness = 'http://127.0.0.1/local-model-spike';
  await context.route(harness, route => route.fulfill({
    contentType: 'text/html', body: `<!doctype html><iframe src="${url}"></iframe>`,
  }));
  await page.goto(harness);
  await context.unroute(harness);
  return page;
}

async function runInPage(page, url, engine) {
  if (engine === 'chromium') return page.evaluate(() => window.run());
  const outcome = await page.evaluate(origin => new Promise((resolve, reject) => {
    const frame = document.querySelector('iframe').contentWindow;
    const timer = setTimeout(() => reject(new Error('The extension frame did not respond.')), 90_000);
    window.addEventListener('message', function receive(event) {
      if (event.origin !== origin || event.source !== frame) return;
      clearTimeout(timer);
      window.removeEventListener('message', receive);
      resolve(event.data);
    });
    frame.postMessage('benchmark', origin);
  }), url.slice(0, url.lastIndexOf('/')));
  if (outcome.error) throw new Error(outcome.error);
  return outcome.value;
}

const [engine, name] = process.argv.slice(2);
const root = await mkdtemp(resolve('.cache', 'browser-'));
const folder = `${root}/addon`;
const profile = `${root}/profile`;
await mkdir(folder);
let context;
let zipBytes;
try {
  const assets = await pack(folder, name, engine);
  execFileSync('zip', ['-q', '-r', `${root}/addon.zip`, '.'], { cwd: folder });
  zipBytes = (await stat(`${root}/addon.zip`)).size;
  const launched = await launch(engine, profile, folder);
  context = launched.context;
  const page = await benchmarkPage(context, launched.url, engine);
  const network = [];
  const remote = /^(?:https?|wss?):/u;
  page.on('request', request => { if (remote.test(request.url())) network.push(request.url()); });
  await context.setOffline(true);
  const baselineRss = browserRss(profile);
  let peakRss = baselineRss;
  const sample = setInterval(() => { peakRss = Math.max(peakRss, browserRss(profile)); }, 150);
  let run;
  try {
    run = await runInPage(page, launched.url, engine);
    peakRss = Math.max(peakRss, browserRss(profile));
  } finally {
    clearInterval(sample);
  }
  assert(run.diagnostics.runtimeId, 'The page has no extension runtime.');
  assert(run.diagnostics.offline, 'The extension page was not offline.');
  assert.deepEqual(network, []);
  assert(run.diagnostics.resources.length >= 3, 'Missing evidence of packaged resources.');
  assert(run.diagnostics.resources.every(url => url.startsWith(run.diagnostics.origin + '/')));
  assert.deepEqual(run.diagnostics.violations, []);
  console.log(JSON.stringify({ ...run, assets, zipBytes, baselineRss, peakRss, network,
    version: context.browser()?.version() ?? await page.evaluate(() => navigator.userAgent) }));
} catch (error) {
  console.log(JSON.stringify({ error: String(error), zipBytes }));
} finally {
  await context?.close();
  await rm(root, { recursive: true, force: true });
}
