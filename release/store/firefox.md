# Firefox Add-ons (AMO)

One desktop listing with English and German translations. Category in both locales is **Privacy & Security** (`privacy-security`). Select one category. Set the default listing locale to English, then add German in the listing editor. Use `bleib` as the proposed Add-on URL slug if available. The slug is separate from the manifest ID `bleib@bleib.dev`. [AMO submission fields](https://extensionworkshop.com/documentation/publish/submitting-an-add-on/), [AMO category names](https://mozilla.github.io/addons-server/topics/api/categories.html), [Firefox add-on IDs](https://extensionworkshop.com/documentation/develop/extensions-and-the-add-on-id/).

## English (en-US)

**Name** · bleib

**Summary** · Keep your preferences on this device and bring the ones that fit into new chats in ChatGPT, Claude and Gemini.

**Description**

Your AI memory. In your hands.

Stop repeating yourself to every AI.

A password manager, for your preferences.

Each AI sees only what it needs.

bleib works on desktop Firefox with ChatGPT, Claude and Gemini. Install and open the free bleib desktop app and connect this browser. bleib is in development.

- You can save simple preferences just by typing them in a chat. Try “I prefer aisle seats.” If bleib saves it, you can choose **Undo**. Other things you tell an AI can go to your review list.
- Bring over visible memories from the three AI sites and decide what to keep.
- When you type a new chat draft, bleib looks for relevant memories on this device. It can add a short line about you. bleib asks before the first share with each AI. Health, money, people, location, anything you mark private and anything bleib is unsure about always need your approval.
- Your memory is shared when added. The AI site can read it before you press Send. You can undo an automatic addition while the draft is unchanged. You get a receipt for every share.
- If bleib can’t recognize the page, it pauses.

We never see your memory. Your saved memory and receipts are encrypted on your device. No bleib account. No tracking. Free and open source.

**Single purpose for Notes for Reviewers** · Save AI memory on this device and add only the relevant parts to supported AI chat drafts under the user’s sharing rules, with a receipt for each share.

## Deutsch (de)

**Name** · bleib

**Kurzbeschreibung** · Behalte deine Vorlieben auf diesem Gerät und nimm passende Angaben mit in neue Chats mit ChatGPT, Claude und Gemini.

**Beschreibung**

Dein KI-Gedächtnis. In deiner Hand.

Du musst dich nicht bei jeder KI wiederholen.

Wie ein Passwortmanager. Für deine Vorlieben.

Jede KI sieht nur, was sie braucht.

bleib funktioniert in Firefox auf deinem Computer mit ChatGPT, Claude und Gemini. Installiere und öffne die kostenlose bleib-App. Verbinde dann diesen Browser. bleib ist in Entwicklung.

- Schreib zum Beispiel „Ich bevorzuge einen Gangplatz“ in den Chat. Wenn bleib die Vorliebe speichert, kannst du das mit **Rückgängig** zurücknehmen. Andere Angaben kannst du später prüfen.
- Übernimm sichtbare Erinnerungen von den drei KI-Websites. Du entscheidest, was du behältst.
- Wenn du einen neuen Chat beginnst, sucht bleib auf deinem Gerät nach passenden Erinnerungen. Es kann sie als kurze Zeile über dich ergänzen. Beim ersten Teilen mit jeder KI fragt bleib nach. Bei Gesundheit, Geld, Personen und Aufenthaltsorten fragt bleib jedes Mal. Das gilt auch für alles, was du als privat markierst oder was bleib nicht sicher einordnen kann.
- Sobald bleib etwas einfügt, ist es geteilt. Die KI-Website kann es lesen, bevor du den Entwurf abschickst. Solange der Entwurf unverändert ist, kannst du die automatische Ergänzung rückgängig machen. Für jedes Teilen bekommst du einen Beleg.
- Wenn bleib die Seite nicht erkennt, pausiert es.

Wir sehen dein Gedächtnis nie. Deine gespeicherten Erinnerungen und Belege sind auf deinem Gerät verschlüsselt. Kein bleib-Konto. Kein Tracking. Kostenlos und quelloffen.

**Einzelner Zweck für die Prüfnotizen** · bleib speichert dein KI-Gedächtnis auf diesem Gerät und ergänzt unterstützte Chatentwürfe nach deinen Regeln um passende Angaben. Für jedes Teilen gibt es einen Beleg.

## AMO submission answers

| AMO field | Answer |
| --- | --- |
| Distribute add-on | On this site, for the public AMO listing. |
| Source code submission | Yes. The build bundles TypeScript and CSS with esbuild. Supply matching source, lockfile and build commands. |
| This add-on is experimental | Yes for the initial in-development release. |
| This add-on requires payment, non-free services or software, or additional hardware | No. The bleib app is free and open source. The supported chat sites are third-party services. Sign in to the chat services as needed. Validate v0.1 on the account tiers named in release notes. |
| Firefox categories | Privacy & Security. |
| Firefox for Android categories | Leave unset. Desktop extension with a desktop companion. |
| Support email and Support website | `hello@rouxdutoit.com` and `https://bleib.dev/`, pending founder confirmation. |
| License | GNU Affero General Public License v3.0 or later. If no exact built-in option is offered, supply the applicable license text and the “or later” grant. |
| This add-on has a privacy policy | Yes. Paste the matching policy text below in each listing locale. |
| Notes for Reviewers | Paste the single purpose, the five [permission justifications](permissions.md), and the reviewer notes below. |

[AMO submission fields](https://extensionworkshop.com/documentation/publish/submitting-an-add-on/), [source package requirements](https://extensionworkshop.com/documentation/publish/source-code-submission/).

### This add-on has a privacy policy

**English**

We never see your memory. bleib has no account, tracking or analytics. The extension reads text you type in supported ChatGPT, Claude and Gemini drafts, even before you send them. It reads visible memory entries when you ask to import them. Drafts and imported text may include names, contact details, health, financial or location information you entered. The extension checks the current chat or memory page to keep its actions in the right tab.

The extension sends candidate statements, texts used to find relevant memories, and requested imports to the bleib app on this computer. It stores your quiet-saving choices and a revocable connection credential in this browser profile. The app stores your saved memory, items for review, sharing rules and receipts encrypted on this device. You can manage what’s stored and revoke access in the app. You can turn off quiet saving for each site in the extension’s settings.

bleib shares text from your memory by adding it to the selected AI’s draft. The site can read it at that moment. The site’s privacy policy governs what it does with that text. Undo can remove an automatic addition from an unchanged draft. The site may already have read it. Your “Report a Page Change” link opens GitHub so you can choose whether to send a report. Leave personal text and account details out of reports.

**Deutsch**

Wir sehen dein Gedächtnis nie. Für bleib brauchst du kein Konto. Es gibt kein Tracking und keine Nutzungsanalyse. Die Erweiterung liest, was du in unterstützte Entwürfe bei ChatGPT, Claude und Gemini schreibst, noch bevor du sie abschickst. Wenn du einen Import startest, liest sie sichtbare Erinnerungen. Entwürfe und importierte Texte können Namen, Kontaktdaten, Gesundheitsdaten, Angaben zu Geld oder Aufenthaltsorten enthalten. Die Erweiterung prüft, welcher Chat oder welche Gedächtnisseite geöffnet ist, damit ihre Aktionen im richtigen Tab landen.

Die Erweiterung gibt mögliche Erinnerungen, Texte für die Suche nach passenden Erinnerungen und angeforderte Importe an die bleib-App auf diesem Computer weiter. In diesem Browserprofil speichert sie deine Einstellungen fürs automatische Speichern und die widerrufbare Verbindung zur App. Die App speichert deine Erinnerungen, Angaben zur Prüfung, Freigaberegeln und Belege verschlüsselt auf diesem Gerät. In der App kannst du gespeicherte Angaben verwalten und Zugriffe widerrufen. In den Einstellungen der Erweiterung kannst du das automatische Speichern für jede Website ausschalten.

bleib teilt Angaben aus deinem Gedächtnis, indem es sie in den Entwurf bei der gewählten KI einfügt. Die Website kann sie ab diesem Moment lesen. Für den Umgang mit dem Text gelten die Datenschutzregeln der Website. Solange der Entwurf unverändert ist, kannst du eine automatische Ergänzung rückgängig machen. Die Website kann sie bis dahin schon gelesen haben. Über „Seitenänderung melden“ öffnest du GitHub. Du entscheidest, ob du dort eine Meldung abschickst. Lass persönliche Texte und Kontodaten in Meldungen weg.

### Firefox data collection and transmission

The checked-in Firefox manifest declares `data_collection_permissions.required: ["none"]`. **That contradicts the current implementation and blocks submission.** Mozilla counts transfers to a native app, including same-device transfers. Inserting text into the provider draft is also a disclosure. The privacy text and reviewer notes do not replace the manifest or the user’s consent. [AMO data policy](https://extensionworkshop.com/documentation/publish/add-on-policies/), [Firefox built-in consent and taxonomy](https://extensionworkshop.com/documentation/develop/firefox-builtin-data-consent/), [December 1 policy update](https://extensionworkshop.com/documentation/publish/add-on-policies-preview-2026-12/).

These are the proposed selections for the current core feature set. Enter them in the extension manifest, then verify the rendered install prompt and AMO declaration against the final signed build. Review the scope of the two activity labels with Mozilla if it differs from the taxonomy applied here.

| Manifest data type | Declaration for the described build | Reason |
| --- | --- | --- |
| `personalCommunications` | Required | Drafts and manual questions passed to the companion, and chat context inserted into the provider page. |
| `websiteContent` | Required | Content of supported editors and requested visible memory entries. |
| `websiteActivity` | Required | The data transfer can follow typing in a recognized editor or a user action to import. Include the functional interaction, with no interaction analytics. |
| `browsingActivity` | Required | The supported AI site identifier is sent to the companion to bind actions and permissions. The full current URL is checked locally in the extension. |
| `personallyIdentifyingInfo`, `healthInfo`, `financialAndPaymentInfo`, `locationInfo` | Required | Free-form draft or memory text can include any of these before local review. Fresh approval applies to sharing such memory with the AI, after the local transfer. |
| `authenticationInfo` | Required | The add-on receives and supplies a credential for its connection to the local app. No provider credentials are read by the extension. |
| `searchTerms`, `bookmarksInfo`, `technicalAndInteraction` | Omit | No browser search terms, bookmarks or technical or usage telemetry are sent. A chat draft may include questions for the AI. |

There are no optional data declarations in this draft. If the release splits a data flow into an optional permission, it needs a user-initiated request and enforcement when denied or revoked. Use the Firefox 140+ built-in install consent for required data and the owner’s pairing step. Verify that declining consent prevents transmission, including passive draft handling. Verify the disclosure and controls in a stock browser before submitting.

### Notes for Reviewers

Desktop companion required. Provide links to the exact release-candidate desktop installers, supported OS/architecture and matching source revision in the submission. For the extension, use a clean desktop Firefox 140+ profile. Install and open bleib, finish first launch, select **Connect Wallet** in extension Settings and confirm **Connect Browser** in the app. Use a dedicated reviewer demo account if a login is needed. Supply access privately via reviewer instructions and keep credentials out of public assets and source packages.

On a supported chat site, type “I prefer aisle seats” and wait for **Saved** and **Undo**. Open a new chat on another supported site and type “Plan a flight.” Use **Review in Wallet** to allow the first share, then **Check Again**. Check the draft and the app receipt. Repeat in a new chat to see a relevant ordinary preference added automatically. To test import, open **Bring My Memory** and review the visible synthetic memory entries in the app. A changed or unsupported page shows that bleib paused. The extension does not submit a chat.

Source archive instructions for the reviewer, from its root, with Node 20+ and npm. Run `npm --prefix extension ci`, then `npm --prefix extension run build`. The submitted Firefox bundle is `extension/dist/firefox`. The native host name is `dev.bleib.wallet`. Include the [permission justifications](permissions.md) ahead of these instructions.
