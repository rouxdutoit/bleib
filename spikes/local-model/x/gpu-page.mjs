import { adapterInfo } from './webllm.mjs';
globalThis.adapterX = () => adapterInfo(navigator.gpu);
