// SPDX-License-Identifier: AGPL-3.0-or-later
/**
 * The hero's install button (only when INSTALL.storeButton is on): it names the visitor's browser and links to that
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

/** True when bleib answers {type: 'bleib-installed'} within 300 ms (Chromium browsers; the extension lists bleib.dev). */
function installed(): Promise<boolean> {
  const runtime = (window as Window & { chrome?: { runtime?: { sendMessage?: Function } } }).chrome?.runtime;
  if (!INSTALL.extensionId || !runtime?.sendMessage) return Promise.resolve(false);
  return new Promise((resolve) => {
    const timer = setTimeout(() => resolve(false), 300);
    try {
      runtime.sendMessage!(INSTALL.extensionId, { type: 'bleib-installed' }, (answer?: { installed?: boolean }) => {
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

export async function initInstall(button: HTMLAnchorElement): Promise<void> {
  if (!INSTALL.storeButton) return;
  const store = detect();
  if (!store) return;
  button.href = store.url;
  button.rel = 'noopener';
  button.textContent = (button.dataset.add ?? 'Add to {browser}').replace('{browser}', store.browser);
  if (await installed()) {
    button.removeAttribute('href');
    button.setAttribute('aria-disabled', 'true');
    button.classList.add('is-installed');
    button.innerHTML = icon('check');
    button.append(button.dataset.installed ?? 'bleib is installed');
  }
}
