# Chrome Web Store

Listing and Privacy practices for the desktop Chrome extension. Use one item for English and German. Category in both locales is **Privacy & Security** (Productivity). Chrome takes the name and short description from the manifest, and the detailed description and screenshots from Store listing. The current manifest has a single English description. To ship the short descriptions below in both languages, the extension owner needs to add `_locales/en/messages.json`, `_locales/de/messages.json`, a `default_locale` and a localized manifest description. [Listing fields](https://developer.chrome.com/docs/webstore/cws-dashboard-listing), [categories](https://developer.chrome.com/docs/webstore/best-practices), [extension manifest](https://developer.chrome.com/docs/extensions/reference/manifest), [localization](https://developer.chrome.com/docs/extensions/reference/api/i18n).

## English (en)

**Name** · bleib

**Short description** · Save your preferences on this device and add what’s relevant to new chats in ChatGPT, Claude and Gemini.

**Detailed description**

Your AI memory. In your hands.

Stop repeating yourself to every AI.

A password manager, for your preferences.

Each AI sees only what it needs.

bleib works with ChatGPT, Claude and Gemini in Chrome. Install and open the free bleib desktop app, then connect this browser. bleib is in development.

- Tell an AI an everyday preference, like “I prefer aisle seats.” bleib can save it as you type. Choose **Undo** to take back a save. Other things you tell an AI can wait in your review list.
- Bring over visible memories from the three AI sites. Review what you want to keep.
- Start typing in a new chat. bleib uses your draft to find what fits on this device and can add a short line about you. bleib asks before the first share with each AI. It asks every time for health, money, people, location, anything you mark private and anything it is unsure about.
- Your memory is shared when added. The AI site can read the added text right away. You decide when to press Send. Undo can remove the automatic addition from an unchanged draft. The receipt stays.
- If bleib can’t recognize the page, it pauses.

We never see your memory. Your saved memory and receipts are encrypted on this device. No bleib account. No tracking. Free and open source.

**Single purpose description** · Keep your AI memory on this device and share only the relevant parts with the AI chat you’re using, under your rules and with a receipt.

## Deutsch (de)

**Name** · bleib

**Kurzbeschreibung** · Speichere deine Vorlieben auf diesem Gerät und ergänze passende Infos in neuen Chats mit ChatGPT, Claude und Gemini.

**Ausführliche Beschreibung**

Dein KI-Gedächtnis. In deiner Hand.

Du musst dich nicht bei jeder KI wiederholen.

Wie ein Passwortmanager. Für deine Vorlieben.

Jede KI sieht nur, was sie braucht.

bleib funktioniert mit ChatGPT, Claude und Gemini in Chrome. Installiere und öffne die kostenlose bleib-App auf deinem Computer. Verbinde dann diesen Browser. bleib ist in Entwicklung.

- Sag einer KI zum Beispiel: „Ich bevorzuge einen Gangplatz.“ bleib kann solche Vorlieben schon beim Tippen speichern. Mit **Rückgängig** nimmst du das Speichern zurück. Andere Angaben kannst du später prüfen.
- Übernimm sichtbare Erinnerungen von den drei KI-Websites. Du entscheidest, was du behältst.
- Schreib etwas in einen neuen Chat. bleib sucht auf deinem Gerät nach passenden Angaben und kann sie als kurze Zeile über dich ergänzen. Beim ersten Teilen mit jeder KI fragt bleib nach. Bei Gesundheit, Geld, Personen und Aufenthaltsorten fragt bleib jedes Mal. Das gilt auch für alles, was du als privat markierst oder was bleib nicht sicher einordnen kann.
- Sobald bleib etwas einfügt, ist es geteilt. Die KI-Website kann es sofort lesen. Du entscheidest, wann du den Entwurf abschickst. Solange der Entwurf unverändert ist, kannst du die automatische Ergänzung rückgängig machen. Der Beleg bleibt.
- Wenn bleib die Seite nicht erkennt, pausiert es.

Wir sehen dein Gedächtnis nie. Deine gespeicherten Erinnerungen und Belege sind auf diesem Gerät verschlüsselt. Kein bleib-Konto. Kein Tracking. Kostenlos und quelloffen.

**Einzelner Zweck** · Dein KI-Gedächtnis bleibt auf diesem Gerät. bleib teilt nur die Angaben, die zum aktuellen KI-Chat passen, nach deinen Regeln und mit Beleg.

## Privacy practices

Use the English justification for the dashboard fields. German equivalents are in [Permission justifications](permissions.md). If the dashboard presents one Host permission justification, paste the three host entries together. Select **No, I am not using remote code.** Extension JS and CSS ship in the package. The page watcher is outside the extension. [Privacy practices fields](https://developer.chrome.com/docs/webstore/cws-dashboard-privacy/).

### Data usage

Use the following checkboxes for the described build. Chrome requires disclosure of local handling too. [Official checkbox screenshot](https://developer.chrome.com/static/docs/webstore/cws-dashboard-privacy/image/screenshot-data-certifi-1955439870c37.png), [Chrome User Data FAQ](https://developer.chrome.com/docs/webstore/program-policies/user-data-faq).

| Dashboard checkbox | Select | Basis |
| --- | --- | --- |
| Personally identifiable information | Yes | Draft and import text can contain names, addresses or contact details. |
| Health information | Yes | Draft and import text can contain health details. Health notes need approval every time before sharing from your memory. |
| Financial and payment information | Yes | Draft and import text can contain financial details. Money notes need approval every time before sharing from your memory. |
| Authentication information | Yes | bleib issues, stores and uses its own revocable browser-pairing credential for the local app. The extension has no access flow for AI-site passwords or session cookies. |
| Personal communications | Yes | The extension reads supported chat drafts and passes candidate statements, eligible new-chat drafts or manual questions to the local app. |
| Location | Yes | Draft and import text can contain locations. The extension does not request device geolocation. |
| Web history | Yes | Conservative selection for local use of the supported tab’s current URL and short-lived URL bindings. No history API, browsing log or other sites. |
| User activity | Yes | The extension responds to typing in recognized editors and clicks on its controls. No usage analytics or keystroke log. |
| Website content | Yes | The extension reads supported composers and text visible on supported memory pages. |

**Certifications** · Check all three after the founder confirms the final build and published policy agree with these answers. In dashboard order, the commitments cover sale of user data, use or transfers unrelated to the single purpose, and use or transfers for creditworthiness or lending. The answer is affirmative for all three commitments. [Official certification controls](https://developer.chrome.com/static/docs/webstore/cws-dashboard-privacy/image/screenshot-data-certifi-1955439870c37.png), [Limited Use policy](https://developer.chrome.com/docs/webstore/program-policies/policies).

**Privacy policy** · Enter `https://bleib.dev/privacy/app/` after that route is published and agrees with the signed build. German counterpart `https://bleib.dev/de/datenschutz/app/`. The release notice needs to state Chrome Limited Use compliance and cover the handling in [Store privacy copy](firefox.md#this-add-on-has-a-privacy-policy). The main site’s privacy page covers a different surface. [Privacy policy requirements](https://developer.chrome.com/docs/webstore/program-policies/user-data-faq).

**Release check** · The current pairing copy mentions quiet saving and sharing context. Chrome requires an affirmative in-product choice after a prominent explanation of what is handled and why. Verify the release flow describes draft reading before Send, local processing and review, imports, and exposure on insertion. Content scripts in the current build can read drafts and evaluate candidates before pairing, even though wallet operations require pairing. The extension owner needs to gate that handling on consent and test decline, revoke and reinstall. [Disclosure and consent FAQ](https://developer.chrome.com/docs/webstore/program-policies/user-data-faq).
