# Requirements: bleib

**Defined:** 24 November 2026
**Core Value:** You can change AI without losing who you are to it, and you can always see exactly what each AI was given, because your context lives in a wallet you hold the keys to.

Sources: `docs/BRIEF.md`, `docs/research/` (greenfield, Codex, teardowns 1–3; teardowns 4–5 pending and may adjust the MVP).

## v1 Requirements

### Website

- [ ] **SITE-01**: Visitor lands on a full-bleed photo hero with the bleib mark, a headline and an early-access button; on scroll the photo shrinks into a framed panel beside the headline, following roze.ai's pattern
- [ ] **SITE-02**: Visitor scrolls through a sticky product card that changes scene as each section passes, with a short headline and one line of text beside it, and a vertical tick navigation that shows and jumps to each scene
- [ ] **SITE-03**: The scenes show what bleib is, in this order:
  - your context in one place;
  - permission asked once;
  - "what your AI saw" (a receipt);
  - change AI, keep your context;
  - agents propose, you decide.
- [ ] **SITE-04**: Visitor can play with an interactive finale (for example, sweeping scattered context cards into the wallet and putting them back), with a keyboard-accessible alternative
- [ ] **SITE-05**: "Open source. Free. Your keys." and a GitHub link are visible in the first screen
- [ ] **SITE-06**: Visitor can join early access with an email address and sees a confirmation; signups are stored in a Cloudflare-managed store the founders can export
- [ ] **SITE-07**: Visitor can open simple subpages linked from the home page: How it works, Developers, Pricing (free vs convenience), Privacy, and an Impressum/legal page
- [ ] **SITE-08**: Site meets WCAG 2.2 AA / BITV 2.0: keyboard operable, sufficient contrast, motion pausable, full reduced-motion fallback
- [ ] **SITE-09**: Site works from phone width (360px) to large desktop with no horizontal scroll; the sticky-card story adapts to a stacked layout on phones
- [ ] **SITE-10**: Visitor can read the site in English and German, written natively, and switch between them
- [ ] **SITE-11**: Site is deployed to the Cloudflare Pages project `bleib` and scores at least 90 on Lighthouse performance, accessibility, best practices and SEO on mobile
- [ ] **SITE-12**: Site uses only bleib's own mark, copy and licensed imagery, with no text, images, code or brand assets taken from roze.ai

### Wallet

- [ ] **WALT-01**: User installs bleib with one command (npm/npx) and creates a wallet; setup won't store anything until the user has saved a recovery kit
- [ ] **WALT-02**: User's context is stored as plain Markdown files with frontmatter (compatible with OpenClaw/Hermes workspace files and PCP's memory fields), encrypted at rest with age
- [ ] **WALT-03**: User unlocks the wallet once per session (until reboot or auto-lock); no agent can unlock it
- [ ] **WALT-04**: User can open, read and correct their context in a local bleib page in the browser

### Import

- [ ] **IMPT-01**: User can import an OpenClaw or Hermes workspace (`USER.md`, `MEMORY.md`, daily notes) into the wallet
- [ ] **IMPT-02**: User can paste memory exported from ChatGPT or Claude and have it split into reviewable entries

### Agent connection

- [ ] **DOOR-01**: User connects an agent with a one-time pairing code; each agent gets its own credential, and no agent can claim another's identity
- [ ] **DOOR-02**: A connected agent can ask for context for a stated purpose over a local MCP server and receives the smallest useful answer, not whole files
- [ ] **DOOR-03**: User gets copy-paste setup for Claude Desktop, Claude Code, OpenClaw, Hermes and Cursor
- [ ] **DOOR-04**: When access isn't granted yet, the agent receives an actionable state (approval required, with a link for the user), not a bare refusal

### Consent

- [ ] **CONS-01**: The first time an agent asks for a kind of information (about 12 categories, based on W3C DPV), the user sees exactly what would be shared and where it goes, and chooses Allow once / Always for this agent / No
- [ ] **CONS-02**: The answer is remembered and only asked again when the agent, the kind of information or the destination changes; unused permissions lapse after 90 days
- [ ] **CONS-03**: Sensitive kinds (health, finances, other people's private details, credentials) default to "Allow once"
- [ ] **CONS-04**: User can set rules in plain words (for example "never share health with hosted models"), and agents can never widen a rule or approve their own access
- [ ] **CONS-05**: The prompt appears inside the agent where it supports MCP elicitation, and otherwise as a local bleib notification or page
- [ ] **CONS-06**: User can revoke any agent or permission at any time, and the change takes effect on the next request

### Destination

- [ ] **DEST-01**: User declares at pairing where an agent's model runs (on this device, the agent's provider, a named third party), and consent is bound to that destination
- [ ] **DEST-02**: When the agent's model endpoint can be pointed at bleib's local model proxy (or via OpenClaw's request hook), bleib observes the real destination and marks receipts as "observed" rather than "declared"

### Receipts

- [ ] **RCPT-01**: Before any context is released, bleib records a receipt: agent, model and provider, destination class (declared or observed), purpose, the exact content given, a digest of it, and the time
- [ ] **RCPT-02**: User can see "What your AI saw" as a timeline and a plain-language weekly summary
- [ ] **RCPT-03**: Receipts are encrypted, tamper-evident (hash-chained) and exportable as consent/disclosure records aligned with ISO/IEC 27560 (OSAP receipt format)

### Proposals

- [ ] **PROP-01**: When an agent wants to remember something, it creates a proposal; the user approves, edits or rejects it in a review queue that shows the change and the agent's reason
- [ ] **PROP-02**: Approving a memory never grants any agent permission to read it

## v2 Requirements

### Sync and recovery

- **SYNC-01**: User can sync the encrypted wallet through their own cloud (iCloud Drive, Nextcloud, Syncthing) with conflict handling
- **SYNC-02**: User can link a new device by scanning a QR code from an existing one
- **SYNC-03**: User can recover with a passkey (WebAuthn PRF) without us being able to read data
- **SYNC-04**: Paid hosted end-to-end encrypted Sync & Backup

### Standards and interoperability

- **STND-01**: bleib serves the HCP API as an `e2e` provider in the person's trust domain
- **STND-02**: Import and export of UMP and PCP archives
- **STND-03**: A2A agent card for the user's agent; AP2 / EUDI-delegated mandates

### Reach

- **REACH-01**: Always-on door in an attested enclave (paid)
- **REACH-02**: Organisation edition: work and personal parts with separate keys, admin recovery for the work part only
- **REACH-03**: Mobile apps
- **REACH-04**: Weekly summary by email or notification

## Out of Scope

| Feature | Reason |
|---------|--------|
| Social coordination ("Nudge") as first product | Needs both people on bleib; empty-network start. Later demo |
| On-chain permission registry | Public metadata, conflicts with GDPR erasure, deters mainstream and public-sector buyers; signed credentials + revocation list instead |
| Our own model, chat app or agent | bleib sits under existing agents |
| Automatic memory extraction without approval | Mem0's users found 97.8% of auto-extracted entries were junk; we use proposals |
| Payments and purchase mandates | Later, on AP2 / EUDI delegation |
| Promising anonymity or legal compliance | We promise evidence only |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| SITE-01 | Phase 1 | Pending |
| SITE-02 | Phase 1 | Pending |
| SITE-03 | Phase 1 | Pending |
| SITE-04 | Phase 1 | Pending |
| SITE-05 | Phase 1 | Pending |
| SITE-06 | Phase 1 | Pending |
| SITE-07 | Phase 1 | Pending |
| SITE-08 | Phase 1 | Pending |
| SITE-09 | Phase 1 | Pending |
| SITE-10 | Phase 1 | Pending |
| SITE-11 | Phase 1 | Pending |
| SITE-12 | Phase 1 | Pending |
| WALT-01 | Phase 2 | Pending |
| WALT-02 | Phase 2 | Pending |
| WALT-03 | Phase 2 | Pending |
| WALT-04 | Phase 2 | Pending |
| IMPT-01 | Phase 2 | Pending |
| IMPT-02 | Phase 3 | Pending |
| DOOR-01 | Phase 2 | Pending |
| DOOR-02 | Phase 2 | Pending |
| DOOR-03 | Phase 3 | Pending |
| DOOR-04 | Phase 2 | Pending |
| CONS-01 | Phase 2 | Pending |
| CONS-02 | Phase 2 | Pending |
| CONS-03 | Phase 2 | Pending |
| CONS-04 | Phase 3 | Pending |
| CONS-05 | Phase 2 | Pending |
| CONS-06 | Phase 2 | Pending |
| DEST-01 | Phase 2 | Pending |
| DEST-02 | Phase 3 | Pending |
| RCPT-01 | Phase 2 | Pending |
| RCPT-02 | Phase 3 | Pending |
| RCPT-03 | Phase 3 | Pending |
| PROP-01 | Phase 3 | Pending |
| PROP-02 | Phase 3 | Pending |

**Coverage:**
- v1 requirements: 35 total
- Mapped to phases: 35
- Unmapped: 0

By phase: Phase 1 = 12, Phase 2 = 15, Phase 3 = 8.

---
*Requirements defined: 24 November 2026*
*Last updated: 24 November 2026 after roadmap creation (traceability filled)*
