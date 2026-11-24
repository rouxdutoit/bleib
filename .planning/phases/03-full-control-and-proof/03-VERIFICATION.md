---
phase: 03-full-control-and-proof
status: implemented
verified: 2026-11-24
phase_2_review: pending
---

# Phase 3 — Verification

## Roadmap success criteria

| # | Result | Evidence |
|---|---|---|
| 1 | Five SDK disclosure paths verified. Native acceptance has gaps. | The CLI generated the formats in the [setup guide](../../../wallet/docs/setup.md). `setup.test.ts` opened connections from all five generated snippets and retrieved approved excerpts. Native Claude Code 2.1.331, OpenClaw 2026.11.8 and Hermes v0.23.3 also connected. Claude Desktop and Cursor have protocol-level coverage. |
| 2 | Verified | `phase3-tracer.test.ts` confirmed a parsed rule through the owner page, then rejected the first matching request and a request with an existing grant. It checked agent identity binding, budget constraints, and the agent's exposed tool surface. `wallet.test.ts` verified changed purpose succeeds under a remembered grant and once permits one release under contention. |
| 3 | Verified through the loopback proxy | The OpenAI-compatible tracer checked an exact outbound JSON digest, a preexisting durable receipt at mock upstream arrival, observed provider, host and model, a model conflict with an owner notice, and redaction when a used reference appeared again. The Anthropic-compatible path checked streaming, cross-agent rejection and withholding on receipt commit failure. The standalone OpenClaw hook adapter was deferred after researching the embedded and CLI hooks. |
| 4 | Verified | The timeline and CLI summary used the same weekly calculation. The browser exercised both filters and export. The CLI verified the disk chain and exported DPV categories, consent metadata and exact released byte fingerprints. `receipt-integrity.test.ts` verified altered history, a missing final receipt and a missing checkpoint, as well as replay and export of a Phase 2 journal. |
| 5 | Verified | The local page displayed proposed text and reason and handled Save, Edit and Not Now. Tests saved a proposal while both the proposer and a second agent held ongoing access and showed that neither could read the new note. Pasted Claude and ChatGPT text yielded categorized queue entries. Tests decrypted a saved entry and verified `source.basis: provided`. |

Requirements covered by the evidence above include DOOR-03 (criterion 1), CONS-04 (2), DEST-02 (3), RCPT-02 and RCPT-03 (4), and PROP-01, PROP-02 and IMPT-02 (5).

## Commands

Run from the repository root unless indicated.

| Command | Result |
|---|---|
| `npm --prefix wallet ci --no-audit --no-fund` | 253 packages installed. npm reported an ESLint 9 deprecation and an esbuild install-script notice. |
| `npm --prefix wallet run lint` | Exit 0. |
| `npm --prefix wallet run typecheck` | Exit 0. |
| `npm --prefix wallet test` | Node 24.22.2. **33/33** across six files. Wallet 16, transport 5, Phase 2 tracer 1, Phase 3 tracer 3, receipt integrity 2, setup 6. |
| From `wallet/`, `npm exec --yes --package=node@20.0.0 -- node node_modules/vitest/vitest.mjs run` | Node 20.0.0. **33/33** across the same six files. Node emitted its experimental X25519 warning. |
| `BLEIB_BROWSER_EXECUTABLE=/tmp/chromium BLEIB_BROWSER_SCREENSHOTS=/tmp/bleib-phase3-visuals npm --prefix wallet run test:browser` | Chromium 153.0.8010.0. Four combinations of 360 and 1280 px in light and dark, reduced motion enabled. **36 axe scans, 0 violations**. Keyboard skip link, 44 px approval targets, all three action labels, filter controls, receipt detail and download, note and proposal editors, and revocation passed. |
| From `wallet/`, `npm pack --pack-destination "$phase_pack"` | Prepack build succeeded. Twenty files, including the generated CLI and setup guide. |
| `npm install --prefix "$phase_pack" --omit=dev --no-audit --no-fund "$phase_pack/bleib-0.2.0.tgz"` and `npm --prefix "$phase_pack" exec --offline -- bleib --help` | 102 production packages in a scratch prefix. Packaged CLI help included the new commands. |
| `claude mcp list`, `openclaw mcp probe bleib`, `hermes mcp test bleib` | Fresh isolated test configurations and paired credentials. Claude Code reported Connected. OpenClaw and Hermes discovered three tools. Five approved content calls ran in SDK tests. |

## UI

The wallet uses the founder's iOS type ramp, system font stack, semantic palettes, inset lists and approval layout. Small secondary text uses slightly higher opacity in light mode for WCAG contrast. Automated coverage used axe WCAG 2.0, 2.1 and 2.2 A or AA tags on the reachable views in the walkthrough. The browser harness is in `wallet/test/browser/phase3.mjs`. [Apple HIG alerts](https://developer.apple.com/design/human-interface-guidelines/alerts)

## Limits and follow-up

- The proxy was exercised with mock upstreams. An observed receipt records the concrete dispatch attempt. Whole-wallet rollback detection needs an independently retained receipt fingerprint. The export aligns disclosure evidence with ISO/IEC TS 27560 and the OSAP draft. The wallet's evidence is local and unsigned.
- OpenClaw's final embedded hook supplies provider, model and a payload. A standalone adapter also needs the effective endpoint and verified final hook order. The proxy covers clients that can route model calls locally and preserve tool-result text.
- Claude Desktop used protocol-level evidence. Cursor used protocol-level evidence and its native CLI found the generated project config with explicit workspace selection. Cursor CLI approval tried to create the user-level `~/.cursor` directory, which the managed workspace cannot write. Native Cursor tool discovery and Claude Desktop application acceptance remain open.
- The managed worktree index was read-only. Commits used a temporary index and the checked-out files matched the branch when checked with a fresh index.
- Phase 2's independent review had no artifact at this cut. Founder acceptance and npm publication remain separate from the local worktree.
