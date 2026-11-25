import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import assert from 'node:assert/strict';
import { requests, vaults as priorVaults, slots } from '../q2/corpus.mjs';

function read(name, expectedDigest) {
  // A quoted empty field preserves the frozen literal blank without a trailing tab in Git.
  const text = readFileSync(new URL(name, import.meta.url), 'utf8')
    .replace(/\t""(?=\n|$)/gu, '\t');
  assert.equal(createHash('sha256').update(text).digest('hex'), expectedDigest);
  const [header, ...lines] = text.replace(/\n$/, '').split('\n').map(line => line.split('\t'));
  return lines.map(fields => {
    assert.equal(fields.length, header.length);
    return Object.fromEntries(header.map((key, index) => [key, fields[index]]));
  });
}

const entries = read('wallet.tsv', '4963558498e8b8a60ad21ac8490b55abc1ad8115e3a85588445b3d8af9245c90');
const drafts = read('wallet-drafts.tsv', '01dfcdb9187be80397b38b1362d2357ef77e17981bba29e581536a900aa1752a');
const fixture = drafts.map(({ relevant, ...draft }) => ({
  ...draft, vault: 'second', split: 'second', relevant: relevant === '-' ? [] : relevant.split(','),
}));

export { slots };
export const vaults = { original: priorVaults.original, hero: priorVaults.hero, second: entries };
export const rows = [...requests.filter(row => row.vault === 'original' || row.vault === 'hero'), ...fixture];
export const profiles = { original: ['M18', 'M02'], hero: ['H01', 'H02'], second: ['V17', 'V18'] };

assert.equal(entries.length, 40);
assert.equal(drafts.length, 104);
assert.equal(drafts.filter(({ lang }) => lang === 'en').length, 52);
for (const row of rows) {
  assert(row.relevant.every(id => vaults[row.vault].some(entry => entry.id === id)));
}
