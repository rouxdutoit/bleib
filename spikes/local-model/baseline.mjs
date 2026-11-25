import { mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';
import { build } from 'esbuild';
import { drafts, memory } from './corpus.mjs';

export async function loadWallet() {
  await mkdir('.cache', { recursive: true });
  const path = resolve('.cache/wallet-baseline.mjs');
  await build({
    stdin: { contents: `
      export { project } from '../../wallet/src/memory.ts';
      export { draftProjection } from '../../wallet/src/browser-memory.ts';
      export { kinds, sensitiveKind } from '../../wallet/src/domain.ts';
      export { relevance, safeExcerpt } from '../../wallet/src/local-memory.ts';
    `, resolveDir: process.cwd(), sourcefile: 'wallet-baseline.mjs' },
    outfile: path, bundle: true, platform: 'node', format: 'esm', target: 'node20',
    packages: 'external',
  });
  return import(path);
}

export async function runBaseline() {
  let start = performance.now();
  const { project, relevance, kinds, draftProjection } = await loadWallet();
  const loadMs = performance.now() - start;
  const entries = new Map(memory.map(entry => [entry.id, { ...entry, version: 1, sensitive: entry.policy === 'ask' }]));
  const store = { entries, privateKinds: new Set(), readEntry: async entry => entry.text };
  const rows = [];
  for (const draft of drafts) {
    start = performance.now();
    const projected = await project(store, { kinds, purpose: 'Local relevance benchmark', question: draft.text }, 0);
    const ms = performance.now() - start;
    const raw = memory.filter(entry => relevance(draft.text, entry.text, entry.kind)).map(entry => entry.id);
    const browser = draftProjection(projected, draft.lang).entries.map(entry => entry.id);
    rows.push({ id: draft.id, selected: projected.entries.map(entry => entry.id), raw, browser, ms });
  }
  return { loadMs, rows };
}
