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
    sub: ['Every AI knows you from the first message.', 'A password manager, for your preferences.', 'Each AI sees only what it needs.'],
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
    title: 'bleib can add what {ai} needs',
    add: 'Add',
    added: 'Added',
    attachment: 'About me',
    tabs: [
      {
        ai: 'Gemini', icon: 'gemini-color', typed: 'Plan a weekend in Lisbon for me.',
        facts: ['Aisle seat', 'Vegetarian'], private: 'Health and work stay private.',
      },
      {
        ai: 'Claude', icon: 'claude-color', typed: 'Write a cover letter for this job.',
        facts: ['Product designer', 'Berlin'], private: 'Health and money stay private.',
      },
      {
        ai: 'ChatGPT', icon: 'openai', typed: 'What should I cook tonight?',
        facts: ['Vegetarian', 'Cooks for two'], private: 'Work and travel stay private.',
      },
    ],
  },
  story: {
    label: 'How bleib works',
    scenes: [
      {
        h: ['See what AI', 'knows about you.'],
        p: "bleib brings what your AIs remember into one place. Fix what's wrong, keep what's right.",
        more: { to: 'how', hash: '#memory' },
      },
      {
        h: ['It remembers', 'as you chat.'],
        p: 'Mention a preference in chat and bleib saves it. One tap undoes it. bleib asks before saving anything sensitive.',
        more: { to: 'how', hash: '#proposals' },
      },
      {
        h: ['Switch AI.', 'Keep everything.'],
        p: 'Your preferences and rules stay in bleib. bleib asks before sharing with a new AI.',
        more: { to: 'works', hash: '' },
      },
      {
        h: ['Asked only', 'when it matters.'],
        p: 'Everyday things just work. Health and money always need your yes.',
        more: { to: 'permissions', hash: '' },
      },
      {
        h: ['Know exactly what', 'each AI was told.'],
        p: 'Every share leaves a receipt, so you always know which AI got what.',
        more: { to: 'receipts', hash: '' },
      },
      {
        h: ['Let it know you.', 'Only you can read it.'],
        p: 'The more your AI knows, the better it helps. Your memory is locked with a key only you hold, so being known never costs you.',
        more: { to: 'security', hash: '' },
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
        { from: 'Notes', text: 'Marek, Berlin' },
        { from: 'ChatGPT', text: 'Aisle seat' },
        { from: 'Claude', text: 'Weekly review' },
        { from: 'Notes', text: 'Health notes' },
      ],
      footer: 'Encrypted on this device. Only you have access.',
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
      usedBy: 'Now used by',
      providers: [
        { name: 'Claude', icon: '/providers/claude.svg', color: '/providers/claude-color.svg' },
        { name: 'Gemini', icon: '/providers/gemini.svg', color: '/providers/gemini-color.svg' },
        { name: 'ChatGPT', icon: '/providers/openai.svg', color: '' },
      ],
      caption: 'Different AI. Same memory.',
    },
    sealed: { note: 'What anyone without your key sees. Us included.' },
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
    sub: ['Jede KI kennt dich ab der ersten Nachricht.', 'Ein Passwort-Manager für deine Vorlieben.', 'Jede KI sieht nur, was sie braucht.'],
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
    title: 'bleib kann ergänzen, was {ai} braucht',
    add: 'Hinzufügen',
    added: 'Hinzugefügt',
    attachment: 'Über mich',
    tabs: [
      {
        ai: 'Gemini', icon: 'gemini-color', typed: 'Plane ein Wochenende in Lissabon für mich.',
        facts: ['Gangplatz', 'Vegetarisch'], private: 'Gesundheit und Arbeit bleiben privat.',
      },
      {
        ai: 'Claude', icon: 'claude-color', typed: 'Schreib ein Anschreiben für diese Stelle.',
        facts: ['Produktdesign', 'Berlin'], private: 'Gesundheit und Finanzen bleiben privat.',
      },
      {
        ai: 'ChatGPT', icon: 'openai', typed: 'Was soll ich heute Abend kochen?',
        facts: ['Vegetarisch', 'Kocht für zwei'], private: 'Arbeit und Reisen bleiben privat.',
      },
    ],
  },
  story: {
    label: 'So funktioniert bleib',
    scenes: [
      {
        h: ['Sieh, was die KI', 'über dich weiß.'],
        p: 'bleib sammelt an einem Ort, was sich deine KIs merken. Korrigiere, was nicht stimmt, und behalte, was passt.',
        more: { to: 'how', hash: '#memory' },
      },
      {
        h: ['Du chattest.', 'bleib merkt es sich.'],
        p: 'bleib speichert Vorlieben aus dem Chat. Ein Tipp macht das rückgängig. Bei sensiblen Angaben fragt bleib vorher.',
        more: { to: 'how', hash: '#proposals' },
      },
      {
        h: ['Wechsle die KI.', 'Behalte alles.'],
        p: 'Deine Vorlieben und Regeln bleiben in bleib. Bei einer neuen KI fragt bleib zuerst.',
        more: { to: 'works', hash: '' },
      },
      {
        h: ['bleib fragt,', 'wenn es darauf ankommt.'],
        p: 'Alltägliches läuft von selbst. Bei Gesundheit und Geld fragt bleib dich immer zuerst.',
        more: { to: 'permissions', hash: '' },
      },
      {
        h: ['Sieh genau, was', 'jede KI erfahren hat.'],
        p: 'Für jede Weitergabe gibt es einen Beleg, damit du immer weißt, welche KI was bekommen hat.',
        more: { to: 'receipts', hash: '' },
      },
      {
        h: ['Deine KI kennt dich.', 'Dein Gedächtnis bleibt privat.'],
        p: 'Je besser dich deine KI kennt, desto besser hilft sie dir. Dein Gedächtnis bleibt dabei geschützt, mit einem Schlüssel, den nur du hast.',
        more: { to: 'security', hash: '' },
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
        { from: 'Notizen', text: 'Marek, Berlin' },
        { from: 'ChatGPT', text: 'Gangplatz' },
        { from: 'Claude', text: 'Wochenrückblick' },
        { from: 'Notizen', text: 'Gesundheit' },
      ],
      footer: 'Verschlüsselt auf diesem Gerät. Nur du hast Zugriff.',
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
      usedBy: 'Gerade genutzt von',
      providers: [
        { name: 'Claude', icon: '/providers/claude.svg', color: '/providers/claude-color.svg' },
        { name: 'Gemini', icon: '/providers/gemini.svg', color: '/providers/gemini-color.svg' },
        { name: 'ChatGPT', icon: '/providers/openai.svg', color: '' },
      ],
      caption: 'Andere KI. Dasselbe Gedächtnis.',
    },
    sealed: { note: 'So sieht es jeder ohne deinen Schlüssel. Auch wir.' },
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
