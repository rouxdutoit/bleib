import { openPicker, rankRows } from './picker.mjs';
import { open as openStatic } from '../v/static.mjs';

const violations = [];
addEventListener('securitypolicyviolation', event => violations.push(event.blockedURI));
let picker;
const indexes = {};
const asset = file => new URL('./model/' + file, location.href).href;
async function fetchAsset(file) {
  const result = await fetch(asset(file));
  if (!result.ok) throw new Error('The bundled asset could not be loaded.');
  return result;
}

async function load(name, variant, slots, warmup) {
  const start = performance.now();
  if (process.env.BLEIB_AF_STATIC) {
    picker = await openStatic(name, slots);
  } else {
    const ort = await import('./wasm.js');
    ort.env.wasm.numThreads = 1;
    ort.env.wasm.wasmPaths = new URL('./runtime/', location.href).href;
    picker = await openPicker(ort, name, variant, asset, async file => (await fetchAsset(file)).json(), 'wasm');
  }
  const coldMs = performance.now() - start;
  const first = performance.now();
  if (!(await picker.score(warmup)).every(Number.isFinite)) throw new Error('The warm-up returned invalid scores.');
  return { coldMs, firstMs: performance.now() - first };
}

globalThis.benchmark = {
  load,
  async index(vaults) {
    const start = performance.now();
    for (const [id, entries] of Object.entries(vaults)) indexes[id] = await picker.index(entries);
    return performance.now() - start;
  },
  rank: rows => rankRows(picker, indexes, rows),
  diagnostics: () => ({
    origin: location.origin, runtimeId: chrome.runtime.id, violations,
    resources: performance.getEntriesByType('resource').map(entry => entry.name),
  }),
};
