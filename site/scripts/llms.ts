// SPDX-License-Identifier: AGPL-3.0-or-later
import { docs, type Block } from '../src/i18n/pages';
import { routes, t, type Lang, type RouteKey } from '../src/i18n/strings';

const languages = ['en', 'de'] as const;
const labels = { en: 'English', de: 'Deutsch' };
const documentKeys = Object.keys(routes).filter(
  (key): key is keyof typeof docs.en => key !== 'home',
);

function link(label: string, path: string, site: URL) {
  return `[${label}](${new URL(path, site).href})`;
}

export function renderIndex(site: URL) {
  const sections = languages.map((lang) => {
    const { hero } = t(lang);
    const title = `${hero.h1a} ${hero.h1b}`;
    const description = `${hero.eyebrow}. ${hero.sub.join(' ')}`;
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
  if ('rows' in block) return bullets(block.rows.map(({ k, v }) => `${k}: ${v}`));
  if ('tiles' in block) return bullets(block.tiles.map(({ t, d, tag }) =>
    `${t}${tag ? ` (${tag})` : ''}: ${d}`,
  ));
  if ('refs' in block) return bullets(block.refs.map(({ name, href, v }) =>
    `${link(name, href, site)}: ${v}`,
  ));
  return block.p;
}

function renderHome(lang: Lang, site: URL) {
  const { hero, story, finale, footer, nav } = t(lang);
  return [
    `### ${hero.h1a} ${hero.h1b}`,
    new URL(routes.home[lang], site).href,
    hero.eyebrow,
    ...hero.sub,
    bullets(hero.trust.map(({ t }) => t)),
    `#### ${story.label}`,
    ...story.scenes.flatMap(({ h, p, more }) => [
      `##### ${h.join(' ')}`,
      p,
      link(nav.more, routes[more.to as RouteKey][lang] + more.hash, site),
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
      for (const { h, blocks } of doc.sections) {
        parts.push(`#### ${h}`, ...blocks.map((block) => renderBlock(block, site)));
      }
      return parts;
    }),
  ]);
  return ['# bleib', ...sections].join('\n\n') + '\n';
}
