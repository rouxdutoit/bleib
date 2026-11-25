import assert from 'node:assert/strict';
import { copyFile, mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import { build } from 'esbuild';

const name = process.argv[2];
assert(['minilm', 'granite', 'static'].includes(name));
const work = resolve('.cache/train', name);
const model = resolve('.cache/models', name) + '/';
await mkdir(work, { recursive: true });
await mkdir(model, { recursive: true });
const env = { ...process.env, OPENBLAS_NUM_THREADS: '1', OMP_NUM_THREADS: '1' };
function run(command, args) {
  const result = spawnSync(command, args, { cwd: work, env, stdio: 'inherit' });
  assert.equal(result.status, 0, String(result.error ?? result.signal));
}
run(process.execPath, [resolve('../q2/synthesize.mjs')]);
const staticHead = name === 'static';
if (staticHead) {
  run(process.execPath, [resolve('../q2/static-features.mjs')]);
} else {
  await build({
    entryPoints: ['train-entry.mjs'], outfile: `.cache/train-${name}.mjs`, bundle: true,
    platform: 'node', format: 'esm', packages: 'external',
  });
  run(process.execPath, [resolve(`.cache/train-${name}.mjs`), name, model]);
}
run(resolve('.cache/train-venv/bin/python'), [resolve('../q2/fit.py'), ...(staticHead ? ['--static'] : [])]);
for (const mode of ['save', 'request']) {
  const file = `${mode}-${staticHead ? 'static.bin' : 'int8.onnx'}`;
  await copyFile(`${work}/.cache/q2/${file}`, model + file);
}
