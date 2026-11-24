# Teardown 1: funded, closed consumer products

Researched 24 November 2026. Each claim has a source. **[unverified]** means the source is a press release, a competitor, marketing copy, or secondary coverage that I could not confirm against a primary source. None of these products publishes source code, so nothing here was checked against code.

---

## 1. Egoist Machines: AI Passport (ego.ist)

### 1.1 What it is
- A permission-based context and identity layer for consumers. It keeps memories and linked sources in one "passport" that AI apps can read only under passes the owner grants. Tagline: "one memory layer for every AI you allow." ([ego.ist](https://ego.ist))
- **Who it's for:** non-technical consumers first ("you don't need to be a privacy expert"). It also sells to B2B2C partners and startups. ([ego.ist](https://ego.ist), [ego.ist/startups](https://ego.ist/startups))
- **Stage and launch:** beta with a waitlist in summer 2026; public launch press release dated 7 October 2026 ([GlobeNewswire via Manila Times](https://www.manilatimes.net/2026/10/07/tmt-newswire/globenewswire/egoist-machines-ai-passport-goes-live-today-only-way-to-make-your-personal-context-portable-across-ai-assistants-like-chatgpt-claude-muse-and-gemini-but-still-owned-by-you/2440954)). Product Hunt launch covered on 10 November 2026 ([aitoolly](https://aitoolly.com/ai-news/article/2026-11-10-egoist-ai-passport-launches-to-unify-personal-context-and-privacy-across-ai-assistants)). The iOS app went 1.0 on 31 August and reached 2.0.2 on 11 November ([App Store](https://apps.apple.com/app/ai-passport/id6789639369)).
- **License:** proprietary and closed. I found no public repo.
- **Funding:** $3M seed from Y Combinator (S26) and Goodwater Capital, plus a European family office and scientists from DeepMind and Meta ([press release](https://www.manilatimes.net/2026/10/07/tmt-newswire/globenewswire/egoist-machines-ai-passport-goes-live-today-only-way-to-make-your-personal-context-portable-across-ai-assistants-like-chatgpt-claude-muse-and-gemini-but-still-owned-by-you/2440954), [TheSaaSNews](https://www.thesaasnews.com/news/egoist-machines-raises-3m-seed/)).
- **Traction (all self-reported, [unverified]):** "41% week-over-week growth," "more than 10 B2B2C pilots, each with over 1 million users," and "800 connectors" ([press release](https://www.manilatimes.net/2026/10/07/tmt-newswire/globenewswire/egoist-machines-ai-passport-goes-live-today-only-way-to-make-your-personal-context-portable-across-ai-assistants-like-chatgpt-claude-muse-and-gemini-but-still-owned-by-you/2440954)). The App Store shows too few ratings to display a score ([App Store](https://apps.apple.com/app/ai-passport/id6789639369)).
- **Team:** 3 people, based in London (Cambridge roots). Erin McGurk (CEO; Cambridge Economics and Law). Dr David Khachaturov (CTO; Cambridge CS PhD, ex-OpenAI ML researcher on PaperBench, ex-lead AI security researcher at FrontierOne) ([YC profile](https://www.ycombinator.com/companies/egoist-machines)).
- **Sister products:** Ink, which rewrites ChatGPT or Claude drafts in your voice; Domovoy, a home computer with a $199 reservation and a planned price of $2,999; and a Passport Keyboard on iOS ([ego.ist](https://ego.ist), [YC](https://www.ycombinator.com/companies/egoist-machines), [App Store](https://apps.apple.com/app/ai-passport/id6789639369)).

### 1.2 How it works
- **Architecture:** hosted service. The owner console is my.ego.ist, the OAuth/OIDC authorization server and MCP server is passport.ego.ist, and there is an iOS app ([docs/agents](https://ego.ist/docs/agents)).
- **Data model:**
  - Memories are statements typed by category. Categories seen in the docs: `fact`, `preference`, `project`, `event`, and `other`. Unknown values and `instruction` are remapped to `other`.
  - Connector data uses separate categories: `email.messages`, `calendar.events`, `fitness.activities`, `fitness.samples`.
  - "Protected items," such as date of birth or health notes, sit in a separate tier with their own approval flow.
  - Source: [llms-full.txt](https://ego.ist/llms-full.txt).
  - There is no plain-file format. Owner export format is undocumented. Partner workspace export is "the full JSON" ([llms-full.txt](https://ego.ist/llms-full.txt)).
- **Encryption** ([ego.ist/trust](https://ego.ist/trust)):
  - **Session:** "Your session is sealed with AES-256-GCM and lives only in an encrypted, server-side cookie."
  - **Chat history:** "encrypted at rest with a separate key per conversation"; "private vault turns are never stored at all."
  - **Memory Lock (opt-in):** "your memory stores are sealed with keys derived from your own passkey. Every category gets its own key." Deletion "shreds the keys themselves" (crypto-shredding). No KDF or cipher is named.
  - **Without Memory Lock:** key custody is undocumented. Assume the server holds the keys.
  - **Lock states exposed to agents:** `open`, `sealed_auto_unlock`, `sealed_owner_unlock_required`, `unknown`. Owners unlock at `my.ego.ist/memory-lock` ([docs/agents](https://ego.ist/docs/agents), [llms-full.txt](https://ego.ist/llms-full.txt)).
  - **iOS:** "an encrypted copy of memories stays on the iPhone with offline search" ([App Store](https://apps.apple.com/app/ai-passport/id6789639369)).
- **Inference:** runs "on GPUs we control, inside a container that cannot reach the internet," so no third-party model provider sees prompts ([trust](https://ego.ist/trust)).
- **Credential isolation:** tokens for linked sources stay inside Passport; apps never receive them ([trust](https://ego.ist/trust)).
- **Sync and recovery:** the server is the source of truth. Recovery after losing the Memory Lock passkey is undocumented. "Only you hold the way back in" implies there is none ([trust](https://ego.ist/trust)).
- **Retention:** Garmin items are deleted within 30 days. A salted IP hash with a daily salt is pruned within 3 days. Messaging receipts and tombstones are kept 30 days. Everything else is kept "as long as reasonably necessary" ([privacy policy](https://ego.ist/privacy-policy), [llms-full.txt](https://ego.ist/llms-full.txt)).

### 1.3 How agents connect
- **MCP:** streamable HTTP at `https://passport.ego.ist/mcp` with a bearer token ([docs/agents](https://ego.ist/docs/agents)). Tools:
  - `passport_status`: "call first." Returns scopes, client id and verification status, memory lock state, categories, this app's passes, linked connectors and connector passes. A `passes_known: false` field distinguishes "lookup failed" from "no passes."
  - `recall`: reads memory, or live connector data via `connectors: [{connector, data_category}]`.
  - `remember`: creates a **proposal** in the owner's Inbox, not a memory. The tool replies: "It will be available to other apps only after the owner approves it and grants a category pass" ([llms-full.txt](https://ego.ist/llms-full.txt)).
  - Agent-messaging tools: `passport_register_agent`, `passport_send_message`, `passport_propose_collaboration`, `passport_receive_messages`, `passport_ack_message`, and others ([llms-full.txt](https://ego.ist/llms-full.txt)).
  - HTTP: `POST /memory/v1/recall`, which reads governed memory only.
- **Three ways for an agent to authenticate** ([docs/agents](https://ego.ist/docs/agents)):
  1. **Hosted apps:** OAuth with a Client ID Metadata Document (CIMD) and the `ai-passport-signin` SDK. Automatic admission when redirect hosts match the document host.
  2. **Headless or local agents:** RFC 8628 device flow. User codes are `XXXX-XXXX` and expire in 10 minutes. Loopback redirects are refused with `unauthorized_client`.
  3. **Owner-minted connect code:** one use, 10-minute expiry, for the families `openclaw`, `hermes`, `opencode`, `muse`, `other`. Returns a token scoped to `memory` only.
- **Scopes:** `openid`, `profile`, `email`, `memory`; purpose scopes `booking:actions` and `connector:reads`. "There is no wildcard scope" ([docs/sign-in](https://ego.ist/docs/sign-in)).
- **Consumer assistants:**
  - a published ChatGPT plugin;
  - a listing in Claude's connector directory;
  - Gemini, Grok and Perplexity as custom connectors with custom instructions;
  - Meta Muse via its MCP connector;
  - coding agents via "Switchboard" (Claude Code, OpenCode, Codex, Cursor).
  - Sources: [llms-full.txt](https://ego.ist/llms-full.txt), [usecarly review [competitor, unverified]](https://www.usecarly.com/blog/egoist-ai-passport/).
- **Partner API:** source-attributed memory ingestion, delegated tokens, RFC 8936 lifecycle events. Partner MCP at `/partner/v1/mcp` with `workspace_save`, `workspace_recall`, `workspace_list`, `workspace_forget`. Partner-pushed records **skip the owner's Inbox** ("They do not pass through the owner's review inbox") ([changelog](https://ego.ist/docs/changelog), [llms-full.txt](https://ego.ist/llms-full.txt)).
- **Distribution for agents:** `/llms.txt`, `/llms-full.txt` (about 485k characters), `/llms-install.md` (an install prompt), and `/partner-openapi.json` ([docs/agents](https://ego.ist/docs/agents)).

### 1.4 Consent and control (the core of the product)
- **Permission object, the "pass":** one app, one category, one purpose, one duration. Durations are one-time (`once_only`), session, or permanent. "Expired passes never silently become permanent." Connector passes and protected-memory approvals are separate objects from memory passes ([docs/agents](https://ego.ist/docs/agents), [trust](https://ego.ist/trust)).
- **Health-category scopes expire after 24 hours** ([llms-full.txt](https://ego.ist/llms-full.txt)).
- **Leases:** short-lived and "renew only while the pass stands"; "revoking a pass cuts access on its next request" ([trust](https://ego.ist/trust)).
- **Three separate consents:**
  1. sign-in consent (scopes);
  2. memory category passes, which can be granted at connect time; categories left unselected go to the Inbox for approval;
  3. memory write approval. "Approving a memory and granting an app read access are separate decisions" ([guides](https://ego.ist/guides/how-to-set-up-your-ai-passport)).
- **Sign-in consent screen** "names your app, the account being signed in, and each thing you asked for in plain language." Per-scope copy ([docs/sign-in](https://ego.ist/docs/sign-in)):
  - `openid`: "Confirm your identity"
  - `profile`: "See your name and profile picture"
  - `email`: "See your email address"
  - `memory`: "Read your AI Passport portable memory"
- **Unverified agents:** a CIMD badge "confirms domain control only, not an endorsement or a memory grant." Device-paired agents always carry an "unverified" warning ([docs/sign-in](https://ego.ist/docs/sign-in)).
- **Missing pass:** the agent gets a link to show the owner, and the tool says "this app needs the user's approval for this category." Recall outcome states: `approval_required`, `locked`, `unlock_url`, `sealed_owner_unlock_required`, `sealed_auto_unlock`, `open`, `unknown`, `unavailable` ([docs/agents](https://ego.ist/docs/agents)).
- **Connector interstitial:** asks one question. "Yes" mints a category pass that lasts until revoked; "No" closes the flow ([llms-full.txt](https://ego.ist/llms-full.txt)).
- **Auto-approve:** owner-configured rules can auto-approve. A "hands-off posture" mints exact permanent passes automatically on first read ([llms-full.txt](https://ego.ist/llms-full.txt)).
- **Agents cannot approve themselves:** approvals need "a signed-in browser session, which a connected AI never holds" ([trust](https://ego.ist/trust)).
- **Directed disclosure** ([docs/directed-disclosure](https://ego.ist/docs/directed-disclosure)) sends protected fields straight to one exact HTTPS origin and path, never through the agent.
  - The approval sheet (native on iOS, browser fallback) shows the item label and type, the requesting app, the exact destination host, the field names, the reason, and the expiry. It never shows the values.
  - `purpose` is `directed_disclosure` or `travel_booking`.
  - Delivery carries a signed `Passport-Disclosure-Attestation` header (120-second lifetime, single-use `jti`) and an `Idempotency-Key`. It is at-most-once; a 5xx is never retried.
  - Status values: `pending`, `approved`, `rejected`, `expired`, `failed`.
- **Owner surfaces** in my.ego.ist: Inbox (`/inbox`), Passes (`/passes`), Assistants, Connectors, Memory Lock, Device (`/device`) ([llms-full.txt](https://ego.ist/llms-full.txt)). The iOS app has an "access log: view which apps used your data and when" ([App Store](https://apps.apple.com/app/ai-passport/id6789639369)).
- **Receipts are content-free:** "what happened and when, never the memory text or the query" ([trust](https://ego.ist/trust)). The owner therefore cannot see *what* an agent received, only that a read happened.
- **Honest copy about revocation limits:** revocation "cannot remove information already delivered into another service's conversation" ([guide](https://ego.ist/guides/what-is-ai-passport-and-how-does-it-work)).
- **Partner controls:** the owner can "forget all memories from a single partner source," even after the delegation has been severed ([changelog](https://ego.ist/docs/changelog)).

### 1.5 Onboarding and UX
1. Claim a passport and handle at my.ego.ist; email-code sign-in ([ego.ist](https://ego.ist)).
2. Optionally download the iOS app.
3. In ChatGPT or Claude, add AI Passport from the plugin or connector directory, click **Connect**, and complete the sign-in handoff. Pick categories on the consent screen; the guide warns against selecting everything.
4. Ask the assistant to "save this to AI Passport." The guide warns that "Remember this" may go to the assistant's own memory.
5. Approve or edit the proposal in the Inbox.
6. Test recall in a fresh chat.
7. Review Passes and revoke test passes.

Steps 3 to 7 come from [the setup guide](https://ego.ist/guides/how-to-set-up-your-ai-passport) ("4 min read").

Content marketing is strong: 32 consumer guides, such as "What does ChatGPT know about me?" and "Can your employer see your AI chats" ([guides](https://ego.ist/guides)). Time to value is roughly minutes for a single preference **[unverified estimate]**.

### 1.6 Business model
- **Consumers:** free. The App Store says "Free to use forever. No subscription or ads." ([App Store](https://apps.apple.com/app/ai-passport/id6789639369))
- **Startups:** 3 months free (6 for YC companies), then a flat $1,000 per month with unlimited users, storage, usage and connectors ([startups](https://ego.ist/startups)).
- **Other revenue:** B2B2C partner pilots and Domovoy hardware. Money comes from businesses, not consumers.

### 1.7 Strengths worth copying
- **The pass:** app × category × purpose × duration, with "expired never silently becomes permanent."
- **`remember` creates a proposal,** and approving a write ≠ granting a read.
- **Recall states agents can act on** (`approval_required` plus an `unlock_url` link for the owner) instead of a bare 403, and `passes_known: false` to separate "unknown" from "none."
- **Agents can never approve:** approval needs a human browser session.
- **Connect codes per agent family** (openclaw/hermes/opencode) and an RFC 8628 device flow for local agents. Self-named agents are flagged "unverified."
- **Directed disclosure:** values go to the destination, never through the LLM.
- **Per-category keys derived from a passkey,** with crypto-shredding on delete.
- **Honest revocation copy.**
- **SEO guides** that answer the questions ordinary people ask about AI privacy.
- **llms-install.md:** a prompt that installs the product through an agent.

### 1.8 Weaknesses and complaints
- **No public complaints:** I found no HN or Reddit threads and no App Store ratings yet.
- **Closed and hosted:** Memory Lock is opt-in, so the default custody is server-side and undocumented.
- **Content-free receipts:** the owner cannot see what text a model actually received.
- **Partner ingestion skips the Inbox,** which contradicts the review-first promise.
- **"Hands-off posture"** quietly mints permanent passes.
- **Hard to explain:** three overlapping consent layers (scopes, passes, protected approvals), and the docs warn users not to select every category.
- **Surface sprawl** for a 3-person team: Ink, Keyboard, Domovoy, messaging, Switchboard, partner API, booking.
- **No documented recovery** for a lost passkey.
- **iOS keyboard** sends "the last typed sentence" to the server when the Event category is on ([privacy](https://ego.ist/privacy-policy)).
- **Unaudited claims:** no audits and no open source.
- A competitor ([Carly](https://www.usecarly.com/blog/egoist-ai-passport/)) points out that reviewing every memory is extra work.

### 1.9 Threat level: **HIGH**
It is the closest functional match to our consent model: per-app × category × purpose × duration passes, a proposal inbox, receipts, MCP, and connect codes for OpenClaw/Hermes. It is funded, YC-backed, free for consumers, and already in the ChatGPT and Claude directories. Our differentiators against it:
- open source and local files;
- receipts that record **content**;
- the destination dimension (which model or provider);
- user-held keys by default.

---

## 2. First Person Labs: Second (2.computer)

### 2.1 What it is
- "A portable model of you that you own and your agents can use." Background agents watch OS-level computer activity and build a continuously updated user model. It is served to other agents as "the API of you" ([2.computer](https://2.computer), [manifesto](https://2.computer/blog/a-model-of-ones-own)).
- **Who it's for:** heavy AI and agent users on desktop.
- **Stage:** early access with a waitlist. Out of stealth on 17 and 18 November 2026. Liu says it will ship "very soon," with compute and security still being finalised ([dealroom/The Information](https://dealroom.co/news/info-8w2x4g-a-startup-emerges-from-stealth-with-highly-personalized-ai/), [BigGo](https://finance.biggo.com/news/58c78203627bfce6)).
- **Company:** First Person Labs PBC, a public benefit corporation ([2.computer](https://2.computer)).
- **License:** closed for now. "We intend to open-source key components of Second," with no license or timeline given ([manifesto](https://2.computer/blog/a-model-of-ones-own)).
- **Funding:** $10M seed led by a16z's infrastructure team; announcement by Joel de la Garza and Martin Casado ([Ken Liu on X](https://x.com/kenziyuliu/status/2122755334305669625), [a16z](https://a16z.com/announcement/investing-in-first-person-labs/)).
- **Traction:** none disclosed.
- **Team:** Ken Liu (CEO; Stanford AI Lab PhD student, ex-Google DeepMind, works on privacy and memorisation) and Erik Chi (CTO; Stanford, previously Michigan, works on network security and censorship resistance). They co-built the Open Anonymity Project. The company was about seven months old at launch ([a16z](https://a16z.com/announcement/investing-in-first-person-labs/), [dealroom](https://dealroom.co/news/info-8w2x4g-a-startup-emerges-from-stealth-with-highly-personalized-ai/)).

### 2.2 How it works
- **Capture:** reads "the raw stream of events that the OS already gives you": app switches, pauses, typing patterns, WiFi state, plus screen content, keyboard input, files and messages. Audio is opt-in. Mail and chat connectors are merged in ([StartupHub](https://www.startuphub.ai/ai-news/artificial-intelligence/2026/your-ai-second-knows-before-you-have-to-ask), [privacy](https://2.computer/privacy)).
- **Processing:** "always-on background agents" with "ten analyzers" extract "meaningful moments" and mix open and closed models. Liu's cost estimate: about $1,000 per day per agent on Opus pricing, about $60 per day on DeepSeek Flash **[founder estimate]** ([StartupHub](https://www.startuphub.ai/ai-news/artificial-intelligence/2026/your-ai-second-knows-before-you-have-to-ask)).
- **Storage:** "a streaming-state, portable context vault that builds itself." "Runs on your device by default" in a folder you can inspect, edit, back up (iCloud, USB) or move. It might later be trained into weights ([manifesto](https://2.computer/blog/a-model-of-ones-own), [BigGo](https://finance.biggo.com/news/58c78203627bfce6)). The file format is unpublished. Outputs include generated "wikis and to-do lists" ([privacy](https://2.computer/privacy)).
- **Inference is bring-your-own:** a Claude or ChatGPT subscription, your own API key, local models, or FPL's "private inference tokens" ([manifesto](https://2.computer/blog/a-model-of-ones-own)).
- **Two products:**
  - **Second Local:** "FPL does not store or access it."
  - **Second Cloud:** optional, off by default.
  - Source: [privacy](https://2.computer/privacy).
- **Encryption and confidential computing:**
  - "The Second App encrypts information on your device before sending it to Second Cloud." FPL "hold[s] the key only temporarily, in memory, to process requests."
  - Cloud can run in a confidential VM "designed to prevent FPL and its cloud service providers from accessing that information."
  - FPL hosts confidential inference on Nvidia GPUs. Liu argues that "hardware attestation can be verified," whereas a vendor's zero-data-retention promise cannot.
  - Model providers used through FPL have zero-data-retention agreements.
  - Sources: [privacy](https://2.computer/privacy), [StartupHub](https://www.startuphub.ai/ai-news/artificial-intelligence/2026/your-ai-second-knows-before-you-have-to-ask), [manifesto](https://2.computer/blog/a-model-of-ones-own).
- **Recovery:** the folder is the user's to back up. Cloud backup is client-encrypted and compared to iCloud or a password manager. The recovery key design is undocumented.

### 2.3 How agents connect
- "Local and cloud APIs or MCPs." "An agent gets a URL and a key, and the two negotiate what it can access" ([manifesto](https://2.computer/blog/a-model-of-ones-own), [BigGo](https://finance.biggo.com/news/58c78203627bfce6)).
- Named consumers: Codex, "Grokbot," OpenAI Dot, Meta Muse, Instinct ([StartupHub](https://www.startuphub.ai/ai-news/artificial-intelligence/2026/your-ai-second-knows-before-you-have-to-ask), [dealroom](https://dealroom.co/news/info-8w2x4g-a-startup-emerges-from-stealth-with-highly-personalized-ai/)).
- A Cloud-only "text your Second" feature uses a messaging relay. E2E-encrypted sharing with "other Second users you connect with" ([privacy](https://2.computer/privacy)).
- **No public docs, tool names or SDK.**

### 2.4 Consent and control
- The only public description is a metaphor. Your context is a home: some agents can "stay, browse, and do things," while others must request information and you decide what to share ([manifesto](https://2.computer/blog/a-model-of-ones-own)).
- **In-app controls:** pause capture, exclude sources, delete local data, turn Cloud off, delete Cloud data. Product analytics are off by default ([privacy](https://2.computer/privacy)).
- **Liu's framing:** deterministic rules, such as never retaining system passwords, versus judgment calls about who should receive what, which he says will improve only "as models get smarter." He concedes that prompt injection and conversational extraction cannot be fully solved ([StartupHub](https://www.startuphub.ai/ai-news/artificial-intelligence/2026/your-ai-second-knows-before-you-have-to-ask), [BigGo](https://finance.biggo.com/news/58c78203627bfce6)).
- **Not public:** no prompt UI, permission schema, durations, receipts or memory-approval step. The model writes itself; there is no propose-and-approve loop. The user can see the folder and, later, edit it ([BigGo](https://finance.biggo.com/news/58c78203627bfce6)).

### 2.5 Onboarding and UX
- Join the waitlist at 2.computer#join. Nothing else is public.
- By design, time to value is passive: install, grant OS capture permissions, and let it watch. One early user got unprompted updates about a 20% rain forecast and whether to order a tent ([StartupHub](https://www.startuphub.ai/ai-news/artificial-intelligence/2026/your-ai-second-knows-before-you-have-to-ask)).
- Platforms named: Apple, Microsoft and Linux systems **[unverified; Mac is the only one demonstrated]**.

### 2.6 Business model
- Subscriptions, with "no ads, forever." Revenue also from Second Cloud and private inference tokens. No prices published ([dealroom](https://dealroom.co/news/info-8w2x4g-a-startup-emerges-from-stealth-with-highly-personalized-ai/), [manifesto](https://2.computer/blog/a-model-of-ones-own)).
- Asked about ads, Liu said "we don't really know" ([BigGo](https://finance.biggo.com/news/58c78203627bfce6)).

### 2.7 Strengths worth copying
- **Ownership defined as three testable properties:** portability, visibility and editability ([BigGo](https://finance.biggo.com/news/58c78203627bfce6)).
- **Local by default, model as a folder:** the same instinct as ours, and validation of it.
- **Bring-your-own inference** with four options, including your existing ChatGPT or Claude subscription.
- **Attestation over promises:** use verifiable confidential computing rather than "trust our ZDR."
- **Client-side encryption before cloud,** with the server key in memory only.
- **Zero-effort capture:** passive learning gives value without the user curating anything.
- **PBC status and "no ads, forever"** as trust signals.

### 2.8 Weaknesses and complaints
- **No independent reviews or community threads yet** (searched).
- **Ships nothing yet:** no docs or schema.
- **Total-surveillance capture:** screen, keyboard and messages. It is extremely sensitive, a huge prompt-injection surface, and invites a Recall-style backlash **[my inference]**.
- **Inference cost** is very high by the founder's own numbers.
- **No write approval:** the model writes about you without asking.
- **Consent delegated to model judgment.**
- **Open source is only "intended."**
- **Cloud key handling:** FPL holds keys in memory during processing; this is not end-to-end encrypted against a compromised attested service.

### 2.9 Threat level: **HIGH (strategic) / MEDIUM (today)**
It has the best-funded and most credible narrative ("a model of you that you own," local-first, PBC, a16z). It overlaps on local folder, ownership and BYO inference. However, its consent and receipts layer is undefined and the product is not shipping. If it open-sources the vault format, it competes directly with our folder. Our edge:
- explicit per-agent × kind × destination consent;
- receipts;
- approve-before-write;
- cheap operation (no always-on analyzers).

---

## 3. Plurality Network: AI Context Flow (plurality.network)

### 3.1 What it is
- A browser extension and MCP server with "memory buckets" for carrying context across ChatGPT, Claude, Gemini, Grok, Perplexity and DeepSeek, plus a one-click prompt optimiser ([plurality.network](https://plurality.network), [product page](https://plurality.network/ai-context-flow/)).
- **Who it's for:** researchers, analysts, marketers, programmers and students.
- **Company:** Berlin-based, founded 2023. Co-founders Hira Siddiqui and Mujtaba Idrees ([CB Insights](https://www.cbinsights.com/company/plurality/people), [Crunchbase](https://crunchbase.com/organization/plurality-network)).
- **Funding:** a seed of undisclosed size from the Futureverse Base Camp Accelerator, 13 February 2024. Web3 roots: "Smart Profiles" on Oasis Sapphire ([CB Insights](https://www.cbinsights.com/company/plurality/financials)).
- **Traction:** "4k+ users," Chrome Web Store rating 4.99 from 70+ reviews ([product page](https://plurality.network/ai-context-flow/)). AppSumo rating 4.6 from 26 reviews, with lifetime deals at $59, $149 and $339 ([AppSumo](https://appsumo.com/products/ai-context-flow/reviews/), [PH](https://www.producthunt.com/p/ai-context-flow/4-days-left-to-lock-in-your-lifetime-context)).
- **License:** closed.

### 3.2 How it works
- **Storage:** buckets ("encrypted, user-owned container of context") hosted in "a secure cloud" ([docs](https://docs.plurality.network), [privacy](https://plurality.network/privacy-policy/)).
- **Encryption claims conflict:**
  - the FAQ says "end-to-end encrypted";
  - the page says "Built on Trusted Execution Environments" and "MPC";
  - the privacy policy says only "encrypted under the control of the user."
  - Key custody is undocumented ([product page](https://plurality.network/ai-context-flow/), [privacy](https://plurality.network/privacy-policy/)).
- **MCP hosting:** reportedly runs on Oasis ROFL (TEE) **[unverified; the Oasis blog returned 403, claim taken from a search snippet]**.
- **Other features:** version history ("git for AI memories") ([PH](https://www.producthunt.com/p/ai-context-flow/we-built-git-for-ai-memories-version-history-editing-full-data-control)), and shareable spaces with viewer or editor roles.

### 3.3 How agents connect
- **MCP:** `https://app.plurality.network/mcp`, with OAuth or a personal access token. Per-client guides with time estimates ([MCP docs](https://docs.plurality.network/the-plurality-mcp-server/connect-your-agents-via-mcp.md)):
  - ChatGPT, Claude, Claude Code, Cursor, Copilot (OAuth);
  - Windsurf, LM Studio, TypingMind, OpenClaw (PAT).
- **Tool names are not published.**
- **Other surfaces:** Chrome extension; "open APIs and SDKs" (undocumented).

### 3.4 Consent and control
- "Every connection is permission-scoped per agent. Revoke access anytime" ([product page](https://plurality.network/ai-context-flow/)). Agents get **read and write** on permitted buckets; separate read and write is not documented ([MCP docs](https://docs.plurality.network/the-plurality-mcp-server/connect-your-agents-via-mcp.md)).
- **No write approval step.** Agents "write back" directly.
- **No receipts or logs** described.

### 3.5 Onboarding and UX
- Extension: "Nothing to configure, nothing to connect."
- MCP setup takes about 2 minutes: copy URL, add custom connector, OAuth ([product page](https://plurality.network/ai-context-flow/)).
- Reviewers ask for simpler UI and training videos ([AppSumo](https://appsumo.com/products/ai-context-flow/reviews/)).

### 3.6 Business model
- Free: 100 to 200 credits per day, 50 MB.
- Plus: $99/yr, 1,500 credits, 500 MB.
- Pro: $199/yr, 5,000 credits, 5 GB.
- MCP is free on all plans.
- AppSumo lifetime deals.
- Source: [product page](https://plurality.network/ai-context-flow/).

### 3.7 Strengths worth copying
- **Per-client setup guides** with time estimates and the auth type for each client.
- **PAT fallback** for clients without OAuth (OpenClaw, LM Studio).
- **Memory version history.**
- **Buckets** for separating work, personal and health.
- **Free MCP on every tier.**

### 3.8 Weaknesses and complaints
From [AppSumo](https://appsumo.com/products/ai-context-flow/reviews/) unless noted:
- **No bulk export:** "There does not appear to be a simple backup or export of my buckets."
- **Credit lockout:** "the platform is essentially bricked for 24 hours."
- **MCP writes require full overwrites.**
- **Weak organisation:** no sub-folders, tags or sort order.
- **Slow support.**
- **Contradictory encryption claims** across pages.
- **Unnamed LLM providers** used for prompt processing ([privacy](https://plurality.network/privacy-policy/)).

### 3.9 Threat level: **LOW to MEDIUM**
A small team with a lifetime-deal user base. Credit limits and missing export are anti-patterns we beat by design. The prompt optimiser is a distraction.

---

## 4. MemoryPlugin (memoryplugin.com)

### 4.1 What it is
- A paid consumer memory layer: "One memory across 21+ AI tools." It offers saved memories, chat-history import and sync, and Q&A over files ([memoryplugin.com](https://www.memoryplugin.com)).
- **Who it's for:** daily AI users who don't want to self-host or keep Markdown vaults.
- **Traction:** "9,021 users in 77 countries," "90 started a plan in the last 30 days," 4.5 stars from 100+ reviews **[self-reported]** ([memoryplugin.com](https://www.memoryplugin.com)).
- **Company:** Chrome extension published by Crestify Solutions Private Limited ([Chrome Web Store](https://chromewebstore.google.com/publisher/crestify-solutions-privat/u5027742911e0d252fa29cfb0fcd315eb)). Founder self-identifies as "Asad" ([DEV](https://dev.to/memoryplugin/memoryplugin-helps-ai-remember-what-matters-1054)).
- **Funding:** none found; appears bootstrapped **[unverified]**.
- **Launches:** OpenClaw version launched 3 February 2026 ([PH](https://www.producthunt.com/products/memoryplugin-for-openclaw/launches)).
- **License:** closed, apart from open-source agent skills.

### 4.2 How it works
- **Storage:** hosted on US infrastructure. Subprocessors: Supabase (DB), Zilliz (vector index), Vercel, Trigger.dev, Resend ([trust](https://www.memoryplugin.com/trust)).
- **Not end-to-end encrypted:** "MemoryPlugin is not end-to-end encrypted," because the server must search. Data is encrypted at rest and in transit; admin access is logged ([trust](https://www.memoryplugin.com/trust)).
- **AI providers:** OpenAI, Anthropic, xAI, Google, Groq, OpenRouter, Voyage, Cerebras and Inception. "We do not have zero-data-retention agreements with them" ([trust](https://www.memoryplugin.com/trust)).
- **Retention:** backups rotate out in about 30 days. Account deletion by email, within 30 days ([trust](https://www.memoryplugin.com/trust)).
- **Data model:** memory text in buckets. "Smart Memory" categories with summaries. Optional full chat history ([MCP page](https://www.memoryplugin.com/mcp)).

### 4.3 How agents connect
- **Hosted MCP:** `https://www.memoryplugin.com/api/mcp/mcp`. OAuth 2.1 with PKCE and dynamic client registration ([MCP page](https://www.memoryplugin.com/mcp)).
- **14 tools:**
  - memories: `store_memory`, `search_memories`, `get_memories_and_buckets`, `update_or_move_memories`;
  - buckets: `list_buckets`, `create_bucket`, `list_bucket_categories`, `list_category_memories`;
  - chat history: `recall_chat_history`, `get_conversation_summary`, `get_full_conversation`, `export_conversation`, `chat_history_overview`;
  - files: `search_uploaded_files`.
- **Scopes:** `memory:read`, `memory:write`, `chat-history:read`.
- **Other connections:**
  - browser extension (Chrome, Safari, mobile);
  - a custom GPT;
  - TypingMind plugin;
  - OpenAPI;
  - MemoryPlugin Sync for macOS, which syncs Claude Code, Codex and Cursor sessions;
  - agent skills.
- **Importers:** ChatGPT, Claude, TypingMind and Grok exports; live sync for Gemini and DeepSeek. "Export everything at any time" ([memoryplugin.com](https://www.memoryplugin.com)).

### 4.4 Consent and control
- **Marketing:** "Nothing changes without your say-so" applies to curation suggestions (dedupe, stale facts).
- **MCP writes are not gated:** writes are only annotated so clients can ask, and the guidance tells assistants to "lean toward saving" ([MCP page](https://www.memoryplugin.com/mcp)).
- **Controls:** per-chat exclusion and per-chat injection toggle. Revoke tokens in the dashboard. Shared buckets show only that bucket to invitees.
- **No per-agent receipts** described.

### 4.5 Onboarding and UX
- Install the extension or paste the MCP URL. Copy-paste steps for each client, for example `claude mcp add --transport http memoryplugin …` ([MCP page](https://www.memoryplugin.com/mcp)).
- 7-day trial.
- Smart Memory claims to cut injected tokens by "up to 90%."

### 4.6 Business model
- Core: $89/yr (list price $180).
- Pro: $180/yr (list price $300). Adds unlimited history, knowledge graph (beta), insights, shared buckets.
- Monthly and lifetime options also offered.
- 7-day trial and 14-day refund window.
- Source: [pricing](https://www.memoryplugin.com/#pricing).

### 4.7 Strengths worth copying
- **The trust page is radically honest:** it says "not E2E" plainly, names every subprocessor, and states the lack of ZDR agreements. It is the best plain-language trust disclosure in this track.
- **Clean MCP tool catalog** with read and write annotations and three scopes.
- **Chat-history importers** for six platforms, plus the macOS sync for coding agents.
- **Free utility tools** (ChatGPT memory export, chat-to-Markdown) as a funnel.
- **Exclusion that survives re-sync** ("use Exclude").

### 4.8 Weaknesses and complaints
- **Cloud-only, not E2E, no ZDR:** content flows to nine LLM vendors.
- **The main critique in reviews is cloud reliance** ([automateed review](https://www.automateed.com/memoryplugin-for-openclaw-review)). PH users asked whether storage is local and asked for profile switching ([PH reviews](https://www.producthunt.com/products/memoryplugin-for-openclaw/reviews)).
- **Writes are not approved.**
- **Account deletion needs an email to support.**

### 4.9 Threat level: **MEDIUM**
It has real paying users, broad client coverage and good importers. It competes on convenience, not trust, so our local, encrypted, consented story wins against it with privacy-minded users. Its pricing ($89 to $180 per year) is a useful benchmark for our paid convenience tier.

---

## 5. Bot Food: RaLHF (ralhf.ai)

### 5.1 What it is
- A Mac and Windows "context assistant" (pronounced "Ralph"). It logs into your web apps (Netflix, Spotify, Amazon, Uber Eats, Airbnb), files and email, and builds a cloud "Personal Context Library (PCL)" that AIs search over MCP ([ralhf.ai](https://ralhf.ai), [product](https://ralhf.ai/product), [llms.txt](https://ralhf.ai/llms.txt)).
- **Stage:** beta.
- **Company:** Bot Food Corporation, Toronto, about 7 staff. CEO Ian Collins (co-founder of Wysdom, sold to Calabrio in 2024); co-founder and COO Nitin Singhal; CTO Brendan Stennett ([about](https://ralhf.ai/about), [BetaKit](https://betakit.com/bot-food-secures-1-5-million-to-give-ai-users-more-control-over-their-data/)).
- **Funding:** C$1.5M pre-seed led by GreenSky Ventures; about C$3M in total. Dealroom says US$1.1M, so the figures conflict ([BetaKit](https://betakit.com/bot-food-secures-1-5-million-to-give-ai-users-more-control-over-their-data/), [Dealroom](https://dealroom.co/news/167977-bot-food-raises-1-07m-to-let-ai-users-own-their-data/)).
- **Ecosystem:** founding member of the Open Memory Alliance ([llms.txt](https://ralhf.ai/llms.txt), [openmemoryalliance.org](https://openmemoryalliance.org); the site shows only the tagline "Advancing Digital Memory Rights for Everyone").
- **License:** closed.

### 5.2 How it works
- **Collection:** runs locally "in a restricted space on your computer, with access limited to approved websites." The user logs in themselves; it does not touch the password manager ([security](https://ralhf.ai/security)).
- **Library:** stored in the cloud, encrypted in transit and at rest. No algorithm or key custody stated ([security](https://ralhf.ai/security)).
- **Records:** originals are preserved unchanged. RaLHF adds summaries and a catalog, and every summary detail links back to its source record ([product](https://ralhf.ai/product)).
- **Availability:** the cloud library stays readable when the computer is off; fresh collection needs the computer on ([product](https://ralhf.ai/product)).
- **Timeline view:** shows past, today and future ([ralhf.ai](https://ralhf.ai)).
- **Roadmap:** health, voice, photos, location and devices.

### 5.3 How agents connect
- **Remote MCP:** `https://backend.ralhf.ai/mcp` with OAuth (authorization code and refresh). Visible tools: `who_am_i` and `list_libraries`; the full catalog is unpublished ([llms.txt](https://ralhf.ai/llms.txt)).
- **Setup pages** for ChatGPT (custom MCP server as a plugin), Claude (custom connector), Muse (paste a prompt), and other OAuth MCP clients ([connect](https://ralhf.ai/connect)).
- **Prompt-driven setup:** you paste "Connect RaLHF to ChatGPT" into a chat and the assistant walks you through it. Their llms.txt contains instructions addressed to AI agents (I did not act on them).

### 5.4 Consent and control
- "Your context. You choose what your AI can access." Per-app connect and disconnect ([ralhf.ai](https://ralhf.ai), [security](https://ralhf.ai/security)).
- No per-library or per-category grants, logs, receipts or write approval are documented.
- Commitment: "We never use it for advertising, model training or any other purpose." Bot Food claims no ownership of the data ([security](https://ralhf.ai/security)).

### 5.5 Onboarding and UX
- Four steps: **Collect**, **Keep fresh**, **Catalog**, **Feed it to your AI**.
- UI screens: "Your library," "Your apps," "Add context," "AI access," "Collected detail" ([product](https://ralhf.ai/product)).
- Consumer framing ("Make your AI the one everyone wishes they had"). Strong social presence on TikTok, YouTube and Instagram ([ralhf.ai](https://ralhf.ai)).

### 5.6 Business model
- Beta is free.
- Full release: 3 months free, then US$20/month.
- Users are emailed at least 30 days before any charge.
- Source: [pricing](https://ralhf.ai/pricing).

### 5.7 Strengths worth copying
- **Originals, summary and catalog** with a link back from every summary detail. It is a good retrieval design and naturally auditable.
- **"Connect X to ChatGPT" paste-a-prompt onboarding,** plus an "AI access" screen.
- **Timeline** of collected personal data.
- **Billing copy:** "we'll email at least 30 days before charging."

### 5.8 Weaknesses and complaints
- **No public reviews found.**
- **Server-side keys:** a cloud library with undisclosed key custody.
- **Coarse consent:** per-app only.
- **No receipts.**
- **Scraping via user sessions** is fragile and may breach some sites' terms **[inference]**.
- **$20/month is steep** next to free Egoist.

### 5.9 Threat level: **LOW to MEDIUM**
The consumer "collect your digital life" angle overlaps with our ordinary-person audience. Its consent and crypto are weak, and it is small.

---

## Copy list (10 most valuable)

1. **The pass:** one app × one category × one purpose × one duration (once/session/permanent), and "expired passes never silently become permanent." Extend it with our destination (model/provider) dimension. Egoist, [ego.ist/trust](https://ego.ist/trust)
2. **Write tool creates a proposal,** with return text like "available to other apps only after the owner approves it and grants a category pass." Approving a write ≠ granting a read. Egoist, [llms-full.txt](https://ego.ist/llms-full.txt)
3. **Machine-actionable consent states:** `approval_required` plus an owner link instead of a 403; `passes_known:false` for "unknown" versus "none"; a `status` tool agents call first. Egoist, [docs/agents](https://ego.ist/docs/agents)
4. **Agents can never approve themselves:** approval needs a human session the agent does not hold. Egoist, [ego.ist/trust](https://ego.ist/trust)
5. **One-time connect codes per agent family** (openclaw/hermes/opencode/other), an RFC 8628 device flow for headless agents, and an "unverified" badge for self-named agents. Egoist, [docs/agents](https://ego.ist/docs/agents)
6. **Per-category keys derived from a passkey,** with crypto-shredding on delete. Egoist, [ego.ist/trust](https://ego.ist/trust)
7. **Directed disclosure:** sensitive fields go straight to a pinned destination with an approval sheet listing app, host, fields, reason and expiry; the LLM never sees them. Egoist, [docs/directed-disclosure](https://ego.ist/docs/directed-disclosure)
8. **Ownership defined as testable properties** (portability, visibility, editability); bring-your-own inference including existing subscriptions; attestation over promises. Second, [manifesto](https://2.computer/blog/a-model-of-ones-own), [BigGo](https://finance.biggo.com/news/58c78203627bfce6)
9. **A plain trust page** that names every subprocessor and admits limits. MemoryPlugin, [trust](https://www.memoryplugin.com/trust) (Egoist's "cannot remove information already delivered" is the equivalent for revocation.)
10. **Per-client setup guides** with time estimates and auth type (Plurality, [MCP docs](https://docs.plurality.network/the-plurality-mcp-server/connect-your-agents-via-mcp.md)). Also paste-a-prompt and `llms-install.md` agent-driven install (RaLHF, [connect](https://ralhf.ai/connect); Egoist, [llms-install.md](https://ego.ist/llms-install.md)). Also consumer SEO guides answering "what does ChatGPT know about me?" (Egoist, [guides](https://ego.ist/guides)).

Honourable mentions:
- Importers for six chat platforms plus coding-agent session sync (MemoryPlugin).
- Originals, summary and catalog with source links (RaLHF).
- Memory version history (Plurality).
- "Email 30 days before charging" (RaLHF).

## Avoid list (5 biggest mistakes)

1. **Content-free receipts:** Egoist logs "what happened and when, never the memory text." Owners cannot see what a model actually received. Our receipts must show the content, held locally.
2. **Back doors around review:** Egoist partner ingestion "do[es] not pass through the owner's review inbox," and "hands-off posture" auto-mints permanent passes. MemoryPlugin tells agents to "lean toward saving." Never let a path skip approval silently.
3. **Total-capture surveillance with consent left to model judgment:** Second captures screen, keyboard and messages and defers "who should receive what" to models getting smarter. It creates huge injection and backlash risk and high inference cost.
4. **Vague or contradictory encryption claims and server-held keys:** Plurality says "E2E," "TEE" and "MPC" on different pages; RaLHF and Egoist (without Memory Lock) do not say who holds keys. Lock-in through missing export (Plurality: "no simple backup or export") and credit lockouts ("bricked for 24 hours").
5. **Consent-layer sprawl:** Egoist has scopes, category passes, connector passes, protected approvals, disclosure requests and auto-rules, and its guides have to warn users not to tick every category. Keep one mental model, and defaults that are safe without reading.

## Gaps (what none of them do well)

- **Destination-aware consent:** none gate by *which model or provider* (local versus hosted, vendor X versus Y) receives the data. Egoist runs its own GPUs; Second offers BYO inference but no per-destination policy.
- **Content-level receipts and a plain-language weekly summary:** none show the person exactly what text each agent received, in a digest anyone can read.
- **Open format, user-held keys, sync of your choice:** all are proprietary and closed. Second's folder is the nearest, but its format is unpublished and its open source is only "intended." None interoperates with OpenClaw or Hermes workspace files (Egoist only issues connect codes to those agents).
- **Local door for local agents:** everything is a hosted MCP endpoint. None offers a local MCP plus a model proxy that sees what leaves the machine.
- **Recovery that is not custodial:** Egoist's passkey lock has no documented recovery. Second's backup key handling is undocumented. No Bitwarden-style recovery options.
- **Organisations:** Egoist sells to apps, not to employers managing staff agents. No one does team or org consent policies.
- **Clawing back what was shared:** everyone admits revocation cannot recall delivered data. None minimises exposure up front (redaction or summarisation per destination) or tracks the downstream copy in a receipt.
- **Independent verification:** no audits, no reproducible builds, no public source for any of the five.
