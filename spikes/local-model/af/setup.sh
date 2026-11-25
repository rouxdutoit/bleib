#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "${BASH_SOURCE[0]}")"
export TMPDIR=/home/roux/.cache/bleib-codex-tmp
export UV_PYTHON_INSTALL_DIR="$PWD/.cache/python"

if [[ ! -e node_modules ]]; then
  if [[ -d ../v/node_modules ]]; then
    ln -s ../v/node_modules node_modules
  else
    mkdir -p .cache/deps
    cp ../v/package{,-lock}.json .cache/deps/
    (cd .cache/deps && npm ci --ignore-scripts)
    ln -s .cache/deps/node_modules node_modules
  fi
fi
if [[ ! -x ../v/.cache/train-venv/bin/python ]]; then
  uv venv --python 3.14 .cache/fit
  uv pip install --python .cache/fit/bin/python -r ../q2/requirements.txt
fi
uv venv --allow-existing --python 3.13 .cache/reference
uv pip install --python .cache/reference/bin/python 'torch==2.10.0' --index https://download.pytorch.org/whl/cpu
uv pip install --python .cache/reference/bin/python 'transformers==5.5.4' \
  'onnxruntime==1.31.1' 'onnx==1.21.0' 'onnx-ir==1.1.0'
