import { CreateMLCEngine } from '@mlc-ai/web-llm';
import { mlc } from './weights.mjs';
import { usePicker } from './reasoner.mjs';

export async function open() {
  const adapter = await navigator.gpu?.requestAdapter();
  if (!adapter || adapter.info.isFallbackAdapter || !adapter.features.has('shader-f16')) {
    throw new Error('Qwen3 WebLLM needs an accelerated WebGPU adapter with shader-f16.');
  }
  const url = path => new URL(path, location.href).href;
  const engine = await CreateMLCEngine(mlc.id, {
    appConfig: { model_list: [{
      model_id: mlc.id, model: url(mlc.localRoot), model_lib: url(mlc.localRoot + 'model.wasm'),
      required_features: ['shader-f16'],
    }] },
  }, { context_window_size: 2048, prefill_chunk_size: 1024 });
  return usePicker(async (messages, schema) => {
    const response = await engine.chat.completions.create({
      messages, temperature: 0, max_tokens: 32,
      response_format: { type: 'json_object', schema: JSON.stringify(schema) },
      extra_body: { enable_thinking: false },
    });
    return response.choices[0]?.message?.content ?? '';
  });
}
