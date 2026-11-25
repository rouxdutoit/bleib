import { Wllama } from '@wllama/wllama';
import { llms } from './weights.mjs';
import { usePicker } from './reasoner.mjs';

export async function open(name, _slots, { compact = false } = {}) {
  const url = path => new URL(path, location.href).href;
  const runtime = new Wllama({ default: url('runtime/wllama.wasm') }, { suppressNativeLog: true });
  const response = await fetch(url('model/' + llms[name].files[0]));
  if (!response.ok) throw new Error('The local weights could not be loaded.');
  await runtime.loadModel([await response.blob()], {
    n_ctx: 2048, n_threads: crossOriginIsolated ? (compact ? 6 : 4) : 1, n_gpu_layers: 0, seed: 84,
  });
  return usePicker(async (messages, schema) => {
    const response = await runtime.createChatCompletion({
      messages, chat_template_kwargs: { enable_thinking: false },
      temperature: 0, max_tokens: 32,
      ...(compact ? { cache_prompt: true } : {}),
      response_format: { type: 'json_schema', json_schema: { name: 'pick', schema, strict: true } },
    });
    return response.choices[0]?.message?.content ?? '';
  }, compact);
}
