#!/usr/bin/env bash
# Decode a locally obtained Dolltoon APK or XAPK for authorized inspection.
# Usage: bash tools/decompile_dolltoon.sh /path/to/file.apk [output-directory]
set -euo pipefail

if [[ $# -lt 1 || $# -gt 2 || ! -f "${1:-}" ]]; then
  echo "Usage: bash $0 /path/to/Dolltoon.apk|Dolltoon.xapk [output-directory]" >&2
  exit 2
fi

for tool in apktool unzip sha256sum find; do
  if ! command -v "$tool" >/dev/null 2>&1; then
    echo "Missing required command: $tool" >&2
    exit 2
  fi
done

INPUT="$(realpath "$1")"
OUTPUT="${2:-reference/dolltoon}"
mkdir -p "$OUTPUT/decoded" "$OUTPUT/logs"
OUTPUT="$(realpath "$OUTPUT")"
name="$(basename "$INPUT")"
printf '%s  %s\n' "$(sha256sum "$INPUT" | awk '{print $1}')" "$name" > "$OUTPUT/SHA256SUMS.txt"

case "${INPUT,,}" in
  *.apk)
    APK_ROOT="$(dirname "$INPUT")"
    APK_FILES=("$INPUT")
    ;;
  *.xapk)
    mkdir -p "$OUTPUT/package"
    unzip -q -o "$INPUT" -d "$OUTPUT/package"
    APK_ROOT="$OUTPUT/package"
    mapfile -d '' APK_FILES < <(find "$APK_ROOT" -type f -iname '*.apk' -print0)
    ;;
  *)
    echo "Input must be an .apk or .xapk archive" >&2
    exit 2
    ;;
esac

if [[ ${#APK_FILES[@]} -eq 0 ]]; then
  echo "No APK files found in archive." >&2
  exit 1
fi

failed=0
for apk in "${APK_FILES[@]}"; do
  relative="${apk#"$APK_ROOT"/}"
  label="${relative//\//_}"
  label="${label%.apk}"
  echo "Decoding: $relative"
  if ! apktool decode --force "$apk" --output "$OUTPUT/decoded/$label" \
       >"$OUTPUT/logs/$label.log" 2>&1; then
    echo "Failed: $relative (see $OUTPUT/logs/$label.log)" >&2
    failed=$((failed + 1))
  fi
done

echo "Package SHA-256 and decoded contents: $OUTPUT"
echo "APKs attempted: ${#APK_FILES[@]}; failures: $failed"
if (( failed > 0 )); then
  exit 1
fi
