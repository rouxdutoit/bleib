import { createHash } from 'node:crypto';
import { createReadStream } from 'node:fs';
import { readFile, stat, writeFile } from 'node:fs/promises';
import { rows } from '../v/corpus.mjs';
import { graphFiles, headFile, heads, models } from './models.mjs';

const json = async file => JSON.parse(await readFile(file, 'utf8'));
const lookup = new Map(rows.map(row => [row.id, row]));
const stages = [...Object.keys(models).flatMap(name => (name === 'granite97' ? ['int8', 'dynamic', 'q4'] : ['int8', 'q4'])
  .map(variant => [name, variant])), ['static', 'int8']];
const results = {};
const predictions = ['model\tvariant\truntime\tsplit\tid\tlang\tgold\toffers\tinferred\tms'];

async function evidence(path) {
  const hash = createHash('sha256');
  for await (const bytes of createReadStream(path)) hash.update(bytes);
  return { bytes: (await stat(path)).size, sha256: hash.digest('hex') };
}

for (const [name, variant] of stages) {
  const model = models[name];
  const root = '.cache/models/' + name + '/';
  const dir = '.cache/train/' + name + '/' + variant + '/';
  const key = name + '-' + variant;
  const result = {};
  results[key] = result;
  if (model) {
    const { vectors, ...fp32 } = await json(root + 'fp32-check.json');
    result.embeddingFidelity = { fp32VsMaker: fp32, quantizedVsFp32: await json(root + variant + '-check.json') };
    if (model.pooling === 'cls') {
      result.ibmCrossLingualProbe = vectors.slice(0, 3).map(query => vectors.slice(3, 6)
        .map(passage => query.reduce((sum, value, index) => sum + value * passage[index], 0)));
    }
    result.assets = Object.fromEntries(
      await Promise.all(graphFiles(model, variant).map(async file => [file, await evidence(root + file)])),
    );
    result.fp32WithFrozenHeadsDev = (await json(dir + 'fp32-dev.json')).dev;
  }
  const training = dir + '.cache/q2/';
  result.training = Object.fromEntries(await Promise.all(heads.map(async mode => [mode, {
    data: await evidence(training + mode + '-train.json'),
    head: await evidence(training + (model ? headFile(mode) : mode + '-static.bin')),
  }])));
  for (const runtime of ['node', 'chromium']) {
    const { predictions: drafts, ...summary } = await json(dir + runtime + '.json');
    result[runtime] = summary;
    for (const { id, selected, inferred, ms } of drafts) {
      const { lang, relevant, split } = lookup.get(id);
      predictions.push([name, variant, runtime, split, id, lang, relevant.join(',') || '-',
        selected.join(',') || '-', Number(inferred), ms.toFixed(3)].join('\t'));
    }
  }
}
await writeFile('results.json', JSON.stringify(results, null, 2) + '\n');
await writeFile('predictions.tsv', predictions.join('\n') + '\n');
