# Local task needs for bleib

## Recommendation

Use **A, the MiniLM slot classifier in the wallet daemon**, for a suggestions-only v1 pilot. At the measured score floors, it can suggest up to two details for the person to review and add. Keep automatic insertion disabled. The release gate is at least 90% precision in each language on independently labelled, unseen wallets, with recall and the number of picks reported. The exact Lisbon, cover-letter and dinner screens also need to pass in both languages before claiming those examples work.

Install the pinned encoder, two heads and CPU runtime with the desktop app at build time. Both browsers use the same authenticated native messaging path. The measured Linux download fits 150 MiB. If 150 MiB is a hard **installed-size** budget, the MiniLM build exceeds it. The static variant fits, but its transfer recall is too low for the website promise. Keep the manual picker on those builds while developing a smaller semantic encoder. The Qwen models and the cascade add hundreds of milliseconds and exceed the disk budget by weights alone.

## Why the browser baseline scores zero

The earlier report's 0 F1 is **zero correct picks**, with 28 wrong picks surviving. The harness invokes the actual wallet chooser and browser projection. Across the 152 original test drafts, the chooser returns 25 correct and 205 incorrect picks before serialization. The filter drops every correct pick. In isolation, only three of the 40 fixture entries pass it. The chooser selects the aisle-seat line four times and the vegetarian line 24 times, all on drafts where those lines are unlabelled. It never selects the mint-tea line. [Reproduction and per-entry audit](../../spikes/local-model/q2/filter-audit.mjs) · [Per-draft predictions](../../spikes/local-model/q2/predictions.tsv)

1. **The chooser misses the eligible pair.** The bilingual topic regexes and fallback word overlap determine eligibility, then `project()` keeps one winning line per wallet kind and caps the result at two kinds. Both Lisbon details are `preferences`, so this chooser cannot return them together. The English fixture instead picks headphone cushions and a knee restriction. The German fixture picks a clothing-fabric preference. [Keyword gate](../../wallet/src/local-memory.ts#L7-L37) · [Ranking and one-entry-per-kind cap](../../wallet/src/memory.ts#L174-L205)
2. **The filter rejects otherwise relevant data before consent.** `draftProjection()` passes each selected line to `shortFact()`. NFKC normalization and the control, markup, URL and instruction checks come first. The credit card amount `2.400` (M29, one correct pick) matches the dotted domain-like pattern on line 70. The remaining 24 correct picks all miss the gate at line 73. They need `assessFact(text).automatic` or an exact match to the two narrow factual or residence regexes. Those regexes cover a few literal condition and budget statements and a fixed city list. The ordinary path requires an exact preference phrase, a closed value list, a recognized topic, and no sensitive or transient marker. A hotel room away from the lift, a developer stack, a child's age and interests, and rehabilitation instructions fail that gate. The English short-answer fixture independently fails the topic check because the format regex recognizes `concise` and `brief` but lacks `short`. Its value is already in the allowlist. [Browser gates and caps](../../wallet/src/browser-memory.ts#L41-L76) · [Topic and ordinary-value checks](../../wallet/src/local-memory.ts#L7-L18) · [Safety classification](../../wallet/src/local-memory.ts#L39-L60)
3. **Consent sees only rendered details.** A falsey fact is recorded as `unsafe_fact`. The 12-word, 120-character and 280-character caps apply after the semantic allowlist and do not account for this result. When all picks are filtered, the wallet records the omission and returns `no_match` before consent. The approval and release paths recompute the same projection. Fix the ranking and expand the typed factual renderer for both ask-only and everyday details. Keep the existing instruction and markup defenses, factual caps and receipt ordering. [Preview and release](../../wallet/src/wallet.ts#L393-L452) · [Approval revalidation](../../wallet/src/wallet.ts#L731-L745) · [Phase-four security verification](../../.planning/phases/04-browser-extension-save-and-fill/04-VERIFICATION.md)

## Experiment

The Q corpus remains byte-for-byte unchanged. It supplies 24 parallel calibration scenarios (48 drafts) and 76 parallel test scenarios (152 drafts, 120 relevant picks). The six exact website hero drafts use a small independent vault with the displayed facts and distractors. A separate transfer vault and 16 parallel scenarios (32 drafts) test different values, extra slots, new wording and code-switching. Each draft has zero, one or two expected entries. Relevance labels include protected details so assigning relevance and granting consent can be evaluated independently. English and German variants of a scenario are correlated. [Original study](local-model.md) · [Additional held-out inputs](../../spikes/local-model/q2/held-out-drafts.tsv) · [Transfer and hero entries](../../spikes/local-model/q2/held-out-entries.tsv)

**A · Needs first.** The bilingual taxonomy has 51 slots in 13 groups. Examples include `travel.seat`, `travel.hotel_budget`, `travel.loyalty`, `food.diet`, `food.allergy`, `food.servings`, `work.role`, `work.writing_style`, `format.length`, `format.units`, `people.child`, `health.condition`, `money.budget` and `location.home`. Each entry has at most one slot. At save, whole-statement templates handle canonical facts such as seat preference or number of portions. A separate model head tries the other entries. It needs a score of 0.55 and a margin of 0.15 over the runner-up. The request head scores all 51 slots. The harness intersects them with available, uniquely assigned entries, ranks by score, and applies two rank floors. Entries with unresolved slot collisions are omitted. A small deterministic draft guard blocks some explicit opt-outs and extraction instructions. The test also measures the result with that guard disabled and with gold save assignments. [Taxonomy in EN and DE](../../spikes/local-model/q2/slots.tsv) · [Save and request selection](../../spikes/local-model/q2/selection.mjs)

Training uses original, hand-authored bilingual frames with bounded substitutions, varied phrasing and compound tasks. The 7,734 deduplicated request drafts contain 727 multi-label examples and 962 negatives. The 4,841 save statements include 187 negatives. Negatives cover ordinary questions, third-party tasks, quotes, edits, transient statements, opt-outs and adversarial attempts. The generator reads the taxonomy and its own templates. A test checks for literal overlap with any calibration or held-out text. Taxonomy and example domains are informed by Q and the landing-page spec. Synthetic variants within a frame share vocabulary and phrasing. [Generator](../../spikes/local-model/q2/synthesize.mjs) · [Request frames](../../spikes/local-model/q2/tasks.txt) · [Save frames](../../spikes/local-model/q2/save.txt)

Both modes fit independent one-vs-rest logistic heads. The main version freezes the Apache-2.0 multilingual MiniLM L12 encoder, mean-pools 384 dimensions and trains only the two heads. Both heads export to ONNX with int8 column weights and dynamic quantization of the input for integer matrix multiplication. The compact comparison learns the same two heads from 8,192 hashed word, bigram and character features. It exports int8 ONNX too. Its measured deployable variant uses the same quantized tables with a small Node evaluator and avoids a native runtime dependency. [MiniLM model card](https://huggingface.co/sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2) · [Training and export](../../spikes/local-model/q2/fit.py) · [Static evaluator](../../spikes/local-model/q2/subwords.mjs)

**B · Local instruct models.** Qwen3-0.6B and Qwen3-1.7B are both Apache-2.0. The experiment uses pinned Unsloth Q4_K_M GGUF files and CPU-only llama.cpp via node-llama-cpp. One English instruction describes the bilingual task. The models see the untrusted draft and a numbered list of slot descriptions for the current vault. They never receive saved values. Qwen runs with thinking disabled, greedy decoding, a 2,048-token context and a 32-token output cap. A JSON grammar permits zero to two available numeric slot IDs, and a second parser rejects malformed, repeated and unknown IDs. Both direct B runs use gold save assignments. That advantage isolates draft reasoning from save errors. SmolLM3-3B is also Apache-2.0. The two Qwen sizes give a same-family comparison within the smallest candidates considered. [Qwen3-0.6B licence](https://huggingface.co/Qwen/Qwen3-0.6B) · [Qwen3-1.7B licence](https://huggingface.co/Qwen/Qwen3-1.7B) · [Pinned weights](../../spikes/local-model/q2/reasoners.mjs) · [SmolLM3 model card](https://huggingface.co/HuggingFaceTB/SmolLM3-3B) · [Node grammar API](https://node-llama-cpp.withcat.ai/guide/grammar.html)

**A+B · Cascade.** Rank as A does. Keep slots scoring more than 0.12 above their rank floor. Invoke Qwen3-1.7B only when at least one candidate lies within 0.12 either side of its corresponding floor. Offer it only the uncertain slots. Keep confirmed slots in the suggestion result. The large Qwen model had fewer spurious picks on calibration and both Qwen models had zero true picks there. The harness measures the fallback on the routed requests themselves, including the cost of changing the shortlist. [Routing and replay](../../spikes/local-model/q2/cascade.mjs)

Score floors are fixed on the 48 calibration drafts. A grid in 0.02 increments maximizes micro F0.5 for suggestions, with preference for higher precision and then higher floors on ties. The automatic trial uses the same procedure with a minimum of 90% precision and three picks per language, the number of eligible labels per language in calibration. It simulates an existing grant and filters by current wallet safety and sensitivity rules before scoring. Neither model nor threshold decides privacy or approval.

## Quality

Entry-level micro precision / recall / F1 in percent on the original holdout. A dash for precision indicates zero picks.

| Method | All | EN | DE | Correct / wrong picks | Drafts with picks on 52 empty cases |
| --- | ---: | ---: | ---: | ---: | ---: |
| Keyword chooser | 10.9 / 20.8 / 14.3 | 15.1 / 26.7 / 19.3 | 7.3 / 15.0 / 9.8 | 25 / 205 | 43 |
| Keyword + browser filter | 0.0 / 0.0 / 0.0 | 0.0 / 0.0 / 0.0 | 0.0 / 0.0 / 0.0 | 0 / 28 | 10 |
| A · MiniLM int8 | 80.9 / 60.0 / 68.9 | 78.7 / 61.7 / 69.2 | 83.3 / 58.3 / 68.6 | 72 / 17 | 11 |
| A · Static int8 | 85.4 / 29.2 / 43.5 | 89.5 / 28.3 / 43.0 | 81.8 / 30.0 / 43.9 | 35 / 6 | 2 |
| B · Qwen3-0.6B | 30.4 / 5.8 / 9.8 | 30.0 / 5.0 / 8.6 | 30.8 / 6.7 / 11.0 | 7 / 16 | 0 |
| B · Qwen3-1.7B | 73.3 / 9.2 / 16.3 | 88.9 / 13.3 / 23.2 | 50.0 / 5.0 / 9.1 | 11 / 4 | 0 |
| A+B · MiniLM and Qwen3-1.7B | 84.1 / 57.5 / 68.3 | 79.5 / 58.3 / 67.3 | 89.5 / 56.7 / 69.4 | 69 / 13 | 9 |

The previous unsupervised MiniLM baseline reached **51.1% F1** on the same labels. Training the heads raised F1 to **68.9%** at suggestion floors **0.44 / 0.98** for the first and second ranks. The transfer vault reached **88.9 / 66.7 / 76.2** across both languages. The compact variant reached **100.0 / 8.3 / 15.4** there. The direct Qwen models missed every transfer label and generally abstained. The cascade ran B on 20 of 152 original test drafts and slightly improved precision, with lower recall and no overall F1 gain.

On save assignment, MiniLM placed **53 of 60 labelled entries** correctly across the three vaults and left both unknown entries unassigned. The remaining seven labelled entries abstained. Nine matches came from templates. The compact model placed **31 of 60** correctly and misassigned one. Giving MiniLM the gold slot map raises original holdout F1 to 73.4%. Its narrow draft guard changes precision from 77.4% to 80.9% with the same recall. Both classifiers and the cascade still propose a private phone-number entry in the two parallel S98 drafts asking to send it to all contacts. The relevance gate needs broader adversarial coverage before release. That entry never becomes eligible for automatic sharing.

Category F1 on the original holdout, **EN / DE**, with equal numbers of parallel drafts. Dashes mark categories without any positive labels. The JSON includes EN/DE precision, recall, F1 and false picks for every category and method. [Full category metrics](../../spikes/local-model/q2/results.json)

| Category | Drafts per language | A MiniLM | A Static | B 0.6B | B 1.7B | A+B |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| adversarial | 5 | — | — | — | — | — |
| ambiguous | 2 | — | — | — | — | — |
| coding | 6 | 88.9 / 88.9 | 33.3 / 33.3 | 0.0 / 0.0 | 0.0 / 0.0 | 88.9 / 88.9 |
| contact | 1 | 100.0 / 100.0 | 100.0 / 100.0 | 0.0 / 0.0 | 0.0 / 0.0 | 100.0 / 100.0 |
| cooking | 9 | 75.0 / 57.1 | 46.2 / 18.2 | 0.0 / 0.0 | 0.0 / 0.0 | 66.7 / 57.1 |
| cover-letter | 4 | 28.6 / 28.6 | 0.0 / 0.0 | 0.0 / 0.0 | 0.0 / 0.0 | 28.6 / 0.0 |
| fitness | 6 | 66.7 / 66.7 | 44.4 / 44.4 | 25.0 / 0.0 | 0.0 / 0.0 | 66.7 / 66.7 |
| general | 3 | — | — | — | — | — |
| gifts | 4 | 0.0 / 50.0 | 0.0 / 40.0 | 0.0 / 0.0 | 0.0 / 0.0 | 0.0 / 50.0 |
| health | 1 | 100.0 / 100.0 | 0.0 / 0.0 | 0.0 / 0.0 | 0.0 / 0.0 | 100.0 / 100.0 |
| kids | 4 | 28.6 / 50.0 | 0.0 / 0.0 | 0.0 / 0.0 | 0.0 / 0.0 | 28.6 / 57.1 |
| location | 3 | 80.0 / 50.0 | 66.7 / 50.0 | 0.0 / 0.0 | 0.0 / 0.0 | 80.0 / 50.0 |
| money | 4 | 100.0 / 100.0 | 50.0 / 50.0 | 0.0 / 0.0 | 0.0 / 0.0 | 100.0 / 100.0 |
| negation | 3 | — | — | — | — | — |
| relationships | 1 | 100.0 / 100.0 | 0.0 / 100.0 | 0.0 / 0.0 | 0.0 / 0.0 | 100.0 / 100.0 |
| shopping | 6 | 83.3 / 80.0 | 66.7 / 66.7 | 28.6 / 60.0 | 90.9 / 0.0 | 72.7 / 80.0 |
| trip | 9 | 70.6 / 77.8 | 46.2 / 66.7 | 16.7 / 15.4 | 30.8 / 40.0 | 75.0 / 82.4 |
| work-email | 5 | 85.7 / 66.7 | 66.7 / 40.0 | 0.0 / 0.0 | 40.0 / 0.0 | 75.0 / 66.7 |

## Automatic insertion

MiniLM's **0.64 / 0.98** automatic candidate passed the small calibration screen with three correct picks in each language. It failed on held-out English and in aggregate.

| Automatic candidate | Correct / total | Precision | Eligible recall |
| --- | ---: | ---: | ---: |
| All | 6 / 7 | 85.7% | 42.9% |
| EN | 3 / 4 | 75.0% | 42.9% |
| DE | 3 / 3 | 100.0% | 42.9% |

Eligible recall counts only entries admitted by the existing factual and ordinary gates under an assumed grant. The German result rests on three picks. The compact variant fell short on calibration. Its suggestion floors on eligible entries happened to make 8 correct test picks and 0 wrong picks, with only 57.1% eligible recall. Automatic insertion stays off based on the frozen calibration. B and A+B provide no automatic threshold. First-share and sensitive consent still apply to suggestions.

## The website hero

The exact website drafts use a vault holding five distinct displayed details and three private distractors, with vegetarian shared by two examples. These are relevance results before any consent or rendering. Cells show selections in **EN / DE**.

| Website example | Expected | A MiniLM | A Static | B 0.6B and 1.7B | A+B |
| --- | --- | --- | --- | --- | --- |
| Plan a weekend in Lisbon | Aisle seat, Vegetarian | — / — | Aisle seat / Aisle seat | — / — | — / — |
| Write a cover letter for this job | Product designer, Berlin | — / — | — / — | — / — | — / — |
| What should I cook tonight? | Vegetarian, Cooks for two | — / — | — / — | — / — | — / — |

All six exact hero drafts missed at least one expected detail under every tested setting. On the original Lisbon pair (S25), MiniLM picked the travel mode in both languages. The compact model picked aisle seat in EN and both desired facts in DE. Neither Qwen nor the cascade picked anything. On the original public-sector job application pair (S41), every new method abstained. On the original Thai dinner pair (S39), MiniLM and the cascade found the vegetarian preference in EN and missed both labels in DE. Neither found the allergy in that pair. The compact model found the EN vegetarian preference and the 0.6B model incorrectly picked shoe size. [Per-draft output](../../spikes/local-model/q2/predictions.tsv)

The exact cover-letter fixture expects the person's work role and Berlin. A generic cover-letter draft leaves the relevance of a home location unspecified. The test retains the site's label to expose that product choice. Keep location protected and require a task-specific reason plus fresh consent. Detail such as a job's location or a request to state availability makes the usefulness of a location clearer. A generic trip leaves the mode of travel open. An explicit itinerary leg is strong evidence to suggest a seat preference. [Live hero examples](https://bleib.dev/)

## Runtime and size

Linux x86-64 on a Ryzen 5 5600X, Node 24.22.2. A uses one ONNX Runtime CPU thread. B uses four llama.cpp CPU threads. Warm p50/p95 measure the request scoring path on the original 152 held-out drafts. Cold times cover local model initialization, and RSS is the peak sampled process memory. Timings exclude the extension, native messaging, unlock, policy and receipt I/O.

| Candidate | Cold ms | p50 ms | p95 ms | Peak RSS MiB | Model assets MiB |
| --- | ---: | ---: | ---: | ---: | ---: |
| A MiniLM | 1256 | 7.71 | 10.87 | 526 | 129.2 |
| A Static | 1 | 0.09 | 0.17 | 64 | 0.80 |
| B Qwen3-0.6B | 1242 | 341.59 | 766.19 | 1,311 | 378.3 |
| B Qwen3-1.7B | 1795 | 509.22 | 1133.17 | 2,433 | 1,056.1 |
| A+B | A then B on demand | 8.05 | 646.67 | ≤ 2,844† | 1,185.3 |

† The cascade latency adds measured A and routed B time per draft. It uses separate processes, so RSS is the sum of their separate peaks as an estimate. The routed B calls alone were 626 ms p50 and 871 ms p95, warm. The MiniLM model path for save assignment measured 7.30 / 12.20 ms p50/p95 per entry. The rules-only save path skips inference.

| Linux packaging sample | Download MiB | Installed regular files MiB |
| --- | ---: | ---: |
| Existing desktop app | 33.8 | 142.6 |
| Desktop app plus MiniLM assets and runtime | 113.7 | 318.4 |
| Desktop app plus static weights and evaluator | 34.1 | 143.4 |

The archive experiment uses the existing Linux builder and stages the measured assets alongside the app. The selector still needs product integration. The extension adds zero model bytes with the daemon design. The Qwen figures are GGUF weights alone. CPU bindings and runtime libraries add to that. The macOS package and end-to-end browser timing remain platform acceptance checks. The runtimes load local files and disable dynamic model provision. A socket trace on the Qwen smoke run observed no internet socket calls. All 13 spike tests and 91 existing wallet tests passed offline. The static evaluator and ONNX exports agreed within 0.002 on the parity fixtures. [Reproduction and verification](../../spikes/local-model/README.md)

## Implementation outline

1. **Give approved entries a typed value and a versioned slot.** Keep the original text encrypted in your bleib. Use whole-statement parsing and validated fields first. Run the save head for remaining entries and use its result as a classification suggestion. A clear everyday preference can save quietly with immediate Undo and its detail visible. Sensitive, owner-private and uncertain entries get an in-place **Save to bleib?** decision. If no reliable slot is available, keep an owner-approved entry available in the manual picker and leave it out of model selection. Reclassify old entries locally after opt-in or edit, account for the existing seat and tea slot metadata, and resolve collisions by explicit evidence or owner choice.
2. **Score on a bounded daemon worker.** Send only the current validated new-chat draft over existing native messaging. Debounce, cancel stale work, and discard requests after draft changes, navigation, lock or consent withdrawal. Rank candidate IDs by slot and keep at most two different entries, including two from the same wallet kind when relevant. Show exact values and a plain, specific reason in the owner-controlled preview. Update Add to Added, Allow Once to Allowed, and Save to Saved with a drawn yellow tick (#f6e79a). Use the corresponding German labels and announce the state change to screen readers. If inference fails or is uncertain, keep the manual picker available. Keep browser permission and site allowlists as they are.
3. **Render typed values and revalidate before release.** Build the `About me` or `Über mich` line from fixed formatters for recognized facts. For example, render a number and currency from a validated amount, or a known place from an offline place table. Keep N6's Unicode instruction and residence safeguards. An unrecognized value stays in your bleib. Bind a preview to the draft, site, destination, exact entry versions, policy and formatted content. Revalidate at approval and release. Ask on first use for each AI and every protected share. Only allow automatic sharing of precisely scoped everyday facts once a future quality gate passes and the owner enables it. Commit the encrypted receipt before release, including the purpose, exact text and omissions. Receipt failure yields empty release. Insertion and removal leave Send in the person's control.
4. **Make the release evidence match the product.** Evaluate independently authored EN and DE drafts and different multi-person wallets, with support per language sufficient to bound precision and with tests for new locales, unstated intent, unsupported slots, explicit opt-outs and private requests to send data elsewhere. Report consent-eligible precision and recall, plus adversarial and exact hero results at the frozen floors. Re-run phase-four renderer, stale-draft, lock, revoke, withdrawal and receipt tests. Run keyboard, screen-reader and WCAG 2.2 AA checks on the EN and DE preview and save cards. Measure typing responsiveness and signed installer size on supported platforms and low-end hardware. Pin and checksum model bytes in the installer build with licence notices. Load only locally bundled assets. [Phase-four verification](../../.planning/phases/04-browser-extension-save-and-fill/04-VERIFICATION.md)
