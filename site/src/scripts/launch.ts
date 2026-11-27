// SPDX-License-Identifier: AGPL-3.0-or-later
/**
 * Launch-day actions (components/LaunchCta.astro). Off until config/install.ts sets `launched`; ?launch=1 (and
 * &connectors=1) previews them on any page load without changing what everyone else sees.
 */
import { INSTALL } from '../config/install';
import { browser, installed } from './install';

/** The extension's own page can't be linked from a website, so "Open bleib" asks the extension to open it. */
function openBleib(): void {
  const runtime = (window as Window & { chrome?: { runtime?: { sendMessage?: Function } } }).chrome?.runtime;
  for (const id of [INSTALL.extensionId, INSTALL.edgeExtensionId].filter(Boolean)) {
    try { runtime?.sendMessage?.(id, { type: 'bleib-open' }, () => void (window as any).chrome?.runtime?.lastError); } catch { /* not installed here */ }
  }
  window.dispatchEvent(new CustomEvent('bleib-open'));
}

/** The share sheet with bleib.dev, or the link copied where there is no share sheet. */
async function share(root: HTMLElement): Promise<void> {
  const url = root.dataset.shareUrl ?? location.origin;
  const status = root.querySelector<HTMLElement>('[data-share-status]');
  if (navigator.share) {
    try { await navigator.share({ title: 'bleib', text: root.dataset.shareText, url }); } catch { /* dismissed */ }
    return;
  }
  try { await navigator.clipboard.writeText(url); } catch { return; }
  if (status) status.textContent = root.dataset.copied ?? '';
  for (const b of root.querySelectorAll<HTMLButtonElement>('[data-share]')) {
    const label = b.textContent;
    b.textContent = root.dataset.copied ?? '';
    setTimeout(() => { b.textContent = label; }, 2000);
  }
}

export async function initLaunch(): Promise<void> {
  const params = new URLSearchParams(location.search);
  const preview = params.get('launch') === '1';
  if (!INSTALL.launched && !preview) return;
  const connectors = INSTALL.connectors || params.get('connectors') === '1';
  const store = browser();

  document.documentElement.dataset.launched = 'true';
  document.querySelectorAll<HTMLElement>('[data-prelaunch]').forEach((el) => { el.hidden = true; });
  const roots = [...document.querySelectorAll<HTMLElement>('[data-launch]')];
  for (const root of roots) {
    root.hidden = false;
    root.querySelector<HTMLElement>('[data-l="desktop"]')!.hidden = !store;
    root.querySelector<HTMLElement>('[data-l="mobile"]')!.hidden = Boolean(store);
    root.querySelectorAll<HTMLElement>('[data-l-connectors]').forEach((el) => { el.hidden = !connectors; });
    root.querySelectorAll<HTMLElement>('[data-l-noconnectors]').forEach((el) => { el.hidden = connectors; });
    root.querySelectorAll<HTMLButtonElement>('[data-share]').forEach((b) => b.addEventListener('click', () => void share(root)));
  }

  // The header's main button follows the hero: the same store button on a computer, gone on a phone or Safari.
  const header = document.querySelector<HTMLAnchorElement>('header a[data-install]');
  const primaries = [...document.querySelectorAll<HTMLAnchorElement>('[data-l-primary]'), ...(header ? [header] : [])];
  if (!store) { if (header) header.hidden = true; return; }
  for (const a of primaries) {
    a.href = store.url || '#';
    a.rel = 'noopener';
    a.textContent = (a.dataset.add ?? 'Add to {browser}').replace('{browser}', store.browser);
  }
  if (!(await installed())) return;
  for (const a of primaries) {
    a.removeAttribute('href');
    a.setAttribute('role', 'button');
    a.tabIndex = 0;
    a.textContent = a.dataset.open ?? 'Open bleib';
    a.addEventListener('click', openBleib);
    a.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openBleib(); } });
  }
}
