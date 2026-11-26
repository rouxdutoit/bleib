// SPDX-License-Identifier: AGPL-3.0-or-later
/**
 * Switches for the install experience. Everything is off until the store listings (and the npm package) exist, so the
 * site looks exactly as it does without them.
 *
 * To switch the install button on: fill in the store URLs and the extension ID, then set `storeButton: true`.
 * To show "Connect your desktop AI apps" on the Developers page: publish @bleib/wallet to npm, then set `walletCli: true`.
 */
export const INSTALL = {
  /** The hero's and the header's main button become "Add to Chrome / Edge / Firefox" for that browser, and "bleib is
   *  installed" once it is. */
  storeButton: false,
  /** Chrome Web Store listing. Chrome, Brave, Arc, Opera and Edge (which can install Chrome extensions) use it. */
  chromeStoreUrl: '',
  /** Optional Microsoft Edge Add-ons listing; Edge falls back to the Chrome Web Store when this is empty. */
  edgeStoreUrl: '',
  /** Firefox Add-ons (AMO) listing; Firefox shows its own install prompt from there. */
  firefoxStoreUrl: '',
  /** The extension's Chrome ID. The page asks it {type: 'bleib-installed'} and waits 300 ms for {installed: true}. */
  extensionId: '',
  /** "Connect your desktop AI apps" on the Developers page, once `npx @bleib/wallet connect …` is on npm. */
  walletCli: false,
} as const;
