import { rows, slots, vaults } from '../v/corpus.mjs';

export const cases = rows.filter(row => row.split !== 'dev');
export const workload = {
  rows: cases.map(({ id, lang, text, vault }) => ({ id, lang, text, vault })),
  slots,
  vaults: Object.fromEntries(Object.entries(vaults).map(([id, entries]) =>
    [id, entries.map(({ id, slot, text }) => ({ id, slot, text }))])),
};

export const directWorkload = {
  ...workload,
  vaults: Object.fromEntries(Object.entries(workload.vaults).map(([id, entries]) =>
    [id, entries.map(({ id, slot }) => ({ id, slot }))])),
};
