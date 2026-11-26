# Instructions for coding agents (Codex and others)

This file is read automatically by Codex. It holds the design rules every builder in this repository must follow, on the website (`site/`) and in the product (browser extension, wallet UI).

## Rule No. 1: Apple Human Interface Guidelines

All UI follows Apple's Human Interface Guidelines as Apple itself would build it: the iOS type ramp, semantic label colours, an 8pt grid, 44pt hit targets, concentric corner radii, Apple's own component patterns, sentence case (never all caps), and WCAG 2.2 AA. The full rule is in `.claude/CLAUDE.md` under "Rule No. 1"; read it before building any UI.

## bleib notifications are always bleib yellow (founder instruction, 26 Nov 2026)

Every notification bleib shows is bleib yellow with black ink, in light mode and dark mode alike. That covers banners, "Saved to bleib" and "Added" cards, "{AI} used {group}" notices and receipts, on the website and in the extension. The colours never follow the theme.

| Part | Value |
| --- | --- |
| Card background | `#f6e79a` (bleib yellow), both themes |
| Primary text | `#0a0a0a` |
| Secondary text (card title, purpose, time, "Automatic") | `rgb(10 10 10 / 0.72)` for titles, `rgb(10 10 10 / 0.64)` for metadata; both pass 4.5:1 |
| bleib's app icon | black tile `#0a0a0a`, 22px, radius 6px, with the bleib mark in `#f6e79a` at 12px. Always black tile and yellow mark, never a plain or washed-out mark |
| Another app's icon (for example Claude in a receipt) | that app's logo on a cream tile `#fffbea`, 42px, radius 10px (50px, radius 12px beside two lines of text) |
| Detail pills | capsule, `rgb(255 255 255 / 0.6)` background, `#0a0a0a` text at weight 500, Footnote 13/18; leading symbol 14px in `rgb(10 10 10 / 0.62)`. The same in both themes |
| Remove × on a pill | 18px circle in `rgb(10 10 10 / 0.1)`, 12px close glyph in `rgb(10 10 10 / 0.72)`. Keep circle and glyph sizes an even difference apart so the × lands on whole pixels and sits dead centre |
| Corner radius | 14px for a card inside a chat window; 22px for a card in a tray (concentric with the tray) |
| On a yellow surface | where the card sits on yellow (the light theme's gold tray `#efdc7e`), add `box-shadow: 0 0 0 1px rgb(10 10 10 / 0.08), 0 1px 3px rgb(10 10 10 / 0.08)` so it stays apart from it |
| Motion | drops in from above (opacity 0 and `translateY(-14px)` to rest) into space it already holds, so nothing around it moves; no movement with reduced motion |

Not a notification: alerts that ask a question (permission prompts such as "Share health notes with Claude?") keep the system card colour (white in light mode, `#1c1c1e` in dark mode). Their chosen capsule button turns bleib yellow when pressed.

Pitfall: never write theme overrides as global selectors that can reach into the notification (for example a dark-mode rule on every `.app` tile). One such rule turned bleib's tile cream on the live site. Give the notification's parts their own class names and keep their colours fixed.

Reference implementation: `site/src/components/BleibCard.astro` (the card in a chat) and the `.note` styles in `site/src/components/StoryVisual.astro` (notices and receipts on a tray).
