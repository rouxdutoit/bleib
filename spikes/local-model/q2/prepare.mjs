import { execFile } from 'node:child_process';
import { createHash } from 'node:crypto';
import { createReadStream } from 'node:fs';
import { mkdir, rename, rm, stat } from 'node:fs/promises';
import { promisify } from 'node:util';
import { reasoners, reasonerPath } from './reasoners.mjs';

const curl = promisify(execFile);

async function digest(path) {
  const hash = createHash('sha256');
  for await (const chunk of createReadStream(path)) hash.update(chunk);
  return hash.digest('hex');
}

await mkdir('.cache/q2', { recursive: true });
await Promise.all(Object.keys(reasoners).map(async name => {
  const { repo, revision, file, sha256 } = reasoners[name];
  const path = reasonerPath(name);
  if (!(await stat(path).catch(() => null))) {
    const partial = `${path}.${process.pid}.partial`;
    try {
      await curl('curl', ['-fSsL', '--retry', '2', '--max-time', '600', '-o', partial,
        `https://huggingface.co/${repo}/resolve/${revision}/${file}?download=true`]);
      if (await digest(partial) !== sha256) throw new Error(`Checksum mismatch for ${file}.`);
      await rename(partial, path);
    } finally {
      await rm(partial, { force: true });
    }
  } else if (await digest(path) !== sha256) {
    throw new Error(`Checksum mismatch for ${file}.`);
  }
  console.log(name, (await stat(path)).size, sha256);
}));
