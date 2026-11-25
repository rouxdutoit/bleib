import { spawnSync } from 'node:child_process';
import { mkdir, writeFile } from 'node:fs/promises';
import { candidates } from './candidates.mjs';

const targets = ['node', 'chromium', 'firefox'];
const [requestedTarget, ...selected] = process.argv.slice(2);
if (requestedTarget && !['all', ...targets].includes(requestedTarget)) throw new Error('Unknown runtime.');
const names = selected.length ? selected : Object.keys(candidates);
await mkdir('.cache', { recursive: true });
for (const target of targets.filter(target => !requestedTarget || requestedTarget === 'all' || target === requestedTarget)) {
  for (const name of names) {
    if (!Object.hasOwn(candidates, name)) throw new Error(`Unknown candidate ${name}.`);
    console.error(`Measuring ${name} with ${target}.`);
    const args = target === 'node' ? ['node-runner.mjs', name] : ['browser/run.mjs', target, name];
    const { stdout, stderr, status, error } = spawnSync(process.execPath, args, {
      encoding: 'utf8', maxBuffer: 5_000_000, timeout: 120_000,
    });
    const result = status === 0 ? JSON.parse(stdout)
      : { error: stderr.trim().replace(/\u001b\[[0-9;]*m/g, '') || String(error) };
    if (result.error) console.error(result.error.split('\n').find(line => line.startsWith('Error:')) ?? result.error);
    await writeFile(`.cache/${target}-${name}.json`, JSON.stringify(result) + '\n');
  }
}
