# Run AF · Local encoders for the bleib needs picker

25 November 2026 · Linux x86-64 · branch `spike-model-v`

## Decision

Keep **MiniLM int8 as the existing opt-in encoder** and **the hashed-subword classifier as the low-end floor**. Every neural variant exceeded both the 2.5 s browser warm-up target and the entire 150 MB idle-increase budget for bleib. The smallest neural package was Granite 97M q4 at 59 MB. That build warmed up in 5.8 s and added 319 MB of idle RSS. The hashed-subword control warmed up in 30 ms, added 18.5 MB, and fit in a 0.34 MB ZIP.

Harrier int8 had the highest overall precision on both held-outs at 90.7% and 96.7%, up from MiniLM's 87.2% and 88.6%. Fresh recall declined from 45.3% to 33.7%, and the 221 MB ZIP exceeds AMO's upload limit. Granite 311M q4 had the highest F1 on both wallets at 79.7% and 73.4%. Its precision fell to 82.9% and 80.6%, and it added 680 MB idle.

## Licence and candidate selection

The proposed distribution is a commercial AGPL-3.0-or-later app bundling weights as local assets. MIT and Apache-2.0 permit commercial use and redistribution. For MIT include the copyright and permission notices. For Apache-2.0 include the licence, retain applicable attribution and NOTICE terms, and mark converted or quantized files as modified. Checked on 25 November 2026. [MIT text](https://opensource.org/license/mit), [Apache-2.0 text](https://www.apache.org/licenses/LICENSE-2.0), [AGPL-3.0 text](https://www.gnu.org/licenses/agpl-3.0.html).

| Model | Release | Weights licence | Gate |
| --- | --- | --- | --- |
| Sentence Transformers multilingual MiniLM L12 v2 | June 2021 | Apache-2.0 | Pass, incumbent. [Card](https://huggingface.co/sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2), [release history](https://huggingface.co/sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2/commits/main) |
| Microsoft Harrier OSS v1 270M | 27 Mar 2026 per MTEB, Hub repository opened 30 Mar | MIT | Pass. [Card](https://huggingface.co/microsoft/harrier-oss-v1-270m), [ONNX card](https://huggingface.co/onnx-community/harrier-oss-v1-270m-ONNX) |
| IBM Granite Embedding Multilingual R2 97M | 29 Apr 2026 | Apache-2.0 | Pass. [Card](https://huggingface.co/ibm-granite/granite-embedding-97m-multilingual-r2) |
| IBM Granite Embedding Multilingual R2 311M | 29 Apr 2026 | Apache-2.0 | Pass. [Card](https://huggingface.co/ibm-granite/granite-embedding-311m-multilingual-r2) |
| Jina Embeddings v5 Text Nano | 17 Feb 2026 | CC BY-NC 4.0 | Excluded. The public licence limits use and redistribution to noncommercial purposes. [Card](https://huggingface.co/jinaai/jina-embeddings-v5-text-nano), [licence text](https://creativecommons.org/licenses/by-nc/4.0/legalcode.en) |
| Jina Embeddings v5 Text Small | 17 Feb 2026 | CC BY-NC 4.0 | Excluded on the same terms. MTEB also lists 596M parameters. [Card](https://huggingface.co/jinaai/jina-embeddings-v5-text-small), [licence text](https://creativecommons.org/licenses/by-nc/4.0/legalcode.en) |

The official leaderboard returned **66.55** mean task for Harrier, **65.52** for Jina Nano, **55.96 / 51.92** for Granite 311M / 97M, and **48.73** for MiniLM, all over 131 tasks. No additional 2026 dense text model at or below 350M with a complete aggregate exceeded Harrier. F2LLM-v2-330M scored 60.84 and EmbeddingGemma 2's text path scored 60.52. Jina Small covered 128 tasks without a full aggregate. Tarka's “350M” registers as 354M with 17 tasks and a 2025 release date. The API assigns MiniLM a product date that differs from its Hub release history. [MTEB Multilingual v2](https://leaderboard.mteb.org/benchmark/MTEB-Multilingual-v2), [score API](https://mteb-leaderboard-backend.hf.space/v1/benchmarks/MTEB%28Multilingual%2C%20v2%29/scores), [extracted rows](../../spikes/local-model/af/leaderboard.tsv), [EmbeddingGemma 2 card](https://huggingface.co/google/embeddinggemma-2).

## Procedure

- Ran one encoder at a time in the order MiniLM, Harrier, Granite 97M, Granite 311M, then the hashed-subword floor. Node and Chromium ran in separate processes. Chromium used an unpacked offline MV3 extension with local assets, one WASM thread, CDP 4× CPU throttling and GPU disabled on an AMD Ryzen 5 5600X. Node used one ORT CPU thread for measurement and serves as the unthrottled reference.
- Used pinned FP32 ONNX exports and the published int8 graphs for MiniLM and Granite. Exported Harrier int8 locally with dynamic per-channel weights and reduced range on MatMul and Gather, after the published blockwise 8-bit graph proved slow on this CPU. Also made a range-reduced int8 export for Granite 97M after the published graph failed embedding parity. Built q4 locally from each FP32 graph with symmetric 4-bit blocks of 32 on constant MatMul and Gather weights. The q4 Gather conversion includes large token embedding tables. MiniLM uses mean pooling, Granite uses CLS, and Harrier uses the final non-padding token with Microsoft's documented `Instruct: …\nQuery: …` format. The two Harrier instructions were written for request and save classification before measuring. Harrier performs pooling in the graph. All embeddings are L2-normalized, with a 128-token cap. [MiniLM card](https://huggingface.co/sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2), [Microsoft card](https://huggingface.co/microsoft/harrier-oss-v1-270m), [IBM reference](https://huggingface.co/ibm-granite/granite-embedding-97m-multilingual-r2#usage), [ORT quantization](https://onnxruntime.ai/docs/performance/model-optimizations/quantization.html#quantize-to-int4uint4).
- Checked token IDs and embedding cosine on ten EN, DE and JA prompts against the maker checkpoints loaded with Transformers and PyTorch on CPU. Reused each quantized variant's fitted heads and thresholds in an FP32 dev pass to measure the effect of changing encoder precision while keeping the picker operating point fixed.
- Refit both 51-slot heads for every quantized variant with the frozen Q2 generator and balanced logistic regression. There were 7,734 request and 4,841 save examples. Feature generation used up to four ORT intra-op threads on the two largest candidates, within a single model process. All timed inference used one thread. The MiniLM int8 heads reproduced Run V's SHA-256 digests byte for byte. Chose top-one and top-two thresholds on the same 48 dev drafts using the Run V 0.02 grid. Among pairs with at least eight offers and at least 90% precision in each dev language, maximize pooled F0.5, then precision, then threshold sum and first threshold. If none qualified, use the same ranking over all threshold pairs. Chromium received the frozen Node thresholds. The save-head floor and margin, slot collision handling, two-offer cap and abstention guard came from Q2/V.
- Evaluated 152 original drafts, 104 fresh drafts against 40 fresh memories, and the three bilingual website demos. Calculated micro scores over memory IDs. A false offer on a negative is a draft that got at least one offer with no labelled relevant memory. The two literal blank drafts are in the fresh set, one EN and one DE. An exact-text check found zero training overlap for the original and fresh held-outs. The benchmark emits proposed IDs inside the harness.
- Measured cold session load from the already open extension page, then the first real inference. Warm-up is the sum. Draft percentiles cover real hold-out and demo texts including abstentions and use nearest rank. Chromium's baseline and peak are process-tree RSS and idle is the median of five samples after a two-second quiescence. Node uses process RSS and samples at a one-second idle point. ZIP sizes include the minimal benchmark shell, both heads, tokenizer, graph and WASM where applicable. Each Chromium run closed the profile and checked for surviving processes. File cache eviction used per-file `fsync` and `POSIX_FADV_DONTNEED` with a fresh profile each time. Host-wide cache eviction requires privileges outside this worktree. Each variant used one fresh browser profile. The process-tree RSS sum can count resident shared pages more than once. The throttle emulates slower CPU execution on this machine.

Firefox Add-ons lists a **200 MB** upload limit and Chrome Web Store API lists **2 GB**. The ZIP sizes measure the benchmark package. A release also carries the rest of bleib and its required notices. [AMO submission](https://extensionworkshop.com/documentation/publish/submitting-an-add-on/), [Chrome upload API](https://developer.chrome.com/docs/webstore/using-api).

## Quality in Chromium

Values are precision / recall / F1 in percent. Negatives and literal blanks count drafts with at least one false offer. † indicates the dev precision gate had no qualifying pair.

| Model | Dev thresholds | Original overall | Fresh overall | Original negatives | Fresh negatives | Fresh blanks | Demos exact |
| --- | --- | --- | --- | --- | --- | --- | --- |
| MiniLM int8 | 0.76 / 0.98 | 87.2 / 56.7 / 68.7 | 88.6 / 45.3 / 60.0 | 7/52 | 3/23 | 0/2 | 0/6 |
| MiniLM q4 | 0.78 / 0.98 | 87.5 / 58.3 / 70.0 | 85.7 / 41.9 / 56.3 | 6/52 | 3/23 | 0/2 | 0/6 |
| Harrier int8 | 0.88 / 0.96 | 90.7 / 56.7 / 69.7 | 96.7 / 33.7 / 50.0 | 5/52 | 1/23 | 0/2 | 0/6 |
| Harrier q4 | 0.42 / 0.96 | 84.2 / 70.8 / 76.9 | 88.2 / 52.3 / 65.7 | 11/52 | 3/23 | 0/2 | 0/6 |
| Granite 97M published int8 | 0.62 / 1.01 † | 19.0 / 10.0 / 13.1 | 17.6 / 3.5 / 5.8 | 14/52 | 3/23 | 0/2 | 0/6 |
| Granite 97M dynamic int8 | 0.70 / 0.96 | 81.7 / 63.3 / 71.4 | 89.8 / 51.2 / 65.2 | 14/52 | 2/23 | 0/2 | 0/6 |
| Granite 97M q4 | 0.52 / 0.98 | 79.6 / 65.0 / 71.6 | 80.4 / 52.3 / 63.4 | 14/52 | 4/23 | 0/2 | 0/6 |
| Granite 311M published int8 | 0.52 / 0.88 | 84.1 / 75.0 / 79.3 | 79.7 / 64.0 / 71.0 | 11/52 | 7/23 | 0/2 | 0/6 |
| Granite 311M q4 | 0.42 / 0.90 | 82.9 / 76.7 / 79.7 | 80.6 / 67.4 / 73.4 | 14/52 | 7/23 | 0/2 | 0/6 |
| Hashed-subword floor | 0.18 / 0.46 † | 85.4 / 29.2 / 43.5 | 81.2 / 15.1 / 25.5 | 2/52 | 1/23 | 0/2 | 0/6 |

| Model | Original EN | Original DE | Fresh EN | Fresh DE |
| --- | --- | --- | --- | --- |
| MiniLM int8 | 85.0 / 56.7 / 68.0 | 89.5 / 56.7 / 69.4 | 84.6 / 51.2 / 63.8 | 94.4 / 39.5 / 55.7 |
| MiniLM q4 | 87.8 / 60.0 / 71.3 | 87.2 / 56.7 / 68.7 | 82.6 / 44.2 / 57.6 | 89.5 / 39.5 / 54.8 |
| Harrier int8 | 92.7 / 63.3 / 75.2 | 88.2 / 50.0 / 63.8 | 93.8 / 34.9 / 50.8 | 100.0 / 32.6 / 49.1 |
| Harrier q4 | 80.8 / 70.0 / 75.0 | 87.8 / 71.7 / 78.9 | 85.7 / 55.8 / 67.6 | 91.3 / 48.8 / 63.6 |
| Granite 97M published int8 | 18.8 / 10.0 / 13.0 | 19.4 / 10.0 / 13.2 | 33.3 / 4.7 / 8.2 | 9.1 / 2.3 / 3.7 |
| Granite 97M dynamic int8 | 82.6 / 63.3 / 71.7 | 80.9 / 63.3 / 71.0 | 88.0 / 51.2 / 64.7 | 91.7 / 51.2 / 65.7 |
| Granite 97M q4 | 79.6 / 65.0 / 71.6 | 79.6 / 65.0 / 71.6 | 82.8 / 55.8 / 66.7 | 77.8 / 48.8 / 60.0 |
| Granite 311M published int8 | 82.8 / 80.0 / 81.4 | 85.7 / 70.0 / 77.1 | 75.0 / 62.8 / 68.4 | 84.8 / 65.1 / 73.7 |
| Granite 311M q4 | 82.8 / 80.0 / 81.4 | 83.0 / 73.3 / 77.9 | 79.5 / 72.1 / 75.6 | 81.8 / 62.8 / 71.1 |
| Hashed-subword floor | 89.5 / 28.3 / 43.0 | 81.8 / 30.0 / 43.9 | 80.0 / 18.6 / 30.2 | 83.3 / 11.6 / 20.4 |

Website demos show the IDs actually offered. — means abstain.

| Model | LIS-en | LIS-de | COVER-en | COVER-de | DINNER-en | DINNER-de |
| --- | --- | --- | --- | --- | --- | --- |
| Gold | H01, H02 | H01, H02 | H03, H04 | H03, H04 | H02, H05 | H02, H05 |
| MiniLM int8 | — | — | — | — | — | — |
| MiniLM q4 | — | — | — | — | — | — |
| Harrier int8 | H01 | H01 | — | — | — | — |
| Harrier q4 | H01 | H01 | — | — | — | — |
| Granite 97M published int8 | H01 | H01 | — | — | H02 | H02 |
| Granite 97M dynamic int8 | — | H01 | — | — | — | — |
| Granite 97M q4 | H02 | H01 | — | — | — | — |
| Granite 311M published int8 | H02 | — | — | H03 | — | H05 |
| Granite 311M q4 | H02 | H01 | — | H03 | — | H02 |
| Hashed-subword floor | H01 | H01 | — | — | — | — |

## Cost

Times are milliseconds unless marked. MB is decimal. Browser warm-up includes load and first inference.

| Model | Cold ms | First ms | Warm-up s | p50 / p95 ms | Peak RSS MB (increase) | Idle RSS increase MB | ZIP / unpacked MB |
| --- | --- | --- | --- | --- | --- | --- | --- |
| MiniLM int8 | 5272 | 228 | 5.500 | 77.8 / 101.6 | 1518.8 (+785.2) | +510.8 | 80.91 / 150.43 |
| MiniLM q4 | 4589 | 421 | 5.010 | 303.5 / 357.0 | 1375.8 (+606.3) | +372.7 | 76.72 / 106.11 |
| Harrier int8 | 8377 | 614 | 8.991 | 483.9 / 586.9 | 1795.5 (+1026.9) | +481.2 | 221.15 / 338.16 |
| Harrier q4 | 6050 | 1806 | 7.856 | 1830.1 / 2075.3 | 1541.4 (+770.1) | +382.0 | 177.31 / 236.91 |
| Granite 97M published int8 | 5918 | 246 | 6.164 | 89.2 / 121.7 | 1463.2 (+694.4) | +495.0 | 75.03 / 138.21 |
| Granite 97M dynamic int8 | 5953 | 251 | 6.204 | 93.3 / 129.7 | 1473.9 (+706.1) | +498.0 | 77.92 / 138.51 |
| Granite 97M q4 | 5217 | 585 | 5.802 | 377.9 / 443.8 | 1364.6 (+601.0) | +319.4 | 59.00 / 101.63 |
| Granite 311M published int8 | 12692 | 455 | 13.148 | 312.2 / 416.9 | 2277.3 (+1510.0) | +1016.0 | 192.54 / 362.17 |
| Granite 311M q4 | 9836 | 1501 | 11.337 | 1490.3 / 1769.6 | 1819.1 (+1054.3) | +679.8 | 170.57 / 245.23 |
| Hashed-subword floor | 24 | 7 | 0.030 | 0.1 / 0.8 | 790.1 (+18.6) | +18.5 | 0.34 / 0.84 |

Node CPU reference.

| Model | Cold / first ms | p50 / p95 ms | Peak / idle RSS increase MB | Original P/R/F1 | Fresh P/R/F1 |
| --- | --- | --- | --- | --- | --- |
| MiniLM int8 | 810.4 / 7.0 | 5.85 / 7.88 | +505.0 / +505.0 | 88.3 / 56.7 / 69.0 | 86.7 / 45.3 / 59.5 |
| MiniLM q4 | 699.9 / 14.4 | 13.80 / 17.16 | +459.3 / +457.2 | 87.5 / 58.3 / 70.0 | 85.7 / 41.9 / 56.3 |
| Harrier int8 | 1008.3 / 37.7 | 39.40 / 49.31 | +619.5 / +614.6 | 91.9 / 56.7 / 70.1 | 93.8 / 34.9 / 50.8 |
| Harrier q4 | 1087.2 / 82.4 | 87.09 / 104.65 | +475.7 / +475.7 | 84.2 / 70.8 / 76.9 | 88.2 / 52.3 / 65.7 |
| Granite 97M published int8 | 994.4 / 11.4 | 7.36 / 9.98 | +474.5 / +474.5 | 20.0 / 4.2 / 6.9 | 2.9 / 3.5 / 3.2 |
| Granite 97M dynamic int8 | 997.7 / 11.2 | 7.42 / 10.14 | +483.3 / +483.3 | 81.9 / 64.2 / 72.0 | 83.7 / 47.7 / 60.7 |
| Granite 97M q4 | 906.6 / 21.0 | 17.96 / 21.74 | +426.4 / +385.3 | 78.6 / 64.2 / 70.6 | 78.8 / 47.7 / 59.4 |
| Granite 311M published int8 | 2170.6 / 21.6 | 26.74 / 36.53 | +763.9 / +751.9 | 83.8 / 73.3 / 78.2 | 79.7 / 64.0 / 71.0 |
| Granite 311M q4 | 1806.8 / 56.6 | 70.97 / 84.16 | +609.2 / +583.1 | 82.9 / 76.7 / 79.7 | 80.6 / 67.4 / 73.4 |
| Hashed-subword floor | 2.1 / 1.3 | 0.08 / 0.14 | +11.6 / +11.6 | 85.4 / 29.2 / 43.5 | 81.2 / 15.1 / 25.5 |

## Embedding parity and quantization check

Cosine is the minimum across ten probes. Dev columns use the same fitted heads and thresholds for both encoder precisions.

| Model | FP32 vs maker | Quantized vs FP32 | Quantized dev P/R/F1 | FP32 dev P/R/F1 |
| --- | --- | --- | --- | --- |
| MiniLM int8 | 1.000000 | 0.992764 | 96.2 / 50.0 / 65.8 | 100.0 / 50.0 / 66.7 |
| MiniLM q4 | 1.000000 | 0.985143 | 100.0 / 48.0 / 64.9 | 100.0 / 50.0 / 66.7 |
| Harrier int8 | 1.000000 | 0.981136 | 100.0 / 50.0 / 66.7 | 100.0 / 48.0 / 64.9 |
| Harrier q4 | 1.000000 | 0.980552 | 97.0 / 64.0 / 77.1 | 93.5 / 58.0 / 71.6 |
| Granite 97M published int8 | 1.000000 | 0.686896 | 25.0 / 4.0 / 6.9 | 23.1 / 12.0 / 15.8 |
| Granite 97M dynamic int8 | 1.000000 | 0.944434 | 96.2 / 50.0 / 65.8 | 100.0 / 46.0 / 63.0 |
| Granite 97M q4 | 1.000000 | 0.983966 | 100.0 / 56.0 / 71.8 | 96.6 / 56.0 / 70.9 |
| Granite 311M published int8 | 1.000000 | 0.992960 | 100.0 / 72.0 / 83.7 | 100.0 / 68.0 / 81.0 |
| Granite 311M q4 | 1.000000 | 0.996217 | 100.0 / 72.0 / 83.7 | 100.0 / 70.0 / 82.4 |

### Granite 97M and Run V

The published 97M int8 graph reproduced Run V's low result with **13.1% F1** on the original held-out. Token IDs and FP32 embeddings agreed with the maker checkpoint. The FP32 export also matched all three intended query–passage pairs in IBM's EN/DE/JA example. Minimum cosine fell to **0.687** in the published int8 artifact, and its heads never met the dev precision gate. Requantizing the same FP32 graph raised the minimum to **0.944** for dynamic int8 and **0.984** for q4. After retraining, dynamic int8 reached **71.4% / 65.2% F1** on the original and fresh held-outs. These checks implicate the published 97M quantized artifact. The conversion changed both channel granularity and range, so it leaves the exact kernel-level cause open. Granite 311M's published int8 graph passed the same check at 0.993 minimum cosine.

## Reproduce

Run the commands from the worktree on Linux with Node 24.22.2, Python 3, uv, curl, flock and zip. This run used Playwright 1.63.0 with the locally installed Chromium 151.0.7922.34. Both ORT builds were 1.31.1. Prepare downloads public assets from pinned Hugging Face revisions. Model inference, training, fixture scoring and browser measurement run offline.

```sh
cd /home/roux/Documents/bleib-spike-model-v/spikes/local-model/af
export TMPDIR=/home/roux/.cache/bleib-codex-tmp
export BLEIB_CHROMIUM="$HOME/.cache/ms-playwright/chromium-1234/chrome-linux64/chrome"

bash setup.sh
mkdir -p .cache
curl -fsSL 'https://mteb-leaderboard-backend.hf.space/v1/benchmarks/MTEB%28Multilingual%2C%20v2%29/scores' \
  -o .cache/mteb-scores.json
python3 leaderboard.py .cache/mteb-scores.json > leaderboard.tsv

bash run.sh minilm harrier granite97 granite311 static
node report.mjs
node --test ../v/test.mjs
```

The runner accepts individual model names for a sequential retry. `models.mjs` pins the model and ONNX revisions. The tracked JSON contains the trained head and graph hashes, parity probes, dev thresholds, quality counts and timings. The TSV contains per-draft gold IDs and offers for both runtimes. The model files, training vectors and browser profiles are ignored. [Results JSON](../../spikes/local-model/af/results.json), [predictions TSV](../../spikes/local-model/af/predictions.tsv).

Verification covered the four Run V tests and eight Q2 tests. The saved predictions cover 262 drafts per runtime for each of ten variants. The final lock and Chromium profile cleanup both passed.
