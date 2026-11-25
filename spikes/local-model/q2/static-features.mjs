import { readFile, writeFile } from 'node:fs/promises';
import { features } from './subwords.mjs';

for (const mode of ['request', 'save']) {
  const rows = JSON.parse(await readFile(`.cache/q2/${mode}-train.json`, 'utf8'));
  const indices = [];
  const values = [];
  const offsets = [0];
  for (const row of rows) {
    for (const [index, value] of features(row.text)) {
      indices.push(index);
      values.push(value);
    }
    offsets.push(indices.length);
  }
  const data = { indices, values, offsets };
  await writeFile(`.cache/q2/${mode}-static.json`, JSON.stringify(data));
}
