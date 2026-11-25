import assert from 'node:assert/strict';
import { writeFile } from 'node:fs/promises';
import { heads, models, probes } from './models.mjs';
import { json, modelRoot, nodeEncoder, variantRoot } from './node-runtime.mjs';

const [name, variant] = process.argv.slice(2);
const encoder = await nodeEncoder(name, variant, variant === 'fp32' ? 1 : models[name].fitThreads);
const dir = variantRoot(name, variant) + '/.cache/q2';
try {
  const reference = await json(modelRoot(name) + '/reference.json');
  const exactIds = probes.map(([mode, text], i) => {
    assert.deepEqual(encoder.ids(mode, text), reference[i].ids, 'Tokenizer differs from the reference.');
    return true;
  });
  const vectors = [];
  for (const [mode, text] of probes) vectors.push(Array.from(await encoder.encode(mode, text)));
  const fp32 = variant === 'fp32' ? reference.map(row => row.embedding) :
    (await json(modelRoot(name) + '/fp32-check.json')).vectors;
  const cosines = vectors.map((vector, i) => {
    assert.equal(vector.length, fp32[i].length);
    return vector.reduce((sum, value, j) => sum + value * fp32[i][j], 0);
  });
  const minCosine = Math.min(...cosines);
  console.log(name, variant, 'minimum probe cosine', minCosine);
  if (variant === 'fp32') assert(minCosine >= 0.999, 'The FP32 export differs from the original checkpoint.');
  await writeFile(modelRoot(name) + '/' + variant + '-check.json', JSON.stringify({
    minCosine, cosines, exactIds, ...(variant === 'fp32' ? { vectors } : {}),
  }));
  if (variant !== 'fp32') {
    for (const mode of heads) {
      const rows = await json(dir + '/' + mode + '-train.json');
      const started = performance.now();
      const width = vectors[0].length;
      const features = new Float32Array(rows.length * width);
      for (const [index, { text }] of rows.entries()) {
        features.set(await encoder.encode(mode, text), index * width);
        if ((index + 1) % 2000 === 0) console.log(name, variant, mode, index + 1, rows.length);
      }
      await writeFile(dir + '/' + mode + '-train.f32', Buffer.from(features.buffer));
      console.log(name, variant, mode, rows.length, ((performance.now() - started) / 1000).toFixed(1) + ' s');
    }
  }
} finally {
  await encoder.release();
}
