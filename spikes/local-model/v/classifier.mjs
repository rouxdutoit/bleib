import * as ort from 'onnxruntime-web/wasm';
import { assignSlot, entriesBySlot } from '../q2/selection.mjs';
import { openEncoder, openHead } from './models.mjs';

export async function open(name) {
  ort.env.wasm.numThreads = 1;
  ort.env.wasm.wasmPaths = new URL('./runtime/', location.href).href;
  const root = new URL('./model/', location.href).href;
  const [encoder, save, request] = await Promise.all([
    openEncoder(ort, name, root, 'wasm'),
    openHead(ort, root + 'save-int8.onnx', 'wasm'),
    openHead(ort, root + 'request-int8.onnx', 'wasm'),
  ]);
  return {
    async index(entries) {
      const labelled = [];
      for (const entry of entries) {
        const predicted = assignSlot(entry.text, await save(await encoder.encode(entry.text)));
        labelled.push({ ...entry, slot: predicted.slot });
      }
      return entriesBySlot(labelled);
    },
    async score(text) { return request(await encoder.encode(text)); },
  };
}
