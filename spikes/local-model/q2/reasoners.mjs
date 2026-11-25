export const reasoners = {
  'qwen-0.6b': {
    repo: 'unsloth/Qwen3-0.6B-GGUF', revision: '50968a4468ef4233ed78cd7c3de230dd1d61a56b',
    file: 'Qwen3-0.6B-Q4_K_M.gguf',
    sha256: 'ac2d97712095a558e31573f62f466a3f9d93990898b0ec79d7c974c1780d524a',
  },
  'qwen-1.7b': {
    repo: 'unsloth/Qwen3-1.7B-GGUF', revision: 'd7f544eead698dbd1f15126ef60b45a1e1933222',
    file: 'Qwen3-1.7B-Q4_K_M.gguf',
    sha256: 'b139949c5bd74937ad8ed8c8cf3d9ffb1e99c866c823204dc42c0d91fa181897',
  },
};

export const reasonerPath = name => `.cache/q2/${reasoners[name].file}`;
