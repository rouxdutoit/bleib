import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';
import { byLanguage, latency, metrics } from '../evaluate.mjs';
import { choose, knownFloors } from './pick.mjs';
import { rows, vaults } from './corpus.mjs';

const file = async name => {
  try {
    return JSON.parse(await readFile(`.cache/${name}.json`, 'utf8'));
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
    return null;
  }
};

function select(row, floors) {
  return choose(row.ranking ?? [], floors).map(slot => row.entryIds[slot]);
}

function calibrate(dev, gate = false) {
  const grid = [...Array.from({ length: 51 }, (_, index) => index / 50), 1.01];
  let best;
  for (const first of grid) {
    for (const second of grid.filter(floor => floor >= first)) {
      const floors = [first, second];
      const picks = dev.map(row => ({ ...row, selected: select(row, floors) }));
      const { precision, f05 } = metrics(picks);
      if (gate && Object.values(byLanguage(picks)).some(result =>
        result.precision < 0.9 || result.tp + result.fp < 8)) continue;
      const score = [f05, precision, first + second, first];
      const changed = best?.score.findIndex((value, index) => value !== score[index]);
      if (!best || (changed >= 0 && score[changed] > best.score[changed])) best = { score, floors };
    }
  }
  return best?.floors ?? null;
}

function quality(drafts) {
  return {
    ...metrics(drafts), byLanguage: byLanguage(drafts),
    literalBlank: drafts.filter(row => !row.text.trim()).length,
    literalBlankOffers: drafts.filter(row => !row.text.trim() && row.selected.length).length,
    protectedWrong: drafts.reduce((total, row) => total + row.selected.filter(id =>
      !row.relevant.includes(id) && vaults[row.vault].some(entry => entry.id === id && entry.policy === 'ask')).length, 0),
  };
}

const engines = ['chromium', 'firefox'];
const methods = ['minilm', 'granite', 'gemma', 'qwen3', 'qwen35', 'mlc', 'profile', 'cascade', 'static', 'similarity'];
const cases = Object.fromEntries(rows.map(row => [row.id, row]));
const qwenControl = (await file('chromium-qwen3-smoke'))?.diagnostics.control;
const qwen35Probe = await file('chromium-qwen35-hero') ?? await file('chromium-qwen35-smoke');
const output = {
  probe: await file('probe'), runs: {}, failures: {},
  controls: qwenControl ? { 'qwen3-fixed-choice': qwenControl } : {},
};
if (qwen35Probe) output.controls['qwen35-direct'] = qwen35Probe;
const lines = ['browser\tmethod\tsplit\tdraft\tlang\trelevant\tselected\trouted\tinvalid\tms'];
for (const engine of engines) {
  for (const method of methods) {
    const name = `${engine}-${method}`;
    const artifact = await file(name);
    const failure = await file(name + '-failure');
    if (!artifact) {
      if (failure) output.failures[name] = failure.error;
      continue;
    }
    const { output: predictions, ...performance } = artifact;
    const heads = {
      minilm: ['save-int8.onnx', 'request-int8.onnx'],
      granite: ['save-int8.onnx', 'request-int8.onnx'],
      cascade: ['save-int8.onnx', 'request-int8.onnx'],
      static: ['save-static.bin', 'request-static.bin'],
    }[method] ?? [];
    for (const file of heads) {
      const head = await readFile(`.cache/models/${method === 'cascade' ? 'minilm' : method}/${file}`);
      performance.assets[file] = { bytes: head.length, sha256: createHash('sha256').update(head).digest('hex') };
    }
    if (predictions.length !== rows.length) throw new Error(`Incomplete run ${name}.`);
    const joined = predictions.map(result => ({ ...cases[result.id], ...result }));
    const dev = joined.filter(row => row.split === 'dev');
    const ranked = ['minilm', 'granite', 'gemma', 'static'].includes(method);
    const floors = method === 'similarity' ? [0.37, 0.53] :
      !ranked ? null : method === 'minilm' ? knownFloors : calibrate(dev);
    const precisionFloors = ranked ? calibrate(dev, true) : null;
    const ready = joined.map(row => ({ ...row, selected: row.selected ?? select(row, floors) }));
    const summarize = (key, values) => {
      const bySplit = Object.fromEntries(['dev', 'test', 'second'].map(split =>
        [split, quality(values.filter(row => row.split === split))]));
      const demos = values.filter(row => row.split === 'hero').map(({ id, relevant, selected }) => ({
        id, relevant, selected, exact: relevant.length === selected.length && relevant.every(x => selected.includes(x)),
      }));
      const timed = values.filter(row => row.split !== 'dev');
      const fallback = timed.filter(row => row.routed).map(row => ({ ms: row.reasonerMs }));
      output.runs[key] = { ...performance, floors, precisionFloors, ...bySplit, demos,
        latency: latency(timed), firstDraftMs: predictions[0].ms,
        routed: Object.fromEntries(['dev', 'test', 'second', 'hero'].map(split => [split,
          values.filter(row => row.split === split && row.routed).length])),
        inferenceLatency: timed.some(row => row.inferred) ? latency(timed.filter(row => row.inferred)) : null,
        reasonerLatency: fallback.length ? latency(fallback) : null,
        invalid: values.filter(row => row.invalid).length };
      for (const row of timed) {
        assert(row.selected?.length <= 2);
        assert(row.selected.every(id => vaults[row.vault].some(entry => entry.id === id)));
        lines.push([engine, key.slice(engine.length + 1), row.split, row.id, row.lang, row.relevant.join(','),
          row.selected.join(','), Number(!!row.routed), Number(!!row.invalid), row.ms.toFixed(3)].join('\t'));
      }
    };
    summarize(name, ready);
    if (method === 'minilm' && engine === 'chromium') {
      summarize(name + '-band-abstain', ready.map(row => ({
        ...row, selected: row.unsure?.length ? row.certain.map(slot => row.entryIds[slot]) : row.selected,
      })));
    }
    if (precisionFloors && String(precisionFloors) !== String(floors)) {
      const key = name + '-precision';
      summarize(key, ready.map(row => ({ ...row, selected: select(row, precisionFloors) })));
      output.runs[key].floors = precisionFloors;
    }
  }
}
await writeFile('results.json', JSON.stringify(output, null, 2) + '\n');
await writeFile('predictions.tsv', lines.join('\n') + '\n');
