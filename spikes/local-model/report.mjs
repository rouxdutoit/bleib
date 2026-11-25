import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';
import { cpus, release, totalmem } from 'node:os';
import { candidates } from './candidates.mjs';
import { drafts, memory } from './corpus.mjs';
import { loadWallet, runBaseline } from './baseline.mjs';
import { byLanguage, calibrate, joinRows, latency, pick, sliceCounts } from './evaluate.mjs';
import { previewDecision } from './policy.mjs';

const [packageMeasurements] = process.argv.slice(2);
if (!packageMeasurements) throw new Error('Pass the measured desktop payload JSON.');

const read = async filename => JSON.parse(await readFile(filename, 'utf8'));
const cache = name => read(`.cache/${name}.json`);
const mib = n => Math.round(n / (2 ** 20) * 10) / 10;
const testRows = rows => rows.filter(row => row.split === 'test');
const wallet = await loadWallet();
const entries = new Map(memory.map(entry => [entry.id, entry]));
const grant = { introduced: true, automatic: true };

function quality(rows) {
  const auto = rows.map(row => ({ ...row, selected: row.selected.filter(id =>
    previewDecision(entries.get(id), wallet, grant) === 'automatic') }));
  const lisbon = Object.fromEntries(rows.filter(row => row.id.startsWith('S25-')).map(row => [
    row.lang, row.selected,
  ]));
  const measured = {
    ...byLanguage(rows), ...sliceCounts(rows, memory), lisbon,
    hypotheticalAutomaticPicks: auto.reduce((sum, row) => sum + row.selected.length, 0),
    hypotheticalIrrelevantAutomaticPicks: auto.reduce((sum, row) =>
      sum + row.selected.filter(id => !row.relevant.includes(id)).length, 0),
  };
  return measured;
}

function runtime(run, modelRows) {
  return {
    loadMs: run.loadMs, indexMs: run.indexMs, ...latency(run.rows),
    peakRssMiB: mib(run.peakRss), peakRssDeltaMiB: mib(run.peakRss - run.baselineRss),
    ...(run.maxRss ? { processHighWaterRssMiB: mib(run.maxRss) } : {}),
    ...(run.diagnostics ? {
      version: run.version,
      browserZipBytes: run.zipBytes,
      offline: run.diagnostics.offline,
      extensionScheme: run.diagnostics.origin.split(':')[0],
      bundledResources: run.diagnostics.resources.map(url => new URL(url).pathname),
      remoteRequestCount: run.network.length,
      cspViolationCount: run.diagnostics.violations.length,
      nano: run.diagnostics.nano,
      testPredictionMismatchesVsNode: modelRows,
    } : {}),
  };
}

const baselineRun = await runBaseline();
const baselineRows = testRows(joinRows(baselineRun.rows, drafts));
const baseline = {
  ms: latency(baselineRun.rows),
  walletProject: quality(baselineRows),
  rawRelevance: quality(baselineRows.map(row => ({ ...row, selected: row.raw }))),
  browserProjection: quality(baselineRows.map(row => ({ ...row, selected: row.browser }))),
};
const packages = await read(packageMeasurements);
const policies = {};
const predictions = Object.fromEntries(baselineRows.map(row => [
  row.id, { keywords: row.selected, browser: row.browser },
]));
for (const [name, config] of Object.entries(candidates)) {
  const assets = await cache(`${name}-assets`);
  const modelBytes = Object.values(assets).reduce((sum, asset) => sum + asset.bytes, 0);
  const node = await cache(`node-${name}`);
  const nodeRows = node.error ? [] : joinRows(node.rows, drafts);
  const development = nodeRows.filter(row => row.split === 'dev');
  const floors = node.error ? undefined : calibrate(development, memory);
  const precisionGate = node.error ? undefined :
    calibrate(development, memory, { minimumPrecision: 0.9, minimumPicks: 8 }) ?? null;
  const select = row => ({ ...row, selected: pick(row.scores, memory, floors) });
  const rankedNode = testRows(nodeRows).map(select);
  for (const row of rankedNode) predictions[row.id][name] = row.selected;
  const runtimes = {};
  for (const engine of ['node', 'chromium', 'firefox']) {
    const run = await cache(`${engine}-${name}`);
    if (run.error) {
      runtimes[engine] = {
        error: run.error.split('\n').find(line => line.startsWith('Error:')) ?? run.error.split('\n')[0],
        ...(run.zipBytes ? { browserZipBytes: run.zipBytes } : {}),
      };
      continue;
    }
    assert(floors, `No Node calibration for a successful ${engine} run of ${name}.`);
    const ranked = testRows(joinRows(run.rows, drafts)).map(select);
    const differs = ranked.filter((row, index) => row.selected.join(',') !== rankedNode[index].selected.join(',')).length;
    runtimes[engine] = { ...runtime(run, differs), quality: quality(ranked) };
  }
  policies[name] = { ...config, assets, modelBytes, ...packages[name], floors, calibration90PercentAtEightPicksPerLanguage: precisionGate, runtimes };
}
const assets = {};
for (const file of ['drafts.tsv', 'memories.tsv']) {
  assets[file] = createHash('sha256').update(await readFile(`data/${file}`)).digest('hex');
}
await writeFile('results.json', JSON.stringify({
  environment: {
    baselineRevision: execFileSync('git', ['log', '-1', '--format=%H', '--', 'wallet/src'], { encoding: 'utf8' }).trim(),
    node: process.version, platform: `${process.platform}/${process.arch}`, kernel: release(),
    cpu: cpus()[0].model, logicalCpus: cpus().length, ramMiB: mib(totalmem()),
    fixtures: assets,
  },
  baseline,
  candidates: policies,
}, null, 2) + '\n');
const modelNames = Object.keys(candidates).filter(name => !policies[name].runtimes.node.error);
const columns = ['id', 'keywords', 'browser', ...modelNames];
await writeFile('predictions.tsv', columns.join('\t') + '\n' + Object.entries(predictions)
  .map(([id, row]) => [id, ...columns.slice(1).map(name => row[name].join(',') || '-')].join('\t'))
  .join('\n') + '\n');
