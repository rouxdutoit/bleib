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
        !['/', '/favicon.svg', '/fonts/inter-latin-variable.woff2'].includes(pathname))) {
      await route.abort();
      return;
    }
    const file = pathname === '/' ? 'index.html' : pathname.slice(1);
    await route.fulfill({ path: fileURLToPath(new URL(file, dist)) });
  });

  const response = await page.goto(origin);
  if (!response?.ok()) throw new Error('Build the site before generating the images.');

  await page.evaluate(async () => {
    // The header logo is an outlined lockup (paths, no font), so it renders the same here as everywhere.
    const logo = document.querySelector('a.logo');
    if (!logo) throw new Error('The header logo is missing.');

    document.body.replaceChildren(logo);
    Object.assign(document.body.style, { display: 'grid', placeItems: 'center', height: '100vh' });
    logo.style.transform = 'scale(4)';
  });

  const og = await page.screenshot();
  if (og.length >= 100_000) throw new Error('og.png must be under 100 KB.');
  await writeFile(new URL('og.png', output), og);

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
