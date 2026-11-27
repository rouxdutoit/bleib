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
    const target = b.querySelector<HTMLElement>('.lbl') ?? b;
    const label = target.textContent;
    target.textContent = root.dataset.copied ?? '';
    setTimeout(() => { target.textContent = label; }, 2000);
  }
}

export async function initLaunch(): Promise<void> {
  const params = new URLSearchParams(location.search);
  const preview = params.get('launch') === '1';
  if (!INSTALL.launched && !preview) return;
  const connectors = INSTALL.connectors || params.get('connectors') === '1';
  const store = browser();

  document.documentElement.dataset.launched = 'true';
  document.querySelectorAll<HTMLElement>('[data-eyebrow-launch]').forEach((el) => { el.textContent = el.dataset.eyebrowLaunch ?? el.textContent; });
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

  // "On your phone too." further down, only with connectors.
  document.querySelectorAll<HTMLElement>('[data-phone-too]').forEach((el) => { el.hidden = !connectors; });
  // Pricing: the plans replace "Coming" once the paid plan exists, which is when the connectors do.
  document.querySelectorAll<HTMLElement>('[data-when="paid"]').forEach((el) => { el.hidden = !connectors; });
  document.querySelectorAll<HTMLElement>('[data-when="before"]').forEach((el) => { el.hidden = connectors; });

  // The header's main button follows the hero: the same store button on a computer, gone on a phone or Safari.
  const header = document.querySelector<HTMLAnchorElement>('header a[data-install]');
  const primaries = [...document.querySelectorAll<HTMLAnchorElement>('[data-l-primary]'), ...(header ? [header] : [])];
  if (!store) { if (header) header.hidden = true; return; }
  if (header) header.hidden = false;
  // The browser's own colour logo beside its name (browser-logos; see CREDITS.md).
  const logo = ({ Chrome: '/browsers/chrome.svg', Edge: '/browsers/edge.svg', Firefox: '/browsers/firefox.svg' } as Record<string, string>)[store.browser];
  /** Writes the label; with a logo, it sits just before the browser's name: "Add to [logo] Chrome". */
  const label = (a: HTMLAnchorElement, template: string) => {
    const [before, after = ''] = template.split('{browser}');
    a.textContent = '';
    if (!template.includes('{browser}')) { a.textContent = template; return; }
    const mark = logo ? Object.assign(document.createElement('img'), { className: 'blogo', src: logo, alt: '', width: 16, height: 16 }) : null;
    // One inline run inside the button, so its flex gap doesn't push the logo away from the name.
    const run = document.createElement('span');
    run.append(before, ...(mark ? [mark] : []), store.browser, after);
    a.append(run);
  };
  for (const a of primaries) {
    a.href = store.url || '#';
    a.rel = 'noopener';
    label(a, a.dataset.add ?? 'Add to {browser}');
  }
  if (!(await installed())) return;
  for (const a of primaries) {
    a.removeAttribute('href');
    a.setAttribute('role', 'button');
    a.tabIndex = 0;
    label(a, a.dataset.open ?? 'Open bleib');
    a.addEventListener('click', openBleib);
    a.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openBleib(); } });
  }
}
