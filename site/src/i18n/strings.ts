export type Lang = 'en' | 'de';

/**
 * The public repository doesn't exist yet. Until it does, "GitHub" links go to the
 * Developers page. Set this to the repository URL once it is public.
 */
export const GITHUB_URL: string = '';

export const routes = {
  home: { en: '/', de: '/de/' },
  how: { en: '/how-it-works/', de: '/de/so-funktionierts/' },
  developers: { en: '/developers/', de: '/de/entwickler/' },
  pricing: { en: '/pricing/', de: '/de/preise/' },
  privacy: { en: '/privacy/', de: '/de/datenschutz/' },
  impressum: { en: '/impressum/', de: '/de/impressum/' },
} as const;

export type RouteKey = keyof typeof routes;

const en = {
  meta: {
    title: 'bleib: your AI context, encrypted and yours',
    description:
      'bleib is the open source wallet for what your AI knows about you. Encrypted on your side, asked before anything is shared, with a receipt of exactly what each AI saw.',
  },
  skip: 'Skip to content',
  nav: {
    home: 'bleib home',
    github: 'GitHub',
    early: 'Get early access',
    how: 'How it works',
    developers: 'Developers',
    pricing: 'Pricing',
    langSwitch: 'Deutsch',
    langSwitchLabel: 'Diese Seite auf Deutsch',
    themeToDark: 'Switch to dark mode',
    themeToLight: 'Switch to light mode',
  },
  hero: {
    eyebrow: 'Open source · Free · Your keys',
    h1a: 'Change AI.',
    h1b: 'Stay yourself.',
    sub: 'bleib keeps what your AI knows about you encrypted and on your side. It asks before anything is shared, and shows you exactly what each AI saw.',
    primary: 'Get early access',
    secondary: 'View on GitHub',
    note: 'In development. Free and open source.',
  },
  preview: {
    file: 'bleib · Your wallet',
    eyebrow: 'This week',
    title: 'What your AI saw',
    tiles: [
      { n: '3', label: 'AIs connected', note: 'Claude, Codex, Ollama' },
      { n: '11', label: 'facts shared', note: 'Each with a receipt' },
      { n: '0', label: 'health details', note: 'Nothing left this device' },
    ],
    rowsLabel: 'Latest receipts',
    rows: [
      { who: 'Claude', where: 'Anthropic (hosted)', what: 'Aisle seat · Hotels under €250', why: 'Lisbon trip', when: 'Today 14:32', icon: '/providers/claude.svg' },
      { who: 'Codex', where: 'OpenAI (hosted)', what: 'Weekly review on Fridays', why: 'Planning', when: 'Mon 09:10', icon: '/providers/codex.svg' },
      { who: 'Ollama', where: 'On this device', what: 'Marek · vegetarian', why: 'Dinner', when: 'Sun 18:45', icon: '/providers/ollama.svg' },
    ],
  },
  story: {
    label: 'How bleib works',
    pause: 'Pause animations',
    play: 'Play animations',
    scenes: [
      {
        tick: 'Wallet',
        h: ['Your context.', 'In one place.'],
        p: 'People, preferences and rules your AIs need, in plain text you can read and correct. Encrypted on your device.',
      },
      {
        tick: 'Asked once',
        h: ['Asked once.', 'Remembered.'],
        p: 'The first time an AI needs something new, bleib asks. Your answer becomes a rule.',
      },
      {
        tick: 'Receipts',
        h: ['See exactly what', 'each AI saw.'],
        p: 'Every share leaves a receipt: which AI, where it went, for what, and the exact words.',
      },
      {
        tick: 'Any AI',
        h: ['Change AI.', 'Keep yourself.'],
        p: 'Your preferences and rules stay in bleib. A new AI gets what you allow, without starting over.',
      },
      {
        tick: 'You decide',
        h: ['Your AI suggests.', 'You decide.'],
        p: 'AIs can propose what to remember. Nothing is saved until you say so.',
      },
    ],
  },
  cards: {
    wallet: {
      title: 'Your Wallet',
      rows: [
        { k: 'People', v: 'Marek, Berlin', icon: 'person' },
        { k: 'Travel', v: 'Aisle seat', icon: 'plane' },
        { k: 'Work', v: 'Friday review', icon: 'case' },
        { k: 'Health', v: 'Private', icon: 'heart', locked: true },
      ],
      footer: 'Encrypted on this device. Only you hold the key.',
    },
    ask: {
      title: 'Allow Claude to use your travel preferences?',
      message: 'To plan your Lisbon trip. This is sent to Anthropic (hosted).',
      once: 'Allow Once',
      always: 'Always for Claude',
      no: 'Don’t Allow',
      saved: 'Claude may now use Travel.',
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
      sub: 'Preferences and rules stay here',
      sectionLabel: 'AI in use',
      providers: [
        { name: 'Claude', note: 'Anthropic', icon: '/providers/claude.svg' },
        { name: 'Codex', note: 'OpenAI', icon: '/providers/codex.svg' },
        { name: 'Gemini', note: 'Google', icon: '/providers/gemini.svg' },
        { name: 'Ollama', note: 'On this device', icon: '/providers/ollama.svg' },
      ],
      caption: 'Different AI. Same you.',
    },
    propose: {
      app: 'Claude',
      time: 'now',
      title: 'Remember this?',
      fact: 'Marek is vegetarian.',
      why: 'He mentioned it while you planned dinner.',
      save: 'Save',
      edit: 'Edit',
      later: 'Not Now',
      saved: 'Saved. No AI can read it until you allow it.',
    },
  },
  finale: {
    h: "Keep what's yours.",
    p: 'bleib is in development. Get early access and help shape it.',
    playPrompt: 'Go on: put it all in your wallet.',
    done: 'All yours.',
    reset: 'Take it all out',
    allIn: 'Put everything in the wallet',
    walletLabel: 'Your bleib wallet',
    count: '{n} of {total} in your wallet',
    putIn: 'Put “{item}” in your wallet',
    items: [
      'Aisle seat',
      'Marek · vegetarian',
      'Hotels under €250',
      'Weekly review · Fri',
      'Prefers mornings',
      'Penicillin allergy',
      'Lisbon · May',
      "Mum's birthday · 12 Mar",
      'Oat milk, no sugar',
      'Replies in German',
      'Window desk at work',
      'Runs Tue & Thu',
    ],
    lockedItem: 'Penicillin allergy',
  },
  form: {
    label: 'Email address',
    placeholder: 'you@example.com',
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
    tagline: 'Your AI context, encrypted and yours.',
    links: {
      how: 'How it works',
      developers: 'Developers',
      pricing: 'Pricing',
      privacy: 'Privacy',
      impressum: 'Legal notice',
      github: 'GitHub',
    },
    copyright: '© 2026 bleib',
  },
};

export type Strings = typeof en;

const de: Strings = {
  meta: {
    title: 'bleib: dein KI-Kontext, verschlüsselt und deins',
    description:
      'bleib ist die Open-Source-Wallet für das, was deine KI über dich weiß. Verschlüsselt auf deiner Seite, gefragt, bevor etwas geteilt wird, mit einem Beleg darüber, was jede KI gesehen hat.',
  },
  skip: 'Zum Inhalt springen',
  nav: {
    home: 'bleib Startseite',
    github: 'GitHub',
    early: 'Frühen Zugang sichern',
    how: 'So funktioniert’s',
    developers: 'Entwickler',
    pricing: 'Preise',
    langSwitch: 'English',
    langSwitchLabel: 'This page in English',
    themeToDark: 'Dunkles Design einschalten',
    themeToLight: 'Helles Design einschalten',
  },
  hero: {
    eyebrow: 'Open Source · Kostenlos · Deine Schlüssel',
    h1a: 'KI wechseln.',
    h1b: 'Du selbst bleiben.',
    sub: 'bleib bewahrt, was deine KI über dich weiß, verschlüsselt und auf deiner Seite. Es fragt, bevor etwas geteilt wird, und zeigt dir genau, was jede KI gesehen hat.',
    primary: 'Frühen Zugang sichern',
    secondary: 'Auf GitHub ansehen',
    note: 'In Entwicklung. Kostenlos und Open Source.',
  },
  preview: {
    file: 'bleib · Deine Wallet',
    eyebrow: 'Diese Woche',
    title: 'Was deine KI gesehen hat',
    tiles: [
      { n: '3', label: 'KIs verbunden', note: 'Claude, Codex, Ollama' },
      { n: '11', label: 'Fakten geteilt', note: 'Jeder mit Beleg' },
      { n: '0', label: 'Gesundheitsdaten', note: 'Nichts hat dieses Gerät verlassen' },
    ],
    rowsLabel: 'Neueste Belege',
    rows: [
      { who: 'Claude', where: 'Anthropic (gehostet)', what: 'Gangplatz · Hotels unter 250 €', why: 'Reise nach Lissabon', when: 'Heute 14:32', icon: '/providers/claude.svg' },
      { who: 'Codex', where: 'OpenAI (gehostet)', what: 'Wochenrückblick am Freitag', why: 'Planung', when: 'Mo 09:10', icon: '/providers/codex.svg' },
      { who: 'Ollama', where: 'Auf diesem Gerät', what: 'Marek · Vegetarier', why: 'Abendessen', when: 'So 18:45', icon: '/providers/ollama.svg' },
    ],
  },
  story: {
    label: 'So funktioniert bleib',
    pause: 'Animationen anhalten',
    play: 'Animationen abspielen',
    scenes: [
      {
        tick: 'Wallet',
        h: ['Dein Kontext.', 'An einem Ort.'],
        p: 'Menschen, Vorlieben und Regeln, die deine KIs brauchen, als Klartext, den du lesen und korrigieren kannst. Verschlüsselt auf deinem Gerät.',
      },
      {
        tick: 'Einmal gefragt',
        h: ['Einmal gefragt.', 'Gemerkt.'],
        p: 'Wenn eine KI zum ersten Mal etwas Neues braucht, fragt bleib nach. Deine Antwort wird zur Regel.',
      },
      {
        tick: 'Belege',
        h: ['Sieh genau, was', 'jede KI gesehen hat.'],
        p: 'Jede Weitergabe hinterlässt einen Beleg: welche KI, wohin, wofür und der genaue Wortlaut.',
      },
      {
        tick: 'Jede KI',
        h: ['KI wechseln.', 'Du bleibst.'],
        p: 'Deine Vorlieben und Regeln bleiben in bleib. Eine neue KI bekommt, was du erlaubst, ohne Neuanfang.',
      },
      {
        tick: 'Du entscheidest',
        h: ['Deine KI schlägt vor.', 'Du entscheidest.'],
        p: 'KIs können vorschlagen, was sie sich merken möchten. Gespeichert wird erst, wenn du zustimmst.',
      },
    ],
  },
  cards: {
    wallet: {
      title: 'Deine Wallet',
      rows: [
        { k: 'Menschen', v: 'Marek, Berlin', icon: 'person' },
        { k: 'Reisen', v: 'Gangplatz', icon: 'plane' },
        { k: 'Arbeit', v: 'Rückblick am Freitag', icon: 'case' },
        { k: 'Gesundheit', v: 'Privat', icon: 'heart', locked: true },
      ],
      footer: 'Verschlüsselt auf diesem Gerät. Nur du hast den Schlüssel.',
    },
    ask: {
      title: 'Darf Claude deine Reisevorlieben nutzen?',
      message: 'Für deine Reise nach Lissabon. Wird an Anthropic (gehostet) gesendet.',
      once: 'Einmal erlauben',
      always: 'Immer für Claude',
      no: 'Nicht erlauben',
      saved: 'Claude darf jetzt Reisen nutzen.',
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
      sub: 'Vorlieben und Regeln bleiben hier',
      sectionLabel: 'Aktive KI',
      providers: [
        { name: 'Claude', note: 'Anthropic', icon: '/providers/claude.svg' },
        { name: 'Codex', note: 'OpenAI', icon: '/providers/codex.svg' },
        { name: 'Gemini', note: 'Google', icon: '/providers/gemini.svg' },
        { name: 'Ollama', note: 'Auf diesem Gerät', icon: '/providers/ollama.svg' },
      ],
      caption: 'Andere KI. Immer noch du.',
    },
    propose: {
      app: 'Claude',
      time: 'jetzt',
      title: 'Merken?',
      fact: 'Marek ist Vegetarier.',
      why: 'Er hat es erwähnt, als ihr das Abendessen geplant habt.',
      save: 'Speichern',
      edit: 'Bearbeiten',
      later: 'Nicht jetzt',
      saved: 'Gespeichert. Keine KI kann es lesen, bis du es erlaubst.',
    },
  },
  finale: {
    h: 'Behalte, was deins ist.',
    p: 'bleib ist in Entwicklung. Sichere dir frühen Zugang und gestalte mit.',
    playPrompt: 'Na los: Pack alles in deine Wallet.',
    done: 'Alles deins.',
    reset: 'Alles wieder rausnehmen',
    allIn: 'Alles in die Wallet packen',
    walletLabel: 'Deine bleib-Wallet',
    count: '{n} von {total} in deiner Wallet',
    putIn: '„{item}“ in deine Wallet packen',
    items: [
      'Gangplatz',
      'Marek · Vegetarier',
      'Hotels unter 250 €',
      'Wochenrückblick · Fr',
      'Lieber morgens',
      'Penicillin-Allergie',
      'Lissabon · Mai',
      'Mamas Geburtstag · 12. März',
      'Hafermilch, ohne Zucker',
      'Antworten auf Deutsch',
      'Fensterplatz im Büro',
      'Laufen Di & Do',
    ],
    lockedItem: 'Penicillin-Allergie',
  },
  form: {
    label: 'E-Mail-Adresse',
    placeholder: 'du@beispiel.de',
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
    tagline: 'Dein KI-Kontext, verschlüsselt und deins.',
    links: {
      how: 'So funktioniert’s',
      developers: 'Entwickler',
      pricing: 'Preise',
      privacy: 'Datenschutz',
      impressum: 'Impressum',
      github: 'GitHub',
    },
    copyright: '© 2026 bleib',
  },
};

export const strings: Record<Lang, Strings> = { en, de };

export function t(lang: Lang): Strings {
  return strings[lang];
}

export function otherLang(lang: Lang): Lang {
  return lang === 'en' ? 'de' : 'en';
}
