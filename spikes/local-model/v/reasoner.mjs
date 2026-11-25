import { parseIds, pickerInput } from './pick.mjs';

export function usePicker(generate, compact = false) {
  return {
    async control() {
      const slots = new Map([['first', { id: 'control' }]]);
      const descriptions = new Map([['first', 'first option']]);
      const { schema } = pickerInput('', slots, descriptions);
      const raw = await generate([{
        role: 'user', content: 'For this format check, output {"ids":[1]} exactly.',
      }], schema);
      return { valid: parseIds(raw, ['control'])?.[0] === 'control', raw };
    },
    async pick(row, available, descriptions) {
      if (!available.size) return { selected: [] };
      const { messages, schema, slots } = pickerInput(row.text, available, descriptions, compact);
      const completion = await generate(messages, schema);
      const parsed = parseIds(completion, slots);
      return { selected: (parsed ?? []).map(slot => available.get(slot).id), invalid: parsed === null };
    },
  };
}
