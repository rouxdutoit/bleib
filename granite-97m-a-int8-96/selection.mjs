const slotIds = ["travel.seat","travel.transport","travel.room","travel.sights","travel.pace","travel.hotel_budget","travel.loyalty","travel.luggage","food.diet","food.allergy","food.drink","food.dessert","food.equipment","food.cook_time","food.servings","food.cuisine","format.units","format.length","format.language","work.review","work.stack","work.testing","work.writing_style","work.role","work.experience","work.rituals","work.confidential","shopping.laptop","shopping.shoe_size","shopping.fabric","shopping.headphones","shopping.host_gift","activities.sport","activities.home_equipment","health.condition","health.injury","health.medication","money.debt","money.buffer","money.investment","money.budget","people.child","people.sibling","people.parent","people.partner","location.home","location.office","schedule.availability","contact.phone","contact.email","education.course"];

const rules = [
  ['travel.seat', /^(?:(?:i prefer|i always choose|ich bevorzuge|ich nehme (?:im flieger )?immer) )?(?:an? |einen? )?(?:aisle seats?|window seats?|gangplatz|fensterplatz)$/iu],
  ['food.diet', /^(?:(?:i am|i['’]m|ich esse|ich bin) (?:a )?)?(?:vegetarian|vegan|vegetarisch|vegetarier(?:in)?|veganer(?:in)?)$/iu],
  ['food.drink', /^(?:i prefer (?:mint|green|black|jasmine) tea|ich bevorzuge (?:grünen|schwarzen) tee)$/iu],
  ['food.servings', /^(?:(?:i|we) (?:usually )?cook for (?:one|two|three|four|[1-8])|(?:ich koche|wir kochen) (?:meistens |normalerweise )?für (?:eine person|zwei|drei|vier|[1-8]))$/iu],
  ['format.length', /^(?:i prefer (?:short|long) answers|ich (?:mag|bevorzuge) (?:kurze|lange) antworten)$/iu],
];

const noSelection = [
  /[\p{Cc}\p{Cf}]/u,
  /<\|[^|]{1,32}\|>/u,
  /\b(?:ignore|disregard|override|vergiss|ignoriere|umgeh\w*)\b.{0,96}\b(?:instructions?|rules?|policies|anweisungen|regeln|vorgaben)\b/iu,
  /\b(?:all|every|entire|whole|alle|alles|ganz\w*)\b.{0,28}\b(?:saved|stored|memories|memory|dat[ae]|gespeichert\w*|angaben|einträge|namen)\b/iu,
  /\b(?:don't personalise|don't personalize|no personalisation|no personalization|no personal information|kein\w* persönlichen? (?:angaben|daten)|nichts auf mich zuschneiden|mein\w* persönlich\w* geschmack spielt keine rolle|meine ernährung spielt dabei keine rolle)\b/iu,
];

export const shouldAbstain = text => noSelection.some(pattern => pattern.test(text.normalize('NFKC')));

export function rankSlots(scores, available = slotIds) {
  if (scores?.length !== slotIds.length || !scores.every(score => Number.isFinite(score) && score >= 0 && score <= 1)) return [];
  const allowed = new Set(available);
  return slotIds.map((slot, index) => ({ slot, score: scores[index] }))
    .filter(({ slot }) => allowed.has(slot))
    .sort((a, b) => b.score - a.score || a.slot.localeCompare(b.slot));
}

export const saveRule = text => rules.find(([, pattern]) =>
  pattern.test(text.normalize('NFKC').trim().replace(/[.!]$/u, '')))?.[0];

export function assignSlot(text, scores) {
  if (shouldAbstain(text)) return { slot: '-', source: 'unassigned' };
  const rule = saveRule(text);
  if (rule) return { slot: rule, source: 'template' };
  const [first, second] = rankSlots(scores);
  if (!first || first.score < 0.55 || first.score - second.score < 0.15) return { slot: '-', source: 'unassigned' };
  return { slot: first.slot, source: 'model', confidence: first.score };
}

export function entriesBySlot(entries) {
  const result = new Map();
  for (const entry of entries) {
    if (!slotIds.includes(entry.slot)) continue;
    // Collisions require local disambiguation. Broad relevance alone cannot choose whose fact to use.
    result.set(entry.slot, result.has(entry.slot) ? null : entry);
  }
  return new Map([...result].filter(([, entry]) => entry));
}

export function selectSlots(row, entries, floors, automatic = false, guarded = true) {
  if (guarded && shouldAbstain(row.text)) return [];
  const available = [...entries.keys()].filter(slot => !automatic || entries.get(slot).automatic);
  return rankSlots(row.scores, available).slice(0, 2)
    .filter(({ score }, index) => score >= floors[index]).map(({ slot }) => slot);
}

export function splitConfidence(row, entries, floors, width) {
  const certain = [];
  const unsure = [];
  if (shouldAbstain(row.text)) return { certain, unsure };
  const ranked = rankSlots(row.scores, [...entries.keys()]);
  ranked.slice(0, 2).forEach(({ slot, score }, index) => {
    const floor = floors[index];
    if (floor > 1) return;
    if (score > floor + width) certain.push(slot);
    else if (score >= floor - width) unsure.push(slot);
  });
  return { certain, unsure };
}

export const mapSlots = (slots, entries) => slots.flatMap(slot => {
  const entry = entries.get(slot);
  return entry ? [entry.id] : [];
});
