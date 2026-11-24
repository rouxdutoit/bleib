# Teardown 2: Open source memory projects with real traction or backing

Research date: 24 November 2026. Star, fork, contributor, issue and release figures were pulled from the GitHub API on that date (`gh api repos/<owner>/<repo>`). Download figures come from pypistats.org and api.npmjs.org (last 30 days). Discord sizes come from Discord's public invite endpoint (`approximate_member_count`). Anything marked **[unverified]** comes from a single secondary source or is my inference. **[our analysis]** marks conclusions I drew from reading code rather than from a vendor statement.

Products covered: Basic Memory (deepest), Mem0 and the archived OpenMemory, Supermemory, Honcho, Compartment (deep), TotalReclaw (deep).

---

## 1. Basic Memory (Basic Machines)

### 1. What it is
Local-first AI memory stored as plain Markdown files with a knowledge-graph grammar, served over MCP, plus a paid hosted cloud ("AI conversations that actually remember") ([README](https://github.com/basicmachines-co/basic-memory/blob/main/README.md)).
- **For:** individuals using Claude, Codex, Cursor or ChatGPT, and now teams ("Basic Memory Teams") ([README](https://github.com/basicmachines-co/basic-memory/blob/main/README.md)).
- **Stage:** v1.0.0 released 29 Oct 2026 ([release](https://github.com/basicmachines-co/basic-memory/releases/tag/v1.0.0)). The repo was created 2 Dec 2024 (GitHub API).
- **License:** AGPL-3.0 for both the local app and the cloud engine ([README](https://github.com/basicmachines-co/basic-memory/blob/main/README.md)).
- **Funding:** none found **[unverified; searches returned nothing]**.
- **Traction:** 4,694 stars, 373 forks, 850 issues total (58 open) (GitHub API). 58,754 PyPI downloads in the last month ([pypistats](https://pypistats.org/packages/basic-memory)). 539 Discord members ([invite](https://discord.gg/tyvKNccgqN)).
- **Team:** effectively one lead developer. `phernandez` has 1,707 commits, `groksrc` 158, `jope-bm` 41, and the long tail is in single digits ([contributors](https://github.com/basicmachines-co/basic-memory/graphs/contributors)).

### 2. How it works
- **Source of truth:** Markdown files in `~/basic-memory` (one folder per "project"), plus a local SQLite index. Postgres is supported, with optional Milvus for vectors. "Just files plus a local SQLite index. No servers required." ([README](https://github.com/basicmachines-co/basic-memory/blob/main/README.md)).
- **File format:** each file is an Entity with YAML frontmatter (`title`, `type`, `permalink`, `tags`), followed by:
  - `## Observations`: lines like `- [category] fact text #tag (context)`;
  - `## Relations`: lines like `- relation_type [[Target]]`. A bare `[[link]]` indexes as `links_to`.
  - The README calls this "the whole grammar" ([README](https://github.com/basicmachines-co/basic-memory/blob/main/README.md#the-markdown-format)). Obsidian reads the same files with no setup.
- **Search:** hybrid full-text plus vector (FastEmbed), with optional cross-encoder reranking that is off by default ([README](https://github.com/basicmachines-co/basic-memory/blob/main/README.md)).
- **Schema system:** frontmatter `type` drives Picoschema validation, inference and drift detection ([issue #993](https://github.com/basicmachines-co/basic-memory/issues/993)).
- **Encryption:** none locally; files are plaintext on disk. The cloud claims "TLS" and "encrypted at rest in storage". It does not claim end-to-end encryption and says nothing about key management ([basicmemory.com/security](https://basicmemory.com/security)).
- **Cloud architecture:** a per-tenant storage bucket and a per-tenant database. Subprocessors are Tigris (S3), Neon (Postgres), WorkOS (identity) and Polar (billing) ([security](https://basicmemory.com/security)).
- **Sync:** cloud-to-local sync was "rclone-powered with conflict resolution" ([README](https://github.com/basicmachines-co/basic-memory/blob/main/README.md)). However, v1.0 *removed* the legacy cloud sync and bisync commands (`feat(cli)!: remove legacy cloud sync and bisync`, [v1.0.0](https://github.com/basicmachines-co/basic-memory/releases/tag/v1.0.0)) and replaced them with per-project routing (`bm project set-cloud`). Local users sync themselves: "Manual (Git, Syncthing, etc.)" ([README](https://github.com/basicmachines-co/basic-memory/blob/main/README.md)).
- **Recovery:** locally, whatever backups you keep. Cloud offers snapshots for 7 days (Cloud) or 30 days (Pro/Business), "backed up offsite", and "Your notes are never deleted" ([pricing](https://basicmemory.com/pricing), [security](https://basicmemory.com/security)).

### 3. How agents connect
- **MCP tools in 1.0** (renamed from `write_note` and similar to the `bm_*` family):
  - content: `bm_write`, `bm_read`, `bm_edit`, `bm_move`, `bm_delete`;
  - search: `bm_search`, `bm_list`, `bm_find`;
  - graph: `bm_context`;
  - projects: `bm_project_list`, `bm_project_create`, `bm_recent`, and `bm_project_delete`, which needs server opt-in;
  - schema: `bm_schema_validate`, `bm_schema_infer`, `bm_schema_diff`;
  - manual: `bm_man`;
  - cloud only: OpenAI-style `search` and `fetch` for ChatGPT ([README](https://github.com/basicmachines-co/basic-memory/blob/main/README.md#mcp-tools)).
- **Behaviour hints:** every tool carries MCP annotations. `bm_write` and `bm_delete` are `destructiveHint: true` ([write.py](https://github.com/basicmachines-co/basic-memory/blob/main/src/basic_memory/mcp/tools/write.py)). Codex therefore still asks before writes, edits and deletes even when `default_tools_approval_mode = "approve"` ([README](https://github.com/basicmachines-co/basic-memory/blob/main/README.md)).
- **Optimistic concurrency:** `bm_write` refuses to overwrite unless `overwrite=true`. Passing `expected_checksum` (from `bm_read`) replaces only the revision that was read ([write.py](https://github.com/basicmachines-co/basic-memory/blob/main/src/basic_memory/mcp/tools/write.py)).
- **Hosted agents (Cloud only):** an "agent" is a note with `type: agent`. It can run on a `watch` path or a `schedule`, and `web` access is optional. Tools are `bm_agent_list/run/get/runs/mark` ([agents(7)](https://github.com/basicmachines-co/basic-memory/blob/main/src/basic_memory/man/man7/agents(7).md)).
- **Packages:** a Claude Code plugin (session-start briefings, pre-compaction checkpoints, `/basic-memory:remember`), shared `SKILL.md` skills, a Hermes memory-provider plugin, an OpenClaw plugin, and a Codex plugin ([README](https://github.com/basicmachines-co/basic-memory/blob/main/README.md), [Hermes plugin](https://github.com/basicmachines-co/basic-memory/blob/main/integrations/hermes/README.md)).
- **Importers:** `bm import claude conversations`, `chatgpt`, and `memory-json` (the official MCP memory server format) ([README](https://github.com/basicmachines-co/basic-memory/blob/main/README.md#cli-essentials)).

### 4. Consent and control
- **No per-agent consent model locally.** Any MCP client that is connected gets all tools. Since 1.0, note tools must name a project explicitly (`fix(mcp): require explicit project scope for note tools`, [v1.0.0](https://github.com/basicmachines-co/basic-memory/releases/tag/v1.0.0)). The only gate on writes is the host's own approval prompt, triggered by annotations.
- **Read-only notes:** a frontmatter flag (`locked: true`) that makes edit and delete refuse was *proposed* for 1.0 ([#993](https://github.com/basicmachines-co/basic-memory/issues/993), closed). Whether it shipped is **[unverified]**.
- **Cloud access control** ([security](https://basicmemory.com/security), [pricing](https://basicmemory.com/pricing)):
  - roles (Owner, Viewer, User Admin) and project visibility (Standard, Shared, Private);
  - API keys that can be read-only or scoped to one project (Pro and up);
  - audit logs on Business, covering "invitations, role changes, and member status" for people and agents.
  - These are access logs, not content receipts.
- **Write approval for hosted agents:** a finished run that changed notes "waits for review until someone keeps or undoes it". `bm_agent_get` with `changes` returns a diff per note. "Undo is not a tool… it stays the person's click on the run's page" ([agents(7)](https://github.com/basicmachines-co/basic-memory/blob/main/src/basic_memory/man/man7/agents(7).md)).
- **Telemetry:** on by default. It is limited to cloud-promo and login funnel events, sent to Umami, and `BASIC_MEMORY_NO_PROMOS=1` turns it off ([README](https://github.com/basicmachines-co/basic-memory/blob/main/README.md#telemetry)).

### 5. Onboarding and UX
- **Two paths, side by side in the README:**
  - Cloud: "30 seconds. Sign up, connect your AI client, done." One-click connect happens from the web app.
  - Local: "2 minutes", run `uv tool install basic-memory --prerelease=allow`, then hand-edit the client's JSON config ([README](https://github.com/basicmachines-co/basic-memory/blob/main/README.md#get-started)).
- **Friction on the local path:** the `--prerelease=allow` caveat is three sentences long, because a FastMCP pre-release dependency otherwise silently installs an older version ([README](https://github.com/basicmachines-co/basic-memory/blob/main/README.md)).
- **Non-technical users** are pointed to Cloud. Cloud includes mobile and web access.
- **Starter prompts:** "Create a note about our project architecture decisions."

### 6. Business model
There is a conflict between sources:
- **README:** "$15.00/mo locked in for life (regular price $19)", one plan with no tiers, a 7-day trial, and coupon `BMFOSS` for another 20% off for 3 months ([README](https://github.com/basicmachines-co/basic-memory/blob/main/README.md#pricing)).
- **Live pricing page** (per workspace per month, credit-metered at 1 credit = $0.01; credits appear to pay for hosted agent runs **[our analysis]**):
  - Free: local, AGPL;
  - Cloud: $19, 1,900 credits, 2 members, 3 API keys, 2 concurrent agents, 7-day snapshots;
  - Pro: $99, 9,900 credits, 5 members, scoped and read-only keys, 30-day snapshots;
  - Business: $249, 24,900 credits, 25 members, SSO and a HIPAA BAA as add-ons, audit logs;
  - Enterprise: on-prem;
  - MSP: per-client workspaces.
  - The page says: "You pay for the work your memory does, never for seats." ([pricing](https://basicmemory.com/pricing)).

### 7. Strengths worth copying
- **A file grammar both humans and models can write.** `- [category] fact` plus `- relation [[Target]]`, opened unchanged in Obsidian. Being "just Markdown" removes the lock-in objection, and the README repeats this on every pitch ("No lock-in… Export to local Markdown any time").
- **The same engine for the free and paid paths,** shown in one comparison table (Cloud vs Local: setup time, cost, storage, mobile, air-gapped, "Your data stays yours"). This is the clearest open-source-plus-paid-convenience framing in the track ([README](https://github.com/basicmachines-co/basic-memory/blob/main/README.md#cloud-vs-local)).
- **MCP annotations plus `expected_checksum`.** Hosts prompt for destructive calls, and stale writes are refused rather than silently clobbering human edits.
- **`bm_man`.** Man pages are served over MCP so the agent reads the tool contract on demand ("progressive tool discovery").
- **A review queue for agent-made changes:** per-note diffs, keep or undo, shared across the workspace. This is a near-template for "agents propose, the person approves".
- **Distribution:**
  - the README sells cloud first, with UTM-tagged links;
  - beta pricing "locked in for life";
  - a coupon for open-source users;
  - first-party plugins for Hermes and OpenClaw in the main repo;
  - an MCP Toplist badge;
  - deep integration with Claude Code (hooks at session start and pre-compaction).
- **Honest telemetry section:** what is and is not collected, plus a one-line opt-out.

### 8. Weaknesses and complaints
- **No encryption locally, and no end-to-end encryption in the cloud.** The operator can read cloud notes. "We don't yet hold our own SOC 2 certification" ([security](https://basicmemory.com/security)).
- **Rename churn in 1.0:** legacy tools were removed (`write_note`, `read_note`, `search_notes`, and others), cloud bisync was removed, and the CLI was rebuilt ([v1.0.0](https://github.com/basicmachines-co/basic-memory/releases/tag/v1.0.0)). Integrations built on the old names broke.
- **Pricing confusion:** the README's single $15 plan contradicts the live $19/$99/$249 credit model.
- **Most-discussed issues are reliability and setup:**
  - per-project MCP config ([#220](https://github.com/basicmachines-co/basic-memory/issues/220));
  - "cannot write into note" ([#87](https://github.com/basicmachines-co/basic-memory/issues/87));
  - sync unique-constraint errors ([#169](https://github.com/basicmachines-co/basic-memory/issues/169));
  - CLI hangs ([#504](https://github.com/basicmachines-co/basic-memory/issues/504));
  - the long-open request for git-based undo ([#124](https://github.com/basicmachines-co/basic-memory/issues/124)).
- **No independent press or reviews found.** The Show HN post got 4 points and 0 comments ([HN 43374258](https://news.ycombinator.com/item?id=43374258)).
- **Bus factor:** one person wrote about 80% of the commits.

### 9. Threat level: **HIGH**
It is the closest match to our model: open source, plain-text files, MCP, a paid convenience cloud, and Hermes and OpenClaw plugins. It also has a two-year head start, teams, and hosted agents with review. Its gaps are exactly our differentiators:
- no encryption;
- no consent per agent, information type or destination;
- no receipts of what each model received;
- a cloud the operator can read.

If Basic Machines adds client-side encryption, it closes most of the gap.

### How it grew its community
- MCP directories and badges (MCP Toplist, mcpx).
- A launch post in r/modelcontextprotocol **[unverified; seen via search snippet only]**.
- A Discord linked in the repo description.
- Testimonials in the README.
- First-party plugins in host ecosystems (Claude Code marketplace, Hermes, OpenClaw, Codex).
- A coupon for open-source users that turns them into cloud customers.
- Hacker News played no part ([HN](https://news.ycombinator.com/item?id=43374258)).

---

## 2. Mem0 (and the archived OpenMemory)

### 1. What it is
"The Memory Layer for AI Agents": an SDK, a self-hosted server and a managed cloud that extract facts from conversations for developers building apps ([repo](https://github.com/mem0ai/mem0)).
- **Funding:** YC S24. $24M announced 28 Oct 2025: a $3.9M seed led by Kindred, and a $20M Series A led by Basis Set with Peak XV, GitHub Fund and YC ([TechCrunch](https://techcrunch.com/2025/10/28/mem0-raises-24m-from-yc-peak-xv-and-basis-set-to-build-the-memory-layer-for-ai-apps)).
- **License:** Apache-2.0.
- **Traction:** 69,412 stars and 8,256 forks (GitHub API). 2.41M PyPI downloads a month ([pypistats](https://pypistats.org/packages/mem0ai)) and 1.04M npm downloads a month ([npm](https://www.npmjs.com/package/mem0ai)). 6,834 Discord members ([invite](https://mem0.dev/DiG)).
- **Latest release:** v2.2.1, 25 Sep 2026 ([releases](https://github.com/mem0ai/mem0/releases)).

### 2. How it works
- **Write path:** an LLM pass extracts facts. In the April 2026 algorithm this is "single-pass ADD-only extraction… nothing is overwritten" ([README](https://github.com/mem0ai/mem0/blob/main/README.md)).
- **Storage:** facts go into a vector store, with optional entity linking. The self-hosted server is FastAPI + Postgres/pgvector + Neo4j ([PR #6530](https://github.com/mem0ai/mem0/pull/6530)).
- **Default models:** OpenAI `gpt-5-mini` and `text-embedding-3-small` ([README](https://github.com/mem0ai/mem0/blob/main/README.md)). By default, memories are sent to OpenAI.
- **Encryption:** no user-held encryption is documented. The pricing page has no encryption claims; it says "GDPR Ready" and points to a Trust Center ([pricing](https://mem0.ai/pricing)).

### 3. How agents connect
- **Interfaces:** Python and TypeScript SDKs, a CLI (`mem0 add/search`), the hosted platform API, and agent skills for Claude Code, Codex, Cursor, Windsurf, OpenCode and OpenClaw ([README](https://github.com/mem0ai/mem0/blob/main/README.md)).
- **Memory provider in Hermes:** Mem0 is one of the external memory providers ([Hermes docs](https://hermes-agent.nousresearch.com/docs/user-guide/features/memory-providers)).
- **Agent self-signup:** `mem0 init --agent` mints a working API key "in under five seconds — no email, no dashboard, no OTP". A human claims the account later with `mem0 init --email` ([README](https://github.com/mem0ai/mem0/blob/main/README.md)).
- **OpenMemory MCP tools** (before removal): `add_memories`, `search_memory`, `list_memories`, `delete_memories`, `delete_all_memories` ([mcp_server.py @540d23d](https://github.com/mem0ai/mem0/blob/540d23d610fcdc9a1f8795875c013af67d35ae93/openmemory/api/app/mcp_server.py)).

### 4. Consent and control
OpenMemory is the only Mem0 product that had a user-facing control model:
- **Per-app controls:** apps could be **paused** (`app.is_active`), and each app could have an **accessible set of memory IDs**.
- **Access log:** every MCP read, list or delete wrote a `MemoryAccessLog` row ([permissions.py @540d23d](https://github.com/mem0ai/mem0/blob/540d23d610fcdc9a1f8795875c013af67d35ae93/openmemory/api/app/utils/permissions.py)).
- **The hole:** the app identity came from the URL path, `/{client_name}/sse/{user_id}`, with no authentication **[our analysis of the same file]**. Any caller could claim any app name and any user.
- **A third-party review** reports that the compose file bound to all interfaces and that CORS allowed every origin with credentials ([greenlitbooks](https://greenlitbooks.com/field-notes/is-mem0-safe)) **[unverified beyond that source]**.
- **A public missing-auth report** ([#4236](https://github.com/mem0ai/mem0/issues/4236), Mar 2026) was withdrawn by its filer as "should have been filed through proper security disclosure channels".
- **Mem0 today:**
  - self-hosted auth is "on by default" ([README](https://github.com/mem0ai/mem0/blob/main/README.md));
  - the Custom plan adds SSO and audit logs ([pricing](https://mem0.ai/pricing));
  - there is no end-user consent or write approval;
  - GHSA-5324-3w58-qpp2 (medium, 20 Oct 2026) is a "cross-tenant conversation leak via unescaped delimiter collision in session-scope key" ([advisory](https://github.com/mem0ai/mem0/security/advisories/GHSA-5324-3w58-qpp2)).

### Why OpenMemory was archived
1. **Sunset announced** in [#4923 "OpenMemory Sunsetting"](https://github.com/mem0ai/mem0/issues/4923), opened 22 Apr 2026. The README carried a sunsetting banner.
2. **Bug reports closed without fixes.** In [#6078](https://github.com/mem0ai/mem0/issues/6078), the MCP server called mem0 with outdated signatures. A maintainer replied: "deprecated and is no longer maintained, so we won't be shipping a fix… and for not communicating the deprecation sooner."
3. **Removed from the monorepo** in [PR #6530](https://github.com/mem0ai/mem0/pull/6530), merged 29 Jul 2026.
   - Stated reason: "no active maintenance path, while still pulling in triage, labeling, and lint surface."
   - The supported replacement is `server/` (FastAPI + Postgres/pgvector + Neo4j, `make bootstrap`), which now has a local dashboard ([#4923 comment](https://github.com/mem0ai/mem0/issues/4923)).
   - The code is preserved read-only at `mem0ai/openmemory` under `openmemory-archive/` ([openmemory PR #5](https://github.com/mem0ai/openmemory/pull/5)).
   - That repo name now hosts an unrelated CLI for porting sessions between Claude Code, Codex and OpenCode ([mem0ai/openmemory](https://github.com/mem0ai/openmemory)).
4. **Our reading:** a consumer-style local product with a UI and its own security surface did not fit a developer-infrastructure company's roadmap, and it had open auth problems. **[our analysis]**

### 5. Onboarding and UX
- **Developer-first.** The README offers three paths in a table: Library ("Just testing?"), Self-hosted ("Building for a team?") and Cloud ("Want zero ops?").
- **Self-hosted** is `cd server && make bootstrap` ([README](https://github.com/mem0ai/mem0/blob/main/README.md)).
- **Nothing for non-technical people** now that OpenMemory is gone.

### 6. Business model
- **Free:** unlimited end users. In the first 30 days, 10k adds and 1k retrievals per month with model calls included. With your own LLM key, 50k adds and 10k retrievals.
- **Custom (contact sales):** graph memory, user profiles, "Dream" consolidation, SSO, audit logs, on-prem.
- **Open-source gating:** benchmark numbers are for the managed platform, "which includes proprietary optimizations not available in the open-source SDK" ([pricing](https://mem0.ai/pricing), [README](https://github.com/mem0ai/mem0/blob/main/README.md)).

### 7. Strengths worth copying
- **Agent self-signup with later human claim:** zero-friction distribution through agents themselves.
- **OpenMemory's per-app pause and access log:** the right shape of control (now abandoned).
- **Published, reproducible benchmark harness** ([memory-benchmarks](https://github.com/mem0ai/memory-benchmarks)).
- **Skills that wire Mem0 into a repo** (`/mem0-integrate`): installs by asking the user's own coding agent.

### 8. Weaknesses and complaints
- **Junk memories.** "What we found after auditing 10,134 mem0 entries: 97.8% were junk" ([#4573](https://github.com/mem0ai/mem0/issues/4573)): hallucinated facts and feedback loops (668 copies of one hallucination).
- **Privacy defaults:** an OpenAI default, telemetry on by default, and plugin telemetry linked to account email ([greenlitbooks](https://greenlitbooks.com/field-notes/is-mem0-safe)) **[unverified beyond that source]**.
- **Abandoned users** on OpenMemory, as described above.
- **Withheld features:** the managed platform holds back features from the open-source version.

### 9. Threat level: **MEDIUM**
Mem0 is developer infrastructure for app builders, not a user-owned vault. Even so, its distribution is enormous and it has $24M, so a consumer or "my memory" product could appear. Today it validates the anti-pattern we position against: memory held by the operator, sent to OpenAI by default, with consent and controls discontinued.

### How it grew its community
- YC.
- Benchmark marketing (LoCoMo and LongMemEval claims in the README header).
- A Trendshift badge.
- Integrations with every framework.
- A Discord.
- Being listed as a Hermes provider.
- Agent skills.
- Very high SDK download counts, driven by framework integrations.

---

## 3. Supermemory

### 1. What it is
A "memory and context engine": a hosted API with user profiles, hybrid RAG plus memory, and connectors, plus MCP and plugins for coding agents ([repo](https://github.com/supermemoryai/supermemory)).
- **License:** MIT (repo, MCP and plugins). The SDKs are Apache-2.0. The memory engine and server are closed source ([pricing](https://supermemory.ai/pricing), [local vs enterprise](https://supermemory.ai/docs/self-hosting/local-vs-enterprise)).
- **Funding:** seed announced Oct 2025. TechCrunch reports $2.6M led by Susa, Browder and SF1.vc, with angels including Jeff Dean and Dane Knecht ([TechCrunch](https://techcrunch.com/2025/10/06/a-19-year-old-nabs-backing-from-google-execs-for-his-ai-memory-startup-supermemory/)). The company's own blog says $3M ([blog](https://supermemory.ai/blog/supermemory-raises-3-million-and-building-the-best-memory-engine-for-llms)).
- **Traction:** 31,703 stars (GitHub API) and 867k npm downloads a month ([npm](https://www.npmjs.com/package/supermemory)).
- **Founder:** Dhravya Shah ([TechCrunch](https://techcrunch.com/2025/10/06/a-19-year-old-nabs-backing-from-google-execs-for-his-ai-memory-startup-supermemory/)).

### 2. How it works
- **Processing:** cloud extraction of facts, user profiles split into `static` and `dynamic`, "automatic forgetting", and connectors (Drive, Gmail, Notion, OneDrive, GitHub).
- **Scoping:** memory is scoped by `containerTag` ([README](https://github.com/supermemoryai/supermemory/blob/main/README.md)).
- **Local mode:** a closed prebuilt binary (`curl … | bash`, or Docker) storing everything in `~/.supermemory`. It is free up to 10,000 stored documents, and URL ingestion uses a hosted reader (Firecrawl) ([README](https://github.com/supermemoryai/supermemory/blob/main/README.md), [local vs enterprise](https://supermemory.ai/docs/self-hosting/local-vs-enterprise)).
- **Encryption:** TLS and "AES-256-class" at rest in the managed cloud. Nothing on end-to-end encryption or who holds keys. Content is "never used to train models" ([security](https://supermemory.ai/docs/overview/security.md)).
- **Deletion:** by namespace (`DELETE /ns/{namespace}`). Disconnecting a connector deletes the documents it imported by default ([security](https://supermemory.ai/docs/overview/security.md)).

### 3. How agents connect
- **Hosted MCP** at `https://mcp.supermemory.ai/mcp` with three tools: `memory` (save or forget), `recall`, and `context` (injects the profile) ([README](https://github.com/supermemoryai/supermemory/blob/main/README.md#mcp)).
- **Open-source plugins** for Claude Code, Cursor, Codex, OpenCode, OpenClaw and Muse Code, plus a Hermes provider.
- **Framework wrappers:** Vercel AI SDK, Mastra, LangChain and others.

### 4. Consent and control
- **No consent model for end users.**
- **API-level controls:** scoped API keys for one namespace, and per-tag access on Scale ([pricing](https://supermemory.ai/pricing), [security](https://supermemory.ai/docs/overview/security.md)).
- **Unmet community request:** a "memory governance layer — PII redaction, context poisoning defense, and audit trail" ([#1348](https://github.com/supermemoryai/supermemory/issues/1348)).

### 5. Onboarding and UX
- **The README splits three ways:** "I use AI tools", "I'm building AI products", and "I want to run it myself".
- **The consumer path is gone.** The consumer app (later "Nova") and the Slack "company brain" shut down on 9 Sep 2026, and everyone charged was refunded ([blog](https://supermemory.ai/blog/an-update-to-supermemory/)).
  - The stated reason was a conflict of interest with developers building on the engine.
  - The company brain was then open-sourced ([blog](https://supermemory.ai/blog/open-sourcing-company-brain/)).
  - Consumer memories moved to the developer console.

### 6. Business model
Usage credits:
- Free: $0, with $5 of credits a month;
- Pro: $19, $20 of credits;
- Max: $100, $130 of credits;
- Scale: $399, $600 of credits, plus self-host, SOC 2 and a HIPAA BAA;
- Enterprise: air-gapped deployment.

Example rates: memory at $0.005 per 1K tokens, search at $0.005 per 1K queries ([pricing](https://supermemory.ai/pricing)). Compliance claims are stated inconsistently across tiers on the same page ([pricing](https://supermemory.ai/pricing)).

### 7. Strengths worth copying
- **A profile call** returning `static` and `dynamic` profiles in about 50ms, injected at session start (`/context`). This is a cheap "who am I" brief.
- **A README that routes three audiences** to three different paths.
- **Honest shutdown communication** with refunds and a migration path.

### 8. Weaknesses and complaints
- **The engine is closed** despite the "open source" positioning. The local binary is capped at 10k documents.
- **No end-to-end encryption.**
- **The consumer product was abandoned.**
- **Self-hosting trouble:** the most-commented issue is "It's not working locally" ([#506](https://github.com/supermemoryai/supermemory/issues/506)).

### 9. Threat level: **LOW to MEDIUM**
Supermemory has explicitly retreated from consumer products to developer infrastructure ([blog](https://supermemory.ai/blog/an-update-to-supermemory/)). It could be a backend some people choose, but it is not user-owned and not encrypted.

### How it grew its community
- Founder-led virality on X (the "19-year-old" press angle).
- Viral consumer launches: the Chrome extension era, and the company brain's "500k+ impressions" ([X post via search](https://x.com/hnshah/status/2098492271427731783)) **[unverified]**.
- Benchmark leaderboard claims.
- Open-source plugins for every agent.

---

## 4. Honcho (Plastic Labs)

### 1. What it is
"Memory infrastructure for building stateful agents that understand changing people, agents, groups…". It is reasoning-first: it derives conclusions about "peers" in the background ([repo](https://github.com/plastic-labs/honcho)).
- **License:** AGPL-3.0.
- **Funding:** $5.35M pre-seed, Apr 2025, led by Variant, White Star and Betaworks, with Mozilla Ventures participating ([ChainCatcher](https://chaincatcher.com/en/article/2176681)). PitchBook lists a $13.3M seed in Jun 2026 ([PitchBook](https://pitchbook.com/profiles/company/538990-48)) **[unverified]**.
- **Traction:** 8,255 stars and 1,005 forks (GitHub API). 276k PyPI downloads a month ([pypistats](https://pypistats.org/packages/honcho-ai)). Likely inflated by being bundled as a Hermes provider **[unverified]**. 137k npm downloads a month for the SDK. 1,245 Discord members ([invite](https://discord.gg/honcho)).
- **Latest release:** server v3.6.2, 23 Nov 2026 ([releases](https://github.com/plastic-labs/honcho/releases)).

### 2. How it works
- **Data model:** workspaces hold peers, peers participate in sessions, and messages live on sessions.
- **Processing:** a background "deriver" and "dreaming" process builds a per-peer representation and a "peer card".
- **Stack:** FastAPI + Postgres/pgvector, with Redis optional ([README](https://github.com/plastic-labs/honcho/blob/main/README.md)).
- **LLM required:** the deriver needs an LLM key.
- **No encryption claims.** The site says only "It's your data" ([honcho.dev](https://honcho.dev)).

### 3. How agents connect
- **MCP tools** ([mcp/instructions.md](https://github.com/plastic-labs/honcho/blob/main/mcp/instructions.md)):
  - recall: `chat`, `workspace_chat`, `search`, `get_representation`, `get_peer_context`, `list_conclusions`;
  - memory store: `create_session`, `create_peer`, `add_peers_to_session`, `add_messages_to_session`;
  - workspaces: `list_workspaces`, `create_workspace` ([MCP guide](https://honcho.dev/docs/v3/guides/integrations/mcp)).
- **Plugins:** Claude Code, Codex, Cursor and Grok Bot (OAuth), OpenCode, Kilo, Pi, DeepSeek Harness and OpenClaw. Hermes uses `hermes memory setup` and picks Honcho. A single `honcho install` wires all detected agents ([README](https://github.com/plastic-labs/honcho/blob/main/README.md)).
- **OpenClaw import:** setup "optionally migrates legacy `MEMORY.md` / `USER.md` / `IDENTITY.md` files into Honcho (non-destructive — originals are never deleted)" ([README](https://github.com/plastic-labs/honcho/blob/main/README.md)).

### 4. Consent and control
- **Recall mode by default.** The MCP instructions tell the model: "If the user hasn't asked for this conversation to be recorded, stay in recall mode" ([instructions.md](https://github.com/plastic-labs/honcho/blob/main/mcp/instructions.md)).
- **Perspective flags:** `observe_me` and `observe_others` per peer per session, controlling who Honcho models.
- **Otherwise there are no user-facing permissions:** a Bearer API key, and `AUTH_USE_AUTH=false` when self-hosted ([MCP guide](https://honcho.dev/docs/v3/guides/integrations/mcp)).

### 5. Onboarding and UX
- **Hosted:** get a key at app.honcho.dev, then run `honcho init`, which writes the key once to `~/.honcho/config.json` for every integration.
- **Local:** `honcho start --setup` brings up Docker, Postgres and the deriver ([README](https://github.com/plastic-labs/honcho/blob/main/README.md)).
- **Developer-oriented throughout.**

### 6. Business model
- Ingestion: $2.00 per 1M tokens.
- `context()` reads: free and unlimited.
- Reasoning queries: $0.001 to $0.50 per query, by tier.
- Credits: $5 free, plus $5 a month with a card.
- Startup and enterprise programs ([honcho.dev](https://honcho.dev)).

### 7. Strengths worth copying
- **Recall-only unless recording was requested.** This is the right default sentence to put in the MCP server instructions.
- **Non-destructive import** of OpenClaw workspace files ("originals are never deleted").
- **Free reads, metered writes.** Pricing that does not penalise recall.
- **One `honcho install`** that detects and wires every agent.

### 8. Weaknesses and complaints
- **Self-hosted produced nothing:** "Self-hosted/local Honcho ingests messages but derived memory does not appear" ([#494](https://github.com/plastic-labs/honcho/issues/494)).
- **Hard-coded model:** calls to `gpt-5.4-mini` persisted ([#1180](https://github.com/plastic-labs/honcho/issues/1180)).
- **Near-duplicate observations** accumulate ([#729](https://github.com/plastic-labs/honcho/issues/729)).
- **Peer card silently truncates** ([#1143](https://github.com/plastic-labs/honcho/issues/1143)).
- **Repeated Hermes migration imports** ([#1278](https://github.com/plastic-labs/honcho/issues/1278)).
- **Opaque derived memory:** a person cannot easily read or edit what Honcho "concluded" about them as files.

### 9. Threat level: **MEDIUM**
Honcho is strongly embedded in Hermes and agent harnesses, and AGPL like us, but it is a hosted reasoning service with no encryption and no user consent surface. It competes for the "memory provider" slot in Hermes and OpenClaw.

### How it grew its community
- Crypto- and AI-native VCs (Variant).
- Benchmark posts.
- Being a Hermes memory provider.
- Shipping a plugin for every new agent harness quickly (DeepSeek Harness, Grok Bot, Kilo, Pi).

---

## 5. Compartment

### 1. What it is
"Encrypted, fully offline memory for AI agents". One passphrase-encrypted vault file shared by every local MCP agent (Claude Code and Desktop, Hermes, OpenClaw, Codex, Cursor and others), with "No API key, no account, no network, no telemetry" ([README](https://github.com/MaxFreedomPollard/Compartment/blob/main/README.md)).
- **License:** Apache-2.0.
- **Stage:** repo created 20 Jul 2026, with 30 releases already. The latest is v4.14.0, 7 Nov 2026 ([releases](https://github.com/MaxFreedomPollard/Compartment/releases)).
- **Funding:** none found.
- **Traction:** 472 stars and 8 forks (GitHub API). 710 PyPI downloads a month ([pypistats](https://pypistats.org/packages/compartment)). 2 issues ever filed.
- **Team:** a single maintainer with 301 of 303 human commits ([contributors](https://github.com/MaxFreedomPollard/Compartment/graphs/contributors)).

### 2. How it works
- **Vault file:** one file, `~/.compartment/memory.vault` ([FORMAT.md](https://github.com/MaxFreedomPollard/Compartment/blob/main/FORMAT.md)):
  - magic `NUCV`;
  - a plaintext header containing only public parameters (vault_id, keyslots, model hash);
  - an AEAD-sealed payload, which is a serialized SQLite image holding records, the FTS5 index, the audit chain and meta;
  - an append-only, fsync'd, encrypted journal, with AAD binding each entry to its sequence number.
- **The index lives in RAM only.** The embedding vectors are encrypted too, "because vectors can be inverted back to text" ([SECURITY.md](https://github.com/MaxFreedomPollard/Compartment/blob/main/SECURITY.md)).
- **Encryption and key handling** ([SECURITY.md](https://github.com/MaxFreedomPollard/Compartment/blob/main/SECURITY.md), [FORMAT.md](https://github.com/MaxFreedomPollard/Compartment/blob/main/FORMAT.md)):
  - XChaCha20-Poly1305 via libsodium.
  - Argon2id with t=3, m=64MiB, p=4. A reader refuses out-of-range KDF parameters before deriving anything.
  - LUKS-style keyslots: a random 256-bit master key wrapped once per slot.
  - **A key per record**, wrapped by the master key, so `forget --shred` destroys the key and the content becomes unrecoverable.
  - AAD binds every ciphertext to its role and vault, so ciphertexts "cannot be transplanted between contexts".
  - Ed25519 signatures for vault manifests (`lock --sign`) and memory packs. A pack is checked against a *trusted* key, never against the key it carries.
  - **Second factor:** `2fa enable` derives the slot key from Argon2id(passphrase ‖ keyfile), so the keyfile is enforced cryptographically, not by a prompt. The project explicitly rejects TOTP as "theater" for an offline file.
- **Unlock model** ([SECURITY.md](https://github.com/MaxFreedomPollard/Compartment/blob/main/SECURITY.md#unlock-paths-ranked)):
  - The default is a boot-session credential: the master key wrapped under HMAC-SHA256 with a random per-boot secret held in a volatile kernel object (POSIX shared memory, or a volatile registry key on Windows) that is never written to disk. A reboot relocks the vault, and a stolen credential file is useless.
  - The macOS Keychain is an explicit opt-in and survives reboots.
  - An environment variable is for scripts and CI.
  - The `memory_unlock` MCP tool is **disabled by default**, "because enabling it puts the passphrase in the model's context".
  - Auto-lock after 30 idle minutes is the default (15/30/60/never). `memory_lock` is a "panic" tool any agent can call.
- **Recovery:** none by design. "Compartment never generates a password, seed or recovery phrase". Losing the passphrase means permanent loss. Vaults from before 1.8 had a 16-word recovery keyslot, which was later dropped ([SECURITY.md](https://github.com/MaxFreedomPollard/Compartment/blob/main/SECURITY.md)).
- **Sync:** none. To move machines, lock, copy the file and unlock ([README](https://github.com/MaxFreedomPollard/Compartment/blob/main/README.md)).
- **Export:** `export --plaintext` writes JSONL.
- **Data model:** each memory is one claim of 200 characters or fewer; longer text is rejected with an error saying how to split it.
  - `source` is required, and `discovered` and `expires` dates are recorded.
  - `kind` is `fact` (facts accumulate) or `opinion` (a new opinion supersedes the old one, which is kept in the audit trail).
  - Relations are stored as triples with validity windows.
  - Importance tiers are fixed. The README documents the retrieval mathematics in full ([README](https://github.com/MaxFreedomPollard/Compartment/blob/main/README.md#the-memory-logic)).
- **No LLM inside.** A bundled 384-dimension int8 ONNX embedder runs in one shared per-machine daemon on a Unix socket. The daemon checks the peer's UID and never holds a key ([SECURITY.md](https://github.com/MaxFreedomPollard/Compartment/blob/main/SECURITY.md#the-shared-embedding-process)).

### 3. How agents connect
- **MCP over stdio,** with 13 tools: `memory_search`, `memory_store`, `memory_store_many`, `memory_get`, `memory_recent`, `memory_forget`, `memory_link`, `memory_relations`, `memory_unlink`, `memory_list_namespaces`, `memory_status`, `memory_lock`, `memory_selftest`. Seven are annotated read-only ([README](https://github.com/MaxFreedomPollard/Compartment/blob/main/README.md#mcp-tools)).
- **One-command wiring:** `compartment integrate <agent>` wires Claude, Hermes (as a native memory provider), OpenClaw, AntiGravity and Codex. `--list` covers 34 MCP clients.
  - Each config write takes "a byte-exact backup first, merges rather than replaces, writes atomically, and refuses to touch a file it cannot parse".
- **Capture without the model:** a Claude Code `PostToolUse` hook copies the memory files Claude Code writes into the vault, "whether or not the model calls the tool".
- **`/compartmentalize` skill:** the user-invoked "save this whole conversation" command.
- **Importers:** `import-claude`, and plaintext JSONL import.

### 4. Consent and control
- **Per-caller namespace grants** (`rw`, `ro`, `none`) in `<vault>.config.json`. `packs/*` namespaces are always read-only ([acl.py](https://github.com/MaxFreedomPollard/Compartment/blob/main/src/compartment/acl.py)).
  - **The default grants every caller `rw` on everything** (`"*": {"grants": {"*": "rw"}}`) ([acl.py](https://github.com/MaxFreedomPollard/Compartment/blob/main/src/compartment/acl.py)).
  - Caller identity is "declarative": "A host that lies about its name gets that name's grants" ([SECURITY.md](https://github.com/MaxFreedomPollard/Compartment/blob/main/SECURITY.md)).
- **Hash-chained audit log** of `{prev, ts, caller, op, detail}`. It covers stores, forgets and searches; search entries are held in RAM until the next save. The head and length are anchored in meta, so truncating the tail is detected. `compartment audit verify` checks it ([audit.py](https://github.com/MaxFreedomPollard/Compartment/blob/main/src/compartment/audit.py), [SECURITY.md](https://github.com/MaxFreedomPollard/Compartment/blob/main/SECURITY.md)).
- **No approval before writes** and no consent per destination model.
- **Prompt-injection mitigations:** recalled memories are wrapped "as stored data", and `quarantined` adds a warning on every recall ([README](https://github.com/MaxFreedomPollard/Compartment/blob/main/README.md)).

### 5. Onboarding and UX
- **On macOS:** the `.pkg` asks for a passphrase, creates the vault and puts an item in the menu bar with **Connect an agent** buttons.
- **On Windows and Linux:** a tray icon or a window. Linux gets a window "on purpose: a tray icon may never appear on GNOME or Wayland, and the control that unlocks your memories must not fail silently."
- **The panel shows:** lock state, memory count, three settings, connected agents and the last five memories.
- **Dashboard:** a read-only page on 127.0.0.1 with a one-time token, showing a growth chart and the relation graph ([README](https://github.com/MaxFreedomPollard/Compartment/blob/main/README.md#the-app-and-the-dashboard)).
- **Time to value:** "Restart your agent and it has a memory."
- **Starter content:** a new vault comes seeded with about 6,700 reference facts, hidden by a switch.

### 6. Business model
None: free, Apache-2.0, with no paid tier.

### 7. Strengths worth copying
- **LUKS-style keyslots plus per-record keys.** This gives cheap crypto-shred deletion, adding a second factor without re-encrypting, and rekeying.
- **Vectors encrypted at rest, and no plaintext index on disk.**
- **Boot-bound unlock credential:** convenient until reboot, then really locked. Auto-lock is on by default.
- **No unlock tool by default.** A credential never enters model context.
- **Tamper-evident audit chain anchored against truncation,** including reads. This is a basis for receipts.
- **A byte-level, language-agnostic format spec** (FORMAT.md), so third parties can build readers. This is a credible "never locked in" claim.
- **Required `source` and `discovered` on every memory, plus `expires` and fact-versus-opinion semantics.** These are excellent provenance primitives.
- **Integrator hygiene:** backup, merge, atomic write, and refusing to touch unparseable configs, across 34 clients.
- **An honest threat model,** including a "What Compartment CANNOT protect against" section ([SECURITY.md](https://github.com/MaxFreedomPollard/Compartment/blob/main/SECURITY.md)).

### 8. Weaknesses and complaints
- **No sync and no recovery.** Losing the passphrase destroys the vault; that is fine for experts and hostile to ordinary people.
- **Single maintainer, very fast churn** (v4.14 within four months).
- **Opaque storage:** a SQLite blob, not plain-text files, so it is not compatible with OpenClaw or Hermes workspace files and cannot be edited in a text editor.
- **Weak default trust:** every caller gets `rw` everywhere, and identity is declarative.
- **Grandiose security copy:** "I can honestly say Compartment has the best security of any vector memory" ([SECURITY.md](https://github.com/MaxFreedomPollard/Compartment/blob/main/SECURITY.md)).
- **Python cannot reliably zeroise keys,** which the project admits.
- **Low adoption:** 710 downloads a month and 2 issues filed, despite 472 stars.

### 9. Threat level: **MEDIUM**
On encryption and local-first design it is ahead of everyone else and close to our values, and it already wires Hermes and OpenClaw. Against us it lacks:
- sync and recovery;
- plain-text files;
- a consent model per destination;
- receipts in the person's language;
- any business to fund convenience.

The risk is mindshare among privacy-minded developers.

### How it grew its community
Almost entirely through **registry and directory saturation**:
- the official MCP registry, Cursor Directory, Glama, LobeHub, MCP Toplist, MCP Market, mcpservers.org, TensorBlock, toolsdk and several awesome-lists;
- install deep-links for Cursor, VS Code, LM Studio, Goose and Kiro;
- presence in plugin stores: a Claude Desktop `.mcpb`, the Claude Code and Codex marketplaces, Gemini CLI extensions, and Hermes plugins ([README](https://github.com/MaxFreedomPollard/Compartment/blob/main/README.md#where-to-find-it), [docs/PLUGINS.md](https://github.com/MaxFreedomPollard/Compartment/blob/main/docs/PLUGINS.md)).
- **Sourced comparison table:** it maintains a dated comparison against competitors and invites corrections by PR ([docs/COMPARISON.md](https://github.com/MaxFreedomPollard/Compartment/blob/main/docs/COMPARISON.md)).

---

## 6. TotalReclaw

### 1. What it is
"End-to-end encrypted memory + knowledge graph for AI agents — portable, yours forever." Encryption happens on the device. A blind relay stores ciphertext, which is anchored on Gnosis Chain and indexed by The Graph ([README](https://github.com/graphprotocol/totalreclaw/blob/main/README.md)).
- **Status:** "private beta — free tier open, no credit card, no waitlist." v1 shipped in Apr 2026.
- **License:** MIT, except the self-hosted server, which is AGPL-3.0.
- **Backing:** hosted in the `graphprotocol` GitHub org ([repo](https://github.com/graphprotocol/totalreclaw)). Who funds or operates it is not stated on the pricing page **[unverified]**.
- **Team:** effectively one developer, `p-diogo`, with 1,095 commits (GitHub API).
- **Traction:**
  - 0 stars on GitHub (GitHub API); the repo was created 23 Feb 2026 and is very active (last commit 24 Nov 2026);
  - `@totalreclaw/mcp-server`: 3,305 npm downloads a month; the OpenClaw plugin: 949 ([npm](https://www.npmjs.com/package/@totalreclaw/mcp-server));
  - PyPI: 1,909 a month ([pypistats](https://pypistats.org/packages/totalreclaw)).

### 2. How it works
- **Key derivation** ([architecture.md](https://github.com/graphprotocol/totalreclaw/blob/main/docs/architecture.md)):
  - The root is a 12-word BIP-39 phrase, run through PBKDF2 (2048 rounds) to a seed. For arbitrary passwords, Argon2id (t=3, m=64MB, p=4) is used instead.
  - HKDF-SHA256 expands the seed into an `authKey` (the server sees only its SHA-256), an `encryptionKey` and a `dedupKey` (used for HMAC fingerprints).
  - The same mnemonic derives an ERC-4337 smart-account address (`m/44'/60'/0'/0/0`).
- **Encryption:** each memory is sealed with XChaCha20-Poly1305 as `nonce‖tag‖ciphertext`. Embeddings are encrypted too ([subgraph schema](https://github.com/graphprotocol/totalreclaw/blob/main/subgraph/schema.graphql)).
- **Search over encrypted data** ([architecture.md](https://github.com/graphprotocol/totalreclaw/blob/main/docs/architecture.md)):
  - The client embeds locally (Harrier-OSS 270M, 640 dimensions, ONNX) and computes 20 LSH tables of 32 bits, with hyperplanes seeded from the user's key. The bucket IDs are then SHA-256 hashed.
  - The server matches "trapdoors" with a Postgres GIN array overlap and returns 400 to 3,000 candidates.
  - The client decrypts and reranks them with BM25, cosine, decay and importance, fused by RRF.
- **Storage:** an `EventfulDataEdge` contract on Gnosis emits `Log(msg.data)`, at about 5,300 gas per 256-byte fact. Writes are gas-sponsored by a Paymaster, and the subgraph indexes them.
  - **Recovery = phrase + subgraph. "No server required."**
- **Self-host:** the same client crypto against your own Postgres ([README](https://github.com/graphprotocol/totalreclaw/blob/main/README.md#self-hosting)).
- **Recovery ladder for the browser vault** ([phrase-escrow.md](https://github.com/graphprotocol/totalreclaw/blob/main/docs/guides/phrase-escrow.md)):
  1. local passkey unlock;
  2. the phrase encrypted under your passkey and stored with TotalReclaw;
  3. an encrypted backup file (2b);
  4. the written 12 words.
- **Escrow caveats** are stated plainly: anyone who gets into the account that syncs your passkey can recover your phrase, and "Our servers are not a second lock". Don't save the backup file in the same cloud account that syncs the passkey.
- **Leakage [our analysis, from code]:**
  - Word-token blind indices are **unkeyed SHA-256** of lowercased tokens ([crypto-modules.md](https://github.com/graphprotocol/totalreclaw/blob/main/docs/specs/totalreclaw/crypto-modules.md), [blind.rs](https://github.com/graphprotocol/totalreclaw/blob/main/rust/totalreclaw-core/src/blind.rs)).
  - They are stored as public, immutable `BlindIndex` entities tied to the owner's address in the subgraph ([schema](https://github.com/graphprotocol/totalreclaw/blob/main/subgraph/schema.graphql)).
  - **Consequence:** anyone can run a dictionary attack against the public chain and learn which words appear in each account's memories. Timing, volume and fingerprints are also public and permanent.
  - **Deletion:** ciphertext on chain cannot be deleted. Facts carry `decayScore`/`isActive`, and the managed service has "no batch delete" ([feature-comparison.md](https://github.com/graphprotocol/totalreclaw/blob/main/docs/guides/feature-comparison.md)).
  - **Harvest-now-decrypt-later:** the risk is permanent.

### 3. How agents connect
- **Clients:**
  - OpenClaw plugin, fully automatic through lifecycle hooks;
  - MCP server for Claude Desktop, Claude Code, Cursor and Windsurf (tools only);
  - Codex plugin;
  - NanoClaw skill;
  - Python client plus a Hermes plugin (automatic through pre/post LLM hooks);
  - Rust crate for ZeroClaw;
  - IronClaw, paused ([README](https://github.com/graphprotocol/totalreclaw/blob/main/README.md), [feature-comparison.md](https://github.com/graphprotocol/totalreclaw/blob/main/docs/guides/feature-comparison.md)).
- **Tools:** remember, recall, forget, export, status, pair (account setup), pin, unpin, retype, set_scope, import_from, upgrade, debrief, and consolidate (self-hosted only) ([mcp/src/tools](https://github.com/graphprotocol/totalreclaw/tree/main/mcp/src/tools)).
- **Importers:** ChatGPT (memories or conversations.json), Claude, Gemini (Takeout), Mem0, and MCP Memory Server JSONL. Imports are Pro-only after one free lifetime import ([README](https://github.com/graphprotocol/totalreclaw/blob/main/README.md#import-from-other-ai-tools)).
- **Chat-driven install:** paste "Install TotalReclaw. See https://totalreclaw.xyz/install" into any agent.

### 4. Consent and control
- **Memory taxonomy:** six speech-act types (claim, preference, directive, commitment, episode, summary), each with three axes: `source` (user, user-inferred, assistant, external, derived), `scope` (work, personal, health, family, creative, finance, misc), and `volatility`. Reranking is source-weighted, so user statements outrank assistant "regurgitation" ([README](https://github.com/graphprotocol/totalreclaw/blob/main/README.md)).
- **No per-agent or per-destination consent.** All agents sharing the phrase see everything.
- **Sensitive-data filter on the client** before encryption ([sensitive-data-filter.md](https://github.com/graphprotocol/totalreclaw/blob/main/docs/guides/sensitive-data-filter.md)):
  - It catches API keys, tokens, passwords, private keys, BIP-39 phrases (with checksum), cards (Luhn), IBANs, and many national IDs (with check digits).
  - Automatic captures that match are dropped. Explicit "remember" requests with a clear match are refused with fixed copy and need `allow_sensitive: true` to override.
  - It is "wired into Hermes only so far".
- **Phrase handling improved over time:**
  - The README still tells users to `export TOTALRECLAW_RECOVERY_PHRASE=…`.
  - The MCP setup wizard "prints your recovery phrase" and must be run outside the agent ([feature-comparison.md](https://github.com/graphprotocol/totalreclaw/blob/main/docs/guides/feature-comparison.md)).
  - The newer `totalreclaw_pair` flow gives a link and PIN. The phrase is created or entered in the browser and "never goes into chat, a config file, an env var or a tool argument" ([PR #725](https://github.com/graphprotocol/totalreclaw/pull/725), merged 12 Nov 2026).

### 5. Onboarding and UX
- **Claude Desktop flow:**
  1. edit the config;
  2. quit and reopen;
  3. say "Set up TotalReclaw";
  4. open the link and enter the PIN;
  5. "You're all set";
  6. quit and reopen again ([PR #725](https://github.com/graphprotocol/totalreclaw/pull/725)).
- **Web vault:** app.totalreclaw.xyz decrypts in the browser and unlocks with a passkey ([README](https://github.com/graphprotocol/totalreclaw/blob/main/README.md#your-vault-in-the-browser)).
- **Upgrade inside the agent:** upgrading is a tool call (`totalreclaw_upgrade`) ([pricing](https://totalreclaw.xyz/pricing)).

### 6. Business model
- **Free:** 250 memories a month, stored permanently on Gnosis mainnet, no card.
- **Pro:** $3.99 a month for 1,500 memories a month, LLM-guided dedup, and a custom extraction interval, paid by card through Stripe ([pricing](https://totalreclaw.xyz/pricing)).
- **Source conflict:** the README says Pro is 3,000 memories a month ([README](https://github.com/graphprotocol/totalreclaw/blob/main/README.md#pricing)).
- **Planned premium tier:** an internal spec suggests a TEE-based "Enterprise" tier ([tee/architecture.md](https://github.com/graphprotocol/totalreclaw/blob/main/docs/specs/tee/architecture.md)).

### 7. Strengths worth copying
- **Pairing via link and PIN,** so the secret never touches chat, config, environment variables or tool arguments.
- **A recovery ladder with honest copy** about what each rung protects against. This is the best recovery UX in the track.
- **The sensitive-data filter:** checksum-validated detectors, plus exact user-facing copy ("Not saved: this looks like it contains a payment card number…") and an explicit override.
- **Provenance and scope axes** (`source`, `scope` including health, finance and family, `volatility`). These are the natural keys for consent per type of information.
- **One phrase works across every agent.** Portable identity across OpenClaw, Hermes, Claude and others.
- **Upgrade and import through the agent itself.**

### 8. Weaknesses and complaints
- **Public, permanent, partially linkable leakage** (unkeyed word hashes on chain), and deletion is impossible **[our analysis]**.
- **Blockchain dependency** alienates mainstream users and organisations, and makes deletion requests effectively impossible to honour **[our analysis]**.
- **Inconsistent phrase handling across clients:** the environment variable is still in the README.
- **The PII filter is not on most clients.**
- **A third-party scan** rated the OpenClaw plugin "High Risk 6.5/10", mostly on heuristics: large file count and executable handlers ([Clawkeeper](https://clawkeeper.dev/skills/totalreclaw)).
- **Single developer.**
- **Pricing inconsistency** between the README and the pricing page.

### 9. Threat level: **MEDIUM**
It is the only project in the track with real end-to-end encryption, cross-agent identity and a recovery story, at a very low price. However, the chain-anchored design, its leakage and the absence of consent controls limit its appeal to ordinary people and organisations. It is a strong source of ideas.

### How it grew its community
- Plugin presence in the "Claw" ecosystem (OpenClaw, NanoClaw, ZeroClaw, IronClaw).
- Skill directories ([skills.lc](https://skills.lc/p-diogo/totalreclaw/p-diogo-totalreclaw-skill-skill-md)).
- The chat-driven install line.
- An open beta with a free tier and no waitlist.
- No visible social community: 0 stars on GitHub (GitHub API) and no Discord.

---

## Copy list: the 10 most valuable things to copy

1. **LUKS-style keyslots plus per-record keys,** for rekeying, a keyfile second factor and crypto-shred deletion. Compartment ([SECURITY.md](https://github.com/MaxFreedomPollard/Compartment/blob/main/SECURITY.md), [FORMAT.md](https://github.com/MaxFreedomPollard/Compartment/blob/main/FORMAT.md)).
2. **Boot-bound unlock, auto-lock by default, and no unlock tool exposed to agents,** so the passphrase never enters model context. Compartment ([SECURITY.md](https://github.com/MaxFreedomPollard/Compartment/blob/main/SECURITY.md#unlock-paths-ranked)).
3. **Pair agents with a link and PIN,** so the secret never appears in chat, config, environment variables or tool arguments. TotalReclaw ([PR #725](https://github.com/graphprotocol/totalreclaw/pull/725)).
4. **A recovery ladder** (passkey, passkey-sealed escrow, offline encrypted file, phrase) with plain caveats about where not to keep the backup file. TotalReclaw ([phrase-escrow.md](https://github.com/graphprotocol/totalreclaw/blob/main/docs/guides/phrase-escrow.md)).
5. **The Markdown Observation/Relation grammar,** readable by Obsidian and writable by both the person and the model, with a comparison table showing the same files on the free and paid paths. Basic Memory ([README](https://github.com/basicmachines-co/basic-memory/blob/main/README.md#the-markdown-format)).
6. **A review queue for agent-made changes:** per-note diff, keep or undo, with undo kept as the person's click. Basic Memory agents ([agents(7)](https://github.com/basicmachines-co/basic-memory/blob/main/src/basic_memory/man/man7/agents(7).md)).
7. **A hash-chained audit log, anchored against truncation, that records reads as well as writes,** by caller. This is the substrate for receipts. Compartment ([audit.py](https://github.com/MaxFreedomPollard/Compartment/blob/main/src/compartment/audit.py)).
8. **A sensitive-data filter on the client,** with checksum validators, fixed human copy and an explicit override. TotalReclaw ([sensitive-data-filter.md](https://github.com/graphprotocol/totalreclaw/blob/main/docs/guides/sensitive-data-filter.md)).
9. **Provenance on every memory** (required `source` and `discovered`, optional `expires`, fact versus opinion) plus `scope` categories such as health, finance and family. These are ready-made keys for consent per kind of information. Compartment ([README](https://github.com/MaxFreedomPollard/Compartment/blob/main/README.md#the-memory-logic)) and TotalReclaw ([README](https://github.com/graphprotocol/totalreclaw/blob/main/README.md)).
10. **Distribution playbook:**
    - `integrate --all`, which takes a byte-exact backup, merges and writes atomically across 34 clients, plus deep-links and about 15 registry listings (Compartment, [README](https://github.com/MaxFreedomPollard/Compartment/blob/main/README.md));
    - first-party Hermes and OpenClaw plugins and a coupon for open-source users (Basic Memory, [README](https://github.com/basicmachines-co/basic-memory/blob/main/README.md));
    - "recall-only unless asked to record" in the MCP server instructions (Honcho, [instructions.md](https://github.com/plastic-labs/honcho/blob/main/mcp/instructions.md)).

**Also worth noting:**
- MCP `destructiveHint` and `expected_checksum` concurrency (Basic Memory, [write.py](https://github.com/basicmachines-co/basic-memory/blob/main/src/basic_memory/mcp/tools/write.py));
- per-app pause and access log (OpenMemory, [permissions.py](https://github.com/mem0ai/mem0/blob/540d23d610fcdc9a1f8795875c013af67d35ae93/openmemory/api/app/utils/permissions.py));
- non-destructive import of OpenClaw `MEMORY.md`/`USER.md`/`IDENTITY.md` (Honcho, [README](https://github.com/plastic-labs/honcho/blob/main/README.md)).

## Avoid list: the 5 biggest mistakes

1. **Consent tied to an identity anyone can claim.**
   - OpenMemory took `client_name` and `user_id` from the URL with no authentication, which made its per-app permissions and access log meaningless ([mcp_server.py](https://github.com/mem0ai/mem0/blob/540d23d610fcdc9a1f8795875c013af67d35ae93/openmemory/api/app/mcp_server.py)).
   - Compartment's `--caller` is declarative, and its default grants every caller `rw` everywhere ([acl.py](https://github.com/MaxFreedomPollard/Compartment/blob/main/src/compartment/acl.py)).
   - Our grants must bind to an authenticated per-agent credential, and the default must deny.
2. **Publishing deterministic metadata permanently.** TotalReclaw's unkeyed SHA-256 word indices, fingerprints and timing sit on a public chain, can never be deleted, and are open to dictionary attack ([blind.rs](https://github.com/graphprotocol/totalreclaw/blob/main/rust/totalreclaw-core/src/blind.rs), [schema](https://github.com/graphprotocol/totalreclaw/blob/main/subgraph/schema.graphql)). Any server-side search index must be keyed, and deletion must be real.
3. **Shipping a person-facing product, then abandoning it quietly.**
   - Mem0 sunset OpenMemory and apologised "for not communicating the deprecation sooner" ([#6078](https://github.com/mem0ai/mem0/issues/6078)).
   - Supermemory killed Nova and its company brain within weeks and refunded customers ([blog](https://supermemory.ai/blog/an-update-to-supermemory/)).
   - We should publish a continuity commitment: an open format, a self-host path, and an export that keeps working.
4. **Unchecked automatic extraction plus default cloud models and telemetry.**
   - Mem0's own users found "97.8% were junk" ([#4573](https://github.com/mem0ai/mem0/issues/4573)).
   - Mem0 sends to OpenAI by default ([README](https://github.com/mem0ai/mem0/blob/main/README.md)).
   - Honcho had hard-coded model calls ([#1180](https://github.com/plastic-labs/honcho/issues/1180)).
   - Proposals should require approval, and the default model should be local or chosen by the person.
5. **Secrets in env vars and config, and inconsistent public claims.**
   - TotalReclaw's README still says `export TOTALRECLAW_RECOVERY_PHRASE` ([README](https://github.com/graphprotocol/totalreclaw/blob/main/README.md)).
   - Basic Memory's README price ($15, one plan) contradicts its $19/$99/$249 credit pricing ([pricing](https://basicmemory.com/pricing)).
   - TotalReclaw's README limit (3,000) contradicts its pricing page (1,500) ([pricing](https://totalreclaw.xyz/pricing)).
   - Supermemory's compliance claims are inconsistent across tiers ([pricing](https://supermemory.ai/pricing)).
   - Trust products die on small contradictions.

## Gaps: what none of them do well

- **Consent per destination.** No product lets the person decide which *model or provider* (local or hosted) may receive which kind of memory. Every product treats "the agent" as the boundary, and the memory then flows to whatever model the agent uses.
- **Receipts in plain language.** Compartment has a tamper-evident log of operations, and Basic Memory and Mem0 Custom have access or admin logs. None records *what content each agent or model received*, and none summarises it weekly for a non-technical person.
- **End-to-end encryption together with plain-text, editable files.** Compartment encrypts an opaque SQLite blob. TotalReclaw encrypts blobs on a chain. Basic Memory has editable Markdown with no encryption. Nobody offers an encrypted folder of plain-text files that stays compatible with OpenClaw and Hermes workspace files and syncs through any channel the person chooses.
- **Approval of memory writes as the default.** Only Basic Memory's cloud agents (review queue) and TotalReclaw's sensitive-data refusal come close. Every other product writes automatically or relies on the host's generic tool-approval prompt.
- **Recovery for ordinary people without a custodian who can read the data.** Compartment has no recovery at all. TotalReclaw has a good ladder but depends on a chain. Basic Memory and others rely on the operator holding plaintext.
- **Organisations with user ownership.** Team features (Basic Memory Teams, Supermemory Scale, Mem0 Custom) are operator-held and readable by the operator. No product offers organisation policy over memory that individuals own and encrypt.
- **An always-on local door that is not a cloud.** Every product chose either a local stdio server, live only while an agent runs, or a hosted MCP endpoint. No product offers a hosted relay that cannot read the data, other than TotalReclaw's chain relay.
