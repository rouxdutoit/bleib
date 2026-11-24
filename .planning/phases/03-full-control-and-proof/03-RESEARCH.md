# Phase 3 — Research

## Client setup

| Client | Configuration and verification |
|---|---|
| Claude Desktop | `mcpServers.bleib` in `~/Library/Application Support/Claude/claude_desktop_config.json` on macOS, `%APPDATA%\Claude\claude_desktop_config.json` on Windows, or `~/.config/Claude/claude_desktop_config.json` on Linux. Use command, args and env, then restart. [Official MCP guide](https://modelcontextprotocol.io/docs/develop/connect-local-servers) |
| Claude Code | User scope in `~/.claude.json`, using `claude mcp add-json` or merging `mcpServers.bleib`. Project scope uses `.mcp.json` and can be shared in Git, so use user scope for the credential. [Claude Code MCP](https://code.claude.com/docs/en/mcp) |
| OpenClaw | `mcp.servers.bleib` in the JSON5 config at `~/.openclaw/openclaw.json`; use `openclaw config file` for the active path. Streamable HTTP supports a URL and headers. Use `openclaw mcp doctor bleib --probe`. [MCP guide](https://docs.openclaw.ai/tools/mcp) [Configuration](https://docs.openclaw.ai/gateway/configuration) |
| Hermes | `mcp_servers.bleib` in `~/.hermes/config.yaml` or the active Hermes home. Stdio uses command, args and env. [Hermes MCP](https://hermes-agent.nousresearch.com/docs/user-guide/features/mcp) |
| Cursor | User config `~/.cursor/mcp.json`, project config `.cursor/mcp.json`. The user snippet uses `mcpServers.bleib` with type stdio, command, args and env. [Cursor MCP](https://cursor.com/docs/mcp) |

## Observing the final request

Pair explicitly for one proxy protocol and pin the endpoint from the owner's daemon configuration. The OpenAI-compatible chat-completions and Anthropic-compatible messages endpoints accept a paired credential. MCP hands the agent a short-lived opaque reference in text form and retains the exact approved projection locally. At the proxy, only tool-result content can contain references. Validate the agent, endpoint, model, current rules, grant IDs, and projection again. Replace the references, hash the exact JSON bytes to be forwarded and commit observed receipts before starting the upstream request. The receipt also hashes the UTF-8 tool-result text. Requests without references retain their original JSON bytes. The network destination comes from a fixed operator configuration. Redirects are disallowed. Only the daemon's upstream credentials are sent upstream.

Observed means bleib prepared and recorded a concrete outbound disclosure before dispatch. A failed network or upstream response cannot prove model consumption. A provider gateway may route beyond the host visible to bleib. [OpenAI Chat Completions API](https://platform.openai.com/docs/api-reference/chat/create) [Anthropic Messages API](https://platform.claude.com/docs/en/api/messages/create)

## OpenClaw hook

Use `before_model_request`, which is awaited after provider payload transforms. The embedded runner exposes the provider-specific payload with provider and model. Enable model request and conversation hooks per plugin. The CLI runner hands text to a subprocess and does not expose the final provider traffic. `llm_input` is telemetry. An independent adapter needs a trusted effective-endpoint source, last-writer protection (later hooks can replace content), and supported-runner coverage. The published hook event lacks the effective URL. Defer the standalone adapter. An OpenClaw model configured to use the loopback proxy can use the proxy path. [OpenClaw prompt and session hooks](https://docs.openclaw.ai/plugins/hooks/prompt-and-session)

## Receipt export

| bleib evidence | ISO/IEC 27560 and DPV | OSAP draft alignment |
|---|---|---|
| Receipt ID and observed or declared disclosure time | Record identifier and processing event time | `receipt_id`, disclosure time extension |
| Local wallet holder, paired agent and destination | PII principal, agent and recipient | `user`, `agent`, `audience` |
| Stated purpose, released kinds and entry versions | Purpose, disclosure processing and DPV personal data categories | `actions`, `resources`, purpose extension |
| Grant IDs, decision mode/time when known, allow outcome | Consent decision provenance and scope | `decision`, grant extension |
| Exact UTF-8 fragment digest, outbound JSON digest when observed, predecessor and record hash | Evidence extensions | Receipt binding evidence extensions |

The export preserves receipt identifiers and local evidence and omits note text. It is a local disclosure record. OSAP task credentials involve signed, audience-bound capability tokens and a different lifecycle. The wallet has no such issuer or signature, and historical decision timestamps can be unavailable. [ISO/IEC TS 27560](https://www.iso.org/standard/80392.html) [DPV consent guide](https://www.w3.org/community/reports/dpvcg/CG-FINAL-guide-27560-20240801/) [DPV personal data categories](https://w3id.org/dpv/pd) [OSAP consent-receipt draft](https://datatracker.ietf.org/doc/draft-zeng-osap-consent-receipts/00/) [Memory Projection Record draft](https://datatracker.ietf.org/doc/draft-ferro-schrock-memory-projection-record/00/)

Maintain an authenticated receipt checkpoint alongside the encrypted journal. It detects deletion of a receipted journal tail with the checkpoint present. A whole-wallet rollback requires an independently retained anchor to detect.
