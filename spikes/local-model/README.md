# Local relevance benchmark

The [research report](../../docs/research/local-model.md) explains the labels, results and release implications. `results.json` contains the measurements and asset checksums. `predictions.tsv` lists each held-out Node selection alongside the actual wallet baseline and its browser serialization.

## Reproduce

Run the commands from this directory. The first two commands acquire dependencies and public weights. All later commands use local files, synthetic inputs and the installed Playwright browsers. Use a fresh Linux x86-64 checkout for the size and process-memory measurements.

```sh
ONNXRUNTIME_NODE_INSTALL=skip npm ci --ignore-scripts --no-audit --no-fund
npm run prepare-models
npm test
PLAYWRIGHT_BROWSERS_PATH=/tmp/bleib-playwright npm run benchmark
node desktop-size.mjs > .cache/desktop-payload.json
node report.mjs .cache/desktop-payload.json
```

The asset revisions are in `candidates.mjs`. To rerun just one combination, use `npm run benchmark -- firefox minilm-int8`. Each combination gets a fresh process or browser profile. Failed model loads are recorded as results. The packaging measurements use `zip` and `dpkg-deb`. Model files, raw scores, archives and profiles are ignored.

Firefox's test harness installs the temporary add-on over the browser's loopback DevTools protocol. An intercepted local fixture drives a packaged extension iframe, then the browser goes offline before scoring. Chromium drives a top-level extension page. Both use the bundled CPU WASM backend. The fixture iframe and its message listener are for measurement only.

## Q2 task-needs benchmark

The [Q2 report](../../docs/research/local-model-q2.md) contains the recommendation, filter audit, category results and three website demos. The unchanged Q corpus provides calibration and the original holdout. Q2 adds a demo vault and a transfer vault. The [results](q2/results.json) include per-category EN/DE precision, recall, F1 and counts. The [predictions](q2/predictions.tsv) identify the selected entry IDs. A dash in the baseline columns outside the original test split indicates that those cases were outside the baseline audit.

Run from `spikes/local-model` on Linux x86-64 with Node 24, Python 3.14 and the package tools available. The setup commands use the network to acquire tools and public models. Preparation pins the model revisions. The Q2 GGUF fetch also checks SHA-256 before exposing the files to the runner. All weights, generated training arrays and work directories stay in the ignored `.cache` directory.

```sh
ONNXRUNTIME_NODE_INSTALL=skip npm ci --ignore-scripts --no-audit --no-fund
npm ci --prefix q2 --ignore-scripts --no-audit --no-fund
npm run prepare-models -- minilm-int8
node q2/prepare.mjs
uv venv --python 3.14 .cache/q2/venv
uv pip sync --python .cache/q2/venv/bin/python q2/requirements.txt
mkdir -p .cache/q2/wallet-setup
git -C ../.. archive HEAD wallet | tar -x -C .cache/q2/wallet-setup
(cd .cache/q2/wallet-setup/wallet && npm ci --ignore-scripts --no-audit --no-fund)
```

The last three lines prime the npm cache for the offline desktop size build from an extracted copy of the wallet.

```sh
node --test test.mjs q2/test.mjs
node q2/synthesize.mjs
node q2/featurize.mjs
OPENBLAS_NUM_THREADS=1 .cache/q2/venv/bin/python q2/fit.py
node q2/static-features.mjs
OPENBLAS_NUM_THREADS=1 .cache/q2/venv/bin/python q2/fit.py --static
node q2/verify-static.mjs
node q2/score.mjs
node q2/score.mjs static
node q2/reason.mjs qwen-0.6b
node q2/reason.mjs qwen-1.7b
node q2/cascade.mjs
node q2/filter-audit.mjs
node q2/package-size.mjs > .cache/q2/package.log
node q2/package-size.mjs static > .cache/q2/static-package.log
node q2/summarize.mjs
```

Inference uses local files and synthetic drafts. The reasoner requires a local prebuilt CPU binding and disables download and build fallbacks. The size script archives the wallet into an ignored local directory, builds with npm offline, and adds only the measured relevance assets before repacking. It measures archive and installed file size without wiring the selector into the wallet. To run a small reasoner smoke test without changing cached results, add a draft ID prefix such as `S03` after the model name.
