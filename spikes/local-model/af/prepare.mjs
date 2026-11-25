import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { createReadStream } from 'node:fs';
import { mkdir, rename, stat, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';
import { graphFiles, models, probes, inputText, tokenizerFiles } from './models.mjs';

const name = process.argv[2];
const model = models[name];
assert(model);
const base = '.cache/models/' + name;
const host = 'https://huggingface.co';
const hashes = {};

function curl(args) {
  const result = spawnSync('curl', ['--fail', '--silent', '--show-error', '--location',
    '--retry', '2', '--connect-timeout', '15', ...args], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'inherit'] });
  assert.equal(result.status, 0, 'Hugging Face download failed.');
  return result.stdout;
}

async function sha256(path) {
  const hash = createHash('sha256');
  for await (const chunk of createReadStream(path)) hash.update(chunk);
  return hash.digest('hex');
}

async function download(repository, revision, folder, paths) {
  const endpoint = host + '/api/models/' + repository + '/tree/' + revision + '?recursive=true';
  const files = JSON.parse(curl([endpoint, '--max-time', '30']));
  for (const file of paths) {
    const expected = files.find(row => row.path === file);
    assert(expected, 'Missing upstream file ' + file);
    const path = folder + '/' + file;
    await mkdir(dirname(path), { recursive: true });
    const cached = await stat(path).catch(() => null);
    // Verify LFS model files even if they are already present in the cache.
    if (cached?.size !== expected.size || (expected.lfs && await sha256(path) !== expected.lfs.oid)) {
      const url = host + '/' + repository + '/resolve/' + revision + '/' + file + '?download=true&run=af';
      console.log(name, file, expected.size);
      curl([url, '--max-time', '360', '-o', path + '.part']);
      assert.equal((await stat(path + '.part')).size, expected.size, file);
      if (expected.lfs) assert.equal(await sha256(path + '.part'), expected.lfs.oid, file);
      await rename(path + '.part', path);
    }
    hashes[path.slice(base.length + 1)] = { bytes: expected.size, sha256: await sha256(path) };
  }
}

await download(model.repository, model.revision, base, [
  ...tokenizerFiles, ...graphFiles(model, 'fp32'),
  ...(name === 'harrier' ? [] : graphFiles(model, 'int8')),
]);
await download(model.source, model.sourceRevision, base + '/reference', [
  ...tokenizerFiles, 'config.json', 'model.safetensors',
]);
await writeFile(base + '/probes.json', JSON.stringify({
  pooling: model.pooling, probes: probes.map(([mode, text]) => inputText(model, mode, text)),
}));
await writeFile(base + '/assets.json', JSON.stringify(hashes, null, 2));
