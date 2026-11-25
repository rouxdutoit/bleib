#!/usr/bin/env bash
set -euo pipefail
name=$1
variant=$2
node node-bench.mjs "$name" "$variant"
if [[ $name != static ]]; then
  node node-bench.mjs "$name" fp32 "$variant"
fi
node browser-bench.mjs "$name" "$variant"
if [[ $name = granite97 && $variant = int8 ]]; then
  .cache/reference/bin/python quantize.py ".cache/models/$name" dynamic > ".cache/$name-int8-quant.log" 2>&1
  bash fit.sh "$name" dynamic
  bash measure.sh "$name" dynamic
fi
