import { entriesBySlot, mapSlots } from '../q2/selection.mjs';
import { blocked, choose, knownFloors, ranked, route } from '../v/pick.mjs';
import { usePicker } from '../v/reasoner.mjs';

export const asPicker = usePicker;

export function cascadePicker(classifier, reasoner) {
  return {
    index: classifier.index,
    async pick(row, available, descriptions) {
      const ranking = ranked({ scores: await classifier.score(row.text) }, available);
      const { certain, unsure } = route(ranking, knownFloors);
      if (!unsure.length) return { selected: mapSlots(choose(ranking, knownFloors), available) };

      const shortlist = new Map(unsure.map(slot => [slot, available.get(slot)]));
      const start = performance.now();
      const choice = await reasoner.pick(row, shortlist, descriptions);
      return {
        selected: [...mapSlots(certain, available), ...choice.selected],
        invalid: choice.invalid,
        routed: true,
        reasonerMs: performance.now() - start,
      };
    },
  };
}

export async function scoreDrafts({ rows, slots, vaults }, picker, record, progress = () => {}) {
  const indexStart = performance.now();
  const indexes = {};
  for (const [id, entries] of Object.entries(vaults)) {
    indexes[id] = await (picker.index ?? entriesBySlot)(entries);
  }
  const indexMs = performance.now() - indexStart;
  const descriptions = Object.fromEntries(['en', 'de'].map(lang =>
    [lang, new Map(slots.map(slot => [slot.id, slot[lang]]))]));
  for (const [i, row] of rows.entries()) {
    const available = indexes[row.vault];
    const inferred = !blocked(row.text) && available.size > 0;
    const start = performance.now();
    const result = inferred ? await picker.pick(row, available, descriptions[row.lang]) : { selected: [] };
    await record({ id: row.id, ...result, ms: performance.now() - start, inferred });
    progress(`${i + 1}/${rows.length} · ${row.id}${result.routed ? ' · routed' : ''}`);
  }
  return { indexMs };
}
