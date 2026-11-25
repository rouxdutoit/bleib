export function accelerated(adapter) {
  return adapter?.isFallbackAdapter === false && adapter.shaderF16 === true;
}

export async function adapterInfo(gpu) {
  const adapter = await gpu?.requestAdapter({ powerPreference: 'high-performance' });
  if (!adapter) return null;
  const { vendor, architecture, device, description, isFallbackAdapter } = adapter.info;
  return { vendor, architecture, device, description, isFallbackAdapter,
    shaderF16: adapter.features.has('shader-f16'), maxBufferSize: adapter.limits.maxBufferSize };
}

export function webGenerator(engine, model) {
  return async (messages, schema) => {
    await engine.resetChat(false, model);
    const response = await engine.chat.completions.create({
      model, messages, temperature: 0, max_tokens: 32,
      response_format: { type: 'json_object', schema: JSON.stringify(schema) },
      extra_body: { enable_thinking: false },
    });
    return response.choices[0]?.message?.content ?? '';
  };
}
