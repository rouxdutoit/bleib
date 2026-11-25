import assert from 'node:assert/strict';
import { readFile, mkdir, mkdtemp, rm } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { resolve } from 'node:path';
import { test } from 'node:test';
import { profiles, rows, vaults } from './corpus.mjs';
import { blocked, parseIds, pickerInput, route } from './pick.mjs';

test('the frozen wallet has 104 new drafts, two blank probes and no foreign labels', () => {
  const holdout = rows.filter(row => row.split === 'second');
  assert.equal(new Set(holdout.map(row => row.id)).size, 104);
  assert.equal(holdout.filter(row => !row.text.trim()).length, 2);
  assert.equal(vaults.second.length, 40);
  for (const [vault, ids] of Object.entries(profiles)) {
    assert.equal(ids.length, 2);
    assert(ids.every(id => vaults[vault].some(entry => entry.id === id && entry.policy === 'ordinary')));
  }
});

test('fresh drafts and saved statements have zero exact overlap with the Q2 training generator', async () => {
  await mkdir('.cache', { recursive: true });
  const work = await mkdtemp(resolve('.cache', 'leak-check-'));
  try {
    execFileSync(process.execPath, [resolve('../q2/synthesize.mjs')], { cwd: work });
    const key = text => text.normalize('NFKC').toLowerCase().trim();
    for (const [training, test] of [
      ['request', rows.filter(row => row.split === 'second')], ['save', vaults.second],
    ]) {
      const examples = JSON.parse(await readFile(`${work}/.cache/q2/${training}-train.json`, 'utf8'));
      const trainingTexts = new Set(examples.map(row => key(row.text)));
      for (const { id, text } of test) assert(!trainingTexts.has(key(text)), id);
    }
  } finally {
    await rm(work, { recursive: true, force: true });
  }
});

test('the selector receives names of available slots and validates IDs independently of the grammar', () => {
  const available = new Map([['travel.seat', { id: 'V01', text: 'private test sentinel' }]]);
  const descriptions = new Map([['travel.seat', 'seat']]);
  const { messages, slots, schema } = pickerInput('Please choose a good berth.', available, descriptions);
  assert(!JSON.stringify(messages).includes('private test sentinel'));
  const compact = pickerInput('Please choose a good berth.', available, descriptions, true);
  assert(compact.messages[1].content.includes('1 travel.seat'));
  assert(!JSON.stringify(compact.messages).includes('private test sentinel'));
  assert.deepEqual(schema.properties.ids.items.enum, [1]);
  assert.deepEqual(parseIds('{"ids":[1]}', slots), ['travel.seat']);
  assert.deepEqual(parseIds('{"ids":[]}', slots), []);
  for (const response of ['{"ids":[1,1]}', '{"ids":[2]}', '{"ids":["1"]}', '{"ids":[],"raw":"x"}', 'Markdown']) {
    assert.equal(parseIds(response, slots), null);
  }
});

test('literal blanks abstain and the cascade routes only the confidence band', () => {
  assert(blocked(' \t'));
  const ranking = [{ slot: 'certain', score: 0.9 }, { slot: 'unsure', score: 0.77 }];
  const floors = [0.44, 0.88];
  assert.deepEqual(route(ranking, floors), { certain: ['certain'], unsure: ['unsure'] });
  assert.deepEqual(route(ranking, [0.44, 1.01]), { certain: ['certain'], unsure: [] });
});
