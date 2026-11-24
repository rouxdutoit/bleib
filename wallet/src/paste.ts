import { UserError, type Kind } from './domain.js';
import { maxMemoryBytes } from './memory.js';

export type MemoryApp = 'ChatGPT' | 'Claude';

const categories: [Kind, RegExp][] = [
  ['credentials', /\b(password|passphrase|api key|access token|recovery code)\b/i],
  ['health', /\b(health|doctor|medication|diagnos\w*|dentist|allerg\w*|therapy)\b/i],
  ['finances', /\b(financ\w*|mortgage|salary|bank|income|tax|debt)\b/i],
  ['relationships', /\b(partner|spouse|family|siblings?|children|parents?)\b/i],
  ['contact', /\b(email|phone number|postal address)\b/i],
  ['identity', /\b(my name|birthday|pronouns)\b/i],
  ['work', /\b(work|project|office|team|employer|job)\b/i],
  ['education', /\b(study|degree|university|school|learning|course)\b/i],
  ['location', /\b(lives? in|based in|hometown|moved to)\b/i],
  ['schedule', /\b(appointment|meeting|schedule|every morning|every week)\b/i],
  ['activities', /\b(hobb\w*|cycling|hiking|gardening|playing|running)\b/i],
  ['preferences', /\b(prefer\w*|favou?rite|likes?|dislikes?|enjoys?)\b/i],
];

const bullet = /^\s*(?:[-*+•‣▪]\s+|\d+[.)]\s+)(.+)$/u;
const heading = /^(?:#{1,6}\s+|(?:saved memories|memories|memory|manage memories|chatgpt memory|claude memory|what claude remembers about you)\s*:?\s*$)/i;

export function splitPastedMemory(input: string) {
  if (Buffer.byteLength(input) > maxMemoryBytes) throw new UserError('Paste up to 128 KiB of memory at a time.');
  const entries: string[] = [];
  let current: string[] = [];
  const flush = () => {
    if (current.length) entries.push(current.join('\n'));
    current = [];
  };
  for (const line of input.split(/\r?\n/)) {
    const clean = line.trim();
    const item = bullet.exec(line);
    if (!clean || heading.test(clean)) {
      flush();
    } else if (item) {
      flush();
      current.push(item[1]!.trim());
    } else if (/^\s/.test(line) && current.length) {
      current.push(clean);
    } else {
      flush();
      current.push(clean);
    }
  }
  flush();
  if (!entries.length) throw new UserError('Paste at least one memory.');
  if (entries.length > 100 || entries.some(entry => entry.length > 8000)) {
    throw new UserError('Paste up to 100 entries with no more than 8,000 characters each.');
  }
  return entries.map(content => {
    const matching = categories.filter(([, pattern]) => pattern.test(content));
    const kind = matching.length === 1 ? matching[0]![0] : 'private';
    return { content, kind };
  });
}
