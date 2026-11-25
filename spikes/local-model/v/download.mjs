import { createReadStream } from 'node:fs';
import { mkdir, readFile, rename, stat, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { execFile } from 'node:child_process';
import { dirname } from 'node:path';
import { promisify } from 'node:util';
import { encoders, llms, mlc } from './weights.mjs';

const curl = promisify(execFile);
const weights = { ...encoders, ...llms, mlc };

async function fetchFile(name, model, file, url) {
  const path = `.cache/models/${name}/${file}`;
  if (!await stat(path).catch(() => null)) {
    await mkdir(dirname(path), { recursive: true });
    const partial = `${path}.partial`;
    await curl('curl', ['-fSsL', '--retry', '2', '--max-time', '1800', '-C', '-', '-o', partial,
      url ?? `https://huggingface.co/${model.repository}/resolve/${model.revision}/${file}?download=true`]);
    await rename(partial, path);
  }
  const hash = createHash('sha256');
  for await (const chunk of createReadStream(path)) hash.update(chunk);
  const sha256 = hash.digest('hex');
  if (model.digests?.[file] && model.digests[file] !== sha256) throw new Error(`Digest mismatch for ${file}.`);
  return [file, { bytes: (await stat(path)).size, sha256 }];
}

async function prepare(name) {
  if (!Object.hasOwn(weights, name)) throw new Error(`Unknown model ${name}.`);
  const model = weights[name];
  const files = await Promise.all(model.files.map(file => fetchFile(name, model, file)));
  if (name === 'mlc') {
    const { prebuiltAppConfig } = await import('@mlc-ai/web-llm');
    const config = prebuiltAppConfig.model_list.find(row => row.model_id === model.id);
    const shards = JSON.parse(await readFile('.cache/models/mlc/tensor-cache.json', 'utf8')).records;
    for (const { dataPath } of shards) files.push(await fetchFile(name, model, dataPath));
    files.push(await fetchFile(name, model, 'model.wasm', config.model_lib));
    console.log('WebLLM kernel', config.model_lib);
  }
  await writeFile(`.cache/${name}-assets.json`, JSON.stringify(Object.fromEntries(files), null, 2));
  console.log(name, files.reduce((total, [, file]) => total + file.bytes, 0));
}

const outcomes = await Promise.allSettled(process.argv.slice(2).map(prepare));
for (const outcome of outcomes) {
  if (outcome.status === 'rejected') {
    console.error(outcome.reason.message);
    process.exitCode = 1;
  }
}
