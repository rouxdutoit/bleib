import assert from 'node:assert/strict';
import { writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { openPicker, rankRows } from './picker.mjs';
import { slots } from '../v/corpus.mjs';
import { features, openStaticHead } from '../q2/subwords.mjs';
import { assignSlot, entriesBySlot } from '../q2/selection.mjs';
import { json, modelRoot, ort, variantRoot } from './node-runtime.mjs';
import { calibrate, devInput, indexVaults, scoreDev, summarize, testInput, warmup } from './workload.mjs';

const [name, variant, comparison] = process.argv.slice(2);
const head = variantRoot(name, comparison ?? variant) + '/.cache/q2';
const asset = file => resolve(modelRoot(name), file);
const headAsset = file => resolve(head, file);
const rss = () => process.memoryUsage.rss();
const beforeBytes = rss();
let peakBytes = beforeBytes;
const sample = () => { peakBytes = Math.max(peakBytes, rss()); };
const timer = setInterval(sample, 50);

async function openStatic() {
  const cwd = process.cwd();
  process.chdir(variantRoot(name, variant));
  try {
    const save = await openStaticHead('save', slots.length);
    const request = await openStaticHead('request', slots.length);
    return {
      score: text => request.score(features(text)),
      index: entries => entriesBySlot(entries.map(entry => ({
        ...entry, slot: assignSlot(entry.text, save.score(features(entry.text))).slot,
      }))),
    };
  } finally {
    process.chdir(cwd);
  }
}

const start = performance.now();
const picker = name === 'static' ? await openStatic() : await openPicker(ort, name, variant, asset, file => json(asset(file)), 'cpu', headAsset);
const coldMs = performance.now() - start;
sample();
try {
  const first = performance.now();
  assert((await picker.score(warmup)).every(Number.isFinite));
  const firstMs = performance.now() - first;
  const idleBefore = performance.now();
  const indexes = {};
  for (const [vault, entries] of Object.entries(indexVaults)) indexes[vault] = await picker.index(entries);
  const indexMs = performance.now() - idleBefore;
  sample();
  const dev = await rankRows(picker, indexes, devInput);
  const file = '.cache/train/' + name + '/' + (comparison ?? variant);
  const operating = comparison ? await json(file + '/node.json').then(run => run.operating) : calibrate(dev);
  const result = { operating, dev: scoreDev(dev, operating.floors), coldMs, firstMs, indexMs, beforeBytes };
  if (!comparison) Object.assign(result, summarize(await rankRows(picker, indexes, testInput), operating.floors));
  await new Promise(resolve => setTimeout(resolve, 1000));
  Object.assign(result, { idleBytes: rss(), peakBytes });
  await writeFile(file + '/' + (comparison ? 'fp32-dev' : 'node') + '.json', JSON.stringify(result));
} finally {
  clearInterval(timer);
  await picker.release?.();
}
