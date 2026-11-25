import assert from 'node:assert/strict';
import test from 'node:test';
import { loadWallet, runBaseline } from './baseline.mjs';
import { drafts, memory } from './corpus.mjs';
import { calibrate, metrics, pick } from './evaluate.mjs';
import { previewDecision } from './policy.mjs';

test('the corpus has two languages, disjoint scenarios, valid labels and negative examples', () => {
  assert.equal(new Set(memory.map(entry => entry.id)).size, 40);
  assert.equal(new Set(drafts.map(draft => draft.id)).size, 200);
  for (const lang of ['en', 'de']) {
    const heldOut = drafts.filter(draft => draft.lang === lang && draft.split === 'test');
    assert.equal(heldOut.length, 76);
    assert(heldOut.some(draft => !draft.relevant.length));
    for (const draft of heldOut.filter(draft => ['ambiguous', 'adversarial'].includes(draft.category))) {
      assert.deepEqual(draft.relevant, []);
    }
  }
  for (const draft of drafts) {
    const parallel = drafts.find(candidate => candidate.id === draft.id.slice(0, -2) + (draft.lang === 'en' ? 'de' : 'en'));
    assert.equal(draft.split, parallel.split);
    assert.equal(new Set(draft.relevant).size, draft.relevant.length);
    assert(draft.relevant.length <= 2);
    assert(draft.relevant.every(id => memory.some(entry => entry.id === id)));
  }
});

test('selection may abstain, caps picks at two and can pick distinct entries of the same kind', () => {
  const entries = memory.slice(0, 3);
  assert.deepEqual(pick([0.92, 0.89, 0.88], entries, [0.8, 0.85]), ['M01', 'M02']);
  assert.deepEqual(pick([0.92, 0.84, 0.83], entries, [0.8, 0.85]), ['M01']);
  assert.deepEqual(pick([0.1, 0.2, 0.3], entries, [0.8, 0.85]), []);
  assert.deepEqual(pick([0.99, NaN, 0.93], entries, [0.8, 0.85]), []);
  assert.deepEqual(pick([0.9], entries, [0.8, 0.85]), []);
});

test('calibration and micro metrics distinguish empty predictions, false picks and missed entries', () => {
  const entries = memory.slice(0, 2);
  const dev = [{ scores: [0.95, 0.8], relevant: ['M01'] }, { scores: [0.3, 0.2], relevant: [] }];
  const floors = calibrate(dev, entries);
  assert.deepEqual(pick(dev[0].scores, entries, floors), ['M01']);
  assert.deepEqual(pick(dev[1].scores, entries, floors), []);
  assert.equal(calibrate(dev.map(row => ({ ...row, lang: 'en' })), entries,
    { minimumPrecision: 0.9, minimumPicks: 1 }), undefined);
  const result = metrics([
    { relevant: ['M01', 'M02'], selected: ['M01'] },
    { relevant: [], selected: ['M03'] },
  ]);
  assert.deepEqual([result.precision, result.recall, result.f1, result.picksOnNegative], [0.5, 0.5, 0.5, 1]);
});

test('the current chooser cannot select two memories of the same kind', async () => {
  const baseline = await runBaseline();
  for (const id of ['S25-en', 'S25-de']) {
    const row = baseline.rows.find(row => row.id === id);
    assert(row);
    assert(!['M01', 'M02'].every(entry => row.selected.includes(entry)));
  }
});

test('scores never control permission and protected or uncertain picks always ask', async () => {
  const wallet = await loadWallet();
  const grant = { introduced: true, automatic: true };
  const ordinary = memory[0];
  assert.equal(previewDecision(ordinary, wallet, { automatic: true }), 'ask');
  assert.equal(previewDecision(ordinary, wallet, { introduced: true }), 'ask');
  assert.equal(previewDecision(ordinary, wallet, grant), 'automatic');
  assert.equal(previewDecision(ordinary, wallet, { ...grant, privateKinds: new Set(['preferences']) }), 'ask');
  for (const entry of memory.filter(entry => entry.policy === 'ask')) {
    assert.equal(previewDecision({ ...entry, score: 1 }, wallet, grant), 'ask');
    assert.equal(previewDecision({ ...entry, policy: 'ordinary', score: 1 }, wallet, grant), 'ask');
  }
  assert.equal(previewDecision({ ...ordinary, kind: 'unknown' }, wallet, grant), 'ask');
  assert.equal(previewDecision({ ...ordinary, ownerOnly: true }, wallet, grant), 'omit');
  assert.equal(previewDecision({ ...ordinary, supersededBy: 'M02' }, wallet, grant), 'omit');
});
