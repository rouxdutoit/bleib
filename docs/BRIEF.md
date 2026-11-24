# bleib: project brief

Status: resumed 24 November 2026 with a new direction. The October 2026 version (social coordination, "Nudge", on-chain permissions) was parked on 29 October. Its site and assets are kept in `_archive/bleib-v0/`, which is not tracked in git.

## The product in one line

**bleib is the open source wallet for your AI context: your memory, rules and permissions, encrypted and yours, used by any agent you choose, with a receipt every time something is shared.**

"bleib" is German for "stay". Your context stays with you when you change AI.

## What it does

1. **Your context, in one place you own.** People, preferences, projects and rules, kept as plain-text files you can read and correct, encrypted at rest. The format is compatible with OpenClaw/Hermes workspace files (`USER.md`, `MEMORY.md`, daily notes).
2. **Any agent can use it, but only what it needs.** One local door: an MCP server, plus a local model proxy for agents whose model endpoint can be set. Agents get the smallest useful answer, not files.
3. **Permission as you go.** The first time an agent needs a kind of information, you're asked once ("Allow once / Always for this agent / No"). The answer is remembered and only re-asked when the agent, the kind of information, or the destination (which model and provider, local or hosted) changes. Rules can be given in plain words ("keep dinner plans under €30"), and agents can't raise their own limits.
4. **Receipts.** Every disclosure is recorded: which agent, which model and provider, exactly what it got, for what, and when. There's a plain-language weekly summary ("What your AI saw").
5. **Agents propose, you decide.** Agents can only propose new memories. You approve them.
6. **Change AI, keep the relationship.** Importers for ChatGPT/Claude memory and OpenClaw/Hermes workspaces.

## Principles (shared with Fazit)

- **Open source and free for everything that keeps your data yours.** Pay only for convenience. Never pay to see your own data, and we never hold a key that lets us read it.
- Local first. No telemetry.
- Plain language. No jargon in the interface ("context", "MCP" and "pseudonymisation" never appear; "Rules", "What your AI saw" and "Names are replaced before sending" do).
- Fail closed: when unsure, ask or withhold.
- Honest figures: never promise anonymity or legal compliance; promise evidence.
- Accessible from day one (WCAG/BITV 2.0). German and English written natively.

## Business model (Bitwarden / Obsidian style)

| Tier | What |
|---|---|
| Free | Wallet, door, consent, receipts, importers, recovery kit, device linking, sync through your own cloud (iCloud, Nextcloud, Syncthing), self-hosted sync server |
| Paid | Hosted end-to-end encrypted Sync & Backup with passkey recovery; later an always-on door in an attested enclave; organisation edition and support |

Organisations: a work part (on the organisation's own server, recoverable by an administrator) and a personal part (never held by the employer), with separate keys.

## Storage and recovery

- **Storage and the door are separate.** Storage can be anywhere, because it's encrypted with keys only the person holds. The door decrypts, so it runs where the person trusts: their device; later their own always-on box or our attested enclave.
- **Recovery is required at setup, before anything is stored.** Options: link another device (QR), passkey-based recovery (WebAuthn PRF; check device support), a printed recovery kit, a trusted person.

## Build on what's established

| Need | Reuse |
|---|---|
| Permission and log model | HCP 2.0 (Loyal Agents: Stanford Digital Economy Lab + Consumer Reports). bleib can be an HCP provider with `storage_encryption: e2e` running in the person's own trust domain (spec §4.8). |
| Memory format | OpenClaw/Hermes workspace Markdown |
| Encryption | age (files), SQLCipher (index, grants, receipts) |
| Kinds of information | W3C DPV personal-data categories, trimmed to about 12 |
| Receipt format | ISO/IEC TS 27560 + DPV; Memory Projection Record digests (IETF individual draft) |
| Agent connection | Official MCP SDK; MCP elicitation where supported, with our own local prompt as fallback |
| Personal-data detection | Presidio and local PII models |
| Later: identity and mandates | A2A agent cards, AP2 intent mandates, EUDI Wallet delegation, W3C VC + Bitstring Status List for revocation (instead of an on-chain registry) |

## Competitive position (research of 24 November 2026; see `docs/research/`)

- **Funded and closed:** Egoist AI Passport ($3M, Y Combinator; launched 7 Oct 2026), First Person Labs "Second" ($10M, a16z; 17 Nov 2026), Plurality, Vana.
- **Standard:** HCP / Context Router (Stanford + Consumer Reports), a working draft with public comments until 27 Nov 2026.
- **Open source with traction:** Basic Memory (AGPL, about 4.7k stars, paid cloud; closest to our business model, but no encryption, consent or receipts), Mem0, Supermemory, Compartment, TotalReclaw. Plus about 15 small specs and projects with 1–5 stars.
- **What nobody ships:** receipts with the exact content disclosed, consent bound to the real destination (model and provider), and both in an open, user-keyed, plain-folder wallet.
- **Position:** be the open, verifiable default ("the Bitwarden of personal AI context"). Lead with proof ("see exactly what each AI saw"), not just portability.

## MVP direction (to be sharpened with the competitor teardown)

- Single-player value on day one: your context, rules and receipts working with the agents you already use (Claude Desktop/Code, ChatGPT connectors, OpenClaw, Hermes, local models).
- Not first: social coordination (Nudge), payments, an agent-to-agent network, mobile apps.

## Website direction

- Closely follow the structure, pacing and simplicity of roze.ai, which also inspired fazit.dev:
  - a full-bleed photo hero that shrinks into a framed panel as you scroll;
  - a sticky product card that changes scene by scene while short headlines change beside it, with a vertical tick navigation;
  - a playful interactive finale;
  - a minimal footer.
- Keep bleib's own logo mark, name, copy and imagery. Use no Roze text, images, code or brand assets.
- Simple single page that links off to subpages (How it works, Developers, Pricing, Privacy).
- Warm, light, paper-like palette with Inter. The bleib gold (#f6e79a) is used as a highlight, and the mark sits on the dark tile from the favicon.
- Must say "Open source" near the top, and show receipts ("what your AI saw") as a hero scene.
- Hosting: Cloudflare Pages project `bleib` (bleib.pages.dev).

## Open decisions

- Trademark check for "bleib" (EUIPO, DPMA) and a domain.
- Whether to keep anything from the October on-chain design. Recommendation: drop it for signed credentials with a revocation list.
- HCP public comment: drafted in `docs/hcp-comment-draft.md`, for the founder to post by 27 Nov 2026.
- Relationship to Fazit (shared report engine and design; shipping order).
