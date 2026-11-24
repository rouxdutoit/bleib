# Competitor teardown brief

## Our product (for context only, don't let it bias your findings)

An open source, user-owned home for everything a person's AI agents know about them:

- an encrypted folder of plain-text memory (compatible with OpenClaw/Hermes workspace files), synced however the person likes;
- one local door (MCP, plus a local model proxy) that any agent uses;
- progressive consent per agent x kind of information x destination (which model/provider, local or hosted);
- receipts recording exactly what each agent and model received, with a plain-language weekly summary;
- agents propose memories, the person approves;
- free and open source; paid only for convenience (hosted encrypted sync, recovery, always-on door), Bitwarden-style;
- for developers, ordinary people and organisations alike.

We intend to copy whatever the best competitors do well, and avoid what they do badly. We want to know exactly how they work.

## For each product in your track, find out (cite a URL for every claim; mark anything unverified)

1. **What it is** in one sentence, who it's for, stage, launch date, license, funding, traction (stars, users, downloads, community size), team.
2. **How it works:** architecture, where data lives, data model/format (files? DB? schema?), encryption (what, where, who holds keys), sync, recovery if a device is lost.
3. **How agents connect:** MCP (tools exposed, names), APIs, browser extension, importers/exporters, which agents/apps supported.
4. **Consent and control:** permission model and its granularity, what the prompt looks like, defaults, durations, revocation, logs/receipts, memory write approval, what the person sees.
5. **Onboarding and UX:** steps from zero to working, what a non-technical person experiences, screenshots/docs described in words, time to value.
6. **Business model:** pricing tiers and what's free vs paid.
7. **Strengths worth copying:** concrete, specific (a UX pattern, a schema, a default, a sentence of copy, a distribution trick).
8. **Weaknesses and complaints:** GitHub issues, HN/Reddit threads, reviews; what users dislike, security problems.
9. **Threat level to us** (low/medium/high) and why.

Read primary sources: repos (README, docs, key source files), product docs, pricing pages, changelogs, issues. Use WebSearch (load via ToolSearch "select:WebSearch" if needed; "extended" mode for recent or hard items) and WebFetch or the web-fetch agent. Run searches in parallel. Today is 24 November 2026.

## Output

Write a Markdown report to the path given in your task, with one section per product using the 9 headings, then:

- **Copy list:** the 10 most valuable things to copy from your track, each one line, with the product and URL.
- **Avoid list:** the 5 biggest mistakes to avoid.
- **Gaps:** what none of them do well.

Then return a summary of under 400 words.
