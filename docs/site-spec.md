# bleib website: design spec (Phase 1)

**Rule No. 1:** all styling follows Apple's Human Interface Guidelines: type ramp, hierarchy, spacing, colour semantics and component patterns. See `.claude/CLAUDE.md`.

Covers SITE-01 to SITE-12. It follows roze.ai's structure, pacing and restraint closely, but every word, image, illustration and line of code is bleib's own. Nothing is copied from roze.ai.

## What we observed on roze.ai (structure only)

- **Header:** wordmark top-left; two pill buttons top-right (secondary "Launch", primary "Join the waitlist"). Translucent, fixed.
- **Hero:** about 2 viewports tall. It starts as a full-bleed warm photo with the headline overlaid. As you scroll, the photo shrinks into a rounded, framed panel on the right; the headline, subline and CTA settle on the left on a warm off-white background. A small app-icon chip sits centred on the panel's left edge.
- **Story:** a sticky stage. One app-style card stays pinned while about 5 frames scroll past, each one viewport tall. The card morphs into the next scene and the headline beside it changes. Card and text swap sides between scenes. Headline about 37px, weight 400, tight negative tracking, two short lines; one muted supporting sentence underneath.
- **Navigation:** a vertical tick column at the right edge. The active tick is longer, and each tick is a button with an accessible label.
- **Cards:** white, radius about 20–24px, soft large shadow, sitting on a lighter rounded "tray". UI text 15–17px. One accent colour for actions and highlights. Highlighted source text uses a soft tinted background.
- **Finale:** a big headline plus CTA on the left. On the right, a playful interactive pile of small cards the visitor can scatter, with "put it back".
- **Footer:** one quiet row of links. Body copy is muted ink at about 42–62% opacity. Font: Inter.

## bleib design tokens (updated 24 Nov 2026: founder chose the bleib yellow as the page colour)

- **Light mode (default when the system is light):**
  - page background: bleib yellow `#F6E79A`;
  - cards `#FFFFFF`; tray a deeper yellow `#EFDC7E`;
  - ink `#0A0A0A` for text, the mark tile and primary buttons (white text on ink buttons), with muted ink at 66% and faint at 46% (check AA on yellow).
- **Dark mode (`prefers-color-scheme: dark`, plus a manual toggle in the header and footer):** the October site's look.
  - page `#0A0A0A`, cards `#161616`, tray `#111111`, text `#F5F1E6`, muted text at 66%;
  - bleib yellow `#F6E79A` for the mark, primary buttons (yellow with ink text), highlights and the active tick.
- **Highlights in receipts:** on white cards, a yellow tint `#F6E79A` behind ink text; in dark mode, yellow text or a yellow underline on dark cards.
- **Never** yellow text on a light background.
- **The mark:** `bleib-symbol.svg` in ink on yellow (light) or yellow on ink (dark). The black rounded tile from `favicon.svg` is used for the favicon and app-icon chip.
- **Type:** Inter variable (OFL).
  - H1 clamp(34px, 4.6vw, 64px), weight 400, tracking -0.03em;
  - H2 about 37px, weight 400, tracking -0.04em;
  - body 17px/1.5; UI 13–17px.
- **Radius:** cards 22px, tray 28px, pills 999px.
- **Shadow:** light mode `0 30px 80px -30px rgba(10,10,10,.30)`; in dark mode use a 1px `rgba(255,255,255,.06)` border instead of a shadow.
- **Motion:** short and eased (cubic-bezier(.2,.8,.2,1), 300–600ms). Everything pausable; with reduced motion, crossfades or static states only.
- **The hero photo panel** sits framed on the yellow (light) or black (dark) page.

## Page: `/` (and `/de/`)

### Header (fixed, translucent)

- Left: mark tile + "bleib".
- Right: language switch (EN | DE), a "GitHub" pill (secondary, translucent white) and a "Get early access" pill (primary, ink).

### Hero (SITE-01, SITE-05)

- **Photo:** licensed, warm, natural light, a real person using a phone or laptop in daily life. Start with the archive's `connected-apps.jpg` (Christina Morillo, Pexels License) and record the credit. Founders may swap it later.
- **Scroll behaviour:** as on roze, the photo starts full-bleed and shrinks into a rounded panel on the right. A white chip with the bleib mark is centred on the panel's left edge.
- **Eyebrow chip, above the H1:** "Open source · Free · Your keys"
- **H1:** "Change AI. Stay yourself."
- **Subline:** "bleib keeps what your AI knows about you encrypted and on your side. It asks before anything is shared, and shows you exactly what each AI saw."
- **Actions:** "Get early access" (primary) and "View on GitHub" (secondary). Small note underneath: "In development. Free and open source."

### Story: sticky stage (SITE-02, SITE-03)

Five scenes, each with a tick label. The card morphs between scenes, and text and card alternate sides.

1. **"Your context. In one place."**
   - Supporting line: "People, preferences and rules your AIs need, in plain text you can read and correct. Encrypted on your device."
   - Card ("Your wallet"): grouped rows:
     - People · Marek, friend, Berlin
     - Travel · Aisle seat · Hotels under €250
     - Work · Weekly review on Fridays
     - Health · a lock icon, "Private"
   - Footer pill: "Encrypted on this device".
2. **"Asked once. Remembered."**
   - Supporting line: "The first time an AI needs something new, bleib asks. Your answer becomes a rule."
   - Card: a prompt.
     - "Claude wants your travel preferences"
     - "To plan your Lisbon trip · Goes to Anthropic (hosted)"
     - Buttons: "Allow once", "Always for Claude", "No".
   - Animation: "Always for Claude" gets selected, and a chip appears: "Saved: Claude may use Travel".
3. **"See exactly what each AI saw."**
   - Supporting line: "Every share leaves a receipt: which AI, where it went, for what, and the exact words."
   - Card: a receipt.
     - "Today · 14:32", "Claude · Anthropic (hosted)", "For: plan Lisbon trip".
     - Shared: "Prefers aisle seats", "Hotels under €250 a night" (both gold-highlighted).
     - "Not shared: Health, People".
   - A second smaller card slides up: "This week: 3 AIs saw 11 facts. Nothing about your health left this device."
4. **"Change AI. Keep yourself."**
   - Supporting line: "Your preferences and rules stay in bleib. A new AI gets what you allow, without starting over."
   - Card: the wallet stays fixed while the provider row steps along (Claude → ChatGPT → Gemini → a local model on Ollama). Provider marks come from the archive's LobeHub icons (MIT; licence file included).
   - Caption: "Different AI. Same you."
5. **"Your AI suggests. You decide."**
   - Supporting line: "AIs can propose what to remember. Nothing is saved until you say so."
   - Card: a proposal.
     - "Claude wants to remember"
     - "Marek is vegetarian."
     - "Why: he mentioned it while you planned dinner."
     - Buttons: "Save", "Edit", "Not now".
   - Animation: "Save" is selected, then "Saved. No AI can read it until you allow it."

**Tick navigation:** at the right edge, labelled Wallet, Asked once, Receipts, Any AI, You decide. Clicking scrolls to that scene, and the active tick is longer.

**Phones (SITE-09):** below 768px the stage isn't sticky. Each scene stacks: headline, line, then the card in its final state, with a simple fade-in. No horizontal scroll at 360px.

### Finale (SITE-04)

- **Left:**
  - H2 "Keep what's yours."
  - The line "bleib is in development. Get early access and help shape it."
  - The early-access form: email field + "Get early access" button (SITE-06).
- **Right:** a loose pile of about 12 small context cards, such as "Aisle seat", "Marek · vegetarian", "Hotels under €250", "Weekly review · Fri", "Prefers mornings", "Penicillin allergy 🔒" and "Lisbon · May".
  - Visitors can drag them (mouse or touch) into a bleib wallet drop zone, a tile with the mark.
  - Prompt text: "Go on: put it all in your wallet."
  - When everything is in: "All yours." plus a "Take it all out" reset.
- **Keyboard alternative:** a visible "Put everything in the wallet" button, and each card is focusable and movable with Enter.
- With reduced motion, the cards move without physics.

### Footer

- Mark, "bleib", "© 2026".
- Links: How it works, Developers, Pricing, Privacy, Impressum, GitHub, and EN/DE.

## Subpages (SITE-07)

Same header and footer. Simple text pages, max width 680px:

- `/how-it-works`: the wallet, the door, permissions, receipts, proposals, recovery. Plain language with one diagram.
- `/developers`: MCP door, OpenClaw/Hermes workspace compatibility, HCP/PCP alignment, the planned CLI (`npx bleib`), and the GitHub link. Mark it "coming soon" where it isn't built yet.
- `/pricing`:
  - Free: everything that keeps your data yours.
  - Convenience (later): hosted encrypted sync and backup, passkey recovery.
  - Organisations (later).
  - Line: "We never charge you to see your own data."
- `/privacy`: the site's own data handling (early-access emails only, no tracking, no cookies beyond essentials) and the product's principles.
- `/impressum`: legal notice using the details in `docs/legal.md` (same operator as fazit.dev).
- Each subpage also exists in German under `/de/...`.

## Early access (SITE-06)

- A Cloudflare Pages Function `POST /api/early-access` validates the email and stores `{email, lang, createdAt}` in a KV namespace `EARLY_ACCESS`. One entry per email, so it's idempotent.
- It returns JSON; the form shows "Thanks, you're on the list." in place, or an inline error.
- Basic abuse protection: a honeypot field and per-IP rate limiting in the function.
- Export: a script, or a documented `wrangler kv key list` + get command, for the founders.
- No third-party tracking; no cookie banner needed.

## Languages (SITE-10)

- English at `/`, German at `/de/`, with `hreflang` and a switch that keeps the same page.
- The German copy is written natively, not translated word for word. Suggested hero:
  - H1 "KI wechseln. Du selbst bleiben."
  - Subline "bleib bewahrt, was deine KI über dich weiß, verschlüsselt und auf deiner Seite. Es fragt, bevor etwas geteilt wird, und zeigt dir genau, was jede KI gesehen hat."

## Quality bars (SITE-08, SITE-11, SITE-12)

- WCAG 2.2 AA:
  - keyboard operable, visible focus, AA contrast, no colour-only meaning;
  - a pause control for the animated story (bottom-right of the stage, as in the archive's pattern);
  - full `prefers-reduced-motion` support;
  - the story content is available as text to assistive technology.
- Lighthouse mobile ≥ 90 in all four categories:
  - images in AVIF/WebP with explicit sizes;
  - fonts subset and preloaded;
  - JS minimal and deferred;
  - no layout shift.
- An asset credits file (`CREDITS.md`) lists every image, font and icon with its licence.
- No roze.ai text, images, code or brand assets anywhere.

## Tech

- **Astro** (static output), deployed to the Cloudflare Pages project `bleib`, with a Pages Function for `/api/early-access`.
- Vanilla TypeScript for the scroll stage (IntersectionObserver plus scroll progress). No heavy animation libraries.
- Project folder: `site/` at the repo root.
