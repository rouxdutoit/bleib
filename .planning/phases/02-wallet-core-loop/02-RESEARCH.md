# Phase 2: Wallet Core Loop — Research

Verified 2026-11-24 against npm registry metadata and the upstream sources linked below.

## MCP door and consent

The official SDK publishes `@modelcontextprotocol/sdk@1.32.2` (Node >=18), alongside the split v2 `@modelcontextprotocol/server@2.4.0` (Node >=20). Pin 1.32.2 for its mature 2025-era transport and support for both `McpServer` with `StdioServerTransport` and sessionful `StreamableHTTPServerTransport`. Sessionful HTTP supports server-to-client elicitation during calls. The newer 2026-07-28 protocol has an input-required flow in v2. The 2025-11-25 elicitation spec makes both capability negotiation and the distinction between opening a URL and completing the decision explicit. Authenticate and bind each HTTP session to its credential, and check stored agent authorization again when executing every operation. [v1.32.2 source](https://github.com/modelcontextprotocol/typescript-sdk/tree/v1.32.2), [v2 migration](https://github.com/modelcontextprotocol/typescript-sdk/blob/main/docs/migration/support-2026-07-28.md), [2025-11-25 elicitation](https://modelcontextprotocol.io/specification/2025-11-25/client/elicitation), [2025-11-25 transports](https://modelcontextprotocol.io/specification/2025-11-25/basic/transports)

| Client | Evidence and implementation consequence |
|---|---|
| Claude Code | v2.1.287+ documents form and URL support for locally configured legacy-revision connections, with form-only on some other connections. [Documentation](https://code.claude.com/docs/en/mcp#elicitation-modes-claude-code-declares) |
| Cursor | Documents elicitation support without a mode/version minimum on the capability page. Negotiate actual mode at runtime. [Documentation](https://cursor.com/docs/mcp) |
| Hermes Agent | Documents form with Python SDK >=1.11.0, URL declined, and unattended requests declined. [Documentation](https://hermes-agent.nousresearch.com/docs/user-guide/features/mcp#-mcp-elicitation-support) |
| OpenClaw | Documents form and URL for node-hosted MCP with MCP Apps enabled at both ends, and Codex-harness elicitation. These are placement-specific claims. [Node docs](https://docs.openclaw.ai/nodes/mcp-and-skills), [Codex harness docs](https://docs.openclaw.ai/plugins/codex-harness/native-features) |
| Claude Desktop | Documents local extensions and MCP connectors. Claude Code's Desktop Code tab documentation is evidence for that surface. General local Desktop elicitation modes and version floor remain unverified. [Desktop docs](https://support.claude.com/en/articles/10949351-getting-started-with-local-mcp-servers-on-claude-desktop), [Code tab docs](https://code.claude.com/docs/en/mcp#answer-an-elicitation-request-in-a-cloud-session) |

A paired client can synthesize any elicitation response. Send a data-free link prompt for URL mode, or a data-free form pointing to the same link when only form is advertised. No elicitation reply authorizes disclosure. A session created by the owner's unlock covers exact preview and three choices. The tool can recheck authorization after the prompt, with a structured pending result when approval is still needed. This follows the local trust model and the HCP separation of preview and release.

## Encryption, durability and daemon

The plans apply ASVS 5.0.0 Level 1 as a threat-model baseline for local authorization, input handling and data protection. [OWASP ASVS 5.0.0](https://github.com/OWASP/ASVS/tree/v5.0.0)

- Pin Filippo Valsorda's `age-encryption@0.2.4` (typage) for age v1 X25519 files using in-memory Uint8Array or string input. The current npm release 0.3.1 pulls noble v2 packages that declare Node >=20.19. The selected 0.2.4 uses noble v1 and provides the X25519 path for Node 20.0. Its recipient and identity use the age CLI format. The dependency uses JavaScript implementations and platform primitives. No bespoke implementation of the age format. [typage v0.2.4 release](https://github.com/FiloSottile/typage/releases/tag/v0.2.4), [age format](https://age-encryption.org/v1)
- `better-sqlite3-multiple-ciphers@13.2.0` advertises Node >=22 and native prebuilds/build tooling. Choose the brief's age-encrypted JSONL alternative, using one immutable segment per transaction. Write ciphertext to an adjacent temporary file, sync it, publish by atomic link/rename, sync the directory, then expose state to callers. Install remains free of native database builds. Replay cost and file count grow with transactions. Revisit checkpoints or SQLite before large histories. [Native binding upstream](https://github.com/m4heshd/better-sqlite3-multiple-ciphers)
- Use built-in async scrypt from Node 20 with a 16-byte random salt, N=2^17, r=8, p=1 and 256 MiB maxmem. Wrap the age identity using AES-256-GCM with random 96-bit nonce and explicit format binding. Zero the derived Buffer when finished. [Node crypto v20](https://nodejs.org/docs/latest-v20.x/api/crypto.html#cryptoscryptpassword-salt-keylen-options-callback), [RFC 7914](https://www.rfc-editor.org/rfc/rfc7914), [OWASP parameters](https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html)
- Use one serialized writing daemon per home, guarded by the loopback listener, with an owner Unix socket in the mode-0700 wallet and a separate agent-only bridge. Lock drops references and clears browser sessions. JS strings may retain data until garbage collection. Host swap, crash dumps, same-user arbitrary code and full-wallet rollback are outside the guarantees. Public-key age authenticates a file against ciphertext corruption. A key-derived HMAC chain authenticates journal writers and detects interior removal/reordering, while an encrypted digest in the journal binds each Markdown version. No external rollback anchor. [Node 20 IPC](https://nodejs.org/docs/latest-v20.x/api/net.html#ipc-support)
- Digest the exact UTF-8 text returned as the single text block. Keep the canonical text and version references in the receipt. Chain canonical JSON receipt bodies. Pair once consumption and receipt in the same durable commit. The ordering borrows from HCP, and the digest borrows from the Memory Projection Record. OSAP export remains deferred. [Context Router](https://github.com/loyalagents/context-router), [MPR draft](https://datatracker.ietf.org/doc/html/draft-ferro-schrock-memory-projection-record-01), [OSAP draft](https://datatracker.ietf.org/doc/draft-zeng-osap-consent-receipts/)

## Workspace and PCP

The latest published releases linked upstream at verification were OpenClaw v2026.11.7 and Hermes Agent v0.23.3. The layout below is documented in their rolling manuals. [OpenClaw release](https://github.com/openclaw/openclaw/releases/tag/v2026.11.7), [Hermes release](https://github.com/NousResearch/hermes-agent/releases/tag/v0.23.3)

OpenClaw uses root `USER.md`, `MEMORY.md` and dated `memory/YYYY-MM-DD.md`. Hermes native profiles use `memories/USER.md` and `memories/MEMORY.md`, with section markers in native memory files. Accept both native Hermes and the shared workspace layout including daily notes where present. `SOUL.md` configures persona and `AGENTS.md` gives workspace instructions. The importer limits itself to the requested memory files and treats imported content as inert. [OpenClaw workspace](https://docs.openclaw.ai/concepts/agent-workspace), [Hermes migration](https://hermes-agent.nousresearch.com/docs/guides/migrate-from-openclaw), [Hermes memory](https://hermes-agent.nousresearch.com/docs/user-guide/features/memory)

PCP v0.3 requires `title` and `updated` and defines the sensitivity, source basis and validity fields used here. Use `x_category` and `x_created` as PCP extensions for bleib's category and creation time, and accept unprefixed input aliases. Preserve source metadata via the import extension where it would conflict with wallet-owned fields. The tool names follow the purpose of `context_brief` and `memory_propose`, with the founder's `bleib_*` tool names. Full PCP serving, archive exchange and conformance remain separate requirements. [PCP v0.3 §5](https://pcp-protocol.github.io/pcp/SPEC.html#5-memory)

### Data categories

Map owner labels to the W3C DPVCG Personal Data 2.3 taxonomy. Grouped owner labels combine DPV concepts. The unsorted kind is wallet-specific. [DPV Personal Data 2.3](https://w3c-cg.github.io/dpv/2.3/pd/)

| Key | Owner label | DPV basis |
|---|---|---|
| identity | About you | Identifying, Demographic |
| contact | Contact details | Contact |
| preferences | Preferences | Preference |
| work | Work and projects | Professional |
| education | Education and skills | Education, Professional |
| location | Places | Location |
| schedule | Plans and appointments | LifeHistory |
| activities | Activities and interests | Activity, Interest |
| health | Health | Health, MedicalHealth |
| finances | Finances | Financial |
| relationships | Other people's private details | Family, SocialNetwork |
| credentials | Credentials | Authenticating |
| private | Unsorted private notes | Conservative wallet grouping for mixed data |

Health, finances, relationships, credentials and unsorted private notes are sensitive. Explicit sensitive frontmatter also raises the bar for any other category. Projection uses local deterministic, bounded line selection with no model call. Unknown or expired data types and dates are handled conservatively.
