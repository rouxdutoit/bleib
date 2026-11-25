import { readFileSync } from 'node:fs';
import { writeFile, mkdir } from 'node:fs/promises';

const dir = '.cache/q2';
const read = name => readFileSync(new URL(name, import.meta.url), 'utf8').trim().split('\n');
const targets = read('slots.tsv').slice(1).map(line => line.split('\t')[0]);
const languages = ['en', 'de'];
const openings = [
  ['', 'Can you help? ', 'I could use some advice. ', 'Quick question. ', 'Tell me what you think. ',
    'Could you make this practical? ', 'I’m putting together a plan. ', 'Any ideas? '],
  ['', 'Kannst du mir helfen? ', 'Ich könnte einen Rat gebrauchen. ', 'Kurze Frage. ', 'Was meinst du? ',
    'Kannst du es alltagstauglich machen? ', 'Ich mache mir gerade einen Plan. ', 'Hast du eine Idee? '],
];
const endings = [
  ['', ' I’m open to ideas.', ' Give me a couple of options.', ' I have to decide soon.', ' Where should I start?',
    ' Make it practical, please.', ' Let’s keep it simple.', ' I can give more details if needed.'],
  ['', ' Ich bin offen für Ideen.', ' Gib mir zwei oder drei Möglichkeiten.', ' Ich muss mich bald entscheiden.',
    ' Womit fange ich an?', ' Es soll alltagstauglich sein.', ' Mach es einfach.', ' Ich kann bei Bedarf mehr dazu sagen.'],
];
const savePrefix = [
  ['', 'A bit about me: ', 'For future reference, ', 'One detail I forgot to mention: ', 'Just so you know, '],
  ['', 'Kurz zu mir: ', 'Für später: ', 'Eine Sache hatte ich vergessen: ', 'Nur damit du Bescheid weißt: '],
];
const saveSuffix = [
  ['', ' That’s my usual choice.', ' This has been my default for a while.', ' That has worked well for me.'],
  ['', ' Das mache ich normalerweise so.', ' Das ist schon länger so.', ' Damit komme ich gut zurecht.'],
];

function rng(seed) {
  return size => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return Math.floor(seed / 2 ** 32 * size);
  };
}

const expand = (text, index) => text.replace(/\{([^{}]+)\}/gu, (_, options) => {
  const choices = options.split('/');
  return choices[index(choices.length)];
});
const choose = (options, index) => options[index(options.length)];

function frames(name) {
  return read(name).map(line => {
    const [slot, ...pairs] = line.split('|');
    if (!targets.includes(slot) || pairs.length % 2) throw new Error(`Invalid training rule ${slot}.`);
    return { slot, pairs };
  });
}

const partners = new Map(Object.entries({
  'travel.seat': ['food.diet', 'travel.luggage'], 'travel.transport': ['travel.room', 'travel.loyalty'],
  'travel.sights': ['travel.pace', 'people.child'], 'food.diet': ['food.cook_time', 'food.servings', 'food.allergy'],
  'food.equipment': ['food.cook_time', 'format.units'], 'work.role': ['work.experience'],
  'work.stack': ['work.testing'], 'work.writing_style': ['schedule.availability'],
  'shopping.shoe_size': ['shopping.fabric'], 'health.condition': ['health.injury', 'health.medication'],
  'money.debt': ['money.buffer'], 'money.investment': ['money.budget'],
  'people.child': ['travel.pace'], 'location.home': ['shopping.laptop'], 'activities.sport': ['activities.home_equipment'],
}));
const joint = new Map([
  ['travel.seat:1', ['travel.seat', 'food.diet']], ['travel.seat:2', ['travel.seat', 'food.diet']],
]);
const tasks = frames('tasks.txt');
const saves = frames('save.txt');
const forSlot = new Map(tasks.map(row => [row.slot, row.pairs]));

function generateRequests(index, put) {
  for (const { slot, pairs } of tasks) {
    for (let lang = 0; lang < languages.length; lang++) {
      for (let frame = 0; frame < pairs.length / 2; frame++) {
        const labels = joint.get(`${slot}:${frame}`) ?? [slot];
        for (let repeat = 0; repeat < 28; repeat++) {
          const core = expand(pairs[frame * 2 + lang], index);
          const prefix = repeat % 3 === 0 ? '' : choose(openings[lang], index);
          const suffix = repeat % 3 === 1 ? '' : choose(endings[lang], index);
          put(languages[lang], prefix + core + suffix, labels);
        }
      }
      for (const other of partners.get(slot) ?? []) {
        const otherPairs = forSlot.get(other);
        for (let sample = 0; sample < 20; sample++) {
          const first = expand(pairs[lang], index);
          const second = expand(otherPairs[2 * index(otherPairs.length / 2) + lang], index);
          const lead = sample % 2 === 0 ? [first, second] : [second, first];
          put(languages[lang], lead.join(lang === 0 ? ' One more thing: ' : ' Noch etwas: '), [slot, other]);
        }
      }
    }
  }
}

function generateStatements(index, put) {
  for (const { slot, pairs } of saves) {
    for (let lang = 0; lang < languages.length; lang++) {
      for (let frame = lang; frame < pairs.length; frame += 2) {
        for (let sample = 0; sample < 32; sample++) {
          const core = expand(pairs[frame], index);
          put(languages[lang], choose(savePrefix[lang], index) + core + choose(saveSuffix[lang], index), [slot]);
        }
      }
    }
  }
}

function data(mode, seed, name, generate) {
  const index = rng(seed);
  const rows = new Map();
  function put(lang, text, labels) {
    const key = text.normalize('NFKC').toLowerCase().trim();
    const targets = [...new Set(labels)].sort();
    const previous = rows.get(key);
    if (previous && previous.labels.join() !== targets.join()) throw new Error(`Conflicting labels for ${text}`);
    rows.set(key, { lang, text, labels: targets });
  }

  generate(index, put);
  for (const line of read(name)) {
    const pair = line.split('|');
    if (pair.length !== 2) throw new Error(`Invalid bilingual negative: ${line}`);
    for (const [lang, template] of pair.entries()) {
      for (let sample = 0; sample < 34; sample++) {
        const core = expand(template, index);
        const continuation = mode === 'request' ? choose(endings[lang], index) : choose(saveSuffix[lang], index);
        put(languages[lang], core + (sample % 3 === 0 ? '' : continuation), []);
      }
    }
  }
  return [...rows.values()];
}

await mkdir(dir, { recursive: true });
for (const [mode, seed, negatives, generate] of [
  ['request', 84941, 'request-negatives.txt', generateRequests],
  ['save', 78244, 'save-negatives.txt', generateStatements],
]) {
  const rows = data(mode, seed, negatives, generate);
  await writeFile(`${dir}/${mode}-train.json`, JSON.stringify(rows));
  console.log(mode, rows.length, 'unique synthetic texts', rows.filter(row => !row.labels.length).length, 'negatives');
}
