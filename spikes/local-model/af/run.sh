#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "${BASH_SOURCE[0]}")"
export TMPDIR=/home/roux/.cache/bleib-codex-tmp
export OMP_NUM_THREADS=1 OPENBLAS_NUM_THREADS=1 MKL_NUM_THREADS=1
mkdir -p .cache
exec 9>.cache/run.lock
flock -n 9 || { echo 'An AF run already holds the lock.' >&2; exit 1; }

run_encoder() (
  name=$1
  trap 'python3 cache.py ".cache/models/$name" ".cache/train/$name"' EXIT
  printf '\n%s %s\n' "$(date -Is)" "$name"
  bash prime.sh "$name"
  bash fit.sh "$name" int8
  bash measure.sh "$name" int8
  .cache/reference/bin/python quantize.py ".cache/models/$name" > ".cache/$name-quant.log" 2>&1
  bash fit.sh "$name" q4
  bash measure.sh "$name" q4
)

if [[ $# = 0 ]]; then set -- minilm harrier granite97 granite311 static; fi
for name in "$@"; do
  case "$name" in
    minilm|harrier|granite97|granite311) run_encoder "$name" ;;
    static)
      bash fit.sh static int8 --static
      bash measure.sh static int8
      python3 cache.py .cache/train/static
      ;;
    *) echo "Unknown AF model $name." >&2; exit 1 ;;
  esac
done
