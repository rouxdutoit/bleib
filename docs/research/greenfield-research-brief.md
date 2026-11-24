# Greenfield check: a user-owned context store for AI agents

You are an independent researcher. Your job is to find out whether the product below already exists, partly or fully, so that we don't build something that's already there. Try hard to prove it is NOT greenfield. Search the web thoroughly (GitHub, npm, PyPI, Hacker News, Product Hunt, arXiv, standards bodies, vendor blogs). Today's date is 24 November 2026; prefer sources from 2026.

## The concept

An open source, user-owned "context store" for AI agents:

1. **An encrypted folder** that holds a person's memory as plain text files (who they are, how they work, people, projects), encrypted at rest, synced with whatever the person already uses.
2. **One door.** A local MCP server that any agent (Claude, ChatGPT connectors, OpenClaw, Hermes Agent, local models) connects to. It answers with the smallest useful answer, not whole files.
3. **Progressive consent.** The first time an agent asks for a kind of information, the person is asked (allow once / always for this agent / no). The answer is remembered and only re-asked when the agent, the kind of information or the destination (local vs hosted model, provider) changes. A permission covers agent x kind of information x destination.
4. **Receipts.** Every disclosure is logged with content: which agent, which model or provider, what exactly was given, for what purpose, when. Shown as a plain-language weekly summary.
5. **Proposals, not writes.** Agents can only propose new memories; the person approves them.
6. **Portability.** Switch the agent or model and keep the memory. Importers from ChatGPT/Claude memory and from OpenClaw's workspace files.
7. **Later:** the agent's keys/identity (A2A agent card), signed mandates (AP2, EUDI Wallet delegation).

## Questions

A. **Direct prior art.** Is there any project or product (open or closed, any stage) that combines at least three of: encrypted user-owned memory, progressive per-category consent for agents, content-level disclosure receipts, cross-agent portability over MCP? For each hit: name, URL, license, stage, stars/users, last activity, which of the 7 points it covers, and what it lacks.

B. **OpenClaw and Hermes Agent ecosystems.** Any plugin, skill or core feature (merged or proposed) for encrypted memory, consent prompts for personal data, or a log of what context each model provider received? Check the OpenClaw repo issues/PRs (for example PR #127091 "payload PII redaction ... session encryption": merged or not?) and the memory-slot plugins (Mem0, Honcho, LanceDB, Supermemory, others). Does Hermes Agent import OpenClaw's workspace files, and which ones?

C. **Personal data stores and wallets.** What have these done for AI agents in 2025–2026: Inrupt/Solid (Charlie, "Agentic Wallets"), Mem0 OpenMemory, Basic Memory, Plurality, MemoryPlugin, Kin, Proton Lumo, digi.me, Dataswyft/HAT, MyData operators, Apple (Siri personal context), Google (Private AI Compute)? Does any of them give the user per-disclosure receipts?

D. **Reusable building blocks.** Assess fitness and maturity (license, maintenance, language bindings) for:
   - receipts: ISO/IEC TS 27560 consent records, Kantara Consent Receipt, W3C Data Privacy Vocabulary (DPV) personal-data categories;
   - user terms: IEEE 7012 (MyTerms);
   - encryption at rest: age, Cryptomator vault format, SQLCipher, gocryptfs;
   - MCP: elicitation support for asking the user mid-task, in which clients;
   - personal-data detection: Presidio and local PII models;
   - identity/mandates: A2A agent cards, AP2 mandates, EUDI Wallet delegation (e.g. Plenipo).

E. **Standards work.** Is anyone standardising agent memory portability or disclosure receipts (IETF, W3C, DIF, FIDO, Linux Foundation AAIF, MCP spec proposals, "memorywire")?

F. **Funded startups** in "personal AI memory", "user-owned context", "consent for agents" in 2025–2026: names, amounts, what they ship.

## Output

1. A table of every relevant hit (A–C, F), with coverage of the 7 points.
2. A verdict on each of these claims: TRUE / PARTLY / FALSE, with evidence:
   - Nobody ships content-level disclosure receipts for personal AI agents.
   - Nobody ships progressive per-category consent for what an agent may read from personal memory.
   - Nobody ships an encrypted, agent-neutral personal memory with both of the above.
   - OpenClaw's memory is unencrypted on disk and its audit log stores no content.
3. The building blocks from D, ranked by fitness.
4. The single biggest threat to this being greenfield in the next 12 months.

Cite a URL for every claim. Mark anything you could not verify. Be blunt.
