import { Tokenizer } from '@huggingface/tokenizers';
import { graphFiles, inputText, tokenizerFiles } from './models.mjs';

export const cpuOptions = { intraOpNumThreads: 1, interOpNumThreads: 1 };

export async function openEncoder(ort, model, variant, loadJson, asset, backend, threads = 1) {
  const [definition, config] = await Promise.all(tokenizerFiles.map(loadJson));
  const tokenizer = new Tokenizer(definition, config);
  const [graph, sidecar] = graphFiles(model, variant);
  const session = await ort.InferenceSession.create(asset(graph), {
    executionProviders: [backend],
    logSeverityLevel: 3,
    ...(backend === 'cpu' ? { ...cpuOptions, intraOpNumThreads: threads } : {}),
    ...(sidecar && backend !== 'cpu' ? { externalData: [{ path: sidecar.split('/').at(-1), data: asset(sidecar) }] } : {}),
  });

  const pooledOutput = session.outputNames.includes('sentence_embedding');
  const outputName = pooledOutput ? 'sentence_embedding' : 'last_hidden_state';

  function ids(mode, text) {
    const encoded = tokenizer.encode(inputText(model, mode, text), { add_special_tokens: true }).ids;
    if (encoded.length <= 128) return encoded;
    // Keep the closing token for the encoders whose tokenizer appends one.
    return [...encoded.slice(0, 127), encoded.at(-1)];
  }

  async function encode(mode, text) {
    const tokens = ids(mode, text);
    if (!tokens.length) throw new Error('The text has no tokens.');
    const shape = [1, tokens.length];
    const input = {
      input_ids: BigInt64Array.from(tokens, BigInt),
      attention_mask: new BigInt64Array(tokens.length).fill(1n),
      token_type_ids: new BigInt64Array(tokens.length),
      position_ids: BigInt64Array.from(tokens.keys(), BigInt),
    };
    const feeds = Object.fromEntries(session.inputNames.map(name => [name, new ort.Tensor('int64', input[name], shape)]));
    const outputs = await session.run(feeds, [outputName]);
    const output = outputs[outputName];
    try {
      const width = output.dims.at(-1);
      const values = output.data;
      if (!(values instanceof Float32Array) || output.dims.length !== (pooledOutput ? 2 : 3) ||
          (!pooledOutput && output.dims[1] !== tokens.length) || !width) {
        throw new Error('The graph returned an unexpected hidden state.');
      }
      const vector = new Float64Array(width);
      const first = !pooledOutput && model.pooling === 'last' ? tokens.length - 1 : 0;
      const end = !pooledOutput && model.pooling === 'mean' ? tokens.length : first + 1;
      for (let row = first; row < end; row++) {
        for (let column = 0; column < width; column++) vector[column] += values[row * width + column];
      }
      const norm = Math.hypot(...vector);
      if (!(norm > 0 && Number.isFinite(norm))) throw new Error('The embedding is unusable.');
      return Float32Array.from(vector, value => value / norm);
    } finally {
      output.dispose();
      for (const tensor of Object.values(feeds)) tensor.dispose();
    }
  }

  return { ids, encode, release: () => session.release() };
}
