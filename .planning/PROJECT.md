# bleib

## What This Is

bleib is the open source wallet for your AI context: your memory, rules and permissions, kept encrypted on your side, used by any agent you choose, with a receipt every time something is shared. It's for ordinary people who use several AI assistants, for developers running agents like OpenClaw, Hermes or Claude Code, and later for organisations that have to show what their AI saw. "bleib" is German for "stay": your context stays with you when you change AI.

## Core Value

You can change AI without losing who you are to it, and you can always see exactly what each AI was given, because your context lives in a wallet you hold the keys to, not with the provider.

## Business Context

- **Customer**: Individuals first (developers, then everyday AI users); organisations later via an organisation edition
- **Revenue model**: Free and open source for everything that keeps your data yours; paid only for convenience (hosted end-to-end encrypted sync and backup with passkey recovery, later an always-on door and organisation support), Bitwarden/Obsidian style
- **Success metric**: Weekly active wallets connected to at least one agent; early-access signups before launch
- **Strategy notes**: `docs/BRIEF.md`; research in `docs/research/`

## Requirements

### Validated

(None yet — ship to validate)

### Active

**Milestone 1: website**
- [ ] A landing site that closely follows roze.ai's structure and pacing: a photo hero that shrinks into a framed panel, a sticky product card that changes scene as you scroll with short headlines beside it and tick navigation, an interactive finale and a minimal footer
- [ ] The site uses bleib's own mark, name, copy and imagery, with none of Roze's text, images, code or brand assets
- [ ] The scenes show exactly what bleib is: your context in one place, permission asked once, receipts ("what your AI saw"), change AI and keep your context, agents propose and you decide
- [ ] "Open source" and "free until you want convenience" are visible near the top
- [ ] Simple single page that links to subpages (How it works, Developers, Pricing, Privacy) and an early-access signup
- [ ] Accessible (WCAG 2.2 AA / BITV 2.0), responsive to phone width, respects reduced motion, works in German and English
- [ ] Deployed to the existing Cloudflare Pages project `bleib` (bleib.pages.dev)

**Milestone 2: MVP (single person, day-one value), to be sharpened with the competitor teardown**
- [ ] An encrypted local wallet of plain-text context, compatible with OpenClaw/Hermes workspace files
- [ ] A local MCP door any agent can connect to, answering with the smallest useful answer
- [ ] Permission asked once per agent × kind of information × destination, remembered, with rules in plain words that agents can't raise
- [ ] Receipts of exactly what each agent and model received, with a plain-language weekly summary
- [ ] Agents propose memories; the person approves
- [ ] Importers for ChatGPT/Claude memory text and OpenClaw/Hermes workspaces
- [ ] Recovery set up before anything is stored (recovery kit, device linking)

### Out of Scope

- Social coordination ("Nudge") as the first product — needs both people to have bleib, so it starts with an empty network; good later demo
- On-chain permission registry — leaks metadata publicly, conflicts with GDPR erasure, and puts off mainstream and public-sector buyers; signed credentials with a revocation list do the job
- Our own model, chat interface or agent — agents exist (OpenClaw, Hermes, Claude, ChatGPT); bleib sits underneath them
- Payments and agent mandates for purchases — later, building on AP2 / EUDI delegation
- Mobile apps in v1 — desktop and local first
- Hosted sync in v1 — the free tier syncs through the person's own cloud first; hosted sync is the first paid feature after the MVP
- Promising anonymity or legal compliance — we promise evidence only

## Context

- **History:** an October 2026 version ("authority for agents", social coordination via Nudge, on-chain permissions) was built and parked on 29 Oct 2026 after competitor research. Its site, mark, fonts and licensed provider icons are in `_archive/bleib-v0/` (not tracked). bleib.pages.dev currently serves that old site.
- **Market (24 Nov 2026):**
  - Funded closed rivals: Egoist AI Passport ($3M, YC), First Person Labs "Second" ($10M, a16z), Plurality, Vana.
  - Standard: HCP (Stanford + Consumer Reports Loyal Agents), draft 3, public comments until 27 Nov 2026; draft comment in `docs/hcp-comment-draft.md`.
  - Open source with traction: Basic Memory (closest business model; no encryption, consent or receipts), Mem0, Supermemory, Compartment, TotalReclaw.
  - Unclaimed: receipts with the exact content disclosed, consent bound to the real destination, both in an open, user-keyed wallet.
- **Agent ecosystem:** OpenClaw (MIT, about 370k stars, plain-text unencrypted memory, metadata-only audit) and Hermes Agent, which imports OpenClaw workspaces. A local model proxy or OpenClaw's request hook is where the real destination is visible; a plain MCP server can't know which model receives data.
- **Related product:** Fazit (fazit.dev), from the same founders: read-only, offline reports, same principles. Its site was also inspired by roze.ai.

## Constraints

- **Open source**: all wallet code public; free tier never limits privacy — positioning against closed funded rivals
- **Build on established pieces**: HCP grants/logs, OpenClaw workspace format, age + SQLCipher, W3C DPV, ISO 27560, official MCP SDK — speed and credibility
- **Privacy**: local first, no telemetry, we never hold keys that let us read data, fail closed
- **Language**: plain words in the interface; German and English written natively
- **Accessibility**: WCAG 2.2 AA / BITV 2.0 from day one
- **Hosting**: Cloudflare Pages (existing project `bleib`) for the site
- **Brand**: keep the bleib mark (gold #f6e79a, black tile) and name; trademark still to be checked
- **Website licensing**: follow Roze's structure and feel, but no copying of its text, images, code or assets

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Open source wallet, not "what did my agent send?" check | The check is one feature (receipts); the product is the wallet | — Pending |
| Free and open source; pay only for convenience | Bitwarden/Obsidian model; trust beats funded closed rivals | — Pending |
| Lead with proof (receipts, real destination), not just portability | Portability is crowded and funded; proof is unclaimed | — Pending |
| Be compatible with HCP and run as an e2e provider in the person's trust domain | Standard credibility; spec §4.8 fits our architecture | — Pending |
| Drop on-chain registry for signed credentials + revocation list | Privacy, GDPR, buyer acceptance | — Pending |
| Single-player MVP before social coordination | Day-one value without network effects | — Pending |
| Site follows roze.ai's structure closely with bleib's own assets | Founder preference; proven clarity | — Pending |
| Skip GSD research; use our own reports and the teardown | Research already done today | — Pending |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd-transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd-complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 24 November 2026 after initialization*
