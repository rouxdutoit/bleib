import assert from 'node:assert/strict';
import { mkdir, mkdtemp, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { prepareMiniLM, models } from './assets.mjs';
import { buildPages, launch, loadExtension, localOnly, loopback } from './browser.mjs';
import { directWorkload, workload, cases } from './workload.mjs';
import { summarizePhase } from './summarize.mjs';

async function verifyNano() {
  const { context } = await launch(await mkdtemp(resolve('.cache', 'verify-nano-')), { nano: true, offline: true });
  try {
    const outside = await localOnly(context, 'chrome-extension://none');
    await context.setOffline(true);
    await context.addInitScript(() => {
      Object.defineProperty(globalThis, 'LanguageModel', { value: {
        availability: async () => 'downloadable',
        async create({ monitor }) {
          if (!navigator.userActivation.isActive) throw new Error('Missing trusted click.');
          monitor({ addEventListener(_event, handler) { handler({ loaded: 1, total: 1 }); } });
          return { destroy() {}, async clone() {
            return { destroy() {}, async prompt(messages, { responseConstraint }) {
              if (responseConstraint.properties.ids.maxItems !== 2) throw new Error('Missing constraint.');
              return messages[0].content.includes('format check') ? '{"ids":[1]}' : '{"ids":[]}';
            } };
          } };
        },
      } });
    });
    const page = context.pages()[0];
    const output = [];
    await page.exposeBinding('recordX', (_source, _mode, row) => { output.push(row); });
    await page.goto(await loadExtension(context));
    await page.waitForFunction(() => !!globalThis.nanoX);
    assert.deepEqual(await page.evaluate(() => globalThis.nanoX.availability()),
      { en: 'downloadable', de: 'downloadable' });
    for (const lang of ['en', 'de']) {
      await page.evaluate(code => globalThis.nanoX.prepare(code, 2000), lang);
      await page.locator('#' + lang).click();
      const opened = await page.evaluate(() => globalThis.nanoX.ready());
      assert.equal(opened.events[0].percentage, 100);
      const data = { ...directWorkload, rows: directWorkload.rows.filter(row => row.lang === lang) };
      const result = await page.evaluate(([code, data]) => globalThis.nanoX.benchmark(code, data), [lang, data]);
      assert.equal(result.control, true);
      await page.evaluate(() => globalThis.nanoX.close());
    }
    assert.equal(summarizePhase({ output }).coverage, cases.length);
    assert.deepEqual(outside, []);
  } finally {
    await context.close();
  }
}

async function verifyWeb(loop) {
  const { context } = await launch(await mkdtemp(resolve('.cache', 'verify-web-')));
  try {
    const outside = await localOnly(context, loop.origin);
    await context.addInitScript(() => {
      Object.defineProperty(navigator, 'gpu', { value: { async requestAdapter() {
        return { features: new Set(['shader-f16']), info: { vendor: 'mock', isFallbackAdapter: false },
          limits: { maxBufferSize: 1024 ** 3 } };
      } } });
    });
    const page = context.pages()[0];
    const output = { direct: [], cascade: [] };
    await page.exposeBinding('recordX', (_source, mode, row) => { output[mode].push(row); });
    await page.goto(loop.origin + '/web.html');
    await page.waitForFunction(() => !!globalThis.webX);
    assert(await page.evaluate(model => globalThis.webX.load(model), models[0]) >= 0);
    const direct = await page.evaluate(data => globalThis.webX.benchmark('direct', data), directWorkload);
    assert.equal(direct.control, true);
    assert.equal(summarizePhase({ output: output.direct }).coverage, cases.length);
    await page.evaluate(data => globalThis.webX.benchmark('cascade', data), workload);
    const cascade = summarizePhase({ output: output.cascade });
    assert.equal(cascade.coverage, cases.length);
    assert.deepEqual([cascade.splits.test.routed, cascade.splits.second.routed, cascade.splits.hero.routed],
      [20, 11, 0]);
    assert.deepEqual(outside, []);
    await page.evaluate(() => globalThis.webX.close());
  } finally {
    await context.close();
  }
}

const mock = `
export const prebuiltAppConfig = { model_list: [] };
export async function CreateMLCEngine(id, options) {
  if (new URL(options.appConfig.model_list[0].model).hostname !== '127.0.0.1') {
    throw new Error('Nonlocal model URL.');
  }
  return { resetChat() {}, unload() {}, chat: { completions: { async create(request) {
    if (request.model !== id || request.response_format.type !== 'json_object') throw new Error('Missing schema.');
    const schema = JSON.parse(request.response_format.schema);
    if (!schema.properties.ids.items.enum.length) throw new Error('Missing slots.');
    const content = request.messages[0].content.includes('format check') ? '{"ids":[1]}' : '{"ids":[]}';
    return { choices: [{ message: { content } }] };
  } } } };
}
`;

await mkdir('.cache', { recursive: true });
const file = resolve('.cache/mock-webllm.mjs');
await writeFile(file, mock);
await prepareMiniLM({ offline: true });
process.env.BLEIB_X_HEADLESS = '1';
await buildPages({ webAlias: { '@mlc-ai/web-llm': file } });
const loop = await loopback();
try {
  await verifyNano();
  console.log('Offline Chrome MV3 smoke passed all 262 drafts with mocked LanguageModel.');
  await verifyWeb(loop);
  console.log('Offline loopback smoke passed both 262-draft paths with mocked WebLLM and real MiniLM.');
} finally {
  loop.close();
  await buildPages();
}
