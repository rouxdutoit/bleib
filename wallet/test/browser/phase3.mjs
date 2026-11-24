import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { AxeBuilder } from '@axe-core/playwright';
import { chromium } from 'playwright';
import { startDaemon } from '../../dist/daemon.js';
import { prepareKit } from '../../dist/store.js';

const fixture = fileURLToPath(new URL('../fixtures/openclaw', import.meta.url));
const phrase = 'browser accessibility test passphrase';
const tags = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'];
const output = process.env.BLEIB_BROWSER_SCREENSHOTS;
let audits = 0;

async function audit(page, width, name) {
  const result = await new AxeBuilder({ page }).withTags(tags).analyze();
  assert.deepEqual(result.violations.map(({ id, nodes }) => [id, nodes.map(node => node.target)]), [], name);
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth), width, name);
  audits += 1;
}

async function check(browser, width, colorScheme) {
  const root = await mkdtemp(join(tmpdir(), 'bl-playwright-'));
  const home = join(root, 'wallet');
  const kit = join(root, 'kit.txt');
  const context = await browser.newContext({ viewport: { width, height: 900 }, colorScheme, reducedMotion: 'reduce' });
  let daemon;
  try {
    const setup = await prepareKit(home, kit);
    await setup.confirm(/Confirmation word: (\S+)/.exec(await readFile(kit, 'utf8'))[1], phrase);
    daemon = await startDaemon(home, { idleMs: 120_000 });
    const { origin, wallet } = daemon;
    const page = await context.newPage();
    await page.goto(origin);
    await page.keyboard.press('Tab');
    assert.equal(await page.evaluate(() => document.activeElement.textContent), 'Skip to content');
    await page.keyboard.press('Enter');
    assert.equal(await page.evaluate(() => document.activeElement.id), 'main');
    assert.equal(await page.evaluate(() => getComputedStyle(document.documentElement).backgroundColor),
      colorScheme === 'dark' ? 'rgb(0, 0, 0)' : 'rgb(242, 242, 247)');
    assert.equal(await page.evaluate(() => matchMedia('(prefers-reduced-motion: reduce)').matches), true);
    await audit(page, width, 'Unlock');
    await page.getByLabel('Passphrase').fill(phrase);
    await page.getByRole('button', { name: 'Unlock', exact: true }).click();
    await page.getByRole('heading', { name: 'Your notes' }).waitFor();
    await wallet.importWorkspace(fixture, 'openclaw');

    await page.getByRole('link', { name: 'Rules' }).click();
    await page.getByLabel('Write a rule in your own words').fill('Never share health with hosted models');
    await page.getByRole('button', { name: 'Review Rule' }).click();
    await page.getByText('Block health for hosted models.').waitFor();
    assert.equal((await wallet.rules()).length, 0);
    await audit(page, width, 'Rule preview');
    await page.getByRole('button', { name: 'Save Rule' }).click();

    const { code } = await wallet.pair('Browser agent', 'provider:Example', 'Example model');
    const { credential } = await wallet.redeem(code);
    assert.equal((await wallet.ask(credential, { purpose: 'Plan a visit', kinds: ['health'] })).state, 'denied');
    const request = { purpose: 'Find a visit date', kinds: ['private'], question: 'When is the dentist visit?' };
    const pending = await wallet.ask(credential, request);
    await page.getByRole('link', { name: 'Requests' }).click();
    await page.getByRole('link', { name: /Browser agent/ }).click();
    assert.equal(page.url(), pending.approve_url);
    const approval = page.getByRole('region', { name: 'Share with Browser agent?' });
    assert.equal(await approval.getByText('My dentist visit moved to Friday.').isVisible(), true);
    const buttons = approval.getByRole('button');
    assert.deepEqual(await buttons.allTextContents(), ['Allow Once', 'Always for Browser agent', "Don't Allow"]);
    for (const button of await buttons.all()) {
      const { width: w, height: h } = await button.boundingBox();
      assert.ok(w >= 44 && h >= 44, 'Approval buttons must have 44 px targets');
      assert.equal(await button.evaluate(node => getComputedStyle(node).borderRadius), '999px');
    }
    await audit(page, width, 'Approval alert');
    if (output) await page.screenshot({ path: join(output, `approval-${width}-${colorScheme}.png`), fullPage: true });
    await buttons.first().press('Enter');
    const answer = await wallet.ask(credential, request);
    assert.equal(answer.content, 'My dentist visit moved to Friday.');

    await page.getByRole('link', { name: 'Receipts' }).click();
    await page.getByText(/This week 1 AI saw 1 fact/).waitFor();
    await page.getByLabel('Agent', { exact: true }).selectOption({ label: 'Browser agent' });
    await page.getByLabel('Kind', { exact: true }).selectOption('private');
    await page.getByRole('button', { name: 'Filter' }).click();
    await audit(page, width, 'Filtered timeline and weekly widget');
    if (output) await page.screenshot({ path: join(output, `timeline-${width}-${colorScheme}.png`), fullPage: true });
    await page.getByRole('link', { name: /Browser agent/ }).click();
    assert.equal(await page.getByText(answer.content).isVisible(), true);
    await audit(page, width, 'Receipt detail');
    const response = await context.request.get(`${origin}/receipts/export`);
    assert.match(response.headers()['content-disposition'], /attachment/);
    assert.deepEqual((await response.json()).receipts.map(item => item.receipt_id), [answer.receipt_id]);

    await page.getByRole('link', { name: 'Notes', exact: true }).click();
    await page.getByRole('link', { name: /Tastes/ }).click();
    await page.getByLabel('Note', { exact: true }).fill('The new tea is mint.');
    await page.getByRole('button', { name: 'Save Note', exact: true }).click();
    assert.equal(await page.getByLabel('Note', { exact: true }).inputValue(), 'The new tea is mint.');
    await audit(page, width, 'Note editor');

    await wallet.propose(credential, { kind: 'preferences', content: 'I prefer mint tea.', reason: 'Use it for the next menu.' });
    await page.getByRole('link', { name: 'Suggestions' }).click();
    await page.getByLabel('Copied from').selectOption('Claude');
    await page.getByLabel('Memory text').fill('- I prefer chamomile tea.\n- My dentist is nearby.');
    await page.getByRole('button', { name: 'Add to Review' }).click();
    const queue = page.getByRole('listitem').filter({ hasText: 'Use it for the next menu.' });
    const pasted = page.getByRole('listitem').filter({ hasText: 'I prefer chamomile tea.' });
    await pasted.getByRole('button', { name: 'Save', exact: true }).click();
    await audit(page, width, 'Review queue');
    await queue.getByRole('link', { name: 'Edit', exact: true }).click();
    await page.getByLabel('Title', { exact: true }).fill('Tea for the next menu');
    await audit(page, width, 'Proposal editor');
    await page.getByRole('button', { name: 'Save', exact: true }).click();
    await page.getByRole('listitem').filter({ hasText: 'My dentist is nearby.' }).getByRole('button', { name: 'Not Now' }).click();
    assert.equal((await wallet.entries()).filter(note => note.ownerOnly).length, 2);
    assert.equal((await wallet.proposals()).length, 0);

    await page.getByRole('link', { name: 'Access' }).click();
    await audit(page, width, 'Agent access');
    await page.getByRole('button', { name: 'Revoke Agent' }).click();
    assert.equal((await wallet.status(credential)).state, 'denied');
    console.log(`${width}px · ${colorScheme} · passed`);
  } finally {
    await context.close();
    await daemon?.close();
    await rm(root, { recursive: true, force: true });
  }
}

const executablePath = process.env.BLEIB_BROWSER_EXECUTABLE || undefined;
const browser = await chromium.launch({
  executablePath, headless: true, args: executablePath ? ['--no-sandbox', '--disable-dev-shm-usage'] : [],
});
try {
  for (const width of [360, 1280]) {
    for (const colorScheme of ['light', 'dark']) await check(browser, width, colorScheme);
  }
  console.log(`Chromium ${browser.version()} · ${audits} axe audits · 0 violations`);
} finally {
  await browser.close();
}
