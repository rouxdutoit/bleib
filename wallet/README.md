# bleib wallet

bleib keeps your notes in an encrypted local wallet. An agent can ask for a short excerpt. You see the excerpt and destination before granting access. Open **Receipts** to see what was shared.

## Try the core loop

Run these from the repository root on Linux or macOS with Node 20 or newer.

1. Build and install the local package. Then run `bleib init`, save a separate copy of the private recovery kit, and type its confirmation word.

   ```sh
   cd wallet
   npm ci
   npm pack
   npm install --global ./bleib-0.2.0.tgz
   bleib init
   ```

2. Run `bleib serve` in one terminal. In another terminal, unlock and import the supplied synthetic workspace. `bleib ui` opens the page in your existing unlocked session.

   ```sh
   bleib unlock
   bleib import openclaw ./test/fixtures/openclaw
   bleib ui
   ```

3. Follow the [client setup guide](docs/setup.md) for Claude Desktop, Claude Code, OpenClaw, Hermes or Cursor. This example declares Claude Code's provider.

   ```sh
   bleib pair 'Claude Code' --destination provider:Anthropic
   bleib connect
   bleib setup claude-code --paired
   ```

4. Ask the client to call `bleib_status`, then `bleib_context_request` with `{"purpose":"Choose tea","kinds":["preferences"],"question":"Which tea?"}`. Open the approval link it shows. Review the excerpt and destination, then select **Allow Once**. Have the client retry the same request if it is still waiting for approval.

5. Open **Receipts** in the wallet page, or run `bleib receipts` and `bleib receipts <receipt-id>`. Open **Access** or use `bleib revoke <agent-name-or-id>` to revoke the connection.

## Other commands

- `bleib --help` lists all commands. Use `--home <directory>` or `BLEIB_HOME` consistently across terminals to use another wallet.
- `bleib import hermes <workspace-or-profile>` reads native `memories/` files or shared workspace memory. For OpenClaw, pass the workspace itself. The importer reads `USER.md`, `MEMORY.md`, and dated notes where present. Imported notes without a recognized category go into **Unsorted private notes**. Classify them in the editor when appropriate. Repeating an import skips previously imported source paths.
- Open **Rules** to review and save a plain-word rule such as “Never share health with hosted models.”
- Run `bleib summary` for this week's summary and `bleib verify-receipts` to check the on-disk receipt chain. Use **Export Receipts** or `bleib export-receipts` to export disclosure records with DPV categories and fingerprints.
- Open **Suggestions** to review agent suggestions or paste memory copied from ChatGPT or Claude.
- `bleib lock` clears the unlocked session. By default it also ends after 15 minutes without owner activity. Set `bleib serve --idle-minutes <minutes>` to choose another interval.
- To reset a forgotten passphrase, start the daemon and run `bleib recover <kit-file>`. Keep a separate backup of the encrypted wallet as well as the kit.
- `bleib connect` gives both stdio and Streamable HTTP settings. Stdio uses `BLEIB_AGENT_TOKEN`. HTTP uses its own bearer header. Both use the same local daemon.

## Data and access

The wallet stores encrypted Markdown and an encrypted journal under `~/.bleib/`. Notes are excerpts of up to one matching line per requested category. Ongoing access applies to the paired agent, destination and kind of information. Every receipt records the stated purpose. Ongoing access lapses after 90 days without a disclosure. Sensitive categories require a separate confirmation for ongoing access. Approvals are made in the local page. Supported clients can show the link through elicitation.

Ordinary pairings produce declared receipts. Proxy pairings record the observed provider, host, model and exact request fingerprint. The receipt records the exact text prepared for release and is saved before handoff. The authenticated checkpoint detects missing receipted history. Comparing a complete restored snapshot with a previous export requires keeping that export separately. The wallet binds to IPv4 loopback. Treat other software running in your OS account as having the same access you do, and isolate agents that can execute arbitrary local commands.

## Development

```sh
npm ci
npm run lint
npm run typecheck
npm test
npm run build
```
