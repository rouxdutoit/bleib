# Plan 03-02 — Setup and evidence

Implemented in `023f0af`.

- Five client commands print a snippet that works with the installed bleib CLI. The setup guide names the official file paths and verification commands. Both local transports returned approved excerpts when driven from the generated snippets.
- The encrypted, authenticated receipt checkpoint allows replay to detect a missing final receipt as well as changed journal records. A Phase 2 journal migrates on unlock.
- The CLI verifies receipts from disk and exports JSON with consent and disclosure fields, DPV categories and SHA-256 fingerprints. The browser can download the same export. Disclosure records keep the latest receipt hash for comparison with an independently saved copy.
