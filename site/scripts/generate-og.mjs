// SPDX-License-Identifier: AGPL-3.0-or-later
// Run after npm run build with Playwright and its Chromium installed.
// An isolated Playwright install can be supplied via PLAYWRIGHT_MODULE.
import { writeFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_MODULE ?? 'playwright');
const dist = new URL('../dist/', import.meta.url);
const output = new URL('../public/', import.meta.url);
const origin = 'https://bleib.invalid';
const viewport = { width: 1200, height: 630 };
const browser = await chromium.launch();

try {
  const page = await browser.newPage({
    viewport, colorScheme: 'light', deviceScaleFactor: 1, javaScriptEnabled: false,
  });
  await page.route('**/*', async (route) => {
    const { origin: host, pathname } = new URL(route.request().url());
    const isStylesheet = /^\/_astro\/[\w.-]+\.css$/.test(pathname);
    if (host !== origin || (!isStylesheet &&
        !['/', '/de/', '/favicon.svg', '/fonts/inter-latin-variable.woff2'].includes(pathname))) {
      await route.abort();
      return;
    }
    const file = pathname === '/' ? 'index.html' : pathname === '/de/' ? 'de/index.html' : pathname.slice(1);
    await route.fulfill({ path: fileURLToPath(new URL(file, dist)) });
  });

  // One share image per language: the logo, then the hero's promise, as the homepage says it.
  for (const [path, name] of [['/', 'og.png'], ['/de/', 'og-de.png']]) {
    const response = await page.goto(origin + path);
    if (!response?.ok()) throw new Error('Build the site before generating the images.');

    await page.evaluate(async () => {
      const logo = document.querySelector('.logo');
      const wordmark = logo?.querySelector('.logo-word');
      const h1 = document.querySelector('.hero-h1');
      const sub = document.querySelector('.hero .sub');
      if (!logo || !wordmark || !h1 || !sub) throw new Error('The header logo or hero is missing.');

      for (const weight of ['600', '400']) {
        const loaded = await document.fonts.load(`${weight} 64px ${getComputedStyle(h1).fontFamily}`, h1.textContent + sub.textContent);
        if (!loaded.length) throw new Error('Could not load the font.');
      }

      const card = document.createElement('div');
      Object.assign(card.style, { display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: '0' });
      logo.style.transform = 'scale(1.6)';
      logo.style.marginBottom = '56px';
      Object.assign(h1.style, { fontSize: '84px', lineHeight: '1.05', maxWidth: 'none', margin: '0', whiteSpace: 'nowrap' });
      Object.assign(sub.style, { fontSize: '34px', lineHeight: '1.35', margin: '28px 0 0', maxWidth: 'none' });
      card.append(logo, h1, sub);
      document.body.replaceChildren(card);
      Object.assign(document.body.style, { display: 'grid', placeItems: 'center', height: '100vh', margin: '0' });
      // Keep at least 100px either side, so a longer headline (German) never runs to the edge.
      const width = h1.getBoundingClientRect().width;
      if (width > 1000) h1.style.fontSize = `${Math.floor(84 * 1000 / width)}px`;
    });

    const og = await page.screenshot();
    if (og.length >= 100_000) throw new Error(`${name} must be under 100 KB.`);
    await writeFile(new URL(name, output), og);
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
