---
phase: 02-wallet-core-loop
status: verified
verified: 2026-11-24
review: pending
---

# Phase 2 — Verification

Both plans executed on `wallet`. The disclosure tracer and the expanded suite pass. The comparison below records the two consent interpretations and the local package installation used for review.

## Roadmap success criteria

| # | Result | Evidence |
|---|---|---|
| 1 | Verified with the local npm package | The packaged executable passed an interactive TTY run. The wallet directory was absent until the saved kit word was supplied, and the terminal echoed neither word nor passphrase. The tracer saw `locked` through the SDK while an owner unlock was required. The tests covered auto-lock, explicit lock, recovery, and the absence of any agent unlock tool. Registry publication is a separate release step. |
| 2 | Verified | The OpenClaw tracer imported three files, including its dated note. The storage test read native Hermes `memories/` files, checked PCP fields after decryption, and scanned every regular wallet file for known notes, passphrase, code, identity, proposal and credential markers. The browser edited a note at the same URL and the HTTP test confirmed a new encrypted version with stale-edit protection. |
| 3 | Verified | Pairing tests covered ten-minute expiry, simultaneous redemption, unknown credentials and HTTP session substitution. A declared destination was bound to the agent. The SDK tracer received `approval_required` with a link before it could view anything, then received only one relevant tea excerpt. An unrelated line remained outside the preview and response. |
| 4 | Verified with owner-page approval | The browser showed the exact excerpt, agent, destination, purpose, and all three decisions. Sensitive requests selected **Allow once** and required extra confirmation for ongoing access. SDK tests exercised both URL and form elicitation. The elicitation opens or points to the authenticated page, and a client returning `accept` alone could not authorize a release. Grant tests covered agent, kind, destination, normalized purpose, revocation, once consumption and 90-day expiry. Changed purpose requires a new decision under the founder's grant tuple. |
| 5 | Verified | CLI and browser opened the exact receipted text with time and declared destination. A model and provider appeared in the test receipt from the declarations at pairing. The model is empty when omitted by the owner. The fault injected after ciphertext sync and before journal publication returned `unavailable` without text, locked the wallet, and left the once grant usable after unlock. After release the chain and exact SHA-256 digest were verified. Revoking a grant triggered a new request, and revoking the agent caused denial. |

### Requirement coverage

- **WALT-01–04 and IMPT-01** are covered by criteria 1 and 2.
- **DOOR-01/02/04 and DEST-01** are covered by criterion 3.
- **CONS-01/02/03/05** are covered by criterion 4.
- **CONS-06 and RCPT-01** are covered by criterion 5.

## Commands and output

Run from the repository root unless the row specifies `wallet/`.

| Command | Output |
|---|---|
| `npm --prefix wallet ci --no-audit --no-fund` | Exit 0, 249 packages installed. npm reported an ESLint 9 deprecation and an esbuild install-script notice. |
| `npm --prefix wallet run lint` | Exit 0, no lint errors. |
| `npm --prefix wallet run typecheck` | Exit 0, no TypeScript errors. |
| `npm --prefix wallet run build` | Exit 0, compiled CLI and daemon. |
| `npm --prefix wallet test` | Node v24.22.2. Three files passed. Tracer 1, transports 5, wallet 14. **20/20**. |
| `npm exec --yes --package=node@20.0.0 -- node node_modules/vitest/vitest.mjs run` in `wallet/` | Three files and **20/20** tests passed. Node emitted its X25519 Web Crypto experimental warning. |
| `npm pack --pack-destination "$install_dir"` in `wallet/` | Prepack build passed. A final pack from the verified build, using `npm pack --ignore-scripts --pack-destination "$install_dir"`, produced `bleib-0.2.0.tgz` with 12 files. |
| `npm install --prefix "$install_dir" --omit=dev --no-audit --no-fund "$install_dir/bleib-0.2.0.tgz"` | Exit 0, 102 packages installed in a clean scratch prefix. |
| `npm --prefix "$install_dir" exec --offline -- bleib --help` | Exit 0, resolved the installed bin and displayed all commands. |
| Scratch PTY driver running the installed bin on Node 20.0.0 | Exit 0. TTY setup and hidden input, daemon startup, unlock, import, pair, connect, list, revoke and lock passed. |
| Scratch Playwright and axe driver running the compiled daemon in Chromium 153.0.8010.0 | Exit 0. At 360 px and 1280 px, keyboard skip link, exact preview, once, receipt, save and revoke passed. The 360 px page had no horizontal overflow. Axe reported **0 violations** on unlock, approval and editor. |

## Limits of verification

- Tests used Linux, synthetic workspaces, and SDK clients whose capabilities match the elicitation modes. Vendor-specific client behavior was checked against upstream documentation. A live review with a vendor client is separate from these results.
- An encrypted, synchronized receipt records the exact text prepared before handoff. A process or transport failure after the commit can interrupt delivery. Model consumption is outside the Phase 2 boundary.
- The hash chain detects changed or reordered history during replay. Detecting a complete rollback needs an external anchor.
- The trust boundary for the browser and CLI is the owner's OS account. Stdio and HTTP MCP callers are limited to agent operations. OS isolation is required for an agent with arbitrary local account access.
