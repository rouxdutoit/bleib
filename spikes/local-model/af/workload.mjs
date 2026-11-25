import assert from 'node:assert/strict';
import { rows, vaults } from '../v/corpus.mjs';
import { byLanguage, latency, metrics } from '../evaluate.mjs';

export const warmup = 'Can you help me plan a quick dinner after work?';
const inputRows = split => rows.filter(row => (split === 'dev') === (row.split === 'dev'))
  .map(({ id, text, vault }) => ({ id, text, vault }));
export const devInput = inputRows('dev');
export const testInput = inputRows('held-out');
export const indexVaults = Object.fromEntries(Object.entries(vaults).map(([vault, entries]) =>
  [vault, entries.map(({ id, text }) => ({ id, text }))]));

function join(predictions, cases) {
  assert.equal(predictions.length, cases.length);
  return predictions.map((prediction, index) => {
    assert.equal(prediction.id, cases[index].id);
    return { ...cases[index], ...prediction };
  });
}

const select = (row, floors) => ({
  ...row, selected: row.top.filter(({ score }, index) => score >= floors[index]).map(({ id }) => id),
});

export function calibrate(predictions) {
  const dev = join(predictions, rows.filter(row => row.split === 'dev'));
  const grid = [...Array.from({ length: 51 }, (_, i) => i / 50), 1.01];
  let best;
  let gated;
  for (const first of grid) {
    for (const second of grid.filter(value => value >= first)) {
      const floors = [first, second];
      const picks = dev.map(row => select(row, floors));
      const { precision, f05 } = metrics(picks);
      const score = [f05, precision, first + second, first];
      const better = old => {
        if (!old) return true;
        const changed = score.findIndex((value, index) => old.score[index] !== value);
        return changed !== -1 && score[changed] > old.score[changed];
      };
      const candidate = { score, floors };
      if (better(best)) best = candidate;
      if (better(gated) && Object.values(byLanguage(picks)).every(result =>
        result.precision >= 0.9 && result.tp + result.fp >= 8)) gated = candidate;
    }
  }
  return { floors: (gated ?? best).floors, passedDevPrecisionGate: !!gated };
}

function quality(drafts) {
  const blank = drafts.filter(row => !row.text.trim());
  return {
    ...metrics(drafts), byLanguage: byLanguage(drafts), blank: blank.length,
    blankOffers: blank.filter(row => row.selected.length).length,
  };
}

export const scoreDev = (predictions, floors) =>
  quality(join(predictions, rows.filter(row => row.split === 'dev')).map(row => select(row, floors)));

export function summarize(predictions, floors) {
  const ready = join(predictions, rows.filter(row => row.split !== 'dev')).map(row => select(row, floors));
  return {
    original: quality(ready.filter(row => row.split === 'test')),
    fresh: quality(ready.filter(row => row.split === 'second')),
    demos: ready.filter(row => row.split === 'hero').map(({ id, relevant, selected }) => ({
      id, relevant, selected, exact: relevant.length === selected.length && relevant.every(x => selected.includes(x)),
    })),
    latency: latency(ready),
    inferenceLatency: latency(ready.filter(row => row.inferred)),
    predictions: ready.map(({ id, top, selected, inferred, ms }) => ({ id, top, selected, inferred, ms })),
  };
}
