import { readFile } from 'node:fs/promises';
import { loadWallet } from '../baseline.mjs';
import { byLanguage, metrics } from '../evaluate.mjs';
import { previewDecision } from '../policy.mjs';
import { requests, vaults } from './corpus.mjs';
import { entriesBySlot, mapSlots, selectSlots, splitConfidence } from './selection.mjs';

export const load = async name => JSON.parse(await readFile(`.cache/q2/${name}.json`, 'utf8'));
export const band = 0.12;
export const fallback = 'qwen-1.7b';
const assumedGrant = { introduced: true, automatic: true };

const ids = new Map(requests.map(request => [request.id, request]));
export const join = rows => rows.map(row => {
  const request = ids.get(row.id);
  if (!request) throw new Error(`Unknown draft ${row.id}.`);
  return { ...request, ...row };
});

function thresholdGrid() {
  const steps = [...Array.from({ length: 51 }, (_, index) => index / 50), 1.01];
  return steps.flatMap(first => steps.filter(second => second >= first).map(second => [first, second]));
}

function better(a, b) {
  const difference = a.findIndex((value, index) => value !== b[index]);
  return difference !== -1 && a[difference] > b[difference];
}

export function calibrateDrafts(dev, predict, gate) {
  let best;
  for (const floors of thresholdGrid()) {
    const rows = dev.map(row => predict(row, floors));
    if (gate && Object.values(byLanguage(rows)).some(({ tp, fp, precision }) =>
      tp + fp < gate.minimumPicks || precision < gate.minimumPrecision)) continue;
    const { f05, precision } = metrics(rows);
    const rank = [f05, precision, floors[0] + floors[1], floors[0]];
    if (!best || better(rank, best.rank)) best = { floors, rank };
  }
  return best?.floors ?? null;
}

export async function setup(name = 'slots') {
  const [data, wallet] = await Promise.all([load(name), loadWallet()]);
  const rows = join(data.rows);
  const annotated = entries => entries.map(entry => ({
    ...entry, automatic: previewDecision(entry, wallet, assumedGrant) === 'automatic',
  }));
  const entries = {};
  const gold = {};
  const automaticLabels = {};
  for (const [vault, values] of Object.entries(data.entries)) {
    entries[vault] = entriesBySlot(annotated(values.map(entry => ({ ...entry, slot: entry.assigned.slot }))));
    const goldEntries = annotated(vaults[vault]);
    gold[vault] = entriesBySlot(goldEntries);
    automaticLabels[vault] = new Set(goldEntries.filter(entry => entry.automatic).map(entry => entry.id));
  }
  const pred = (row, floors, automatic = false, guarded = true, oracle = false) => {
    const available = (oracle ? gold : entries)[row.vault];
    const slots = selectSlots(row, available, floors, automatic, guarded);
    return { ...row, selected: mapSlots(slots, available),
      relevant: automatic ? row.relevant.filter(id => automaticLabels[row.vault].has(id)) : row.relevant };
  };
  const dev = rows.filter(row => row.split === 'dev');
  const suggest = calibrateDrafts(dev, pred);
  const autoGate = { minimumPrecision: 0.90, minimumPicks: 3 };
  const automatic = calibrateDrafts(dev, (row, floors) => pred(row, floors, true), autoGate);
  const confidence = new Map(rows.map(row => [row.id, splitConfidence(row, entries[row.vault], suggest, band)]));
  return { data, rows, entries, gold, automaticLabels, pred, suggest, automatic, autoGate, confidence };
}
