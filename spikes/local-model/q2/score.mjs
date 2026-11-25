import { writeFile } from 'node:fs/promises';
import { requests, slotIds, vaults } from './corpus.mjs';
import { assignSlot, saveRule, shouldAbstain } from './selection.mjs';
import { features, openStaticHead } from './subwords.mjs';

const rss = () => process.memoryUsage.rss();
const beforeBytes = rss();
let peakBytes = beforeBytes;

const start = performance.now();
const compact = process.argv[2] === 'static';
const { openEncoder, openHead } = compact ? {} : await import('./encoder.mjs');
const encoder = compact ? { encode: features } : await openEncoder();
const open = compact ? mode => openStaticHead(mode, slotIds.length) : openHead;
const [requestsHead, saveHead] = await Promise.all([open('request'), open('save')]);
const coldMs = performance.now() - start;
const sample = setInterval(() => { peakBytes = Math.max(peakBytes, rss()); }, 10);

try {
  const entries = {};
  for (const [vault, values] of Object.entries(vaults)) {
    entries[vault] = [];
    for (const entry of values) {
      const start = performance.now();
      const scores = saveRule(entry.text) || shouldAbstain(entry.text) ? undefined :
        await saveHead.score(await encoder.encode(entry.text));
      entries[vault].push({ ...entry, assigned: assignSlot(entry.text, scores), ms: performance.now() - start });
    }
  }
  const rows = [];
  for (const draft of requests) {
    const start = performance.now();
    const scores = await requestsHead.score(await encoder.encode(draft.text));
    rows.push({ id: draft.id, scores, ms: performance.now() - start });
    peakBytes = Math.max(peakBytes, rss());
  }
  await writeFile(`.cache/q2/${compact ? 'static-slots' : 'slots'}.json`, JSON.stringify({ beforeBytes, peakBytes, coldMs, entries, rows }));
} finally {
  clearInterval(sample);
  await Promise.all([saveHead.release?.(), requestsHead.release?.(), encoder.release?.()]);
}
