import { mapSlots } from '../q2/selection.mjs';
import { open as openClassifier } from './classifier.mjs';
import { choose, knownFloors, ranked, route } from './pick.mjs';
import { open as openReasoner } from './wllama.mjs';

export async function open(name) {
  const [classifier, reasoner] = await Promise.all([openClassifier('minilm'), openReasoner(name)]);
  return {
    index: classifier.index,
    async pick(row, available, descriptions) {
      const ranking = ranked({ scores: await classifier.score(row.text) }, available);
      const { certain, unsure } = route(ranking, knownFloors);
      if (!unsure.length) {
        return { selected: mapSlots(choose(ranking, knownFloors), available), routed: false };
      }
      const candidates = new Map(unsure.map(slot => [slot, available.get(slot)]));
      const start = performance.now();
      const choice = await reasoner.pick(row, candidates, descriptions);
      return {
        ...choice, selected: [...mapSlots(certain, available), ...choice.selected],
        routed: true, reasonerMs: performance.now() - start,
      };
    },
  };
}
