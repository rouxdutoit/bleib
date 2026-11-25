import { createHash } from 'node:crypto';
import { createReadStream } from 'node:fs';
import { access, copyFile, mkdir, readFile, rename, rm, stat } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { spawn } from 'node:child_process';
import { build } from 'esbuild';
import { encoders } from '../v/weights.mjs';

const hf = 'https://huggingface.co';
const kernel = 'https://raw.githubusercontent.com/mlc-ai/binary-mlc-llm-libs/5b7251f3bdce957be2a7bf73a6f6c560d9874df4/web-llm-models/v0_2_87/base/';
const specs = [
  ['2B', 'dd74e9c8a20c4546df85c844103bff87b6dcacad', 2358, 172344, 7376211,
    '43577b6de9a4c62cf0fe9c5ee57bc52ebb2fc487c64a21bf78d62431186b4b01',
    'b05572b784de47b9d0ad2b7ed3a829c99cd7120b67cac2ec22ffc9cbd1175ee8',
    'f3b3c89c5040e600982320307bf15431d6db3f2b719f1d42240df808a1803fd3', 2245.44],
  ['4B', '44b42469f9e192814bfd90440e3b377d89ba7a13', 2359, 237895, 7671593,
    'b94d53bfde5b496d8d96239bf4684e24b5394209e5aef9127866efa454395651',
    '7fa8dbe512eb4725827f7e8ccd0e6cf89425fbbb420f62edb7fcb2d6acbe8a98',
    '678b0de0a58403011036d32eae82c8b81a10a87f6abb9622ee97db45df96464b', 3867.82],
];

export const models = specs.map(([size, revision, configBytes, manifestBytes, wasmBytes, configHash,
  manifestHash, wasmHash, catalogVramMB]) => {
  const modelId = `Qwen3.5-${size}-q4f16_1-MLC`;
  return {
    key: 'qwen35-' + size.toLowerCase(), modelId, revision, catalogVramMB,
    files: {
      'mlc-chat-config.json': { bytes: configBytes, sha256: configHash },
      'tensor-cache.json': { bytes: manifestBytes, sha256: manifestHash },
      'tokenizer.json': { bytes: 12807982,
        sha256: '5f9e4d4901a92b997e463c1f46055088b6cca5ca61a6522d1b9f64c4bb81cb42' },
      'model.wasm': { bytes: wasmBytes, sha256: wasmHash, url: kernel + `Qwen3.5-${size}-q4f16_1_cs1k-webgpu.wasm` },
    },
  };
});

const paths = resolve('.cache/models');

async function command(file, args, options) {
  await new Promise((done, reject) => {
    const child = spawn(file, args, { stdio: 'inherit', ...options });
    child.once('error', reject);
    child.once('exit', (code, signal) => code === 0 ? done() :
      reject(new Error(`${file} exited with ${signal ?? code}.`)));
  });
}

async function digest(path, algorithm) {
  const hash = createHash(algorithm);
  for await (const data of createReadStream(path)) hash.update(data);
  return hash.digest('hex');
}

async function valid(path, spec) {
  if ((await stat(path).catch(() => null))?.size !== spec.bytes) return false;
  if (spec.sha256) return await digest(path, 'sha256') === spec.sha256;
  return !spec.md5 || await digest(path, 'md5') === spec.md5;
}

async function download(path, spec, url) {
  if (await valid(path, spec)) return 0;
  await mkdir(dirname(path), { recursive: true });
  const temp = path + '.partial';
  const args = ['-fSL', '--retry', '2', '--max-time', '600', '--progress-bar', '-o', temp];
  const partial = await stat(temp).catch(() => null);
  if (partial?.size > 0 && partial.size < spec.bytes) {
    // A CDN may reject a range request for a partial left by an interrupted run.
    await command('curl', [...args, '-C', '-', url]).catch(() => command('curl', [...args, url]));
  } else if (!await valid(temp, spec)) {
    await command('curl', [...args, url]);
  }
  if (!await valid(temp, spec)) {
    await rm(temp, { force: true });
    throw new Error(`Unexpected model bytes for ${path}.`);
  }
  await rename(temp, path);
  return spec.bytes;
}

export async function prepareWebModel(model) {
  const start = performance.now();
  const dir = resolve(paths, model.key, 'resolve/pinned');
  const base = `${hf}/mlc-ai/${model.modelId}/resolve/${model.revision}/`;
  const manifest = model.files['tensor-cache.json'];
  const fromNetwork = await download(resolve(dir, 'tensor-cache.json'), manifest, base + 'tensor-cache.json');
  const { records } = JSON.parse(await readFile(resolve(dir, 'tensor-cache.json'), 'utf8'));
  const files = { ...model.files };
  for (const { dataPath, nbytes, md5sum } of records) {
    if (!/^params_shard_\d+\.bin$/u.test(dataPath) || !Number.isSafeInteger(nbytes) || nbytes <= 0 ||
      !/^[a-f0-9]{32}$/u.test(md5sum) || files[dataPath]) throw new Error('Unexpected WebLLM shard manifest.');
    files[dataPath] = { bytes: nbytes, md5: md5sum };
  }
  const bytes = Object.values(files).reduce((total, file) => total + file.bytes, 0);
  let downloadedBytes = fromNetwork;
  let ready = manifest.bytes;
  for (const [name, spec] of Object.entries(files)) {
    if (name === 'tensor-cache.json') continue;
    if (!await valid(resolve(dir, name), spec)) {
      console.log(`[run-x] ${model.key} · fetching ${name} (${Math.floor(100 * ready / bytes)}% ready)`);
      downloadedBytes += await download(resolve(dir, name), spec, spec.url ?? base + name);
    }
    ready += spec.bytes;
  }
  console.log(`[run-x] ${model.key} · assets 100% ready`);
  return { bytes, downloadedBytes, provisionMs: performance.now() - start, files };
}

const minilmWeights = {
  'tokenizer.json': { bytes: 17082913, sha256: 'b60b6b43406a48bf3638526314f3d232d97058bc93472ff2de930d43686fa441' },
  'tokenizer_config.json': { bytes: 496, sha256: '3f5961b9ac86288cccdb97f32fb848d6187c78e1603958c53f3ea1f296b7d8a2' },
  'onnx/model_quantized.onnx': { bytes: 118308126, sha256: '66fc00f5f29afcaff34092e1bdd20008ca3918265a82fb9695a551e510cc4ebc' },
};
const headFiles = {
  'save-int8.onnx': { bytes: 20547, sha256: '81b251d786e1a75462f276b2bcbb534f6bf5252d565c619aad4cb0356f234298' },
  'request-int8.onnx': { bytes: 20547, sha256: 'f877f595e8d14c9b922ee28d2ce599fa2f5dbcc7b8116d53873c687f33baa2df' },
};
const pathExists = path => access(path).then(() => true, () => false);

async function copyRunV(dir, file, spec) {
  const source = resolve('../v/.cache/models/minilm', file);
  if (!await valid(source, spec)) return false;
  await mkdir(dirname(resolve(dir, file)), { recursive: true });
  await copyFile(source, resolve(dir, file));
  return true;
}

async function trainHeads(dir) {
  const work = resolve('.cache/train');
  const python = resolve(work, 'venv/bin/python');
  await mkdir(work, { recursive: true });
  if (!await pathExists(python)) {
    await command('uv', ['venv', '--python', '3.14', resolve(work, 'venv')]);
  }
  await command('uv', ['pip', 'install', '--python', python, '-r', resolve('../q2/requirements.txt')]);
  const options = { cwd: work, env: { ...process.env, OPENBLAS_NUM_THREADS: '1', OMP_NUM_THREADS: '1' } };
  await command(process.execPath, [resolve('../q2/synthesize.mjs')], options);
  const entry = resolve(work, 'encode.mjs');
  await build({
    entryPoints: [resolve('../v/train-entry.mjs')], outfile: entry, bundle: true,
    platform: 'node', format: 'esm', packages: 'external',
  });
  await command(process.execPath, [entry, 'minilm', dir + '/'], options);
  await command(python, [resolve('../q2/fit.py')], options);
  for (const file of Object.keys(headFiles)) await copyFile(resolve(work, '.cache/q2', file), resolve(dir, file));
}

export async function prepareMiniLM({ offline = false } = {}) {
  const dir = resolve(paths, 'minilm');
  const { repository, revision } = encoders.minilm;
  for (const [file, spec] of Object.entries(minilmWeights)) {
    const path = resolve(dir, file);
    if (await valid(path, spec) || await copyRunV(dir, file, spec)) continue;
    if (offline) throw new Error(`Offline verification needs the Run V MiniLM asset ${file}.`);
    await download(path, spec, `${hf}/${repository}/resolve/${revision}/${file}`);
  }
  if (!(await Promise.all(Object.entries(headFiles).map(async ([file, spec]) =>
    await valid(resolve(dir, file), spec) || await copyRunV(dir, file, spec)))).every(Boolean)) {
    if (offline) throw new Error('Offline verification needs the Run V MiniLM heads.');
    console.log('[run-x] MiniLM · rebuilding Run V heads on the frozen Q2 training set');
    await trainHeads(dir);
  }
  for (const [file, spec] of Object.entries(headFiles)) {
    if (!await valid(resolve(dir, file), spec)) throw new Error(`Run V MiniLM head digest differs for ${file}.`);
  }
  return { revision, files: { ...minilmWeights, ...headFiles } };
}
