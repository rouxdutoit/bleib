import { CreateMLCEngine, prebuiltAppConfig } from '@mlc-ai/web-llm';
import { open as openClassifier } from '../v/classifier.mjs';
import { asPicker, cascadePicker, scoreDrafts } from './scoring.mjs';
import { accelerated, adapterInfo, webGenerator } from './webllm.mjs';

const progress = message => console.info('[run-x] ' + message);

async function open(spec) {
  const id = spec.modelId;
  const adapters = await adapterInfo(navigator.gpu);
  if (!accelerated(adapters)) throw new Error('WebLLM requires hardware WebGPU with shader-f16.');
  const builtin = prebuiltAppConfig.model_list.find(record => record.model_id === id);
  const model = new URL(`./models/${spec.key}/resolve/pinned/`, location.href).href;
  const start = performance.now();
  const engine = await CreateMLCEngine(id, {
    appConfig: { model_list: [{
      ...builtin, model_id: id, model, model_lib: model + 'model.wasm', required_features: ['shader-f16'],
    }] },
    initProgressCallback: ({ progress: fraction, text }) =>
      progress(`${spec.key} · load ${Math.floor(fraction * 100)}% · ${text}`),
  }, { context_window_size: 2048, prefill_chunk_size: 1024 });
  return { engine, coldMs: performance.now() - start, picker: asPicker(webGenerator(engine, id)) };
}

let loaded;
export async function load(spec) {
  loaded = await open(spec);
  return loaded.coldMs;
}

export async function benchmark(mode, workload) {
  const start = performance.now();
  const picker = mode === 'direct' ? loaded.picker :
    cascadePicker(await openClassifier('minilm'), loaded.picker);
  const miniLMColdMs = mode === 'cascade' ? performance.now() - start : undefined;
  const result = await scoreDrafts(workload, picker, row => globalThis.recordX(mode, row),
    message => progress(`${mode} · ${message}`));
  return { ...result, miniLMColdMs, control: mode === 'direct' ? (await picker.control()).valid : undefined };
}

export async function close() {
  await loaded?.engine.unload();
  loaded = undefined;
}

globalThis.webX = { load, benchmark, close };
