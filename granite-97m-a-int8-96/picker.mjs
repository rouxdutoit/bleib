import { openPicker as openAfPicker } from './af-picker.mjs';
import { blocked, choose, ranked } from './rank.mjs';

// Supply the installed onnxruntime-web/wasm module and a directory containing the assets.
export async function openPicker(ort, base, wasmPaths) {
  ort.env.wasm.numThreads = 1;
  ort.env.wasm.proxy = false;
  ort.env.wasm.wasmPaths = wasmPaths;

  const asset = name => new URL(name, base).href;
  async function readJson(name) {
    const response = await fetch(asset(name));
    if (!response.ok) throw new Error(`Unable to read ${name}`);
    return response.json();
  }

  const { operating: { floors } } = await readJson('operating.json');
  const af = await openAfPicker(ort, 'granite97', 'dynamic', asset, readJson, 'wasm');
  return {
    index: af.index,
    async pick(text, index) {
      if (blocked(text)) return [];
      const scores = await af.score(text);
      return choose(ranked({ scores }, index), floors).map(slot => ({ slot, id: index.get(slot).id }));
    },
    release: af.release,
  };
}
