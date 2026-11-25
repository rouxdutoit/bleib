const mini = 'paraphrase-multilingual-MiniLM-L12-v2';
const granite = (size, sourceRevision, revision) => ({
  source: 'ibm-granite/granite-embedding-' + size + '-multilingual-r2',
  sourceRevision,
  repository: 'onnx-community/granite-embedding-' + size + '-multilingual-r2-ONNX',
  revision,
  pooling: 'cls',
});

export const models = {
  minilm: {
    source: 'sentence-transformers/' + mini,
    sourceRevision: 'e8f8c211226b894fcb81acc59f3b34ba3efd5f42',
    repository: 'Xenova/' + mini,
    revision: '2c4055b12046f11709e9df2c122e59ffbdc2f900',
    pooling: 'mean',
  },
  harrier: {
    source: 'microsoft/harrier-oss-v1-270m',
    sourceRevision: '31de22b673913c7d658c0f03f792d77c2dcf8ebd',
    repository: 'onnx-community/harrier-oss-v1-270m-ONNX',
    revision: 'd59c919d0159aea2c19ed7d04288fcdd048d0f9c',
    pooling: 'last',
    external: true,
    fitThreads: 4,
    instructions: {
      request: 'Identify which saved personal context categories materially help answer the draft',
      save: 'Identify the category of the saved personal fact',
    },
  },
  granite97: granite('97m', '835ad14087e140460703cf0fae09f97d469d65c2', '536a9f241cb3f02a9c5995a1e708c784bd274859'),
  granite311: { ...granite('311m', '44399559930365213510b1ee2eb15ded83374f0e', '8f039f21d4181327268271bea4b11ddcc7eef88d'), fitThreads: 4 },
};

const suffixes = { fp32: '', int8: '_quantized', dynamic: '_dynamic', q4: '_q4' };
export const graphPath = variant => 'onnx/model' + suffixes[variant] + '.onnx';
export const tokenizerFiles = ['tokenizer.json', 'tokenizer_config.json'];
export const graphFiles = (model, variant) => {
  const graph = graphPath(variant);
  return model.external ? [graph, graph + (variant === 'int8' ? '.data' : '_data')] : [graph];
};
export const heads = ['request', 'save'];
export const headFile = mode => mode + '-int8.onnx';

export function inputText(model, mode, text) {
  return model.instructions ? 'Instruct: ' + model.instructions[mode] + '\nQuery: ' + text : text;
}

export const probes = [
  ['request', 'What is the tallest mountain in Japan?'],
  ['request', 'Wer hat das Lied Achy Breaky Heart geschrieben?'],
  ['request', 'ドイツの首都はどこですか？'],
  ['save', '富士山は、静岡県と山梨県にまたがる活火山で、標高3776.12 mで日本最高峰の山である。'],
  ['save', "Achy Breaky Heart is a country song written by Don Von Tress. Originally titled Don't Tell My Heart and performed by The Marcy Brothers in 1991."],
  ['save', 'Berlin ist die Hauptstadt und ein Land der Bundesrepublik Deutschland. Die Stadt ist with rund 3,7 Millionen Einwohnern die bevölkerungsreichste Kommune Deutschlands.'],
  ['request', 'Can you help me plan a meal after work?'],
  ['request', 'Kannst du mir beim Abendessen helfen?'],
  ['save', 'I usually pack a light jacket.'],
  ['save', 'Wir haben zu Hause zwei kleine Kaninchen.'],
];
