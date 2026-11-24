export type Lang = 'en' | 'de';

/**
 * The public repository doesn't exist yet. Until it does, "GitHub" links go to the
 * Developers page. Set this to the repository URL once it is public.
 */
export const GITHUB_URL: string = 'https://github.com/rouxdutoit/bleib';

export const routes = {
  home: { en: '/', de: '/de/' },
  how: { en: '/how-it-works/', de: '/de/so-funktionierts/' },
  developers: { en: '/developers/', de: '/de/entwickler/' },
  pricing: { en: '/pricing/', de: '/de/preise/' },
  privacy: { en: '/privacy/', de: '/de/datenschutz/' },
  impressum: { en: '/impressum/', de: '/de/impressum/' },
  appPrivacy: { en: '/privacy/app/', de: '/de/datenschutz/app/' },
  works: { en: '/works-with/', de: '/de/kompatibilitaet/' },
  permissions: { en: '/permissions/', de: '/de/berechtigungen/' },
  receipts: { en: '/receipts/', de: '/de/belege/' },
  standards: { en: '/standards/', de: '/de/standards/' },
  security: { en: '/security/', de: '/de/sicherheit/' },
} as const;

export type RouteKey = keyof typeof routes;

const en = {
  meta: {
    title: 'bleib: your AI memory, in your hands',
    description:
      'bleib keeps one memory for all your AIs, encrypted on your device. You decide what each AI may see, and you can always check what it saw. Free and open source.',
  },
  skip: 'Skip to content',
  nav: {
    home: 'bleib home',
    github: 'GitHub',
    early: 'Get early access',
    how: 'How it works',
    security: 'Security',
    developers: 'Developers',
    pricing: 'Pricing',
    more: 'Learn more',
    langSwitch: 'Deutsch',
    langSwitchLabel: 'Diese Seite auf Deutsch',
    menu: 'Menu',
    themeToDark: 'Switch to dark mode',
    themeToLight: 'Switch to light mode',
  },
  hero: {
    eyebrow: 'In development',
    h1a: 'Your AI memory.',
    h1b: 'In your hands.',
    sub: ['Stop repeating yourself to every AI.', 'A password manager, for your preferences.', 'Each AI sees only what it needs.'],
    primary: 'Get early access',
    secondary: 'View on GitHub',
    trust: [
      { icon: 'lock', t: 'Encrypted on your device' },
      { icon: 'code', t: 'Open source' },
      { icon: 'savings', t: 'Free, for good' },
    ],
  },
  preview: {
    file: 'bleib · Your wallet',
    title: 'What your AI saw',
    rows: [
      { who: 'Claude', where: 'Anthropic', when: 'Today 14:32', icon: '/providers/claude.svg', saw: ['Prefers aisle seats', 'Hotels under €250 a night'] },
      { who: 'Codex', where: 'OpenAI', when: 'Mon 09:10', icon: '/providers/codex.svg', saw: ['Weekly review on Fridays'] },
      { who: 'Ollama', where: 'On this device', when: 'Sun 18:45', icon: '/providers/ollama.svg', saw: ['Dinner with Marek'] },
    ],
    footer: 'Nothing about your health left this device.',
  },
  story: {
    label: 'How bleib works',
    scenes: [
      {
        h: ['Your memory.', 'In one place.'],
        p: 'People, preferences and rules your AIs need, in plain text you can read and correct. Encrypted on your device.',
        more: { to: 'how', hash: '#wallet' },
      },
      {
        h: ['Asked only', 'when it matters.'],
        p: 'Everyday things flow on their own. For anything sensitive, like your health, bleib asks first.',
        more: { to: 'permissions', hash: '' },
      },
      {
        h: ['See exactly what', 'each AI saw.'],
        p: 'Every share leaves a receipt: which AI, where it went, for what, and the exact words.',
        more: { to: 'receipts', hash: '' },
      },
      {
        h: ['Switch AI.', 'No starting over.'],
        p: 'Your preferences and rules stay in bleib. A new AI gets what you allow from the first message.',
        more: { to: 'works', hash: '' },
      },
      {
        h: ['Your AI suggests.', 'You decide.'],
        p: 'AIs can propose what to remember. Nothing is saved until you say so.',
        more: { to: 'how', hash: '#proposals' },
      },
    ],
  },
  cards: {
    wallet: {
      title: 'Your Wallet',
      rows: [
        { k: 'People', v: 'Marek, Berlin', icon: 'person' },
        { k: 'Travel', v: 'Aisle seat', icon: 'flight' },
        { k: 'Work', v: 'Friday review', icon: 'work' },
        { k: 'Health', v: 'Private', icon: 'favorite', locked: true },
      ],
      sourcesLabel: 'Scattered across your AIs',
      sources: [
        { from: 'Notes', text: 'Marek, Berlin' },
        { from: 'ChatGPT', text: 'Aisle seat' },
        { from: 'Claude', text: 'Weekly review' },
        { from: 'Notes', text: 'Health notes' },
      ],
      footer: 'Encrypted on this device. Only you hold the key.',
    },
    ask: {
      title: 'Share your health notes with Claude?',
      message: 'For your running plan. Health is sensitive, so bleib asks first.',
      action: 'Allow Once',
      rulesLabel: 'Shared automatically',
      rule: { who: 'Claude', kind: 'Travel', scope: 'Automatic' },
      later: { title: 'Claude used Travel', sub: 'Hotels in Porto · No question needed' },
    },
    receipt: {
      who: 'Claude',
      where: 'Anthropic · hosted',
      time: '14:32',
      purposeLabel: 'For',
      purpose: 'Lisbon trip',
      sharedLabel: 'Shared',
      shared: ['Prefers aisle seats', 'Hotels under €250 a night'],
      notShared: 'Not shared: Health, People',
      weeklyLabel: 'This Week',
      weeklyN: '11',
      weeklyText: 'facts shared with 3 AIs',
      weeklyNote: 'No health data left this device.',
    },
    any: {
      title: 'Your Wallet',
      sub: 'Travel, Work, People · 2 rules',
      usedBy: 'Now used by',
      providers: [
        { name: 'Claude', icon: '/providers/claude.svg', color: '/providers/claude-color.svg' },
        { name: 'Codex', icon: '/providers/codex.svg', color: '/providers/codex-color.svg' },
        { name: 'Gemini', icon: '/providers/gemini.svg', color: '/providers/gemini-color.svg' },
        { name: 'Perplexity', icon: '/providers/perplexity.svg', color: '/providers/perplexity-color.svg' },
        { name: 'DeepSeek', icon: '/providers/deepseek.svg', color: '/providers/deepseek-color.svg' },
        { name: 'GLM', icon: '/providers/zhipu.svg', color: '/providers/zhipu-color.svg' },
        { name: 'Ollama', icon: '/providers/ollama.svg', color: '' },
      ],
      caption: 'Different AI. Same preferences and rules.',
    },
    propose: {
      app: 'Claude',
      time: 'now',
      title: 'Remember this?',
      fact: 'Marek is vegetarian.',
      why: 'He mentioned it while you planned dinner.',
      save: 'Save',
      walletLabel: 'Your Wallet',
      newRow: { k: 'People', v: 'Marek is vegetarian' },
      newTag: 'New',
      saved: 'Saved. No AI can read it until you allow it.',
    },
  },
  finale: {
    prompt: { site: 'claude.ai', said: 'I always book an aisle seat.', title: 'Save to bleib?', fact: 'Prefers aisle seats', notNow: 'Not Now', save: 'Save', saved: 'Saved' },
    h: 'Tell it once.',
    p: 'Every AI gets what it needs. Nothing more.',
  },
  form: {
    label: 'Email address',
    submit: 'Get early access',
    sending: 'Sending…',
    success: "Thanks, you're on the list.",
    invalid: 'Please enter a valid email address.',
    rate: 'Too many tries. Please wait a minute and try again.',
    error: 'Something went wrong. Please try again.',
    note: 'We only email you about bleib. You can ask us to delete your address any time.',
    privacy: 'Privacy',
    honeypot: 'Leave this field empty',
  },
  footer: {
    cols: { product: 'Product', project: 'Project', legal: 'Legal' },
    fine: 'AGPL-3.0-or-later · Spec Apache-2.0 · No cookies or analytics',
    email: 'Email',
    links: {
      how: 'How it works',
      works: 'Works with',
      permissions: 'Permissions',
      receipts: 'Receipts',
      standards: 'Standards',
      security: 'Security',
      developers: 'Developers',
      pricing: 'Pricing',
      privacy: 'Privacy',
      appPrivacy: 'App privacy',
      impressum: 'Legal notice',
      github: 'GitHub',
    },
  },
};

export type Strings = typeof en;

const de: Strings = {
  meta: {
    title: 'bleib: dein KI-Gedächtnis, in deiner Hand',
    description:
      'bleib hält ein Gedächtnis für all deine KIs, verschlüsselt auf deinem Gerät. Du entscheidest, was jede KI sehen darf, und kannst jederzeit nachsehen, was sie gesehen hat. Kostenlos und Open Source.',
  },
  skip: 'Zum Inhalt springen',
  nav: {
    home: 'bleib Startseite',
    github: 'GitHub',
    early: 'Frühen Zugang sichern',
    how: 'So funktioniert’s',
    security: 'Sicherheit',
    developers: 'Entwickler',
    pricing: 'Preise',
    more: 'Mehr erfahren',
    langSwitch: 'English',
    langSwitchLabel: 'This page in English',
    menu: 'Menü',
    themeToDark: 'Dunkles Design einschalten',
    themeToLight: 'Helles Design einschalten',
  },
  hero: {
    eyebrow: 'In Entwicklung',
    h1a: 'Dein KI-Gedächtnis.',
    h1b: 'In deiner Hand.',
    sub: ['Schluss damit, jeder KI alles neu zu erzählen.', 'Ein Passwort-Manager für deine Vorlieben.', 'Jede KI sieht nur, was sie braucht.'],
    primary: 'Frühen Zugang sichern',
    secondary: 'Auf GitHub ansehen',
    trust: [
      { icon: 'lock', t: 'Verschlüsselt auf deinem Gerät' },
      { icon: 'code', t: 'Open Source' },
      { icon: 'savings', t: 'Dauerhaft kostenlos' },
    ],
  },
  preview: {
    file: 'bleib · Deine Wallet',
    title: 'Was deine KI gesehen hat',
    rows: [
      { who: 'Claude', where: 'Anthropic', when: 'Heute 14:32', icon: '/providers/claude.svg', saw: ['Bevorzugt Gangplätze', 'Hotels unter 250 € pro Nacht'] },
      { who: 'Codex', where: 'OpenAI', when: 'Mo 09:10', icon: '/providers/codex.svg', saw: ['Wöchentliches Review am Freitag'] },
      { who: 'Ollama', where: 'Auf diesem Gerät', when: 'So 18:45', icon: '/providers/ollama.svg', saw: ['Abendessen mit Marek'] },
    ],
    footer: 'Nichts über deine Gesundheit hat dieses Gerät verlassen.',
  },
  story: {
    label: 'So funktioniert bleib',
    scenes: [
      {
        h: ['Dein Gedächtnis.', 'An einem Ort.'],
        p: 'Menschen, Vorlieben und Regeln, die deine KIs brauchen, als Klartext, den du lesen und korrigieren kannst. Verschlüsselt auf deinem Gerät.',
        more: { to: 'how', hash: '#wallet' },
      },
      {
        h: ['Gefragt nur,', 'wenn es zählt.'],
        p: 'Alltägliches läuft von selbst. Bei Sensiblem, etwa deiner Gesundheit, fragt bleib vorher.',
        more: { to: 'permissions', hash: '' },
      },
      {
        h: ['Sieh genau, was', 'jede KI gesehen hat.'],
        p: 'Jede Weitergabe hinterlässt einen Beleg: welche KI, wohin, wofür und der genaue Wortlaut.',
        more: { to: 'receipts', hash: '' },
      },
      {
        h: ['KI wechseln.', 'Nicht von vorn anfangen.'],
        p: 'Deine Vorlieben und Regeln bleiben in bleib. Eine neue KI bekommt ab der ersten Nachricht, was du erlaubst.',
        more: { to: 'works', hash: '' },
      },
      {
        h: ['Deine KI schlägt vor.', 'Du entscheidest.'],
        p: 'KIs können vorschlagen, was sie sich merken möchten. Gespeichert wird erst, wenn du zustimmst.',
        more: { to: 'how', hash: '#proposals' },
      },
    ],
  },
  cards: {
    wallet: {
      title: 'Deine Wallet',
      rows: [
        { k: 'Menschen', v: 'Marek, Berlin', icon: 'person' },
        { k: 'Reisen', v: 'Gangplatz', icon: 'flight' },
        { k: 'Arbeit', v: 'Rückblick am Freitag', icon: 'work' },
        { k: 'Gesundheit', v: 'Privat', icon: 'favorite', locked: true },
      ],
      sourcesLabel: 'Verstreut über deine KIs',
      sources: [
        { from: 'Notizen', text: 'Marek, Berlin' },
        { from: 'ChatGPT', text: 'Gangplatz' },
        { from: 'Claude', text: 'Wochenrückblick' },
        { from: 'Notizen', text: 'Gesundheitsnotizen' },
      ],
      footer: 'Verschlüsselt auf diesem Gerät. Nur du hast den Schlüssel.',
    },
    ask: {
      title: 'Gesundheitsnotizen mit Claude teilen?',
      message: 'Für deinen Laufplan. Gesundheit ist sensibel, darum fragt bleib vorher.',
      action: 'Einmal erlauben',
      rulesLabel: 'Automatisch geteilt',
      rule: { who: 'Claude', kind: 'Reisen', scope: 'Automatisch' },
      later: { title: 'Claude hat Reisen genutzt', sub: 'Hotels in Porto · Keine Nachfrage nötig' },
    },
    receipt: {
      who: 'Claude',
      where: 'Anthropic · gehostet',
      time: '14:32',
      purposeLabel: 'Für',
      purpose: 'Reise nach Lissabon',
      sharedLabel: 'Geteilt',
      shared: ['Bevorzugt Gangplätze', 'Hotels unter 250 € pro Nacht'],
      notShared: 'Nicht geteilt: Gesundheit, Menschen',
      weeklyLabel: 'Diese Woche',
      weeklyN: '11',
      weeklyText: 'Fakten an 3 KIs geteilt',
      weeklyNote: 'Keine Gesundheitsdaten haben dieses Gerät verlassen.',
    },
    any: {
      title: 'Deine Wallet',
      sub: 'Reisen, Arbeit, Menschen · 2 Regeln',
      usedBy: 'Gerade genutzt von',
      providers: [
        { name: 'Claude', icon: '/providers/claude.svg', color: '/providers/claude-color.svg' },
        { name: 'Codex', icon: '/providers/codex.svg', color: '/providers/codex-color.svg' },
        { name: 'Gemini', icon: '/providers/gemini.svg', color: '/providers/gemini-color.svg' },
        { name: 'Perplexity', icon: '/providers/perplexity.svg', color: '/providers/perplexity-color.svg' },
        { name: 'DeepSeek', icon: '/providers/deepseek.svg', color: '/providers/deepseek-color.svg' },
        { name: 'GLM', icon: '/providers/zhipu.svg', color: '/providers/zhipu-color.svg' },
        { name: 'Ollama', icon: '/providers/ollama.svg', color: '' },
      ],
      caption: 'Andere KI. Gleiche Vorlieben und Regeln.',
    },
    propose: {
      app: 'Claude',
      time: 'jetzt',
      title: 'Merken?',
      fact: 'Marek ist Vegetarier.',
      why: 'Er hat es erwähnt, als ihr das Abendessen geplant habt.',
      save: 'Speichern',
      walletLabel: 'Deine Wallet',
      newRow: { k: 'Menschen', v: 'Marek ist Vegetarier' },
      newTag: 'Neu',
      saved: 'Gespeichert. Keine KI kann es lesen, bis du es erlaubst.',
    },
  },
  finale: {
    prompt: { site: 'claude.ai', said: 'Ich buche immer einen Gangplatz.', title: 'In bleib sichern?', fact: 'Bevorzugt Gangplätze', notNow: 'Nicht jetzt', save: 'Sichern', saved: 'Gesichert' },
    h: 'Einmal sagen.',
    p: 'Jede KI bekommt, was sie braucht. Mehr nicht.',
  },
  form: {
    label: 'E-Mail-Adresse',
    submit: 'Frühen Zugang sichern',
    sending: 'Wird gesendet…',
    success: 'Danke, du stehst auf der Liste.',
    invalid: 'Bitte gib eine gültige E-Mail-Adresse ein.',
    rate: 'Zu viele Versuche. Bitte warte eine Minute und versuch es dann erneut.',
    error: 'Etwas ist schiefgelaufen. Bitte versuch es noch einmal.',
    note: 'Wir schreiben dir nur zu bleib. Du kannst jederzeit verlangen, dass wir deine Adresse löschen.',
    privacy: 'Datenschutz',
    honeypot: 'Dieses Feld leer lassen',
  },
  footer: {
    cols: { product: 'Produkt', project: 'Projekt', legal: 'Rechtliches' },
    fine: 'AGPL-3.0-or-later · Spezifikation Apache-2.0 · Keine Cookies, keine Analyse',
    email: 'E-Mail',
    links: {
      how: 'So funktioniert’s',
      works: 'Kompatibilität',
      permissions: 'Berechtigungen',
      receipts: 'Belege',
      standards: 'Standards',
      security: 'Sicherheit',
      developers: 'Entwickler',
      pricing: 'Preise',
      privacy: 'Datenschutz',
      appPrivacy: 'Datenschutz in der App',
      impressum: 'Impressum',
      github: 'GitHub',
    },
  },
};

export const strings: Record<Lang, Strings> = { en, de };

export function t(lang: Lang): Strings {
  return strings[lang];
}

export function otherLang(lang: Lang): Lang {
  return lang === 'en' ? 'de' : 'en';
}
