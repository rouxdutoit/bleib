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
    title: 'bleib: your AI memory wallet',
    description:
      'bleib is your AI memory wallet, encrypted on your device. You decide what each AI can know, and you can always check what it saw. Free and open source.',
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
    langSwitch: 'Deutsch',
    langSwitchLabel: 'Diese Seite auf Deutsch',
    menu: 'Menu',
    themeToDark: 'Switch to dark mode',
    themeToLight: 'Switch to light mode',
  },
  hero: {
    eyebrow: 'In development',
    h1: 'Your AI memory wallet.',
    sub: ['Each task gets just what it needs.'],
    primary: 'Get early access',
    secondary: 'View on GitHub',
    trust: [
      { icon: 'lock', t: 'Encrypted on your device' },
      { icon: 'code', t: 'Open source' },
      { icon: 'savings', t: 'Free, for good' },
    ],
  },
  preview: {
    examples: 'Examples',
    title: 'Share only what {ai} needs',
    add: 'Add',
    added: 'Added',
    attachment: 'About me',
    tabs: [
      {
        ai: 'Gemini', icon: 'gemini-color', typed: 'Plan a weekend in Lisbon for me.',
        facts: [{ t: 'Aisle seat', icon: 'airline_seat' }, { t: 'Vegetarian', icon: 'eco' }], private: 'Health and work stay private.',
      },
      {
        ai: 'Claude', icon: 'claude-color', typed: 'Write a cover letter for this job.',
        facts: [{ t: 'Product designer', icon: 'work' }, { t: 'Berlin', icon: 'location_on' }], private: 'Health and money stay private.',
      },
      {
        ai: 'ChatGPT', icon: 'openai', typed: 'What should I cook tonight?',
        facts: [{ t: 'Vegetarian', icon: 'eco' }, { t: 'Cooks for two', icon: 'group' }], private: 'Work and travel stay private.',
      },
    ],
  },
  story: {
    label: 'How bleib works',
    scenes: [
      {
        h: ['Control what AI', 'knows about you.'],
        p: "Bring over what your AIs remember. Now it's all in one place, and all yours.",
        more: { to: 'how', hash: '#memory', label: 'One memory, every AI' },
      },
      {
        h: ['It remembers', 'as you chat.'],
        p: 'Mention a preference, and it’s saved. One tap undoes it. Anything sensitive asks first.',
        more: { to: 'how', hash: '#proposals', label: 'Saves as you go' },
      },
      {
        h: ['Switch AI.', 'Keep everything.'],
        p: 'Your preferences come with you. A new AI gets them after your yes.',
        more: { to: 'works', hash: '', label: 'Works with your AI' },
      },
      {
        h: ['It only asks', 'when it matters.'],
        p: 'Everyday things just work. Health and money always need your yes.',
        more: { to: 'permissions', hash: '', label: 'You decide what’s shared' },
      },
      {
        h: ['Know exactly what', 'each AI was told.'],
        p: 'Every share leaves a receipt. You always know which AI got what.',
        more: { to: 'receipts', hash: '', label: 'A receipt for every share' },
      },
      {
        h: ['Turn their memory off.', 'bleib keeps yours.'],
        p: 'Remember as much as you like. Each chat gets just what it needs. Only you hold the key.',
        more: { to: 'security', hash: '', label: 'Private by design' },
        dark: true,
      },
    ],
  },
  cards: {
    wallet: {
      title: 'Your Memory',
      rows: [
        { k: 'People', v: 'Marek, Berlin', icon: 'person' },
        { k: 'Travel', v: 'Aisle seat', icon: 'flight' },
        { k: 'Work', v: 'Friday review', icon: 'work' },
        { k: 'Health', v: 'Private', icon: 'favorite', locked: true },
      ],
      sourcesLabel: 'Scattered across your AIs',
      sources: [
        { from: 'ChatGPT', text: 'Marek, Berlin' },
        { from: 'Gemini', text: 'Aisle seat' },
        { from: 'Claude', text: 'Friday review' },
        { from: 'ChatGPT', text: 'Health notes' },
      ],
      footer: 'Encrypted on this device. Only you have access.',
    },
    ask: {
      title: 'Share your health notes with Claude?',
      message: 'For your running plan. Health is sensitive, so bleib asks first.',
      action: 'Allow Once',
      allowed: 'Allowed',
      later: { title: 'Claude used Travel', sub: 'Hotels in Porto', tag: 'Automatic' },
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
      weeklyNote: 'Health data stayed on this device.',
    },
    any: {
      usedBy: 'Now used by',
      providers: [
        { name: 'Claude', icon: '/providers/claude.svg', color: '/providers/claude-color.svg' },
        { name: 'Gemini', icon: '/providers/gemini.svg', color: '/providers/gemini-color.svg' },
        { name: 'ChatGPT', icon: '/providers/openai.svg', color: '' },
      ],
      caption: 'Different AI. Same memory.',
    },
    off: { setting: 'Memory', note: 'Switched off in each AI’s own settings.' },
    propose: {
      app: 'Claude',
      said: 'I like green tea.',
      title: 'Saved to bleib',
      fact: 'Likes green tea',
      undo: 'Undo',
      newTag: 'New',
      footer: 'Encrypted on this device.',
    },
  },
  finale: {
    prompt: { tab: 'Claude', said: 'I always book an aisle seat.', title: 'Save to bleib?', fact: 'Prefers aisle seats', save: 'Save', saved: 'Saved' },
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
    dictionary: { language: 'German', pronounced: 'pronounced', meaning: 'stay; remain.' },
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
    title: 'bleib: dein Wallet für dein KI-Gedächtnis',
    description:
      'bleib ist dein Wallet für dein KI-Gedächtnis, verschlüsselt auf deinem Gerät. Du entscheidest, was jede KI wissen darf, und kannst jederzeit nachsehen, was sie gesehen hat. Kostenlos und Open Source.',
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
    langSwitch: 'English',
    langSwitchLabel: 'This page in English',
    menu: 'Menü',
    themeToDark: 'Dunkles Design einschalten',
    themeToLight: 'Helles Design einschalten',
  },
  hero: {
    eyebrow: 'In Entwicklung',
    h1: 'Dein Wallet für dein KI-Gedächtnis.',
    sub: ['Jede Aufgabe bekommt nur, was sie braucht.'],
    primary: 'Frühen Zugang sichern',
    secondary: 'Auf GitHub ansehen',
    trust: [
      { icon: 'lock', t: 'Verschlüsselt auf deinem Gerät' },
      { icon: 'code', t: 'Open Source' },
      { icon: 'savings', t: 'Dauerhaft kostenlos' },
    ],
  },
  preview: {
    examples: 'Beispiele',
    title: 'Nur teilen, was {ai} braucht',
    add: 'Hinzufügen',
    added: 'Hinzugefügt',
    attachment: 'Über mich',
    tabs: [
      {
        ai: 'Gemini', icon: 'gemini-color', typed: 'Plane ein Wochenende in Lissabon für mich.',
        facts: [{ t: 'Gangplatz', icon: 'airline_seat' }, { t: 'Vegetarisch', icon: 'eco' }], private: 'Gesundheit und Arbeit bleiben privat.',
      },
      {
        ai: 'Claude', icon: 'claude-color', typed: 'Schreib ein Anschreiben für diese Stelle.',
        facts: [{ t: 'Produktdesign', icon: 'work' }, { t: 'Berlin', icon: 'location_on' }], private: 'Gesundheit und Finanzen bleiben privat.',
      },
      {
        ai: 'ChatGPT', icon: 'openai', typed: 'Was soll ich heute Abend kochen?',
        facts: [{ t: 'Vegetarisch', icon: 'eco' }, { t: 'Kocht für zwei', icon: 'group' }], private: 'Arbeit und Reisen bleiben privat.',
      },
    ],
  },
  story: {
    label: 'So funktioniert bleib',
    scenes: [
      {
        h: ['Bestimme, was die KI', 'über dich weiß.'],
        p: 'Hol dir, was sich deine KIs merken. Jetzt an einem Ort, und alles deins.',
        more: { to: 'how', hash: '#memory', label: 'Ein Gedächtnis, jede KI' },
      },
      {
        h: ['Du chattest.', 'bleib merkt es sich.'],
        p: 'bleib speichert Vorlieben aus dem Chat. Ein Tipp macht das rückgängig. Bei sensiblen Angaben fragt bleib vorher.',
        more: { to: 'how', hash: '#proposals', label: 'Speichert nebenbei' },
      },
      {
        h: ['Wechsle die KI.', 'Behalte alles.'],
        p: 'Deine Vorlieben kommen mit. Eine neue KI bekommt sie nach deinem Ja.',
        more: { to: 'works', hash: '', label: 'Funktioniert mit deiner KI' },
      },
      {
        h: ['bleib fragt,', 'wenn es darauf ankommt.'],
        p: 'Alltägliches läuft von selbst. Gesundheit und Geld brauchen dein Ja.',
        more: { to: 'permissions', hash: '', label: 'Du entscheidest, was geteilt wird' },
      },
      {
        h: ['Sieh genau, was', 'jede KI erfahren hat.'],
        p: 'Für jede Weitergabe gibt es einen Beleg. Du weißt immer, welche KI was bekam.',
        more: { to: 'receipts', hash: '', label: 'Ein Beleg für jede Weitergabe' },
      },
      {
        h: ['Schalte ihr Gedächtnis aus.', 'bleib behält deins.'],
        p: 'Merk dir so viel du willst. Jeder Chat bekommt nur, was er braucht. Den Schlüssel hast nur du.',
        more: { to: 'security', hash: '', label: 'Privat von Grund auf' },
        dark: true,
      },
    ],
  },
  cards: {
    wallet: {
      title: 'Dein Gedächtnis',
      rows: [
        { k: 'Menschen', v: 'Marek, Berlin', icon: 'person' },
        { k: 'Reisen', v: 'Gangplatz', icon: 'flight' },
        { k: 'Arbeit', v: 'Rückblick am Freitag', icon: 'work' },
        { k: 'Gesundheit', v: 'Privat', icon: 'favorite', locked: true },
      ],
      sourcesLabel: 'Verstreut über deine KIs',
      sources: [
        { from: 'ChatGPT', text: 'Marek, Berlin' },
        { from: 'Gemini', text: 'Gangplatz' },
        { from: 'Claude', text: 'Rückblick am Freitag' },
        { from: 'ChatGPT', text: 'Gesundheit' },
      ],
      footer: 'Verschlüsselt auf diesem Gerät. Nur du hast Zugriff.',
    },
    ask: {
      title: 'Gesundheitsnotizen mit Claude teilen?',
      message: 'Für deinen Laufplan. Gesundheit ist sensibel, darum fragt bleib vorher.',
      action: 'Einmal erlauben',
      allowed: 'Erlaubt',
      later: { title: 'Claude nutzte Reisen', sub: 'Hotels in Porto', tag: 'Automatisch' },
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
      weeklyNote: 'Gesundheitsdaten sind auf diesem Gerät geblieben.',
    },
    any: {
      usedBy: 'Gerade genutzt von',
      providers: [
        { name: 'Claude', icon: '/providers/claude.svg', color: '/providers/claude-color.svg' },
        { name: 'Gemini', icon: '/providers/gemini.svg', color: '/providers/gemini-color.svg' },
        { name: 'ChatGPT', icon: '/providers/openai.svg', color: '' },
      ],
      caption: 'Andere KI. Dasselbe Gedächtnis.',
    },
    off: { setting: 'Gedächtnis', note: 'In den Einstellungen jeder KI ausgeschaltet.' },
    propose: {
      app: 'Claude',
      said: 'Ich mag grünen Tee.',
      title: 'In bleib gespeichert',
      fact: 'Mag grünen Tee',
      undo: 'Rückgängig',
      newTag: 'Neu',
      footer: 'Auf diesem Gerät verschlüsselt.',
    },
  },
  finale: {
    prompt: { tab: 'Claude', said: 'Ich buche immer einen Gangplatz.', title: 'In bleib sichern?', fact: 'Bevorzugt Gangplätze', save: 'Sichern', saved: 'Gesichert' },
    h: 'Einmal sagen.',
    p: 'Jede KI bekommt, was sie braucht. Mehr nicht.',
  },
  form: {
    label: 'E-Mail-Adresse',
    submit: 'Eintragen',
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
    dictionary: { language: 'Deutsch', pronounced: 'Aussprache', meaning: 'Imperativ von „bleiben“.' },
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
