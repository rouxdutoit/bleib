import { GITHUB_URL, type Lang, type RouteKey } from './strings';
import type { IconName } from '../components/icons';
import { INSTALL } from '../config/install';

/**
 * Subpage content (Fazit-style layout: big title and intro, then two-column sections with
 * the heading on the left). Block types:
 *   p       paragraph            list   bullet list         code   command line
 *   never   icon list with hairlines (commitments)          rows   key / value list
 *   tiles   two-up tiles with an optional tag               address  postal lines
 *   compare a checklist: each benefit with a tick or a dash for bleib and for the other way
 *   commands terminal lines as pills, each with a Copy button
 */
/** `ai` shows that AI's own logo beside the title and detail (ProviderLogo). */
export type Tile = { t: string; d: string; icon?: IconName; tag?: string; ai?: string };
export type Block =
  | { p: string }
  | { list: string[] }
  | { code: string }
  | { address: string[] }
  | { never: string[] }
  | { rows: { k: string; v: string }[] }
  | { tiles: Tile[] }
  | { refs: { name: string; href: string; v: string }[] }
  | { commands: string[] }
  | { compare: { head: [string, string]; yes: string; no: string; rows: [string, boolean, boolean][] } };

export interface Section {
  id?: string;
  h: string;
  blocks: Block[];
}

export interface DocPage {
  title: string;
  description: string;
  intro: string[];
  /** Hub links shown under the intro (How it works). */
  hub?: { to: RouteKey; t: string; d: string; icon: IconName }[];
  cta?: { label: string; href: string };
  /** A homepage card shown under the intro (StoryVisual scene index), so each page shows the product too. */
  visual?: number;
  sections: Section[];
}

type Docs = Record<Exclude<RouteKey, 'home'>, DocPage>;

const OPERATOR = ['Ruan “Roux” du Toit', 'Emeranstraße 23', '85622 Feldkirchen', 'Germany'];
const OPERATOR_DE = ['Ruan „Roux“ du Toit', 'Emeranstraße 23', '85622 Feldkirchen', 'Deutschland'];
const SECURITY_MAIL = 'mailto:security@bleib.dev?subject=bleib%20security';

const en: Docs = {
  how: {
    title: 'How it works',
    visual: 0,
    description: 'Keep your memory on your device and share only what each request needs.',
    intro: [
      'bleib keeps your memory on your device. Each AI gets only what it needs for the request.',
      'bleib is in development.',
    ],
    hub: [
      { to: 'permissions', t: 'Permissions', d: 'When bleib asks before sharing.', icon: 'check' },
      { to: 'receipts', t: 'Receipts', d: 'What bleib shared and with whom.', icon: 'fingerprint' },
      { to: 'works', t: 'Works with', d: 'ChatGPT, Claude and Gemini.', icon: 'code' },
      { to: 'standards', t: 'Standards', d: 'The open formats bleib uses.', icon: 'verified_user' },
    ],
    sections: [
      {
        id: 'memory',
        h: 'Your memory',
        blocks: [{ p: 'Your preferences and the things you want your AIs to know, all in one place. Your memory is encrypted on your device, and it’s always yours to read and change.' }],
      },
      {
        id: 'proposals',
        h: 'Save as you go',
        blocks: [
          { p: 'Mention “I prefer aisle seats” in a chat, and bleib saves it quietly, with a × right there to remove it. Everyday preferences like travel, food, budget and work style save this way.' },
          { p: 'Anything sensitive, like health, money, people or location, anything you keep private, or anything bleib isn’t sure about, asks first, in place: “Save to bleib?” Nothing sensitive is ever saved without your yes.' },
          { p: 'You can also bring in what ChatGPT, Claude and Gemini remember. Download your data with each one’s own export (Google Takeout for Gemini) and drop the file into bleib. bleib reads it on your device, and you keep what you like.' },
        ],
      },
      {
        id: 'permissions',
        h: 'Share just enough',
        blocks: [{ p: 'bleib finds the smallest useful part of your memory on your device. The first time it shares with an AI, it asks once. After that, everyday details go into each new chat by themselves, as an “About me” line you can remove. Details bleib isn’t sure about wait for a tap, and sensitive information always asks.' }],
      },
      {
        id: 'suggestions',
        h: 'Suggestions on your device',
        blocks: [
          { p: 'bleib picks what a chat needs with its own small picker and simple rules for everyday tasks: trips, meals, cover letters, work email, gifts, fitness, shopping, going out, learning and health. It runs in your browser, on your device. Nothing you type is sent anywhere for this.' },
          { p: 'On capable computers you can turn on Smarter suggestions. It stays off until you choose it. It uses Granite Embedding Multilingual R2 97M by IBM, also on your device. bleib converted IBM’s model to int8, so it’s smaller and faster, and trained small extra layers on top, on made-up example drafts, never on anyone’s data. bleib didn’t retrain the model itself.' },
          { p: 'No model ever sends what you write off your device. bleib never reads the AI’s answers on its own, and the check before you send a message follows fixed rules on your device.' },
        ],
      },
      {
        id: 'door',
        h: 'Start a new chat',
        blocks: [{ p: 'Start typing your first request. If there’s a match and sharing is allowed, bleib adds a short “About me” line to your draft. You can remove it, and you decide when to send it. If a site changes, bleib pauses until it recognises the page again.' }],
      },
      {
        id: 'receipts',
        h: 'A receipt for every share',
        blocks: [{ p: 'Open your receipts to see what bleib shared, with which AI and when.' }],
      },
      {
        id: 'limits',
        h: 'Shared when added',
        blocks: [{ p: 'The site can read the line as soon as bleib adds it. You can remove it from your draft, but the site may already have seen it.' }],
      },
      {
        id: 'compare',
        h: 'bleib and the memory in each AI',
        blocks: [{
          compare: {
            head: ['bleib', 'Each AI'],
            yes: 'Yes',
            no: 'No',
            rows: [
              ['One memory for every AI', true, false],
              ['Kept encrypted on your device', true, false],
              ['Each chat gets only what it needs', true, false],
              ['A receipt for every share', true, false],
              ['Comes with you when you switch AI', true, false],
              ['Free and open source', true, false],
            ],
          },
        }],
      },
      {
        id: 'recovery',
        h: 'Get your memory back',
        blocks: [{ p: 'Keep your recovery kit somewhere safe, away from your device. If you forget your passphrase, it lets you unlock your memory again.' }],
      },
    ],
  },
  works: {
    title: 'Works with your AI',
    description: 'Use your memory in ChatGPT, Claude and Gemini.',
    intro: ['The bleib browser extension is in development for Chrome and Firefox. It works on recognised pages on these three sites.'],
    sections: [
      {
        h: 'In your browser',
        blocks: [
          {
            tiles: [
              { t: 'ChatGPT', d: 'chatgpt.com', ai: 'ChatGPT' },
              { t: 'Claude', d: 'claude.ai', ai: 'Claude' },
              { t: 'Gemini', d: 'gemini.google.com', ai: 'Gemini' },
            ],
          },
          { p: 'On these sites bleib can save everyday preferences, each removable with one tap, and add a line about you to each new chat. If a site changes, bleib pauses until it recognises the page again.' },
        ],
      },
      {
        h: 'Coming later: AI tools on your computer',
        blocks: [{ p: 'A desktop add-on will connect Claude Desktop, Claude Code, Cursor, OpenClaw and Hermes. Your memory stays in your bleib.' }],
      },
    ],
  },
  permissions: {
    title: 'Permissions',
    visual: 3,
    description: 'Choose what each AI can get from your memory.',
    intro: ['bleib checks what a request needs on your device. It picks only the relevant minimum and asks once before the first share with each AI.'],
    sections: [
      {
        h: 'Your choices',
        blocks: [
          { p: 'bleib shows what it would share and where it would go. You can decline or choose how to allow it.' },
          {
            rows: [
              { k: 'Always add', v: 'Everyday details go into this AI’s new chats by themselves. You choose this for each AI.' },
              { k: 'Just this once', v: 'Add them to this message only.' },
              { k: 'Allow Once', v: 'For sensitive details: share for this request only.' },
            ],
          },
        ],
      },
      {
        h: 'bleib always asks about sensitive information',
        blocks: [{ p: 'Health, money, people and location always need your approval for each request. So does anything you keep private or bleib can’t confidently classify. Saving follows the same rule: these ask first, everyday preferences save quietly, and you remove them with one tap.' }],
      },
      {
        h: 'Change your mind',
        blocks: [{ p: 'You can change permissions or disconnect an AI in bleib at any time. That takes effect on future requests. The AI provider may still have what it already received.' }],
      },
    ],
  },
  receipts: {
    title: 'Receipts',
    visual: 4,
    description: 'See what bleib shared from your memory.',
    intro: ['Before every share, bleib saves a receipt on your device. Sharing only happens once the receipt is saved.'],
    sections: [
      {
        h: 'What a receipt shows',
        blocks: [
          {
            rows: [
              { k: 'Who and where', v: 'The AI and the destination bleib knew about.' },
              { k: 'What and why', v: 'The exact text bleib released and the reason given for the request.' },
              { k: 'When and how', v: 'The time and the permission that allowed the share.' },
            ],
          },
        ],
      },
      {
        h: 'In a chat draft',
        blocks: [{ p: 'The receipt records what bleib released for the draft. If the draft changes at the last moment, bleib may already have saved a receipt. The receipt stays if you remove the line, and is independent of whether you press Send.' }],
      },
      {
        h: 'Check or export',
        blocks: [{ p: 'Receipts are encrypted. Each links to the one before it so bleib can check for changes. You can export a record of the shares with fingerprints of the text.' }],
      },
    ],
  },
  standards: {
    title: 'Standards and formats',
    description: 'The open formats bleib uses for connections, memory and receipts.',
    intro: ['bleib uses open standards so other tools can connect and you can check how your memory is stored and shared.'],
    sections: [
      {
        h: 'Connecting AI',
        blocks: [{ p: 'With the desktop add-on, coming later, the Model Context Protocol (MCP) will let AI tools on your computer ask bleib for what a task needs.' }],
      },
      {
        h: 'Storing your memory',
        blocks: [{ p: 'bleib encrypts your memories in your browser with AES-256-GCM, which your browser has built in. Your passphrase is strengthened with Argon2id. It reads the data exports from ChatGPT, Claude and Gemini on your device.' }],
      },
      {
        h: 'Exporting receipts',
        blocks: [{ p: 'Receipt exports use categories from the W3C Data Privacy Vocabulary and draw on ISO/IEC TS 27560 for consent records.' }],
      },
    ],
  },
  security: {
    title: 'Security and privacy',
    visual: 5,
    description: 'How bleib protects your memory and what it trusts on your device.',
    intro: ['Only you can read your memory. It’s encrypted on your device, with no account and no tracking. Every share leaves a receipt, and the code is open.'],
    cta: { label: 'Report a vulnerability', href: SECURITY_MAIL },
    sections: [
      {
        h: 'On your device',
        blocks: [{ p: 'bleib encrypts your memories, permissions and receipts. It picks what a request needs on your device and asks every time about sensitive information.' }],
      },
      {
        h: 'What bleib trusts',
        blocks: [
          { p: 'bleib keeps your memory encrypted in your browser profile and unlocks it only for you. It relies on your browser and your device’s user account. Someone who controls them could see what bleib shows while it’s unlocked.' },
          { p: 'You keep your recovery kit somewhere else. bleib keeps no copy of it.' },
        ],
      },
      {
        h: 'On an AI site',
        blocks: [{ p: 'The site and other extensions with access to the page can read text in the draft as soon as bleib adds it.' }],
      },
      {
        h: 'Report a vulnerability',
        blocks: [{ p: 'Email security@bleib.dev.' }],
      },
    ],
  },
  developers: {
    title: 'Developers',
    description: 'The bleib desktop add-on, MCP and open formats, coming later.',
    intro: ['bleib is free, open source and in development. It starts as a browser extension. A desktop add-on comes later and brings MCP, so AI tools on your computer can connect.'],
    cta: { label: 'View on GitHub', href: GITHUB_URL },
    sections: [
      // Once @bleib/wallet is on npm (INSTALL.walletCli), the desktop apps connect with one line instead.
      INSTALL.walletCli ? {
        h: 'Connect your desktop AI apps',
        blocks: [
          { p: 'Run one line in your terminal to connect an AI app on your computer to your bleib. You choose what each app may see.' },
          { commands: ['npx @bleib/wallet connect claude-desktop', 'npx @bleib/wallet connect claude-code', 'npx @bleib/wallet connect codex', 'npx @bleib/wallet connect cursor', 'npx @bleib/wallet connect gemini'] },
        ],
      } : {
        h: 'Coming later: the desktop add-on',
        blocks: [
          { p: 'The add-on will let Claude Desktop, Claude Code, Cursor, OpenClaw, Hermes and other MCP clients ask bleib for what a task needs. Each tool gets its own connection, and the person approves what it may see.' },
          { p: 'Agents will never unlock bleib, widen their own access or approve themselves.' },
          { p: 'Follow along on GitHub, and tell us what you need.' },
        ],
      },
      {
        h: 'Built on',
        blocks: [
          { p: 'bleib stands on open work by others. Thank you.' },
          {
            refs: [
              { name: 'Model Context Protocol', href: 'https://modelcontextprotocol.io', v: 'How AI tools will connect to the desktop add-on.' },
              { name: 'OpenClaw', href: 'https://docs.openclaw.ai/concepts/memory', v: 'The workspace memory format bleib reads and writes.' },
              { name: 'Hermes Agent', href: 'https://hermes-agent.nousresearch.com', v: 'By Nous Research; uses the same workspace format.' },
              { name: 'Human Context Protocol', href: 'https://github.com/loyalagents/hcp-spec', v: 'By Loyal Agents (Stanford Digital Economy Lab and Consumer Reports); the model for permissions and logs.' },
              { name: 'ISO/IEC TS 27560', href: 'https://www.iso.org/standard/80392.html', v: 'The structure of consent records.' },
              { name: 'W3C Data Privacy Vocabulary', href: 'https://w3id.org/dpv', v: 'The kinds of personal information.' },
              { name: 'OSAP consent receipts', href: 'https://datatracker.ietf.org/doc/draft-zeng-osap-consent-receipts/', v: 'IETF draft; the receipt export.' },
              { name: 'Memory Projection Record', href: 'https://datatracker.ietf.org/doc/draft-ferro-schrock-memory-projection-record/', v: 'IETF draft; a fingerprint of exactly what was released.' },
              { name: 'age', href: 'https://age-encryption.org', v: 'By Filippo Valsorda; will encrypt the desktop add-on’s files.' },
            ],
          },
        ],
      },
      {
        h: 'Open-source software in bleib',
        blocks: [
          { p: 'bleib ships with these open parts. Thank you to everyone who made them.' },
          {
            refs: [
              { name: 'Argon2 (argon2-browser)', href: 'https://github.com/antelle/argon2-browser', v: 'By Antelle, MIT licence; the Argon2 reference code is under CC0 1.0 or Apache-2.0. Strengthens your passphrase on your device.' },
              { name: 'Inter', href: 'https://rsms.me/inter/', v: 'By the Inter Project Authors, SIL Open Font License 1.1. The typeface in bleib and on this site.' },
              { name: 'Material Symbols Rounded', href: 'https://fonts.google.com/icons', v: 'By Google, Apache-2.0. The symbols in bleib and on this site.' },
              { name: 'LobeHub Icons', href: 'https://github.com/lobehub/lobe-icons', v: 'By LobeHub, MIT licence. The ChatGPT, Claude and Gemini logos. The logos are trademarks of their owners.' },
              { name: 'Granite Embedding Multilingual R2 97M', href: 'https://huggingface.co/ibm-granite/granite-embedding-97m-multilingual-r2', v: 'By IBM, licensed under Apache-2.0, including its tokenizer. Used for Smarter suggestions if you turn them on. bleib converted it to int8, so it’s smaller and faster, and trained small layers on top; bleib didn’t retrain the model itself.' },
              { name: 'ONNX Runtime Web', href: 'https://onnxruntime.ai', v: 'By Microsoft, MIT licence. Runs Smarter suggestions in your browser.' },
            ],
          },
          { p: 'Apache-2.0 licence text: apache.org/licenses/LICENSE-2.0. The full licence files ship with the extension.' },
        ],
      },
      {
        h: 'Licence',
        blocks: [
          {
            rows: [
              { k: 'bleib', v: 'AGPL-3.0-or-later' },
              { k: 'File format, spec and SDK', v: 'Apache-2.0' },
            ],
          },
          { p: 'bleib stays open: anyone who runs a changed version as a service must share their changes. The format and SDK are permissive, so any AI app can integrate bleib freely.' },
        ],
      },
      {
        h: 'Get involved',
        blocks: [{ p: 'The code is on GitHub at github.com/rouxdutoit/bleib. Open an issue, send a pull request, or write to hello@bleib.dev. Please report security issues to security@bleib.dev, not in public.' }],
      },

    ],
  },
  pricing: {
    title: 'Pricing',
    description: 'bleib is free and open source. Pay only for convenience later.',
    intro: ['bleib is free and open source. Your memory, AI connections, permissions, receipts and imports are free.'],
    sections: [
      {
        h: 'Optional sync, later',
        blocks: [{ p: 'Like Bitwarden, bleib plans to charge only for convenience. The planned hosted sync is optional and end-to-end encrypted. Your device will encrypt your memory before uploading it, so we can’t read it.' }],
      },
    ],
  },
  privacy: {
    title: 'Website privacy',
    description: 'How the bleib website handles your data.',
    intro: [
      'This notice covers the website and early access. See App privacy for how bleib and its browser extension handle your memory.',
    ],
    sections: [
      {
        h: 'In short',
        blocks: [
          {
            never: [
              'No cookies, no analytics, no tracking.',
              'No third-party requests. Fonts, icons and files are served with this site.',
            ],
          },
        ],
      },
      {
        h: 'Early access',
        blocks: [
          {
            rows: [
              { k: 'What we store', v: 'Your email address, your language and the time you signed up' },
              { k: 'Why', v: 'To tell you when bleib is available' },
              { k: 'Legal basis', v: 'Your consent, Article 6(1)(a) GDPR' },
              { k: 'How long', v: 'Until bleib launches and we have written to you, or until you ask us to delete it' },
              { k: 'Where', v: 'A private Bunny Storage zone in Frankfurt am Main, not replicated (see Hosting)' },
            ],
          },
          { p: 'To stop automated sign-ups, we count attempts per IP address for up to two minutes. The counter is kept only in the server’s memory, under a shortened one-way hash of the address, never the address itself, and is never written to disk. The legal basis is Article 6(1)(f) GDPR, our legitimate interest in protecting the form.' },
          { p: 'You can withdraw your consent at any time by writing to privacy@bleib.dev. We delete your entry and confirm by email.' },
        ],
      },
      { h: 'Local storage', blocks: [{ p: 'If you switch between light and dark mode, your browser remembers the choice in its local storage. It stays in your browser and is never sent to us. You can clear it in your browser settings.' }] },
      {
        h: 'Hosting',
        blocks: [{ p: 'This site and the early-access list are hosted by BunnyWay d.o.o., Dunajska cesta 165, Ljubljana, Slovenia (bunny.net). The site’s files are stored in Frankfurt am Main, with a copy in Stockholm, and are delivered only from data centres in the European Union. Early-access sign-ups are stored only in Frankfurt. When you open a page, Bunny’s servers receive your IP address and technical request details, such as the requested address and browser information. They use this data to deliver the page and protect the site from attacks. Bunny shortens IP addresses in its logs and deletes the logs after three days. We have a data processing agreement with Bunny under Article 28 GDPR. The legal basis is Article 6(1)(f) GDPR, our legitimate interest in operating a secure and functional site.' }],
      },
      {
        h: 'Contact',
        blocks: [{ p: 'If you email or call, we use your message and contact details to respond. The legal basis is Article 6(1)(b) GDPR for contract-related enquiries and Article 6(1)(f) GDPR for our legitimate interest in answering other enquiries. We delete the data when it is no longer needed, unless the law requires us to keep it longer.' }],
      },
      { h: 'Controller', blocks: [{ address: [...OPERATOR, 'Email privacy@bleib.dev', 'Telephone +49 162 7850608'] }] },
      { h: 'Links to other sites', blocks: [{ p: 'If you follow a link to another site, its privacy policy applies there.' }] },
      {
        h: 'Your rights',
        blocks: [{ p: 'Under the GDPR you can request access (Article 15), rectification (Article 16), erasure (Article 17), restriction of processing (Article 18) and data portability (Article 20). You can object to processing based on legitimate interest (Article 21) and withdraw consent at any time (Article 7(3)). You can lodge a complaint with a supervisory authority (Article 77), for example the Bayerisches Landesamt für Datenschutzaufsicht, Promenade 18, 91522 Ansbach, Germany.' }],
      },
      { h: 'Changes', blocks: [{ p: 'We update this notice when what we do changes. Last updated: 25 November 2026.' }] },
    ],
  },
  appPrivacy: {
    title: 'App privacy',
    description: 'How bleib and its browser extension handle your memory.',
    intro: ['Only you can read your memory. bleib is in development and starts as a browser extension, with no bleib account, telemetry, analytics or automatic crash reporting.'],
    sections: [
      {
        h: 'In short',
        blocks: [
          {
            never: [
              'Your memory is encrypted on your device. No bleib server ever receives it.',
              'No account, no tracking, no analytics.',
              'An AI gets only what bleib places in its message box, and private details always ask first.',
              'Never sold, never used for advertising or credit decisions.',
            ],
          },
        ],
      },
      {
        h: 'What the extension reads',
        blocks: [
          { p: 'bleib works only on the AI sites you allow. It asks for chatgpt.com, claude.ai and gemini.google.com one at a time, and you can take access back at any time.' },
          { p: 'On those sites, bleib checks what you type in the draft, on your device. It finds relevant memories, recognises preferences to save and spots likely secrets, such as passwords or card numbers, before you send. This check runs on your device and doesn’t keep what it finds.' },
          { p: 'When you bring in your memories, bleib reads the export file you choose, or the text you paste with Paste answer. It reads your clipboard only at that moment. Everything is processed on your device, and nothing is uploaded.' },
          { p: 'Suggestions are worked out on your device, by bleib’s own small picker or, if you turn on Smarter suggestions, by IBM’s Granite Embedding model. No model sends what you write anywhere. bleib never reads the AI’s answers on its own.' },
        ],
      },
      {
        h: 'What bleib keeps',
        blocks: [
          { list: [
            'Your memories and entries waiting for review, including their source.',
            'Permissions, details of the AIs you use, and receipts for shares.',
          ] },
          { p: 'bleib encrypts these records in your browser, on your device. No bleib server receives your memory or your drafts.' },
          { p: 'If you turn on automatic backup, bleib writes an encrypted backup to a folder you choose. Backups, recovery kits and exports go only where you save them.' },
        ],
      },
      {
        h: 'What AI providers can see',
        blocks: [
          { p: 'bleib picks the relevant minimum on your device and saves a receipt before sharing. As soon as it places details in an AI’s message box, the AI provider can read them, even before you press Send. You can remove them from the draft, but the provider may already have seen them. The provider’s privacy policy applies to what it receives.' },
          { p: 'If you connect a supported AI app, bleib shares only details your choices allow. bleib asks each time before sharing private details. The app may keep or forward what it receives.' },
        ],
      },
      {
        h: 'What bleib never does',
        blocks: [
          { never: [
            'Sell your data.',
            'Use it for advertising, or pass it to advertisers or analytics services.',
            'Use it to decide on loans or creditworthiness.',
          ] },
          { p: 'bleib uses your data only to run your wallet for you.' },
        ],
      },
      {
        h: 'Manage your data',
        blocks: [{ p: 'You can review and change your memory and disconnect an AI in bleib. Removing the extension deletes its data from your browser. Make a backup first. For copies already held by an AI provider or a connected app, use its own controls.' }],
      },
      {
        h: 'Contact',
        blocks: [{ p: 'For questions about bleib and your data, write to privacy@bleib.dev. Last updated 26 November 2026.' }],
      },
    ],
  },
  impressum: {
    title: 'Legal notice',
    description: 'Legal notice for the bleib website.',
    intro: ['Information under § 5 DDG.'],
    sections: [
      { h: 'Operator', blocks: [{ address: OPERATOR }] },
      { h: 'Contact', blocks: [{ address: ['Email hello@bleib.dev', 'Telephone +49 162 7850608'] }] },
      { h: 'Responsible for content', blocks: [{ p: 'Under § 18(2) MStV.' }, { address: OPERATOR }] },
      { h: 'About bleib', blocks: [{ p: 'bleib is free, open source and in development. bleib is licensed under AGPL-3.0-or-later. The file format, specification and SDK are under Apache-2.0. Open-source software and models in bleib are credited on the Developers page.' }] },
    ],
  },
};

const de: Docs = {
  how: {
    title: 'So funktioniert’s',
    visual: 0,
    description: 'Dein Gedächtnis bleibt auf deinem Gerät. Du teilst nur, was die KI für die Anfrage braucht.',
    intro: [
      'bleib bewahrt dein Gedächtnis auf deinem Gerät auf. Jede KI bekommt nur das, was sie für die jeweilige Anfrage braucht.',
      'bleib ist in Entwicklung.',
    ],
    hub: [
      { to: 'permissions', t: 'Berechtigungen', d: 'Wann bleib dich vor dem Teilen fragt.', icon: 'check' },
      { to: 'receipts', t: 'Belege', d: 'Was bleib mit wem geteilt hat.', icon: 'fingerprint' },
      { to: 'works', t: 'Kompatibilität', d: 'ChatGPT, Claude und Gemini.', icon: 'code' },
      { to: 'standards', t: 'Standards', d: 'Die offenen Formate von bleib.', icon: 'verified_user' },
    ],
    sections: [
      {
        id: 'memory',
        h: 'Dein Gedächtnis',
        blocks: [{ p: 'Deine Vorlieben und alles, was deine KIs über dich wissen sollen, an einem Ort. Dein Gedächtnis ist auf deinem Gerät verschlüsselt, und du kannst es jederzeit lesen und ändern.' }],
      },
      {
        id: 'proposals',
        h: 'Beim Schreiben speichern',
        blocks: [
          { p: 'Schreib im Chat zum Beispiel „Ich buche immer einen Gangplatz“, und bleib speichert es im Hintergrund. Mit dem × daneben entfernst du es direkt wieder. So speichert bleib alltägliche Vorlieben wie Reisen, Essen, Budget und Arbeitsweise.' },
          { p: 'Alles Sensible wie Gesundheit, Geld, Personen oder Aufenthaltsort, alles, was du privat hältst, und alles, was bleib nicht sicher einordnen kann, fragt vorher, direkt im Chat: „In bleib sichern?“ Nichts Sensibles wird ohne dein Ja gespeichert.' },
          { p: 'Du kannst auch mitnehmen, was ChatGPT, Claude und Gemini über dich gespeichert haben. Lade deine Daten über den Export des jeweiligen Anbieters herunter (bei Gemini über Google Takeout) und zieh die Datei in bleib. bleib liest sie auf deinem Gerät, und du behältst, was dir gefällt.' },
        ],
      },
      {
        id: 'permissions',
        h: 'Nur das Nötige teilen',
        blocks: [{ p: 'bleib sucht auf deinem Gerät den kleinsten nützlichen Teil deines Gedächtnisses. Wenn es zum ersten Mal mit einer KI teilt, fragt es einmal. Danach kommen alltägliche Angaben von selbst in jeden neuen Chat, als „Über mich“-Zeile, die du entfernen kannst. Angaben, bei denen bleib unsicher ist, warten auf einen Tipp, und bei sensiblen Angaben fragt bleib immer.' }],
      },
      {
        id: 'suggestions',
        h: 'Vorschläge auf deinem Gerät',
        blocks: [
          { p: 'bleib wählt mit einer eigenen kleinen Auswahl und einfachen Regeln für Alltagsaufgaben aus, was ein Chat braucht: Reisen, Essen, Bewerbungen, Arbeitsmails, Geschenke, Fitness, Einkaufen, Ausgehen, Lernen und Gesundheit. Das läuft in deinem Browser auf deinem Gerät. Nichts, was du schreibst, wird dafür irgendwohin gesendet.' },
          { p: 'Auf leistungsstarken Computern kannst du „Klügere Vorschläge“ einschalten. Sie bleiben aus, bis du sie wählst. Sie nutzen Granite Embedding Multilingual R2 97M von IBM, ebenfalls auf deinem Gerät. bleib hat IBMs Modell in int8 umgewandelt, damit es kleiner und schneller ist, und kleine zusätzliche Schichten darauf trainiert, mit erfundenen Beispielentwürfen, nie mit Daten von Menschen. Das Modell selbst hat bleib nicht neu trainiert.' },
          { p: 'Kein Modell sendet je, was du schreibst, von deinem Gerät weg. bleib liest die Antworten der KI nie von sich aus, und die Prüfung vor dem Senden folgt festen Regeln auf deinem Gerät.' },
        ],
      },
      {
        id: 'door',
        h: 'Einen neuen Chat beginnen',
        blocks: [{ p: 'Schreib deine erste Anfrage. Wenn etwas passt und die Freigabe vorliegt, ergänzt bleib eine kurze „Über mich“-Zeile im Entwurf. Du kannst sie entfernen, und du entscheidest, wann du ihn abschickst. Ändert sich eine Seite, pausiert bleib, bis es sie wieder erkennt.' }],
      },
      {
        id: 'receipts',
        h: 'Ein Beleg für jede Freigabe',
        blocks: [{ p: 'In deinen Belegen siehst du, was bleib wann mit welcher KI geteilt hat.' }],
      },
      {
        id: 'limits',
        h: 'Geteilt beim Einfügen',
        blocks: [{ p: 'Die Website kann den Text lesen, sobald bleib ihn einfügt. Du kannst ihn aus deinem Entwurf entfernen. Die Website kann ihn dann schon gesehen haben.' }],
      },
      {
        id: 'compare',
        h: 'bleib und das Gedächtnis jeder KI',
        blocks: [{
          compare: {
            head: ['bleib', 'Jede KI'],
            yes: 'Ja',
            no: 'Nein',
            rows: [
              ['Ein Gedächtnis für jede KI', true, false],
              ['Verschlüsselt auf deinem Gerät', true, false],
              ['Jeder Chat bekommt nur das Nötige', true, false],
              ['Ein Beleg für jede Weitergabe', true, false],
              ['Kommt mit, wenn du die KI wechselst', true, false],
              ['Kostenlos und quelloffen', true, false],
            ],
          },
        }],
      },
      {
        id: 'recovery',
        h: 'Dein Gedächtnis zurückholen',
        blocks: [{ p: 'Bewahre dein Wiederherstellungs-Kit an einem sicheren Ort außerhalb deines Geräts auf. Wenn du dein Passwort vergisst, entsperrst du damit dein Gedächtnis wieder.' }],
      },
    ],
  },
  works: {
    title: 'Funktioniert mit deiner KI',
    description: 'Nutze dein Gedächtnis in ChatGPT, Claude und Gemini.',
    intro: ['Die Browser-Erweiterung für Chrome und Firefox ist in Entwicklung. Sie funktioniert auf Seiten dieser drei Anbieter, die bleib erkennt.'],
    sections: [
      {
        h: 'Im Browser',
        blocks: [
          {
            tiles: [
              { t: 'ChatGPT', d: 'chatgpt.com', ai: 'ChatGPT' },
              { t: 'Claude', d: 'claude.ai', ai: 'Claude' },
              { t: 'Gemini', d: 'gemini.google.com', ai: 'Gemini' },
            ],
          },
          { p: 'Auf diesen Seiten kann bleib alltägliche Vorlieben speichern und eine Zeile über dich in jeden neuen Chat einfügen. Jede gespeicherte Angabe entfernst du mit einem Tipp. Ändert sich eine Seite, pausiert bleib, bis es sie wieder erkennt.' },
        ],
      },
      {
        h: 'Später: KI-Tools auf deinem Rechner',
        blocks: [{ p: 'Ein Desktop-Add-on verbindet später Claude Desktop, Claude Code, Cursor, OpenClaw und Hermes. Dein Gedächtnis bleibt in deinem bleib.' }],
      },
    ],
  },
  permissions: {
    title: 'Berechtigungen',
    visual: 3,
    description: 'Entscheide, was jede KI aus deinem Gedächtnis sehen darf.',
    intro: ['bleib wählt auf deinem Gerät nur aus, was zur Anfrage passt. Bevor eine KI zum ersten Mal etwas bekommt, fragt bleib dich einmal.'],
    sections: [
      {
        h: 'Du entscheidest',
        blocks: [
          { p: 'bleib zeigt dir, was es teilen würde und wohin es geht. Du kannst ablehnen oder eine Freigabe erteilen.' },
          {
            rows: [
              { k: 'Immer hinzufügen', v: 'Alltägliche Angaben kommen von selbst in neue Chats mit dieser KI. Das entscheidest du für jede KI einzeln.' },
              { k: 'Nur dieses Mal', v: 'Nur für diese Nachricht.' },
              { k: 'Einmal erlauben', v: 'Für sensible Angaben: gilt nur für diese Anfrage.' },
            ],
          },
        ],
      },
      {
        h: 'Bei sensiblen Angaben fragt bleib jedes Mal',
        blocks: [{ p: 'Bei Angaben zu Gesundheit, Geld, Personen und Aufenthaltsort braucht bleib für jede Anfrage deine Zustimmung. Das gilt auch für alles, was du privat hältst oder was bleib nicht sicher einordnen kann. Beim Speichern gilt dieselbe Regel: Diese Angaben fragen vorher, alltägliche Vorlieben speichert bleib im Hintergrund, und du entfernst sie mit einem Tipp.' }],
      },
      {
        h: 'Zugriff ändern',
        blocks: [{ p: 'Du kannst Berechtigungen jederzeit ändern oder eine KI trennen. Das gilt für künftige Anfragen. Was der KI-Anbieter schon erhalten hat, kann er weiterhin gespeichert haben.' }],
      },
    ],
  },
  receipts: {
    title: 'Belege',
    visual: 4,
    description: 'Sieh nach, was bleib aus deinem Gedächtnis geteilt hat.',
    intro: ['Vor jeder Freigabe speichert bleib einen Beleg auf deinem Gerät. Geteilt wird erst, wenn der Beleg gespeichert ist.'],
    sections: [
      {
        h: 'Was auf dem Beleg steht',
        blocks: [
          {
            rows: [
              { k: 'Wer und wohin', v: 'Die KI und das Ziel, das bleib kannte.' },
              { k: 'Was und wofür', v: 'Der genaue Wortlaut und der angegebene Zweck der Anfrage.' },
              { k: 'Wann und wie', v: 'Der Zeitpunkt und die Berechtigung für die Freigabe.' },
            ],
          },
        ],
      },
      {
        h: 'Im Chatentwurf',
        blocks: [{ p: 'Der Beleg zeigt, was bleib für den Entwurf freigegeben hat. Er kann schon vorliegen, wenn sich der Entwurf vor dem Einfügen ändert. Auch wenn du die Zeile entfernst, bleibt er erhalten, egal ob du den Chat abgeschickt hast.' }],
      },
      {
        h: 'Prüfen oder exportieren',
        blocks: [{ p: 'Deine Belege sind verschlüsselt. Jeder ist mit dem vorherigen verknüpft, damit bleib Änderungen erkennen kann. Du kannst die Freigaben mit digitalen Fingerabdrücken der geteilten Texte exportieren.' }],
      },
    ],
  },
  standards: {
    title: 'Standards und Formate',
    description: 'Die offenen Formate für Verbindungen, dein Gedächtnis und Belege.',
    intro: ['Mit offenen Standards können andere Tools andocken. Du kannst nachvollziehen, wie bleib dein Gedächtnis speichert und teilt.'],
    sections: [
      {
        h: 'KI verbinden',
        blocks: [{ p: 'Mit dem Desktop-Add-on, das später kommt, können KI-Tools auf deinem Rechner über das Model Context Protocol (MCP) bei bleib anfragen, was eine Aufgabe braucht.' }],
      },
      {
        h: 'Dein Gedächtnis speichern',
        blocks: [{ p: 'bleib verschlüsselt deine Erinnerungen in deinem Browser mit AES-256-GCM, das dein Browser schon mitbringt. Deine Passphrase wird mit Argon2id gestärkt. Die Datenexporte von ChatGPT, Claude und Gemini liest es auf deinem Gerät.' }],
      },
      {
        h: 'Belege exportieren',
        blocks: [{ p: 'Beim Export nutzt bleib Kategorien aus dem W3C Data Privacy Vocabulary. Das Format für Freigaben orientiert sich an ISO/IEC TS 27560.' }],
      },
    ],
  },
  security: {
    title: 'Sicherheit und Datenschutz',
    visual: 5,
    description: 'Wie bleib dein Gedächtnis schützt und worauf es sich auf deinem Gerät verlässt.',
    intro: ['Nur du kannst dein Gedächtnis lesen. Es ist auf deinem Gerät verschlüsselt, ohne Konto und ohne Tracking. Jede Freigabe hinterlässt einen Beleg, und der Quellcode ist offen.'],
    cta: { label: 'Sicherheitslücke melden', href: SECURITY_MAIL },
    sections: [
      {
        h: 'Auf deinem Gerät',
        blocks: [{ p: 'bleib verschlüsselt deine Erinnerungen, Berechtigungen und Belege. Es wählt auf deinem Gerät aus, was die KI für ihre Anfrage braucht. Bei sensiblen Angaben fragt es jedes Mal.' }],
      },
      {
        h: 'Worauf bleib sich verlässt',
        blocks: [
          { p: 'bleib bewahrt dein Gedächtnis verschlüsselt in deinem Browserprofil auf und entsperrt es nur für dich. Es verlässt sich auf deinen Browser und dein Benutzerkonto auf dem Gerät. Wer beides kontrolliert, könnte sehen, was bleib anzeigt, solange es entsperrt ist.' },
          { p: 'Dein Wiederherstellungs-Kit bewahrst du woanders auf. bleib behält keine Kopie davon.' },
        ],
      },
      {
        h: 'Auf der Website eines KI-Anbieters',
        blocks: [{ p: 'Sobald bleib Text in den Entwurf einfügt, können die Website und andere Erweiterungen mit Zugriff auf die Seite ihn lesen.' }],
      },
      {
        h: 'Sicherheitslücke melden',
        blocks: [{ p: 'Schreib an security@bleib.dev.' }],
      },
    ],
  },
  developers: {
    title: 'Für Entwickler',
    description: 'Das Desktop-Add-on von bleib, MCP und offene Formate, demnächst.',
    intro: ['bleib ist kostenlos, quelloffen und in Entwicklung. Es startet als Browser-Erweiterung. Später kommt ein Desktop-Add-on mit MCP, damit sich KI-Tools auf deinem Rechner verbinden können.'],
    cta: { label: 'Auf GitHub anzeigen', href: GITHUB_URL },
    sections: [
      // Once @bleib/wallet is on npm (INSTALL.walletCli), the desktop apps connect with one line instead.
      INSTALL.walletCli ? {
        h: 'KI-Apps auf deinem Rechner verbinden',
        blocks: [
          { p: 'Mit einer Zeile im Terminal verbindest du eine KI-App auf deinem Rechner mit deinem bleib. Was jede App sehen darf, entscheidest du.' },
          { commands: ['npx @bleib/wallet connect claude-desktop', 'npx @bleib/wallet connect claude-code', 'npx @bleib/wallet connect codex', 'npx @bleib/wallet connect cursor', 'npx @bleib/wallet connect gemini'] },
        ],
      } : {
        h: 'Später: das Desktop-Add-on',
        blocks: [
          { p: 'Mit dem Add-on können Claude Desktop, Claude Code, Cursor, OpenClaw, Hermes und andere MCP-Clients bei bleib anfragen, was eine Aufgabe braucht. Jedes Tool bekommt eine eigene Verbindung, und der Mensch gibt frei, was es sehen darf.' },
          { p: 'Agents werden bleib nie entsperren, ihren Zugriff nie selbst erweitern und sich nie selbst freigeben.' },
          { p: 'Verfolge die Entwicklung auf GitHub und sag uns, was du brauchst.' },
        ],
      },
      {
        h: 'Baut auf',
        blocks: [
          { p: 'bleib baut auf offener Arbeit anderer auf. Danke.' },
          {
            refs: [
              { name: 'Model Context Protocol', href: 'https://modelcontextprotocol.io', v: 'Wie sich KI-Tools mit dem Desktop-Add-on verbinden werden.' },
              { name: 'OpenClaw', href: 'https://docs.openclaw.ai/concepts/memory', v: 'Das Workspace-Format für Erinnerungen, das bleib liest und schreibt.' },
              { name: 'Hermes Agent', href: 'https://hermes-agent.nousresearch.com', v: 'Von Nous Research; nutzt dasselbe Workspace-Format.' },
              { name: 'Human Context Protocol', href: 'https://github.com/loyalagents/hcp-spec', v: 'Von Loyal Agents (Stanford Digital Economy Lab und Consumer Reports); das Modell für Berechtigungen und Protokolle.' },
              { name: 'ISO/IEC TS 27560', href: 'https://www.iso.org/standard/80392.html', v: 'Der Aufbau von Einwilligungsnachweisen.' },
              { name: 'W3C Data Privacy Vocabulary', href: 'https://w3id.org/dpv', v: 'Die Arten persönlicher Informationen.' },
              { name: 'OSAP consent receipts', href: 'https://datatracker.ietf.org/doc/draft-zeng-osap-consent-receipts/', v: 'IETF-Entwurf; der Export der Belege.' },
              { name: 'Memory Projection Record', href: 'https://datatracker.ietf.org/doc/draft-ferro-schrock-memory-projection-record/', v: 'IETF-Entwurf; ein Fingerabdruck genau dessen, was weitergegeben wurde.' },
              { name: 'age', href: 'https://age-encryption.org', v: 'Von Filippo Valsorda; wird die Dateien des Desktop-Add-ons verschlüsseln.' },
            ],
          },
        ],
      },
      {
        h: 'Open-Source-Software in bleib',
        blocks: [
          { p: 'bleib enthält diese offenen Bausteine. Danke an alle, die sie gebaut haben.' },
          {
            refs: [
              { name: 'Argon2 (argon2-browser)', href: 'https://github.com/antelle/argon2-browser', v: 'Von Antelle, MIT-Lizenz; der Argon2-Referenzcode steht unter CC0 1.0 oder Apache-2.0. Stärkt deine Passphrase auf deinem Gerät.' },
              { name: 'Inter', href: 'https://rsms.me/inter/', v: 'Von den Inter Project Authors, SIL Open Font License 1.1. Die Schrift in bleib und auf dieser Website.' },
              { name: 'Material Symbols Rounded', href: 'https://fonts.google.com/icons', v: 'Von Google, Apache-2.0. Die Symbole in bleib und auf dieser Website.' },
              { name: 'LobeHub Icons', href: 'https://github.com/lobehub/lobe-icons', v: 'Von LobeHub, MIT-Lizenz. Die Logos von ChatGPT, Claude und Gemini. Die Logos sind Marken ihrer Inhaber.' },
              { name: 'Granite Embedding Multilingual R2 97M', href: 'https://huggingface.co/ibm-granite/granite-embedding-97m-multilingual-r2', v: 'Von IBM, lizenziert unter Apache-2.0, einschließlich Tokenizer. Genutzt für „Klügere Vorschläge“, wenn du sie einschaltest. bleib hat es in int8 umgewandelt, damit es kleiner und schneller ist, und kleine Schichten darauf trainiert; das Modell selbst hat bleib nicht neu trainiert.' },
              { name: 'ONNX Runtime Web', href: 'https://onnxruntime.ai', v: 'Von Microsoft, MIT-Lizenz. Führt „Klügere Vorschläge“ in deinem Browser aus.' },
            ],
          },
          { p: 'Lizenztext Apache-2.0: apache.org/licenses/LICENSE-2.0. Die vollständigen Lizenzdateien liegen der Erweiterung bei.' },
        ],
      },
      {
        h: 'Lizenz',
        blocks: [
          {
            rows: [
              { k: 'bleib', v: 'AGPL-3.0-or-later' },
              { k: 'Dateiformat, Spezifikation und SDK', v: 'Apache-2.0' },
            ],
          },
          { p: 'bleib bleibt offen: Wer eine veränderte Version als Dienst betreibt, muss die Änderungen teilen. Format und SDK sind frei nutzbar, damit jede KI-App bleib einbinden kann.' },
        ],
      },
      {
        h: 'Mitmachen',
        blocks: [{ p: 'Der Code liegt auf GitHub unter github.com/rouxdutoit/bleib. Eröffne ein Issue, schick einen Pull Request oder schreib an hello@bleib.dev. Sicherheitslücken bitte an security@bleib.dev melden, nicht öffentlich.' }],
      },

    ],
  },
  pricing: {
    title: 'Preise',
    description: 'bleib ist kostenlos und quelloffen. Später zahlst du nur für Komfort.',
    intro: ['bleib ist kostenlos und quelloffen. Dein Gedächtnis, KI-Verbindungen, Berechtigungen, Belege und Importe sind kostenlos.'],
    sections: [
      {
        h: 'Später auf Wunsch synchronisieren',
        blocks: [{ p: 'Wie bei Bitwarden soll nur der zusätzliche Komfort etwas kosten. Geplant ist eine Ende-zu-Ende-verschlüsselte Synchronisierung über unsere Server. Dein Gerät verschlüsselt dein Gedächtnis vor dem Hochladen. Wir können es nicht lesen.' }],
      },
    ],
  },
  privacy: {
    title: 'Datenschutz der Website',
    description: 'Wie die Website von bleib mit deinen Daten umgeht.',
    intro: [
      'Hier erfährst du, welche Daten die Website verarbeitet, auch bei der Anmeldung für den frühen Zugang. Wie bleib und die Browser-Erweiterung mit deinem Gedächtnis umgehen, steht unter Datenschutz in der App.',
    ],
    sections: [
      {
        h: 'Kurz gesagt',
        blocks: [
          {
            never: [
              'Keine Cookies, keine Analyse, kein Tracking.',
              'Keine Anfragen an Dritte. Schriften, Symbole und Dateien werden mit dieser Website ausgeliefert.',
            ],
          },
        ],
      },
      {
        h: 'Früher Zugang',
        blocks: [
          {
            rows: [
              { k: 'Was wir speichern', v: 'Deine E-Mail-Adresse, deine Sprache und den Zeitpunkt der Anmeldung' },
              { k: 'Wozu', v: 'Um dir Bescheid zu geben, sobald bleib verfügbar ist' },
              { k: 'Rechtsgrundlage', v: 'Deine Einwilligung, Art. 6 Abs. 1 lit. a DSGVO' },
              { k: 'Wie lange', v: 'Bis bleib startet und wir dir geschrieben haben, oder bis du die Löschung verlangst' },
              { k: 'Wo', v: 'Ein privater Bunny-Storage-Bereich in Frankfurt am Main, ohne Kopien an anderen Orten (siehe Hosting)' },
            ],
          },
          { p: 'Um automatisierte Anmeldungen zu verhindern, zählen wir Versuche pro IP-Adresse für höchstens zwei Minuten. Der Zähler liegt nur im Arbeitsspeicher des Servers, unter einem gekürzten Einweg-Hash der Adresse, nie unter der Adresse selbst, und wird nie auf einen Datenträger geschrieben. Rechtsgrundlage ist Art. 6 Abs. 1 lit. f DSGVO, unser berechtigtes Interesse am Schutz des Formulars.' },
          { p: 'Du kannst deine Einwilligung jederzeit per E-Mail an privacy@bleib.dev widerrufen. Wir löschen deinen Eintrag und bestätigen es per E-Mail.' },
        ],
      },
      { h: 'Lokaler Speicher', blocks: [{ p: 'Wenn du zwischen hellem und dunklem Design wechselst, merkt sich dein Browser die Wahl im lokalen Speicher. Sie bleibt in deinem Browser und wird nie an uns gesendet. Du kannst sie in den Browsereinstellungen löschen.' }] },
      {
        h: 'Hosting',
        blocks: [{ p: 'Diese Website und die Liste für frühen Zugang werden von der BunnyWay d.o.o., Dunajska cesta 165, Ljubljana, Slowenien (bunny.net), gehostet. Die Dateien der Website liegen in Frankfurt am Main, mit einer Kopie in Stockholm, und werden nur über Rechenzentren in der Europäischen Union ausgeliefert. Anmeldungen für frühen Zugang liegen nur in Frankfurt. Beim Aufruf einer Seite erhalten die Server von Bunny deine IP-Adresse und technische Angaben zur Anfrage, etwa die aufgerufene Adresse und Angaben zum Browser. Bunny benötigt diese Daten, um die Seite auszuliefern und die Website vor Angriffen zu schützen. In den Protokollen kürzt Bunny die IP-Adressen und löscht die Protokolle nach drei Tagen. Mit Bunny besteht ein Vertrag zur Auftragsverarbeitung nach Art. 28 DSGVO. Rechtsgrundlage ist Art. 6 Abs. 1 lit. f DSGVO, unser berechtigtes Interesse am sicheren und funktionsfähigen Betrieb der Website.' }],
      },
      {
        h: 'Kontakt',
        blocks: [{ p: 'Wenn du uns schreibst oder anrufst, nutzen wir deine Nachricht und Kontaktdaten, um dir zu antworten. Rechtsgrundlage ist Art. 6 Abs. 1 lit. b DSGVO bei vertragsbezogenen Anfragen und Art. 6 Abs. 1 lit. f DSGVO für unser berechtigtes Interesse an der Beantwortung sonstiger Anfragen. Wir löschen die Daten, sobald sie nicht mehr benötigt werden, sofern keine gesetzlichen Aufbewahrungspflichten bestehen.' }],
      },
      { h: 'Verantwortlicher', blocks: [{ address: [...OPERATOR_DE, 'E-Mail privacy@bleib.dev', 'Telefon +49 162 7850608'] }] },
      { h: 'Links zu anderen Websites', blocks: [{ p: 'Wenn du einem Link zu einer anderen Website folgst, gilt dort deren Datenschutzerklärung.' }] },
      {
        h: 'Deine Rechte',
        blocks: [{ p: 'Nach der DSGVO hast du das Recht auf Auskunft (Art. 15), Berichtigung (Art. 16), Löschung (Art. 17), Einschränkung der Verarbeitung (Art. 18) und Datenübertragbarkeit (Art. 20). Du kannst einer Verarbeitung auf Grundlage berechtigter Interessen widersprechen (Art. 21) und eine Einwilligung jederzeit widerrufen (Art. 7 Abs. 3). Du kannst dich bei einer Aufsichtsbehörde beschweren (Art. 77), zum Beispiel beim Bayerischen Landesamt für Datenschutzaufsicht, Promenade 18, 91522 Ansbach.' }],
      },
      { h: 'Änderungen', blocks: [{ p: 'Wir passen diesen Hinweis an, wenn sich etwas ändert. Stand: 25. November 2026.' }] },
    ],
  },
  appPrivacy: {
    title: 'Datenschutz in der App',
    description: 'Wie bleib und die Browser-Erweiterung mit deinem Gedächtnis umgehen.',
    intro: ['Nur du kannst dein Gedächtnis lesen. bleib ist in Entwicklung und startet als Browser-Erweiterung, ohne bleib-Konto, Telemetrie, Nutzungsanalyse und automatische Absturzberichte.'],
    sections: [
      {
        h: 'Kurz gesagt',
        blocks: [
          {
            never: [
              'Dein Gedächtnis ist auf deinem Gerät verschlüsselt. Kein bleib-Server erhält es je.',
              'Kein Konto, kein Tracking, keine Nutzungsanalyse.',
              'Eine KI bekommt nur, was bleib in ihr Nachrichtenfeld einfügt, und bei privaten Angaben fragt bleib immer zuerst.',
              'Nie verkauft, nie für Werbung oder Kreditentscheidungen genutzt.',
            ],
          },
        ],
      },
      {
        h: 'Was die Erweiterung liest',
        blocks: [
          { p: 'bleib arbeitet nur auf den KI-Seiten, die du erlaubst. Es fragt für chatgpt.com, claude.ai und gemini.google.com einzeln, und du kannst den Zugriff jederzeit zurücknehmen.' },
          { p: 'Auf diesen Seiten prüft bleib auf deinem Gerät, was du in den Entwurf schreibst. So findet es passende Erinnerungen, erkennt Vorlieben, die es speichern kann, und bemerkt vor dem Senden mögliche Geheimnisse wie Passwörter oder Kartennummern. Diese Prüfung läuft auf deinem Gerät und behält nicht, was sie findet.' },
          { p: 'Wenn du deine Erinnerungen mitnimmst, liest bleib die Exportdatei, die du auswählst, oder den Text, den du mit „Antwort einfügen“ einfügst. Deine Zwischenablage liest es nur in diesem Moment. Alles wird auf deinem Gerät verarbeitet, nichts wird hochgeladen.' },
          { p: 'Vorschläge entstehen auf deinem Gerät, mit bleibs eigener kleiner Auswahl oder, wenn du „Klügere Vorschläge“ einschaltest, mit IBMs Modell Granite Embedding. Kein Modell sendet, was du schreibst, irgendwohin. bleib liest die Antworten der KI nie von sich aus.' },
        ],
      },
      {
        h: 'Was bleib speichert',
        blocks: [
          { list: [
            'Deine Erinnerungen und Einträge zur Prüfung, jeweils mit ihrer Herkunft.',
            'Berechtigungen, Angaben zu den KIs, die du nutzt, und Belege für Freigaben.',
          ] },
          { p: 'bleib verschlüsselt diese Daten in deinem Browser auf deinem Gerät. Kein bleib-Server erhält dein Gedächtnis oder deine Entwürfe.' },
          { p: 'Wenn du die automatische Sicherung einschaltest, schreibt bleib eine verschlüsselte Sicherung in einen Ordner, den du auswählst. Sicherungen, Wiederherstellungs-Kits und Exporte landen nur dort, wo du sie speicherst.' },
        ],
      },
      {
        h: 'Was KI-Anbieter sehen können',
        blocks: [
          { p: 'bleib wählt auf deinem Gerät nur das Nötige aus und speichert vor jeder Freigabe einen Beleg. Sobald bleib Angaben in das Nachrichtenfeld einer KI einfügt, kann der Anbieter sie lesen, auch bevor du auf Senden tippst. Du kannst sie aus dem Entwurf entfernen, doch der Anbieter kann sie dann schon gesehen haben. Für erhaltene Daten gilt die Datenschutzerklärung des jeweiligen Anbieters.' },
          { p: 'Wenn du eine unterstützte KI-App verbindest, gibt bleib nur Angaben weiter, die du freigegeben hast. Bei privaten Angaben fragt bleib jedes Mal. Die App kann die Angaben behalten oder weitergeben.' },
        ],
      },
      {
        h: 'Was bleib nie tut',
        blocks: [
          { never: [
            'Deine Daten verkaufen.',
            'Sie für Werbung nutzen oder an Werbetreibende oder Analysedienste weitergeben.',
            'Sie für Entscheidungen über Kredite oder Kreditwürdigkeit nutzen.',
          ] },
          { p: 'bleib nutzt deine Daten nur, um dein Wallet für dich zu betreiben.' },
        ],
      },
      {
        h: 'Deine Daten verwalten',
        blocks: [{ p: 'Du kannst dein Gedächtnis prüfen und ändern und KI-Verbindungen in bleib trennen. Wenn du die Erweiterung entfernst, löscht der Browser ihre Daten. Mach vorher ein Backup. Für Kopien, die ein KI-Anbieter oder eine verbundene App bereits hat, nutze deren eigene Einstellungen.' }],
      },
      {
        h: 'Kontakt',
        blocks: [{ p: 'Schreib bei Fragen zu bleib und deinen Daten an privacy@bleib.dev. Stand 26. November 2026.' }],
      },
    ],
  },
  impressum: {
    title: 'Impressum',
    description: 'Impressum der Website von bleib.',
    intro: ['Angaben gemäß § 5 DDG.'],
    sections: [
      { h: 'Anbieter', blocks: [{ address: OPERATOR_DE }] },
      { h: 'Kontakt', blocks: [{ address: ['E-Mail hello@bleib.dev', 'Telefon +49 162 7850608'] }] },
      { h: 'Verantwortlich für den Inhalt', blocks: [{ p: 'Nach § 18 Abs. 2 MStV.' }, { address: OPERATOR_DE }] },
      { h: 'Über bleib', blocks: [{ p: 'bleib ist kostenlos, quelloffen und in Entwicklung. bleib steht unter AGPL-3.0-or-later. Dateiformat, Spezifikation und SDK stehen unter Apache-2.0. Open-Source-Software und Modelle in bleib sind auf der Seite „Für Entwickler“ genannt.' }] },
    ],
  },
};

export const docs: Record<Lang, Docs> = { en, de };
