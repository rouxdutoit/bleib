import { AutoTokenizer, EmbeddingGemma2Model, env } from '@huggingface/transformers';
import { entriesBySlot } from '../q2/selection.mjs';

const dot = (a, b) => a.reduce((sum, value, i) => sum + value * b[i], 0);

export async function open() {
  env.allowRemoteModels = false;
  env.allowLocalModels = true;
  env.useBrowserCache = false;
  env.localModelPath = new URL('./', location.href).href;
  env.backends.onnx.wasm.numThreads = 1;
  const runtime = new URL('./runtime/', location.href).href;
  env.backends.onnx.wasm.wasmPaths = runtime;
  const config = await (await fetch('model/config.json')).json();
  // The exported text graph accepts empty modality tensors. Leave the larger audio and vision sessions unloaded.
  delete config.vision_config;
  delete config.audio_config;
  const [tokenize, model] = await Promise.all([
    AutoTokenizer.from_pretrained('model'),
    EmbeddingGemma2Model.from_pretrained('model', { config, device: 'wasm', dtype: 'q4' }),
  ]);
  const vectors = new Map();
  async function encode(text) {
    const input = tokenize(text, { truncation: true, max_length: 128 });
    const { sentence_embedding: vector } = await model(input);
    return Array.from(vector.data);
  }
  return {
    async index(entries, slots) {
      for (const slot of slots) {
        if (vectors.has(slot.id)) continue;
        const vector = await encode(`title: none | text: ${slot.en} / ${slot.de}`);
        vectors.set(slot.id, vector);
      }
      return entriesBySlot(entries);
    },
    async score(text) {
      const query = await encode('task: search result | query: ' + text);
      return [...vectors.values()].map(vector => (1 + dot(query, vector)) / 2);
    },
  };
}
