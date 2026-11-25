import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';
import { chromium } from 'playwright';
import { slots } from '../v/corpus.mjs';
import { prepareExtension } from './extension.mjs';
import { devInput, indexVaults, scoreDev, summarize, testInput, warmup } from './workload.mjs';

function processes() {
  return execFileSync('ps', ['-eo', 'pid=,ppid=,rss=,stat=,args='], { encoding: 'utf8' })
    .split('\n').map(line => /^\s*(\d+)\s+(\d+)\s+(\d+)\s+(\S+)\s+(.*)$/.exec(line)).filter(Boolean);
}

function tree(profile) {
  const snapshot = processes();
  const root = snapshot.find(([, , , , stat, args]) =>
    !stat.startsWith('Z') && args.includes('--user-data-dir=' + profile) && !args.includes('--type='));
  const pids = new Set(root ? [root[1]] : []);
  for (let oldSize = 0; oldSize !== pids.size;) {
    oldSize = pids.size;
    for (const [, pid, parent] of snapshot) if (pids.has(parent)) pids.add(pid);
  }
  return { pids, rss: snapshot.reduce((sum, [, pid, , rss]) => sum + (pids.has(pid) ? Number(rss) * 1024 : 0), 0) };
}

const [name, variant] = process.argv.slice(2);
const scratch = await mkdtemp(resolve('.cache/bench-'));
const profile = scratch + '/profile';
const file = '.cache/train/' + name + '/' + variant;
const pids = new Set();
let context;
let sampleTimer;
try {
  const { root, unpackedBytes, zipBytes } = await prepareExtension(name, variant, scratch);
  const operating = JSON.parse(await readFile(file + '/node.json', 'utf8')).operating;
  context = await chromium.launchPersistentContext(profile, {
    channel: 'chromium', executablePath: process.env.BLEIB_CHROMIUM, headless: true, acceptDownloads: false,
    proxy: { server: 'http://127.0.0.1:1' },
    args: ['--disable-background-networking', '--disable-component-update', '--disable-gpu',
      '--disable-software-rasterizer', '--disable-extensions-except=' + root, '--load-extension=' + root],
  });
  await context.setOffline(true);
  const outside = [];
  await context.route(/^(?:https?|wss?):/u, route => {
    outside.push(route.request().url());
    return route.abort();
  });
  const worker = context.serviceWorkers()[0] ?? await context.waitForEvent('serviceworker', { timeout: 15000 });
  const url = new URL('page.html', worker.url());
  const page = context.pages()[0] ?? await context.newPage();
  const cdp = await context.newCDPSession(page);
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
  await page.goto(url.href);
  await page.waitForFunction(() => !!globalThis.benchmark);
  await delay(1000);

  let peakBytes = 0;
  function sample() {
    const measurement = tree(profile);
    for (const pid of measurement.pids) pids.add(pid);
    assert(measurement.rss > 0, 'Could not identify the browser.');
    peakBytes = Math.max(peakBytes, measurement.rss);
    return measurement.rss;
  }
  const beforeBytes = sample();
  sampleTimer = setInterval(sample, 100);
  const { coldMs, firstMs } = await page.evaluate(args => globalThis.benchmark.load(...args), [name, variant, slots, warmup]);
  const indexMs = await page.evaluate(vaults => globalThis.benchmark.index(vaults), indexVaults);
  const dev = scoreDev(await page.evaluate(rows => globalThis.benchmark.rank(rows), devInput), operating.floors);
  const quality = summarize(await page.evaluate(rows => globalThis.benchmark.rank(rows), testInput), operating.floors);
  await delay(2000);
  const idleSamples = [];
  for (let i = 0; i < 5; i++) {
    idleSamples.push(sample());
    await delay(100);
  }
  const idleBytes = idleSamples.sort((a, b) => a - b)[2];
  const diagnostics = await page.evaluate(() => globalThis.benchmark.diagnostics());
  assert(diagnostics.runtimeId && diagnostics.origin.startsWith('chrome-extension://'));
  assert(diagnostics.resources.every(resource => resource.startsWith(diagnostics.origin + '/')));
  assert.deepEqual(diagnostics.violations, []);
  assert.deepEqual(outside, []);
  const version = await cdp.send('Browser.getVersion');
  await writeFile(file + '/chromium.json', JSON.stringify({
    operating, dev, ...quality, coldMs, firstMs, indexMs, unpackedBytes, zipBytes,
    beforeBytes, idleBytes, peakBytes, version: version.product, diagnostics,
  }));
  console.log(name, variant, version.product, 'cold + first ms', Math.round(coldMs + firstMs),
    'idle increase MB', ((idleBytes - beforeBytes) / 1e6).toFixed(1));
} finally {
  clearInterval(sampleTimer);
  await context?.close();
  await delay(300);
  const alive = processes().filter(([, pid, , , stat, args]) =>
    !stat.startsWith('Z') && (pids.has(pid) || args.includes('--user-data-dir=' + profile)));
  assert.deepEqual(alive.map(row => row[1]), [], 'A browser process survived teardown.');
  await rm(scratch, { recursive: true, force: true });
}
