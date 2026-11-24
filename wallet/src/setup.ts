import { stringify } from 'yaml';
import { UserError } from './domain.js';

export const clients = ['claude-desktop', 'claude-code', 'openclaw', 'hermes', 'cursor'] as const;
type Client = (typeof clients)[number];

const locations: Record<Client, string> = {
  'claude-desktop': process.platform === 'darwin' ? '~/Library/Application Support/Claude/claude_desktop_config.json'
    : process.platform === 'win32' ? '%APPDATA%\\Claude\\claude_desktop_config.json'
      : '~/.config/Claude/claude_desktop_config.json',
  'claude-code': '~/.claude.json',
  openclaw: '~/.openclaw/openclaw.json',
  hermes: '~/.hermes/config.yaml',
  cursor: '~/.cursor/mcp.json',
};

export function clientName(input: string | undefined): Client {
  const client = clients.find(name => name === input);
  if (!client) throw new UserError(`Choose a client: ${clients.join(', ')}.`);
  return client;
}

export function setupSnippet(client: Client, home: string, origin: string, credential: string, executable: string, cli: string) {
  const stdio = { command: executable, args: [cli, 'mcp'], env: { BLEIB_HOME: home, BLEIB_AGENT_TOKEN: credential } };
  let snippet;
  if (client === 'openclaw') {
    snippet = JSON.stringify({ mcp: { servers: { bleib: {
      url: `${origin}/mcp`, transport: 'streamable-http', headers: { Authorization: `Bearer ${credential}` },
    } } } }, null, 2);
  } else if (client === 'hermes') {
    snippet = stringify({ mcp_servers: { bleib: stdio } });
  } else {
    snippet = JSON.stringify({
      mcpServers: { bleib: client === 'claude-desktop' ? stdio : { type: 'stdio', ...stdio } },
    }, null, 2);
  }
  return { location: locations[client], snippet: snippet.trimEnd() };
}
