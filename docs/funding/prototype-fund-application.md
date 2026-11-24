# Prototype Fund 2026 application: bleib

Track: **Innovation**. Deadline: **30 November 2026, 15:00**. Paste each answer into the form at bewerben.prototypefund.de (Jahrgang 03: Innovation). Word counts in brackets. Tick the two confirmations yourself.

- Project title: bleib
- First name / name: Ruan du Toit
- GitHub: https://github.com/rouxdutoit

## 1. Describe your project in one sentence [30/30]

bleib is a free, open source password manager for what AI knows about you: it remembers your preferences, encrypted on your device, and gives each AI only what it needs.

## 2. Briefly describe your project [99/100]

Every AI keeps its own memory of you, and you repeat yourself to each one. Nobody can see what each was sent.

bleib works like a password manager. When you tell an AI something worth remembering, it offers to save it, encrypted on your device. When you start a chat with another AI, it adds only what that request needs. Sensitive things like health or money are only shared after you say yes, and every share leaves a receipt.

It comes as a browser extension for ChatGPT, Claude and Gemini, on a local wallet that agents can use too.

## 3. Which social issue do you want to address? [152/175]

AI assistants are becoming the place where people think out loud. They learn about our health, money, relationships and work, and they keep it.

That memory sits with a handful of US companies. Each keeps its own copy. You can't take it with you, so you stay. You can't see what was sent where, so you can't check. An agent you connect for one task may pass your details to a model somewhere else, and nobody tells you.

Funded start-ups now sell "AI passports" to fix the portability part. They are closed, and they hold your data too. Same problem. New owner.

People need the opposite. Their own copy, encrypted with keys only they hold. A clear question before anything leaves. And proof afterwards, in plain words, of what each AI actually saw.

Without that, privacy in the age of agents stays a promise. bleib turns it into something anyone can check.

## 4. How do you want to realise your project on a technical level? [159/175]

bleib has two parts, both open source.

The wallet is a TypeScript app under the AGPL. Your memory is a folder of plain Markdown notes, compatible with the OpenClaw and Hermes agent workspaces, encrypted with age. Agents connect through a local MCP server, the open standard most AI apps support.

The browser extension (Manifest V3) works on chatgpt.com, claude.ai and gemini.google.com. It talks only to the local wallet, never to a server of ours. It spots things worth saving, imports what each provider already remembers, and adds the relevant minimum to new chats.

The wallet decides what a request needs, locally. It asks only for sensitive kinds of information. Receipts are hash-chained, so edits show, and export as consent records using W3C DPV and ISO/IEC TS 27560.

A daily job checks each chat site for changes, so the extension keeps working. During the funding I will ship Firefox and Safari versions, a one-step installer, and an independent security review.

## 5. Have you already worked on the idea? [88/100]

Yes. I started in November 2026. The local wallet works today: encrypted notes, the agent connection, permissions, receipts you can verify, and a review queue for memories. It is published on npm and GitHub, and Claude Code, OpenClaw and Hermes connect to it. A first version of the browser extension for Chrome is in development. The website bleib.dev explains it.

The funding pays for what ordinary people need: Firefox and Safari, a one-step installer, help on phones, an independent security review, and testing with people who don't code.

## 6. Link to the existing project

https://github.com/rouxdutoit/bleib

## 7. What is innovative about your project? [85/100]

Others offer memory. Nobody offers proof and restraint.

Mem0's OpenMemory, Supermemory and similar extensions sync your memory across AIs, but most store it on their servers and share whatever fits. Closed products like Egoist and First Person's "Second" hold your data themselves. Basic Memory is open but has no encryption or consent.

bleib keeps memory on your device, shares only what each request needs, asks before anything sensitive leaves, and leaves a receipt for every share. It builds on MCP, OpenClaw's format, age and DPV.

## 8. Who are the potential users, and how do you want to reach them? [95/100]

People who use several AI assistants and are tired of repeating themselves, but care about privacy: freelancers, journalists, people with a health condition, families. Developers running agents come first, because they feel the problem today.

How I'll reach them:
1. Listings in the Chrome, Firefox and Safari stores, and in the MCP and OpenClaw communities.
1. A first-run import, so bleib is useful in minute one.
1. Testing with twenty people who don't code, in German and English.
1. Feedback to the HCP working group at Stanford and Consumer Reports.
1. Talks at FrOSCon, and short guides in plain German.

## 9. Milestones during the funding period [75/100]

1. Month 1: One-step installer for macOS, Windows and Linux. Unlock with the system, no passphrase to type.
1. Month 2: Firefox version. Import from ChatGPT, Claude and Gemini on first run.
1. Month 3: Safari version. Accessible to WCAG 2.2 AA.
1. Month 4: Phones: an opt-in minimal profile in each AI's own settings.
1. Month 5: Independent security review and fixes. Tests with twenty people.
1. Month 6: Version 1.0 in all three stores. Guides in German and English.

## Team 1. Applying as a team?

No

## Team 3. Software projects so far [72/100]

I build products alone, start to finish, with AI coding assistants.
- Fazit (https://github.com/rouxdutoit/fazit) shows an organisation what it relies on in Microsoft 365, and what a move to open source would take. Open source.
- Truhe (https://truhe.app) helps small businesses claim back electricity tax.
- luw (https://luw.energy) runs a home's energy use around routines and prices. In beta.
- Unterlagen drafted replies to official letters for small companies. Tested, then closed.

## Team 4. Shareholder in a company?

Yes

## Team 5. Why the project is not for your own business [42/60]

I own 50% of R&R Holding UG. It doesn't trade. It ran Unterlagen, which has closed. It has nothing to do with bleib. I build bleib as a private person, as free public software. The company doesn't need it or use it.

## Team 6. Total hours in the 6 months

760

## Team 7. Experience, background, motivation [83/100]

I live in Feldkirchen, near Munich. Like many people, I now talk to several AIs. Each knows a different part of my life, and I can't see what any of them was sent. That bothered me enough to build the fix.

I direct the work and check every change. AI writes much of the code. I'm open about that, and so is the project.

I'm also applying with Fazit. Both follow the same idea: free, local, honest software that leaves you in control.

## Second Stage 1. Apply for the four-month extension?

Yes

## Second Stage 2. What the project needs beyond the prototype [139/175]

After six months, bleib works for one person on one computer. To last, it needs three things.

People. A second maintainer, a contribution guide, and a short document on how decisions are made. AI apps that integrate bleib through the open SDK, so it becomes a shared layer, not one project.

Income, without charging for privacy. Everything that keeps your data yours stays free. Like Bitwarden, the paid part is convenience: hosted, end-to-end encrypted sync between your devices that we can't read. In the Second Stage I'll test that offer with early users and set up how it is run.

Trust. Publish the security review. Take part in the HCP standard. Explain, in plain German and English, what bleib can and can't promise.

The goal: bleib keeps going after the grant, whether I'm the one maintaining it or not.

## Second Stage 3. Second Stage milestones [47/100]

1. Month 1: Contribution guide, governance document, second maintainer found.
1. Month 2: Security review published. Two apps integrating the SDK.
1. Month 3: Paid sync offer tested with early users. Prices and terms published.
1. Month 4: 500 active wallets. Results published. A plan to fund maintenance after the grant.
