---
phase: 02-wallet-core-loop
plan: "02"
status: complete
requirements-completed: [WALT-01, WALT-02, WALT-03, WALT-04, IMPT-01, DOOR-01, DOOR-02, DOOR-04, DEST-01, CONS-01, CONS-02, CONS-03, CONS-05, CONS-06, RCPT-01]
---

# Plan 02-02 — Completed the core loop

- Added the compiled stdio entry point and authenticated daemon bridge. The SDK HTTP and stdio paths both check the paired credential for each tool call. Form and URL elicitation surface the approval link. The browser session authorizes the exact preview and decision.
- Added note editing, access management, receipt details and the pending suggestions list. A short-lived, single-use handoff lets `bleib ui` use an existing CLI unlock. Lock clears browser sessions.
- Completed ongoing and one-time consent, sensitive confirmation, denials, expiry and revocation. One journal transaction records a receipt and consumes a once grant before the SDK can return the text.
- Pinned typage 0.2.4 after checking Node 20.0 dependency support. Kept the X25519 age v1 file format.
- Real browser testing found a referrer policy that prevented form submissions from carrying the expected Origin. The final policy emits the origin while keeping ticket and approval paths out of the referrer.

## Verification

- Node 24.22.2 and Node 20.0.0 each passed 20 Vitest tests across three files.
- Lint, typecheck, build, tarball installation and the packed CLI smoke test passed.
- Chromium verified keyboard focus, 360 px and desktop layouts, unlock, sensitive approval, receipt, editing and revocation. Axe reported zero violations across the three pages scanned.

See [verification](02-VERIFICATION.md) for commands, results and roadmap mapping.
