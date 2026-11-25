import * as ort from 'onnxruntime-web/wasm';
import { openEncoder } from './models.mjs';

export async function open(_name, _slots, { floors }) {
  ort.env.wasm.numThreads = 1;
  ort.env.wasm.wasmPaths = new URL('./runtime/', location.href).href;
  const encoder = await openEncoder(ort, 'minilm', new URL('./model/', location.href).href, 'wasm');
  const dot = (a, b) => a.reduce((sum, value, i) => sum + value * b[i], 0);
  return {
    async index(entries) {
      const vectors = new Map();
      for (const { id, text } of entries) vectors.set(id, await encoder.encode(text));
      return vectors;
    },
    async pick(row, vectors) {
      const vector = await encoder.encode(row.text);
      const best = [...vectors].map(([id, embedding]) => [id, dot(vector, embedding)])
        .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).slice(0, 2);
      return { selected: best.filter(([, score], i) => score >= floors[i]).map(([id]) => id) };
    },
  };
}
