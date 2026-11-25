import { spawnSync } from 'node:child_process';
import { copyFile, mkdir, readdir, stat, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { createRequire } from 'node:module';
import assert from 'node:assert/strict';
import { slots } from '../v/corpus.mjs';
import { graphFiles, headFile, heads, models, tokenizerFiles } from './models.mjs';

const require = createRequire(import.meta.url);
const { build } = require('esbuild');
const slotIds = slots.map(({ id }) => id);
const plugin = {
  name: 'browser-fixtures',
  setup(api) {
    api.onResolve({ filter: /^\.\/corpus\.mjs$/ }, args =>
      args.importer.endsWith('/q2/selection.mjs') ? { path: 'slots', namespace: 'fixtures' } : undefined);
    api.onResolve({ filter: /^node:fs\/promises$/ }, args =>
      args.importer.endsWith('/q2/subwords.mjs') ? { path: 'node-fs', namespace: 'fixtures' } : undefined);
    api.onLoad({ filter: /.*/, namespace: 'fixtures' }, args => ({
      contents: args.path === 'slots' ? 'export const slotIds = ' + JSON.stringify(slotIds) :
        'export function readFile() { throw new Error("Node-only helper"); }',
    }));
  },
};

function run(cmd, args, cwd) {
  const result = spawnSync(cmd, args, { cwd, stdio: 'inherit' });
  assert.equal(result.status, 0, String(result.error ?? result.signal ?? cmd));
}

async function copy(source, target) {
  await mkdir(dirname(target), { recursive: true });
  await copyFile(source, target);
}

export async function prepareExtension(name, variant, scratch) {
  const root = scratch + '/addon';
  const encoder = '.cache/models/' + name + '/';
  const head = '.cache/train/' + name + '/' + variant + '/.cache/q2/';
  const staticMode = name === 'static';
  await mkdir(root);
  const manifest = {
    manifest_version: 3, name: 'bleib Run AF benchmark', version: '0.1.0',
    content_security_policy: { extension_pages: "script-src 'self' 'wasm-unsafe-eval'; object-src 'none'; connect-src 'self'" },
    background: { service_worker: 'background.js' },
  };
  const bundle = {
    bundle: true, format: 'esm', platform: 'browser', minify: true, legalComments: 'eof',
    nodePaths: [resolve('node_modules')], plugins: [plugin],
  };
  await writeFile(root + '/manifest.json', JSON.stringify(manifest));
  await writeFile(root + '/background.js', 'chrome.runtime.onInstalled.addListener(() => {});');
  await writeFile(root + '/page.html', '<!doctype html><meta charset="utf-8"><script type="module" src="page.js"></script>');
  await build({
    ...bundle, entryPoints: ['page.mjs'], outdir: root, external: ['./wasm.js'],
    define: { 'process.env.BLEIB_AF_STATIC': JSON.stringify(staticMode) },
  });
  if (!staticMode) {
    await build({
      ...bundle, stdin: { contents: "export * from 'onnxruntime-web/wasm';", resolveDir: process.cwd() },
      outfile: root + '/wasm.js',
    });
    const dist = dirname(require.resolve('onnxruntime-web'));
    for (const suffix of ['mjs', 'wasm']) {
      const file = 'ort-wasm-simd-threaded.' + suffix;
      await copy(dist + '/' + file, root + '/runtime/' + file);
    }
    for (const file of [...tokenizerFiles, ...graphFiles(models[name], variant)]) {
      await copy(encoder + file, root + '/model/' + file);
    }
  }
  for (const mode of heads) {
    const file = staticMode ? mode + '-static.bin' : headFile(mode);
    await copy(head + file, root + '/model/' + file);
  }
  const zip = scratch + '/addon.zip';
  run('zip', ['-q', '-r', zip, '.'], root);
  let unpackedBytes = 0;
  for (const entry of await readdir(root, { recursive: true, withFileTypes: true })) {
    if (entry.isFile()) unpackedBytes += (await stat(resolve(entry.parentPath, entry.name))).size;
  }
  const zipBytes = (await stat(zip)).size;
  run('python3', ['cache.py', root, zip]);
  return { root, unpackedBytes, zipBytes };
}
