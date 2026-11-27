// SPDX-License-Identifier: AGPL-3.0-or-later
/**
 * The main install button, in the hero and the header (only when INSTALL.storeButton is on): it names the visitor's browser and links to that
 * browser's store, and says "bleib is installed" once the extension answers. Browsers can't install extensions from a
 * page any more, so the store's own Add button does the installing. Phones and other browsers keep the button as is.
 */
import { INSTALL } from '../config/install';
import { icon } from '../components/icons';

type Store = { browser: string; url: string };

/** The visitor's browser, from User-Agent Client Hints where the browser offers them, otherwise from the user agent. */
function detect(): Store | null {
  const nav = navigator as Navigator & { userAgentData?: { brands: { brand: string }[]; mobile: boolean } };
  const ua = navigator.userAgent;
  const mobile = nav.userAgentData?.mobile ?? /Android|iPhone|iPad|Mobile/i.test(ua);
  if (mobile) return null;
  const brands = nav.userAgentData?.brands.map((b) => b.brand) ?? [];
  const chrome = INSTALL.chromeStoreUrl;
  if (/Firefox\//.test(ua) && !/Seamonkey/i.test(ua)) return INSTALL.firefoxStoreUrl ? { browser: 'Firefox', url: INSTALL.firefoxStoreUrl } : null;
  if (brands.includes('Microsoft Edge') || /Edg\//.test(ua)) {
    const url = INSTALL.edgeStoreUrl || chrome;
    return url ? { browser: 'Edge', url } : null;
  }
  const chromium = brands.some((b) => /Chrom|Opera|Brave/.test(b)) || (/Chrome\//.test(ua) && !/Edg\//.test(ua));
  if (chromium) return chrome ? { browser: 'Chrome', url: chrome } : null;
  return null;
}

/** Asks one extension ID {type: 'bleib-installed'}; true when it answers {installed: true} within 300 ms. */
function ask(id: string): Promise<boolean> {
  const runtime = (window as Window & { chrome?: { runtime?: { sendMessage?: Function } } }).chrome?.runtime;
  if (!id || !runtime?.sendMessage) return Promise.resolve(false);
  return new Promise((resolve) => {
    const timer = setTimeout(() => resolve(false), 300);
    try {
      runtime.sendMessage!(id, { type: 'bleib-installed' }, (answer?: { installed?: boolean }) => {
        clearTimeout(timer);
        void (window as Window & { chrome?: { runtime?: { lastError?: unknown } } }).chrome?.runtime?.lastError;
        resolve(answer?.installed === true);
      });
    } catch {
      clearTimeout(timer);
      resolve(false);
    }
  });
}

/** True when bleib is installed. Chrome and Edge answer a message (each store gives the extension its own ID); Firefox
 *  can't, so after its optional bleib.dev permission it marks the page with data-bleib-installed="true". The page
 *  could set that itself, so it only ever changes the button's label. */
async function installed(): Promise<boolean> {
  if (document.documentElement.dataset.bleibInstalled === 'true') return true;
  const answers = await Promise.all([INSTALL.extensionId, INSTALL.edgeExtensionId].filter(Boolean).map(ask));
  return answers.some(Boolean);
}

/** Turns every [data-install] link (the hero's and the header's main button) into the store button, once. */
export async function initInstall(): Promise<void> {
  if (!INSTALL.storeButton) return;
  const store = detect();
  if (!store) return;
  const buttons = [...document.querySelectorAll<HTMLAnchorElement>('a[data-install]')];
  for (const button of buttons) {
    button.href = store.url;
    button.rel = 'noopener';
    button.textContent = (button.dataset.add ?? 'Add to {browser}').replace('{browser}', store.browser);
  }
  if (!(await installed())) return;
  for (const button of buttons) {
    button.removeAttribute('href');
    button.setAttribute('aria-disabled', 'true');
    button.classList.add('is-installed');
    button.innerHTML = icon('check');
    button.append(button.dataset.installed ?? 'bleib is installed');
  }
}
