# Q3 · Google’s local models for task needs

## Decision

**Keep MiniLM in the wallet daemon for the suggestions-only pilot.** The Q2 encoder and heads fit the 150 MiB download budget in the existing Linux package sample (113.7 MiB compressed, 318.4 MiB installed). Keep the independent 90% precision gate in each language and verify the three demos before making a product claim. [Q2 recommendation and package measurement](local-model-q2.md)

The completed Gemma 3 direct pickers reached 1.3–5.8% F1 and 2.7–4.7% precision. The highest cascade precision was 85.0% with the 270M adapter, with 68.0% F1 and 181 ms p95. MiniLM reached 80.9% precision, 68.9% F1 and 11 ms p95. The measured Gemma files exceed the download budget before adding the app or runtime. The Gemma 3n quality comparison remains open because checkpoint acquisition stalled.

**Standalone Gemini Nano has no documented distribution path.** Google documents a Chrome-managed model download for the Prompt API and an Android-managed model in AICore, accessed through ML Kit. Its public release catalog offers Gemma weights under separate terms. I found no public Nano checkpoint, standalone inference runtime or redistribution grant. Chrome incorporates the Google Terms of Service, which restrict copying and distribution of its software. Android’s ML Kit GenAI terms explicitly prohibit extracting or replicating model weights. bleib can use Nano through its supported APIs on eligible devices. Extraction from Chrome is out of scope. [Chrome Prompt API](https://developer.chrome.com/docs/ai/prompt-api) · [Chrome terms](https://www.google.com/chrome/terms/) · [Google terms](https://policies.google.com/terms) · [Android AICore](https://developer.android.com/ai/gemini-nano) · [ML Kit GenAI terms](https://developers.google.com/ml-kit/genai-terms) · [Gemma releases](https://gemma.ai/models/releases/)

## Held-out results

Gemma 3n E2B and E4B are unscored. The pinned 3.03 GB and 4.54 GB checkpoints failed to reach checksum verification after repeated HTTP range, mirror and Xet transfers. The workspace had enough free disk. Loading, CPU latency, memory and quality for those checkpoints remain open. Both are wired into the benchmark with pinned hashes. [Checkpoint manifest](../../spikes/local-model/q3/models.mjs)

Percentages are micro-averaged. **P** is suggestion precision, **R** is recall. The final column counts drafts with a pick among the 52 drafts labelled empty.

| Picker | P | P EN | P DE | R | F1 | F1 EN | F1 DE | Correct / wrong | Picked on empty |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Q2 MiniLM | 80.9 | 78.7 | 83.3 | 60.0 | 68.9 | 69.2 | 68.6 | 72 / 17 | 11 |
| Gemma 3 270M IT | 2.8 | 2.8 | 2.9 | 3.3 | 3.1 | 3.1 | 3.1 | 4 / 137 | 41 |
| Gemma 3 270M IT + LoRA | 2.7 | 0.0 | 7.1 | 0.8 | 1.3 | 0.0 | 2.7 | 1 / 36 | 5 |
| Gemma 3 1B IT | 4.7 | 5.1 | 4.3 | 7.5 | 5.8 | 6.3 | 5.2 | 9 / 183 | 41 |

The cascade uses MiniLM with Gemma as the fallback. Its warm latency includes MiniLM on every draft and Gemma on routed drafts only. The 20 routed drafts include any candidate within the Q2 score band, including candidates that score just below the suggestion floor.

| MiniLM fallback | P | P EN | P DE | F1 | F1 EN | F1 DE | Routed | p50 ms | p95 ms |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Gemma 3 270M IT | 79.0 | 76.9 | 81.2 | 71.8 | 71.4 | 72.2 | 20 | 8.05 | 235.99 |
| Gemma 3 270M IT + LoRA | 85.0 | 81.0 | 89.5 | 68.0 | 66.7 | 69.4 | 20 | 8.05 | 181.08 |
| Gemma 3 1B IT | 79.6 | 76.9 | 82.6 | 71.6 | 71.4 | 71.7 | 20 | 8.05 | 630.46 |

The stock 270M frequently selected the first available slot, aisle seat. The 1B picked the unrelated budget and relationship slots on all six demos with the learned assignments. The LoRA made 5 picks on empty drafts, down from 41 for the stock 270M, and lost 3 of its 4 correct direct picks. These are results for this prompt and these checkpoints. Both stock checkpoints returned the requested ID on a simple constrained smoke test. The grammar controlled syntax and the slot vocabulary, while relevance remained poor. All 456 direct responses on the original holdout parsed successfully. The 1B fallback had two invalid responses on its 20 routed drafts. The parser discarded both. The stock 270M and 1B each made picks on four of ten adversarial drafts after the guard. On the separate transfer vault, MiniLM reached 76.2% F1 and the Gemma direct pickers reached 7.7–13.9%.

### Website demos

Cells show **EN / DE**. A dash means no suggestion. The primary table uses Q2’s learned save assignments for all candidates.

| Picker | Lisbon | Cover letter | Dinner |
| --- | --- | --- | --- |
| Expected | Aisle seat + Vegetarian / Aisle seat + Vegetarian | Product designer + Berlin / Product designer + Berlin | Vegetarian + Cooks for two / Vegetarian + Cooks for two |
| Q2 MiniLM | — / — | — / — | — / — |
| Gemma 3 270M IT | Aisle seat / Aisle seat | Aisle seat / Aisle seat | Aisle seat + Vegetarian / Aisle seat |
| Gemma 3 270M IT + LoRA | Berlin / — | — / — | Berlin / Berlin |
| Gemma 3 1B IT | Budget + Partner hobby / Budget + Partner hobby | Budget + Partner hobby / Budget + Partner hobby | Budget + Partner hobby / Budget + Partner hobby |

Q2’s save assignment leaves the product-designer entry and the asthma distractor unassigned. A draft-picker swap can retrieve Berlin and has no way to recover the role in that setup. The diagnostic below gives each Gemma picker the full labelled hero catalogue. It shows what could change if the wallet assigns those slots correctly. The cascade never routed a hero draft, so every cascade reproduced MiniLM’s empty results on those six drafts.

| Picker | Lisbon | Cover letter | Dinner | Exact out of 6 |
| --- | --- | --- | --- | --- |
| Gemma 3 270M IT | Aisle seat + Vegetarian / Aisle seat | Aisle seat / Aisle seat | Aisle seat / Aisle seat | 1 |
| Gemma 3 270M IT + LoRA | Partner hobby / Partner hobby | — / — | Partner hobby / Partner hobby | 0 |
| Gemma 3 1B IT | Budget + Partner hobby / Budget + Partner hobby | Product designer + Budget / Budget + Partner hobby | Budget + Partner hobby / Budget + Partner hobby | 0 |

### CPU cost and disk

Ubuntu 26.04.1 x86-64, Ryzen 5 5600X, Node 24.22.2, node-llama-cpp 3.22.3, four CPU threads and text-only Q4_K_M GGUFs. Cold load measures runtime, model and context initialization in a fresh process with the OS file cache intact. The percentiles use the 152 original held-out calls after initialization, including decoding and validation. Peak RSS is Linux’s process high-water mark, including mapped and touched weights. MiniLM’s values are Q2’s one-thread ONNX measurements, with sampled RSS. Model bytes exclude the native binding and app. Both paths exclude wallet I/O, native messaging, rendering and consent.

| Picker | Load ms | p50 ms | p95 ms | Peak RSS MiB | Model MiB |
| --- | --- | --- | --- | --- | --- |
| Q2 MiniLM | 1256 | 7.71 | 10.87 | 526 | 129.2 |
| Gemma 3 270M IT | 2098 | 299.61 | 489.16 | 1,144 | 241.4 |
| Gemma 3 270M IT + LoRA | 1300 | 173.57 | 205.48 | 1,147 | 242.1 |
| Gemma 3 1B IT | 1558 | 551.14 | 735.84 | 1,646 | 768.7 |

A syscall trace of the 270M smoke run showed no IPv4 or IPv6 calls. The RTX 3070 appears in the kernel’s GPU inventory. `nvidia-smi` could not communicate with the driver in this session, and the installed CUDA backend failed its binding probe. All results here use CPU.

## Method

- Reused Q2’s 152 held-out drafts (76 per language, 120 relevant entries, 52 drafts with no relevant entries). The 48 development drafts set MiniLM’s suggestion floors, **0.44 / 0.98**. The six exact website drafts and 32 transfer drafts are independent splits. Precision, recall and F1 are micro-averaged over picked entry IDs, including details that require consent. [Q2 methodology and baseline](local-model-q2.md)
- Every measured Gemma variant used the same Q2 learned save assignments, slot collision handling and draft guard as MiniLM. This measures swapping just the draft picker. Each prompt supplies the synthetic draft and a numbered list of available slot descriptions. It carries zero saved values. The input stays inside a quoted draft field. Greedy generation uses the checkpoint’s Gemma chat turn format, a 2,048-token context and a 32-token cap. A JSON grammar allows zero to two offered IDs. The parser rejects repeated, unknown or malformed IDs. The direct suggestion operating point accepts all valid model picks after the guard. Gemma’s IDs carry no calibrated confidence, so the MiniLM floors apply only to MiniLM and cascade routing. [Prompt and schema](../../spikes/local-model/q3/task.mjs) · [Pinned checkpoint revisions and hashes](../../spikes/local-model/q3/models.mjs)
- The 270M adaptation trains a rank-8 LoRA on query and value projections for one epoch. It uses 316 stratified examples from Q2’s synthetic request training set, with variable catalogues and some missing-label examples. Targets are JSON IDs plus the end-of-turn token. The CPU training pass took 307 seconds, and the exported adapter is 742,624 bytes. Training dequantizes the same stock Q4 model to float32 on CPU. Inference attaches an FP16 GGUF adapter to the original Q4 checkpoint. The held-out drafts played no role in sample selection or training. This is a small feasibility test of the 270M checkpoint Google designed for task fine-tuning. [Google’s 270M release](https://developers.googleblog.com/en/introducing-gemma-3-270m/) · [Training sample construction](../../spikes/local-model/q3/train-data.mjs) · [LoRA training](../../spikes/local-model/q3/train.py)
- The cascade replays Q2’s 0.12 band. It keeps MiniLM’s certain picks and lets Gemma choose only among uncertain top-two candidates. The model sees that smaller catalogue at inference, so cascade picks come from a separate run. MiniLM’s cached Q2 request time plus measured fallback time gives the warm cascade estimate. [Q2 routing](../../spikes/local-model/q2/selection.mjs) · [Q3 scoring](../../spikes/local-model/q3/summarize.mjs)
- The comparisons use synthetic bilingual drafts and a small number of vaults. Parallel languages share scenarios. Draft relevance, especially for a location in a generic cover letter or an aisle seat on an unspecified itinerary, remains a product judgement. The benchmark measures a suggestion before rendering, approval or disclosure. An offered slot or well-formed result does not authorize use. [Fixture labels](../../spikes/local-model/q2/held-out-drafts.tsv)

## What it would take to test Nano

As of 25 November 2026, there is no regular Google Chrome installation. The Playwright Chromium fixture reports **Chrome for Testing 159.0.8154.6** and has no Nano component. The ordinary Linux Stable release is **158.0.8127.88**. Google lists support from Chrome **138 for extensions** and **148 for websites**. The version label alone does not establish model availability. Nano has no quality or performance row in Q3. [Chrome release notes](https://chromereleases.googleblog.com/2026/11/stable-channel-update-for-desktop_01734282054.html) · [Prompt API availability](https://developer.chrome.com/docs/ai/prompt-api)

| Requirement for desktop text prompts | Machine |
| --- | --- |
| Supported desktop OS | Ubuntu Linux 26.04.1, supported in principle |
| At least 22 GB free on the Chrome profile volume | 354 GiB free on the local workspace volume |
| GPU with strictly more than 4 GB VRAM, or CPU with at least 16 GB RAM and four cores | Ryzen 5 5600X, six physical cores and 30 GiB system RAM meet the CPU specification. RTX 3070 with 8 GB nominally meets the VRAM specification. The driver was unavailable to this run. |
| Unmetered network for initial model download | Verify with the test browser profile. Inference can run offline after download. Chrome can purge the model below 10 GB free. |

Use a current ordinary Chrome Stable installation and a disposable local profile with no provider accounts. Load an unpacked Manifest V3 extension with a visible extension-owned page and just the synthetic corpus. Check `LanguageModel.availability()` with text input languages `['en', 'de']` and text output `['en']`. Google lists both input languages. A Run button supplies user activation for `LanguageModel.create()` and should monitor the download if needed. Record Chrome and component versions, actual component size and backend diagnostics from `chrome://on-device-internals`. After the component is ready, rerun offline with the same draft/catalogue pairs and `prompt(..., { responseConstraint: schema, omitResponseConstraintInput: true })`. Isolate drafts with fresh or cloned sessions and validate IDs again. Record download time separately from session creation and first prompt, then capture warm p50/p95, Chrome model-process memory and per-language/demos quality. Keep the trial in a document because the API is unavailable in workers. Chrome manages model updates, so rerun the fixture when the component changes. [Chrome system requirements and structured output](https://developer.chrome.com/docs/ai/prompt-api) · [Model management](https://developer.chrome.com/docs/ai/understand-built-in-model-management) · [Official extension sample](https://github.com/GoogleChrome/chrome-extensions-samples/tree/main/functional-samples/ai.gemini-on-device)

## Licence and distribution

- **Gemma 3 and 3n weights, including quantizations and fine-tunes.** Sections 3.1–3.2 permit redistribution with conditions. Put the use restrictions, including the Prohibited Use Policy and applicable-law provision, in enforceable model terms and tell downstream recipients those restrictions apply. Give recipients a copy of the Gemma agreement, mark modified files prominently and ship the required `Notice` text file with offline distributions. The current prescribed wording is “Gemma is provided under and subject to the Gemma Terms of Use found at gemma.ai/resources/terms”. A model link or attribution alone does not satisfy the pass-through. [Gemma Terms of Use §§3.1–3.2 and appendix](https://gemma.ai/resources/terms/) · [Gemma Prohibited Use Policy](https://gemma.ai/resources/prohibited-use/)
- **AGPL app.** An AGPL-3.0-or-later wallet can plausibly ship a separately licensed, independently usable GGUF alongside the app as an aggregate under AGPL §5. Apply the Gemma terms to the model files alone, and meet the AGPL’s source and redistribution obligations for the app. A single combined AGPL-covered work carrying Gemma’s extra use restrictions would create a conflict with §10. Have counsel confirm the aggregate boundary and the model terms presentation before distribution. A separate, optional desktop model package or owner-supplied local GGUF gives the clearest boundary. Distributing an official download through a bleib-controlled mirror still invokes the Gemma terms. [GNU AGPL §§5, 6, 10](https://www.gnu.org/licenses/agpl-3.0.en.html) · [Gemma distribution terms](https://gemma.ai/resources/terms/#31-distribution-and-redistribution)
- **Extension stores.** The Chrome Web Store accepts a ZIP up to **2 GB**, and Firefox AMO up to **200 MB**. They review functionality and require locally packaged executable extension code. GGUF weights and the runtime are distinct assets, and Node’s native addon needs a desktop host. Approaching either store with a browser-only variant would mean a packaged browser-compatible runtime, Gemma terms presented for the model, accurate privacy disclosures, and independent store review. A model file fitting an upload limit establishes only size eligibility. With a native companion the extension package avoids these model payloads and uses the existing authenticated connection. AMO’s data-handling rules also apply to data sent to the native app. [Chrome upload limit](https://developer.chrome.com/docs/webstore/publish) · [Chrome MV3 policy](https://developer.chrome.com/docs/webstore/program-policies/mv3-requirements) · [AMO upload limit](https://extensionworkshop.com/documentation/publish/submitting-an-add-on/) · [AMO policies](https://extensionworkshop.com/documentation/publish/add-on-policies/)
- **Measured payloads.** The measured 270M and 1B model-only ZIPs were **238 MB** and **786 MB**, respectively, using ZIP level 1. Both sample archives fit Chrome’s upload cap and exceed AMO’s cap. The LoRA alone adds 0.74 MB before compression and requires the 270M base. The 3n files are 3.03 GB and 4.54 GB raw. Their compressed archive sizes remain unmeasured.

## Swapping the draft picker

Keep the wallet daemon as the shared inference host for Chrome and Firefox. The `needs(draft, lang) → [{slot, score}]` implementation can supply a catalogue scoped to the locally available, unambiguous slots. A Gemma adapter would load a hash-pinned GGUF and its native runtime at startup or on demand, cap its context and generation, serialize or bound requests, cancel stale drafts and validate all returned IDs against the catalogue. Treat generation errors, timeouts and invalid IDs as abstentions. Represent accepted IDs as binary scores only for this spike. A production threshold needs confidence calibrated on development data and rechecked on independently labelled wallets in both languages. A cascade additionally needs a bounded uncertainty band, a warm model lifecycle and a timeout that returns MiniLM’s confirmed picks.

Keep save assignment, local entry lookup, protected-note classification, owner approval and receipt-before-disclosure in the wallet. The picker consumes only draft text and slot descriptions. Keep the manual picker available when model inference cannot return a suggestion. A Nano pilot would call the browser API from an extension-owned document, validate the returned IDs in the wallet, and use the existing MiniLM picker for Firefox or unavailable Chrome profiles. Browser-controlled model revisions make its quality gate different from a hash-pinned desktop model.

## Reproduce

Run from `spikes/local-model`. Prepare Q2 through `node q2/score.mjs` to generate the pinned MiniLM baseline cache `.cache/q2/slots.json`. Q3 reuses the pinned Q2 Node binding. Checkpoint acquisition uses the network, and evaluation reads local files. [Q2 setup](../../spikes/local-model/README.md#q2-task-needs-benchmark)

```sh
node q3/prepare.mjs gemma-3-270m gemma-3-1b
node --test q2/test.mjs q3/task.test.mjs
for model in gemma-3-270m gemma-3-1b; do
  node q3/benchmark.mjs "$model"
done
```

For 270M LoRA, install the training tooling into an ignored virtual environment. The converter comes from the llama.cpp source bundle in the existing Node dependency.

```sh
node q3/prepare.mjs training
node q2/synthesize.mjs
node q3/train-data.mjs
uv venv --python 3.14 .cache/q3/train-venv
uv pip install --python .cache/q3/train-venv/bin/python \
  --index https://download.pytorch.org/whl/cpu 'torch==2.10.0+cpu'
uv pip install --python .cache/q3/train-venv/bin/python \
  'numpy==2.4.6' 'transformers==4.57.6' 'peft==0.18.1' 'accelerate==1.12.0' \
  'safetensors==0.7.0' 'sentencepiece==0.2.1' 'protobuf==7.36.2' 'gguf==0.18.0'
git clone q2/node_modules/node-llama-cpp/llama/gitRelease.bundle .cache/q3/llama.cpp
.cache/q3/train-venv/bin/python q3/train.py
HF_HUB_OFFLINE=1 TRANSFORMERS_OFFLINE=1 \
  .cache/q3/train-venv/bin/python .cache/q3/llama.cpp/convert_lora_to_gguf.py \
  --base .cache/q3/gemma-270m-hf --outtype f16 --outfile .cache/q3/270m-slot-lora.gguf \
  .cache/q3/270m-slot-lora
node q3/benchmark.mjs gemma-3-270m-lora
node q3/summarize.mjs gemma-3-270m gemma-3-270m-lora gemma-3-1b
```

To collect the missing 3n results, run `node q3/prepare.mjs gemma-3n-e2b gemma-3n-e4b`, then run `q3/benchmark.mjs` with each model name. Add both names to the scoring command once the runs complete.

[Per-draft selections and latencies](../../spikes/local-model/q3/predictions.tsv) · [Split-level metrics and runtimes](../../spikes/local-model/q3/results.json)
