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
      description: 'Encrypted on your device. Shared only as needed. Switch their memory off. A free browser extension, in development for Chrome, Edge and Firefox.',
    },
    description:
      'Own your AI memory. Encrypted on your device, shared only as needed. bleib is your AI memory wallet: a browser extension, in development for Chrome, Edge and Firefox, that keeps your memory encrypted on your device. Bring in what ChatGPT, Claude and Gemini know about you, then switch their memory off. You decide what each AI gets, and every share leaves a receipt. Free and open source.',
  },
  skip: 'Skip to content',
  nav: {
    home: 'bleib home',
    github: 'GitHub',
    early: 'Get bleib',
    how: 'How it works',
    security: 'Security',
    developers: 'Developers',
    pricing: 'Pricing',
    langSwitch: 'Deutsch',
    langSwitchLabel: 'Diese Seite auf Deutsch',
    label: 'Main navigation',
    menu: 'Menu',
    themeToDark: 'Switch to dark mode',
    themeToLight: 'Switch to light mode',
  },
  hero: {
    eyebrow: 'In development',
    /** On launch day (config/install.ts `launched`). */
    eyebrowLaunch: 'Free · Open source · Private',
    status: 'In development',
    h1: 'Own your AI memory.',
    sub: ['Encrypted on your device.', 'Shared only as needed.'],
    primary: 'How it works',
    secondary: 'GitHub',
    addTo: 'Add to {browser}',
    installed: 'bleib is installed',
    stores: 'Get bleib for',
    leaveOut: 'Leave out {detail}',
  },
  launch: {
    open: 'Open bleib',
    worksWith: 'Works with',
    share: 'Get it for your computer',
    shareAlone: 'Get bleib for your computer',
    copied: 'Link copied',
    shareText: 'bleib: Own your AI memory.',
  },
  phone: {
    h: 'On your phone too.',
    sub: 'Use bleib inside ChatGPT and Claude.',
    note: 'Free for one AI app.',
    more: 'See pricing',
  },
  preview: {
    examples: 'Examples',
    ask: 'Add to your message?',
    add: 'Add',
    title: 'Added just what {ai} needs',
    attachment: 'About me',
    tabs: [
      {
        ai: 'Gemini', icon: 'gemini-color', typed: 'Plan a weekend in Lisbon for me.',
        facts: [{ t: 'Aisle seat', icon: 'airline_seat' }, { t: 'Carry-on only', icon: 'luggage' }],
      },
      {
        ai: 'Claude', icon: 'claude-color', typed: 'Write a cover letter for this job.',
        facts: [{ t: 'Product designer', icon: 'work' }, { t: 'Warm, direct tone', icon: 'chat_bubble' }],
      },
      {
        ai: 'ChatGPT', icon: 'openai', typed: 'What should I cook tonight?',
        facts: [{ t: 'Loves spicy food', icon: 'restaurant' }, { t: 'Cooks for two', icon: 'group' }],
      },
    ],
  },
  story: {
    label: 'How bleib works',
    scenes: [
      {
        h: ['Control what AI', 'knows about you.'],
        p: 'Everything your AIs should know, in one place you keep.',
        more: { to: 'how', hash: '#memory', label: 'One memory, every AI' },
      },
      {
        h: ['You chat.', 'bleib takes notes.'],
        p: 'Mention you’re vegetarian. It’s saved to your bleib.',
        more: { to: 'how', hash: '#proposals', label: 'Saves as you go' },
      },
      {
        h: ['Switch anytime.', 'Keep your choices.'],
        p: 'Tell bleib once. Every AI knows.',
        more: { to: 'works', hash: '', label: 'Works with your AI' },
      },
      {
        h: ['It only asks', 'when it matters.'],
        p: 'Each chat gets just what it needs. Health notes always wait for approval.',
        more: { to: 'permissions', hash: '', label: 'You decide what’s shared' },
      },
      {
        h: ['A receipt', 'for every share.'],
        p: 'See exactly what AIs receive. Stay in control of your data.',
        more: { to: 'receipts', hash: '', label: 'See what bleib added' },
      },
      {
        h: ['Import your memories.', 'Switch theirs off.'],
        p: 'Your bleib keeps yours. With you wherever you go.',
        more: { to: 'how', hash: '#off', label: 'How to switch it off' },
        dark: true,
      },
    ],
  },
  cards: {
    wallet: {
      title: 'Your bleib',
      rows: [
        { k: 'People', v: 'James, Berlin', icon: 'person', from: 'ChatGPT' },
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
      later: { ai: 'Claude', title: 'Added for Claude', sub: 'Aisle seat', icon: 'airline_seat', tag: 'Always on' },
    },
    need: {
      rows: [
        { k: 'Travel', v: 'Aisle seat', icon: 'flight', use: true },
        { k: 'Luggage', v: 'Carry-on only', icon: 'luggage', use: true },
        { k: 'Work', v: 'Friday review', icon: 'work' },
        { k: 'Health', v: 'Private', icon: 'favorite', locked: true },
      ],
      asks: 'Asks first',
      draft: 'Plan a weekend in Lisbon for me.',
    },
    receipt: {
      title: 'Added for ChatGPT',
      purpose: 'For your Lisbon trip',
      time: '14:32',
      shared: [{ t: 'Aisle seat', icon: 'airline_seat' }, { t: 'Carry-on only', icon: 'luggage' }],
      notShared: 'Not shared: Health, People',
    },
    any: {
      usedBy: 'Now used by',
      providers: [
        { name: 'Claude', icon: '/providers/claude.svg', color: '/providers/claude-color.svg' },
        { name: 'Gemini', icon: '/providers/gemini.svg', color: '/providers/gemini-color.svg' },
        { name: 'ChatGPT', icon: '/providers/openai.svg', color: '' },
      ],
      caption: 'Different AI. Same memory.',
      added: 'Added from your bleib',
      /** One request per AI, in the providers' order (Claude, Gemini, ChatGPT); each gets the same bleib chip. */
      drafts: ['Find a dinner spot in Lisbon.', 'Plan a weekend in Lisbon for me.', 'What should I cook tonight?'],
    },
    off: { setting: 'Memory', note: 'Switched off in each AI’s own settings.', import: 'Import to your bleib', imported: 'Imported to your bleib', from: 'From Claude, Gemini and ChatGPT' },
    propose: {
      app: 'Claude',
      said: 'I’m vegetarian.',
      title: 'Saved to bleib',
      fact: 'Vegetarian',
      icon: 'eco',
    },
  },
  finale: {
    h: 'One memory. Every AI.',
    p: 'Free, local, and open source.',
  },
  footer: {
    dictionary: { language: 'German', pronounced: 'pronounced', meaning: 'stay; remain.' },
    cols: { product: 'Product', project: 'Project', legal: 'Legal' },
    fine: 'AGPL-3.0-or-later · Spec Apache-2.0 · No cookies or analytics',
    email: 'Email',
    label: 'Footer navigation',
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
      description: 'Verschlüsselt auf deinem Gerät. Geteilt wird nur, was nötig ist. Schalte ihr Gedächtnis aus. Eine kostenlose Browser-Erweiterung, in Entwicklung für Chrome, Edge und Firefox.',
    },
    description:
      'Dein KI-Gedächtnis gehört dir. Verschlüsselt auf deinem Gerät, geteilt wird nur, was nötig ist. bleib ist dein Wallet für dein KI-Gedächtnis: eine Browser-Erweiterung, in Entwicklung für Chrome, Edge und Firefox, die dein Gedächtnis verschlüsselt auf deinem Gerät bewahrt. Hol dir, was ChatGPT, Claude und Gemini über dich wissen, dann schalte ihr Gedächtnis aus. Du entscheidest, was jede KI bekommt, und jede Weitergabe hinterlässt einen Beleg. Kostenlos und Open Source.',
  },
  skip: 'Zum Inhalt springen',
  nav: {
    home: 'bleib Startseite',
    github: 'GitHub',
    early: 'Hol dir bleib',
    how: 'So funktioniert’s',
    security: 'Sicherheit',
    developers: 'Entwickler',
    pricing: 'Preise',
    langSwitch: 'English',
    langSwitchLabel: 'This page in English',
    label: 'Hauptnavigation',
    menu: 'Menü',
    themeToDark: 'Dunkles Design einschalten',
    themeToLight: 'Helles Design einschalten',
  },
  hero: {
    eyebrow: 'In Entwicklung',
    eyebrowLaunch: 'Kostenlos · Open Source · Privat',
    status: 'In Entwicklung',
    h1: 'Dein KI-Gedächtnis gehört dir.',
    sub: ['Verschlüsselt auf deinem Gerät.', 'Geteilt wird nur, was nötig ist.'],
    primary: 'So funktioniert’s',
    secondary: 'GitHub',
    addTo: 'Zu {browser} hinzufügen',
    installed: 'bleib ist installiert',
    stores: 'bleib gibt es für',
    leaveOut: '{detail} weglassen',
  },
  launch: {
    open: 'bleib öffnen',
    worksWith: 'Funktioniert mit',
    share: 'Hol es dir für deinen Computer',
    shareAlone: 'Hol dir bleib für deinen Computer',
    copied: 'Link kopiert',
    shareText: 'bleib: Dein KI-Gedächtnis gehört dir.',
  },
  phone: {
    h: 'Auch auf deinem Handy.',
    sub: 'Nutze bleib direkt in ChatGPT und Claude.',
    note: 'Kostenlos für eine KI-App.',
    more: 'Zu den Preisen',
  },
  preview: {
    examples: 'Beispiele',
    ask: 'Zum Entwurf hinzufügen?',
    add: 'Hinzufügen',
    title: 'Nur das Nötige für {ai}',
    attachment: 'Über mich',
    tabs: [
      {
        ai: 'Gemini', icon: 'gemini-color', typed: 'Plane ein Wochenende in Lissabon für mich.',
        facts: [{ t: 'Gangplatz', icon: 'airline_seat' }, { t: 'Vegetarisch', icon: 'eco' }],
      },
      {
        ai: 'Claude', icon: 'claude-color', typed: 'Schreib ein Anschreiben für diese Stelle.',
        facts: [{ t: 'Produktdesign', icon: 'work' }, { t: 'Warmer, direkter Ton', icon: 'chat_bubble' }],
      },
      {
        ai: 'ChatGPT', icon: 'openai', typed: 'Was soll ich heute Abend kochen?',
        facts: [{ t: 'Mag es scharf', icon: 'restaurant' }, { t: 'Kocht für zwei', icon: 'group' }],
      },
    ],
  },
  story: {
    label: 'So funktioniert bleib',
    scenes: [
      {
        h: ['Bestimme, was die KI', 'über dich weiß.'],
        p: 'Alles, was deine KIs wissen sollen, an einem Ort, der bei dir bleibt.',
        more: { to: 'how', hash: '#memory', label: 'Ein Gedächtnis, jede KI' },
      },
      {
        h: ['Du chattest.', 'bleib merkt es sich.'],
        p: 'Erwähn, dass du vegetarisch isst. Es wird in deinem bleib gespeichert.',
        more: { to: 'how', hash: '#proposals', label: 'Speichert nebenbei' },
      },
      {
        h: ['Jederzeit wechseln.', 'Behalte deine Vorlieben.'],
        p: 'Sag es bleib einmal. Jede KI weiß es.',
        more: { to: 'works', hash: '', label: 'Funktioniert mit deiner KI' },
      },
      {
        h: ['bleib fragt,', 'wenn es zählt.'],
        p: 'Jeder Chat bekommt nur, was er braucht. Gesundheitsnotizen warten immer auf deine Freigabe.',
        more: { to: 'permissions', hash: '', label: 'Du entscheidest, was geteilt wird' },
      },
      {
        h: ['Ein Beleg', 'für jede Weitergabe.'],
        p: 'Sieh genau, was KIs bekommen. Behalte die Kontrolle über deine Daten.',
        more: { to: 'receipts', hash: '', label: 'Sieh, was bleib eingefügt hat' },
      },
      {
        h: ['Importiere deine Erinnerungen.', 'Schalte ihres aus.'],
        p: 'Dein bleib behält sie. Bei dir, wohin du auch gehst.',
        more: { to: 'how', hash: '#off', label: 'So schaltest du es aus' },
        dark: true,
      },
    ],
  },
  cards: {
    wallet: {
      title: 'Dein bleib',
      rows: [
        { k: 'Menschen', v: 'Rieke, Berlin', icon: 'person', from: 'ChatGPT' },
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
      later: { ai: 'Claude', title: 'Für Claude hinzugefügt', sub: 'Gangplatz', icon: 'airline_seat', tag: 'Immer an' },
    },
    need: {
      rows: [
        { k: 'Reisen', v: 'Gangplatz', icon: 'flight', use: true },
        { k: 'Gepäck', v: 'Nur Handgepäck', icon: 'luggage', use: true },
        { k: 'Arbeit', v: 'Freitagsrunde', icon: 'work' },
        { k: 'Gesundheit', v: 'Privat', icon: 'favorite', locked: true },
      ],
      asks: 'Fragt zuerst',
      draft: 'Plane ein Wochenende in Lissabon für mich.',
    },
    receipt: {
      title: 'Für ChatGPT hinzugefügt',
      purpose: 'Für deine Lissabon-Reise',
      time: '14:32',
      shared: [{ t: 'Gangplatz', icon: 'airline_seat' }, { t: 'Nur Handgepäck', icon: 'luggage' }],
      notShared: 'Nicht geteilt: Gesundheit, Menschen',
    },
    any: {
      usedBy: 'Gerade genutzt von',
      providers: [
        { name: 'Claude', icon: '/providers/claude.svg', color: '/providers/claude-color.svg' },
        { name: 'Gemini', icon: '/providers/gemini.svg', color: '/providers/gemini-color.svg' },
        { name: 'ChatGPT', icon: '/providers/openai.svg', color: '' },
      ],
      caption: 'Andere KI. Dasselbe Gedächtnis.',
      added: 'Aus deinem bleib hinzugefügt',
      drafts: ['Such mir ein Restaurant in Lissabon.', 'Plane ein Wochenende in Lissabon für mich.', 'Was soll ich heute Abend kochen?'],
    },
    off: { setting: 'Gedächtnis', note: 'In den Einstellungen jeder KI ausgeschaltet.', import: 'In dein bleib importieren', imported: 'In dein bleib importiert', from: 'Von Claude, Gemini und ChatGPT' },
    propose: {
      app: 'Claude',
      said: 'Ich esse vegetarisch.',
      title: 'In bleib gespeichert',
      fact: 'Vegetarisch',
      icon: 'eco',
    },
  },
  finale: {
    h: 'Ein Gedächtnis. Jede KI.',
    p: 'Kostenlos, lokal und Open Source.',
  },
  footer: {
    dictionary: { language: 'Deutsch', pronounced: 'Aussprache', meaning: 'dableiben; erhalten bleiben.' },
    cols: { product: 'Produkt', project: 'Projekt', legal: 'Rechtliches' },
    fine: 'AGPL-3.0-or-later · Spezifikation Apache-2.0 · Keine Cookies, keine Analyse',
    email: 'E-Mail',
    label: 'Fußzeilennavigation',
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
