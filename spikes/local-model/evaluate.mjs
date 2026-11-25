function rank(scores, memory) {
  if (scores.length !== memory.length || !scores.every(Number.isFinite)) return [];
  return scores.map((score, index) => ({ score, id: memory[index].id }))
    .sort((a, b) => b.score - a.score || a.id.localeCompare(b.id)).slice(0, 2);
}

const select = (ranked, floors) => ranked.filter(({ score }, index) => score >= floors[index]).map(({ id }) => id);

export const pick = (scores, memory, floors) => select(rank(scores, memory), floors);

export function metrics(rows) {
  let tp = 0;
  let fp = 0;
  let fn = 0;
  let picksOnNegative = 0;
  let negatives = 0;
  let exact = 0;
  for (const { relevant, selected } of rows) {
    const correct = selected.filter(id => relevant.includes(id)).length;
    tp += correct;
    fp += selected.length - correct;
    fn += relevant.length - correct;
    if (!relevant.length) {
      negatives++;
      picksOnNegative += Number(selected.length > 0);
    }
    exact += Number(correct === selected.length && correct === relevant.length);
  }
  const precision = tp / (tp + fp) || 0;
  const recall = tp / (tp + fn) || 0;
  const f = beta => (1 + beta ** 2) * precision * recall / (beta ** 2 * precision + recall) || 0;
  return { drafts: rows.length, tp, fp, fn, precision, recall, f1: f(1), f05: f(0.5), negatives, picksOnNegative, exact };
}

export function joinRows(rows, drafts) {
  const byId = new Map(drafts.map(draft => [draft.id, draft]));
  return rows.map(row => ({ ...byId.get(row.id), ...row }));
}

export function calibrate(rows, memory, precisionGate) {
  const grid = [...Array.from({ length: 101 }, (_, i) => i / 100), 1.01];
  const ranked = rows.map(row => ({ ...row, top: rank(row.scores, memory) }));
  let best;
  for (const first of grid) {
    for (const second of grid.filter(value => value >= first)) {
      const picks = ranked.map(row => ({ ...row, selected: select(row.top, [first, second]) }));
      if (precisionGate && Object.values(byLanguage(picks)).some(({ precision, tp, fp }) =>
        precision < precisionGate.minimumPrecision || tp + fp < precisionGate.minimumPicks)) continue;
      const scores = metrics(picks);
      const ranks = [scores.f05, scores.precision, first + second];
      const differing = best && ranks.findIndex((value, index) => value !== best.ranks[index]);
      if (!best || (differing >= 0 && ranks[differing] > best.ranks[differing])) best = { ranks, floors: [first, second] };
    }
  }
  return best?.floors;
}

export function latency(rows) {
  const values = rows.map(row => row.ms).sort((a, b) => a - b);
  const percentile = p => values[Math.ceil(values.length * p) - 1];
  return { firstMs: rows[0].ms, p50Ms: percentile(0.5), p95Ms: percentile(0.95) };
}

export const byLanguage = rows => Object.fromEntries(['en', 'de'].map(lang =>
  [lang, metrics(rows.filter(row => row.lang === lang))]));

export function sliceCounts(rows, memory) {
  const requiresAsk = new Set(memory.filter(entry => entry.policy === 'ask').map(entry => entry.id));
  const protectedLabels = rows.flatMap(row => row.relevant.filter(id => requiresAsk.has(id))).length;
  const protectedSelected = rows.flatMap(row => row.selected.filter(id => requiresAsk.has(id))).length;
  const protectedCorrect = rows.flatMap(row => row.selected.filter(id => requiresAsk.has(id) && row.relevant.includes(id))).length;
  const adversarial = rows.filter(row => row.category === 'adversarial');
  return { protectedLabels, protectedSelected, protectedCorrect,
    adversarialDrafts: adversarial.length, adversarialPicks: adversarial.filter(row => row.selected.length).length };
}
