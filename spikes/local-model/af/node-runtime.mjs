import { createRequire } from 'node:module';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { openEncoder } from './encoder.mjs';
import { models } from './models.mjs';

const require = createRequire(import.meta.url);
export const ort = require('onnxruntime-node');
export const modelRoot = name => resolve('.cache', 'models', name);
export const variantRoot = (name, variant) => resolve('.cache', 'train', name, variant);
export const json = async path => JSON.parse(await readFile(path, 'utf8'));
export const nodeEncoder = (name, variant, threads) => {
  const asset = file => resolve(modelRoot(name), file);
  return openEncoder(ort, models[name], variant, file => json(asset(file)), asset, 'cpu', threads);
};
