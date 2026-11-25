export const candidates = {
  'e5-int8': {
    repository: 'Xenova/multilingual-e5-small',
    revision: '761b726dd34fb83930e26aab4e9ac3899aa1fa78',
    queryPrefix: 'query: ',
    memoryPrefix: 'passage: ',
  },
  'minilm-int8': {
    repository: 'Xenova/paraphrase-multilingual-MiniLM-L12-v2',
    revision: '2c4055b12046f11709e9df2c122e59ffbdc2f900',
  },
  'static-int8': {
    repository: 'sentence-transformers/static-similarity-mrl-multilingual-v1',
    revision: 'b68f4122911bcffcd6e1f695f2d99cd6788972d8',
    tokenizer: '0_StaticEmbedding/tokenizer.json',
    pooling: 'static',
  },
  'granite-ibm-int8': {
    repository: 'ibm-granite/granite-embedding-97m-multilingual-r2',
    revision: '835ad14087e140460703cf0fae09f97d469d65c2',
    pooling: 'cls',
    graph: 'onnx/model_quint8_avx2.onnx',
  },
  'granite-int8': {
    repository: 'onnx-community/granite-embedding-97m-multilingual-r2-ONNX',
    revision: '536a9f241cb3f02a9c5995a1e708c784bd274859',
    pooling: 'cls',
  },
  'granite-q4f16': {
    repository: 'onnx-community/granite-embedding-97m-multilingual-r2-ONNX',
    revision: '536a9f241cb3f02a9c5995a1e708c784bd274859',
    pooling: 'cls',
    graph: 'onnx/model_q4f16.onnx',
  },
};
