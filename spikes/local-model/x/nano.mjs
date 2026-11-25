export const languages = ['en', 'de'];

export function nanoOptions(lang) {
  const text = [{ type: 'text', languages: [lang] }];
  return { expectedInputs: text, expectedOutputs: text };
}

export async function nanoAvailability(api) {
  return Object.fromEntries(await Promise.all(languages.map(async lang => {
    try {
      return [lang, api ? await api.availability(nanoOptions(lang)) : 'API absent'];
    } catch (error) {
      return [lang, String(error)];
    }
  })));
}

export async function openNano(api, lang, activation, progress, timeoutMs) {
  if (!activation()) throw new Error('Gemini Nano needs a click on the extension page.');
  const start = performance.now();
  const events = [];
  const controller = new AbortController();
  const timer = setTimeout(() =>
    controller.abort(new DOMException('Nano session creation timed out.', 'TimeoutError')), timeoutMs);
  const root = await api.create({
    ...nanoOptions(lang),
    signal: controller.signal,
    monitor(monitor) {
      monitor.addEventListener('downloadprogress', ({ loaded, total }) => {
        const percentage = Math.min(100, Math.floor(100 * (total > 0 ? loaded / total : loaded)));
        const event = { loaded, total, percentage, ms: performance.now() - start };
        events.push(event);
        progress(percentage, event);
      });
    },
  }).finally(() => clearTimeout(timer));
  return {
    events, createMs: performance.now() - start,
    async generate(messages, schema) {
      // Prompt API sessions accumulate history, so each draft gets its own clone.
      const signal = AbortSignal.timeout(90_000);
      const session = await root.clone({ signal });
      try {
        return await session.prompt(messages, { responseConstraint: schema, signal });
      } finally {
        session.destroy();
      }
    },
    close: () => root.destroy(),
  };
}
