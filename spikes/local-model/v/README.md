# Run V reproduction

Run from this directory with Node 24, Python 3.14, uv, curl and zip. Keep model downloads, browser profiles, model heads and intermediate files under the ignored `.cache/` directory. Download public model files before running any inference.

```sh
npm ci --ignore-scripts
npx playwright install chromium firefox
uv venv --python 3.14 .cache/train-venv
uv pip install --python .cache/train-venv/bin/python -r ../q2/requirements.txt
npm test

node download.mjs minilm granite gemma qwen3 qwen35
node train.mjs minilm
node train.mjs granite
node train.mjs static
node probe.mjs

for model in minilm granite static similarity profile; do
  node browser.mjs "$model" chromium
  node browser.mjs "$model" firefox
done
node browser.mjs gemma chromium
node browser.mjs qwen3 chromium
node browser.mjs cascade chromium
node summarize.mjs
```

The supplemental direct Qwen3.5 run uses `BLEIB_SMOKE=hero node browser.mjs qwen35 chromium`. Remove the environment variable for a full 310-draft run. CPU inference with the full catalogue is slow. `node browser.mjs gemma firefox` is a supplemental runtime check with a long CPU workload on the tested Linux build.

The cascade keeps both models in one browser document. Its timing includes classification and any routed generation. Its peak RSS samples both resident models. Use `BLEIB_SMOKE=1` to run just the English dinner fixture, or pass a single draft ID in that variable. A smoke file never enters the quality tables. Set `BLEIB_CHROMIUM` or `BLEIB_FIREFOX` to use a previously installed Playwright executable.

Use the WebLLM preflight on both browsers. A WebGPU fallback adapter is a CPU device. The Qwen3 MLC build also needs `shader-f16`.

```sh
BLEIB_PROBE_ONLY=1 BLEIB_SMOKE=1 node browser.mjs mlc chromium
node download.mjs mlc
node browser.mjs mlc chromium
```

On Linux, set `BLEIB_WEBGPU_FLAGS` to a space-separated flag set to try a hardware driver after reading `node probe.mjs` output. The harness loads MLC kernels from the package instead of the default CDN. Chromium extension runs use a fresh offline profile. Firefox temporarily installs the extension and drives its page using a local test-only iframe. Wllama uses a loopback document with no external requests, cross-origin isolation and four CPU threads. The compact direct Qwen3.5 comparison uses six threads and groups drafts by wallet and language. The production extension needs a packaged worker integration for that path.

The first precision operating point for MiniLM uses Q2's floors. New floors consume only the 48 original calibration drafts. The new wallet and labels are hash-checked. The two test files exclude prompt tuning, training and calibration. Do not change their hashes to accommodate model behavior.

`results.json` includes provenance, peak browser process-tree RSS, score counts and per-language metrics. `predictions.tsv` lists the per-draft choices on both test wallets and the three website demos. See the [report](../../../docs/research/local-model-v.md) for coverage and hardware limitations.
