// SPDX-License-Identifier: AGPL-3.0-or-later
import type { APIRoute } from 'astro';
import { routes } from '../i18n/strings';

export const GET: APIRoute = ({ site }) => {
  const escapeUrl = (path: string) => new URL(path, site).href
    .replaceAll('&', '&amp;')
    .replaceAll('"', '&quot;');

  const entries = Object.values(routes).flatMap(({ en, de }) => {
    const alternates = [
      ['en', escapeUrl(en)],
      ['de', escapeUrl(de)],
      ['x-default', escapeUrl(en)],
    ].map(([lang, url]) => `    <xhtml:link rel="alternate" hreflang="${lang}" href="${url}"/>`).join('\n');

    return [en, de].map((path) => `  <url>
    <loc>${escapeUrl(path)}</loc>
${alternates}
  </url>`);
  });

  return new Response(`<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
${entries.join('\n')}
</urlset>
`, { headers: { 'Content-Type': 'application/xml; charset=utf-8' } });
};
