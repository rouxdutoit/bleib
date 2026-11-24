# Greenfield check report: user-owned context store for AI agents

Researcher stance: adversarial (trying to prove it is NOT greenfield). Date of research: 24 November 2026.

## Bottom line

**The concept is not greenfield as a design. It is close to greenfield as a shipping product.**

- The **Human Context Protocol (HCP)**, from the Stanford Digital Economy Lab and Consumer Reports "Loyal Agents" initiative, already specifies most of points 3, 4, 6 and 7 on paper:
  - grants scoped by client, category and purpose, either temporary or persistent;
  - standing deny rules and delegation;
  - per-read audit events that name the model and provider;
  - a mandatory "what each client received" summary for the person.
- Its implementation, **Context Router**, is a local-first Mac app with a local MCP endpoint. It is in a pilot, and on 10 Nov 2026 it merged per-client OAuth consent and a "durable disclosure history".
- **What nobody ships (verified as far as search allows):**
  - encryption at rest combined with category consent combined with content-level receipts, in one agent-neutral store;
  - a **destination** dimension in consent (local model vs hosted model vs provider);
  - plain-language weekly receipts;
  - an importer for OpenClaw workspace files into a neutral store.
- The HCP spec explicitly **forbids** content in its log (§8.5) and has no encryption requirement yet (open issue #22). Those two gaps are the real wedge.

---

## 1. Table of relevant hits (A, B, C, F)

The 7 points are:
1. Encrypted plain-text folder, synced
2. One local MCP door with minimal answers
3. Progressive consent over agent × kind × destination
4. Content-level receipts and a weekly summary
5. Agents propose, the person approves
6. Portability and importers
7. Keys, identity and mandates

Coverage marks: ✔ = covered, ◐ = partial, ✘ = absent, ? = not verified.

| # | Name | URL | License | Stage | Traction | Last activity | 1 | 2 | 3 | 4 | 5 | 6 | 7 | What it lacks |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | **HCP spec (Human Context Protocol) 2.0-draft-3** | https://github.com/loyalagents/hcp-spec | Apache-2.0 for schemas, CC BY 4.0 for spec text | Working draft, "not stable" | 6 stars, 41 issues, 5 PRs | Nov 2026 (draft-3) | ✘ (E2E confidentiality is open issue #22) | ◐ (spec is transport-agnostic; impl uses MCP) | ◐ client × category × purpose, temporary (4h default, 24h max) or persistent; no destination dimension; consent timing not mandated ([s6](https://github.com/loyalagents/hcp-spec/blob/2e2939c9bebcefb3bed7bb3522231c0e4d65a315/spec/2.0-draft-3/source/s6.md)) | ◐ `context.read` logs entryId, version, revealed pointers, categories, purpose, `participants.model`, `participants.provider`. §8.6 requires a per-client summary. **§8.5 forbids content in the log** ([s8](https://github.com/loyalagents/hcp-spec/blob/2e2939c9bebcefb3bed7bb3522231c0e4d65a315/spec/2.0-draft-3/source/s8.md)) | ◐ write grants exist | ✔ core goal | ◐ Delegated Authorization Profile | Encryption, destination scope, content receipts, weekly plain-language summary, importers |
| 2 | **Context Router** (HCP implementation) | https://github.com/loyalagents/context-router | Not stated | Pre-release; "assisted pilot acceptance is active" | 5 stars, 429 commits | PR #206 merged 10 Nov 2026 | ? (not documented) | ✔ local MCP at `127.0.0.1:8787/mcp` | ◐ OAuth consent per client, purpose-bound reads, revocation, in an isolated experiment ([PR #206](https://github.com/loyalagents/context-router/pull/206)) | ◐ "durable attempted-read history"; fields not documented | ◐ "review suggested preferences" | ◐ document import | ✘ | Encryption, destination, content receipts, ChatGPT/Claude/OpenClaw importers. HCP conformance not established ([PR #200](https://github.com/loyalagents/context-router/pull/200)) |
| 3 | **HCP paper and demo** (Shah, South, Trask, Weyl and others) | https://hcp.me/ | ? | Research prototype (tobinsouth/hcp-demo) | Academic | 2025 | ◐ claims "encrypted at rest and in transit" | ✔ "via REST or MCP" | ◐ "scoped sharing with expiration and revocation" | ✘ | ? | ✔ | ✘ | Product |
| 4 | **Sanctuary Framework** MCP server | https://glama.ai/mcp/servers/eriknewton/sanctuary-framework | Apache-2.0 for code, CC-BY-4.0 for spec | v1.8.4 stable on npm | ? | "Active" | ◐ per-agent state is AES-256-GCM encrypted; not plain-text files | ◐ wraps harness MCP traffic | ◐ three-tier operator approval, not category consent | ◐ hash-chained encrypted audit of calls; rated "partial", not per-flow | ◐ memory movement needs local approval (macOS only) | ✘ | ◐ Ed25519/DID identity | It is agent-ops security, not a personal memory with category consent |
| 5 | **SAIHM** (Sovereign AI Horizontal Memory) | https://saihm.net/developers | Client Apache-2.0; hosted SaaS | Commercial (SAIHM, Inc.) with free tier | ? | IETF draft -03, 11 Oct 2026 | ✔ encrypted and signed in-process, though a plaintext local cache is kept | ✔ MCP server | ◐ share one memory with expiry and revocation; no category prompts | ◐ "prove what your agent remembers, shares, and erases"; erasure receipts anchored on-chain | ? | ✔ one identity across models and agents | ◐ post-quantum identity binding | Per-category progressive consent, content receipts, plain-text folder |
| 6 | **Custos** (MCP over Solid pod) | https://github.com/anusii/custos | MIT | Research or hobby | 0 stars | ? | ✔ Argon2id and AES; data lives in a Solid pod | ✔ MCP server | ◐ `grants.json` per **purpose**, edited by hand; no prompt; the agent is "a single opaque principal" | ◐ `audit.log` of every allowed or denied call; content not logged | ✘ (`request_access` only queues a request) | ◐ Solid | ✘ | Per-agent and destination consent, content receipts |
| 7 | **agent-personal-memory** | https://github.com/samohod4ik/agent-personal-memory | MIT | Library, version 0.3 | 1 star | 2026 | ✔ AES-256-GCM per record | ✔ thin MCP facade | ✘ | ✘ ("operator outbox is not an audit log") | ✔ `confirm_required` mode creates candidates | ◐ JSON and Markdown export | ✘ | Consent, receipts |
| 8 | **ffielitz/human-context-protocol** (an unrelated "HCP" Codex) | https://github.com/ffielitz/human-context-protocol | Has a LICENSE file (type not stated) | Pre-alpha | 1 star | ? | ◐ Markdown and YAML in a git folder; encryption only planned | ✘ (MCP on the roadmap) | ✘ | ✘ | ✔ AI proposes, the human accepts or rejects | ✔ | ✘ | Almost everything beyond the folder |
| 9 | **Context Inversion Protocol / Sovereign OS** | https://sovereignos.foundation/whitepaper/ | Prototype MIT | Proposal v0.2.0 (Aug 2026) | Single author | Aug 2026 | ✘ | ✘ (proposed) | ✘ (proposed default-deny, purpose-limited grants) | ✘ (proposed audit ledger) | ✔ in prototype | ◐ local files | ✘ | Code |
| 10 | **Mwe-MCP** | https://github.com/Fr4nZ82/mwe-mcp, [HN](https://news.ycombinator.com/item?id=49020619) | AGPL-3.0 plus commercial | Self-hosted, "mostly vibe-coded" | 6 stars; 5 HN points | 2026 | ✘ | ✔ MCP (OAuth) | ◐ per-reader, paragraph-level ACL redaction | ◐ audit-trail search | ✔ write confirmations | ✘ ("no import path ships") | ✘ | Encryption, consent prompts; started as an OpenClaw plugin |
| 11 | **Memoram** | https://www.memoram.app/developer-platform, [HN](https://news.ycombinator.com/item?id=44072501) | Closed | 2025 Show HN | 3 points | May 2025 | ◐ "end-to-end encryption" | ? | ◐ MemoryKeys per AI tool | ✘ | ? | ? | ✘ | Possibly dormant |
| 12 | **Plurality "AI Context Flow" / Open Context MCP** | https://www.producthunt.com/p/ai-context-flow/show-ph-plurality-s-open-context-mcp-take-your-ai-memory-to-any-tool-anywhere, https://mcpservers.org/servers/web3-plurality/plurality-mcp-server | Closed | Live hosted MCP (OAuth 2.1, PATs) | PH launch | 2026 | ◐ TEE claims, self-reported | ◐ hosted, not local | ◐ memory buckets | ✘ | ✘ ("any tool can update your memory") | ✔ ChatGPT, Claude, Cursor | ✘ | Local, consent, receipts |
| 13 | **Mem0 OpenMemory MCP** | https://mem0.ai/blog/introducing-openmemory-mcp | Apache-2.0 | Reported **deprecated May 2026** (single source, [ChatForest](https://chatforest.com/reviews/mem0-mcp-server/)); `mem0-mcp` archived 24 Mar 2026 ([repo](https://github.com/mem0ai/mem0-mcp)) | Mem0 raised $24M Series A ([mem0.ai](https://mem0.ai/series-a)) | 2026 | ✘ | ✔ local MCP | ◐ per-client pause and revoke ([mem0.ai/openmemory-mcp](https://mem0.ai/openmemory-mcp)) | ◐ "access logs" (fields undocumented) | ✘ | ✔ | ✘ | Encryption, category consent, content receipts |
| 14 | **Basic Memory** | https://docs.basicmemory.com/integrations/openclaw | AGPL (open core) plus Cloud | v1.0 (Oct 2026 per changelog) | Popular | 2026 | ✘ plaintext Markdown ([dev.co](https://dev.co/ai/mcp/basic-memory)) | ✔ MCP | ◐ Cloud lets you enable or disable tools per connection ([docs](https://docs.basicmemory.com/guides/cloud)) | ✘ | ✘ | ✔ OpenClaw plugin | ✘ | Encryption, consent, receipts |
| 15 | **MemoryPlugin / Maximem Vity** | https://www.producthunt.com/products/memoryplugin-for-openclaw | Closed | Live | PH | Feb 2026 | ◐ cloud AES-256 | ◐ | ✘ | ✘ | ✘ | ✔ OpenClaw, ChatGPT, Claude, Gemini | ✘ | Cloud custody |
| 16 | **memorywire** | https://github.com/mthamil107/memorywire, [arXiv](https://arxiv.org/html/2606.01138v1) | Apache-2.0, UI under FSL | Spec v0, draft | 1 star | 2026 | ✘ | ◐ (MCP extension targeted for v0.5) | ✘ (`privacy_intent` consent flags on the v0.2 roadmap) | ◐ approve and reject decisions are audit-logged | ✔ diff-and-approve | ✔ | ✘ | Consent |
| 17 | **Open Memory Protocol** | https://github.com/SMJAI/open-memory-protocol, [WinBuzzer](https://winbuzzer.com/2026/06/30/open-memory-protocol-gives-compatible-ai-tools-one-memory-st-xcxwbn/) | Apache-2.0 | Reference server | ? | Jun 2026 | ✘ | ✔ (Claude via MCP) | ✘ | ✘ | ✘ | ✔ (ChatGPT via browser bridge) | ✘ | Governance |
| 18 | **MacPaw Portable Memory** | https://research.macpaw.com/publications/portable-memory.md, https://github.com/MacPaw/portable-memory | MIT | Standards proposal, 6 Jul 2026 | ? | Jul 2026 | ◐ optional Ed25519 signing, no encryption | ✘ | ✘ | ✘ | ✘ | ✔ `.mem` bundle with mem0, ChatGPT and Claude ingest adapters | ✘ | Usable building block for point 6 |
| 19 | **Inrupt Charlie / "Agentic Wallets"** | https://www.inrupt.com/blog/charlie-the-agent-that-works-for-the-consumer-and-the-bank, https://www.inrupt.com/blog/why-were-excited-about-solid-and-mcp | Closed (Solid is open) | Prototype MCP Solid server; B2B2C via banks | ? | 2025; **no 2026 launch found** | ◐ vault | ◐ prototype | ◐ "explicit, revocable consent" | ✘ | ? | ◐ | ◐ | Not shipping to consumers |
| 20 | **Kin** | https://apps.apple.com/us/app/kin-personal-ai-advisors/id6473448146 | Closed | Live app v0.15 | ? | May 2026 | ◐ on-device, "end-to-end encryption" (self-reported) | ✘ | ✘ | ✘ | ✘ | ✘ | ✘ | Not agent-neutral |
| 21 | **Proton Lumo** | https://proton.me/da/support/lumo-memory, [TechCrunch](https://techcrunch.com/2026/11/17/protons-lumo-a-privacy-focused-alternative-to-chatgpt-and-claude-arrives-on-desktop/) | Closed | Live; desktop 17 Nov 2026 | Large | Nov 2026 | ✔ zero-access encrypted memory | ✘ (Lumo is a client of MCP, does not serve memory) | ◐ per-connector auto, approve or block | ✘ | ◐ review and edit memories | ✘ | ✘ | Memory locked inside Lumo |
| 22 | **Apple Siri personal context + Apple Intelligence Report** | https://www.apple.com/newsroom/2026/06/apple-introduces-siri-ai-a-profoundly-more-capable-and-personal-assistant/, https://apple.com/legal/privacy/data/en/intelligence-engine | Closed | Live | Huge | Jun–Sep 2026 | ✔ on-device | ✘ | ✘ | ◐ exportable log of requests sent to Private Cloud Compute; **content inclusion contested** (Apple says no content; [Eclectic Light](https://eclecticlight.co/2026/09/22/read-an-apple-intelligence-report/) sees some prompt content) | ✘ | ✘ | ✘ | Only Apple's own cloud |
| 23 | **Google Private AI Compute / secure server-side memory** | https://deepmind.google/blog/advancing-private-ai-compute-with-secure-server-side-memory/ | Closed | Research, no rollout date | — | 23 Sep 2026 | ◐ device-held keys | ✘ | ✘ | ✘ | ✘ | ✘ | ✘ | Walled garden |
| 24 | **ChatGPT "Memory Sources"** | (secondary) https://remyndai.com/blog/ai-memory-chatgpt-claude-gemini-compared/ | Closed | Live (May 2026) | Huge | 2026 | ✘ | ✘ | ✘ | ◐ per-answer view of what shaped the reply; OpenAI says it is incomplete | ✘ | ✘ | ✘ | Single vendor |
| 25 | **Claude memory import** | https://macrumors.com/2026/03/02/anthropic-memory-import-tool/ | Closed | Live (Mar 2026) | Huge | 2026 | ✘ | ✘ | ✘ | ✘ | ◐ confirm on import | ◐ copy-paste import from ChatGPT, Gemini, Copilot | ✘ | Vendor lock-in |
| 26 | **Usercentrics + MCP Manager** (acquired 14 Jan 2026) | https://ppc.land/privacy-giant-snaps-up-ai-protocol-startup-to-govern-data-flows-nobody-saw-coming/ | Closed | Enterprise | Usercentrics is a CMP leader | Jan 2026 | ✘ | ◐ MCP gateway | ◐ plan: consent and preferences "across ... consumer-facing AI agents" | ◐ detailed audit logs | ✘ | ✘ | ✘ | Enterprise-side, not user-owned |
| F1 | **Acti** — $5.3M seed (BITKRAFT), Jul 2026 | https://technode.global/2026/07/01/singapores-acti-raises-5-3m-seed-round-to-build-ai-powered-keyboard-as-personal-context-layer/, https://techcrunch.com/2026/06/30/acti-puts-ai-agents-directly-into-your-smartphone-keyboard | Closed | Shipping keyboard | 1,000+ skills | 2026 | ◐ on-device by default | ✘ | ✘ | ✘ | ✘ | ✘ | ✘ | "User-owned context layer" is only a pitch |
| F2 | **Ghost** — $11M seed (a16z), Oct 2026 | https://cellcog.ai/blog/ghost-core-personal-ai-computer/ | Closed | $3,499 hardware | — | Oct 2026 | ◐ encrypted on-device memory | ? | ✘ | ✘ | ✘ | ✘ | ✘ | Hardware play |
| F3 | Mem0 ($24M A), Cognee ($7.5M seed), Supermemory ($3M), Zaro ($5.1M), Interloom (€14.2M) | https://mem0.ai/series-a, https://www.cognee.ai/blog/cognee-news/cognee-raises-seven-million-five-hundred-thousand-dollars-seed, https://www.thesaasnews.com/news/supermemory-raises-3m-pre-seed/, https://www.startupresearcher.com/news/zaro-launches-its-ai-context-platform-for-businesses, https://www.eu-startups.com/2026/03/german-startup-interloom-lands-e14-2-million-seed-funding-for-ai-agent-knowledge-infrastructure/ | Mixed | Developer and enterprise memory | — | 2025–26 | — | — | — | — | — | — | — | None is user-owned or consent-first |
| F4 | Keycard — $38M (a16z), Oct 2025; acquired Anchor.dev Feb 2026 | https://www.securityweek.com/keycard-emerges-from-stealth-mode-with-38-million-in-funding/ | Closed | Enterprise agent IAM | — | 2026 | — | — | ◐ per-task permissions | ◐ activity tracking | — | — | ◐ | Enterprise, not personal |
| F5 | PIN AI — $10M pre-seed (a16z CSX), Sep 2024 | https://siliconangle.com/?p=669829 | Closed | On-device personal AI | — | 2024–25 | ◐ | ✘ | ◐ | ✘ | ✘ | ✘ | ✘ | Stale |

**Not found (searched, nothing relevant):**
- digi.me and Dataswyft/HAT: no AI-agent or MCP offering found ([LinkedIn](https://linkedin.com/company/hatdex)).
- MyData operators: not specifically verified.
- Plurality funding: only an unclear CB Insights seed entry from Feb 2024 ([CB Insights](https://www.cbinsights.com/company/plurality/financials)).
- Kin funding: none found.

**Academic prior art on progressive consent:**
- **Conleash** (arXiv 2605.11360, May 2026) is client-side middleware for MCP. It uses a risk lattice and a refinement loop that "turns user decisions into reusable rules" to cut prompt fatigue, which is progressive consent in all but name, though for tool calls rather than memory categories. A 16-person user study preferred it. https://arxiv.org/abs/2605.11360
- **"Privacy Preference Controls for Agentic Systems"** (arXiv 2610.29929, Oct–Nov 2026) is a taxonomy of enforceable preferences with 8 open-source prototypes, proposed for MCP and A2A. https://arxiv.org/abs/2610.29929

---

## 2. OpenClaw and Hermes Agent ecosystems (question B)

### OpenClaw core

- **Memory storage.** Memory is plain Markdown in the workspace: `USER.md`, `MEMORY.md`, `memory/YYYY-MM-DD.md`, `DREAMS.md` and `memory/imports/<source>/`. The docs do not mention encryption. https://github.com/openclaw/openclaw/blob/main/docs/concepts/memory.md
  - OpenClaw itself imports memory from Codex, Claude Code and Hermes (same page).
  - Memory engines: builtin SQLite, Honcho, LanceDB, plus `memory-wiki` (same page).
- **Encryption at rest.** The official guidance is host full-disk encryption only: "Full-disk encryption on the gateway host". For transcripts, "any process/user with filesystem access can read them." https://docs.openclaw.ai/gateway/security/secrets-and-storage.md
  - Since OpenClaw 2.0 (v2026.8.1), transcripts live in SQLite at `~/.openclaw/agents/<id>/agent/openclaw-agent.sqlite`, with no SQLite encryption found. https://www.helpnetsecurity.com/2026/08/31/openclaw-2-0-released/
- **Audit ledger.** The ledger lives in `state/openclaw.sqlite`, records metadata only, and keeps 30 days by default. It "does not store prompts, message bodies, tool arguments or results". Identifiers are HMAC-pseudonymized with the key in the same database. The docs do not say whether it records which provider or model received which context. https://docs.openclaw.ai/gateway/audit
  - The logging docs say logs carry IDs, sizes and outcomes, not "message text, prompts, tool arguments, or tool results". The exception is `OPENCLAW_DEBUG_MODEL_PAYLOAD=full-redacted`. https://docs.openclaw.ai/logging
  - Issue #13131 (gateway audit of tool calls with args, session and model) was closed "not planned / superseded" on 26 Apr 2026. It points to open PR #63557, whose status is unverified. https://github.com/openclaw/openclaw/issues/13131
- **PR #127091** ("payload PII redaction, system-prompt masking, media blocking, session encryption") is **OPEN, not merged**. https://github.com/openclaw/openclaw/pull/127091
  - Opened 21 Aug 2026. A stale-bot notice followed on 3 Oct 2026.
  - It has no human reviews.
  - The ClawSweeper bot lists 12 blockers, including P1 bypasses on native Codex paths.
  - **Session encryption was removed from the branch.** In ClawSweeper's words, "the current branch contains no session encryption"; one commit says transcripts "use SQLite storage now".
- **Related issues:**
  - #55238 asks for PII pseudonymization before provider calls. https://github.com/openclaw/openclaw/issues/55238
  - #116500 asks for protected-path write enforcement on memory. https://github.com/openclaw/openclaw/issues/116500
  - #153426 and #203532 concern a provenance "ratchet" that marks memory untrusted. https://github.com/openclaw/openclaw/issues/153426, https://github.com/openclaw/openclaw/issues/203532
- **No core feature asks for consent on personal data, and none logs per-provider disclosures.** The provider-plugin "consent" covers harness runtime permissions only. https://docs.openclaw.ai/plugins/sdk-provider-plugins

### OpenClaw plugins and forks

| Plugin | What it does | Source |
|---|---|---|
| **GuardClaw** | Classifies messages into S1/S2/S3 tiers, keeps S3 local and redacts PII before cloud calls. Closest to a "destination" policy, but without consent or receipts. | https://github.com/list3r/guardclaw-openclaw-plugin |
| **openclaw-handoff-guard** | Blocks PII formats in agent-to-agent handoffs and can hold a match for owner approval. | https://github.com/splitleafhq/openclaw-handoff-guard |
| **openclaw-pii-guard** | Same idea; not on ClawHub. | https://github.com/seriouslysean/openclaw-pii-guard |
| **OpenClawDreams** | Keeps its own AES-256-GCM encrypted SQLite store and does not touch `MEMORY.md`. | https://github.com/RogueCtrl/OpenClawDreams |
| **MemoryClaw** | Makes encrypted *backups* of `~/.openclaw`. | https://memoryclaw.ai/blog/how-memoryclaw-encrypts-your-data |
| **Supermemory** | Official plugin is cloud-based. A community local plugin uses plain SQLite. | https://github.com/supermemoryai/openclaw-supermemory, https://hub.openclaw.ai/ivanvmoreno/plugins/openclaw-memory-supermemory/security-audit |
| **Honcho** | Setup uploads workspace memory files to api.honcho.dev unless self-hosted. | https://clawhub.ai/vvoruganti/honcho/security/openclaw |
| **Basic Memory, Maximem Vity, claude-mem, XMemo** | Memory slots with no consent or receipts. Basic Memory and claude-mem store plain Markdown. | https://docs.basicmemory.com/integrations/openclaw, https://clawhub.ai/thedotmack/claude-mem, https://hub.openclaw.ai/xmemo/plugins/openclaw-memory |
| **openclaw-with-consentguard** fork | Claims a "ConsentGate"; no documentation; 1 star. | https://github.com/reconsumeralization/openclaw-with-consentguard |
| **OWASP Agent Memory Guard** proposal #142 | Scan, snapshot and rollback for `MEMORY.md`, `USER.md` and `memory/*.md`. | https://github.com/OWASP/www-project-agent-memory-guard/issues/142 |

### Hermes Agent

- **Importer.** The command is `hermes import-agent openclaw` (formerly `hermes claw migrate`). https://hermes-agent.nousresearch.com/docs/guides/migrate-from-openclaw
  - **Imports:**
    - `SOUL.md` to `~/.hermes/SOUL.md`.
    - `MEMORY.md` and `USER.md`, merged and deduped into `~/.hermes/memories/`.
    - Daily `workspace/memory/*` files, merged into main memory.
    - `AGENTS.md`, with `--workspace-target`.
    - Skills, models and providers. API keys come over only with `--migrate-secrets`.
    - MCP servers, TTS settings and messaging tokens.
  - **Archived, not imported:** `IDENTITY.md`, `TOOLS.md`, `HEARTBEAT.md`, `BOOTSTRAP.md`, cron jobs, plugins, hooks and the memory backend.
  - OpenClaw does the reverse import from Hermes. https://docs.openclaw.ai/install/migrating-hermes
- **Memory providers.** Hermes has one external provider slot and roughly eight providers, moved out of core into a plugin catalog. https://hermes-agent.nousresearch.com/docs/user-guide/features/memory-providers, https://hindsight.vectorize.io/blog/2026/09/25/hindsight-hermes-plugin-catalog
  - One catalog plugin advertises an "AEAD-encrypted local vault". Its details are unverified.
  - Hermes extracts memories automatically at session end. No consent gate was found.
- **Consent UX in Hermes:**
  - Issue #142803: "Always allow" for MCP elicitation was sent as a one-time accept and not remembered. https://github.com/NousResearch/hermes-agent/issues/142803
  - PR #143780: MCP trust prompts now offer once, this session or always, per tool. https://github.com/NousResearch/hermes-agent/pull/143780
  - This is evidence that the client-side "remember the answer" pattern exists, but per **tool**, not per category or destination.

---

## 3. Verdicts on the four claims

### Claim 1: "Nobody ships content-level disclosure receipts for personal AI agents." **PARTLY TRUE (true for shipping; false for novelty)**

- **Shipping:** No product found gives the person a log of *exactly what content* went to *which agent and which model or provider*, for *what purpose*.
- **The design already exists:**
  - HCP §8 requires a `context.read` event per read, with entryId, version, revealed JSON pointers, categories, purpose, `participants.model` and `participants.provider`. §8.6 requires a per-client "what each client received" summary for the person. https://github.com/loyalagents/hcp-spec/blob/2e2939c9bebcefb3bed7bb3522231c0e4d65a315/spec/2.0-draft-3/source/s8.md
  - HCP entry versions are immutable (issue #3), so entryId plus version plus pointers makes the exact disclosed content **reconstructible**. https://github.com/loyalagents/hcp-spec/issues/3
  - HCP §8.5 forbids storing content in the log, so content-level receipts are a deliberate design divergence, not an untouched space.
- **Implementation:** Context Router merged "durable attempted-read history" on 10 Nov 2026. It is experimental and not released. https://github.com/loyalagents/context-router/pull/206
- **Partial analogues:**
  - Apple's exportable Apple Intelligence Report covers PCC requests only, and whether it includes content is disputed. https://eclecticlight.co/2026/09/22/read-an-apple-intelligence-report/
  - ChatGPT "Memory Sources" is per-answer and admitted to be incomplete. https://remyndai.com/blog/ai-memory-chatgpt-claude-gemini-compared/
  - Custos and OpenMemory log access, but only metadata. https://github.com/anusii/custos
- **Weekly plain-language summary:** none found anywhere.

### Claim 2: "Nobody ships progressive per-category consent for what an agent may read from personal memory." **PARTLY TRUE**

- **Specified:**
  - HCP grants are client × category (`hcp:{category}:{action}`, no wildcards) × purpose.
  - Grants are temporary by default (4h default, 24h max). A persistent grant requires a separate affirmative act.
  - Standing deny rules cover operators and categories.
  - https://github.com/loyalagents/hcp-spec/blob/2e2939c9bebcefb3bed7bb3522231c0e4d65a315/spec/2.0-draft-3/source/s6.md
- **Implemented, but not shipped:** Context Router PR #206 has OAuth consent per client and purpose-bound reads, in an isolated experiment and a pilot.
- **Shipped but weaker:**
  - Custos has per-*purpose* grants in a JSON file, with no prompts and no per-agent distinction. https://github.com/anusii/custos
  - Mem0 OpenMemory has per-client pause and revoke. https://mem0.ai/openmemory-mcp
  - Proton Lumo and Hermes have per-connector or per-tool always, approve or block. https://techcrunch.com/2026/11/17/protons-lumo-a-privacy-focused-alternative-to-chatgpt-and-claude-arrives-on-desktop/, https://github.com/NousResearch/hermes-agent/pull/143780
  - Conleash (research) does progressive, refining consent for MCP tool calls. https://arxiv.org/abs/2605.11360
- **What is genuinely unclaimed:** a just-in-time prompt keyed on **agent × category × destination (local vs hosted model, provider)**. HCP has no model or provider dimension in grants; it records model and provider only in logs. GuardClaw routes by sensitivity tier but asks no consent. https://github.com/list3r/guardclaw-openclaw-plugin

### Claim 3: "Nobody ships an encrypted, agent-neutral personal memory with both of the above." **TRUE (as of 24 Nov 2026)**

No product combines encryption at rest, category consent and content receipts. The nearest candidates each miss one or two pieces:

| Candidate | Has | Missing | Source |
|---|---|---|---|
| Context Router | Consent and disclosure history | Encryption is undocumented; HCP E2E confidentiality is open issue #22 | https://github.com/loyalagents/hcp-spec |
| Sanctuary | Encryption and an encrypted, hash-chained call audit | Category consent; it is a "partial" audit | https://glama.ai/mcp/servers/eriknewton/sanctuary-framework |
| SAIHM | Encryption, sharing contracts and erasure receipts | Category prompts, content receipts | https://saihm.net/developers |
| Custos | Encryption, per-purpose grants, metadata audit | Prompts, per-agent consent, content receipts; it has 0 stars | https://github.com/anusii/custos |

The window is real but narrow.

### Claim 4: "OpenClaw's memory is unencrypted on disk and its audit log stores no content." **TRUE**

- Memory is plain Markdown, and the docs say nothing about encryption. https://github.com/openclaw/openclaw/blob/main/docs/concepts/memory.md
- Official guidance is host full-disk encryption only. https://docs.openclaw.ai/gateway/security/secrets-and-storage.md
- The audit ledger is metadata-only and "does not store prompts, message bodies, tool arguments or results". https://docs.openclaw.ai/gateway/audit
- PR #127091 is unmerged, and session encryption was dropped from it. https://github.com/openclaw/openclaw/pull/127091
- **Caveat:** the SQLite session transcripts *do* hold full conversation content. "What did the provider get" can therefore be reconstructed forensically, but not as an audit or receipt, and not per memory item. https://docs.openclaw.ai/gateway/security/secrets-and-storage.md
- `OPENCLAW_DEBUG_MODEL_PAYLOAD` can log prompts in debug mode. https://docs.openclaw.ai/logging

---

## 4. Building blocks (question D), ranked by fitness

| Rank | Block | Fitness | License / maturity / bindings | Source |
|---|---|---|---|---|
| 1 | **age** (file encryption) | Best fit for "plain text files, encrypted, synced with whatever you use". Encrypts per file, so it is sync-friendly. Supports YubiKey through a plugin. | BSD-3; v1.3.2; Go, with Rust (rage) and TypeScript (typage); 24.4k stars | https://github.com/FiloSottile/age |
| 2 | **W3C DPV 2.2** (PD categories module plus the ISO 27560 profile) | Ready-made taxonomy for "kinds of information", plus a JSON-LD consent-record and receipt profile that maps to ISO 27560. | W3C CG final; 2.2 published 31 Aug 2025, hotfix 2.2.1; no 2026 release found | https://w3c.github.io/dpv/2.2/changelog, https://w3c.github.io/dpv/guides/consent-27560 |
| 3 | **HCP draft-3 schemas** (grants §6, log §8) | Adopt and extend rather than invent: add a destination dimension and content-hash or content receipts. This gives interop with the most credible standards effort. | Apache-2.0 schemas; unstable draft | https://github.com/loyalagents/hcp-spec |
| 4 | **MCP** (local server) plus **elicitation** | Form-mode elicitation suits allow once, always or no. The spec has accept, decline and cancel but **no "remember" semantics**, so persistence must live in the server. | Spec 2026-07-28. **Client support is patchy.** | https://modelcontextprotocol.io/specification/2026-07-28/client/elicitation |
| 5 | **Presidio plus GLiNER-PII** | Local classification of memories into categories and PII tagging. Not foolproof. | Presidio is now community-maintained (Data Privacy Stack), release 2.2.363 in Jun 2026; GLiNERRecognizer is built in; `gliner_multi_pii-v1` is Apache-2.0; GLiNER2-PII (May 2026) | https://microsoft.github.io/presidio/samples/python/gliner, https://arxiv.org/html/2605.09973 |
| 6 | **SQLCipher** | Encrypted index, grants and receipts database. | BSD-style Community Edition (Zetetic) | https://github.com/sqlcipher/sqlcipher |
| 7 | **A2A signed Agent Cards** | Later-phase agent identity. Signatures prove integrity, not identity. | v1.0 (Apr 2026, Linux Foundation); JWS with JCS canonicalization | https://aaif.io/blog/a2a-v1-0-a-builder-s-guide-part-2-migration-security-and-production, https://levelup.gitconnected.com/a2as-signed-agent-cards-prove-integrity-not-identity-2b1a017341ce |
| 8 | **Cryptomator vault format** | Good sync-friendly design (per-file content keys, AES-GCM chunks, AES-SIV names). | cryptolib is **AGPL-3.0** with a commercial option, Java; licence friction | https://docs.cryptomator.org/security/vault/, https://github.com/cryptomator/cryptolib |
| 9 | **gocryptfs** | Needs a FUSE mount. Linux-native, macOS beta, Windows only via cppcryptfs. Poor cross-platform fit for a consumer product. | MIT; v2.7.0 (11 Nov 2026); audited 2017 | https://github.com/rfjakob/gocryptfs |
| 10 | **ISO/IEC TS 27560:2023** | Right record structure, but paywalled and "to be revised". Use it through the DPV profile. | Technical Specification | https://www.iso.org/standard/80392.html |
| 11 | **AP2 mandates** | Payment-specific. Relevant only for point 7. | Apache-2.0; 3.3k stars; Mastercard "Verifiable Intent" aligned; IETF VCAP binding draft | https://github.com/google-agentic-commerce/AP2, https://www.ietf.org/archive/id/draft-stone-vcap-ap2-binding-01.html |
| 12 | **Plenipo** (EUDI Wallet mandates) | Right idea for signed mandates with shrinking delegation. Tested only with the walt.id sandbox, not a phone wallet. | v0.5.0 | https://github.com/plenipo-net/plenipo, https://github.com/plenipo-net/plenipo/releases/tag/v0.5.0 |
| 13 | **IEEE 7012 MyTerms** | Published 20 Jan 2026. The companion IETF MCNP is an individual draft. No deployments found. | Too immature for v1 | https://standards.ieee.org/ieee/7012/7192, https://datatracker.ietf.org/doc/draft-curtis-myterms |
| 14 | **Kantara Consent Receipt / ANCR** | Superseded: v1.1 was folded into ISO 27560. No 2025–26 activity found. | Stale | https://kantara.atlassian.net/wiki/x/DwC_Ag |

**MCP elicitation support by client:**
- URL mode is verified in Claude Code and VS Code v1.107. Claude.ai, Cursor and ChatGPT are "Unknown". https://canimcp.dev/feature/elicitation.url/
- Claude.ai and Desktop are reported as not supporting elicitation. The OpenAI Agents SDK uses per-call `require_approval` instead. https://vercel.com/i/mcp-elicitation-form-vs-url-mode
- **Implication:** the consent prompt cannot rely on elicitation alone. Plan for an out-of-band OS notification or local web prompt, using URL mode where available.

---

## 5. Standards work (question E)

- **IETF:**
  - **draft-saihm-memory-protocol-03** (Informational, independent, 11 Oct 2026) pitches SAIHM as the "memory-layer companion to MCP". A W3C CG post says the ISE released it from the queue in July 2026. https://datatracker.ietf.org/doc/draft-saihm-memory-protocol/, https://www.w3.org/community/ai-agent-memory-interop/2026/07/29/status-ietf-independent-submission-concluded-charter-2-1-de-confliction-lifts/
  - Other related drafts:
    - draft-maintainer-1f916-agent-record-01 (witness-signed agent memory logs) https://datatracker.ietf.org/doc/draft-maintainer-1f916-agent-record/
    - draft-liu-ai-agent-authorization-integration-00 (records consent decisions as evidence) https://datatracker.ietf.org/doc/draft-liu-ai-agent-authorization-integration/
    - draft-nelson-agent-delegation-receipts-10 https://datatracker.ietf.org/doc/draft-nelson-agent-delegation-receipts/
    - draft-curtis-myterms https://datatracker.ietf.org/doc/draft-curtis-myterms
  - None of these standardizes disclosure receipts for personal memory.
- **W3C:**
  - The **AI Agent Memory Interoperability CG** was proposed 18 May 2026, with charter v1.0 adopted 19 Jun 2026. Its chair, Russell Jackson, is the SAIHM author. Scope covers portability and conformance; consent and access control are not scope items. It references "audit-anchor receipts" and erasure receipts, and lists AAIF as host of the reference implementation. https://www.w3.org/community/ai-agent-memory-interop/2026/07/16/charter-ai-agent-memory-interoperability-community-group-v1-0/
  - The AI Agent Protocol CG has an open memory/provenance issue. https://www.w3.org/groups/cg/agentprotocol/activity/2026/
  - DPV CG: see section 4.
- **DIF:** The Trusted AI Agents WG (first met 30 Sep 2025) focuses on identity, authority and delegation, with selective disclosure as a stated priority. No memory or receipt deliverable was found. https://identity.foundation/working-groups/trusted-agents
- **Linux Foundation AAIF:** No memory or context working group was confirmed. The AAIF CTO has publicly named "agent memory and context management" as what "matters most". https://thenewstack.io/agentic-ai-foundation-projects/
- **MCP spec:**
  - Memory proposals keep getting deflected, with maintainers saying memory semantics should not be standardized before the ecosystem converges.
  - Issue #3564 (memory extension) was closed 20 Nov 2026 and redirected to a working group. https://github.com/modelcontextprotocol/modelcontextprotocol/issues/3564
  - The RFC on memory portability tools is at #2043 and #2216, with related SEP-2342 and SEP-1975. https://github.com/modelcontextprotocol/modelcontextprotocol/discussions/2216
  - The extensions framework is SEP-2133. https://github.com/modelcontextprotocol/modelcontextprotocol/pull/2133
- **Academic and community:**
  - HCP comes from the Stanford DEL Portable Memory project and Loyal Agents (Consumer Reports and Stanford). https://digitaleconomy.stanford.edu/project/portable-memory/, https://digitaleconomy.stanford.edu/project/loyal-agents
  - The Global Memory Workshop report (Mar 2026) was co-sponsored by the Gates Foundation, AWS, Mozilla and Slalom. https://digitaleconomy.stanford.edu/app/uploads/2026/06/GlobalMemoryWorkshop.pdf
  - **memorywire** is a vendor-neutral wire format for memory operations, with a diff-and-approve channel. https://arxiv.org/html/2606.01138v1
  - **MIF** (Memory Interchange Format) is a converter tool. https://pypi.org/project/mif-tools
  - **MacPaw Portable Memory** proposes a `.mem` bundle format. https://research.macpaw.com/publications/portable-memory.md
  - A July 2026 review found that "all 7" memory products it tested lock you in. https://dev.to/stantyan/i-tested-7-ai-memory-products-for-portability-all-7-lock-you-in-31pm

---

## 6. Single biggest threat (next 12 months)

**Loyal Agents' HCP and Context Router (Stanford Digital Economy Lab with the Consumer Reports Innovation Lab).**

**Why it is the biggest threat:**
- It is the only effort that already has, on paper, the same consent model: client × category × purpose, temporary or persistent, standing deny rules and delegation.
- It already has a receipt model: per-read events naming model and provider, plus a mandatory per-client summary for the person.
- It has a running local-first Mac app with a local MCP endpoint, now in pilots.
- It merged consent and disclosure history on 10 Nov 2026.
- It carries institutional credibility: Stanford, Consumer Reports, a Gates/AWS/Mozilla-sponsored workshop, and Sandy Pentland. A CR-branded "loyal" memory app plus a standard could own the narrative quickly.

Sources: https://github.com/loyalagents/hcp-spec, https://github.com/loyalagents/context-router, https://digitaleconomy.stanford.edu/project/loyal-agents

**What they leave open (your wedge):**
1. Encryption at rest is not in the spec (issue #22).
2. There is no destination (local vs hosted, provider) dimension in grants.
3. The log deliberately excludes content.
4. There are no OpenClaw, Hermes, ChatGPT or Claude importers, and no plain-text folder model.
5. There is no weekly plain-language receipt.

**Recommendation:** build *on* HCP schemas (be an HCP provider with extensions) rather than against it.

**Secondary threats:**
- **SAIHM** has encryption, MCP, receipts rhetoric, an IETF draft and a W3C CG it controls.
- **Anthropic, OpenAI or Apple** could add per-memory access logs. Apple already exports PCC request reports, and OpenAI already shows "Memory Sources".
- **Usercentrics** plans to manage consent "across ... consumer-facing AI agents".
- **OpenClaw** could land encryption or redaction in core. PR #127091 shows community appetite, though it has stalled.

---

## 7. Could not verify

- Context Router licence, encryption, and the exact fields of its disclosure history.
- Mem0 OpenMemory deprecation in May 2026 (single secondary source).
- Whether Inrupt Charlie or Agentic Wallets launched in 2026.
- Plurality funding, and its TEE or permission claims.
- Kin's encryption and funding.
- SAIHM's receipt contents.
- Sanctuary's star count.
- Whether the Apple Intelligence Report includes content.
- Status of OpenClaw PR #63557.
- Elicitation support in Cursor, ChatGPT and Claude Desktop.
- digi.me, HAT and MyData operator AI-agent work (nothing found).
- Funding for Ghost and Acti beyond press coverage.
- Mwe-MCP's posting date.
