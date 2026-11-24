# Prototype Fund 2026 application: bleib (draft)

Track: **Innovation** (focus: data security). Language: English. Deadline: **30 November 2026, 15:00**. Funding if selected: 1 June to 30 November 2027, then the optional four-month Second Stage, which can only be requested now.

Answers live in `ptf-bleib-answers.json`; this file is generated from it. Word counts are in brackets.

## Before you submit

1. **Vibe-coding rule.** The FAQ says vibe-coding is not fundable: you must have the programming skills the project needs, and check AI-written code carefully. The motivation answer says AI writes much of the code and you check every change, as in Fazit's application. Only submit if you can stand behind that.
2. **Links must work.** Q6 points to github.com/rouxdutoit/bleib and bleib.dev. Both must be live and public before you send.
3. **Two applications.** Allowed (FAQ: several ideas at once, "Ja"). Each assumes 760 hours in six months. If both are picked, you can't do both alongside each other; be ready to choose or to shift one.
4. **Check these claims are true for you:** "Like many people, I now talk to several AIs" (motivation); the Second Stage target of 500 active wallets; FrOSCon as a talk.
5. **External read.** The handbook asks you to have someone outside IT read questions 1 to 3.

## General information

- Project title: bleib
- Account name: Roux du Toit
- First name / name: Ruan du Toit
- Email: **[YOU]**
- GitHub: https://github.com/rouxdutoit

## Your project

### 1. Describe your project in one sentence [29/30]

bleib is a free, open source wallet that keeps what your AI knows about you encrypted on your own device, and shows you exactly what each AI was given.

### 2. Briefly describe your project [99/100]

Every AI now keeps a memory of you. Your health, your work, your family. That memory lives with the provider, and you can't see what each one was sent.

bleib moves it to your side. It's an encrypted wallet of plain-text notes on your own device. Any AI app or agent can connect to it through one local door. The first time an AI needs a kind of information, bleib asks you. And every time something is shared, it writes a receipt: which AI, which model, exactly what, and why.

Change AI. Keep your memory. See what it saw.

### 3. Which social issue do you want to address? [152/175]

AI assistants are becoming the place where people think out loud. They learn about our health, money, relationships and work, and they keep it.

That memory sits with a handful of US companies. Each keeps its own copy. You can't take it with you, so you stay. You can't see what was sent where, so you can't check. An agent you connect for one task may pass your details to a model somewhere else, and nobody tells you.

Funded start-ups now sell "AI passports" to fix the portability part. They are closed, and they hold your data too. Same problem. New owner.

People need the opposite. Their own copy, encrypted with keys only they hold. A clear question before anything leaves. And proof afterwards, in plain words, of what each AI actually saw.

Without that, privacy in the age of agents stays a promise. bleib turns it into something anyone can check.

### 4. How do you want to realise your project on a technical level? [164/175]

bleib is a TypeScript app for Node.js, under the AGPL. The file format, the spec and the SDK are Apache 2.0, so any AI app can build on them.

The wallet is a folder of plain Markdown notes, compatible with the OpenClaw and Hermes agent workspaces, and encrypted at rest with age. Nothing leaves the device unless you allow it.

Agents connect through a local MCP server, the open standard most AI apps already support. They get the smallest useful answer, never whole files.

Permissions are remembered per agent, kind of information and destination. A local proxy for OpenAI- and Anthropic-style requests sees which model and provider really receive the data. If that doesn't match what you allowed, nothing is sent.

Receipts are hash-chained, so edits and deletions show. They export as consent records using W3C DPV and ISO/IEC TS 27560.

During the funding I will add recovery and device linking, sync through your own cloud, a desktop app, and an independent security review.

### 5. Have you already worked on the idea? [99/100]

Yes. A first version in October 2026 went in the wrong direction, so I started again in November. Today the wallet works: encrypted notes, the local door, permission asked once, plain-word rules, the proxy, receipts you can verify and export, a weekly summary, and a review queue for memories that agents suggest. 33 automated tests pass. Claude Code, OpenClaw and Hermes connect to it. The website bleib.dev explains it.

The funding pays for what ordinary people need before they trust it with their life: recovery, device linking, sync, a desktop app, a security review, and testing with real users.

### 6. Link to the existing project

https://github.com/rouxdutoit/bleib and https://bleib.dev

### 7. What is innovative about your project? [100/100]

Others solve portability. Nobody solves proof.

Basic Memory gives agents memory in plain files, but without encryption, consent or a record of what was shared. Mem0 and Supermemory build memory for developers, not control for people. Closed products like Egoist and First Person's "Second" hold your data themselves. The HCP draft from Stanford and Consumer Reports describes permissions and logs, but it is a specification, not a tool.

bleib adds what's missing: receipts with the exact content shared, permission tied to the real model and provider, and keys only you hold. It builds on MCP, OpenClaw's format, age and DPV.

### 8. Who are the potential users, and how do you want to reach them? [95/100]

First, people who already run agents: developers using Claude Code, OpenClaw, Hermes or local models. They feel the problem today. Then people who use several AI assistants and have something to protect: freelancers, journalists, therapists, people with a health condition.

How I'll reach them:
1. Setup guides and listings in the OpenClaw, Hermes and MCP communities.
1. A published npm package, so trying it takes one command.
1. Testing with ten people who don't code, in German and English.
1. Feedback to the HCP working group, and a compatible implementation.
1. Talks at FrOSCon, and short guides in plain German.

### 9. Milestones during the funding period [76/100]

1. Month 1: Recovery kit and device linking, set up before anything is stored.
1. Month 2: Encrypted sync through your own cloud: Nextcloud, iCloud or Syncthing.
1. Month 3: Desktop app with the permission prompt and "What your AI saw". Accessible to WCAG 2.2 AA.
1. Month 4: Importers for ChatGPT and Claude memory. HCP compatibility.
1. Month 5: Independent security review and fixes. User tests with ten people.
1. Month 6: Version 1.0, signed releases, guides in German and English.

## Team and experience

### Team 1. Applying as a team?

No

### Team 3. Software projects so far [72/100]

I build products alone, start to finish, with AI coding assistants.
- Fazit (https://github.com/rouxdutoit/fazit) shows an organisation what it relies on in Microsoft 365, and what a move to open source would take. Open source.
- Truhe (https://truhe.app) helps small businesses claim back electricity tax.
- luw (https://luw.energy) runs a home's energy use around routines and prices. In beta.
- Unterlagen drafted replies to official letters for small companies. Tested, then closed.

### Team 4. Shareholder in a company?

Yes

### Team 5. Why the project is not for your own business [42/60]

I own 50% of R&R Holding UG. It doesn't trade. It ran Unterlagen, which has closed. It has nothing to do with bleib. I build bleib as a private person, as free public software. The company doesn't need it or use it.

### Team 6. Total hours in the 6 months

760

### Team 7. Experience, background, motivation [83/100]

I live in Feldkirchen, near Munich. Like many people, I now talk to several AIs. Each knows a different part of my life, and I can't see what any of them was sent. That bothered me enough to build the fix.

I direct the work and check every change. AI writes much of the code. I'm open about that, and so is the project.

I'm also applying with Fazit. Both follow the same idea: free, local, honest software that leaves you in control.

## Second Stage

### Second Stage 1. Apply for the four-month extension?

Yes

### Second Stage 2. What the project needs beyond the prototype [137/175]

After six months, bleib works for one person on one computer. To last, it needs three things.

People. A second maintainer, a contribution guide, and a short document on how decisions are made. Apps that integrate bleib through the open SDK, so it isn't one project but a shared layer.

Income, without charging for privacy. Everything that keeps your data yours stays free. Like Bitwarden, the paid part is convenience: hosted, end-to-end encrypted sync and backup that we can't read. In the Second Stage I'll test that offer with early users and set up how it is run.

Trust. Publish the security review. Take part in the HCP standard. Explain, in plain German and English, what bleib can and can't promise.

The goal: bleib keeps going after the grant, whether I'm the one maintaining it or not.

### Second Stage 3. Second Stage milestones [47/100]

1. Month 1: Contribution guide, governance document, second maintainer found.
1. Month 2: Security review published. Two apps integrating the SDK.
1. Month 3: Paid sync offer tested with early users. Prices and terms published.
1. Month 4: 500 active wallets. Results published. A plan to fund maintenance after the grant.

## Confirmations (you tick these yourself)

- I am over 18 and my main residence is in Germany.
- I agree to publish the results under an open source licence (bleib: AGPL-3.0-or-later; format, spec and SDK Apache-2.0).
