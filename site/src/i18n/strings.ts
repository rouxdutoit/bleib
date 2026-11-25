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
    /** What a shared link shows (the homepage): the hero's promise, not the category. */
    share: {
      title: 'bleib: Own your AI memory.',
      description: 'Kept on your device. Shared on your terms. A free browser extension for Chrome and Firefox.',
    },
    description:
      'bleib is your AI memory wallet: a browser extension that keeps your memory encrypted on your device. You decide what each AI can know, and you can always check what it saw. Free and open source.',
  },
  skip: 'Skip to content',
  nav: {
    home: 'bleib home',
    github: 'GitHub',
    early: 'Notify me',
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
    eyebrow: 'Browser extension · In development',
    status: 'In development',
    h1: 'Own your AI memory.',
    sub: ['Kept on your device.', 'Shared on your terms.'],
    primary: 'Notify me',
    secondary: 'GitHub',
  },
  preview: {
    examples: 'Examples',
    title: 'Added just what {ai} needs',
    attachment: 'About me',
    tabs: [
      {
        ai: 'Gemini', icon: 'gemini-color', typed: 'Plan a weekend in Lisbon for me.',
        facts: [{ t: 'Aisle seat', icon: 'airline_seat' }, { t: 'Vegetarian', icon: 'eco' }], private: 'Private details stay in your bleib.',
      },
      {
        ai: 'Claude', icon: 'claude-color', typed: 'Write a cover letter for this job.',
        facts: [{ t: 'Product designer', icon: 'work' }, { t: 'Berlin', icon: 'location_on' }], private: 'Private details stay in your bleib.',
      },
      {
        ai: 'ChatGPT', icon: 'openai', typed: 'What should I cook tonight?',
        facts: [{ t: 'Loves spicy food', icon: 'restaurant' }, { t: 'Cooks for two', icon: 'group' }], private: 'Private details stay in your bleib.',
      },
    ],
  },
  story: {
    label: 'How bleib works',
    scenes: [
      {
        h: ['Control what AI', 'knows about you.'],
        p: 'Gemini has your aisle seat. Claude has your Friday review. Bring both into your bleib.',
        more: { to: 'how', hash: '#memory', label: 'One memory, every AI' },
      },
      {
        h: ['You chat.', 'bleib takes notes.'],
        p: 'Mention you’re learning Spanish. It’s in your bleib. One tap removes it.',
        more: { to: 'how', hash: '#proposals', label: 'Saves as you go' },
      },
      {
        h: ['Switch anytime.', 'Keep your choices.'],
        p: 'Plan Lisbon with ChatGPT. Book it with Claude.',
        more: { to: 'works', hash: '', label: 'Works with your AI' },
      },
      {
        h: ['It only asks', 'when it matters.'],
        p: 'Your aisle seat goes in by itself. Health notes wait for your yes.',
        more: { to: 'permissions', hash: '', label: 'You decide what’s shared' },
      },
      {
        h: ['A receipt', 'for every share.'],
        p: 'Claude got your aisle seat. Your receipt says so.',
        more: { to: 'receipts', hash: '', label: 'See what was shared' },
      },
      {
        h: ['Turn their memory off.', 'bleib keeps yours.'],
        p: 'ChatGPT’s memory is off. Your aisle seat stays in your bleib. Only you are in control.',
        more: { to: 'security', hash: '', label: 'Private by design' },
        dark: true,
      },
    ],
  },
  cards: {
    wallet: {
      title: 'Your bleib',
      rows: [
        { k: 'People', v: 'Marek, Berlin', icon: 'person', from: 'ChatGPT' },
        { k: 'Travel', v: 'Aisle seat', icon: 'flight', from: 'Gemini' },
        { k: 'Work', v: 'Friday review', icon: 'work', from: 'Claude' },
        { k: 'Health', v: 'Private', icon: 'favorite', locked: true, from: 'ChatGPT' },
      ],
      fromLabel: 'From',
      footer: 'Encrypted on this device.',
    },
    ask: {
      title: 'Share your health notes with Claude?',
      message: 'For your running plan. Health is sensitive, so bleib asks first.',
      action: 'Allow Once',
      allowed: 'Allowed',
      later: { ai: 'Claude', title: 'Claude used Travel', sub: 'Aisle seat', icon: 'airline_seat', tag: 'Automatic' },
    },
    receipt: {
      who: 'Claude',
      where: 'Anthropic · hosted',
      time: '14:32',
      purposeLabel: 'For',
      purpose: 'Lisbon trip',
      sharedLabel: 'Shared',
      shared: [{ t: 'Prefers aisle seats', icon: 'airline_seat' }, { t: 'Carry-on only', icon: 'luggage' }],
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
      said: 'I’m learning Spanish.',
      title: 'Saved to bleib',
      fact: 'Learning Spanish',
    },
  },
  finale: {
    h: 'Your AI memory stays yours.',
    p: 'For Chrome and Firefox. Free and open source.',
  },
  form: {
    label: 'Email address',
    submit: 'Notify me',
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
    share: {
      title: 'bleib: Dein KI-Gedächtnis gehört dir.',
      description: 'Auf deinem Gerät. Geteilt, wie du willst. Eine kostenlose Browser-Erweiterung für Chrome und Firefox.',
    },
    description:
      'bleib ist dein Wallet für dein KI-Gedächtnis: eine Browser-Erweiterung, die dein Gedächtnis verschlüsselt auf deinem Gerät bewahrt. Du entscheidest, was jede KI wissen darf, und kannst jederzeit nachsehen, was sie gesehen hat. Kostenlos und Open Source.',
  },
  skip: 'Zum Inhalt springen',
  nav: {
    home: 'bleib Startseite',
    github: 'GitHub',
    early: 'Vormerken',
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
    eyebrow: 'Browser-Erweiterung · In Entwicklung',
    status: 'In Entwicklung',
    h1: 'Dein KI-Gedächtnis gehört dir.',
    sub: ['Auf deinem Gerät.', 'Geteilt, wie du willst.'],
    primary: 'Vormerken',
    secondary: 'GitHub',
  },
  preview: {
    examples: 'Beispiele',
    title: 'Nur das Nötige für {ai}',
    attachment: 'Über mich',
    tabs: [
      {
        ai: 'Gemini', icon: 'gemini-color', typed: 'Plane ein Wochenende in Lissabon für mich.',
        facts: [{ t: 'Gangplatz', icon: 'airline_seat' }, { t: 'Vegetarisch', icon: 'eco' }], private: 'Private Angaben bleiben in deinem bleib.',
      },
      {
        ai: 'Claude', icon: 'claude-color', typed: 'Schreib ein Anschreiben für diese Stelle.',
        facts: [{ t: 'Produktdesign', icon: 'work' }, { t: 'Berlin', icon: 'location_on' }], private: 'Private Angaben bleiben in deinem bleib.',
      },
      {
        ai: 'ChatGPT', icon: 'openai', typed: 'Was soll ich heute Abend kochen?',
        facts: [{ t: 'Mag es scharf', icon: 'restaurant' }, { t: 'Kocht für zwei', icon: 'group' }], private: 'Private Angaben bleiben in deinem bleib.',
      },
    ],
  },
  story: {
    label: 'So funktioniert bleib',
    scenes: [
      {
        h: ['Bestimme, was die KI', 'über dich weiß.'],
        p: 'Gemini hat deinen Gangplatz. Claude hat deine Freitagsrunde. Hol beides in dein bleib.',
        more: { to: 'how', hash: '#memory', label: 'Ein Gedächtnis, jede KI' },
      },
      {
        h: ['Du chattest.', 'bleib merkt es sich.'],
        p: 'Erwähn, dass du Spanisch lernst. Es landet in deinem bleib. Ein Tipp entfernt es.',
        more: { to: 'how', hash: '#proposals', label: 'Speichert nebenbei' },
      },
      {
        h: ['Jederzeit wechseln.', 'Behalte deine Vorlieben.'],
        p: 'Plan Lissabon mit ChatGPT. Buch es mit Claude.',
        more: { to: 'works', hash: '', label: 'Funktioniert mit deiner KI' },
      },
      {
        h: ['bleib fragt,', 'wenn es zählt.'],
        p: 'Dein Gangplatz kommt von selbst dazu. Gesundheitsnotizen warten auf dein Ja.',
        more: { to: 'permissions', hash: '', label: 'Du entscheidest, was geteilt wird' },
      },
      {
        h: ['Ein Beleg', 'für jede Weitergabe.'],
        p: 'Claude bekam deinen Gangplatz. Dein Beleg sagt es.',
        more: { to: 'receipts', hash: '', label: 'Sieh, was geteilt wurde' },
      },
      {
        h: ['Schalte ihr Gedächtnis aus.', 'bleib behält deins.'],
        p: 'ChatGPTs Gedächtnis ist aus. Dein Gangplatz bleibt in deinem bleib. Nur du hast die Kontrolle.',
        more: { to: 'security', hash: '', label: 'Privat von Grund auf' },
        dark: true,
      },
    ],
  },
  cards: {
    wallet: {
      title: 'Dein bleib',
      rows: [
        { k: 'Menschen', v: 'Marek, Berlin', icon: 'person', from: 'ChatGPT' },
        { k: 'Reisen', v: 'Gangplatz', icon: 'flight', from: 'Gemini' },
        { k: 'Arbeit', v: 'Freitagsrunde', icon: 'work', from: 'Claude' },
        { k: 'Gesundheit', v: 'Privat', icon: 'favorite', locked: true, from: 'ChatGPT' },
      ],
      fromLabel: 'Von',
      footer: 'Verschlüsselt auf diesem Gerät.',
    },
    ask: {
      title: 'Gesundheitsnotizen mit Claude teilen?',
      message: 'Für deinen Laufplan. Gesundheit ist sensibel, darum fragt bleib vorher.',
      action: 'Einmal erlauben',
      allowed: 'Erlaubt',
      later: { ai: 'Claude', title: 'Claude nutzte Reisen', sub: 'Gangplatz', icon: 'airline_seat', tag: 'Automatisch' },
    },
    receipt: {
      who: 'Claude',
      where: 'Anthropic · gehostet',
      time: '14:32',
      purposeLabel: 'Für',
      purpose: 'Reise nach Lissabon',
      sharedLabel: 'Geteilt',
      shared: [{ t: 'Bevorzugt Gangplätze', icon: 'airline_seat' }, { t: 'Nur Handgepäck', icon: 'luggage' }],
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
      said: 'Ich lerne Spanisch.',
      title: 'In bleib gespeichert',
      fact: 'Lernt Spanisch',
    },
  },
  finale: {
    h: 'Dein KI-Gedächtnis bleibt deins.',
    p: 'Für Chrome und Firefox. Kostenlos und quelloffen.',
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
