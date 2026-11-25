#!/usr/bin/env bash
set -euo pipefail
name=$1
variant=$2
root=$PWD
work=".cache/train/$name/$variant"
python="$root/.cache/fit/bin/python"
if [[ ! -x $python ]]; then python="$root/../v/.cache/train-venv/bin/python"; fi
mkdir -p "$work"
(
  cd "$work"
  node "$root/../q2/synthesize.mjs"
)
if [[ $name = static ]]; then
  (cd "$work"; node "$root/../q2/static-features.mjs")
else
  node embed.mjs "$name" "$variant"
fi
(
  cd "$work"
  export OPENBLAS_NUM_THREADS=1 OMP_NUM_THREADS=1
  "$python" "$root/../q2/fit.py" ${3:+"$3"}
)
