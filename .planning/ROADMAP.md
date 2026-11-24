# Roadmap: bleib

## Overview

bleib ships in three vertical slices, each leaving something a person can use and verify end to end. First the website (Milestone 1): it says what bleib is, shows "Open source. Free. Your keys." in the first screen, and collects early-access signups on the existing Cloudflare Pages project. Then the wallet MVP (Milestone 2) in two steps. The thinnest full loop comes first: an encrypted wallet, an imported workspace, one agent connected over MCP, a consent prompt, and a receipt of exactly what the agent was given. The broadening follows and makes bleib the open, verifiable default: all five agent setups, plain-word rules, observed destinations, the "What your AI saw" timeline and weekly summary, export, and the proposals review queue.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [ ] **Phase 1: Website** - A bilingual, accessible landing site in roze.ai's structure with bleib's own assets, live on Cloudflare Pages with early-access signup
- [ ] **Phase 2: Wallet Core Loop** - Encrypted wallet with workspace import, one agent connected over MCP, consent asked once, and a receipt of exactly what was shared
- [ ] **Phase 3: Full Control and Proof** - All agent setups, plain-word rules, observed destinations, "What your AI saw" timeline, weekly summary and export, and the proposals review queue
- [ ] **Phase 4: Browser extension: save and fill**

## Phase Details

### Phase 1: Website
**Goal**: A visitor understands what bleib is within one scroll, sees that it is open source and free, and can join early access on a live, accessible, bilingual site.
**Mode:** mvp
**Depends on**: Nothing (first phase)
**Requirements**: SITE-01, SITE-02, SITE-03, SITE-04, SITE-05, SITE-06, SITE-07, SITE-08, SITE-09, SITE-10, SITE-11, SITE-12
**Success Criteria** (what must be TRUE):
  1. A visitor landing on the site sees a full-bleed photo hero with the bleib mark, a headline, an early-access button, and "Open source. Free. Your keys." with a GitHub link, all in the first screen; scrolling shrinks the photo into a framed panel beside the headline.
  2. Scrolling past the sticky product card walks through five scenes in order (your context in one place, permission asked once, "what your AI saw", change AI and keep your context, agents propose and you decide), each with a short headline and one line beside it, and a vertical tick navigation shows the current scene and jumps to any scene; at 360px wide the story stacks with no horizontal scroll.
  3. A visitor can play with the finale (sweeping scattered context cards into the wallet and putting them back) with mouse, touch or keyboard; the whole site is keyboard operable, meets WCAG 2.2 AA contrast, lets motion be paused, and shows a complete static version under reduced motion.
  4. A visitor can join early access with an email address and sees a confirmation, and the founders can export the stored signups from Cloudflare; the home page links to working How it works, Developers, Pricing, Privacy and Impressum pages; and the whole site reads natively in English and German with a language switch.
  5. The site is live on the Cloudflare Pages project `bleib`, scores at least 90 on mobile Lighthouse for performance, accessibility, best practices and SEO, and uses only bleib's own mark, copy and licensed imagery, with nothing taken from roze.ai.
**Plans**: TBD
**UI hint**: yes

### Phase 2: Wallet Core Loop
**Goal**: A person can create an encrypted wallet from their existing workspace, connect one agent over MCP, decide what it may see, and open a receipt showing exactly what it was given.
**Mode:** mvp
**Depends on**: Phase 1 (sequenced after the website; no technical dependency)
**Requirements**: WALT-01, WALT-02, WALT-03, WALT-04, IMPT-01, DOOR-01, DOOR-02, DOOR-04, DEST-01, CONS-01, CONS-02, CONS-03, CONS-05, CONS-06, RCPT-01
**Success Criteria** (what must be TRUE):
  1. A user installs bleib with one command and creates a wallet, and setup refuses to store anything until the recovery kit is saved; the user unlocks once per session (until reboot or auto-lock) and no agent can unlock it.
  2. A user imports an OpenClaw or Hermes workspace (`USER.md`, `MEMORY.md`, daily notes); the context sits on disk as Markdown files that cannot be read without the wallet, and the user can open, read and correct it in a local bleib page in the browser.
  3. A user pairs one agent with a one-time code and declares where its model runs; the agent gets its own credential, asks for context for a stated purpose over a local MCP server and receives the smallest useful answer rather than whole files; before access is granted it receives an actionable "approval required" state with a link for the user, not a bare refusal.
  4. The first time the connected agent asks for a kind of information, the user sees exactly what would be shared and where it goes (inside the agent where MCP elicitation is supported, otherwise in a local bleib notification or page) and chooses Allow once / Always for this agent / No; the answer is remembered and asked again only when the agent, the kind of information or the destination changes, and sensitive kinds (health, finances, other people's private details, credentials) default to Allow once.
  5. After the agent is given context, the user can open a receipt showing agent, model and provider, destination (marked "declared"), purpose, the exact content given and the time, and it was recorded before the answer was released; when the user revokes the agent or a permission, the agent's next request is refused or asked again.
**Plans**: TBD
**UI hint**: yes

### Phase 3: Full Control and Proof
**Goal**: A person can connect any of their agents, set rules in plain words, see where data really went, review what agents propose to remember, and read a plain-language summary of what their AI saw.
**Mode:** mvp
**Depends on**: Phase 2
**Requirements**: DOOR-03, CONS-04, DEST-02, RCPT-02, RCPT-03, PROP-01, PROP-02, IMPT-02
**Success Criteria** (what must be TRUE):
  1. A user can follow copy-paste setup for Claude Desktop, Claude Code, OpenClaw, Hermes and Cursor, and each one connects and gets answers.
  2. A user can set a rule in plain words (for example "never share health with hosted models") and it is enforced on the next request; no agent can widen a rule or approve its own access.
  3. For an agent whose model endpoint is pointed at bleib's local model proxy, or that runs through OpenClaw's request hook, receipts show the real destination marked "observed" instead of "declared".
  4. A user can read "What your AI saw" as a timeline and as a plain-language weekly summary, and can export receipts as consent/disclosure records aligned with ISO/IEC 27560; receipts are encrypted, and editing or removing one is detected.
  5. When an agent wants to remember something, a proposal appears in a review queue showing the change and the agent's reason, and the user can approve, edit or reject it; approving a memory never lets any agent read it; memory pasted from ChatGPT or Claude is split into reviewable entries in the same queue.
**Plans**: TBD
**UI hint**: yes

## Scope Notes

Where a requirement straddles the two wallet slices, it is mapped to exactly one phase. The other phase still needs a minimal version to make its loop work.

- **Receipts (RCPT-01 / RCPT-02 / RCPT-03):** Phase 2 records every receipt and lets the user open a single receipt (RCPT-01). The timeline, weekly summary (RCPT-02), tamper-evidence and ISO/IEC 27560 export (RCPT-03) land in Phase 3. Phase 2 must never write receipts unencrypted, because they hold the exact content shared; Phase 3 adds hash-chaining and export on top.
- **Agent setup (DOOR-01 / DOOR-03):** Phase 2 ships setup guidance only for the one agent it connects (DOOR-01 covers pairing). DOOR-03, copy-paste setup for all five agents, completes in Phase 3.
- **Import (IMPT-01 / IMPT-02):** The workspace importer is in Phase 2. Pasted ChatGPT/Claude memory (IMPT-02) is in Phase 3, because it produces reviewable entries that share the proposals queue (PROP-01) rather than needing a second review screen.
- **Destination (DEST-01 / DEST-02):** Phase 2 binds consent to the destination the user declares at pairing. Phase 3 adds observation through the local model proxy and OpenClaw's request hook.
- **Open input:** competitor teardowns 4 and 5 are pending and may adjust the scope of Phases 2 and 3.

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Website | 0/TBD | Not started | - |
| 2. Wallet Core Loop | 0/TBD | Not started | - |
| 3. Full Control and Proof | 0/TBD | Not started | - |

### Phase 4: Browser extension: save and fill

**Goal:** An ordinary person who chats with ChatGPT, Claude or Gemini in the browser uses bleib like a password manager: when they tell an AI something worth remembering, bleib offers "Save this to bleib?"; in any chat, a "Use from bleib" button inserts only the memory they approve for that AI, and every insert leaves a receipt. Everything is processed locally against their encrypted wallet.
**Import:** on each provider's own memory page (ChatGPT saved memories, Claude memory, Gemini saved info) the extension offers "Import into bleib"; every entry goes through the existing review queue (Save / Edit / Not Now), marked as provided by that provider. Fallbacks: official data exports and pasted "what do you remember about me" answers (IMPT-02 already handles pasted text).
**Scope notes:** Manifest V3 for Chrome and Firefox first, Safari after; host permissions only for chatgpt.com, claude.ai and gemini.google.com; talks to the local wallet (native messaging or the 127.0.0.1 door); no remote servers. Research first: existing memory extensions (Mem0 OpenMemory, Supermemory, MemoryPlugin) and how bleib differs, MV3 limits, store review rules, minimal permissions, resilience to chat-site UI changes.
**Requirements**: TBD (EXT-*)
**Depends on:** Phase 3
**Plans:** 0 plans

Plans:
- [ ] TBD (run /gsd-plan-phase 4 to break down)
