import { candidates } from '../candidates.mjs';
import { reasoners } from '../q2/reasoners.mjs';

const { repo, revision, file, sha256 } = reasoners['qwen-0.6b'];
const tokenizer = ['tokenizer.json', 'tokenizer_config.json'];

export const encoders = {
  minilm: { ...candidates['minilm-int8'],
    digests: {
      'tokenizer.json': 'b60b6b43406a48bf3638526314f3d232d97058bc93472ff2de930d43686fa441',
    },
  },
  granite: { ...candidates['granite-int8'],
    digests: {
      'onnx/model_quantized.onnx': '704c1ebca5fbb7cd83ced41827658ac4c9990c64f7f2874d22b78044e5022e22',
    },
  },
  gemma: {
    repository: 'onnx-community/embeddinggemma-2-ONNX',
    revision: 'daa72c51243991dfcaf9f9137d2c573d8f7790c0',
    files: [...tokenizer, 'config.json', 'onnx/model_q4.onnx', 'onnx/model_q4.onnx_data'],
    digests: {
      'onnx/model_q4.onnx_data': 'c3975f2d1ab7a1878ae31a7d7a9b7804a827aff3800b60dfceafce21cac3df49',
    },
  },
};
for (const encoder of Object.values(encoders)) {
  encoder.files ??= [...tokenizer, encoder.graph ?? 'onnx/model_quantized.onnx'];
}

export const llms = {
  qwen3: { repository: repo, revision, files: [file], digests: { [file]: sha256 } },
  qwen35: {
    repository: 'unsloth/Qwen3.5-0.8B-GGUF',
    revision: '6ab461498e2023f6e3c1baea90a8f0fe38ab64d0',
    files: ['Qwen3.5-0.8B-Q4_K_M.gguf'],
    digests: {
      'Qwen3.5-0.8B-Q4_K_M.gguf': 'bd258782e35f7f458f8aced1adc053e6e92e89bc735ba3be89d38a06121dc517',
    },
  },
};

export const mlc = {
  repository: 'mlc-ai/Qwen3-0.6B-q4f16_1-MLC',
  revision: '8c14ce481d4c692769976ad52afea453a102df19',
  id: 'Qwen3-0.6B-q4f16_1-MLC',
  localRoot: 'model/resolve/pinned/',
  files: ['mlc-chat-config.json', 'ndarray-cache.json', 'tensor-cache.json', 'tokenizer.json'],
};
