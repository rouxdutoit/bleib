import assert from 'node:assert/strict';
import { slotIds } from './corpus.mjs';
import { openHead } from './encoder.mjs';
import { dimensions, features, openStaticHead } from './subwords.mjs';

for (const mode of ['request', 'save']) {
  const staticHead = await openStaticHead(mode, slotIds.length);
  const onnx = await openHead(mode, 'static');
  try {
    for (const text of ['Wie finde ich gutes Handgepäck für mich?', 'Help me prepare my breakfast.', '<<>>',
      'Ich spreche zu Hause Deutsch.', 'I prefer hot coffee.', 'Mixed Denglish im Alltag.']) {
      const sparse = features(text);
      const dense = new Float32Array(dimensions);
      for (const [index, value] of sparse) dense[index] = value;
      const expected = await onnx.score(dense);
      const actual = staticHead.score(sparse);
      assert(actual.every((score, index) => Math.abs(score - expected[index]) < 0.002));
    }
  } finally {
    await onnx.release();
  }
}
console.log('Static request and save scores match the int8 ONNX exports within 0.002.');
