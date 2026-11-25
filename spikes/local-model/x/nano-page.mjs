import { languages, nanoAvailability, openNano } from './nano.mjs';
import { asPicker, scoreDrafts } from './scoring.mjs';

const status = document.querySelector('#status');
const api = globalThis.LanguageModel;
function progress(message) {
  status.textContent = message;
  console.info('[run-x] ' + message);
}

export const availability = () => nanoAvailability(api);
export function prepare(lang, timeoutMs) {
  const button = document.querySelector('#' + lang);
  status.lang = lang;
  globalThis.nanoEvents = [];
  globalThis.nanoOpening = new Promise(resolve => {
    button.disabled = false;
    button.onclick = () => {
      button.disabled = true;
      progress(lang === 'de' ? 'Gemini Nano DE · Sitzung wird geöffnet' : 'Gemini Nano EN · opening session');
      resolve(openNano(api, lang, () => navigator.userActivation.isActive,
        (percent, event) => {
          globalThis.nanoEvents.push(event);
          progress(`Gemini Nano ${lang.toUpperCase()} · download ${percent}%`);
        }, timeoutMs));
    };
  });
  // The browser driver awaits the promise after the click command returns.
  globalThis.nanoOpening.catch(() => {});
}

let session;
export async function ready() {
  session = await globalThis.nanoOpening;
  return { events: session.events, createMs: session.createMs };
}

export async function benchmark(lang, workload) {
  const picker = asPicker(session.generate);
  const result = await scoreDrafts(workload, picker, row => globalThis.recordX('nano', row),
    message => progress(`Gemini Nano ${lang.toUpperCase()} · ${message}`));
  return { ...result, control: (await picker.control()).valid };
}

export function close() {
  session?.close();
  session = undefined;
}

globalThis.nanoX = { availability, prepare, ready, benchmark, close };
