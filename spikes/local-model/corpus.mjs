import { readFileSync } from 'node:fs';

function readTsv(name) {
  const [header, ...rows] = readFileSync(new URL(`data/${name}.tsv`, import.meta.url), 'utf8').trimEnd()
    .split('\n').map(line => line.split('\t'));
  return rows.map(fields => {
    if (fields.length !== header.length) throw new Error(`Invalid ${name} row ${fields[0]}.`);
    return Object.fromEntries(header.map((key, index) => [key, fields[index]]));
  });
}

export const memory = readTsv('memories');
export const drafts = readTsv('drafts').flatMap(({ id, split, category, relevant, en, de }) =>
  Object.entries({ en, de }).map(([lang, text]) => ({
    id: `${id}-${lang}`, text, lang, split, category, relevant: relevant === '-' ? [] : relevant.split(','),
  })));
