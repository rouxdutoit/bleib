import { readFile } from 'node:fs/promises';

export const dimensions = 8192;

function bucket(text) {
  let hash = 2166136261;
  for (let index = 0; index < text.length; index++) {
    hash = Math.imul(hash ^ text.charCodeAt(index), 16777619);
  }
  return (hash >>> 0) % dimensions;
}

export function features(text) {
  const tokens = text.normalize('NFKC').toLowerCase().match(/[\p{L}\p{M}\p{N}]+/gu) ?? [];
  const counts = new Map();
  function add(value, weight) {
    const index = bucket(value);
    counts.set(index, (counts.get(index) ?? 0) + weight);
  }
  tokens.forEach((word, index) => {
    add(word, 3);
    if (index > 0) add(tokens[index - 1] + ' ' + word, 2);
    const bounded = `^${word}$`;
    for (const width of [3, 4, 5]) {
      for (let offset = 0; offset <= bounded.length - width; offset++) {
        add('~' + bounded.slice(offset, offset + width), 1);
      }
    }
  });
  const norm = Math.sqrt([...counts.values()].reduce((sum, count) => sum + count ** 2, 0));
  return [...counts].map(([index, value]) => [index, Math.fround(value / norm)]);
}

export async function openStaticHead(mode, slots) {
  const bytes = await readFile(`.cache/q2/${mode}-static.bin`);
  if (bytes.length !== slots * (8 + dimensions)) throw new Error('Invalid static weight table.');
  const scales = Array.from({ length: slots }, (_, i) => bytes.readFloatLE(i * 4));
  const bias = Array.from({ length: slots }, (_, i) => bytes.readFloatLE((slots + i) * 4));
  const weights = new Int8Array(bytes.buffer, bytes.byteOffset + slots * 8, dimensions * slots);
  return {
    score(values) {
      if (!values.length) return bias.map(value => 1 / (1 + Math.exp(-value)));
      const scale = Math.max(...values.map(([, value]) => value)) / 255;
      const logits = new Int32Array(slots);
      for (const [index, value] of values) {
        // 0.5 is extremely rare with L2-normalized counts. Match ONNX ties-to-even anyway.
        const scaled = value / scale;
        const rounded = scaled % 1 === 0.5 ? 2 * Math.round(scaled / 2 - 0.25) : Math.round(scaled);
        for (let slot = 0; slot < slots; slot++) logits[slot] += rounded * weights[index * slots + slot];
      }
      return bias.map((offset, slot) => 1 / (1 + Math.exp(-(logits[slot] * scale * scales[slot] + offset))));
    },
  };
}
