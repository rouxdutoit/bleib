import { readFile } from 'node:fs/promises';
import ort from 'onnxruntime-node';
import { candidates } from '../candidates.mjs';
import { createEncoder, threads } from '../inference.mjs';

export const candidate = candidates['minilm-int8'];
export const modelDir = `.cache/models/${candidate.repository}`;
export const modelFiles = ['onnx/model_quantized.onnx', 'tokenizer.json', 'tokenizer_config.json'];

export function openEncoder() {
  return createEncoder(ort, candidate, async file => JSON.parse(await readFile(`${modelDir}/${file}`, 'utf8')),
    `${modelDir}/${modelFiles[0]}`, 'cpu');
}

export async function openHead(mode, suffix = 'int8') {
  const session = await ort.InferenceSession.create(`.cache/q2/${mode}-${suffix}.onnx`, {
    executionProviders: ['cpu'], intraOpNumThreads: threads, interOpNumThreads: 1,
  });
  return {
    async score(vector) {
      const input = new ort.Tensor('float32', Float32Array.from(vector), [1, vector.length]);
      const { scores } = await session.run({ embedding: input });
      const result = Array.from(scores.data);
      scores.dispose();
      return result;
    },
    release: () => session.release(),
  };
}
