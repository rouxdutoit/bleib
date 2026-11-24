## Rule No. 1: Apple Human Interface Guidelines (founder instruction, 24 Nov 2026)

All UI, on the website and in the product, follows Apple's Human Interface Guidelines as Apple itself would build it:

- **Type:** the iOS type ramp and hierarchy.
  - Large Title 34/41, Title 1 28/34, Title 2 22/28, Title 3 20/25;
  - Headline 17/22 semibold, Body 17/22, Callout 16/21, Subheadline 15/20, Footnote 13/18, Caption 12/16;
  - SF-style tracking;
  - the system font stack first (`-apple-system`, `BlinkMacSystemFont`), with Inter as the fallback.
- **Colour:** semantic label colours (label, secondaryLabel, tertiaryLabel), hairline separators, system fills, grouped backgrounds.
- **Spacing and shape:** an 8pt grid, 16pt content margins, 44pt minimum hit targets, concentric corner radii (inner radius = outer radius − padding).
- **Components:** use Apple's own patterns rather than inventing.
  - inset grouped lists (Settings);
  - alerts with capsule buttons (permission prompts);
  - notifications (app icon, title, time, actions);
  - widgets (large number, short label);
  - selection lists with a trailing checkmark.
- **Writing:** title-case buttons in alerts ("Allow Once", "Don't Allow"), questions as alert titles, sentence case elsewhere.
- **Accessibility:** contrast, Dynamic Type-friendly sizes, reduced motion, no colour-only meaning.

Reference: https://developer.apple.com/design/human-interface-guidelines/

<!-- GSD:project-start source:PROJECT.md -->

## Project

**bleib**

bleib is the open source wallet for your AI context: your memory, rules and permissions, kept encrypted on your side, used by any agent you choose, with a receipt every time something is shared. It's for ordinary people who use several AI assistants, for developers running agents like OpenClaw, Hermes or Claude Code, and later for organisations that have to show what their AI saw. "bleib" is German for "stay": your context stays with you when you change AI.

**Core Value:** You can change AI without losing who you are to it, and you can always see exactly what each AI was given, because your context lives in a wallet you hold the keys to, not with the provider.

### Constraints

- **Open source**: all wallet code public; free tier never limits privacy — positioning against closed funded rivals
- **Build on established pieces**: HCP grants/logs, OpenClaw workspace format, age + SQLCipher, W3C DPV, ISO 27560, official MCP SDK — speed and credibility
- **Privacy**: local first, no telemetry, we never hold keys that let us read data, fail closed
- **Language**: plain words in the interface; German and English written natively
- **Accessibility**: WCAG 2.2 AA / BITV 2.0 from day one
- **Hosting**: Cloudflare Pages (existing project `bleib`) for the site
- **Brand**: keep the bleib mark (gold #f6e79a, black tile) and name; trademark still to be checked
- **Website licensing**: follow Roze's structure and feel, but no copying of its text, images, code or assets

<!-- GSD:project-end -->

<!-- GSD:stack-start source:STACK.md -->

## Technology Stack

Technology stack not yet documented. Will populate after codebase mapping or first phase.
<!-- GSD:stack-end -->

<!-- GSD:conventions-start source:CONVENTIONS.md -->

## Conventions

Conventions not yet established. Will populate as patterns emerge during development.
<!-- GSD:conventions-end -->

<!-- GSD:architecture-start source:ARCHITECTURE.md -->

## Architecture

Architecture not yet mapped. Follow existing patterns found in the codebase.
<!-- GSD:architecture-end -->

<!-- GSD:skills-start source:skills/ -->

## Project Skills

No project skills found. Add skills to any of: `.claude/skills/`, `.agents/skills/`, `.cursor/skills/`, `.github/skills/`, or `.codex/skills/` with a `SKILL.md` index file.
<!-- GSD:skills-end -->

<!-- GSD:workflow-start source:GSD defaults -->

## GSD Workflow Enforcement

Before using Edit, Write, or other file-changing tools, start work through a GSD command so planning artifacts and execution context stay in sync.

Use these entry points:
- `/gsd-fast` for a trivial task inline, with no subagents and no PLAN.md
- `/gsd-quick` for small fixes, doc updates, and ad-hoc tasks
- `/gsd-debug` for investigation and bug fixing
- `/gsd-execute-phase` for planned phase work

Do not make direct repo edits outside a GSD workflow unless the user explicitly asks to bypass it.
<!-- GSD:workflow-end -->

<!-- GSD:profile-start -->

## Developer Profile

> Profile not yet configured. Run `/gsd-profile-user` to generate your developer profile.
> This section is managed by `generate-claude-profile` -- do not edit manually.
<!-- GSD:profile-end -->

## Build Workflow (founder instruction, 24 Nov 2026)

- **Codex builds, Claude supervises.** Implementation is done by the Codex CLI with model `gpt-6.2-sol` at reasoning effort `high`:
  `codex exec -m gpt-6.2-sol -c model_reasoning_effort="high" -s workspace-write -c sandbox_workspace_write.network_access=true -C /home/roux/Documents/bleib --skip-git-repo-check "<brief>"`
  (the binary is at `~/.local/opt/node-v24.22.2-linux-x64/bin/codex`; it is not on PATH).
- Claude coordinates: turns each GSD plan into a self-contained brief (scope, files, acceptance criteria, what not to touch), runs Codex in the background, reviews every diff, verifies in the browser (desktop, 360px, reduced motion, keyboard, contrast), then commits or sends specific fixes back.
- One Codex builder per set of files at a time.
- Website: follow roze.ai's structure and pacing closely, but never copy its text, images, code or brand assets. Use bleib's own mark (`_archive/bleib-v0/bleib-landing/dist/images/bleib-symbol.svg`), Inter (OFL) and licensed imagery with credits recorded.
- `_archive/` holds the parked October 2026 site and is not tracked; copy assets out of it, never edit it.
