#!/usr/bin/env bash
set -euo pipefail
name=$1
node prepare.mjs "$name"
HF_HUB_OFFLINE=1 TRANSFORMERS_OFFLINE=1 .cache/reference/bin/python reference.py ".cache/models/$name"
node embed.mjs "$name" fp32
if [[ $name = harrier ]]; then
  .cache/reference/bin/python quantize.py ".cache/models/$name" int8 > ".cache/$name-int8-quant.log" 2>&1
fi
