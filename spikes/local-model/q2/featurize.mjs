import { readFile, writeFile } from 'node:fs/promises';
import { openEncoder } from './encoder.mjs';

const modes = process.argv.slice(2);
const encoder = await openEncoder();
try {
  for (const mode of modes.length ? modes : ['request', 'save']) {
    if (!['request', 'save'].includes(mode)) throw new Error('Choose a training mode.');
    const rows = JSON.parse(await readFile(`.cache/q2/${mode}-train.json`, 'utf8'));
    const first = await encoder.encode(rows[0].text);
    const output = new Float32Array(rows.length * first.length);
    output.set(first);
    for (let index = 1; index < rows.length; index++) {
      output.set(await encoder.encode(rows[index].text), index * first.length);
      if (index % 2000 === 0) console.log(mode, index, '/', rows.length);
    }
    await writeFile(`.cache/q2/${mode}-train.f32`, new Uint8Array(output.buffer));
  }
} finally {
  await encoder.release();
}
