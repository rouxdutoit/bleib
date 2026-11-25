import { Tokenizer } from '@huggingface/tokenizers';

export const threads = 1;
const limit = 128;

export async function createEncoder(ort, candidate, loadJson, graph, backend) {
  const { tokenizer: tokenizerFile = 'tokenizer.json', pooling = 'mean' } = candidate;
  const [definition, config] = await Promise.all([
    loadJson(tokenizerFile),
    pooling === 'static' ? {} : loadJson('tokenizer_config.json'),
  ]);
  const tokenizer = new Tokenizer(definition, config);
  const options = { executionProviders: [backend], logSeverityLevel: 3 };
  if (backend === 'cpu') Object.assign(options, { intraOpNumThreads: threads, interOpNumThreads: threads });
  const session = await ort.InferenceSession.create(graph, options);

  async function encode(text) {
    const { ids } = tokenizer.encode(text, { add_special_tokens: pooling !== 'static' });
    const tokens = ids.slice(0, limit);
    if (!tokens.length) throw new Error('The text has no tokens.');
    const shape = [1, tokens.length];
    const available = {
      input_ids: BigInt64Array.from(tokens, BigInt),
      attention_mask: new BigInt64Array(tokens.length).fill(1n),
      token_type_ids: new BigInt64Array(tokens.length),
      position_ids: BigInt64Array.from(tokens.keys(), BigInt),
    };
    const inputs = Object.fromEntries(session.inputNames.map(name =>
      [name, new ort.Tensor('int64', available[name], shape)]));
    const output = (await session.run(inputs))[session.outputNames[0]];
    const size = output.dims.at(-1);
    const values = output.data;
    if (!(values instanceof Float32Array) || !size || values.length < size) {
      throw new Error('Unexpected embedding output.');
    }
    const pooled = new Float64Array(size);
    const rows = pooling === 'mean' ? tokens.length : 1;
    for (let row = 0; row < rows; row++) {
      for (let i = 0; i < size; i++) pooled[i] += values[row * size + i];
    }
    const norm = Math.hypot(...pooled);
    output.dispose();
    if (!Number.isFinite(norm) || norm === 0) throw new Error('The embedding is unusable.');
    return pooled.map(value => value / norm);
  }
  return { encode, release: () => session.release() };
}

const dot = (left, right) => left.reduce((total, value, index) => total + value * right[index], 0);

export async function compare(encoder, candidate, memory, drafts, sample = () => {}) {
  let start = performance.now();
  const vectors = [];
  for (const entry of memory) {
    vectors.push(await encoder.encode((candidate.memoryPrefix ?? '') + entry.text));
    sample();
  }
  const indexMs = performance.now() - start;
  const rows = [];
  for (const draft of drafts) {
    start = performance.now();
    const vector = await encoder.encode((candidate.queryPrefix ?? '') + draft.text);
    const scores = vectors.map(memoryVector => dot(vector, memoryVector));
    rows.push({ id: draft.id, scores, ms: performance.now() - start });
    sample();
  }
  return { indexMs, rows };
}
