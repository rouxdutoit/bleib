import type { Lang, RouteKey } from './strings';

/** A block of prose on a subpage. `code` renders as a command line, `list` as bullets. */
export type Block =
  | { p: string }
  | { list: string[] }
  | { code: string }
  | { address: string[] };

export interface Section {
  h: string;
  blocks: Block[];
}

export interface DocPage {
  title: string;
  description: string;
  intro: string;
  sections: Section[];
}

type Docs = Record<Exclude<RouteKey, 'home'>, DocPage>;

const OPERATOR = ['Ruan “Roux” du Toit', 'Emeranstraße 23', '85622 Feldkirchen', 'Germany'];
const OPERATOR_DE = ['Ruan „Roux“ du Toit', 'Emeranstraße 23', '85622 Feldkirchen', 'Deutschland'];

const en: Docs = {
  how: {
    title: 'How it works',
    description: 'How bleib keeps your AI context encrypted, asks before sharing, and gives you a receipt every time.',
    intro: 'bleib sits between you and the AIs you use. They get what a task needs, when you allow it, and you can always see what they were given.',
    sections: [
      {
        h: 'Your wallet',
        blocks: [
          { p: 'Everything your AIs should know about you lives in one folder on your device: people, preferences, projects and rules. It is plain text you can read and correct, encrypted with a key only you hold.' },
        ],
      },
      {
        h: 'One door for every AI',
        blocks: [
          { p: 'AIs connect to bleib through one door on your device. Each AI is paired once with a short code and gets its own key, so nothing can pretend to be another app.' },
          { p: 'An AI asks for what a task needs and gets the smallest useful answer, not your files.' },
        ],
      },
      {
        h: 'Asked once, remembered',
        blocks: [
          { p: 'The first time an AI needs a new kind of information, bleib asks you: allow once, always for this AI, or no. It shows exactly what would be shared and where it goes, for example to a model on your device or to a company’s servers.' },
          { p: 'Your answer becomes a rule. bleib only asks again if the AI, the kind of information or the destination changes. Health, money and other people’s private details are asked about each time unless you decide otherwise.' },
        ],
      },
      {
        h: 'A receipt for every share',
        blocks: [
          { p: 'Before anything is shared, bleib writes a receipt: which AI, which company or device received it, for what, the exact words, and when. Each week you get a plain summary of what your AIs saw.' },
        ],
      },
      {
        h: 'AIs suggest, you decide',
        blocks: [
          { p: 'AIs can propose new things to remember. Nothing is saved until you approve it, and approving a memory never lets an AI read it.' },
        ],
      },
      {
        h: 'If you lose a device',
        blocks: [
          { p: 'Before bleib stores anything, it helps you set up recovery: a printed recovery kit first, and later linking another device or using a passkey. We never hold a key that can read your data.' },
        ],
      },
      {
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
  developers: {
    title: 'Developers',
    description: 'bleib for developers: a local MCP door, open formats and receipts you can check.',
    intro: 'bleib is in development and will be open source. This page describes what we are building, so you can tell us what you need.',
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
              'Memory is Markdown with frontmatter, compatible with OpenClaw and Hermes workspace files (USER.md, MEMORY.md, daily notes).',
              'Permissions and logs follow the Human Context Protocol (HCP) from the Loyal Agents project, with destination and exact-content receipts added.',
              'Receipts align with ISO/IEC 27560 consent records and the W3C Data Privacy Vocabulary.',
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
        h: 'Get involved',
        blocks: [
          { p: 'The repository will open on GitHub soon. Until then, write to hello@rouxdutoit.com, or join early access on the home page.' },
        ],
      },
    ],
  },
  pricing: {
    title: 'Pricing',
    description: 'bleib is free and open source. You pay only for convenience.',
    intro: 'Free for everything that keeps your data yours. You pay only if you want us to make it more convenient.',
    sections: [
      {
        h: 'Free, for good',
        blocks: [
          { p: 'The wallet, every AI connection, permissions, receipts, importers, the recovery kit, syncing through your own cloud, and running it all yourself. Free and open source.' },
        ],
      },
      {
        h: 'Convenience (later)',
        blocks: [
          { p: 'Hosted, end-to-end encrypted sync and backup, with passkey recovery. We store only scrambled data we cannot read.' },
        ],
      },
      {
        h: 'Organisations (later)',
        blocks: [
          { p: 'Separate work and personal parts with separate keys, recovery of the work part by an administrator, and support.' },
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
    intro: 'This notice covers this website. bleib itself runs on your device and sends us nothing.',
    sections: [
      { h: 'Cookies', blocks: [{ p: 'None. If you switch between light and dark mode, your browser remembers the choice in its local storage. Nothing about it is sent to us.' }] },
      { h: 'Analytics and tracking', blocks: [{ p: 'None.' }] },
      { h: 'Third-party requests', blocks: [{ p: 'None. Fonts and files are served with this site.' }] },
      { h: 'Data processed', blocks: [{ p: 'Your IP address and technical request data when the site is delivered.' }] },
      {
        h: 'Early access',
        blocks: [
          { p: 'If you join early access, we store your email address, your language and the time you signed up, to tell you when bleib is available. The legal basis is your consent, Article 6(1)(a) GDPR. You can withdraw it at any time by writing to hello@rouxdutoit.com, and we delete your entry.' },
        ],
      },
      {
        h: 'Hosting',
        blocks: [
          { p: 'This site and the early-access list are hosted by Cloudflare, Inc., 101 Townsend St, San Francisco, CA 94107, USA. When you open a page, Cloudflare receives your IP address and technical request details to deliver the page and protect the site from attacks. We have a data processing agreement with Cloudflare under Article 28 GDPR. Transfers to the USA are covered by the EU-US Data Privacy Framework, under which Cloudflare is certified, and by Standard Contractual Clauses. The legal basis is Article 6(1)(f) GDPR, our legitimate interest in operating a secure and functional site.' },
        ],
      },
      {
        h: 'Contact',
        blocks: [
          { p: 'If you email or call, we use your message and contact details to respond. The legal basis is Article 6(1)(b) GDPR for contract-related enquiries and Article 6(1)(f) GDPR for our legitimate interest in answering other enquiries. We delete the data when it is no longer needed, unless the law requires us to keep it longer.' },
        ],
      },
      { h: 'Controller', blocks: [{ address: [...OPERATOR, 'Email hello@rouxdutoit.com', 'Telephone +49 162 7850608'] }] },
      { h: 'Links to other sites', blocks: [{ p: 'If you follow a link to another site, its privacy policy applies there.' }] },
      {
        h: 'Your rights',
        blocks: [
          { p: 'Under the GDPR you can request access (Article 15), rectification (Article 16), erasure (Article 17), restriction of processing (Article 18) and data portability (Article 20). You can object to processing (Article 21) and lodge a complaint with a supervisory authority (Article 77), for example the Bayerisches Landesamt für Datenschutzaufsicht, Promenade 18, 91522 Ansbach, Germany.' },
        ],
      },
    ],
  },
  impressum: {
    title: 'Legal notice',
    description: 'Legal notice for the bleib website.',
    intro: 'Information under § 5 DDG.',
    sections: [
      { h: 'Operator', blocks: [{ address: OPERATOR }] },
      { h: 'Contact', blocks: [{ address: ['Email hello@rouxdutoit.com', 'Telephone +49 162 7850608'] }] },
      { h: 'Responsibility for content under § 18(2) MStV', blocks: [{ address: OPERATOR }] },
      { h: 'About this site', blocks: [{ p: 'This website describes bleib, a free and open source wallet for your AI context. bleib is in development.' }] },
    ],
  },
};

const de: Docs = {
  how: {
    title: 'So funktioniert’s',
    description: 'Wie bleib deinen KI-Kontext verschlüsselt, vor dem Teilen fragt und dir jedes Mal einen Beleg gibt.',
    intro: 'bleib sitzt zwischen dir und den KIs, die du nutzt. Sie bekommen, was eine Aufgabe braucht, wenn du es erlaubst, und du siehst jederzeit, was sie bekommen haben.',
    sections: [
      {
        h: 'Deine Wallet',
        blocks: [
          { p: 'Alles, was deine KIs über dich wissen sollen, liegt in einem Ordner auf deinem Gerät: Menschen, Vorlieben, Projekte und Regeln. Als Klartext, den du lesen und korrigieren kannst, verschlüsselt mit einem Schlüssel, den nur du hast.' },
        ],
      },
      {
        h: 'Eine Tür für jede KI',
        blocks: [
          { p: 'KIs verbinden sich über eine Tür auf deinem Gerät mit bleib. Jede KI wird einmal mit einem kurzen Code gekoppelt und bekommt ihren eigenen Schlüssel. So kann sich nichts als eine andere App ausgeben.' },
          { p: 'Eine KI fragt nach dem, was eine Aufgabe braucht, und bekommt die kleinste brauchbare Antwort, nicht deine Dateien.' },
        ],
      },
      {
        h: 'Einmal gefragt, gemerkt',
        blocks: [
          { p: 'Wenn eine KI zum ersten Mal eine neue Art von Information braucht, fragt bleib dich: einmal erlauben, immer für diese KI oder nein. Du siehst genau, was geteilt würde und wohin es geht, zum Beispiel an ein Modell auf deinem Gerät oder auf die Server eines Unternehmens.' },
          { p: 'Deine Antwort wird zur Regel. bleib fragt erst wieder, wenn sich die KI, die Art der Information oder das Ziel ändert. Bei Gesundheit, Geld und privaten Angaben über andere fragt bleib jedes Mal, außer du entscheidest anders.' },
        ],
      },
      {
        h: 'Ein Beleg für jede Weitergabe',
        blocks: [
          { p: 'Bevor etwas geteilt wird, schreibt bleib einen Beleg: welche KI, welches Unternehmen oder Gerät es bekommen hat, wofür, der genaue Wortlaut und wann. Jede Woche bekommst du eine verständliche Übersicht darüber, was deine KIs gesehen haben.' },
        ],
      },
      {
        h: 'KIs schlagen vor, du entscheidest',
        blocks: [
          { p: 'KIs können vorschlagen, was sie sich merken möchten. Gespeichert wird erst, wenn du zustimmst, und eine Zustimmung erlaubt keiner KI, es zu lesen.' },
        ],
      },
      {
        h: 'Wenn du ein Gerät verlierst',
        blocks: [
          { p: 'Bevor bleib etwas speichert, richtest du die Wiederherstellung ein: zuerst ein ausgedrucktes Wiederherstellungs-Kit, später auch über ein zweites Gerät oder einen Passkey. Wir haben nie einen Schlüssel, mit dem wir deine Daten lesen könnten.' },
        ],
      },
      {
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
  developers: {
    title: 'Entwickler',
    description: 'bleib für Entwickler: eine lokale MCP-Tür, offene Formate und überprüfbare Belege.',
    intro: 'bleib ist in Entwicklung und wird Open Source. Hier steht, was wir bauen, damit du uns sagen kannst, was du brauchst.',
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
              'Erinnerungen sind Markdown mit Frontmatter, kompatibel mit den Workspace-Dateien von OpenClaw und Hermes (USER.md, MEMORY.md, Tagesnotizen).',
              'Berechtigungen und Protokolle folgen dem Human Context Protocol (HCP) des Projekts Loyal Agents, ergänzt um Ziel und Belege mit dem genauen Inhalt.',
              'Belege orientieren sich an ISO/IEC 27560 und am W3C Data Privacy Vocabulary.',
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
        h: 'Mitmachen',
        blocks: [
          { p: 'Das Repository wird bald auf GitHub veröffentlicht. Bis dahin schreib an hello@rouxdutoit.com oder sichere dir auf der Startseite frühen Zugang.' },
        ],
      },
    ],
  },
  pricing: {
    title: 'Preise',
    description: 'bleib ist kostenlos und Open Source. Du zahlst nur für Komfort.',
    intro: 'Kostenlos für alles, was deine Daten zu deinen macht. Du zahlst nur, wenn wir es dir bequemer machen sollen.',
    sections: [
      {
        h: 'Kostenlos, dauerhaft',
        blocks: [
          { p: 'Die Wallet, jede KI-Verbindung, Berechtigungen, Belege, Importe, das Wiederherstellungs-Kit, Synchronisierung über deine eigene Cloud und der Betrieb auf eigener Hardware. Kostenlos und Open Source.' },
        ],
      },
      {
        h: 'Komfort (später)',
        blocks: [
          { p: 'Gehostete, Ende-zu-Ende-verschlüsselte Synchronisierung und Sicherung mit Wiederherstellung per Passkey. Wir speichern nur verschlüsselte Daten, die wir nicht lesen können.' },
        ],
      },
      {
        h: 'Organisationen (später)',
        blocks: [
          { p: 'Getrennte Bereiche für Arbeit und Privates mit eigenen Schlüsseln, Wiederherstellung des Arbeitsbereichs durch die Administration und Support.' },
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
    intro: 'Dieser Hinweis gilt für diese Website. bleib selbst läuft auf deinem Gerät und schickt uns nichts.',
    sections: [
      { h: 'Cookies', blocks: [{ p: 'Keine. Wenn du zwischen hellem und dunklem Design wechselst, merkt sich dein Browser die Wahl im lokalen Speicher. Davon wird nichts an uns gesendet.' }] },
      { h: 'Analyse und Tracking', blocks: [{ p: 'Keine.' }] },
      { h: 'Anfragen an Dritte', blocks: [{ p: 'Keine. Schriften und Dateien werden mit dieser Website ausgeliefert.' }] },
      { h: 'Verarbeitete Daten', blocks: [{ p: 'Deine IP-Adresse und technische Anfragedaten, wenn die Website ausgeliefert wird.' }] },
      {
        h: 'Früher Zugang',
        blocks: [
          { p: 'Wenn du dich für frühen Zugang einträgst, speichern wir deine E-Mail-Adresse, deine Sprache und den Zeitpunkt der Anmeldung, um dir Bescheid zu geben, sobald bleib verfügbar ist. Rechtsgrundlage ist deine Einwilligung nach Art. 6 Abs. 1 lit. a DSGVO. Du kannst sie jederzeit per E-Mail an hello@rouxdutoit.com widerrufen; dann löschen wir deinen Eintrag.' },
        ],
      },
      {
        h: 'Hosting',
        blocks: [
          { p: 'Diese Website und die Liste für frühen Zugang werden von Cloudflare, Inc., 101 Townsend St, San Francisco, CA 94107, USA, gehostet. Wenn du eine Seite öffnest, erhält Cloudflare deine IP-Adresse und technische Anfragedaten, um die Seite auszuliefern und die Website vor Angriffen zu schützen. Mit Cloudflare besteht ein Vertrag zur Auftragsverarbeitung nach Art. 28 DSGVO. Übermittlungen in die USA sind durch das EU-US Data Privacy Framework, unter dem Cloudflare zertifiziert ist, und durch Standardvertragsklauseln abgesichert. Rechtsgrundlage ist Art. 6 Abs. 1 lit. f DSGVO, unser berechtigtes Interesse am sicheren und funktionsfähigen Betrieb der Website.' },
        ],
      },
      {
        h: 'Kontakt',
        blocks: [
          { p: 'Wenn du uns schreibst oder anrufst, nutzen wir deine Nachricht und Kontaktdaten, um dir zu antworten. Rechtsgrundlage ist Art. 6 Abs. 1 lit. b DSGVO bei vertragsbezogenen Anfragen und Art. 6 Abs. 1 lit. f DSGVO für unser berechtigtes Interesse an der Beantwortung sonstiger Anfragen. Wir löschen die Daten, sobald sie nicht mehr benötigt werden, sofern keine gesetzlichen Aufbewahrungspflichten bestehen.' },
        ],
      },
      { h: 'Verantwortlicher', blocks: [{ address: [...OPERATOR_DE, 'E-Mail hello@rouxdutoit.com', 'Telefon +49 162 7850608'] }] },
      { h: 'Links zu anderen Websites', blocks: [{ p: 'Wenn du einem Link zu einer anderen Website folgst, gilt dort deren Datenschutzerklärung.' }] },
      {
        h: 'Deine Rechte',
        blocks: [
          { p: 'Nach der DSGVO hast du das Recht auf Auskunft (Art. 15), Berichtigung (Art. 16), Löschung (Art. 17), Einschränkung der Verarbeitung (Art. 18) und Datenübertragbarkeit (Art. 20). Du kannst der Verarbeitung widersprechen (Art. 21) und dich bei einer Aufsichtsbehörde beschweren (Art. 77), zum Beispiel beim Bayerischen Landesamt für Datenschutzaufsicht, Promenade 18, 91522 Ansbach.' },
        ],
      },
    ],
  },
  impressum: {
    title: 'Impressum',
    description: 'Impressum der Website von bleib.',
    intro: 'Angaben gemäß § 5 DDG.',
    sections: [
      { h: 'Anbieter', blocks: [{ address: OPERATOR_DE }] },
      { h: 'Kontakt', blocks: [{ address: ['E-Mail hello@rouxdutoit.com', 'Telefon +49 162 7850608'] }] },
      { h: 'Verantwortlich für den Inhalt nach § 18 Abs. 2 MStV', blocks: [{ address: OPERATOR_DE }] },
      { h: 'Über diese Website', blocks: [{ p: 'Diese Website beschreibt bleib, eine kostenlose Open-Source-Wallet für deinen KI-Kontext. bleib ist in Entwicklung.' }] },
    ],
  },
};

export const docs: Record<Lang, Docs> = { en, de };
