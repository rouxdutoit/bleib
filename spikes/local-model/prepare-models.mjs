import { execFile } from 'node:child_process';
import { createReadStream } from 'node:fs';
import { mkdir, rename, stat, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { promisify } from 'node:util';
import { candidates } from './candidates.mjs';

const curl = promisify(execFile);
async function prepare(name) {
  const { repository, revision, tokenizer = 'tokenizer.json', graph = 'onnx/model_quantized.onnx' } = candidates[name];
  const folder = `.cache/models/${repository}`;
  await Promise.all([graph, tokenizer].map(file => mkdir(`${folder}/${file.slice(0, file.lastIndexOf('/') + 1)}`, { recursive: true })));
  const files = [tokenizer, graph];
  if (tokenizer === 'tokenizer.json') files.push('tokenizer_config.json');
  return [name, Object.fromEntries(await Promise.all(files.map(async file => {
    const path = `${folder}/${file}`;
    if (!await stat(path).catch(() => null)) {
      await curl('curl', ['--fail', '--silent', '--show-error', '--location', '--retry', '2',
        '--max-time', '240', '--output', `${path}.${process.pid}.${name}.partial`,
        `https://huggingface.co/${repository}/resolve/${revision}/${file}?download=true`]);
      await rename(`${path}.${process.pid}.${name}.partial`, path);
    }
    const hash = createHash('sha256');
    for await (const chunk of createReadStream(path)) hash.update(chunk);
    return [file, { bytes: (await stat(path)).size, sha256: hash.digest('hex') }];
  })))];
}

const names = process.argv.slice(2);
const results = await Promise.allSettled((names.length ? names : Object.keys(candidates)).map(prepare));
const assets = Object.fromEntries(results.flatMap(result => result.status === 'fulfilled' ? [result.value] : []));
for (const result of results.filter(result => result.status === 'rejected')) console.error(result.reason.message);
for (const [name, files] of Object.entries(assets)) {
  await writeFile(`.cache/${name}-assets.json`, JSON.stringify(files, null, 2) + '\n');
}
if (results.some(result => result.status === 'rejected')) process.exitCode = 1;
