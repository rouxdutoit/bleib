import { readFile } from 'node:fs/promises';
import { candidates } from './candidates.mjs';
import { memory, drafts } from './corpus.mjs';
import { compare, createEncoder } from './inference.mjs';

const candidate = candidates[process.argv[2]];
const root = `.cache/models/${candidate.repository}`;
const baselineRss = process.memoryUsage.rss();
let peakRss = baselineRss;
const sample = () => { peakRss = Math.max(peakRss, process.memoryUsage.rss()); };
const start = performance.now();
const ort = await import('onnxruntime-node');
const encoder = await createEncoder(ort, candidate, async name => JSON.parse(await readFile(`${root}/${name}`, 'utf8')),
  `${root}/${candidate.graph ?? 'onnx/model_quantized.onnx'}`, 'cpu');
const loadMs = performance.now() - start;
sample();
const result = await compare(encoder, candidate, memory, drafts, sample);
await encoder.release();
console.log(JSON.stringify({ ...result, loadMs, baselineRss, peakRss, maxRss: process.resourceUsage().maxRSS * 1024 }));
