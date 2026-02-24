#!/usr/bin/env bash
# check-placeholders.sh — CI guard ensuring no CHANGE-ME placeholders remain in source code.
# Usage: npm run check:placeholders
# Returns: exit 0 if clean, exit 1 if any occurrences found.
# Excluded: docs/ops/placeholders.md (historical evidence file for this PR).

set -euo pipefail

SEARCH_DIRS="src public docs"
PATTERN="CHANGE-ME"
EXCLUDE_FILE="docs/ops/placeholders.md"

echo "Checking for '${PATTERN}' placeholders in: ${SEARCH_DIRS} (excluding ${EXCLUDE_FILE})"

matches=$(grep -R "${PATTERN}" ${SEARCH_DIRS} -n 2>/dev/null | grep -v "^${EXCLUDE_FILE}:" || true)

if [ -n "$matches" ]; then
  echo ""
  echo "ERROR: Found '${PATTERN}' placeholder(s) that must be replaced:"
  echo "$matches"
  echo ""
  echo "Replace all occurrences with the real contact email: kontakt.majster@gmail.com"
  exit 1
fi

echo "PASS: 0 occurrences of '${PATTERN}' found (outside allowed evidence file)."
exit 0
