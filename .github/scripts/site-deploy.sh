#!/usr/bin/env bash
# SPDX-License-Identifier: AGPL-3.0-or-later
set -euo pipefail

: "${BUNNY_STORAGE_PASSWORD:?Set the BUNNY_STORAGE_PASSWORD repository secret.}"
curl_options=(--disable --fail-with-body --silent --show-error --globoff --max-time 60)

storage_request() {
  curl "${curl_options[@]}" --header "AccessKey: $BUNNY_STORAGE_PASSWORD" "$@"
}

storage_url() {
  jq -nr --arg path "$1" '
    "https://storage.bunnycdn.com/bleib-site/" + ($path | split("/") | map(@uri) | join("/"))
  '
}

content_type() {
  case "${1,,}" in
    *.html) printf '%s' 'text/html; charset=utf-8' ;;
    *.css) printf '%s' 'text/css; charset=utf-8' ;;
    *.js|*.mjs) printf '%s' 'text/javascript; charset=utf-8' ;;
    *.txt) printf '%s' 'text/plain; charset=utf-8' ;;
    *.xml) printf '%s' 'application/xml; charset=utf-8' ;;
    *.svg) printf '%s' 'image/svg+xml' ;;
    *.woff2) printf '%s' 'font/woff2' ;;
    *.json|*.webmanifest) printf '%s' 'application/json; charset=utf-8' ;;
    *) file --brief --mime-type -- "$1" ;;
  esac
}

list_remote_files() {
  local directory="$1" url listing name checksum
  url=$(storage_url "$directory")
  listing=$(storage_request "$url")
  jq -js '
    if length != 1 or (.[0] | type) != "array" then
      error("Invalid Bunny Storage directory listing")
    else .[0][] end
    | .ObjectName as $name
    | if ($name | type != "string" or . == "" or . == "." or . == ".." or
          contains("/") or contains("\u0000")) or (.IsDirectory | type != "boolean") then
        error("Invalid Bunny Storage directory entry")
      else
        (if .IsDirectory then $name + "/" else $name end), "\u0000",
        (.Checksum | if type == "string" and test("^[0-9a-fA-F]{64}$")
                     then ascii_downcase else "" end), "\u0000"
      end
  ' <<< "$listing" |
    while IFS= read -r -d '' name && IFS= read -r -d '' checksum; do
      if [[ "$name" == */ ]]; then
        list_remote_files "$directory$name"
      else
        printf '%s\0%s\0' "$directory$name" "$checksum"
      fi
    done
}

is_page() {
  [[ "$1" == index.html || "$1" == */index.html ]]
}

# Snapshot storage before replacing files so unchanged pages stay out of IndexNow.
cd site/dist
snapshot=$(mktemp -d)
trap 'rm -rf -- "$snapshot"' EXIT
list_remote_files '' > "$snapshot/remote"
find . -type f -print0 > "$snapshot/local"
declare -A remote_checksums=()
changed_paths=()
while IFS= read -r -d '' path && IFS= read -r -d '' checksum; do
  remote_checksums["$path"]=$checksum
done < "$snapshot/remote"

# Publish the new files before pruning old ones.
while IFS= read -r -d '' file; do
  file=${file#./}
  url=$(storage_url "$file")
  if is_page "$file"; then
    checksum=$(sha256sum < "$file")
    previous=${remote_checksums[$file]-}
    if [[ -z "$previous" && -n "${remote_checksums[$file]+present}" ]]; then
      previous=$(storage_request "$url" | sha256sum)
    fi
    if [[ "${checksum%% *}" != "${previous%% *}" ]]; then
      changed_paths+=("${file%index.html}")
    fi
  fi
  mime=$(content_type "$file")
  storage_request --request PUT --header "Content-Type: $mime" \
    --upload-file "$file" --output /dev/null "$url"
done < "$snapshot/local"

for path in "${!remote_checksums[@]}"; do
  if [[ ! -f "$path" ]]; then
    url=$(storage_url "$path")
    storage_request --request DELETE --output /dev/null "$url"
    if is_page "$path"; then
      changed_paths+=("${path%index.html}")
    fi
  fi
done

# Clear cached copies after the storage zone is up to date.
if [[ -n "${BUNNY_API_KEY:-}" ]]; then
  curl "${curl_options[@]}" --request POST --header "AccessKey: $BUNNY_API_KEY" \
    --header 'Content-Type: application/json' --data '{}' --output /dev/null \
    'https://api.bunny.net/pullzone/7075333/purgeCache'
  if [[ -n "${GITHUB_OUTPUT:-}" ]]; then
    changed_urls=$(jq -cn --args '
      $ARGS.positional | sort | map("https://bleib.dev/" + (split("/") | map(@uri) | join("/")))
    ' -- "${changed_paths[@]}")
    printf 'purged=true\nchanged_urls=%s\n' "$changed_urls" >> "$GITHUB_OUTPUT"
  fi
else
  printf '%s\n' '::notice::The CDN cache was not purged because BUNNY_API_KEY is unset.'
fi
