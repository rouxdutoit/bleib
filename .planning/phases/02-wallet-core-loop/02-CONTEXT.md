# Phase 2: Wallet Core Loop — Context

## Boundary

Create a local encrypted wallet, import OpenClaw or Hermes memory, pair an agent, preview and approve an excerpt, and inspect its durable disclosure receipt. Work on branch `wallet` within `wallet/` and this phase directory. Record Phase 2 progress in the shared state file last.

## Locked decisions

- D-01. Node 20+ TypeScript package and CLI named `bleib`. Runtime I/O stays on the local machine. No telemetry.
- D-02. Default home is `~/.bleib`, overridable by `--home` / `BLEIB_HOME`. Initialization publishes the wallet only after the owner types the confirmation word from the saved printable recovery kit. One age identity encrypts Markdown files and metadata. A passphrase-derived key wraps it.
- D-03. The daemon alone holds the unlocked identity. Owner commands or the local page can unlock it. Lock, idle expiry and daemon exit end the unlocked session. MCP exposes no unlock operation.
- D-04. Pairing uses a 10-minute single-use code. Each redeemed code mints a random, hashed-at-rest agent credential. Agent name, provider/destination and optional model are stated at pairing. Runtime identity comes from the credential.
- D-05. Official SDK stdio and loopback Streamable HTTP expose status, minimal excerpts and pending proposals. Absent authorization produces structured states. Pending writes grant no reads.
- D-06. Grants are bound to agent, category, declared destination, purpose and duration. Show exact excerpts and destination in the owner decision. Once is the default for sensitive information. Always requires extra confirmation there, expires after 90 unused days and is revocable on the next request.
- D-07. An encrypted, hash-chained receipt is durable before release. The user can list and open receipts in CLI and browser. The browser can edit entries, decide requests, revoke and list proposals. Browser POSTs use owner session and CSRF controls, with server-side loopback Host and Origin checks.

## Implementation discretion

- Use immutable age journal segments, published atomically and synced. Bundle one-time consumption and receipt in one journal transaction. Import uncategorized source pages as sensitive private notes, and let the owner recategorize them. Preserve supported frontmatter and store non-PCP keys as extensions where possible.
- Normalize purpose spelling case and whitespace for matching. A different purpose needs a new grant under the explicit grant tuple. A once decision binds the approved excerpt and source versions. Sensitive content cannot use a grant given without the sensitive confirmation.
- MCP clients can relay an approval link through URL or form elicitation according to negotiated capabilities. The actual decision always takes place in the authenticated local page, so an agent cannot approve itself or obtain the preview during elicitation.
- Scope the daemon trust boundary to the user's OS account and wallet ownership. A same-account process with arbitrary file or process access is outside the MCP isolation boundary. Consumers will need OS confinement for agents with unrestricted local tools.

## Canonical references

- [.planning/PROJECT.md](../../PROJECT.md), [.planning/REQUIREMENTS.md](../../REQUIREMENTS.md), [.planning/ROADMAP.md](../../ROADMAP.md), [founder brief](../../../docs/BRIEF.md), and [.claude/CLAUDE.md](../../../.claude/CLAUDE.md)
- [Funded teardown](../../../docs/research/teardown-1-funded-closed.md) for pairing, passes and the write inbox
- [Open-source teardown](../../../docs/research/teardown-2-open-source-traction.md) for key custody, audit and lossless Markdown
- [Standards teardown](../../../docs/research/teardown-3-standards-reference.md) for PCP memory fields, HCP's receipt-before-release order, MPR digests and OSAP
- [Codex research](../../../docs/research/codex-research-report.md) for the distinction between a declared recipient and a downstream observer

## Deferred

Five-agent setup guides, plain-word rules, observed destinations, receipt export and weekly summaries, full proposal review, paste imports, sync, device linking and passkeys.
