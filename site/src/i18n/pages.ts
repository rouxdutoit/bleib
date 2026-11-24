import type { Lang, RouteKey } from './strings';
import type { IconName } from '../components/icons';

/**
 * Subpage content (Fazit-style layout: big title and intro, then two-column sections with
 * the heading on the left). Block types:
 *   p       paragraph            list   bullet list         code   command line
 *   never   icon list with hairlines (commitments)          rows   key / value list
 *   tiles   two-up tiles with an optional tag               address  postal lines
 */
export type Tile = { t: string; d: string; icon?: IconName; tag?: string };
export type Block =
  | { p: string }
  | { list: string[] }
  | { code: string }
  | { address: string[] }
  | { never: string[] }
  | { rows: { k: string; v: string }[] }
  | { tiles: Tile[] };

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
  sections: Section[];
}

type Docs = Record<Exclude<RouteKey, 'home'>, DocPage>;

const OPERATOR = ['Ruan “Roux” du Toit', 'Emeranstraße 23', '85622 Feldkirchen', 'Germany'];
const OPERATOR_DE = ['Ruan „Roux“ du Toit', 'Emeranstraße 23', '85622 Feldkirchen', 'Deutschland'];
const SECURITY_MAIL = 'mailto:hello@rouxdutoit.com?subject=bleib%20security';

const en: Docs = {
  how: {
    title: 'How it works',
    description: 'How bleib keeps your AI context encrypted, asks before sharing, and gives you a receipt every time.',
    intro: [
      'bleib sits between you and the AIs you use. They get what a task needs, when you allow it, and you can always see what they were given.',
      'bleib is in development. This page describes how it works.',
    ],
    hub: [
      { to: 'permissions', t: 'Permissions', d: 'What bleib asks, and when.', icon: 'check' },
      { to: 'receipts', t: 'Receipts', d: 'Exactly what each AI saw.', icon: 'fingerprint' },
      { to: 'works', t: 'Works with', d: 'Claude, Cursor, OpenClaw and more.', icon: 'code' },
      { to: 'standards', t: 'Standards', d: 'The open formats underneath.', icon: 'verified_user' },
    ],
    sections: [
      {
        id: 'wallet',
        h: 'Your wallet',
        blocks: [
          { p: 'Everything your AIs should know about you lives in one folder on your device: people, preferences, projects and rules. It is plain text you can read and correct, encrypted with a key only you hold.' },
          { p: 'Bring in what your AIs already know: import an OpenClaw or Hermes workspace, or paste your ChatGPT or Claude memory and review each entry.' },
        ],
      },
      {
        id: 'door',
        h: 'One door for every AI',
        blocks: [
          { p: 'AIs connect to bleib through one door on your device. Each AI is paired once with a short code and gets its own key, so nothing can pretend to be another app.' },
          { p: 'An AI asks for what a task needs and gets the smallest useful answer, not your files.' },
        ],
      },
      {
        id: 'permissions',
        h: 'Asked once, remembered',
        blocks: [
          { p: 'The first time an AI needs a new kind of information, bleib asks you: Allow Once, Always for this AI, or Don’t Allow. It shows exactly what would be shared and where it goes.' },
          { p: 'Your answer becomes a rule. bleib only asks again if the AI, the kind of information or the destination changes.' },
        ],
      },
      {
        id: 'receipts',
        h: 'A receipt for every share',
        blocks: [
          { p: 'Before anything is shared, bleib writes a receipt: which AI, which company or device received it, for what, the exact words, and when. Each week you get a plain summary of what your AIs saw.' },
        ],
      },
      {
        id: 'proposals',
        h: 'AIs suggest, you decide',
        blocks: [
          { p: 'AIs can propose new things to remember. You see each suggestion with the AI’s reason and choose Save, Edit or Not Now. Nothing is saved until you approve it.' },
          { p: 'Approving a memory never lets an AI read it. Reading needs its own permission.' },
        ],
      },
      {
        id: 'recovery',
        h: 'If you lose a device',
        blocks: [
          { p: 'Before bleib stores anything, it helps you set up recovery: a printed recovery kit first, and later linking another device or using a passkey. We never hold a key that can read your data.' },
        ],
      },
      {
        id: 'limits',
        h: 'What bleib can’t do',
        blocks: [
          {
            list: [
              'What an AI has seen, it has seen. bleib controls what is handed over; it can’t take it back.',
              'AIs that keep their own memory may keep copies. bleib works best with AIs that use it as their memory.',
              'bleib gives you evidence of what was shared. It does not promise anonymity.',
            ],
          },
        ],
      },
    ],
  },
  works: {
    title: 'Works with your AI',
    description: 'Which AI apps bleib connects to, and how.',
    intro: [
      'bleib is one place for your context that any AI can use, with your permission. It connects through open standards, so you are not tied to one provider.',
      'bleib is in development. This is how each connection will work.',
    ],
    sections: [
      {
        h: 'Connected over MCP',
        blocks: [
          { p: 'The Model Context Protocol (MCP) is the open standard AI apps use to reach tools and data. bleib runs a small MCP server on your computer. AI apps that support MCP can ask it for context, and nothing else can reach it.' },
        ],
      },
      {
        h: 'AI apps',
        blocks: [
          {
            tiles: [
              { t: 'Claude Desktop and Claude Code', d: 'Pair once with a code. Setup is one copied snippet.' },
              { t: 'Cursor', d: 'Pair once with a code, the same way.' },
              { t: 'OpenClaw', d: 'Uses the workspace files you already have. bleib encrypts them and asks before sharing.' },
              { t: 'Hermes Agent', d: 'Imports OpenClaw workspaces. bleib works with both.' },
              { t: 'Local models', d: 'Ollama and LM Studio. Nothing leaves your computer.' },
              { t: 'ChatGPT and Claude memory', d: 'Bring your existing memory in once by pasting it, then review each entry.', tag: 'Import' },
            ],
          },
        ],
      },
      {
        h: 'Where data really goes',
        blocks: [
          { p: 'An app can say which model it uses, and bleib can check. When an app sends its model requests through bleib’s local proxy, or through OpenClaw’s request hook, bleib sees the real destination and marks the receipt “observed” instead of “declared”.' },
        ],
      },
      {
        h: 'Your files stay yours',
        blocks: [
          { p: 'Memory is plain Markdown, compatible with OpenClaw and Hermes workspace files (USER.md, MEMORY.md and daily notes). You can open, read and correct every entry, and take it with you.' },
        ],
      },
      {
        h: 'Limits',
        blocks: [
          {
            list: [
              'Apps that keep their own memory may still keep copies. bleib works best with apps that use it as their memory.',
              'Each app’s support depends on its MCP support. We list apps here as they are tested.',
            ],
          },
        ],
      },
    ],
  },
  permissions: {
    title: 'Permissions',
    description: 'How bleib asks before sharing, remembers your answer, and keeps your rules.',
    intro: ['bleib asks once, remembers your answer, and only asks again when something important changes.'],
    sections: [
      {
        h: 'How asking works',
        blocks: [
          { p: 'The first time an AI needs a kind of information, bleib shows exactly what would be shared and where it would go. You choose Allow Once, Always for this AI, or Don’t Allow.' },
        ],
      },
      {
        h: 'What a permission covers',
        blocks: [
          {
            rows: [
              { k: 'Which AI', v: 'Paired once, with its own key' },
              { k: 'Which kind of information', v: 'For example Travel or Work' },
              { k: 'Where it goes', v: 'This device, the AI’s provider, or a named third party' },
            ],
          },
          { p: 'bleib asks again only if one of these changes. The purpose is recorded on every receipt.' },
        ],
      },
      {
        h: 'Kinds of information',
        blocks: [
          {
            tiles: [
              { t: 'People', d: 'Friends, family and colleagues you mention.', icon: 'person' },
              { t: 'Travel', d: 'Seats, hotels, trips.', icon: 'flight' },
              { t: 'Work', d: 'Projects, routines, how you like to work.', icon: 'work' },
              { t: 'Food', d: 'Diet and favourite places.', icon: 'restaurant' },
              { t: 'Health', d: 'Asked about every time.', icon: 'favorite', tag: 'Sensitive' },
              { t: 'Money', d: 'Asked about every time.', icon: 'lock', tag: 'Sensitive' },
            ],
          },
          { p: 'The full list follows the W3C Data Privacy Vocabulary, so the categories mean the same thing everywhere.' },
        ],
      },
      {
        h: 'Sensitive information',
        blocks: [
          { p: 'Health, money, identity documents, passwords and other people’s private details are asked about every time, unless you choose otherwise with an extra confirmation.' },
        ],
      },
      {
        h: 'Rules in your own words',
        blocks: [
          { list: ['“Never share health with hosted models.”', '“Only Claude may see work.”', '“Keep dinner plans under €30.”'] },
          { p: 'bleib turns a sentence into a rule, shows it back to you to confirm, and applies it before any permission. AIs can never write or widen your rules.' },
        ],
      },
      {
        h: 'Taking it back',
        blocks: [{ p: 'Withdraw any permission or disconnect any AI at any time. It takes effect on the next request.' }],
      },
    ],
  },
  receipts: {
    title: 'Receipts',
    description: 'What a bleib receipt records, and how you can check it.',
    intro: ['Every time an AI gets something from your wallet, bleib writes a receipt first. You can always see exactly what each AI saw.'],
    sections: [
      {
        h: 'What a receipt contains',
        blocks: [
          {
            rows: [
              { k: 'AI', v: 'Which app asked' },
              { k: 'Sent to', v: 'The company or device, declared or observed' },
              { k: 'For', v: 'The purpose it stated' },
              { k: 'Shared', v: 'The exact words it received' },
              { k: 'Not shared', v: 'What it asked for but didn’t get' },
              { k: 'Permission', v: 'Which permission allowed it' },
              { k: 'Fingerprint', v: 'Proof of exactly what was handed over' },
            ],
          },
        ],
      },
      {
        h: 'Written before anything leaves',
        blocks: [{ p: 'The receipt is saved in your encrypted wallet before the AI receives anything. If saving fails, nothing is shared.' }],
      },
      {
        h: 'Tamper-evident',
        blocks: [{ p: 'Each receipt carries a fingerprint (SHA-256) of exactly what was shared and is linked to the one before it. Changing or deleting a receipt breaks the chain, and bleib shows you.' }],
      },
      {
        h: 'A plain weekly summary',
        blocks: [{ p: '“This week 3 AIs saw 11 facts. Nothing about your health left this device.” Readable in a minute.' }],
      },
      {
        h: 'Export',
        blocks: [{ p: 'Export your receipts as consent records aligned with ISO/IEC TS 27560 and the W3C Data Privacy Vocabulary, for yourself, a lawyer or a data protection officer.' }],
      },
      {
        h: 'Limits',
        blocks: [
          {
            list: [
              'What an AI has seen, it has seen. A receipt is evidence; it can’t recall data.',
              'A declared destination is what the app told bleib. An observed one is what bleib saw leave.',
            ],
          },
        ],
      },
    ],
  },
  standards: {
    title: 'Standards and formats',
    description: 'The open standards bleib builds on.',
    intro: ['bleib builds on open standards instead of inventing its own, so your data and our claims can be checked.'],
    sections: [
      {
        h: 'Connecting AI',
        blocks: [
          {
            tiles: [
              { t: 'Model Context Protocol', d: 'How AI apps reach bleib on your computer.', tag: 'MCP' },
              { t: 'Agent2Agent', d: 'How your agent will introduce itself to other agents.', tag: 'Later' },
            ],
          },
        ],
      },
      {
        h: 'Your memory',
        blocks: [
          {
            tiles: [
              { t: 'OpenClaw and Hermes workspace files', d: 'Plain Markdown memory files that bleib reads, writes and encrypts.' },
              { t: 'Portable Context Protocol', d: 'Field names for memory entries, such as where a fact came from and how sensitive it is.', tag: 'PCP' },
            ],
          },
        ],
      },
      {
        h: 'Permissions and logs',
        blocks: [
          {
            tiles: [
              { t: 'Human Context Protocol', d: 'The permission and log model from the Loyal Agents project (Stanford Digital Economy Lab and Consumer Reports). bleib aims to be compatible, and adds where data goes and exact-content receipts.', tag: 'HCP' },
              { t: 'W3C Data Privacy Vocabulary', d: 'The shared list of kinds of personal information.', tag: 'DPV' },
            ],
          },
        ],
      },
      {
        h: 'Receipts',
        blocks: [
          {
            tiles: [
              { t: 'ISO/IEC TS 27560', d: 'The structure of consent records, used for export.' },
              { t: 'OSAP consent receipts', d: 'A receipt format that maps to ISO/IEC TS 27560.', tag: 'IETF draft' },
              { t: 'Memory Projection Records', d: 'Fingerprints that prove exactly what was handed over.', tag: 'IETF draft' },
            ],
          },
        ],
      },
      {
        h: 'Encryption',
        blocks: [
          {
            tiles: [
              { t: 'age', d: 'Modern, simple file encryption for every memory file.' },
              { t: 'Encrypted index and receipts', d: 'Search, permissions and receipts are encrypted too. Plain text never touches the disk.' },
            ],
          },
        ],
      },
      {
        h: 'Later',
        blocks: [
          {
            tiles: [
              { t: 'Verifiable Credentials', d: 'Permissions other services can check, with a revocation list instead of a public ledger.', tag: 'W3C' },
              { t: 'Agent payments and EU wallet delegation', d: 'Signed mandates for agents acting on your behalf (AP2, EUDI Wallet).' },
            ],
          },
          { p: 'Drafts are drafts: we follow them closely and say so when one changes.' },
        ],
      },
    ],
  },
  security: {
    title: 'Security and privacy',
    description: 'How bleib protects your context, and its limits.',
    intro: [
      'bleib runs on your computer. Your memory is encrypted with a key only you hold.',
      'bleib is in development. This page will include a public audit before launch.',
    ],
    cta: { label: 'Report a vulnerability', href: SECURITY_MAIL },
    sections: [
      {
        h: 'What bleib will never do',
        blocks: [
          {
            never: [
              'Hold a key that lets us read your memory.',
              'Let an AI unlock your wallet or approve its own access.',
              'Share anything without writing a receipt first.',
              'Send telemetry or analytics.',
              'Charge you to see your own data.',
            ],
          },
        ],
      },
      {
        h: 'How it protects you',
        blocks: [
          {
            tiles: [
              { t: 'Encrypted on your device', d: 'Every memory file is encrypted with age. Plain text never touches the disk.', icon: 'lock' },
              { t: 'Your key only', d: 'The key comes from your passphrase. If you lose your devices, your recovery kit gets you back in; we can’t.', icon: 'fingerprint' },
              { t: 'Local only', d: 'The door listens only on your computer (127.0.0.1) and checks every request.', icon: 'verified_user' },
              { t: 'Each AI paired', d: 'One-time codes. Each app gets its own credential, so none can pretend to be another.', icon: 'check' },
            ],
          },
        ],
      },
      {
        h: 'Limits',
        blocks: [
          {
            list: [
              'What an AI has seen, it has seen.',
              'An AI that keeps its own memory may keep copies.',
              'If your computer is compromised while bleib is unlocked, so is what bleib can see.',
              'bleib gives you evidence. It does not promise anonymity or legal compliance.',
            ],
          },
        ],
      },
      {
        h: 'Report a vulnerability',
        blocks: [{ p: 'Email hello@rouxdutoit.com. We reply as quickly as we can and credit you if you wish.' }],
      },
    ],
  },
  developers: {
    title: 'Developers',
    description: 'bleib for developers: a local MCP door, open formats and receipts you can check.',
    intro: ['bleib is in development and will be open source. This page describes what we are building, so you can tell us what you need.'],
    sections: [
      {
        h: 'A local door over MCP',
        blocks: [
          { p: 'bleib runs a local Model Context Protocol server, over stdio and over Streamable HTTP bound to 127.0.0.1. Agents call bleib_status first, then bleib_context_request with a purpose and the kinds of information they need. When permission is missing they get an approval_required state with a link for the person, never a bare error.' },
          { p: 'Each agent is paired once with a short-lived code and gets its own credential. Agents can never unlock the wallet or approve their own access.' },
        ],
      },
      {
        h: 'Open formats',
        blocks: [
          {
            list: [
              'Memory is Markdown with frontmatter, compatible with OpenClaw and Hermes workspace files.',
              'Permissions and logs follow the Human Context Protocol, with destination and exact-content receipts added.',
              'Receipts align with ISO/IEC TS 27560 and the W3C Data Privacy Vocabulary.',
              'Files are encrypted with age; keys come from your passphrase and never leave your device.',
            ],
          },
        ],
      },
      {
        h: 'Planned commands',
        blocks: [
          { code: 'npx bleib init' },
          { code: 'bleib import openclaw ~/.openclaw/workspace' },
          { code: 'bleib pair claude --destination provider:anthropic' },
          { code: 'bleib serve' },
        ],
      },
      {
        h: 'Licence',
        blocks: [
          {
            rows: [
              { k: 'The bleib app', v: 'AGPL-3.0-or-later' },
              { k: 'File format, spec and SDK', v: 'Apache-2.0' },
            ],
          },
          { p: 'The app stays open: anyone who runs a changed version as a service must share their changes. The format and SDK are permissive, so any AI app can integrate bleib freely.' },
        ],
      },
      {
        h: 'Get involved',
        blocks: [{ p: 'The repository will open on GitHub soon. Until then, write to hello@rouxdutoit.com, or join early access on the home page.' }],
      },
    ],
  },
  pricing: {
    title: 'Pricing',
    description: 'bleib is free and open source. You pay only for convenience.',
    intro: ['Free for everything that keeps your data yours. You pay only if you want us to make it more convenient.'],
    sections: [
      {
        h: 'Free, for good',
        blocks: [
          {
            never: [
              'The wallet and every AI connection',
              'Permissions, rules and receipts',
              'Importers and the recovery kit',
              'Syncing through your own cloud, and running it yourself',
            ],
          },
        ],
      },
      {
        h: 'Convenience',
        blocks: [
          {
            tiles: [
              { t: 'Sync and backup', d: 'Hosted and end-to-end encrypted, with passkey recovery. We store only data we can’t read.', tag: 'Later' },
              { t: 'Organisations', d: 'Separate work and personal parts with separate keys, admin recovery for the work part, and support.', tag: 'Later' },
            ],
          },
        ],
      },
      {
        h: 'Our promise',
        blocks: [{ p: 'We never charge you to see your own data, and we never hold a key that can read it.' }],
      },
    ],
  },
  privacy: {
    title: 'Privacy',
    description: 'How the bleib website handles your data.',
    intro: ['This notice covers this website. bleib itself runs on your device and sends us nothing.'],
    sections: [
      { h: 'Cookies', blocks: [{ p: 'None. If you switch between light and dark mode, your browser remembers the choice in its local storage. Nothing about it is sent to us.' }] },
      { h: 'Analytics and tracking', blocks: [{ p: 'None.' }] },
      { h: 'Third-party requests', blocks: [{ p: 'None. Fonts, icons and files are served with this site.' }] },
      { h: 'Data processed', blocks: [{ p: 'Your IP address and technical request data when the site is delivered.' }] },
      {
        h: 'Early access',
        blocks: [{ p: 'If you join early access, we store your email address, your language and the time you signed up, to tell you when bleib is available. The legal basis is your consent, Article 6(1)(a) GDPR. You can withdraw it at any time by writing to hello@rouxdutoit.com, and we delete your entry.' }],
      },
      {
        h: 'Hosting',
        blocks: [{ p: 'This site and the early-access list are hosted by Cloudflare, Inc., 101 Townsend St, San Francisco, CA 94107, USA. When you open a page, Cloudflare receives your IP address and technical request details to deliver the page and protect the site from attacks. We have a data processing agreement with Cloudflare under Article 28 GDPR. Transfers to the USA are covered by the EU-US Data Privacy Framework, under which Cloudflare is certified, and by Standard Contractual Clauses. The legal basis is Article 6(1)(f) GDPR, our legitimate interest in operating a secure and functional site.' }],
      },
      {
        h: 'Contact',
        blocks: [{ p: 'If you email or call, we use your message and contact details to respond. The legal basis is Article 6(1)(b) GDPR for contract-related enquiries and Article 6(1)(f) GDPR for our legitimate interest in answering other enquiries. We delete the data when it is no longer needed, unless the law requires us to keep it longer.' }],
      },
      { h: 'Controller', blocks: [{ address: [...OPERATOR, 'Email hello@rouxdutoit.com', 'Telephone +49 162 7850608'] }] },
      { h: 'Links to other sites', blocks: [{ p: 'If you follow a link to another site, its privacy policy applies there.' }] },
      {
        h: 'Your rights',
        blocks: [{ p: 'Under the GDPR you can request access (Article 15), rectification (Article 16), erasure (Article 17), restriction of processing (Article 18) and data portability (Article 20). You can object to processing (Article 21) and lodge a complaint with a supervisory authority (Article 77), for example the Bayerisches Landesamt für Datenschutzaufsicht, Promenade 18, 91522 Ansbach, Germany.' }],
      },
    ],
  },
  impressum: {
    title: 'Legal notice',
    description: 'Legal notice for the bleib website.',
    intro: ['Information under § 5 DDG.'],
    sections: [
      { h: 'Operator', blocks: [{ address: OPERATOR }] },
      { h: 'Contact', blocks: [{ address: ['Email hello@rouxdutoit.com', 'Telephone +49 162 7850608'] }] },
      { h: 'Responsible for content', blocks: [{ p: 'Under § 18(2) MStV:' }, { address: OPERATOR }] },
      { h: 'About this site', blocks: [{ p: 'This website describes bleib, a free and open source wallet for your AI context. bleib is in development. Its source code will be open under AGPL-3.0-or-later; the file format, specification and SDK under Apache-2.0.' }] },
    ],
  },
};

const de: Docs = {
  how: {
    title: 'So funktioniert’s',
    description: 'Wie bleib deinen KI-Kontext verschlüsselt, vor dem Teilen fragt und dir jedes Mal einen Beleg gibt.',
    intro: [
      'bleib sitzt zwischen dir und den KIs, die du nutzt. Sie bekommen, was eine Aufgabe braucht, wenn du es erlaubst, und du siehst jederzeit, was sie bekommen haben.',
      'bleib ist in Entwicklung. Diese Seite beschreibt, wie es funktioniert.',
    ],
    hub: [
      { to: 'permissions', t: 'Berechtigungen', d: 'Was bleib fragt und wann.', icon: 'check' },
      { to: 'receipts', t: 'Belege', d: 'Genau, was jede KI gesehen hat.', icon: 'fingerprint' },
      { to: 'works', t: 'Kompatibilität', d: 'Claude, Cursor, OpenClaw und mehr.', icon: 'code' },
      { to: 'standards', t: 'Standards', d: 'Die offenen Formate darunter.', icon: 'verified_user' },
    ],
    sections: [
      {
        id: 'wallet',
        h: 'Deine Wallet',
        blocks: [
          { p: 'Alles, was deine KIs über dich wissen sollen, liegt in einem Ordner auf deinem Gerät: Menschen, Vorlieben, Projekte und Regeln. Als Klartext, den du lesen und korrigieren kannst, verschlüsselt mit einem Schlüssel, den nur du hast.' },
          { p: 'Bring mit, was deine KIs schon wissen: Importiere einen OpenClaw- oder Hermes-Workspace oder füge dein Gedächtnis aus ChatGPT oder Claude ein und prüfe jeden Eintrag.' },
        ],
      },
      {
        id: 'door',
        h: 'Eine Tür für jede KI',
        blocks: [
          { p: 'KIs verbinden sich über eine Tür auf deinem Gerät mit bleib. Jede KI wird einmal mit einem kurzen Code gekoppelt und bekommt ihren eigenen Schlüssel. So kann sich nichts als eine andere App ausgeben.' },
          { p: 'Eine KI fragt nach dem, was eine Aufgabe braucht, und bekommt die kleinste brauchbare Antwort, nicht deine Dateien.' },
        ],
      },
      {
        id: 'permissions',
        h: 'Einmal gefragt, gemerkt',
        blocks: [
          { p: 'Wenn eine KI zum ersten Mal eine neue Art von Information braucht, fragt bleib dich: Einmal erlauben, Immer für diese KI oder Nicht erlauben. Du siehst genau, was geteilt würde und wohin es geht.' },
          { p: 'Deine Antwort wird zur Regel. bleib fragt erst wieder, wenn sich die KI, die Art der Information oder das Ziel ändert.' },
        ],
      },
      {
        id: 'receipts',
        h: 'Ein Beleg für jede Weitergabe',
        blocks: [
          { p: 'Bevor etwas geteilt wird, schreibt bleib einen Beleg: welche KI, welches Unternehmen oder Gerät es bekommen hat, wofür, der genaue Wortlaut und wann. Jede Woche bekommst du eine verständliche Übersicht darüber, was deine KIs gesehen haben.' },
        ],
      },
      {
        id: 'proposals',
        h: 'KIs schlagen vor, du entscheidest',
        blocks: [
          { p: 'KIs können vorschlagen, was sie sich merken möchten. Du siehst jeden Vorschlag mit der Begründung der KI und wählst Speichern, Bearbeiten oder Nicht jetzt. Gespeichert wird erst, wenn du zustimmst.' },
          { p: 'Eine Zustimmung erlaubt keiner KI, es zu lesen. Lesen braucht eine eigene Erlaubnis.' },
        ],
      },
      {
        id: 'recovery',
        h: 'Wenn du ein Gerät verlierst',
        blocks: [
          { p: 'Bevor bleib etwas speichert, richtest du die Wiederherstellung ein: zuerst ein ausgedrucktes Wiederherstellungs-Kit, später auch über ein zweites Gerät oder einen Passkey. Wir haben nie einen Schlüssel, mit dem wir deine Daten lesen könnten.' },
        ],
      },
      {
        id: 'limits',
        h: 'Was bleib nicht kann',
        blocks: [
          {
            list: [
              'Was eine KI gesehen hat, hat sie gesehen. bleib steuert, was weitergegeben wird, kann es aber nicht zurückholen.',
              'KIs mit eigenem Gedächtnis können Kopien behalten. bleib funktioniert am besten mit KIs, die bleib als Gedächtnis nutzen.',
              'bleib gibt dir Belege darüber, was geteilt wurde. Anonymität verspricht es nicht.',
            ],
          },
        ],
      },
    ],
  },
  works: {
    title: 'Funktioniert mit deiner KI',
    description: 'Mit welchen KI-Apps sich bleib verbindet und wie.',
    intro: [
      'bleib ist ein Ort für deinen Kontext, den jede KI nutzen kann, wenn du es erlaubst. Die Verbindung läuft über offene Standards, damit du an keinen Anbieter gebunden bist.',
      'bleib ist in Entwicklung. So wird jede Verbindung funktionieren.',
    ],
    sections: [
      {
        h: 'Verbunden über MCP',
        blocks: [
          { p: 'Das Model Context Protocol (MCP) ist der offene Standard, über den KI-Apps auf Werkzeuge und Daten zugreifen. bleib betreibt einen kleinen MCP-Server auf deinem Computer. KI-Apps mit MCP-Unterstützung können dort nach Kontext fragen, sonst niemand.' },
        ],
      },
      {
        h: 'KI-Apps',
        blocks: [
          {
            tiles: [
              { t: 'Claude Desktop und Claude Code', d: 'Einmal mit einem Code koppeln. Die Einrichtung ist ein kopierter Abschnitt.' },
              { t: 'Cursor', d: 'Ebenso einmal mit einem Code koppeln.' },
              { t: 'OpenClaw', d: 'Nutzt deine vorhandenen Workspace-Dateien. bleib verschlüsselt sie und fragt vor dem Teilen.' },
              { t: 'Hermes Agent', d: 'Importiert OpenClaw-Workspaces. bleib funktioniert mit beiden.' },
              { t: 'Lokale Modelle', d: 'Ollama und LM Studio. Nichts verlässt deinen Computer.' },
              { t: 'Gedächtnis aus ChatGPT und Claude', d: 'Füge dein bisheriges Gedächtnis einmal ein und prüfe jeden Eintrag.', tag: 'Import' },
            ],
          },
        ],
      },
      {
        h: 'Wohin Daten wirklich gehen',
        blocks: [
          { p: 'Eine App kann angeben, welches Modell sie nutzt, und bleib kann es prüfen. Schickt eine App ihre Modellanfragen über den lokalen Proxy von bleib oder über den Anfrage-Hook von OpenClaw, sieht bleib das echte Ziel und markiert den Beleg als „beobachtet“ statt „angegeben“.' },
        ],
      },
      {
        h: 'Deine Dateien bleiben deine',
        blocks: [
          { p: 'Erinnerungen sind einfaches Markdown, kompatibel mit den Workspace-Dateien von OpenClaw und Hermes (USER.md, MEMORY.md und Tagesnotizen). Du kannst jeden Eintrag öffnen, lesen, korrigieren und mitnehmen.' },
        ],
      },
      {
        h: 'Grenzen',
        blocks: [
          {
            list: [
              'Apps mit eigenem Gedächtnis können weiterhin Kopien behalten. bleib funktioniert am besten mit Apps, die bleib als Gedächtnis nutzen.',
              'Ob eine App unterstützt wird, hängt von ihrer MCP-Unterstützung ab. Wir listen Apps hier, sobald sie getestet sind.',
            ],
          },
        ],
      },
    ],
  },
  permissions: {
    title: 'Berechtigungen',
    description: 'Wie bleib vor dem Teilen fragt, sich deine Antwort merkt und deine Regeln einhält.',
    intro: ['bleib fragt einmal, merkt sich deine Antwort und fragt erst wieder, wenn sich etwas Wichtiges ändert.'],
    sections: [
      {
        h: 'Wie bleib fragt',
        blocks: [
          { p: 'Wenn eine KI zum ersten Mal eine Art von Information braucht, zeigt bleib genau, was geteilt würde und wohin es ginge. Du wählst Einmal erlauben, Immer für diese KI oder Nicht erlauben.' },
        ],
      },
      {
        h: 'Was eine Erlaubnis umfasst',
        blocks: [
          {
            rows: [
              { k: 'Welche KI', v: 'Einmal gekoppelt, mit eigenem Schlüssel' },
              { k: 'Welche Art von Information', v: 'Zum Beispiel Reisen oder Arbeit' },
              { k: 'Wohin sie geht', v: 'Dieses Gerät, der Anbieter der KI oder ein benannter Dritter' },
            ],
          },
          { p: 'bleib fragt nur erneut, wenn sich eines davon ändert. Der Zweck steht auf jedem Beleg.' },
        ],
      },
      {
        h: 'Arten von Information',
        blocks: [
          {
            tiles: [
              { t: 'Menschen', d: 'Freunde, Familie und Kollegen, die du erwähnst.', icon: 'person' },
              { t: 'Reisen', d: 'Sitzplätze, Hotels, Reisen.', icon: 'flight' },
              { t: 'Arbeit', d: 'Projekte, Abläufe, wie du gern arbeitest.', icon: 'work' },
              { t: 'Essen', d: 'Ernährung und Lieblingsorte.', icon: 'restaurant' },
              { t: 'Gesundheit', d: 'Wird jedes Mal erfragt.', icon: 'favorite', tag: 'Sensibel' },
              { t: 'Geld', d: 'Wird jedes Mal erfragt.', icon: 'lock', tag: 'Sensibel' },
            ],
          },
          { p: 'Die vollständige Liste folgt dem W3C Data Privacy Vocabulary, damit die Kategorien überall dasselbe bedeuten.' },
        ],
      },
      {
        h: 'Sensible Informationen',
        blocks: [
          { p: 'Bei Gesundheit, Geld, Ausweisdokumenten, Passwörtern und privaten Angaben über andere fragt bleib jedes Mal, außer du entscheidest es mit einer zusätzlichen Bestätigung anders.' },
        ],
      },
      {
        h: 'Regeln in deinen Worten',
        blocks: [
          { list: ['„Teile nie Gesundheitsdaten mit gehosteten Modellen.“', '„Nur Claude darf Arbeit sehen.“', '„Halte Abendessen unter 30 €.“'] },
          { p: 'bleib macht aus einem Satz eine Regel, zeigt sie dir zur Bestätigung und wendet sie vor jeder Erlaubnis an. KIs können deine Regeln nie schreiben oder ausweiten.' },
        ],
      },
      {
        h: 'Zurücknehmen',
        blocks: [{ p: 'Nimm jede Erlaubnis zurück oder trenne jede KI, jederzeit. Es gilt ab der nächsten Anfrage.' }],
      },
    ],
  },
  receipts: {
    title: 'Belege',
    description: 'Was ein Beleg von bleib festhält und wie du ihn prüfen kannst.',
    intro: ['Jedes Mal, wenn eine KI etwas aus deiner Wallet bekommt, schreibt bleib zuerst einen Beleg. Du siehst jederzeit genau, was jede KI gesehen hat.'],
    sections: [
      {
        h: 'Was ein Beleg enthält',
        blocks: [
          {
            rows: [
              { k: 'KI', v: 'Welche App gefragt hat' },
              { k: 'Gesendet an', v: 'Das Unternehmen oder Gerät, angegeben oder beobachtet' },
              { k: 'Für', v: 'Der genannte Zweck' },
              { k: 'Geteilt', v: 'Der genaue Wortlaut' },
              { k: 'Nicht geteilt', v: 'Was erfragt, aber nicht herausgegeben wurde' },
              { k: 'Erlaubnis', v: 'Welche Erlaubnis es zugelassen hat' },
              { k: 'Fingerabdruck', v: 'Beweis, was genau weitergegeben wurde' },
            ],
          },
        ],
      },
      {
        h: 'Geschrieben, bevor etwas rausgeht',
        blocks: [{ p: 'Der Beleg wird in deiner verschlüsselten Wallet gespeichert, bevor die KI etwas bekommt. Schlägt das Speichern fehl, wird nichts geteilt.' }],
      },
      {
        h: 'Manipulationssicher',
        blocks: [{ p: 'Jeder Beleg trägt einen Fingerabdruck (SHA-256) des genau Geteilten und ist mit dem vorherigen verknüpft. Wer einen Beleg ändert oder löscht, bricht die Kette, und bleib zeigt es dir.' }],
      },
      {
        h: 'Eine verständliche Wochenübersicht',
        blocks: [{ p: '„Diese Woche haben 3 KIs 11 Fakten gesehen. Nichts über deine Gesundheit hat dieses Gerät verlassen.“ In einer Minute gelesen.' }],
      },
      {
        h: 'Export',
        blocks: [{ p: 'Exportiere deine Belege als Einwilligungsnachweise nach ISO/IEC TS 27560 und dem W3C Data Privacy Vocabulary, für dich, eine Anwältin oder einen Datenschutzbeauftragten.' }],
      },
      {
        h: 'Grenzen',
        blocks: [
          {
            list: [
              'Was eine KI gesehen hat, hat sie gesehen. Ein Beleg ist ein Nachweis; er holt nichts zurück.',
              'Ein angegebenes Ziel ist, was die App bleib gesagt hat. Ein beobachtetes ist, was bleib hat rausgehen sehen.',
            ],
          },
        ],
      },
    ],
  },
  standards: {
    title: 'Standards und Formate',
    description: 'Die offenen Standards, auf denen bleib aufbaut.',
    intro: ['bleib baut auf offenen Standards auf, statt eigene zu erfinden. So lassen sich deine Daten und unsere Aussagen überprüfen.'],
    sections: [
      {
        h: 'KI verbinden',
        blocks: [
          {
            tiles: [
              { t: 'Model Context Protocol', d: 'Wie KI-Apps bleib auf deinem Computer erreichen.', tag: 'MCP' },
              { t: 'Agent2Agent', d: 'Wie sich dein Agent anderen Agenten vorstellen wird.', tag: 'Später' },
            ],
          },
        ],
      },
      {
        h: 'Dein Gedächtnis',
        blocks: [
          {
            tiles: [
              { t: 'Workspace-Dateien von OpenClaw und Hermes', d: 'Einfache Markdown-Dateien, die bleib liest, schreibt und verschlüsselt.' },
              { t: 'Portable Context Protocol', d: 'Feldnamen für Einträge, etwa woher ein Fakt stammt und wie sensibel er ist.', tag: 'PCP' },
            ],
          },
        ],
      },
      {
        h: 'Berechtigungen und Protokolle',
        blocks: [
          {
            tiles: [
              { t: 'Human Context Protocol', d: 'Das Berechtigungs- und Protokollmodell des Projekts Loyal Agents (Stanford Digital Economy Lab und Consumer Reports). bleib will kompatibel sein und ergänzt das Ziel der Daten sowie Belege mit genauem Inhalt.', tag: 'HCP' },
              { t: 'W3C Data Privacy Vocabulary', d: 'Die gemeinsame Liste der Arten personenbezogener Daten.', tag: 'DPV' },
            ],
          },
        ],
      },
      {
        h: 'Belege',
        blocks: [
          {
            tiles: [
              { t: 'ISO/IEC TS 27560', d: 'Die Struktur von Einwilligungsnachweisen, genutzt für den Export.' },
              { t: 'OSAP Consent Receipts', d: 'Ein Belegformat, das auf ISO/IEC TS 27560 abgebildet ist.', tag: 'IETF-Entwurf' },
              { t: 'Memory Projection Records', d: 'Fingerabdrücke, die beweisen, was genau weitergegeben wurde.', tag: 'IETF-Entwurf' },
            ],
          },
        ],
      },
      {
        h: 'Verschlüsselung',
        blocks: [
          {
            tiles: [
              { t: 'age', d: 'Moderne, einfache Dateiverschlüsselung für jede Erinnerung.' },
              { t: 'Verschlüsselter Index und Belege', d: 'Suche, Berechtigungen und Belege sind ebenfalls verschlüsselt. Klartext landet nie auf der Festplatte.' },
            ],
          },
        ],
      },
      {
        h: 'Später',
        blocks: [
          {
            tiles: [
              { t: 'Verifiable Credentials', d: 'Berechtigungen, die andere Dienste prüfen können, mit Widerrufsliste statt öffentlichem Register.', tag: 'W3C' },
              { t: 'Agenten-Zahlungen und EU-Wallet', d: 'Signierte Vollmachten für Agenten, die in deinem Namen handeln (AP2, EUDI Wallet).' },
            ],
          },
          { p: 'Entwürfe sind Entwürfe: Wir verfolgen sie genau und sagen es, wenn sich einer ändert.' },
        ],
      },
    ],
  },
  security: {
    title: 'Sicherheit und Datenschutz',
    description: 'Wie bleib deinen Kontext schützt und wo die Grenzen liegen.',
    intro: [
      'bleib läuft auf deinem Computer. Dein Gedächtnis ist mit einem Schlüssel verschlüsselt, den nur du hast.',
      'bleib ist in Entwicklung. Vor dem Start kommt hier ein öffentliches Audit dazu.',
    ],
    cta: { label: 'Sicherheitslücke melden', href: SECURITY_MAIL },
    sections: [
      {
        h: 'Was bleib nie tun wird',
        blocks: [
          {
            never: [
              'Einen Schlüssel halten, mit dem wir dein Gedächtnis lesen könnten.',
              'Eine KI deine Wallet entsperren oder sich selbst Zugriff erteilen lassen.',
              'Etwas teilen, ohne vorher einen Beleg zu schreiben.',
              'Telemetrie oder Analysedaten senden.',
              'Geld dafür verlangen, dass du deine eigenen Daten siehst.',
            ],
          },
        ],
      },
      {
        h: 'Wie es dich schützt',
        blocks: [
          {
            tiles: [
              { t: 'Verschlüsselt auf deinem Gerät', d: 'Jede Erinnerung ist mit age verschlüsselt. Klartext landet nie auf der Festplatte.', icon: 'lock' },
              { t: 'Nur dein Schlüssel', d: 'Der Schlüssel entsteht aus deiner Passphrase. Verlierst du deine Geräte, hilft dir dein Wiederherstellungs-Kit; wir können es nicht.', icon: 'fingerprint' },
              { t: 'Nur lokal', d: 'Die Tür lauscht nur auf deinem Computer (127.0.0.1) und prüft jede Anfrage.', icon: 'verified_user' },
              { t: 'Jede KI gekoppelt', d: 'Einmal-Codes. Jede App bekommt eigene Zugangsdaten, keine kann sich als eine andere ausgeben.', icon: 'check' },
            ],
          },
        ],
      },
      {
        h: 'Grenzen',
        blocks: [
          {
            list: [
              'Was eine KI gesehen hat, hat sie gesehen.',
              'Eine KI mit eigenem Gedächtnis kann Kopien behalten.',
              'Ist dein Computer kompromittiert, während bleib entsperrt ist, gilt das auch für alles, was bleib sehen kann.',
              'bleib liefert Belege. Anonymität oder Rechtskonformität verspricht es nicht.',
            ],
          },
        ],
      },
      {
        h: 'Sicherheitslücke melden',
        blocks: [{ p: 'Schreib an hello@rouxdutoit.com. Wir antworten so schnell wie möglich und nennen dich auf Wunsch.' }],
      },
    ],
  },
  developers: {
    title: 'Entwickler',
    description: 'bleib für Entwickler: eine lokale MCP-Tür, offene Formate und überprüfbare Belege.',
    intro: ['bleib ist in Entwicklung und wird Open Source. Hier steht, was wir bauen, damit du uns sagen kannst, was du brauchst.'],
    sections: [
      {
        h: 'Eine lokale Tür über MCP',
        blocks: [
          { p: 'bleib betreibt einen lokalen Model-Context-Protocol-Server, über stdio und über Streamable HTTP auf 127.0.0.1. Agenten rufen zuerst bleib_status auf, dann bleib_context_request mit einem Zweck und den benötigten Arten von Information. Fehlt eine Erlaubnis, bekommen sie den Zustand approval_required mit einem Link für die Person, nie einen nackten Fehler.' },
          { p: 'Jeder Agent wird einmal mit einem kurzlebigen Code gekoppelt und bekommt eigene Zugangsdaten. Agenten können die Wallet nie entsperren und sich nie selbst Zugriff erteilen.' },
        ],
      },
      {
        h: 'Offene Formate',
        blocks: [
          {
            list: [
              'Erinnerungen sind Markdown mit Frontmatter, kompatibel mit den Workspace-Dateien von OpenClaw und Hermes.',
              'Berechtigungen und Protokolle folgen dem Human Context Protocol, ergänzt um Ziel und Belege mit genauem Inhalt.',
              'Belege orientieren sich an ISO/IEC TS 27560 und am W3C Data Privacy Vocabulary.',
              'Dateien werden mit age verschlüsselt. Die Schlüssel entstehen aus deiner Passphrase und verlassen dein Gerät nie.',
            ],
          },
        ],
      },
      {
        h: 'Geplante Befehle',
        blocks: [
          { code: 'npx bleib init' },
          { code: 'bleib import openclaw ~/.openclaw/workspace' },
          { code: 'bleib pair claude --destination provider:anthropic' },
          { code: 'bleib serve' },
        ],
      },
      {
        h: 'Lizenz',
        blocks: [
          {
            rows: [
              { k: 'Die App bleib', v: 'AGPL-3.0-or-later' },
              { k: 'Dateiformat, Spezifikation und SDK', v: 'Apache-2.0' },
            ],
          },
          { p: 'Die App bleibt offen: Wer eine veränderte Version als Dienst betreibt, muss die Änderungen teilen. Format und SDK sind frei nutzbar, damit jede KI-App bleib einbinden kann.' },
        ],
      },
      {
        h: 'Mitmachen',
        blocks: [{ p: 'Das Repository wird bald auf GitHub veröffentlicht. Bis dahin schreib an hello@rouxdutoit.com oder sichere dir auf der Startseite frühen Zugang.' }],
      },
    ],
  },
  pricing: {
    title: 'Preise',
    description: 'bleib ist kostenlos und Open Source. Du zahlst nur für Komfort.',
    intro: ['Kostenlos für alles, was deine Daten zu deinen macht. Du zahlst nur, wenn wir es dir bequemer machen sollen.'],
    sections: [
      {
        h: 'Dauerhaft kostenlos',
        blocks: [
          {
            never: [
              'Die Wallet und jede KI-Verbindung',
              'Berechtigungen, Regeln und Belege',
              'Importe und das Wiederherstellungs-Kit',
              'Synchronisierung über deine eigene Cloud und Betrieb auf eigener Hardware',
            ],
          },
        ],
      },
      {
        h: 'Komfort',
        blocks: [
          {
            tiles: [
              { t: 'Synchronisierung und Sicherung', d: 'Gehostet und Ende-zu-Ende-verschlüsselt, mit Wiederherstellung per Passkey. Wir speichern nur Daten, die wir nicht lesen können.', tag: 'Später' },
              { t: 'Organisationen', d: 'Getrennte Bereiche für Arbeit und Privates mit eigenen Schlüsseln, Wiederherstellung des Arbeitsbereichs durch die Administration und Support.', tag: 'Später' },
            ],
          },
        ],
      },
      {
        h: 'Unser Versprechen',
        blocks: [{ p: 'Wir verlangen nie Geld dafür, dass du deine eigenen Daten siehst, und wir haben nie einen Schlüssel, mit dem wir sie lesen könnten.' }],
      },
    ],
  },
  privacy: {
    title: 'Datenschutz',
    description: 'Wie die Website von bleib mit deinen Daten umgeht.',
    intro: ['Dieser Hinweis gilt für diese Website. bleib selbst läuft auf deinem Gerät und schickt uns nichts.'],
    sections: [
      { h: 'Cookies', blocks: [{ p: 'Keine. Wenn du zwischen hellem und dunklem Design wechselst, merkt sich dein Browser die Wahl im lokalen Speicher. Davon wird nichts an uns gesendet.' }] },
      { h: 'Analyse und Tracking', blocks: [{ p: 'Keine.' }] },
      { h: 'Anfragen an Dritte', blocks: [{ p: 'Keine. Schriften, Symbole und Dateien werden mit dieser Website ausgeliefert.' }] },
      { h: 'Verarbeitete Daten', blocks: [{ p: 'Deine IP-Adresse und technische Anfragedaten, wenn die Website ausgeliefert wird.' }] },
      {
        h: 'Früher Zugang',
        blocks: [{ p: 'Wenn du dich für frühen Zugang einträgst, speichern wir deine E-Mail-Adresse, deine Sprache und den Zeitpunkt der Anmeldung, um dir Bescheid zu geben, sobald bleib verfügbar ist. Rechtsgrundlage ist deine Einwilligung nach Art. 6 Abs. 1 lit. a DSGVO. Du kannst sie jederzeit per E-Mail an hello@rouxdutoit.com widerrufen; dann löschen wir deinen Eintrag.' }],
      },
      {
        h: 'Hosting',
        blocks: [{ p: 'Diese Website und die Liste für frühen Zugang werden von Cloudflare, Inc., 101 Townsend St, San Francisco, CA 94107, USA, gehostet. Wenn du eine Seite öffnest, erhält Cloudflare deine IP-Adresse und technische Anfragedaten, um die Seite auszuliefern und die Website vor Angriffen zu schützen. Mit Cloudflare besteht ein Vertrag zur Auftragsverarbeitung nach Art. 28 DSGVO. Übermittlungen in die USA sind durch das EU-US Data Privacy Framework, unter dem Cloudflare zertifiziert ist, und durch Standardvertragsklauseln abgesichert. Rechtsgrundlage ist Art. 6 Abs. 1 lit. f DSGVO, unser berechtigtes Interesse am sicheren und funktionsfähigen Betrieb der Website.' }],
      },
      {
        h: 'Kontakt',
        blocks: [{ p: 'Wenn du uns schreibst oder anrufst, nutzen wir deine Nachricht und Kontaktdaten, um dir zu antworten. Rechtsgrundlage ist Art. 6 Abs. 1 lit. b DSGVO bei vertragsbezogenen Anfragen und Art. 6 Abs. 1 lit. f DSGVO für unser berechtigtes Interesse an der Beantwortung sonstiger Anfragen. Wir löschen die Daten, sobald sie nicht mehr benötigt werden, sofern keine gesetzlichen Aufbewahrungspflichten bestehen.' }],
      },
      { h: 'Verantwortlicher', blocks: [{ address: [...OPERATOR_DE, 'E-Mail hello@rouxdutoit.com', 'Telefon +49 162 7850608'] }] },
      { h: 'Links zu anderen Websites', blocks: [{ p: 'Wenn du einem Link zu einer anderen Website folgst, gilt dort deren Datenschutzerklärung.' }] },
      {
        h: 'Deine Rechte',
        blocks: [{ p: 'Nach der DSGVO hast du das Recht auf Auskunft (Art. 15), Berichtigung (Art. 16), Löschung (Art. 17), Einschränkung der Verarbeitung (Art. 18) und Datenübertragbarkeit (Art. 20). Du kannst der Verarbeitung widersprechen (Art. 21) und dich bei einer Aufsichtsbehörde beschweren (Art. 77), zum Beispiel beim Bayerischen Landesamt für Datenschutzaufsicht, Promenade 18, 91522 Ansbach.' }],
      },
    ],
  },
  impressum: {
    title: 'Impressum',
    description: 'Impressum der Website von bleib.',
    intro: ['Angaben gemäß § 5 DDG.'],
    sections: [
      { h: 'Anbieter', blocks: [{ address: OPERATOR_DE }] },
      { h: 'Kontakt', blocks: [{ address: ['E-Mail hello@rouxdutoit.com', 'Telefon +49 162 7850608'] }] },
      { h: 'Verantwortlich für den Inhalt', blocks: [{ p: 'Nach § 18 Abs. 2 MStV:' }, { address: OPERATOR_DE }] },
      { h: 'Über diese Website', blocks: [{ p: 'Diese Website beschreibt bleib, eine kostenlose Open-Source-Wallet für deinen KI-Kontext. bleib ist in Entwicklung. Der Quellcode wird unter AGPL-3.0-or-later veröffentlicht, Dateiformat, Spezifikation und SDK unter Apache-2.0.' }] },
    ],
  },
};

export const docs: Record<Lang, Docs> = { en, de };
