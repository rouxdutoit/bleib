# Phase 1: Website - Context

**Gathered:** 24 November 2026
**Status:** Ready for planning
**Source:** PRD Express Path (docs/site-spec.md)

<domain>
## Phase Boundary

A live, bilingual (EN/DE), accessible marketing site for bleib on the Cloudflare Pages project `bleib`. It follows roze.ai's structure, pacing and restraint closely, using only bleib's own copy, mark and licensed imagery:

- a photo hero that shrinks into a framed panel;
- a sticky story card with five scenes and tick navigation;
- an interactive "put it in your wallet" finale with early-access signup;
- simple subpages.

It replaces the parked October site currently at bleib.pages.dev. Requirements: SITE-01 to SITE-12.

</domain>

<decisions>
## Implementation Decisions

### Structure and behaviour (from docs/site-spec.md: locked)
- **Fixed translucent header:** mark tile + "bleib" wordmark left; EN|DE switch, "GitHub" secondary pill and "Get early access" primary pill right.
- **Hero** (about 2 viewports of scroll):
  - starts as a full-bleed photo (start with `connected-apps.jpg` from the archive, credited) and shrinks into a rounded panel on the right, with a white mark chip on the panel's left edge;
  - eyebrow "Open source · Free · Your keys";
  - H1 "Change AI. Stay yourself.";
  - subline as in the spec;
  - buttons "Get early access" (primary) and "View on GitHub" (secondary), with the note "In development. Free and open source."
- **Story:** a sticky stage of five scenes, in this order with this copy (see the spec):
  - Wallet: "Your context. In one place."
  - Asked once: "Asked once. Remembered."
  - Receipts: "See exactly what each AI saw."
  - Any AI: "Change AI. Keep yourself."
  - You decide: "Your AI suggests. You decide."

  The card morphs between scenes, text and card alternate sides, and each scene has the card content described in the spec.
- **Tick navigation:** a vertical column at the right edge, with labelled buttons that jump to each scene; the active tick is longer.
- **Phones:** below 768px the stage isn't sticky; scenes stack with the cards in their final state; no horizontal scroll at 360px.
- **Finale:**
  - H2 "Keep what's yours." plus a line and the early-access form on the left;
  - on the right, about 12 draggable context cards to drop into a bleib wallet tile ("Go on: put it all in your wallet."), "All yours." when done, and "Take it all out" to reset;
  - a keyboard alternative ("Put everything in the wallet" button; cards focusable and movable with Enter);
  - with reduced motion, no physics.
- **Footer:** mark, "bleib", © 2026; links How it works, Developers, Pricing, Privacy, Impressum, GitHub, EN/DE.
- **Subpages:** `/how-it-works`, `/developers`, `/pricing`, `/privacy`, `/impressum`, each also under `/de/`. Content as in the spec. The Impressum uses clearly marked placeholders and must be flagged to the founders before launch.
- **Early access:**
  - Cloudflare Pages Function `POST /api/early-access` stores `{email, lang, createdAt}` in the KV namespace `EARLY_ACCESS`, keyed by email (idempotent);
  - honeypot field and per-IP rate limit;
  - inline success ("Thanks, you're on the list.") and inline errors;
  - documented export for the founders;
  - no tracking or cookies beyond essentials.
- **Languages:**
  - English at `/`, German at `/de/`, with `hreflang`;
  - the switch keeps the same page;
  - German written natively (hero H1 "KI wechseln. Du selbst bleiben.").

### Visual system (locked)
- **Colours:**
  - paper `#F3EFE7`, cards `#FFFFFF`, tray `#ECE7DD`;
  - ink `#15120F`, with muted ink at 62% and faint at 42%;
  - bleib gold `#F6E79A` only as a highlight or tint background, never as text on light;
  - deep olive `#5C4B00` for small accent text, only where it reaches AA;
  - primary buttons ink with white text.
- **Type:** Inter variable (OFL, from the archive's `dist/fonts`).
  - H1 clamp(34px, 4.6vw, 64px), weight 400, tracking -0.03em;
  - H2 about 37px, weight 400, tracking -0.04em;
  - body 17px/1.5.
- **Radius:** cards 22px, tray 28px, pills 999px.
- **Shadow:** `0 30px 80px -30px rgba(21,18,15,.25)`.
- **Motion:** short eased motion (cubic-bezier(.2,.8,.2,1), 300–600ms), a pause control for the story, and full `prefers-reduced-motion` fallbacks.
- **Mark:** `_archive/bleib-v0/bleib-landing/dist/images/bleib-symbol.svg`, gold on a black rounded tile (as in the archive's `favicon.svg`).
- **Provider marks:** LobeHub icons from the archive (MIT; licence file included).

### Quality bars (locked)
- WCAG 2.2 AA / BITV 2.0:
  - keyboard operable with visible focus;
  - AA contrast and no colour-only meaning;
  - story content available as text to assistive technology.
- Lighthouse mobile ≥ 90 in performance, accessibility, best practices and SEO:
  - images AVIF/WebP with explicit sizes;
  - fonts subset and preloaded;
  - minimal deferred JS;
  - no layout shift.
- `CREDITS.md` lists every image, font and icon with its licence.
- Nothing from roze.ai: no text, images, code or brand assets.

### Tech (locked)
- Astro with static output in `site/` at the repo root.
- Vanilla TypeScript for the scroll stage (IntersectionObserver plus scroll progress); no heavy animation libraries.
- Cloudflare Pages Functions for `/api/early-access`; deploy to the Pages project `bleib`.

### Build process (locked; see .claude/CLAUDE.md)
- Implementation is done by the Codex CLI (`gpt-6.2-sol`, reasoning `high`), supervised by Claude, who reviews diffs and verifies in the browser. Plans should be written as self-contained task briefs a separate builder can execute without this conversation.

### Claude's Discretion
- Astro project layout, component split, i18n mechanism (Astro i18n routing or a dictionary per locale).
- Exact scroll maths for the hero shrink and the scene transitions.
- Drag implementation for the finale (Pointer Events).
- The diagram on `/how-it-works`.
- The rate-limit approach in the Pages Function.
- How the founders export the KV list (script or documented wrangler command).
- Test approach (Playwright smoke and accessibility checks with axe; Lighthouse CI or a manual run).

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Website
- `docs/site-spec.md`: the full design spec. The copy, scene content and behaviour in it are authoritative.
- `.planning/REQUIREMENTS.md`: SITE-01 to SITE-12.
- `.planning/ROADMAP.md`: Phase 1 goal and success criteria.

### Product and brand
- `docs/BRIEF.md`: product, principles, positioning.
- `.claude/CLAUDE.md`: build workflow (Codex builds, Claude supervises) and asset rules.
- `_archive/bleib-v0/bleib-landing/README.md`: asset licences and the old site's accessibility and motion patterns (pause control placement, reduced-motion handling).
- `_archive/bleib-v0/bleib-landing/dist/`: mark, favicon, Inter fonts (OFL), provider icons (MIT), licensed photos.

### Hosting
- `_archive/bleib-v0/CLOUDFLARE_PREVIEW.md`: existing Pages project `bleib`; production branch `main`; output directory and deploy command.

</canonical_refs>

<specifics>
## Specific Ideas

- **Roze reference observations** (structure only, see the spec):
  - hero section about 2× viewport;
  - story frames each about 1 viewport, with one sticky stage element;
  - right-edge tick buttons;
  - headline about 37px, weight 400, tight tracking;
  - muted body at about 62% opacity.
- **German hero:**
  - H1 "KI wechseln. Du selbst bleiben."
  - Subline "bleib bewahrt, was deine KI über dich weiß, verschlüsselt und auf deiner Seite. Es fragt, bevor etwas geteilt wird, und zeigt dir genau, was jede KI gesehen hat."
- **Receipt scene:** the shared facts are gold-highlighted, and a second card reads "This week: 3 AIs saw 11 facts. Nothing about your health left this device."

</specifics>

<deferred>
## Deferred Ideas

- Founders may swap the hero photo for a commissioned one.
- The real Impressum details are needed from the founders before launch.
- The trademark check for "bleib" and the domain choice are outside this phase.
- A blog/notes section is not in v1.

</deferred>

---

*Phase: 01-website*
*Context gathered: 24 November 2026 via PRD Express Path*
