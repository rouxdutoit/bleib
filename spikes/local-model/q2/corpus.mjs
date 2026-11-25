import { readFileSync } from 'node:fs';
import { drafts, memory } from '../corpus.mjs';

export function tsv(file) {
  const [header, ...rows] = readFileSync(new URL(file, import.meta.url), 'utf8').trimEnd()
    .split('\n').map(line => line.split('\t'));
  return rows.map(fields => {
    if (fields.length !== header.length) throw new Error(`Invalid row in ${file}: ${fields[0]}`);
    return Object.fromEntries(header.map((key, index) => [key, fields[index]]));
  });
}

export const slots = tsv('slots.tsv');
export const slotIds = slots.map(({ id }) => id);
const labels = new Map(tsv('entry-labels.tsv').map(({ id, slot }) => [id, slot]));
const extra = tsv('held-out-entries.tsv');
export const vaults = {
  original: memory.map(entry => ({ ...entry, slot: labels.get(entry.id) })),
  hero: extra.filter(entry => entry.vault === 'hero'),
  transfer: extra.filter(entry => entry.vault === 'transfer'),
};

export const requests = [
  ...drafts.map(draft => ({ ...draft, vault: 'original' })),
  ...tsv('held-out-drafts.tsv').flatMap(({ id, vault, category, relevant, en, de }) =>
    Object.entries({ en, de }).map(([lang, text]) => ({
      id: `${id}-${lang}`, vault, category, lang, text, split: vault,
      relevant: relevant === '-' ? [] : relevant.split(','),
    }))),
];
