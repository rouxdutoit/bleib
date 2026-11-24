# Connect your AI to bleib

Start `bleib serve` in one terminal. In a second, run `bleib unlock`.

Pair each client separately. Set the destination to where that client sends your information. Use `local` for a model on the same device, `provider:<name>` for the agent's provider, or `third-party:<name>` for another hosted provider. For hosted providers, include `--model <name>` if you know it.

```sh
bleib pair 'Claude Code' --destination provider:Anthropic
bleib connect
bleib setup claude-code --paired
```

Redeem the one-time code in `connect`, then paste the resulting agent credential into the hidden prompt in `setup`. You can run `setup <client>` without `--paired` to print the same snippet with a placeholder. Setup prints to standard output. Merge the single `bleib` entry into your existing settings. Keep the credential in a personal config with restricted read access. Use the same `--home` or `BLEIB_HOME` for every bleib command.

| Run | Where to paste | Check the connection |
|---|---|---|
| `bleib setup claude-desktop --paired` | In Claude Desktop open **Settings → Developer → Edit Config** and merge under `mcpServers`. macOS uses `~/Library/Application Support/Claude/claude_desktop_config.json`, Linux uses `~/.config/Claude/claude_desktop_config.json`, and Windows uses `%APPDATA%\Claude\claude_desktop_config.json`. | Restart Claude Desktop and check for the wallet tools. The wallet daemon is supported on Linux and macOS. [Local MCP setup](https://modelcontextprotocol.io/docs/develop/connect-local-servers) |
| `bleib setup claude-code --paired` | Merge into the user-level `mcpServers` object in `~/.claude.json`. Claude Code also supports project-level `.mcp.json`, which can be checked into version control. | Run `claude mcp get bleib`, then open `/mcp` in a new Claude Code session. [Claude Code MCP](https://code.claude.com/docs/en/mcp) |
| `bleib setup openclaw --paired` | Merge into `mcp.servers` in `~/.openclaw/openclaw.json`. Run `openclaw config file` to locate an overridden path. Use the Gateway on the same machine as bleib. | Run `openclaw mcp doctor bleib --probe` and enable the tools for your session if needed. [OpenClaw MCP](https://docs.openclaw.ai/tools/mcp) |
| `bleib setup hermes --paired` | Merge under `mcp_servers` in `~/.hermes/config.yaml` or your active profile's `config.yaml`. | Run `hermes mcp test bleib` and restart the session. [Hermes MCP guide](https://hermes-agent.nousresearch.com/docs/guides/use-mcp-with-hermes) |
| `bleib setup cursor --paired` | Merge under `mcpServers` in `~/.cursor/mcp.json`. Cursor also reads `.cursor/mcp.json` for project settings. | Open **Customize → Tools & MCP** in Cursor and confirm bleib's tools are enabled. Use a local agent session. [Cursor MCP](https://cursor.com/docs/mcp) |

Ask your client to call `bleib_status` and then `bleib_context_request` with a specific purpose, kind, and question. For example, use `{"purpose":"Choose tea","kinds":["preferences"],"question":"Which tea?"}` after importing the demo workspace. Open the approval link and choose **Allow Once**, then retry the same tool call. Your answer and its receipt should appear.

## Observe the model destination

Use a client whose model base URL can point at loopback and which preserves MCP tool-result text in its model request. Set either or both full upstream endpoints in the environment of `bleib serve`.

| Protocol | Upstream endpoint | Provider name and upstream secret |
|---|---|---|
| OpenAI chat completions | `BLEIB_OPENAI_UPSTREAM=https://api.openai.com/v1/chat/completions` | `BLEIB_OPENAI_PROVIDER` defaults to OpenAI. Set `BLEIB_OPENAI_API_KEY` for the upstream. |
| Anthropic messages | `BLEIB_ANTHROPIC_UPSTREAM=https://api.anthropic.com/v1/messages` | `BLEIB_ANTHROPIC_PROVIDER` defaults to Anthropic. Set `BLEIB_ANTHROPIC_API_KEY` for the upstream. |

Use HTTPS for hosted endpoints. Use a literal loopback address such as `http://127.0.0.1:11434/v1/chat/completions` for a model served on your device. Restart the daemon if you change its upstream settings.

Pair with `--via-proxy openai` or `--via-proxy anthropic`. In the client, use the `modelProxy` base URL printed by `bleib connect` and the paired credential as the client-side API key. Send OpenAI requests to `/v1/chat/completions` with a bearer credential and Anthropic requests to `/v1/messages` with `x-api-key` or a bearer credential. Keep the upstream key in the daemon environment.

For an approved request, keep the opaque bleib reference as the entire text of a tool result. The proxy inserts the note, writes an observed receipt, then starts the upstream request. References work once and expire after ten minutes or on lock. When a request replays a used or expired reference, the proxy inserts a short notice in place of the excerpt. To share again, ask the wallet for another reference. Clients that rewrite tool-result text can use ordinary MCP pairing with declared receipts.

A model or endpoint conflict blocks the request. The owner can open **Requests** to see which pairing was blocked. Open **Receipts** for the observed host, provider, model, and request fingerprint. An observed receipt records a dispatch attempt; the upstream can still reject the request or the connection can fail.
