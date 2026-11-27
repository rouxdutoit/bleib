// SPDX-License-Identifier: AGPL-3.0-or-later
// Run after npm run build with Playwright and its Chromium installed.
// An isolated Playwright install can be supplied via PLAYWRIGHT_MODULE, and a Chromium binary via CHROMIUM_PATH.
//
// Writes public/og.png (the logo alone, the language-neutral card), public/og/<card>-<lang>.png (one share card per
// page in layouts/Base.astro's list, each with that page's own title, plus a "site" card per language for every other
// page) and public/apple-touch-icon.png. Titles are read from the built pages, so they always match strings.ts and
// pages.ts.
import { mkdir, writeFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_MODULE ?? 'playwright');
const dist = new URL('../dist/', import.meta.url);
const output = new URL('../public/', import.meta.url);
const origin = 'https://bleib.invalid';
const viewport = { width: 1200, height: 630 };
const MAX_BYTES = 100_000;

/** The cards, keyed as in Base.astro. `from` says where the title comes from on the built page. */
const cards = [
  { name: 'home', from: 'hero', paths: { en: '/', de: '/de/' } },
  { name: 'privacy', from: 'h1', paths: { en: '/privacy/', de: '/de/datenschutz/' } },
  { name: 'app-privacy', from: 'h1', paths: { en: '/privacy/app/', de: '/de/datenschutz/app/' } },
  { name: 'receipts', from: 'h1', paths: { en: '/receipts/', de: '/de/belege/' } },
  // Every other page: the tagline from the homepage's <title> ("bleib: your AI memory wallet").
  { name: 'site', from: 'tagline', paths: { en: '/', de: '/de/' } },
];
const pagePaths = new Set(cards.flatMap(({ paths }) => Object.values(paths)));

const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined });

try {
  const page = await browser.newPage({
    viewport, colorScheme: 'light', deviceScaleFactor: 1, javaScriptEnabled: false,
  });
  await page.route('**/*', async (route) => {
    const { origin: host, pathname } = new URL(route.request().url());
    const isAsset = /^\/_astro\/[\w.-]+\.(?:css|woff2)$/.test(pathname);
    if (host !== origin || (!isAsset && pathname !== '/favicon.svg' && !pagePaths.has(pathname))) {
      await route.abort();
      return;
    }
    const file = pathname.endsWith('/') ? `${pathname.slice(1)}index.html` : pathname.slice(1);
    await route.fulfill({ path: fileURLToPath(new URL(file, dist)) });
  });

  const open = async (path) => {
    const response = await page.goto(origin + path);
    if (!response?.ok()) throw new Error(`Build the site before generating the images (${path} is missing).`);
  };
  const save = async (url) => {
    const png = await page.screenshot();
    if (png.length >= MAX_BYTES) throw new Error(`${url.pathname} must be under 100 KB.`);
    await writeFile(url, png);
  };

  // The language-neutral card: the logo alone.
  await open('/');
  await page.evaluate(() => {
    // The header logo is an outlined lockup (paths, no font), so it renders the same here as everywhere.
    const logo = document.querySelector('a.logo');
    if (!logo) throw new Error('The header logo is missing.');
    document.body.replaceChildren(logo);
    Object.assign(document.body.style, { display: 'grid', placeItems: 'center', height: '100vh' });
    logo.style.transform = 'scale(4)';
  });
  await save(new URL('og.png', output));

  // One card per page and language: the lockup above the page's title, centred, so square crops keep both.
  await mkdir(new URL('og/', output), { recursive: true });
  for (const { name, from, paths } of cards) {
    for (const [lang, path] of Object.entries(paths)) {
      await open(path);
      await page.evaluate((from) => {
        const text = (selector) => document.querySelector(selector)?.textContent?.replace(/\s+/g, ' ').trim();
        const tagline = document.title.replace(/^bleib:\s*/, '');
        const title = from === 'hero' ? text('#hero-title')
          : from === 'h1' ? text('main h1')
          : tagline.charAt(0).toLocaleUpperCase() + tagline.slice(1);
        const logo = document.querySelector('a.logo .logo-art');
        if (!title || !logo) throw new Error(`The title or logo is missing on ${location.pathname}.`);

        document.documentElement.removeAttribute('data-theme');
        const card = document.createElement('div');
        const heading = document.createElement('p');
        // Each sentence on its own line, as in the hero.
        heading.append(...title.split(/(?<=\.)\s+/).map((line) => Object.assign(document.createElement('span'), { textContent: line, style: 'display: block' })));
        logo.removeAttribute('aria-hidden');
        card.append(logo, heading);
        document.body.replaceChildren(card);
        Object.assign(document.body.style, {
          margin: '0', height: '100vh', display: 'grid', placeItems: 'center',
          background: '#f6e79a', color: '#0a0a0a',
        });
        Object.assign(card.style, {
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '40px', width: '840px', // 840 × 630 keeps a 4:3 crop whole
        });
        Object.assign(logo.querySelector('svg').style, { display: 'block', width: 'auto', height: '56px' });
        Object.assign(heading.style, {
          margin: '0', textAlign: 'center', textWrap: 'balance',
          fontFamily: "'Inter', sans-serif", fontFeatureSettings: "'ss01', 'cv11'",
          fontSize: title.length > 28 ? '64px' : '76px', fontWeight: '700', lineHeight: '1.08', letterSpacing: '-0.03em',
        });
      }, from);
      await page.evaluate(() => document.fonts.ready);
      await save(new URL(`og/${name}-${lang}.png`, output));
    }
  }

  await page.setViewportSize({ width: 180, height: 180 });
  await page.evaluate(async () => {
    const icon = new Image(180, 180);
    icon.src = '/favicon.svg';
    await icon.decode();
    document.body.style.backgroundColor = '#0a0a0a';
    document.body.replaceChildren(icon);
  });
  await writeFile(new URL('apple-touch-icon.png', output), await page.screenshot());
} finally {
  await browser.close();
}
