# Run X · Chrome on-device memory selection on the RTX 3070

25 November 2026 · Chrome 158.0.8127.88 · [Run V](local-model-v.md)

## Recommendation

<!-- run-x:decision:start -->

Keep Run V’s explicit picker and person-chosen profile. Wait for a complete host benchmark before choosing a model for a manual suggestion pilot.

<!-- run-x:decision:end -->

## Reproduce on the GPU host

From the desktop session outside the coding sandbox, run:

```bash
cd /home/roux/Documents/bleib-spike-model-v
spikes/local-model/x/run.sh
```

Allow roughly **20–45 minutes** for a first run on a 50–100 Mbps unmetered connection. This is a planning estimate. Chrome gets up to 20 minutes to provision Nano by default, and model speeds and CDN throughput can change the total. The pinned Qwen3.5 2B and 4B WebLLM packages are about **1.01 GiB and 2.22 GiB**, respectively. Allow **10–15 GiB** for packages, browser caches, and the Chrome-managed models. Start with **at least 32 GiB free** on the profile volume to leave room for the downloads and Chrome’s documented 22 GB free-space requirement. The runner reuses verified files from Run V’s MiniLM cache. A checkout without those files needs `uv` and Python 3.14 to rebuild the two Q2 heads. [Chrome hardware and disk requirements](https://developer.chrome.com/docs/ai/prompt-api#review_the_hardware_requirements).

The command runs the offline unit tests, probes Chrome, and benchmarks Nano and the two WebLLM models in sequence. It prints download and load progress, then the count and ID of every draft. It writes stage results to `spikes/local-model/x/results/*.json` and updates the tables below. Model files and dedicated profiles live under `spikes/local-model/x/.cache/`. Re-running reuses verified downloads. Each WebLLM run creates a fresh profile and removes it at the end. `BLEIB_X_NANO_WAIT_MIN=30` extends the download budget. `BLEIB_CHROME` selects a different Chrome binary, `BLEIB_X_WEBGPU_FLAGS` passes extra WebGPU launch flags, and `BLEIB_X_GPU_INDEX` selects the device sampled by `nvidia-smi`. The default launches the unpacked binary with Playwright’s default arguments removed and Chrome’s sandbox disabled for the dedicated test profiles. `BLEIB_X_CHROME_SANDBOX=1` uses the user-namespace sandbox when the desktop host supports it.

To regenerate tables from the existing host artifacts:

```bash
(cd spikes/local-model/x && node summarize.mjs)
```

## Workload and methods

Run X scores the 152 original holdout drafts, the frozen 40-memory and 104-draft second wallet, and the six English and German website demos. Run V supplies the labels, slot descriptions, blank and bulk-disclosure guards, schema and strict output parser. The direct paths use the fixed wallet slot assignments. The MiniLM cascade indexes the synthetic notes with the Run V save head and scores drafts with its request head. It keeps picks above the confidence band and passes only the shortlist within ±0.12 of the Run V rank floors of 0.44 and 0.98 to the reasoner. The reasoner receives category descriptions and a draft. The schema allows up to two numbered IDs, which the harness validates and maps locally. [Frozen Run V corpus](../../spikes/local-model/v/corpus.mjs), [Run V picker](../../spikes/local-model/v/pick.mjs).

The Prompt API runs in the MV3 extension page. The runner loads it through the DevTools pipe and clicks a real button for each language, with no Playwright component-update or background-networking suppression. Each draft uses an independent session clone. Chromium controls the installed backend and revision. The broker snapshot records the registered assets and backend, including Gemma 4 entries if Chrome exposes them. WebLLM 0.2.89 runs on a loopback page in the same Chrome binary, with hardware WebGPU, `shader-f16`, 2,048 tokens of context, JSON-schema decoding, temperature 0 and thinking disabled. The two Qwen3.5 q4f16 builds compare 2B and 4B at the same quantization. MLC’s catalog estimates 2,245 and 3,868 MB VRAM respectively. The runner stages and verifies the downloads before serving weights and model-specific kernels locally. [Chrome Prompt API](https://developer.chrome.com/docs/ai/prompt-api), [DevTools Extensions domain](https://chromedevtools.github.io/devtools-protocol/tot/Extensions/), [WebLLM catalog](https://github.com/mlc-ai/web-llm/blob/main/src/config.ts), [2B weights](https://huggingface.co/mlc-ai/Qwen3.5-2B-q4f16_1-MLC/tree/dd74e9c8a20c4546df85c844103bff87b6dcacad), [4B weights](https://huggingface.co/mlc-ai/Qwen3.5-4B-q4f16_1-MLC/tree/44b42469f9e192814bfd90440e3b377d89ba7a13).

## Host status

<!-- run-x:availability:start -->

Host run pending. The runner records Chrome’s adapter, component policy and broker state.

<!-- run-x:availability:end -->

## Holdout quality

The four language columns give entry-level micro-averaged precision / recall / F1 in percent. An empty-label false offer counts once per draft. Literal blanks and wrong offers of ask-only entries have separate columns. An invalid model response abstains. A dash indicates a missing measurement or incomplete slice. Precision is undefined when a completed slice makes zero picks.

<!-- run-x:quality:start -->

| Picker | Drafts | Original EN | Original DE | Second EN | Second DE | Empty labels original / second | Literal blanks offered | Wrong ask-only picks | Invalid |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Gemini Nano | 0/262 | — | — | — | — | — · — | — | — | — |
| Qwen3.5 2B | 0/262 | — | — | — | — | — · — | — | — | — |
| MiniLM + Qwen3.5 2B | 0/262 | — | — | — | — | — · — | — | — | — |
| Qwen3.5 4B | 0/262 | — | — | — | — | — · — | — | — | — |
| MiniLM + Qwen3.5 4B | 0/262 | — | — | — | — | — · — | — | — | — |

<!-- run-x:quality:end -->

### Website demos

The expected pairs are seat + diet, role + home city, and diet + serves two.

<!-- run-x:demos:start -->

| Picker | Lisbon EN / DE | Cover letter EN / DE | Dinner EN / DE | Exact |
| --- | --- | --- | --- | --- |
| Gemini Nano | — / — | — / — | — / — | — |
| Qwen3.5 2B | — / — | — / — | — / — | — |
| MiniLM + Qwen3.5 2B | — / — | — / — | — / — | — |
| Qwen3.5 4B | — / — | — / — | — / — | — |
| MiniLM + Qwen3.5 4B | — / — | — / — | — / — | — |

<!-- run-x:demos:end -->

### Timing and resources

WebLLM provision includes fetching and verifying any missing assets. First load begins after the files are staged and includes browser-cache population and GPU initialization. Cascade load estimates WebLLM and MiniLM initialization in series, with indexing reported separately. The reasoner remains loaded between the direct and cascade passes. Nano first load sums the two language session creation times and can include model provisioning. The language results preserve the individual creation timings and download events. Warm percentiles include fast abstentions, and the fallback percentiles cover only routed generation. RAM is sampled Chrome process-tree RSS. VRAM is sampled whole-device memory from `nvidia-smi`, with the idle browser reading as the baseline. Desktop activity can affect the VRAM increase.

<!-- run-x:cost:start -->

| Picker | Assets MiB | Provision / first load / index ms | First inference ms | Warm p50 / p95 ms | Routed original / second / demos | Fallback p50 / p95 ms | RAM peak / increase MiB | VRAM peak / increase MiB |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Gemini Nano | — | — / — / — | — | — / — | — | — / — | — / — | — / — |
| Qwen3.5 2B | — | — / — / — | — | — / — | — | — / — | — / — | — / — |
| MiniLM + Qwen3.5 2B | — | — / — / — | — | — / — | — | — / — | — / — | — / — |
| Qwen3.5 4B | — | — / — / — | — | — / — | — | — / — | — / — | — / — |
| MiniLM + Qwen3.5 4B | — | — / — / — | — | — / — | — | — / — | — / — | — / — |

<!-- run-x:cost:end -->

## Sandbox verification

The bundled Chrome 158.0.8127.88 launched and loaded the unpacked MV3 benchmark. With component updates enabled, the Prompt API reported `downloadable` in English and German, then `downloading` after a trusted click. An initial seven-minute attempt and a one-minute runner retry produced no download progress events. After the retry, Chrome’s broker showed a foreground Nano v3 CPU install at 0% and the Prompt API waiting for assets. `chrome://components` reported an update error of unknown cause. [Sandbox evidence](../../spikes/local-model/x/results/sandbox-evidence.json).

Chrome’s broker loaded the optimization guide manifest and reported `ServiceCrash` for the device performance class. It saw 0 MiB of VRAM and enough disk, with the feature and user setting enabled. `chrome://policy` reported no configured policies. Linux exposed neither `/dev/dri` nor `/dev/nvidia*`, `nvidia-smi` could not reach the driver, and Chrome returned no WebGPU adapter. The sandbox run produced zero actual model picks and no inference timings.

Six offline unit tests passed. The offline Chrome smoke processed all 262 drafts through the extension with a mocked Prompt API, then ran both WebLLM paths with a mocked generator and the real Run V MiniLM encoder and heads. MiniLM routed 20 original holdout drafts, 11 second-wallet drafts and zero demos, matching Run V. To repeat the smoke after dependency installation with a prepared Run V cache, run `(cd spikes/local-model/x && node verify-browser.mjs)`.
