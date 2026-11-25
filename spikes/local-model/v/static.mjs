import { features, dimensions } from '../q2/subwords.mjs';
import { assignSlot, entriesBySlot } from '../q2/selection.mjs';

const sigmoid = value => 1 / (1 + Math.exp(-value));

async function loadHead(mode, slots) {
  const response = await fetch(`model/${mode}-static.bin`);
  if (!response.ok) throw new Error('The bundled classifier table could not be loaded.');
  const bytes = await response.arrayBuffer();
  if (bytes.byteLength !== slots * (8 + dimensions)) throw new Error('The classifier table has an invalid size.');
  const scales = new Float32Array(bytes, 0, slots);
  const bias = new Float32Array(bytes, slots * 4, slots);
  const weights = new Int8Array(bytes, slots * 8);
  return text => {
    const values = features(text);
    const scale = Math.max(0, ...values.map(([, value]) => value)) / 255;
    const totals = new Int32Array(slots);
    for (const [index, value] of values) {
      const scaled = value / scale;
      const rounded = scaled % 1 === 0.5 ? 2 * Math.round(scaled / 2 - 0.25) : Math.round(scaled);
      for (let slot = 0; slot < slots; slot++) totals[slot] += rounded * weights[index * slots + slot];
    }
    return Array.from(bias, (offset, slot) => sigmoid(offset + totals[slot] * scale * scales[slot]));
  };
}

export async function open(_name, slots) {
  const [save, score] = await Promise.all(['save', 'request'].map(mode => loadHead(mode, slots.length)));
  return {
    score,
    index(entries) {
      return entriesBySlot(entries.map(entry => ({ ...entry, slot: assignSlot(entry.text, save(entry.text)).slot })));
    },
  };
}
