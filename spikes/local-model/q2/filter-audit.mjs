import { pathToFileURL } from 'node:url';
import { runBaseline, loadWallet } from '../baseline.mjs';
import { requests, vaults } from './corpus.mjs';

export async function audit() {
  const { draftProjection, safeExcerpt } = await loadWallet();
  const { rows } = await runBaseline();
  const byId = new Map(rows.map(row => [row.id, row]));
  const draftRows = requests.filter(draft => draft.split === 'test');
  const projection = entry => draftProjection({
    content: entry.text, entries: [{ id: entry.id, version: 1 }],
    releasedKinds: [entry.kind], sensitiveKinds: entry.policy === 'ask' ? [entry.kind] : [],
  });
  const entries = vaults.original.map(entry => ({
    id: entry.id, browserSafe: Boolean(projection(entry).content), autoSafe: safeExcerpt(entry.text, entry.kind),
    selectedCorrect: draftRows.filter(draft => draft.relevant.includes(entry.id) && byId.get(draft.id).selected.includes(entry.id)).length,
    selectedWrong: draftRows.filter(draft => !draft.relevant.includes(entry.id) && byId.get(draft.id).selected.includes(entry.id)).length,
  }));
  return { entries, rows: draftRows.map(draft => ({ ...byId.get(draft.id), relevant: draft.relevant })) };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const { entries, rows } = await audit();
  console.table(entries.filter(row => row.browserSafe || row.selectedCorrect));
  console.log('Retained browser picks:', rows.filter(row => row.browser.length)
    .map(row => [row.id, row.browser.join(',')]).join(' '));
}
