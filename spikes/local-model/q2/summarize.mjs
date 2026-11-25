import { createHash } from 'node:crypto';
import { readFile, stat, writeFile } from 'node:fs/promises';
import { cpus } from 'node:os';
import { byLanguage, latency, metrics } from '../evaluate.mjs';
import { audit } from './filter-audit.mjs';
import { band, fallback, join, load, setup } from './experiment.mjs';
import { modelDir, modelFiles } from './encoder.mjs';
import { reasoners } from './reasoners.mjs';
import { mapSlots, rankSlots, shouldAbstain } from './selection.mjs';

const cache = '.cache/q2';
const save = (name, json) => writeFile(`q2/${name}.json`, JSON.stringify(json, null, 2) + '\n');
const pack = async file => JSON.parse((await readFile(`${cache}/${file}`, 'utf8')).trimEnd().split('\n').at(-1));
const sum = async files => (await Promise.all(files.map(async file => (await stat(file)).size))).reduce((a, b) => a + b, 0);

function summaries(rows, detailed = false) {
  const sections = {};
  for (const split of ['dev', 'test', 'hero', 'transfer']) {
    const group = rows.filter(row => row.split === split);
    if (!group.length) continue;
    const categories = [...new Set(group.map(row => row.category))].sort();
    sections[split] = {
      all: metrics(group), language: byLanguage(group),
      category: detailed && split === 'test' ? Object.fromEntries(categories.map(category =>
        [category, byLanguage(group.filter(row => row.category === category))])) : undefined,
      latency: group.every(row => Number.isFinite(row.ms)) ? latency(group) : undefined,
      unsafePicks: group.filter(row => row.category === 'adversarial' && row.selected.length).length,
    };
  }
  return sections;
}

function classifierResult({ data, rows, pred, suggest, automatic, autoGate }) {
  const byEntry = Object.values(data.entries).flat();
  const assignment = values => ({
    total: values.length, correct: values.filter(entry => entry.assigned.slot === entry.slot).length,
    wrong: values.filter(entry => entry.assigned.slot !== '-' && entry.assigned.slot !== entry.slot).length,
    unassigned: values.filter(entry => entry.assigned.slot === '-').length,
    keptUnknown: values.filter(entry => entry.slot === '-' && entry.assigned.slot === '-').length,
    templates: values.filter(entry => entry.assigned.source === 'template').length,
    modelLatency: latency(values.filter(entry => entry.assigned.source !== 'template' && !shouldAbstain(entry.text))),
  });
  return {
    beforeBytes: data.beforeBytes, peakBytes: data.peakBytes, coldMs: data.coldMs,
    floors: { suggest, automatic, autoGate },
    assignment: Object.fromEntries([['all', byEntry], ...Object.entries(data.entries)].map(([key, values]) => [key, assignment(values)])),
    assignedEntries: byEntry.map(({ id, slot, assigned }) => ({ id, gold: slot, ...assigned })),
    oracle: summaries(rows.map(row => pred(row, suggest, false, true, true))),
    withoutGuard: summaries(rows.map(row => pred(row, suggest, false, false))),
    automaticDiagnostic: summaries(rows.map(row => pred(row, automatic ?? suggest, true))),
  };
}

function reasonerResult({ rows, ...runtime }, predictions) {
  return {
    ...runtime,
    invalid: rows.filter(row => !row.valid).length,
    abstained: rows.filter(row => row.slots.length === 0).length,
    quality: summaries(predictions, true),
  };
}

const a = await setup();
const compact = await setup('static-slots');
const b = await Promise.all(Object.keys(reasoners).map(load));
const cascade = await load('cascade');
const { rows: baseline, entries: baselineEntries } = await audit();
const baselineById = new Map(baseline.map(row => [row.id, row]));
const cascaded = new Map(cascade.rows.map(row => [row.id, row]));
const mapped = {};
for (const raw of b) {
  mapped[raw.name] = join(raw.rows).map(row => ({ ...row, selected: mapSlots(row.slots, a.gold[row.vault]) }));
}
const cascadePred = a.rows.map(row => {
  const { certain, unsure } = a.confidence.get(row.id);
  const used = cascaded.get(row.id);
  if (Boolean(unsure.length) !== Boolean(used) || used?.slots.some(slot => !unsure.includes(slot))) {
    throw new Error(`Incorrect cascade routing on ${row.id}.`);
  }
  return {
    ...row, selected: mapSlots([...certain, ...(used?.slots ?? [])], a.entries[row.vault]),
    ms: row.ms + (used?.ms ?? 0),
  };
});
const miniPred = a.rows.map(row => a.pred(row, a.suggest));
const compactPred = compact.rows.map(row => compact.pred(row, compact.suggest));
const automaticPred = a.rows.map(row => a.pred(row, a.automatic ?? [1.01, 1.01], true));
const results = {
  machine: { cpu: cpus()[0]?.model, logicalCores: cpus().length, platform: process.platform,
    arch: process.arch, node: process.version },
  training: Object.fromEntries(await Promise.all(['request', 'save'].map(async mode => {
    const rows = await load(`${mode}-train`);
    return [mode, { rows: rows.length, negatives: rows.filter(row => !row.labels.length).length,
      multilabel: rows.filter(row => row.labels.length > 1).length,
      en: rows.filter(row => row.lang === 'en').length, de: rows.filter(row => row.lang === 'de').length }];
  }))),
  baseline: {
    keywords: summaries(join(baseline), true),
    browser: summaries(join(baseline).map(row => ({ ...row, selected: row.browser })), true),
    entryAudit: baselineEntries,
  },
  minilm: {
    ...classifierResult(a), quality: summaries(miniPred, true),
    graphBytes: await sum(modelFiles.map(file => `${modelDir}/${file}`)),
    headBytes: await sum(['request', 'save'].map(mode => `${cache}/${mode}-int8.onnx`)),
    package: await pack('package.log'),
  },
  static: {
    ...classifierResult(compact), quality: summaries(compactPred, true),
    headBytes: await sum(['request', 'save'].map(mode => `${cache}/${mode}-static.onnx`)),
    weightBytes: await sum(['request', 'save'].map(mode => `${cache}/${mode}-static.bin`)),
    package: await pack('static-package.log'),
  },
  reasoners: Object.fromEntries(b.map(raw => [
    raw.name, { ...reasoners[raw.name], ...reasonerResult(raw, mapped[raw.name]) },
  ])),
  cascade: {
    band, fallback, ...reasonerResult(cascade, cascadePred),
    calls: Object.fromEntries(['dev', 'test', 'hero', 'transfer'].map(split =>
      [split, a.rows.filter(row => row.split === split && cascaded.has(row.id)).length])),
    fallbackLatency: latency(cascade.rows.filter(row => a.rows.find(draft => draft.id === row.id).split === 'test')),
    combinedPeakRssUpperBoundBytes: a.data.peakBytes + cascade.peakBytes,
  },
};

const fingerprints = Object.fromEntries(await Promise.all(['request-int8.onnx', 'save-int8.onnx',
  'request-static.onnx', 'save-static.onnx'].map(async file =>
  [file, createHash('sha256').update(await readFile(`${cache}/${file}`)).digest('hex')])));
await save('results', { ...results, fingerprints });

const methods = [miniPred, compactPred, ...Object.values(mapped), cascadePred, automaticPred]
  .map(rows => new Map(rows.map(row => [row.id, row.selected])));
const header = ['id', 'split', 'category', 'expected', 'keywords', 'browser', 'minilm', 'static',
  ...Object.keys(reasoners), 'cascade', 'auto_gate', 'fallback_called', 'minilm_top_slots'].join('\t');
const fmt = values => values?.join(',') || '-';
const predictions = a.rows.map(row => {
  const old = baselineById.get(row.id);
  const top = rankSlots(row.scores, [...a.entries[row.vault].keys()]).slice(0, 2)
    .map(({ slot, score }) => `${slot}:${score.toFixed(4)}`);
  return [row.id, row.split, row.category, fmt(row.relevant), fmt(old?.selected), fmt(old?.browser),
    ...methods.map(method => fmt(method.get(row.id))), Number(cascaded.has(row.id)), fmt(top)].join('\t');
});
await writeFile('q2/predictions.tsv', [header, ...predictions].join('\n') + '\n');
