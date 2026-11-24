import { GITHUB_URL, type Lang, type RouteKey } from './strings';
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
  | { tiles: Tile[] }
  | { refs: { name: string; href: string; v: string }[] };

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
    description: 'Keep your memory on your device and share only what each request needs.',
    intro: [
      'bleib keeps your memory on your device. Each AI gets only what it needs for the request.',
      'bleib is in development.',
    ],
    hub: [
      { to: 'permissions', t: 'Permissions', d: 'When bleib asks before sharing.', icon: 'check' },
      { to: 'receipts', t: 'Receipts', d: 'What bleib shared and with whom.', icon: 'fingerprint' },
      { to: 'works', t: 'Works with', d: 'ChatGPT, Claude, Gemini and more.', icon: 'code' },
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
          { p: 'Type “I prefer aisle seats” in a chat. The browser extension quietly saves preferences it recognises and gives you an Undo button. Other things you tell the AI can go into review.' },
          { p: 'You can also bring in the visible entries from the memory pages on ChatGPT, Claude and Gemini. bleib shows you what it found, and you keep what you like.' },
        ],
      },
      {
        id: 'permissions',
        h: 'Share just enough',
        blocks: [{ p: 'bleib looks for the smallest useful part of your memory on your device. It asks before the first share with each AI. Choose Allow Once for this request, or let that AI get relevant everyday preferences automatically. Sensitive or unclear information always needs your approval.' }],
      },
      {
        id: 'door',
        h: 'Start a new chat',
        blocks: [{ p: 'Start typing your first request. If there’s a match and sharing is allowed, bleib adds a short “About me” line to your draft. You decide when to send it. If a site changes, bleib pauses until it recognises the page again.' }],
      },
      {
        id: 'receipts',
        h: 'A receipt for every share',
        blocks: [{ p: 'Open your receipts to see what bleib shared, with which AI and when.' }],
      },
      {
        id: 'limits',
        h: 'Shared when added',
        blocks: [{ p: 'The site can read the line as soon as bleib adds it. Undo can remove the addition from your draft, but the site may already have seen it.' }],
      },
      {
        id: 'recovery',
        h: 'Get your memory back',
        blocks: [{ p: 'Keep your recovery kit and an encrypted backup somewhere safe, away from your device. Together they bring your memory back on a new one.' }],
      },
    ],
  },
  works: {
    title: 'Works with your AI',
    description: 'Use your memory in ChatGPT, Claude, Gemini and supported AI tools.',
    intro: ['The bleib browser extension is in development for Chrome and Firefox. It works on recognised pages on these three sites.'],
    sections: [
      {
        h: 'In your browser',
        blocks: [
          {
            tiles: [
              { t: 'ChatGPT', d: 'chatgpt.com' },
              { t: 'Claude', d: 'claude.ai' },
              { t: 'Gemini', d: 'gemini.google.com' },
            ],
          },
          { p: 'On these sites bleib can save everyday preferences with Undo, add a line about you to a new chat draft, and bring visible saved memories into bleib for review. If a site changes, bleib pauses until it recognises the page again.' },
        ],
      },
      {
        h: 'Installed AI tools',
        blocks: [{ p: 'In bleib, you can connect Claude Desktop, Claude Code, Cursor, OpenClaw and Hermes when it finds them on your computer. Each tool decides where its data goes, so it’s worth a look as you connect it.' }],
      },
    ],
  },
  permissions: {
    title: 'Permissions',
    description: 'Choose what each AI can get from your memory.',
    intro: ['bleib checks what a request needs on your device. It picks only the relevant minimum and asks before the first share with each AI.'],
    sections: [
      {
        h: 'Your choices',
        blocks: [
          { p: 'bleib shows what it would share and where it would go. You can decline or choose how to allow it.' },
          {
            rows: [
              { k: 'Allow Once', v: 'Share for this request only.' },
              { k: 'Share everyday preferences automatically', v: 'Let this AI get relevant everyday preferences for future requests. You choose this separately for each AI.' },
            ],
          },
        ],
      },
      {
        h: 'bleib always asks about sensitive information',
        blocks: [{ p: 'Health, money, people and location always need your approval for each request. So does anything you keep private or bleib can’t confidently classify.' }],
      },
      {
        h: 'Change your mind',
        blocks: [{ p: 'You can change permissions or disconnect an AI in bleib at any time. That takes effect on future requests. The AI provider may still have what it already received.' }],
      },
    ],
  },
  receipts: {
    title: 'Receipts',
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
        blocks: [{ p: 'The receipt records what bleib released for the draft. If the draft changes at the last moment, bleib may already have saved a receipt. The receipt stays after Undo and is independent of whether you press Send.' }],
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
        blocks: [{ p: 'The Model Context Protocol (MCP) lets supported AI tools ask bleib for information on your device.' }],
      },
      {
        h: 'Storing your memory',
        blocks: [{ p: 'bleib stores your notes as Markdown, a plain text format, and encrypts them with age. It can import memory files from OpenClaw and Hermes.' }],
      },
      {
        h: 'Exporting receipts',
        blocks: [{ p: 'Receipt exports use categories from the W3C Data Privacy Vocabulary and draw on ISO/IEC TS 27560 for consent records.' }],
      },
    ],
  },
  security: {
    title: 'Security and privacy',
    description: 'How bleib protects your memory and what it trusts on your device.',
    intro: ['Only you can read your memory. It’s encrypted on your device, with no account and no tracking. Every share leaves a receipt, and the code is open.'],
    cta: { label: 'Report a vulnerability', href: SECURITY_MAIL },
    sections: [
      {
        h: 'On your device',
        blocks: [{ p: 'bleib encrypts your notes, permissions and receipts. It picks what a request needs on your device and asks every time about sensitive information.' }],
      },
      {
        h: 'What bleib trusts',
        blocks: [
          { p: 'bleib relies on your operating system, your signed-in user account and your browser. Someone who controls that account or browser can observe local activity and may be able to read your memory while bleib is unlocked.' },
          { p: 'Desktop security changes are in development. Earlier builds can store unlock and recovery information in your system keyring. The new design requires an operating system confirmation before system unlock. Where system unlock is unavailable, you enter a passphrase. You’ll save your recovery kit elsewhere. bleib will keep no copy of the kit on your device.' },
        ],
      },
      {
        h: 'On an AI site',
        blocks: [{ p: 'The site and other extensions with access to the page can read text in the draft as soon as bleib adds it.' }],
      },
      {
        h: 'Report a vulnerability',
        blocks: [{ p: 'Email hello@rouxdutoit.com.' }],
      },
    ],
  },
  developers: {
    title: 'Developers',
    description: 'Build with the bleib wallet, the local MCP API and open formats.',
    intro: ['bleib is free, open source and in development. The wallet works today: try it and tell us what you need.'],
    cta: { label: 'View on GitHub', href: GITHUB_URL },
    sections: [
      {
        h: 'Connect over MCP',
        blocks: [
          { p: 'The wallet supports MCP over stdio and Streamable HTTP on 127.0.0.1. Pair each client with its own credential. Call bleib_status, then bleib_context_request with the question, purpose and kinds needed. If the result is approval_required, show the approval link and let the person decide.' },
          { p: 'The wallet matches locally. A plain MCP client supplies its own question and purpose. The browser extension uses the actual draft and connects through native messaging.' },
          { p: 'Agents can never unlock the wallet, widen their own access or approve themselves.' },
        ],
      },
      {
        h: 'Built on',
        blocks: [
          { p: 'bleib stands on open work by others. Thank you.' },
          {
            refs: [
              { name: 'Model Context Protocol', href: 'https://modelcontextprotocol.io', v: 'How agents connect to the wallet.' },
              { name: 'OpenClaw', href: 'https://docs.openclaw.ai/concepts/memory', v: 'The workspace memory format bleib reads and writes.' },
              { name: 'Hermes Agent', href: 'https://hermes-agent.nousresearch.com', v: 'By Nous Research; uses the same workspace format.' },
              { name: 'Human Context Protocol', href: 'https://github.com/loyalagents/hcp-spec', v: 'By Loyal Agents (Stanford Digital Economy Lab and Consumer Reports); the model for permissions and logs.' },
              { name: 'ISO/IEC TS 27560', href: 'https://www.iso.org/standard/80392.html', v: 'The structure of consent records.' },
              { name: 'W3C Data Privacy Vocabulary', href: 'https://w3id.org/dpv', v: 'The kinds of personal information.' },
              { name: 'OSAP consent receipts', href: 'https://datatracker.ietf.org/doc/draft-zeng-osap-consent-receipts/', v: 'IETF draft; the receipt export.' },
              { name: 'Memory Projection Record', href: 'https://datatracker.ietf.org/doc/draft-ferro-schrock-memory-projection-record/', v: 'IETF draft; a fingerprint of exactly what was released.' },
              { name: 'age', href: 'https://age-encryption.org', v: 'By Filippo Valsorda; encrypts your files.' },
            ],
          },
        ],
      },
      {
        h: 'Try it',
        blocks: [
          { p: 'Node 20 or newer, on Linux or macOS. Install from npm, then follow the setup guide for your AI app.' },
          { code: 'npm install --global @bleib/wallet' },
          { code: 'bleib init' },
          { code: "bleib pair 'Claude Code' --destination provider:Anthropic" },
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
        blocks: [{ p: 'The code is on GitHub at github.com/rouxdutoit/bleib. Open an issue, send a pull request, or write to hello@rouxdutoit.com. Please report security issues by email, not in public.' }],
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
          { p: 'You can withdraw your consent at any time by writing to hello@rouxdutoit.com. We delete your entry and confirm by email.' },
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
      { h: 'Controller', blocks: [{ address: [...OPERATOR, 'Email hello@rouxdutoit.com', 'Telephone +49 162 7850608'] }] },
      { h: 'Links to other sites', blocks: [{ p: 'If you follow a link to another site, its privacy policy applies there.' }] },
      {
        h: 'Your rights',
        blocks: [{ p: 'Under the GDPR you can request access (Article 15), rectification (Article 16), erasure (Article 17), restriction of processing (Article 18) and data portability (Article 20). You can object to processing based on legitimate interest (Article 21) and withdraw consent at any time (Article 7(3)). You can lodge a complaint with a supervisory authority (Article 77), for example the Bayerisches Landesamt für Datenschutzaufsicht, Promenade 18, 91522 Ansbach, Germany.' }],
      },
      { h: 'Changes', blocks: [{ p: 'We update this notice when what we do changes. Last updated: 24 November 2026.' }] },
    ],
  },
  appPrivacy: {
    title: 'App privacy',
    description: 'How bleib and its browser extension handle your memory.',
    intro: ['Only you can read your memory. bleib is in development. The app and extension have no bleib account, telemetry, analytics or automatic crash reporting.'],
    sections: [
      {
        h: 'What the extension reads',
        blocks: [
          { p: 'On recognised pages on chatgpt.com, claude.ai and gemini.google.com, bleib checks what you type in the draft to find relevant notes or recognise preferences to save. During import it reads visible entries on the provider’s memory page and puts them in review with their source.' },
          { p: 'The extension keeps its settings and a revocable connection credential in your browser profile. It talks to the desktop app through your browser’s local connection to installed apps, called native messaging.' },
        ],
      },
      {
        h: 'What the app keeps on your device',
        blocks: [
          { list: [
            'Your notes and entries waiting for review, including their source.',
            'Permissions and rules, details of connected AIs, and receipts for shares.',
          ] },
          { p: 'bleib encrypts these records on your device. It also processes questions and purposes from connected tools, imported files and pasted text locally.' },
        ],
      },
      {
        h: 'What AI providers can see',
        blocks: [
          { p: 'bleib picks the relevant minimum on your device and saves a receipt before sharing. When it adds text to a draft, the site can read it immediately. Undo can remove text from the draft, but the site may already have seen it. The provider’s privacy policy applies to what it receives.' },
          { p: 'An installed AI tool may pass what it receives to its model provider. If you set up bleib to forward model requests, it sends the request and any approved excerpts to the destination you configured.' },
        ],
      },
      {
        h: 'Manage your data',
        blocks: [{ p: 'You can manage notes and disconnect AIs in bleib. You can remove the extension and delete the local bleib data folder. For copies already held by an AI provider, use that provider’s controls.' }],
      },
      {
        h: 'Contact',
        blocks: [{ p: 'For questions about the app, write to hello@rouxdutoit.com. Last updated 24 November 2026.' }],
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
      { h: 'Responsible for content', blocks: [{ p: 'Under § 18(2) MStV.' }, { address: OPERATOR }] },
      { h: 'About bleib', blocks: [{ p: 'bleib is free, open source and in development. The app is licensed under AGPL-3.0-or-later. The file format, specification and SDK are under Apache-2.0.' }] },
    ],
  },
};

const de: Docs = {
  how: {
    title: 'So funktioniert’s',
    description: 'Dein Gedächtnis bleibt auf deinem Gerät. Du teilst nur, was die KI für die Anfrage braucht.',
    intro: [
      'bleib bewahrt dein Gedächtnis auf deinem Gerät auf. Jede KI bekommt nur das, was sie für die jeweilige Anfrage braucht.',
      'bleib ist in Entwicklung.',
    ],
    hub: [
      { to: 'permissions', t: 'Berechtigungen', d: 'Wann bleib dich vor dem Teilen fragt.', icon: 'check' },
      { to: 'receipts', t: 'Belege', d: 'Was bleib mit wem geteilt hat.', icon: 'fingerprint' },
      { to: 'works', t: 'Kompatibilität', d: 'ChatGPT, Claude, Gemini und mehr.', icon: 'code' },
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
          { p: 'Schreib im Chat zum Beispiel „Ich mag grünen Tee“. Die Erweiterung speichert solche Vorlieben im Hintergrund. Du kannst das Speichern rückgängig machen. Andere Angaben kann bleib dir zur Prüfung vorlegen.' },
          { p: 'Du kannst auch die sichtbaren Einträge von den Gedächtnisseiten bei ChatGPT, Claude und Gemini mitnehmen. bleib zeigt dir, was es gefunden hat, und du behältst, was dir gefällt.' },
        ],
      },
      {
        id: 'permissions',
        h: 'Nur das Nötige teilen',
        blocks: [{ p: 'bleib sucht auf deinem Gerät nach den Angaben, die zur Anfrage passen. Bevor eine KI zum ersten Mal etwas bekommt, fragt bleib dich. Du kannst es einmal erlauben oder für diese KI passende alltägliche Vorlieben automatisch teilen lassen. Bei sensiblen oder unklaren Angaben fragt bleib jedes Mal.' }],
      },
      {
        id: 'door',
        h: 'Einen neuen Chat beginnen',
        blocks: [{ p: 'Schreib deine erste Anfrage. Wenn etwas passt und die Freigabe vorliegt, ergänzt bleib eine kurze „Über mich“-Zeile im Entwurf. Du entscheidest, wann du ihn abschickst. Ändert sich eine Seite, pausiert bleib, bis es sie wieder erkennt.' }],
      },
      {
        id: 'receipts',
        h: 'Ein Beleg für jede Freigabe',
        blocks: [{ p: 'In deinen Belegen siehst du, was bleib wann mit welcher KI geteilt hat.' }],
      },
      {
        id: 'limits',
        h: 'Geteilt beim Einfügen',
        blocks: [{ p: 'Die Website kann den Text lesen, sobald bleib ihn einfügt. Mit „Rückgängig“ kannst du ihn aus deinem Entwurf entfernen. Die Website kann ihn dann schon gesehen haben.' }],
      },
      {
        id: 'recovery',
        h: 'Dein Gedächtnis zurückholen',
        blocks: [{ p: 'Bewahre dein Wiederherstellungs-Kit und eine verschlüsselte Sicherung an einem sicheren Ort außerhalb deines Geräts auf. Zusammen holen sie dein Gedächtnis auf ein neues Gerät zurück.' }],
      },
    ],
  },
  works: {
    title: 'Funktioniert mit deiner KI',
    description: 'Nutze dein Gedächtnis in ChatGPT, Claude, Gemini und weiteren KI-Tools.',
    intro: ['Die Browser-Erweiterung für Chrome und Firefox ist in Entwicklung. Sie funktioniert auf Seiten dieser drei Anbieter, die bleib erkennt.'],
    sections: [
      {
        h: 'Im Browser',
        blocks: [
          {
            tiles: [
              { t: 'ChatGPT', d: 'chatgpt.com' },
              { t: 'Claude', d: 'claude.ai' },
              { t: 'Gemini', d: 'gemini.google.com' },
            ],
          },
          { p: 'Auf diesen Seiten kann bleib Vorlieben speichern, eine Zeile über dich in neue Chatentwürfe einfügen und sichtbare Einträge zur Prüfung importieren. Das Speichern kannst du rückgängig machen. Ändert sich eine Seite, pausiert bleib, bis es sie wieder erkennt.' },
        ],
      },
      {
        h: 'Installierte KI-Tools',
        blocks: [{ p: 'Wenn bleib Claude Desktop, Claude Code, Cursor, OpenClaw oder Hermes auf deinem Rechner findet, kannst du sie direkt verbinden. Jedes Tool entscheidet selbst, wohin seine Daten gehen. Ein Blick darauf lohnt sich beim Verbinden.' }],
      },
    ],
  },
  permissions: {
    title: 'Berechtigungen',
    description: 'Entscheide, was jede KI aus deinem Gedächtnis sehen darf.',
    intro: ['bleib wählt auf deinem Gerät nur aus, was zur Anfrage passt. Bevor eine KI zum ersten Mal etwas bekommt, fragt bleib dich.'],
    sections: [
      {
        h: 'Du entscheidest',
        blocks: [
          { p: 'bleib zeigt dir, was es teilen würde und wohin es geht. Du kannst ablehnen oder eine Freigabe erteilen.' },
          {
            rows: [
              { k: 'Einmal erlauben', v: 'Gilt nur für diese Anfrage.' },
              { k: 'Alltägliche Vorlieben automatisch teilen', v: 'Diese KI darf künftig passende alltägliche Vorlieben bekommen. Das entscheidest du für jede KI einzeln.' },
            ],
          },
        ],
      },
      {
        h: 'Bei sensiblen Angaben fragt bleib jedes Mal',
        blocks: [{ p: 'Bei Angaben zu Gesundheit, Geld, Personen und Aufenthaltsort braucht bleib für jede Anfrage deine Zustimmung. Das gilt auch für alles, was du privat hältst oder was bleib nicht sicher einordnen kann.' }],
      },
      {
        h: 'Zugriff ändern',
        blocks: [{ p: 'Du kannst Berechtigungen jederzeit ändern oder eine KI trennen. Das gilt für künftige Anfragen. Was der KI-Anbieter schon erhalten hat, kann er weiterhin gespeichert haben.' }],
      },
    ],
  },
  receipts: {
    title: 'Belege',
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
        blocks: [{ p: 'Der Beleg zeigt, was bleib für den Entwurf freigegeben hat. Er kann schon vorliegen, wenn sich der Entwurf vor dem Einfügen ändert. Auch nach „Rückgängig“ bleibt er erhalten, egal ob du den Chat abgeschickt hast.' }],
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
        blocks: [{ p: 'Über das Model Context Protocol (MCP) können unterstützte KI-Tools Informationen bei bleib auf deinem Gerät anfragen.' }],
      },
      {
        h: 'Dein Gedächtnis speichern',
        blocks: [{ p: 'bleib speichert deine Notizen als Markdown, ein einfaches Textformat, und verschlüsselt sie mit age. Es kann Gedächtnisdateien aus OpenClaw und Hermes importieren.' }],
      },
      {
        h: 'Belege exportieren',
        blocks: [{ p: 'Beim Export nutzt bleib Kategorien aus dem W3C Data Privacy Vocabulary. Das Format für Freigaben orientiert sich an ISO/IEC TS 27560.' }],
      },
    ],
  },
  security: {
    title: 'Sicherheit und Datenschutz',
    description: 'Wie bleib dein Gedächtnis schützt und worauf es sich auf deinem Gerät verlässt.',
    intro: ['Nur du kannst dein Gedächtnis lesen. Es ist auf deinem Gerät verschlüsselt, ohne Konto und ohne Tracking. Jede Freigabe hinterlässt einen Beleg, und der Quellcode ist offen.'],
    cta: { label: 'Sicherheitslücke melden', href: SECURITY_MAIL },
    sections: [
      {
        h: 'Auf deinem Gerät',
        blocks: [{ p: 'bleib verschlüsselt deine Notizen, Berechtigungen und Belege. Es wählt auf deinem Gerät aus, was die KI für ihre Anfrage braucht. Bei sensiblen Angaben fragt es jedes Mal.' }],
      },
      {
        h: 'Worauf bleib sich verlässt',
        blocks: [
          { p: 'bleib vertraut deinem Betriebssystem, deinem angemeldeten Benutzerkonto und deinem Browser. Wer dein Konto oder deinen Browser kontrolliert, kann deine Aktivitäten auf dem Gerät beobachten und unter Umständen dein Gedächtnis lesen, solange bleib entsperrt ist.' },
          { p: 'Änderungen an der Sicherheit der Desktop-App sind in Entwicklung. Frühere Versionen können Daten zum Entsperren und zur Wiederherstellung im Schlüsselbund des Systems speichern. Künftig bestätigst du beim Entsperren über das System zuerst eine Abfrage deines Betriebssystems. Wo das nicht verfügbar ist, gibst du eine Passphrase ein. Dein Wiederherstellungs-Kit legst du woanders ab. bleib behält auf deinem Gerät keine Kopie davon.' },
        ],
      },
      {
        h: 'Auf der Website eines KI-Anbieters',
        blocks: [{ p: 'Sobald bleib Text in den Entwurf einfügt, können die Website und andere Erweiterungen mit Zugriff auf die Seite ihn lesen.' }],
      },
      {
        h: 'Sicherheitslücke melden',
        blocks: [{ p: 'Schreib an hello@rouxdutoit.com.' }],
      },
    ],
  },
  developers: {
    title: 'Für Entwickler',
    description: 'Entwickle mit dem bleib-Wallet, der lokalen MCP-Schnittstelle und offenen Formaten.',
    intro: ['bleib ist kostenlos, quelloffen und in Entwicklung. Das Wallet funktioniert schon: probier es aus und sag uns, was du brauchst.'],
    cta: { label: 'Auf GitHub ansehen', href: GITHUB_URL },
    sections: [
      {
        h: 'Über MCP verbinden',
        blocks: [
          { p: 'Das Wallet unterstützt MCP über stdio und Streamable HTTP auf 127.0.0.1. Jeder verbundene Client bekommt eigene Zugangsdaten. Rufe zuerst bleib_status auf und dann bleib_context_request mit Frage, Zweck und den benötigten Kategorien. Gibt der Aufruf approval_required zurück, zeig den Link zur Freigabe an. Die Entscheidung trifft der Mensch.' },
          { p: 'Das Wallet sucht lokal nach passenden Einträgen. Ein MCP-Client gibt seine Frage und den Zweck selbst an. Die Browser-Erweiterung verwendet den tatsächlichen Entwurf und verbindet sich per Native Messaging.' },
          { p: 'Agents können das Wallet nie entsperren, ihren Zugriff nie selbst erweitern und sich nie selbst freigeben.' },
        ],
      },
      {
        h: 'Baut auf',
        blocks: [
          { p: 'bleib baut auf offener Arbeit anderer auf. Danke.' },
          {
            refs: [
              { name: 'Model Context Protocol', href: 'https://modelcontextprotocol.io', v: 'Wie Agenten sich mit dem Wallet verbinden.' },
              { name: 'OpenClaw', href: 'https://docs.openclaw.ai/concepts/memory', v: 'Das Workspace-Format für Erinnerungen, das bleib liest und schreibt.' },
              { name: 'Hermes Agent', href: 'https://hermes-agent.nousresearch.com', v: 'Von Nous Research; nutzt dasselbe Workspace-Format.' },
              { name: 'Human Context Protocol', href: 'https://github.com/loyalagents/hcp-spec', v: 'Von Loyal Agents (Stanford Digital Economy Lab und Consumer Reports); das Modell für Berechtigungen und Protokolle.' },
              { name: 'ISO/IEC TS 27560', href: 'https://www.iso.org/standard/80392.html', v: 'Der Aufbau von Einwilligungsnachweisen.' },
              { name: 'W3C Data Privacy Vocabulary', href: 'https://w3id.org/dpv', v: 'Die Arten persönlicher Informationen.' },
              { name: 'OSAP consent receipts', href: 'https://datatracker.ietf.org/doc/draft-zeng-osap-consent-receipts/', v: 'IETF-Entwurf; der Export der Belege.' },
              { name: 'Memory Projection Record', href: 'https://datatracker.ietf.org/doc/draft-ferro-schrock-memory-projection-record/', v: 'IETF-Entwurf; ein Fingerabdruck genau dessen, was weitergegeben wurde.' },
              { name: 'age', href: 'https://age-encryption.org', v: 'Von Filippo Valsorda; verschlüsselt deine Dateien.' },
            ],
          },
        ],
      },
      {
        h: 'Ausprobieren',
        blocks: [
          { p: 'Node 20 oder neuer, unter Linux oder macOS. Über npm installieren, dann der Anleitung für deine KI-App folgen.' },
          { code: 'npm install --global @bleib/wallet' },
          { code: 'bleib init' },
          { code: "bleib pair 'Claude Code' --destination provider:Anthropic" },
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
        blocks: [{ p: 'Der Code liegt auf GitHub unter github.com/rouxdutoit/bleib. Eröffne ein Issue, schick einen Pull Request oder schreib an hello@rouxdutoit.com. Sicherheitslücken bitte per E-Mail melden, nicht öffentlich.' }],
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
          { p: 'Du kannst deine Einwilligung jederzeit per E-Mail an hello@rouxdutoit.com widerrufen. Wir löschen deinen Eintrag und bestätigen es per E-Mail.' },
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
      { h: 'Verantwortlicher', blocks: [{ address: [...OPERATOR_DE, 'E-Mail hello@rouxdutoit.com', 'Telefon +49 162 7850608'] }] },
      { h: 'Links zu anderen Websites', blocks: [{ p: 'Wenn du einem Link zu einer anderen Website folgst, gilt dort deren Datenschutzerklärung.' }] },
      {
        h: 'Deine Rechte',
        blocks: [{ p: 'Nach der DSGVO hast du das Recht auf Auskunft (Art. 15), Berichtigung (Art. 16), Löschung (Art. 17), Einschränkung der Verarbeitung (Art. 18) und Datenübertragbarkeit (Art. 20). Du kannst einer Verarbeitung auf Grundlage berechtigter Interessen widersprechen (Art. 21) und eine Einwilligung jederzeit widerrufen (Art. 7 Abs. 3). Du kannst dich bei einer Aufsichtsbehörde beschweren (Art. 77), zum Beispiel beim Bayerischen Landesamt für Datenschutzaufsicht, Promenade 18, 91522 Ansbach.' }],
      },
      { h: 'Änderungen', blocks: [{ p: 'Wir passen diesen Hinweis an, wenn sich etwas ändert. Stand: 24. November 2026.' }] },
    ],
  },
  appPrivacy: {
    title: 'Datenschutz in der App',
    description: 'Wie bleib und die Browser-Erweiterung mit deinem Gedächtnis umgehen.',
    intro: ['Nur du kannst dein Gedächtnis lesen. bleib ist in Entwicklung. App und Erweiterung kommen ohne bleib-Konto, Telemetrie, Nutzungsanalyse und automatische Absturzberichte aus.'],
    sections: [
      {
        h: 'Was die Erweiterung liest',
        blocks: [
          { p: 'Auf erkannten Seiten von chatgpt.com, claude.ai und gemini.google.com prüft bleib, was du in den Entwurf schreibst. So findet es passende Notizen und erkennt Vorlieben, die es speichern kann. Beim Import liest es sichtbare Einträge auf der Gedächtnisseite des Anbieters und legt sie dir mit ihrer Herkunft zur Prüfung vor.' },
          { p: 'Die Erweiterung speichert ihre Einstellungen und widerrufbare Zugangsdaten in deinem Browserprofil. Sie verbindet sich über eine lokale Browserschnittstelle namens Native Messaging mit der Desktop-App.' },
        ],
      },
      {
        h: 'Was die App auf deinem Gerät speichert',
        blocks: [
          { list: [
            'Deine Notizen und Einträge zur Prüfung, jeweils mit ihrer Herkunft.',
            'Berechtigungen und Regeln, Angaben zu verbundenen KIs und Belege für Freigaben.',
          ] },
          { p: 'bleib verschlüsselt diese Daten auf deinem Gerät. Auch Fragen und Zweckangaben verbundener KI-Tools, importierte Dateien und eingefügten Text verarbeitet bleib lokal.' },
        ],
      },
      {
        h: 'Was KI-Anbieter sehen können',
        blocks: [
          { p: 'bleib wählt auf deinem Gerät nur das Nötige aus und speichert vor jeder Freigabe einen Beleg. Sobald bleib Text in einen Entwurf einfügt, kann die Website ihn lesen. Mit „Rückgängig“ kannst du den Text aus dem Entwurf entfernen. Die Website kann ihn dann schon gesehen haben. Für erhaltene Daten gilt die Datenschutzerklärung des jeweiligen Anbieters.' },
          { p: 'Ein installiertes KI-Tool kann erhaltene Angaben an seinen Modellanbieter weitergeben. Wenn du Modellanfragen über bleib weiterleitest, sendet bleib die Anfrage und freigegebene Auszüge an das von dir eingestellte Ziel.' },
        ],
      },
      {
        h: 'Deine Daten verwalten',
        blocks: [{ p: 'Du kannst Notizen verwalten und KI-Verbindungen in bleib trennen. Du kannst die Erweiterung entfernen und den lokalen Datenordner von bleib löschen. Für Kopien, die ein KI-Anbieter bereits hat, nutze die Einstellungen dieses Anbieters.' }],
      },
      {
        h: 'Kontakt',
        blocks: [{ p: 'Schreib bei Fragen zur App an hello@rouxdutoit.com. Stand 24. November 2026.' }],
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
      { h: 'Verantwortlich für den Inhalt', blocks: [{ p: 'Nach § 18 Abs. 2 MStV.' }, { address: OPERATOR_DE }] },
      { h: 'Über bleib', blocks: [{ p: 'bleib ist kostenlos, quelloffen und in Entwicklung. Die App steht unter AGPL-3.0-or-later. Dateiformat, Spezifikation und SDK stehen unter Apache-2.0.' }] },
    ],
  },
};

export const docs: Record<Lang, Docs> = { en, de };
