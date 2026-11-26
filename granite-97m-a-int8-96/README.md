# Profiled Granite needs picker

Keep this directory structure intact when bundling it into the local extension. `profile.json` records the token cap and encoder graph optimization settings applied by `encoder.mjs`. The picker uses the profile’s sealed rank floors in `operating.json`.

Bundle `picker.mjs` with `@huggingface/tokenizers` 0.2.0 and `onnxruntime-web/wasm` from `onnxruntime-web` 1.31.1. Supply the local URL of ONNX Runtime Web’s WASM assets. The browser benchmark uses one WASM thread, creates one picker, runs a first request and reuses its three sessions for subsequent drafts.

```js
import * as ort from 'onnxruntime-web/wasm';
import { openPicker } from './picker.mjs';

const picker = await openPicker(ort, new URL('./', import.meta.url), new URL('./runtime/', import.meta.url).href);
const index = await picker.index(savedEntries); // Array of { id, text } objects
const offers = await picker.pick(draft, index); // Array of { slot, id } objects
```

To prime a picker once, call `picker.pick()` with a nonblank local request and discard those offers. Reuse the index until saved entries change. Call `await picker.release()` when the picker is no longer needed. `encoder-verification.json` records the parity checks and `runtime-verification.json` records the offline Chromium smoke test.

## Fetch and verify the bundle

Run these commands in a shell with Git LFS and `sha256sum`. Git Bash on Windows provides `sha256sum`.

```sh
git clone --no-checkout --single-branch --branch models https://github.com/rouxdutoit/bleib.git bleib-models
cd bleib-models
git lfs install --local
git checkout models
git lfs pull
cd granite-97m-a-int8-96
sha256sum -c SHA256SUMS
```

The checksums cover the full files after Git LFS downloads them. `model-config.json` identifies the selected variant. `THIRD-PARTY.md` records the upstream model and tokenizer attribution.
