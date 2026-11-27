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
  /** The extension's Chrome Web Store ID. The page asks it {type: 'bleib-installed'} and waits 300 ms for {installed: true}. */
  extensionId: '',
  /** Its Edge Add-ons ID, which differs from the Chrome one. Firefox needs no ID: it marks the page instead. */
  edgeExtensionId: '',
  /** "Connect your desktop AI apps" on the Developers page, once `npx @bleib/wallet connect …` is on npm. */
  walletCli: false,
  /** Launch day: the hero and the finale swap "Notify me" and the email form for "Add to {browser}" (or "Open bleib"
   *  once installed), and phones and Safari get "Get bleib for your computer". GitHub leaves the hero (it stays in the
   *  nav and footer). Preview without flipping it: add ?launch=1 to the homepage URL. */
  launched: false,
  /** With `launched`: "Also in ChatGPT · Claude" under the main button, and on phones and Safari those two become the
   *  main actions. Preview: ?launch=1&connectors=1. */
  connectors: false,
  /** Where those two links go (the bleib connector in each AI's own directory). */
  chatgptConnectorUrl: '',
  claudeConnectorUrl: '',
  /** Checkout for bleib everywhere (Pricing, once `launched` and `connectors` are on): yearly and monthly. */
  checkoutYearlyUrl: '',
  checkoutMonthlyUrl: '',
} as const;
