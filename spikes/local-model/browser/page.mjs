import * as ort from 'onnxruntime-web/wasm';
import { compare, createEncoder, threads } from '../inference.mjs';

const endpoint = name => new URL(name, location.href).href;
const stem = 'ort-wasm-simd-threaded';
Object.assign(ort.env.wasm, {
  numThreads: threads,
  proxy: false,
  wasmPaths: { mjs: endpoint(`${stem}.mjs`), wasm: endpoint(`${stem}.wasm`) },
});

const violations = [];
const requests = new Set();
const fetchFile = window.fetch.bind(window);
window.fetch = (input, options) => {
  const url = new URL(input instanceof Request ? input.url : input, location.href);
  requests.add(url.href);
  return fetchFile(input, options);
};
window.addEventListener('securitypolicyviolation', event =>
  violations.push({ directive: event.violatedDirective, blocked: event.blockedURI }));
const getJson = async name => {
  const result = await fetch(endpoint(name));
  if (!result.ok) throw new Error(`Missing packaged file ${name}.`);
  return result.json();
};

async function nano() {
  if (!globalThis.LanguageModel) return { api: 'missing' };
  const availability = {};
  for (const language of ['en', 'de']) {
    try {
      availability[language] = await globalThis.LanguageModel.availability({
        expectedInputs: [{ type: 'text', languages: [language] }],
        expectedOutputs: [{ type: 'text', languages: [language] }],
      });
    } catch (error) {
      availability[language] = String(error);
    }
  }
  return { api: 'present', availability };
}

window.run = async () => {
  const { candidate, memory, drafts, graph } = await getJson('fixture.json');
  const offline = !navigator.onLine;
  const start = performance.now();
  const encoder = await createEncoder(ort, candidate, getJson, endpoint(graph), 'wasm');
  const loadMs = performance.now() - start;
  const result = await compare(encoder, candidate, memory, drafts);
  const diagnostics = {
    origin: location.origin, runtimeId: globalThis.chrome.runtime.id, offline, nano: await nano(),
    resources: [...new Set([...requests, ...performance.getEntriesByType('resource').map(resource => resource.name)])],
    violations,
  };
  await encoder.release();
  return { ...result, loadMs, diagnostics };
};

// Playwright's Firefox cannot drive extension-owned top-level tabs. The local
// fixture drives the packaged extension iframe through a test-only message.
window.addEventListener('message', async event => {
  if (event.source !== window.parent || event.origin !== 'http://127.0.0.1' || event.data !== 'benchmark') return;
  try {
    event.source.postMessage({ value: await window.run() }, event.origin);
  } catch (error) {
    event.source.postMessage({ error: String(error) }, event.origin);
  }
});
