#!/usr/bin/env bash
# check-i18n-hardcodes.sh
# Offline CI gate: detects hardcoded Polish strings in TSX/TS component files.
# Usage: bash scripts/check-i18n-hardcodes.sh [--fail-on-match]
# Returns exit code 1 if --fail-on-match is passed and violations are found.
#
# Scope: src/pages/ and src/components/ only (excludes locales, tests, data).
# Does NOT send any data outside the repo.

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
FAIL_ON_MATCH=0
if [[ "${1:-}" == "--fail-on-match" ]]; then
  FAIL_ON_MATCH=1
fi

SEARCH_DIRS=(
  "$REPO_ROOT/src/pages"
  "$REPO_ROOT/src/components"
  "$REPO_ROOT/src/hooks"
)

EXCLUDE_PATTERNS=(
  "*.test.ts"
  "*.test.tsx"
  "*.spec.ts"
  "*.spec.tsx"
)

BUILD_EXCLUDES=""
for pat in "${EXCLUDE_PATTERNS[@]}"; do
  BUILD_EXCLUDES="$BUILD_EXCLUDES --glob !$pat"
done

echo "=== i18n Hardcode Audit ==="
echo "Scanning for Polish diacritics in component/page/hook files..."
echo ""

# Build the rg command with exclusions
TOTAL=0
for DIR in "${SEARCH_DIRS[@]}"; do
  if [[ -d "$DIR" ]]; then
    COUNT=$(rg --count-matches "[ąćęłńóśźżĄĆĘŁŃÓŚŹŻ]" "$DIR" \
      --glob "*.tsx" --glob "*.ts" \
      --glob "!*.test.ts" --glob "!*.test.tsx" \
      --glob "!*.spec.ts" --glob "!*.spec.tsx" \
      2>/dev/null | awk -F: '{sum += $2} END {print sum+0}')
    echo "  $DIR: $COUNT occurrences"
    TOTAL=$((TOTAL + COUNT))
  fi
done

echo ""
echo "TOTAL hardcoded Polish diacritic occurrences: $TOTAL"
echo ""

if [[ $TOTAL -gt 0 ]]; then
  echo "TOP 20 occurrences (file:line: snippet):"
  for DIR in "${SEARCH_DIRS[@]}"; do
    if [[ -d "$DIR" ]]; then
      rg -n "[ąćęłńóśźżĄĆĘŁŃÓŚŹŻ]" "$DIR" \
        --glob "*.tsx" --glob "*.ts" \
        --glob "!*.test.ts" --glob "!*.test.tsx" \
        --glob "!*.spec.ts" --glob "!*.spec.tsx" \
        2>/dev/null
    fi
  done | head -20
  echo ""
fi

if [[ $FAIL_ON_MATCH -eq 1 && $TOTAL -gt 0 ]]; then
  echo "FAIL: $TOTAL hardcoded Polish string(s) found. Wrap them in t() calls."
  exit 1
else
  echo "REPORT ONLY: $TOTAL occurrences. Use --fail-on-match to gate CI."
  exit 0
fi
