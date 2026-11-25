#!/usr/bin/env bash
set -euo pipefail
cd -- "$(dirname -- "${BASH_SOURCE[0]}")"
mkdir -p .cache results
exec 9>.cache/run.lock
flock -n 9 || { echo 'Run X is already using this checkout.' >&2; exit 1; }

if [[ ! -f node_modules/.package-lock.json ]] || ! cmp -s package-lock.json .cache/installed-lock.json; then
  npm ci --ignore-scripts --no-fund --no-audit
  cp package-lock.json .cache/installed-lock.json
fi
node --test test.mjs
status=0
node run.mjs "$@" || status=$?
node summarize.mjs
exit "$status"
