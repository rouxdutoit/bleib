# Teardown 5: Platform and incumbent memory, plus how open source beat funded rivals

Researched 24 November 2026. Every claim has a URL next to it. **[unverified]** means the claim comes from a secondary source only, sources disagree, or I could not open the primary page. **[prior knowledge]** means I knew it before this research and did not re-check it this session. Lines marked **Prediction** are my inferences, not sourced facts.

---

# PART A: Platforms' and incumbents' memory

## A1. Vana Personal Server / Portable Memory (vana.org)

**1. What it is.** Vana gives each person a "personal data server" on their own device. It pulls in data from other platforms (ChatGPT history and memories, Spotify, Oura, calendar) and serves it to AI tools over MCP and an API, behind on-chain grants. The upgrade launched in beta on 8 July 2026, at the same time Vana acquired the Memory Protocol team. Jack Spallone joined to lead portable memory ([vana.org/blog/own-your-ai-memory](https://vana.org/blog/own-your-ai-memory)). The reference server `vana-com/personal-server-ts` is MIT-licensed. It has only about 5 GitHub stars but more than 500 commits and 70 PRs ([GitHub](https://github.com/vana-com/personal-server-ts)). The DataConnect desktop importer was released as open source on 26 Feb 2026 ([vana.org/blog/dataconnect…](https://vana.org/blog/dataconnect-open-source-data-portability)). Funding comes through the VANA token and the Vana Foundation. The Foundation reports 2,937,447 "verified reads" as of 28 Sep 2026 ([Decrypt/Chainwire](https://decrypt.co/379534)). A claim of more than one million Playground users comes from third parties **[unverified]**.

**2. How it works.**
- **Storage layout.** Data root is `~/personal-server`. It holds `data/` (JSON envelopes per scope), `config.json`, `index.db` (SQLite WAL), `key.json` and `logs/` (access logs). Imports are hashed with SHA-256 over RFC 8785 canonical JSON, so the same import is idempotent ([README](https://github.com/vana-com/personal-server-ts)).
- **Encryption.** The user signs the fixed message `"vana-master-key-v1"` with EIP-191. A per-scope key is derived from that signature with HKDF-SHA256 (`info = scope:{scope}`). Each file is encrypted as a single blob with OpenPGP symmetric encryption, so no plaintext metadata sits beside it.
- **Sync backends.** Vana Storage (Cloudflare R2), Google Drive, Dropbox, IPFS, or local. Backends only ever hold ciphertext. Sync polls the Data Registry, and conflicts resolve as last-write-wins on `collectedAt`.
- **Recovery.** Keys are deterministic, so the wallet signature effectively is the recovery material. The docs do not say this explicitly ([docs.vana.org storage & encryption](https://docs.vana.org/protocol-reference/storage-encryption)).
- **Deletion.** Deletion leaves remote blobs and on-chain grant history in place (same page).

**3. How agents connect.** The MCP server is read-only. Tools are `list_granted_scopes`, `list_granted_sources`, `list_scope_blocks`, `read_scope`, `search_personal_context`, `get_scope_file` and `request_scope_access`. The last one only *reports* which scopes are missing; it grants nothing.
- **Two connection paths.** (a) The owner points their own MCP client at `/mcp` and gets a token from an OAuth-style flow. (b) A third-party backend signs a `Web3Signed` proof containing a `grantId`, then receives a bearer token that lasts one hour.
- **Writes.** Agents write through a separate Write API, not MCP ([docs.vana.org/applications/mcp](https://docs.vana.org/applications/mcp)).
- **Builder SDK.** A Next.js starter exists for the Connect SDK ([GitHub](https://github.com/vana-com/vana-connect-starter)).

**4. Consent and control.**
- **Grant shape.** One grant per builder, as EIP-712 typed data: `grantorAddress`, `granteeId`, `scopes`, `grantVersion`, `expiresAt`. `expiresAt = 0` means the grant never expires.
- **Scope grammar.** `instagram.profile` means read. `write:notes.entries` means write.
- **Re-approval.** When a builder asks again, the user signs the union of old and new scopes.
- **Revocation.** Revocation is off-chain and checked on every request; a revoked grant returns error 410.
- **Public metadata.** Who granted what to whom is public on-chain ([grants-permissions](https://docs.vana.org/protocol-reference/grants-permissions)).
- **Logs.** Every scope read is written to the access log against the app's address, and every MCP call appears in an owner activity feed ([MCP doc](https://docs.vana.org/applications/mcp)). The owner endpoint `GET /v1/access-logs` exists ([README](https://github.com/vana-com/personal-server-ts)).
- **Pay per read.** "Each access is logged and each access is paid" ([docs.vana.org/applications/agents](https://docs.vana.org/applications/agents), from a search snippet **[unverified wording]**).
- **Agent writes.** Consent for agent writes is described as an open design question (search snippet of the MCP docs **[unverified]**).

**5. Onboarding and UX.** Install the Vana desktop app (beta at app.vana.org), connect sources with DataConnect (about one click per platform; scraping runs on the client), then point Claude or ChatGPT at the MCP URL ([launch post](https://vana.org/blog/own-your-ai-memory), [DataConnect](https://vana.org/blog/dataconnect-open-source-data-portability)). Signing in with a wallet is the main point of friction for non-crypto users **[inference]**.

**6. Business model.** Builders pay a protocol fee from escrow for each permitted read. The fees fund staking, buybacks and burns ([grants doc](https://docs.vana.org/protocol-reference/grants-permissions), [Decrypt](https://decrypt.co/379534)). There is no consumer subscription.

**7. Worth copying.**
- `request_scope_access` as an MCP tool. The agent can say "I need X" without being able to take it.
- A per-scope derived key, so revoking or sharing one kind of information never exposes the others.
- Canonical-JSON hashing so repeated imports are idempotent.
- An activity feed of every MCP call.
- `list_granted_scopes` returns a "recommended access strategy" (size class and readiness), which stops agents from blowing their context window.
- Connectors that take about 10 minutes to write with Claude Code, which brings a community of importers ([DataConnect](https://vana.org/blog/dataconnect-open-source-data-portability)).

**8. Weaknesses.**
- Grant metadata is public on-chain, which leaks *who you share with*.
- Revocation is not on-chain, so `isActive()` lies after a revoke ([grants doc](https://docs.vana.org/protocol-reference/grants-permissions)).
- Deletion leaves remote blobs behind ([storage doc](https://docs.vana.org/protocol-reference/storage-encryption)).
- The token economics are unproven. Analysts point to low on-chain activity ([Decrypt](https://decrypt.co/379534) and secondary coverage **[unverified]**).
- MCP is read-only.
- Developer mindshare is tiny (5 stars).

**9. Threat: MEDIUM-HIGH.** Of everything in this track, Vana's architecture is closest to ours: a local server, MCP, scoped grants, an access log and importers. Two things hold it back with ordinary people and organisations: the crypto wrapper and pay-per-read. If Vana dropped the wallet requirement, the threat would be high.

---

## A2. Inrupt "Charlie" and Solid Agentic Wallets

**1. What it is.** Inrupt is Tim Berners-Lee's Solid company. It sells Enterprise Solid Server and wallet infrastructure to banks, telcos and governments. "Charlie" is a personal AI intermediary that sits on the wallet, and it reaches consumers *through* those enterprises ([Inrupt blog: Charlie](https://www.inrupt.com/blog/charlie-the-agent-that-works-for-the-consumer-and-the-bank)). The Data Wallet launched in July 2024 ([tech.eu](https://tech.eu/2024/07/23/inrupt-s-data-wallet-realises-sir-berners-lee-s-data-ownership-dream/)). Inrupt raised a $30M Series A in Dec 2021 ([TechCrunch](https://techcrunch.com/2021/12/09/tim-berners-lee-inrupt-fundraise)). Total funding is estimated at $36–48M and headcount at about 20–50 **[unverified, aggregators]**. Named deployments: BBC, NatWest, Flanders (Athumi) and NHS pilots **[secondary]** ([CB Insights](https://www.cbinsights.com/company/inrupt/customers)). The late-2024 Charlie prototype ran on simulated data ([W3C Design Issues](https://www.w3.org/DesignIssues/Works.html)). I found no general-availability launch of Charlie as of Nov 2026.

**2. How it works.** Data sits in a Solid Pod ("vault") on Inrupt's Enterprise Solid Server, which the deploying bank runs. Inrupt says it "never has visibility" into the data **[secondary]** ([BigGo summary](https://finance.biggo.com/news/kH29kZ4BYH_ypPqOQktq)). Solid keeps identity, data and permissions as separate parts. Sensitive data can be processed in TEEs ([Agentic Wallets](https://www.inrupt.com/wallets/agentic-wallets)).

**3. How agents connect.** Inrupt's MCP server lets clients such as Claude act on the wallet in natural language, for example "move my tax forms into a Taxes folder". A single API covers multiple apps and agents ([Solid & MCP post, 29 May 2025](https://www.inrupt.com/blog/why-were-excited-about-solid-and-mcp)).

**4. Consent and control.**
- **Access Grants.** Grants can be time-boxed. The example is sharing a driving licence with a rental agency for 48 hours.
- **Access Requests.** Users review requests through Solid consent endpoints ([Solid & MCP](https://www.inrupt.com/blog/why-were-excited-about-solid-and-mcp)).
- **Charlie's prompt.** Charlie shows "a simple consent before anything leaves" ([Charlie post](https://www.inrupt.com/blog/charlie-the-agent-that-works-for-the-consumer-and-the-bank)).
- **Audit trails.** "Comprehensive audit trails" are claimed for agent-to-agent workflows, without detail ([Agentic Wallets](https://www.inrupt.com/wallets/agentic-wallets)).

**5. Onboarding.** There is no direct-to-consumer path. You get it through your bank's app **[inference from deployment model]**.

**6. Business model.** Enterprise licences, sold through "book a demo" ([Agentic Wallets](https://www.inrupt.com/wallets/agentic-wallets)).

**7. Worth copying.**
- Time-boxed grants tied to a purpose ("48 hours, for this rental").
- Access Requests as a first-class object the person reviews, separate from grants.
- Positioning the agent as working *for the consumer* even when a company deploys it.
- Distribution through trusted institutions (banks, governments) as an enterprise path.

**8. Weaknesses.**
- Seven-plus years from concept ([Design Issues](https://www.w3.org/DesignIssues/Works.html)) to still not shipping to consumers.
- Most coverage is Inrupt's own marketing.
- Solid's RDF and Linked Data model is heavy for developers **[prior knowledge]**.
- The vault is run by the bank, so in practice the person depends on that institution.

**9. Threat: LOW-MEDIUM.** Inrupt is a credible enterprise competitor for regulated organisations, especially in the EU, UK and Flanders. It is not a threat for developers or ordinary people. Solid's consent vocabulary is worth reading.

---

## A3. Proton Lumo long-term memory (Lumo 2.0, 30 June 2026)

**1. What it is.** Lumo is Proton's privacy-first AI assistant. Lumo 2.0 (30 June 2026) added long-term memory, image generation, deep search and a thinking mode. Projects ("encrypted spaces for any task") arrived in Lumo 1.3 on 13 Jan 2026. Apertus, the Swiss sovereign model, was added on 17 Sep 2026 ([Proton Lumo updates](https://proton.me/blog/proton-updates/lumo)). Lumo sits inside Proton's 100M-account base ([Proton blog](https://proton.me/blog/proton-100-million-accounts)).

**2. How it works.** Memories, chats, files and projects are "zero-access encrypted", meaning Proton cannot read them ([Lumo Memory support](https://proton.me/support/lumo-memory)). Some reports say memory is scoped to Projects ([IT Security Guru](https://www.itsecurityguru.org/2026/06/30/proton-launches-lumo-2-0-doubling-down-on-zero-access-encryption-as-ai-security-risk-grows/) **[could not open, 403]**). The data format is not published.

**3. How agents connect.** It doesn't. Lumo's memory is closed. There is no MCP, API or export of memories in the docs ([support](https://proton.me/support/lumo-memory)).

**4. Consent and control** ([support page](https://proton.me/support/lumo-memory)).
- **Two kinds of memory.** "Auto-generated" and "custom" memories are listed separately under Settings > Memory > Saved memories.
- **Per-item controls.** Each memory can be edited or deleted.
- **Bulk controls.** "Clear auto-generated" and "Clear all".
- **Global switches.** A Memory on/off switch, and an **"Auto update Memory"** switch (on by default) that freezes memory without deleting it.
- **On-demand generation.** "Generate from chat" turns past chats into memories when the person asks.
- **"Optimize memories".** Merges and deduplicates auto-generated memories only and leaves custom ones alone.
- **Availability.** Free and paid plans; a Proton Account is required.
- **Not present.** No log of which memory was used for which answer.

**5. Onboarding.** Zero setup inside an existing Proton account. Memory is just on.

**6. Business model.** Free tier plus Lumo Plus, bundled into Proton plans ([Lumo updates](https://proton.me/blog/proton-updates/lumo)). The exact Plus price was not confirmed this session.

**7. Worth copying.**
- Separating auto memories from custom memories, and letting people clear one kind without the other.
- A "freeze learning" switch that is distinct from "forget".
- An "Optimize" pass that only ever touches machine-written memories.
- "Generate from chat" as an on-demand alternative to always-on capture.

**8. Weaknesses.**
- Commentators note there is "no operational specifics on how memory can be inspected, edited, or exported" ([IT Security Guru](https://www.itsecurityguru.org/2026/06/30/proton-launches-lumo-2-0-doubling-down-on-zero-access-encryption-as-ai-security-risk-grows/) **[via search snippet]**).
- No export.
- No per-answer provenance.
- Locked into Lumo.

**9. Threat: MEDIUM** with privacy-minded consumers, because Proton's brand already owns "private". Low with developers. **Prediction:** Proton adds memory export and Lumo in Proton Pass/Drive integrations before it adds MCP.

---

## A4. ChatGPT memory (OpenAI), 2026 state

**1. What it is.** The default AI memory for most people. It has two layers: **Saved memories** and **Reference chat history** ([Memory FAQ](https://help.openai.com/en/articles/8590148-memory-faq)).

**2. How it works.**
- **Separate store.** Memory lives in a layer separate from chats, so deleting a chat doesn't delete memories derived from it ([FAQ](https://help.openai.com/en/articles/8590148-memory-faq)).
- **2026 timeline** ([release notes](https://help.openai.com/en/articles/6825453-chatgpt-release-notes)):
  - **15 Jan 2026:** better recall of details from past chats; past chats used in an answer appear as openable sources (Plus/Pro).
  - **5 May 2026:** "Memory sources" on all consumer plans. A Sources icon under each answer shows the saved memories, past chats, custom instructions, and (Plus/Pro) files and Gmail that shaped it. Each source can be corrected, deleted, or marked "not relevant".
  - **4 Jun 2026:** "Memories are now updated automatically" to cut stale or contradictory entries. Plus/Pro capacity doubled. You can switch back to legacy saved memories.
  - **12 Jun 2026:** memory summary page with "Delete and turn off memory", highlight-to-correct, and a free-text correction box.
  - **14 Aug 2026:** switch an existing project between default memory and project-only memory.
  - **27 Aug 2026:** temporary chat lets you choose "personalized" (uses memory, creates none) or "unpersonalized" (default) at the start.
  - **21 Sep 2026:** Privacy Center hub.
- **Background rewriting.** Third parties call the background rewriting "Dreaming V3" **[unverified naming]** ([TechTimes](https://www.techtimes.com/articles/317840/20260605/chatgpt-memory-dreaming-update-openai-rewrites-personalization-engine-limits-audit-trail.htm)).

**3. How agents connect.** No MCP or API access to a user's memory for third parties. **Export:** the standard Data Controls > Export archive covers chats, but sources disagree on whether it includes memory **[unverified]** ([memx.app](https://memx.app/blog/can-you-export-your-ai-memory/), [aimemory.pro](https://aimemory.pro/blog/chatgpt-memory-export)). **Import:** none. Other vendors' importers get ChatGPT memory out with a "tell me everything you remember" prompt.

**4. Consent and control.**
- **Global and per-item.** Memory on/off; per-source correct, delete or "not relevant"; "Don't mention this again", which only suppresses and keeps the entry.
- **Temporary and project modes.** Personalized vs unpersonalized temporary chats; project-only memory.
- **Admin default.** Improved memory is off by default for Enterprise/Healthcare regulated workspaces and is not covered by the BAA ([FAQ](https://help.openai.com/en/articles/8590148-memory-faq)).
- **No full audit log.** The summary "does not necessarily include everything ChatGPT may remember". Logs of deleted memories may be kept for 30 days ([TechTimes](https://www.techtimes.com/articles/317840/20260605/chatgpt-memory-dreaming-update-openai-rewrites-personalization-engine-limits-audit-trail.htm)).
- **No write approval.** Writes are automatic.

**5. Onboarding.** On by default. Zero steps.

**6. Business model.** Memory is bundled. More capacity, Gmail and file sources come with Plus/Pro ([release notes](https://help.openai.com/en/articles/6825453-chatgpt-release-notes)).

**7. Worth copying.**
- **Per-answer "Sources" with inline correct/delete/not-relevant.** This is the best receipt UX of any incumbent, and our receipts should look like it.
- Project-only memory as a one-click scope.
- Choosing personalized vs unpersonalized at the start of a temporary chat.
- Highlight-to-correct on a plain-language summary.

**8. Weaknesses.**
- "Context bleed": health or finance details leak into unrelated answers.
- Memories are silently rewritten.
- Deleting a chat doesn't delete what was learned from it.
- Incomplete visibility; a CHI study calls this a "personalization-convenience paradox" ([TechTimes](https://www.techtimes.com/articles/317840/20260605/chatgpt-memory-dreaming-update-openai-rewrites-personalization-engine-limits-audit-trail.htm)).
- No official export or import.
- No disclosure of how memory writes are protected against prompt injection (same source).

**9. Threat: HIGH as the gravity well, LOW as a direct competitor.** It is the lock-in we are positioned against. **Prediction:** OpenAI ships a sanctioned memory export (regulatory pressure from the EU DMA and data portability), and "Sign in with ChatGPT" for sharing context with third-party apps. Both would be a direct competitor to a neutral door.

---

## A5. Claude memory (Anthropic)

**1. What it is.** Memory synthesized from chats and focused on work. It reached free users on 2 Mar 2026 ([Claude release notes](https://support.claude.com/en/articles/12138966-release-notes), via search snippet). It is scoped per project.

**2. How it works.** A memory summary is synthesized from chat history. Some Team/Enterprise orgs are still on a "legacy" experience, where edits take up to 24 h ([help: import/export](https://support.claude.com/en/articles/12123587-import-and-export-your-memory-from-claude)). Separately for developers, Claude Code uses plain-text `CLAUDE.md` files, and the API memory tool is file-based (a `/memories` directory the developer controls) **[prior knowledge]**.

**3. How agents connect.**
- **Import.** Run Anthropic's prompt in another assistant (it asks for "[date saved] - memory content" lines in one code block), then paste into Settings > Your Claude > "Start import" > "Add to memory". Claude splits the text into individual entries. There is also a home-screen "Import memory to Claude" card. Import is labelled experimental; Free through Enterprise plans; web and Desktop.
- **Export.** View memory under Manage and copy it, or ask Claude to write the memories out verbatim ([help](https://support.claude.com/en/articles/12123587-import-and-export-your-memory-from-claude)).
- **Legacy export window.** A one-time export of legacy memory reportedly closed on 9 Sep 2026 **[unverified, secondary]** ([MemoryLake](https://www.memorylake.ai/en/blogs/claude-memory-chat-and-cowork)).
- **Full export.** A full data export exists. Whether it includes memory is disputed **[unverified]** ([sawinyh.com](https://sawinyh.com/blog/claude-export-no-import/)).

**4. Consent and control.** Memory on/off, a "Tell Claude what to change or remove" box, and "See what Claude learned about you", which opens a chat that reflects back what it learned ([help](https://support.claude.com/en/articles/12123587-import-and-export-your-memory-from-claude)). Imports may drop personal, non-work details (same). No per-answer source log was found.

**5. Onboarding.** On by default. Import takes about 60 seconds ([Tom's Guide](https://www.tomsguide.com/ai/you-can-move-your-chatgpt-memory-to-claude-in-60-seconds-heres-how)).

**6. Business model.** Bundled with all plans.

**7. Worth copying.**
- A copy-paste **migration prompt** that works with *any* assistant, with a fixed line format (date plus content).
- A "See what Claude learned about you" verification step right after import.
- Natural-language correction ("tell me what to change").
- On the developer side: memory as plain files.

**8. Weaknesses.**
- Import is lossy and "experimental".
- It silently drops non-work facts.
- Export is copy-paste, not a file.
- The legacy and new UIs split the experience.
- Exports reportedly can't be loaded into another Claude account ([sawinyh.com](https://sawinyh.com/blog/claude-export-no-import/) **[secondary]**).

**9. Threat: MEDIUM.** Claude is the friendliest incumbent toward plain-text and MCP memory, and the most likely to become a good *client* of our door. The risk is that Anthropic ships its own cross-app memory over MCP. **Prediction:** a memory MCP connector, and file-backed consumer memory that mirrors the API memory tool.

---

## A6. Gemini memory and Personal Intelligence (Google)

**1. What it is.**
- **Personal Intelligence (Jan 2026, US beta).** Connects Gemini to Gmail, Photos, Search and YouTube history, expanding to more Google apps "with your permission" ([Google blog](https://blog.google/innovation-and-ai/products/gemini-app/personal-intelligence/), [overview](https://gemini.google/overview/personal-intelligence/)). Calendar, Drive, Maps and Wallet were added later per secondary guides **[unverified]**.
- **Memory.** The "past chats" feature was renamed to memory.
- **Switching tools (26 Mar 2026).** Memory import (paste a summary) and chat import (upload a ChatGPT or Claude ZIP, up to 5 GB, 5 ZIPs a day) at gemini.google.com/import. Not available in the EEA, Switzerland or the UK ([9to5Google](https://9to5google.com/2026/03/26/gemini-import/), [Google blog](https://blog.google/innovation-and-ai/products/gemini-app/switch-to-gemini-app/)).

**2. How it works.** Everything sits in Google's cloud under Gemini Apps Activity. Imported data is treated like other activity, **including for training AI models**, per Google's help as reported ([search synthesis citing Google help](https://blog.google/innovation-and-ai/products/gemini-app/switch-to-gemini-app/) **[verify on live help page]**). Google says Gemini doesn't train "directly" on your Gmail or Photos ([overview](https://gemini.google/overview/personal-intelligence/)).

**3. How agents connect.** Import only. No third-party read access to memory. Imported chats carry an import icon and can be deleted per ZIP. Re-uploading a ZIP overwrites the earlier import ([9to5Google](https://9to5google.com/2026/03/26/gemini-import/)). The memory-import prompt asks the other assistant for categorised demographics, interests, relationships, dated events and instructions "with supporting evidence" (same).

**4. Consent and control.** One switch per connected app, a separate Memory switch, and the separate "Keep Activity" for logging and training at myaccount.google.com ([plainaidaily guide](https://plainaidaily.com/guides/gemini-personal-intelligence-explained) **[secondary]**). Deleting a memory and disconnecting an app are separate actions.

**5. Onboarding.** One tap per app for connected sources. The import flow is surfaced as a prompt in Gemini.

**6. Business model.** Bundled. Early Personal Intelligence access went to AI Pro/Ultra subscribers **[secondary, eligibility may have changed]**.

**7. Worth copying.**
- **ZIP chat import plus an import icon and delete-per-batch.** Imports become reversible as a unit.
- The structured migration prompt (categories plus evidence).
- One switch per source.

**8. Weaknesses.**
- Imported data feeds training by default.
- Controls are split across Gemini settings and Google Account settings.
- Geo-blocked in Europe.
- The memory import is written by the other assistant, so it can carry sensitive details the person never chose to share ([search synthesis](https://www.business-standard.com/technology/tech-news/gemini-lets-import-memory-chats-from-chatgpt-claude-how-to-use-126032700463_1.html)).

**9. Threat: HIGH for ordinary people.** Gemini already has their email, photos and calendar, which is personal context with zero setup. **Prediction:** Personal Intelligence extends to Android system-wide context (Magic Cue-style, through Private AI Compute) and Workspace orgs, with an admin console for org-level memory.

---

## A7. Apple Siri AI personal context and Private Cloud Compute

**1. What it is.** Siri AI was announced 8 June 2026 at WWDC26. It draws on messages, emails, photos and other apps through the on-device Spotlight index and an "App Toolbox". Third-party apps take part by integrating with Spotlight ([Apple Newsroom, Jun 2026](https://www.apple.com/newsroom/2026/06/apple-introduces-siri-ai-a-profoundly-more-capable-and-personal-assistant/)). It is in beta in the iOS 27.2 family, and as of 26 Oct 2026 it supports English, French, Japanese, Korean, Portuguese and Spanish. Not in the EU on iOS at launch, and not in China ([Apple Newsroom, Oct 2026](https://www.apple.com/newsroom/2026/10/siri-ai-is-available-in-more-languages-starting-today/)). The foundation models were reportedly built with Google Gemini technology **[secondary]** ([MacRumors guide](https://www.macrumors.com/guide/wwdc-2026-what-to-expect/)).

**2. How it works.** The Spotlight index and orchestration run "entirely on device". Heavier requests go to Private Cloud Compute (PCC), where personal data "is not stored nor made accessible to Apple or anyone else", and "outside experts can continue to verify this" ([Newsroom Jun 2026](https://www.apple.com/newsroom/2026/06/apple-introduces-siri-ai-a-profoundly-more-capable-and-personal-assistant/)). Siri conversation history syncs through iCloud. **Siri Recap** (a high-level summary, not a transcript, designed to exclude financial and government identifiers) and **Live Rewind** snippets are end-to-end encrypted ([Newsroom Sep 2026](https://www.apple.com/newsroom/2026/09/siri-ai-a-profoundly-more-capable-and-personal-assistant-is-here/), via search snippet). PCC publishes software images for researchers and offers a Virtual Research Environment and a bounty **[prior knowledge]** ([security.apple.com](https://security.apple.com/blog/pcc-security-research/)).

**3. How agents connect.** Developers integrate through Spotlight and App Intents. No MCP or third-party read of personal context was announced ([Newsroom](https://www.apple.com/newsroom/2026/06/apple-introduces-siri-ai-a-profoundly-more-capable-and-personal-assistant/)).

**4. Consent and control.** Not detailed in the press materials. HomeView shows personal content only when the person is recognised by face *and* their paired iPhone is nearby and recently unlocked ([Newsroom Nov 2026](https://www.apple.com/newsroom/2026/11/apple-homeview-available-today/)). I found no consumer-facing log of what reached PCC. Apple Intelligence has had a "Report" export in Privacy & Security since 2024 **[prior knowledge, unverified for iOS 27]**.

**5. Onboarding.** Default on supported devices. Zero setup.

**6. Business model.** Funded by hardware.

**7. Worth copying.**
- "Outside experts can verify": publish what runs on the hosted path and let anyone attest it.
- Summaries designed to exclude identifier classes (financial, government IDs).
- Context that depends on presence (face plus unlocked device) for shared screens. This maps onto our "destination" axis.

**8. Weaknesses.**
- A closed ecosystem with no export.
- The privacy claims are Apple's own statements ([Newsroom](https://www.apple.com/newsroom/2026/06/apple-introduces-siri-ai-a-profoundly-more-capable-and-personal-assistant/)).
- Questions about Gemini's involvement **[secondary]** ([memx.app](https://memx.app/blog/apple-siri-google-gemini-privacy/)).
- Not in the EU.
- Nothing works for non-Apple agents.

**9. Threat: HIGH for ordinary iPhone users** (default, on-device, trusted). **LOW for developers and organisations.** **Prediction:** iOS 28 opens personal context to third-party models (it already allows a user-selected model **[secondary]**) and adds an "Apple Intelligence activity" view. MCP support is possible but unconfirmed.

---

## A8. Google Private AI Compute

**1. What it is.** A sealed cloud platform for Gemini that offers "on-device-level" privacy. Announced 11 Nov 2025; first used by Pixel 10 Magic Cue and Recorder ([Google blog](https://blog.google/technology/ai/google-private-ai-compute/)).

**2. How it works.**
- **Hardware and enclaves.** Runs on TPUs with Titanium Intelligence Enclaves. Devices connect through remote attestation and encryption, and data is accessible "only to the user, not even Google" ([Google blog](https://blog.google/technology/ai/google-private-ai-compute/)).
- **Reported details.** AMD SEV-SNP CPU front-ends, Noise/ALTS between nodes, no shell access, ephemeral processing, and an NCC Group assessment ([InfoQ](https://www.infoq.com/news/2025/11/google-private-ai-compute-tee), [9to5Google](https://9to5google.com/2025/11/11/google-private-ai-compute-pixel/)) **[some details single-source]**.

**3. How agents connect.** Internal to Google products only.

**4. Consent and control.** Pixel users "will be able to see when Private AI Compute is called" ([9to5Google](https://9to5google.com/2025/11/11/google-private-ai-compute-pixel/)).

**5–6. Onboarding and business model.** Invisible infrastructure, bundled.

**7. Worth copying.** An on-device indicator when data leaves for the hosted enclave, which is a receipt at the moment of egress. An independent assessment published alongside launch.

**8. Weaknesses.** Retention and logging are not documented in the announcement. Users must trust attestation they can't check themselves.

**9. Threat: LOW directly.** It is a building block for A6. It raises the bar for "hosted but private": our hosted door should attest to something comparable, or say plainly that it doesn't.

---

## A9. Hermes Agent native memory (Nous Research)

**1. What it is.** An open source (MIT) Python agent from Nous Research, launched 25 Feb 2026. Reported at roughly 214–220k GitHub stars by late July 2026, and passing OpenClaw in daily OpenRouter token volume **[secondary]** ([glukhov.org](https://glukhov.org/ai-systems/comparisons/openclaw-hermes-alternatives-popularity/)).

**2. How it works** ([Hermes memory docs](https://hermes-agent.nousresearch.com/docs/user-guide/features/memory)).
- **Two bounded files** in `~/.hermes/memories/`:
  - `MEMORY.md`: the agent's notes, 2,200 characters (about 800 tokens).
  - `USER.md`: the person's profile, 1,375 characters (about 500 tokens).
- **Loading.** Both are injected once at session start; changes take effect next session.
- **Session history.** Past sessions are stored in SQLite with full-text search, and results are raw messages, not summaries.
- **External providers** run alongside the files: RetainDB and ByteRover are bundled; Honcho, Mem0, Supermemory, Hindsight and others are plugins.

**3. How agents connect.** A `memory` tool with `add`, `patch` and `remove` and a required `target` of `memory` or `user`. There is no read action, because the content is already in the prompt.
- **Importing from OpenClaw.** `hermes claw migrate`, now `hermes import-agent openclaw` (the agent-importers plugin), maps OpenClaw's MEMORY.md and USER.md into `~/.hermes/memories/`.
- **Import flags.** `--dry-run`, `--preset user-data` (skips API keys) and `--source`.
- **Overflow.** Content beyond the character caps spills to an overflow file in the migration report ([migration doc](https://github.com/agent-pablo/hermes-agent-15-03-2026/blob/main/docs/migration/openclaw.md), [aiagentmemory.org](https://aiagentmemory.org/articles/openclaw-vs-hermes-agent-memory/)).

**4. Consent and control** ([docs](https://hermes-agent.nousresearch.com/docs/user-guide/features/memory)).
- **`write_approval`.** Stages agent writes for approval through `/memory pending | approve | reject`.
- **`display.memory_notifications`.** Controls how visible background saves are.
- **`/journey`.** A timeline of learned skills and memories that the person can edit or delete.
- **Write scanning.** Every write is scanned for prompt-injection and exfiltration patterns and for invisible Unicode, and matches are blocked.
- **Hard caps.** Writes over the cap return an error instead of silently dropping entries, which forces the agent to consolidate. Exact duplicates are rejected.

**5. Onboarding.** CLI install. Memory works immediately. Mostly developers.

**6. Business model.** Free and open source. Nous sells models and inference **[prior knowledge]**.

**7. Worth copying.**
- **Hard character budgets.** The error makes the agent consolidate.
- **Staged write approval with pending/approve/reject.** This is our "agents propose, person approves", already shipped.
- **Injection and invisible-Unicode scanning on every memory write.**
- **`/journey` as a timeline view of what was learned.**
- **`--dry-run` and a migration report with an overflow file.**

**8. Weaknesses.**
- Tiny budgets (about 1,300 tokens in total) push real memory to third-party providers, each with its own storage.
- No encryption at rest.
- No per-destination (which model) control.
- Running two processes against one home directory is unsafe (docs warning).

**9. Threat: MEDIUM, and our main partner.** Its files *are* our format. If Nous adds encryption and per-model consent, it covers the developer segment natively. Our pitch to them: "keep your files, we add the vault, receipts and consent".

---

## A10. OpenClaw native memory

**1. What it is.** The most-starred open source personal agent, written in TypeScript. About 374–379k stars by mid-2026 **[secondary]** ([glukhov.org](https://glukhov.org/ai-systems/comparisons/openclaw-hermes-alternatives-popularity/)).

**2. How it works** ([docs.openclaw.ai/concepts/memory](https://docs.openclaw.ai/concepts/memory)).
- **Workspace.** Plain Markdown in `~/.openclaw/workspace`:
  - `USER.md`: stable profile.
  - `MEMORY.md`: curated, loaded at session start.
  - `memory/YYYY-MM-DD.md`: daily notes, indexed but not injected.
  - `DREAMS.md`: dreaming summaries for human review.
- **Pre-compaction flush.** Before compaction, a silent "memory flush" appends to the daily note.
- **"Dreaming".** A background job scores recall signals and promotes items to MEMORY.md. It excludes untrusted and system-derived candidates, and its backfills support rollback.
- **Backends.** SQLite by default; Postgres, Honcho, LanceDB, and a `memory-wiki` plugin that records provenance.
- **Provenance gate.** Files marked untrusted, and remote files without a valid source identity, are excluded from automatic context; `openclaw doctor` lists them.

**3. How agents connect.**
- **Tools.** `memory_search` (hybrid vector and keyword, about 400-token chunks with 80-token overlap), `memory_get` (a file or line range), and `intent` (event-conditioned standing intents).
- **Imports.** From Codex, Claude Code and Hermes into `memory/imports/<source>/`. Imports are searchable but not merged into MEMORY.md, sources are left untouched, the preview flags conflicts, and applying makes a verified backup ([docs](https://docs.openclaw.ai/concepts/memory)).
- **Reverse migration.** Hermes to OpenClaw *appends* rather than overwrites ([docs2.openclaw.ai](https://docs2.openclaw.ai/install/migrating-hermes)).
- **Export.** No general export, because the files already are the export.

**4. Consent and control.** Review happens through DREAMS.md and the import preview. The docs say plainly that memory "records approval context but does not enforce policy": hard controls belong in approvals and sandboxing ([docs](https://docs.openclaw.ai/concepts/memory)). There is no per-model or per-destination consent and no receipts.

**5. Onboarding.** A developer installs it, or uses hosted VPS offerings ([openclawvps.io](https://openclawvps.io/blog/openclaw-memory)).

**6. Business model.** Open source, with a hosting ecosystem.

**7. Worth copying.**
- **Trust-tier exclusion.** Untrusted or unsigned files never enter context automatically, and `doctor` lists them.
- **Imports quarantined in their own folder** rather than merged.
- **Verified backup on every import.**
- **DREAMS.md as a review surface written for humans.**
- The 3-tier layout (USER, MEMORY, daily notes).

**8. Weaknesses** (security is the big one).
- **Memory poisoning.** Memory is "undifferentiated by source", which enables time-shifted prompt injection and poisoning of MEMORY.md and SOUL.md ([Palo Alto Networks](https://www.paloaltonetworks.com/blog/network-security/why-moltbot-may-signal-ai-crisis/), [CSA hardening guide](https://labs.cloudsecurityalliance.org/agentic/agentic-openclaw-hardening-guide-v1/)).
- **Malicious skills.** 341 to 1,467 malicious ClawHub skills ([Unit 42](https://unit42.paloaltonetworks.com/openclaw-ai-supply-chain/), figures vary **[secondary]**).
- **Exposed instances.** More than 21k publicly exposed instances in Jan 2026 (CSA, citing Censys **[secondary]**).
- **No encryption.** Files sit in plaintext on disk.

**9. Threat: MEDIUM, and a partner.** It is the reference format we must stay compatible with. Its security problems are our best argument for a vault-and-door layer.

---

## A. What incumbents will likely ship next (Prediction, synthesized)

1. **"Bring your memory" importers become table stakes, and exporters stay weak.** Claude and Gemini already import, and none export cleanly. **Prediction:** a regulator-driven export (EU) appears in 2027.
2. **Per-answer provenance spreads.** ChatGPT's "Sources" has set the bar ([release notes](https://help.openai.com/en/articles/6825453-chatgpt-release-notes)), and Claude and Gemini will copy it.
3. **Cross-app memory over MCP from a big vendor.** Anthropic is the likeliest, then OpenAI with "Sign in with ChatGPT" carrying context. This is the main strategic risk to a neutral door.
4. **Attested hosted enclaves become the private-cloud default.** Apple PCC and Google PAIC are setting the expectation that "hosted" must be verifiable.
5. **Open source agents add write approval and trust tiers.** Hermes already has write approval; OpenClaw has trust exclusion. Encryption at rest and per-model consent will come next, or will be left to a layer like ours.

## A. Copy list (top 10 from Part A)
1. Per-answer "Sources" with inline correct / delete / not-relevant: ChatGPT ([release notes](https://help.openai.com/en/articles/6825453-chatgpt-release-notes)).
2. Staged write approval with `/memory pending|approve|reject` and visible notifications: Hermes ([docs](https://hermes-agent.nousresearch.com/docs/user-guide/features/memory)).
3. Injection and invisible-Unicode scanning on every memory write: Hermes ([docs](https://hermes-agent.nousresearch.com/docs/user-guide/features/memory)).
4. Trust-tier exclusion (untrusted or unsigned files never enter context automatically) plus a `doctor` listing: OpenClaw ([docs](https://docs.openclaw.ai/concepts/memory)).
5. Imports land in a quarantine folder, with a dry-run preview, conflict flags, a verified backup and an overflow report: OpenClaw and Hermes ([OpenClaw](https://docs.openclaw.ai/concepts/memory), [Hermes migration](https://github.com/agent-pablo/hermes-agent-15-03-2026/blob/main/docs/migration/openclaw.md)).
6. `request_scope_access` MCP tool: the agent asks, it can't take: Vana ([MCP doc](https://docs.vana.org/applications/mcp)).
7. A per-scope derived encryption key, plus an activity feed of every MCP call: Vana ([storage](https://docs.vana.org/protocol-reference/storage-encryption), [MCP](https://docs.vana.org/applications/mcp)).
8. Separate "auto" and "custom" memories, plus an "auto update" freeze switch: Proton Lumo ([support](https://proton.me/support/lumo-memory)).
9. A copy-paste migration prompt with a fixed line format, then "See what Claude learned about you": Claude ([help](https://support.claude.com/en/articles/12123587-import-and-export-your-memory-from-claude)).
10. Time-boxed, purpose-bound grants ("48 hours, rental agency"): Inrupt ([blog](https://www.inrupt.com/blog/why-were-excited-about-solid-and-mcp)).

## A. Avoid list
1. Rewriting memories silently and keeping a separate memory store that survives chat deletion: ChatGPT ([TechTimes](https://www.techtimes.com/articles/317840/20260605/chatgpt-memory-dreaming-update-openai-rewrites-personalization-engine-limits-audit-trail.htm)).
2. Memory that doesn't record its source, with no trust tiers, which invites poisoning: OpenClaw ([Palo Alto](https://www.paloaltonetworks.com/blog/network-security/why-moltbot-may-signal-ai-crisis/)).
3. Public on-chain consent metadata and revocations that aren't reflected on-chain: Vana ([grants](https://docs.vana.org/protocol-reference/grants-permissions)).
4. Feeding imported data into training by default, and splitting controls across two settings surfaces: Gemini ([9to5Google](https://9to5google.com/2026/03/26/gemini-import/), [blog](https://blog.google/innovation-and-ai/products/gemini-app/switch-to-gemini-app/)).
5. Encrypted but unexportable ("zero-access" but locked in): Lumo ([support](https://proton.me/support/lumo-memory)).

## A. Gaps nobody fills
- **A receipt per destination model.** ChatGPT shows which memories shaped an answer, but nobody shows *which model or provider received which facts*.
- **Consent by kind of information × destination.** Vana has scopes and Inrupt has purpose, but neither distinguishes "local model vs hosted provider".
- **A clean, lossless export in an open format from any incumbent.**
- **Encryption at rest for open source agent memory** (OpenClaw and Hermes files are plaintext).
- **A weekly plain-language summary** of what agents learned and shared.
- **One memory that works across ChatGPT, Claude, Gemini and local agents at once.** Each incumbent only imports *into itself*.

---

# PART B: How open source (and open-format) products beat funded closed rivals

## B1. Bitwarden (vs LastPass, 1Password)

- **Scale.** More than 15M users and 80,000 businesses in 180 countries (press release, 28 Jul 2026). New business subscriptions grew more than 70% year on year in Q2 2026 ([BusinessWire](https://www.businesswire.com/news/home/20260728388256/en/)). 10M users at the end of 2024 ([BusinessWire](https://www.businesswire.com/news/home/20250129567175/en/Bitwarden-Achieves-Landmark-Growth-in-2024)).
- **Funding and revenue.** $100M led by PSG in 2022, about $120M total ([PitchBook](https://pitchbook.com/profiles/company/399608-65), [Tracxn](https://tracxn.com/d/companies/bitwarden/__Wr4BfTdoN3fZLVBG76ljKenhHDOw4MAqh0qseTh1JR4)). Revenue is not public; one profile says revenue nearly doubled in a year ([Fast Company](https://www.fastcompany.com/91117788/how-bitwarden-is-fending-off-tech-giants)).
- **Free tier boundary.** Unlimited passwords and **unlimited devices**, all apps, passkeys, Send, and sharing with one other person ([pricing](https://bitwarden.com/pricing/)). The paid line sits at "extras": TOTP, attachments, emergency access, health reports, hardware 2FA. Premium is now $19.80 a year, Families $47.88 a year for 6 users, Teams $4 per user per month, Enterprise $6 per user per month ([pricing](https://bitwarden.com/pricing/)). Premium was historically $10 a year **[prior knowledge]**.
- **Distribution moments.**
  - **March 2021:** LastPass limited free users to one device type, and Bitwarden became "one of the only free password managers" syncing across unlimited devices ([gHacks](https://www.ghacks.net/2021/02/16/lastpass-free-will-be-severely-limited-on-march-16-2021/), [LastPass blog](https://blog.lastpass.com/2021/02/changes-to-lastpass-free)).
  - **December 2022:** the LastPass vault breach ([9to5Google](https://9to5google.com/2022/12/23/lastpass-export-passwords-file/)). The lesson: be the obvious free and safe answer when the incumbent stumbles, with an importer ready.
- **Trust signals.** Annual third-party code audits and penetration tests for each client. ISO 27001, SOC 2 Type II, SOC 3, HIPAA. A HackerOne bounty. FedRAMP in progress. A published security whitepaper ([compliance](https://bitwarden.com/compliance/)). Audit reports are public **[prior knowledge: Cure53 since 2018]** ([is-bitwarden-audited](https://bitwarden.com/help/is-bitwarden-audited/)).
- **Self-host vs hosted.** Self-hosting is available. The community Rust re-implementation, Vaultwarden, gives homelabbers a free path that still feeds the official client ecosystem **[prior knowledge]** ([Vaultwarden discussion](https://github.com/dani-garcia/vaultwarden/discussions/5115)). Enterprise gets on-premises deployment ([pricing](https://bitwarden.com/pricing/)).
- **Enterprise path.** Bottom-up adoption by individuals, then Teams with event logs, SCIM and directory sync, then Enterprise with SSO and policies. A **free Families plan for every Enterprise user** turns employees into home users ([pricing](https://bitwarden.com/pricing/)). Partner-sourced ARR was reportedly up 50% ([BusinessWire](https://www.businesswire.com/news/home/20260728388256/en/)).
- **Trust wobble to avoid.** In Oct 2024 a non-free SDK licence slipped into the desktop client, and the community revolted. Bitwarden reverted the SDK to GPLv3 within about two weeks ([The Register](https://www.theregister.com/2024/11/04/bitwarden_gpls_password_manager/), [Phoronix](https://phoronix.com/news/Bitwarden-Open-Source-Concerns)). Store builds reportedly moved to a commercial licence, with GPL builds kept on GitHub **[date unverified]** ([Linuxiac](https://linuxiac.com/bitwarden-moves-official-app-builds-to-commercial-license-keeps-gplv3-version/)).

## B2. Obsidian (vs Notion, Evernote). Note: the app is *not* open source

- **What won.** Local Markdown files ("free without limits", no sign-up) plus a huge plugin ecosystem. The format is open even though the code isn't, and its "file over app" philosophy is the trust signal **[prior knowledge]** ([stephango.com/file-over-app](https://stephango.com/file-over-app)).
- **Pricing.** Free for everyone, including commercial use since Feb 2025 **[secondary]**. Commercial licence is $50 per user per year and **optional**. Sync $4 per month (annual), Publish $8 per site per month, Catalyst $25 one-off for early access and badges, 40% off for students and nonprofits ([pricing](https://obsidian.md/pricing)). Money is only for *convenience* (sync, publish) and *supporter identity* (Catalyst).
- **Ecosystem.** 9,165 plugins and 901 themes ([community.obsidian.md](https://community.obsidian.md/)); more than 120M plugin downloads. On 12 May 2026 Obsidian launched a directory with automated scanning of every version, scorecards, and planned permission disclosures (network, filesystem, clipboard) plus team allow-lists ([Obsidian blog](https://obsidian.md/blog/future-of-plugins/)).
- **Trust signals.** Cure53 audit of the app (Oct 2024) ([blog](https://obsidian.md/blog/cure53-second-client-audit/)). Cure53 and Trail of Bits audits of Sync published May 2026, *including the unresolved issues* ([blog](https://obsidian.md/blog/cure53-tob-sync-audits/)). No telemetry; E2EE sync ([pricing](https://obsidian.md/pricing)).
- **Company.** No VC, team of about 10 **[secondary]**. Users "over 4M" per the CEO **[secondary]**. Revenue estimates range from $2M to $25M ARR **[unverified]** ([OperatorBook](https://www.operatorbook.dev/stories/obsidian-revenue-estimates-2m-to-25m)).
- **Enterprise path.** Weak by design: an optional licence. "Teams" plugin management is still a plan ([blog](https://obsidian.md/blog/future-of-plugins/)).

## B3. Signal (vs WhatsApp, iMessage)

- **Structure and cost.** A nonprofit foundation. Running costs are about $50M a year according to Whittaker ([Bloomberg](https://www.bloomberg.com/features/2026-meredith-whittaker-weekend-interview/)). 2024 filings reportedly show $29.4M revenue against $38.0M expenses **[secondary]** ([sqmagazine](https://sqmagazine.co.uk/signal-statistics/)). Funding is about 70% large donors and 30% small monthly donors **[secondary]**.
- **Users.** 70–100M monthly active users (Apr 2025, via secondary sources) ([sqmagazine](https://sqmagazine.co.uk/signal-statistics/)).
- **Distribution.**
  - **The protocol as a Trojan horse.** WhatsApp adopted the Signal Protocol, which made "Signal-grade encryption" the industry reference **[prior knowledge]** ([signal.org/blog/whatsapp-complete](https://signal.org/blog/whatsapp-complete/)).
  - **Catching a rival's trust shock.** WhatsApp's January 2021 policy change, followed by Musk's "Use Signal" and Snowden and Dorsey amplifying it, took Signal from about 810k installs on Jan 10 (18x) to roughly 30M users by late January ([CNBC](https://www.cnbc.com/amp/2021/01/12/signal-telegram-downloads-surge-after-update-to-whatsapp-data-policy.html), [Fortune](https://fortune.com/2021/02/02/signal-telegram-downloads-surge-facebook-messenger-whatsapp-chat-apps-privacy/)).
- **Trust signals.** Open source; publishes subpoena responses showing it can hand over only account creation date and last connection **[prior knowledge]** ([signal.org/bigbrother](https://signal.org/bigbrother/)).
- **Paid tier.** First paid product in Sep 2025: Secure Backups. Free covers text plus 45 days of media; $1.99 a month covers full media. Recovery key generated on the device ([Signal blog](https://signal.org/blog/introducing-secure-backups/), [TechCrunch](https://techcrunch.com/2025/09/08/signal-introduces-free-and-paid-backup-plans-for-your-chats)). This is the convenience-only model, applied to backup.
- **Enterprise path.** None official. Governments and journalists adopted it bottom-up.

## B4. Proton (vs Gmail, Google, Microsoft)

- **Origin and scale.** Launched by crowdfunding from 10,000 people. More than 100M accounts, no VC dependence ([Proton blog](https://proton.me/blog/proton-100-million-accounts)). More than 50,000 organisations on Proton for Business ([business updates](https://proton.me/blog/proton-business-updates)). The non-profit Proton Foundation has been the controlling shareholder since June 2024 ([Proton blog](https://proton.me/blog/proton-non-profit-foundation)). Revenue is not public (estimates vary from $15M to $105M **[unverified]**).
- **Free tier boundary.** One address, 1 GB mail (500 MB doubled by completing setup tasks), 150 sends a day, 5 GB Drive (2 GB boosted), Pass with 2 vaults and 10 aliases ([free plan limits](https://proton.me/support/free-plan-limits), [plans](https://proton.me/support/proton-plans)). Unlocking storage through onboarding tasks teaches people the product.
- **Bundle strategy.** One account, many apps (Mail, VPN, Drive, Pass, Calendar, Lumo, Authenticator). Each app is a new front door, and the paid Unlimited bundle is the upsell ([plans](https://proton.me/support/proton-plans)). VPN Free is unlimited data and a famous acquisition channel **[prior knowledge]**.
- **Trust signals.** All apps open source; Securitum audits of every app, with reports published ([Proton blog](https://proton.me/blog/security-audit-all-proton-apps)). Swiss jurisdiction, and a foundation that owns the company.
- **Enterprise path.** Mail/Pass/VPN "Professional" plans with SSO and SCIM, minimum 3 users. Prices were raised for new business customers in 2024 while existing ones were grandfathered ([business updates](https://proton.me/blog/proton-business-updates)).

## B5. Nextcloud (vs Google Workspace, Microsoft 365)

- **Origin.** Forked from ownCloud in 2016. The founder and most core contributors left, and ownCloud Inc. US shut within hours ([Wikipedia](https://en.wikipedia.com/wiki/Nextcloud)). Lesson: the community follows the maintainers, not the trademark.
- **Growth.** Bookings up more than 50% in 2025, prospect interest tripled, team up 27%. Customers include German states (Schleswig-Holstein, Mecklenburg-Vorpommern), the Austrian Ministry of Economic Affairs and French ministries (one rolling out to 400k, aiming for 1.2M staff) ([2025 wrap-up](https://nextcloud.com/blog/nextcloud-2025-wrap-up/), [community post](https://help.nextcloud.com/t/how-digital-sovereignty-is-accelerating-millions-of-new-enterprise-users-and-over-50-growth-for-nextcloud/242286)). First outside investor, Armira Growth (minority), with €250M+ to be invested in sovereignty over five years ([press](https://nextcloud.com/blog/press_releases/nextcloud-invests-in-digital-sovereignty/)).
- **Distribution.** Hosting partners resell it: IONOS (platinum partner) and Hetzner managed Nextcloud ([Nextcloud × IONOS](https://nextcloud.com/blog/ionos-and-nextcloud-together-for-more-data-sovereignty/), [partners](https://nextcloud.com/partners/)). Positioned as "digital sovereignty" against the US CLOUD Act.
- **Pricing.** Community edition free and full-featured **[vendor claim]**. Enterprise subscriptions (Standard, Premium, Ultimate) at roughly €71–205 per user per year from 100 users, falling with volume **[secondary]** ([MassiveGRID](https://massivegrid.com/blog/nextcloud-enterprise-vs-community-edition/)). Enterprise customers pay for support, LTS, scale and compliance, not code.
- **Lesson.** Policy tailwinds (sovereignty) combined with resellers beat direct marketing for organisations.

## B6. Home Assistant (vs Google Home, Alexa, SmartThings)

- **Scale.** 2M+ homes; 21,000+ contributors in 2024, "the most active open source project on GitHub" ([State of the Open Home 2025](https://home-assistant.io/blog/2025/04/16/state-of-the-open-home-recap/)). Opt-in analytics show 741k installs, with fewer than a quarter of users opting in ([analytics](https://analytics.home-assistant.io/)). About 2.7M homes is a secondary estimate **[unverified]**.
- **Structure.** The Open Home Foundation (a Swiss Stiftung) owns 240+ projects. Nabu Casa, the for-profit, sells Cloud and hardware and funds the Foundation. It avoids the startup/VC model ([recap](https://home-assistant.io/blog/2025/04/16/state-of-the-open-home-recap/), [Nabu Casa about](https://nabucasa.com/about)).
- **Convenience subscription.** Home Assistant Cloud, being renamed **Home Assistant Link** in 2026.12, provides remote access, Alexa/Google bridges, cloud speech-to-text, encrypted backups and human support. It is optional, "always run locally". Encrypted with only the user holding the key; most profits go to the Foundation ([HA blog, Oct 2026](https://home-assistant.io/blog/2026/10/02/big-tech-ruined-the-cloud-so-were-renaming-ours/)). £6.50 a month or £65 a year with a 31-day trial **[secondary]** ([tbreak](https://tbreak.com/home-assistant-link-replaces-cloud/)). One subscription per installation ([Nabu Casa support](https://support.nabucasa.com/hc/en-us/articles/26178633145885-Can-I-use-a-single-account-for-multiple-Home-Assistant-installations)).
- **Onboarding through hardware.** Home Assistant Green ($99 at launch in Sep 2023) means plugging in Ethernet and opening a browser, with no flashing ([HA blog](https://home-assistant.io/blog/2023/09/17/home-assistant-green-your-entry-to-home-assistant)). Voice Preview Edition costs $59 ([HA blog](https://home-assistant.io/blog/2024/12/19/voice-preview-edition-the-era-of-open-voice)).
- **Ecosystem flywheel.** "Works with Home Assistant" certification, now under the Foundation. Partners commit to long-term support and local control, with a goal of certified options for every device type ([HA blog](https://www.home-assistant.io/blog/2024/08/08/works-with-home-assistant-becomes-part-ohf/), [recap](https://home-assistant.io/blog/2025/04/16/state-of-the-open-home-recap/)).
- **Copy.** The naming lesson: "Cloud" confused people into thinking their home depended on the cloud, so they renamed it "Link" ([HA blog](https://home-assistant.io/blog/2026/10/02/big-tech-ruined-the-cloud-so-were-renaming-ours/)).

## B. Cross-cutting patterns
1. **The free tier is the full product for one person.** Bitwarden gives unlimited devices; Obsidian gives everything local. Money comes from convenience (sync, backup, remote access), sharing (families, teams), and organisational controls (SSO, SCIM, policies, audit logs).
2. **They win on a rival's trust shock,** and only because they were already credible and had importers ready: LastPass 2021/2022, WhatsApp 2021.
3. **They publish audits, including the unflattering parts.** Obsidian publishes unresolved issues; Bitwarden and Proton publish per-app reports.
4. **Ownership structures promise durability.** Signal Foundation, Proton Foundation, Open Home Foundation.
5. **Hardware or a hosting partner carries non-technical people over the setup gap.** HA Green; IONOS and Hetzner for Nextcloud.
6. **Ecosystems need curation.** Obsidian's scanning and permission disclosures; HA's certification program.
7. **Licence purity is load-bearing.** Bitwarden's 2024 SDK episode shows how fast trust erodes.

## B. Playbook: 10 concrete moves to become the default open source personal-AI-context product

1. **Make the free tier the whole product for one person, on every device.** Local vault, the door, consent, receipts, importers: all free and unlimited. Charge only for hosted encrypted sync, recovery, an always-on hosted door, and family or team sharing. Write the boundary in one sentence on the pricing page, as Bitwarden does ([pricing](https://bitwarden.com/pricing/)).
2. **Ship one-click importers before the next incumbent trust shock.**
   - **What to import:** ChatGPT/Claude ZIPs, the Claude-style migration prompt, OpenClaw and Hermes workspaces.
   - **How imports land:** quarantined, with dry-run preview, a verified backup and a delete-per-batch control (Gemini/OpenClaw pattern).
   - **Why it matters:** this is how Bitwarden caught LastPass's 2021 and 2022 exits.
   - Also keep a "switching from X" landing page ready for each incumbent.
3. **Be the security layer the agent ecosystem lacks, and say so.**
   - **Encrypt at rest** the files OpenClaw and Hermes write as plaintext.
   - **Gate writes:** trust tiers, plus injection and invisible-Unicode scanning on every write (Hermes's pattern).
   - **Publish a hardening comparison** citing the OpenClaw poisoning research.
   - **Upstream it:** offer PRs to OpenClaw and Hermes so their users get the door with one config line.
4. **Publish audits early and annually, unresolved findings included.** Commission Cure53 or Trail of Bits before 1.0 (the Obsidian 2026 Sync audit model). Add a bug bounty. Then pursue SOC 2 and ISO 27001 for the hosted tier, because organisations buy on certificates (Bitwarden).
5. **Make receipts the hero feature: show them on every answer and every week.**
   - **Per answer:** copy ChatGPT's per-answer Sources, but add *destination*: "This answer from Claude 4 via Anthropic API received: 3 work facts, 0 health facts".
   - **Per week:** a plain-language summary.
   - **Proof:** an attestation, like Apple and Google, for the hosted door, publishing what code runs.
6. **Put progressive consent in the language of purpose and time.**
   - **Grant shape:** per agent × kind of information × destination, with Inrupt-style time-boxed grants and a Vana-style `request_scope_access` tool.
   - **Defaults:** local model gets work facts; hosted model asks first; health and finance always ask.
   - **One clear prompt:** "Claude wants your work notes for this chat, sent to Anthropic. Allow once / for this project / always."
7. **Lock in neutrality with structure and licence.** A foundation or steward-owned entity holds the code and trademark, with the commercial company as service provider (Proton and HA). Use a plain OSI licence everywhere, including the SDK, and never repeat Bitwarden's 2024 mistake ([The Register](https://www.theregister.com/2024/11/04/bitwarden_gpls_password_manager/)).
8. **Lower the setup gap for ordinary people with partners, not just docs.**
   - **Installer:** a desktop app that runs the local door with zero config.
   - **Always-on door:** a "Link"-style subscription, named so nobody thinks their memory "lives in our cloud" (HA's rename lesson).
   - **Hosting:** 1-click images for Hetzner, IONOS and DigitalOcean (the Nextcloud reseller model).
   - **Later:** a cheap plug-in box or NAS app (the HA Green model).
9. **Build a curated connector and plugin ecosystem with a certification badge.**
   - **Badge:** "Works with [product]" for agents and apps that read through the door, honour consent, and write proposals rather than direct edits (the HA certification model).
   - **Gate:** a connector SDK where a new source takes about 10 minutes (Vana DataConnect), scanned per version with permission disclosures (the Obsidian 2026 directory).
10. **Run the enterprise path bottom-up, then sell controls and sovereignty.**
    - **Free for staff:** employees use the free product.
    - **Teams tier:** SSO, SCIM, org-level destination policies ("no customer data to hosted models outside EU"), and exportable audit of receipts.
    - **Home benefit:** a free family plan for every enterprise seat (Bitwarden).
    - **Public sector:** sell through EU sovereignty buyers and resellers (Nextcloud).
    - **Support revenue:** the paid line is support and LTS, never features the individual needs.

---

## Overall threat summary
| Product | Threat | Why |
|---|---|---|
| Vana | Medium-High | Closest architecture (local server, MCP, grants, access log, importers); held back by crypto and pay-per-read |
| Gemini / Personal Intelligence | High (ordinary people) | Already holds email, photos and calendar; zero setup; import tools |
| Apple Siri AI | High (iPhone users) | On-device default, trusted brand; closed |
| ChatGPT memory | High gravity, Low direct | The lock-in we oppose; best provenance UX |
| Claude memory | Medium | Plain-text friendly; could ship cross-app MCP memory |
| Proton Lumo | Medium (privacy consumers) | Owns "private" brand; no export |
| Hermes / OpenClaw | Medium, partners | Their files are our format; security gaps are our opening |
| Inrupt | Low-Medium | Enterprise-only via banks; slow |
| Google PAIC | Low | Infrastructure for Gemini |
