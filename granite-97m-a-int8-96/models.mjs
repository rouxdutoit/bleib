export const models = { granite97: { pooling: 'cls' } };
export const graphFiles = () => ['onnx/model_dynamic.onnx'];
export const tokenizerFiles = ['tokenizer.json', 'tokenizer_config.json'];
export const headFile = mode => mode + '-int8.onnx';
export const inputText = (model, mode, text) => text;
