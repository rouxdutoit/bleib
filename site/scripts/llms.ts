// SPDX-License-Identifier: AGPL-3.0-or-later
import { docs, type Block } from '../src/i18n/pages';
import { INSTALL } from '../src/config/install';
import { routes, t, type Lang, type RouteKey } from '../src/i18n/strings';

const languages = ['en', 'de'] as const;
const labels = { en: 'English', de: 'Deutsch' };
const documentKeys = Object.keys(routes).filter(
  (key): key is keyof typeof docs.en => key !== 'home',
);

function link(label: string, path: string, site: URL) {
  return `[${label}](${new URL(path, site).href})`;
}

/** Where bleib stands, so an agent doesn't tell people they can install it yet. */
function availability(lang: Lang, _site: URL) {
  return lang === 'de'
    ? 'In Entwicklung für Chrome und Edge ab Version 116 und Firefox ab Version 140.'
    : 'In development for Chrome and Edge 116 or later and Firefox 140 or later.';
}

export function renderIndex(site: URL) {
  const sections = languages.map((lang) => {
    const { hero } = t(lang);
    const title = `${hero.h1}`;
    const description = `${hero.eyebrow}. ${hero.sub.join(' ')} ${availability(lang, site)}`;
    const links = [
      `- ${link(title, routes.home[lang], site)}: ${description}`,
      ...documentKeys.map((key) => {
        const { title, description } = docs[lang][key];
        return `- ${link(title, routes[key][lang], site)}: ${description}`;
      }),
    ];
    return `## ${labels[lang]}\n\n${links.join('\n')}`;
  });

  return [
    '# bleib',
    `> ${t('en').meta.description}`,
    ...sections,
    `## Full site text\n\n- ${link('English and German', '/llms-full.txt', site)}`,
  ].join('\n\n') + '\n';
}

function bullets(items: readonly string[]) {
  return items.map((item) => `- ${item}`).join('\n');
}

function renderBlock(block: Block, site: URL) {
  if ('list' in block) return bullets(block.list);
  if ('never' in block) return bullets(block.never);
  if ('address' in block) return block.address.join('\n');
  if ('code' in block) return ['```', block.code, '```'].join('\n');
  if ('commands' in block) return ['```', ...block.commands, '```'].join('\n');
  if ('rows' in block) return bullets(block.rows.map(({ k, v }) => `${k}: ${v}`));
  if ('tiles' in block) return bullets(block.tiles.map(({ t, d, tag }) =>
    `${t}${tag ? ` (${tag})` : ''}: ${d}`,
  ));
  if ('refs' in block) return bullets(block.refs.map(({ name, href, v }) =>
    `${link(name, href, site)}: ${v}`,
  ));
  if ('plans' in block) {
    const { free, paid } = block.plans;
    return bullets([`${free.name}: ${free.price} ${free.per}. ${free.points.join('; ')}.`, `${paid.name}: ${paid.price} ${paid.per}, ${paid.alt}. ${paid.points.join('; ')}. ${paid.how}`]);
  }
  if ('compare' in block) {
    return bullets(block.compare.rows);
  }
  return block.p;
}

function renderHome(lang: Lang, site: URL) {
  const { hero, story, finale, footer } = t(lang);
  return [
    `### ${hero.h1}`,
    new URL(routes.home[lang], site).href,
    hero.eyebrow,
    ...hero.sub,
    availability(lang, site),
    `#### ${story.label}`,
    ...story.scenes.flatMap(({ h, p, more }) => [
      `##### ${h.join(' ')}`,
      p,
      link(more.label, routes[more.to as RouteKey][lang] + more.hash, site),
    ]),
    `#### ${finale.h}`,
    finale.p,
    footer.fine,
  ];
}

export function renderFullText(site: URL) {
  const sections = languages.flatMap((lang) => [
    `## ${labels[lang]}`,
    ...renderHome(lang, site),
    ...documentKeys.flatMap((key) => {
      const doc = docs[lang][key];
      const parts = [`### ${doc.title}`, new URL(routes[key][lang], site).href, ...doc.intro];
      if (doc.cta) parts.push(link(doc.cta.label, doc.cta.href, site));
      if (doc.hub) parts.push(bullets(doc.hub.map(({ to, t, d }) =>
        `${link(t, routes[to][lang], site)}: ${d}`,
      )));
      for (const { h, blocks, when } of doc.sections) {
        if (when && (when === 'paid') !== (INSTALL.launched && INSTALL.connectors)) continue;
        parts.push(`#### ${h}`, ...blocks.map((block) => renderBlock(block, site)));
      }
      return parts;
    }),
  ]);
  return ['# bleib', ...sections].join('\n\n') + '\n';
}
