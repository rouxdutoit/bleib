import { createEncoder } from '../inference.mjs';
import { encoders } from './weights.mjs';

export async function openEncoder(ort, name, root, backend) {
  const candidate = encoders[name];
  const graph = candidate.graph ?? 'onnx/model_quantized.onnx';
  return createEncoder(ort, candidate, async file => (await fetch(root + file)).json(), root + graph, backend);
}

export async function openHead(ort, model, backend) {
  const session = await ort.InferenceSession.create(model, {
    executionProviders: [backend], logSeverityLevel: 3,
  });
  return async vector => {
    const input = new ort.Tensor('float32', Float32Array.from(vector), [1, vector.length]);
    const { scores } = await session.run({ embedding: input });
    const result = Array.from(scores.data);
    scores.dispose();
    return result;
  };
}
