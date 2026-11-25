import { readFile, writeFile } from 'node:fs/promises';
import ort from 'onnxruntime-node';
import { createEncoder } from '../inference.mjs';
import { encoders } from './weights.mjs';

const [name, root] = process.argv.slice(2);
const candidate = encoders[name];
const dir = '.cache/q2';
const encoder = await createEncoder(ort, candidate,
  async file => JSON.parse(await readFile(root + file, 'utf8')),
  root + (candidate.graph ?? 'onnx/model_quantized.onnx'), 'cpu');
try {
  for (const mode of ['request', 'save']) {
    const rows = JSON.parse(await readFile(`${dir}/${mode}-train.json`, 'utf8'));
    const vectors = [];
    for (const { text } of rows) {
      vectors.push(Float32Array.from(await encoder.encode(text)));
      if (vectors.length % 2000 === 0) console.log(name, mode, vectors.length);
    }
    await writeFile(`${dir}/${mode}-train.f32`, Buffer.concat(vectors.map(v => Buffer.from(v.buffer))));
  }
} finally {
  await encoder.release();
}
