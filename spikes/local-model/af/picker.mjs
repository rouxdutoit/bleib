import { assignSlot, entriesBySlot } from '../q2/selection.mjs';
import { blocked, ranked } from '../v/pick.mjs';
import { cpuOptions, openEncoder } from './encoder.mjs';
import { headFile, models } from './models.mjs';

async function openHead(ort, asset, mode, backend) {
  const session = await ort.InferenceSession.create(asset(headFile(mode)), {
    executionProviders: [backend], logSeverityLevel: 3, ...(backend === 'cpu' ? cpuOptions : {}),
  });
  return {
    async score(vector) {
      const input = new ort.Tensor('float32', vector, [1, vector.length]);
      const { scores } = await session.run({ embedding: input });
      try {
        return Array.from(scores.data);
      } finally {
        input.dispose();
        scores.dispose();
      }
    },
    release: () => session.release(),
  };
}

export async function openPicker(ort, name, variant, asset, loadJson, backend, headAsset = asset) {
  const encoder = await openEncoder(ort, models[name], variant, loadJson, asset, backend);
  const save = await openHead(ort, headAsset, 'save', backend);
  const request = await openHead(ort, headAsset, 'request', backend);
  return {
    async index(entries) {
      const labelled = [];
      for (const entry of entries) {
        const scores = await save.score(await encoder.encode('save', entry.text));
        labelled.push({ ...entry, slot: assignSlot(entry.text, scores).slot });
      }
      return entriesBySlot(labelled);
    },
    async score(text) { return request.score(await encoder.encode('request', text)); },
    async release() {
      await request.release();
      await save.release();
      await encoder.release();
    },
  };
}

export async function rankRows(picker, indexes, rows) {
  const output = [];
  for (const { id, text, vault } of rows) {
    const started = performance.now();
    const available = indexes[vault];
    const inferred = !blocked(text);
    const top = inferred ? ranked({ scores: await picker.score(text) }, available)
      .map(({ slot, score }) => ({ id: available.get(slot).id, score })) : [];
    output.push({ id, top, inferred, ms: performance.now() - started });
  }
  return output;
}
