# bleib

**One memory for every AI. Kept by you.**

bleib is a free, open source wallet for what your AIs know about you. Your notes stay encrypted on your own device. Any AI app or agent can use them through one local door. The first time an AI needs a kind of information, bleib asks you. Every time something is shared, it writes a receipt: which AI, which model, exactly what, and why.

"bleib" is German for "stay". Your memory stays with you when you change AI.

> In development. It works, it is tested, and it has not yet had an independent security review. Don't trust it with anything you can't afford to lose yet.

## What's here

| Folder | What |
|---|---|
| [`wallet/`](wallet/) | The wallet: encrypted notes, the local MCP door, permissions, plain-word rules, the model proxy, receipts. Start with [`wallet/README.md`](wallet/README.md). |
| [`site/`](site/) | The website, [bleib.dev](https://bleib.dev) (Astro, static). |
| [`docs/`](docs/) | Brief, research, legal notes and drafts. |
| [`.planning/`](.planning/) | Requirements, roadmap and phase plans. |

## Try it

```sh
cd wallet
npm ci
npm test
```

Then follow [`wallet/README.md`](wallet/README.md) and the [client setup guide](wallet/docs/setup.md) for Claude Desktop, Claude Code, OpenClaw, Hermes and Cursor.

## How it's built

I direct the work and review every change. AI coding assistants (Claude and Codex) write much of the code. Tests enforce the principles: nothing leaves without permission, receipts are written before anything is released, and agents can't widen their own access.

## Licence

- The app (everything in this repository unless stated otherwise): [AGPL-3.0-or-later](LICENSE).
- The wallet file format, the specification and the SDK, once published as their own folders, will be [Apache-2.0](LICENSE-APACHE), so any AI app can integrate freely.

Third-party assets on the website are listed in [`site/CREDITS.md`](site/CREDITS.md).

## Contact

hello@rouxdutoit.com · Security issues: please email rather than opening a public issue.
