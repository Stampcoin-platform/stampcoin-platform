#!/usr/bin/env bash
set -euo pipefail

# Usage:
#   ./fix-sarif.sh /path/to/input.sarif [/path/to/output.sarif]
# Defaults:
#   input: ./results/javascript.sarif
#   output: same name with .fixed.sarif suffix

INPUT="${1:-./results/javascript.sarif}"
OUTPUT="${2:-${INPUT%.sarif}.fixed.sarif}"

if ! command -v jq >/dev/null 2>&1; then
  echo "Error: jq is required but not installed." >&2
  exit 2
fi

if [ ! -f "$INPUT" ]; then
  echo "Error: input file not found: $INPUT" >&2
  exit 3
fi

# Recursively walk the JSON and normalize all string values:
# - Replace backslashes with forward slashes
# - Remove leading drive letter patterns like "C:/" or "D:/"
jq '
  def normalize_string:
    (gsub("\\\\+"; "/") | sub("^[A-Za-z]:/"; ""));

  def fix:
    if type == "object" then
      with_entries(.value |= fix)
    elif type == "array" then
      map(fix)
    elif type == "string" then
      normalize_string
    else .
    end;

  fix
' "$INPUT" > "$OUTPUT"

# Quick verification
if jq -e . "$OUTPUT" >/dev/null 2>&1; then
  echo "Normalized SARIF written to: $OUTPUT"
else
  echo "Error: produced invalid JSON for $OUTPUT" >&2
  exit 4
fi