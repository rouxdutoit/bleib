import { entriesBySlot, mapSlots } from '../q2/selection.mjs';
import { blocked, choose, knownFloors, ranked, route } from './pick.mjs';

const violations = [];
addEventListener('securitypolicyviolation', event => violations.push(event.blockedURI));
const now = () => performance.now();

globalThis.runBenchmark = async (module, name, corpus) => {
  const { rows, vaults, slots, profiles } = corpus;
  const { open } = await import(new URL(`./${module}.js`, location.href).href);
  const start = now();
  const runner = await open(name, slots, {
    floors: [0.37, 0.53], compact: module === 'wllama' && name === 'qwen35' && rows.length > 6,
  });
  const coldMs = now() - start;
  const indexes = {};
  const indexStart = now();
  for (const [id, entries] of Object.entries(vaults)) {
    indexes[id] = await runner.index?.(entries, slots) ?? entriesBySlot(entries);
  }
  const indexMs = now() - indexStart;
  const descriptions = Object.fromEntries(['en', 'de'].map(lang =>
    [lang, new Map(slots.map(slot => [slot.id, slot[lang]]))]));
  const output = [];
  for (const row of rows) {
    const start = now();
    const available = indexes[row.vault];
    let measured;
    if (module === 'baseline') measured = { selected: row.text.trim() ? profiles[row.vault] : [] };
    else if (blocked(row.text)) measured = { selected: [] };
    else if (runner.pick) measured = await runner.pick(row, available, descriptions[row.lang]);
    else {
      const ranking = ranked({ scores: await runner.score(row.text) }, available);
      measured = { ranking, entryIds: Object.fromEntries([...available].map(([key, value]) => [key, value.id])) };
      if (name === 'minilm') {
        const { certain, unsure } = route(ranking, knownFloors);
        measured = { ...measured, certain, unsure,
          selected: mapSlots(choose(ranking, knownFloors), available) };
      }
    }
    const ms = now() - start;
    const inferred = module !== 'baseline' && !blocked(row.text);
    output.push({ id: row.id, ...measured, ms, inferred });
    if (runner.pick && output.length % 25 === 0) {
      console.log(`[run-v] ${name}: ${output.length}/${rows.length} drafts scored`);
    }
  }
  const nano = {};
  if (module === 'baseline') {
    for (const lang of ['en', 'de']) {
      const languages = [{ type: 'text', languages: [lang] }];
      nano[lang] = await globalThis.LanguageModel?.availability({
        expectedInputs: languages, expectedOutputs: languages,
      }).catch(error => String(error)) ?? 'No Prompt API';
    }
  }
  const control = rows.length === 1 ? await runner.control?.() : undefined;
  return {
    coldMs, indexMs, output,
    diagnostics: { control, nano, origin: location.origin, runtimeId: globalThis.chrome?.runtime?.id ?? globalThis.browser?.runtime?.id,
      isolated: crossOriginIsolated, violations,
      resources: performance.getEntriesByType('resource').map(entry => entry.name) },
  };
};

// Firefox's temporary add-on harness cannot navigate Playwright directly to the extension origin.
if (location.protocol === 'moz-extension:') {
  addEventListener('message', async event => {
    if (event.source !== parent || event.origin !== 'http://127.0.0.1' || !Array.isArray(event.data?.args)) return;
    try {
      const result = await globalThis.runBenchmark(...event.data.args);
      parent.postMessage({ result }, event.origin);
    } catch (error) {
      parent.postMessage({ error: String(error) }, event.origin);
    }
  });
}
