# Website security

Keep WebAuthn off bleib.dev. Do not serve passkey registration or assertion code from the website, including third-party scripts that start those ceremonies. bleib.dev is the relying party for the browser extension’s local vault, and only the installed extension should ask the browser to create or use that credential. The existing installation check may report the extension version.
