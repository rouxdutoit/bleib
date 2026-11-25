import { writeFile } from 'node:fs/promises';
import { fallback, setup } from './experiment.mjs';
import { runReasoner } from './reason.mjs';

const { rows, confidence } = await setup();
const queued = rows.filter(row => confidence.get(row.id).unsure.length);
const shortlists = Object.fromEntries(queued.map(row => [row.id, confidence.get(row.id).unsure]));
const result = await runReasoner(fallback, queued, shortlists);
await writeFile('.cache/q2/cascade.json', JSON.stringify(result));
