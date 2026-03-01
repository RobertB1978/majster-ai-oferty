#!/usr/bin/env bash
# gate-pr-changes.sh — PR-01 i18n Gate (hardcoded string blocker)
#
# Scans ONLY the files changed in this PR/push (vs the merge base) for
# hardcoded Polish-language strings (diacritics: ą ć ę ł ń ó ś ź ż and
# their uppercase equivalents).  Any match in a component, page, or hook
# file FAILS the gate with exit code 1.
#
# Why diff-only?
#   The existing codebase has pre-existing violations that are being
#   migrated incrementally (see check-i18n-hardcodes.sh for the full audit).
#   This gate enforces the zero-hardcode rule for ALL NEW CODE going forward
#   while not blocking in-flight migration work on legacy files.
#
# Usage (CI):
#   bash scripts/i18n/gate-pr-changes.sh origin/main
# Usage (local demo):
#   bash scripts/i18n/gate-pr-changes.sh HEAD~1
#
# Exit codes:
#   0 — gate passed (no new hardcoded strings)
#   1 — gate FAILED (hardcoded Polish strings found in changed files)

set -euo pipefail

BASE_REF="${1:-origin/main}"
REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"

echo "=== PR-01 i18n Gate: Checking changed files vs ${BASE_REF} ==="
echo ""

# Collect changed / added .ts/.tsx files in src/components, src/pages, src/hooks.
# Exclude test files — they are allowed to have technical literal strings.
CHANGED_FILES=$(
  git diff --name-only --diff-filter=ACM "${BASE_REF}...HEAD" \
    -- 'src/components/**' 'src/pages/**' 'src/hooks/**' 2>/dev/null \
  | grep -E '\.(tsx?|jsx?)$' \
  | grep -v -E '\.(test|spec)\.(tsx?|jsx?)$' \
  || true
)

if [[ -z "$CHANGED_FILES" ]]; then
  echo "No component/page/hook files changed. Gate passed ✓"
  exit 0
fi

echo "Files to check:"
echo "$CHANGED_FILES" | sed 's/^/  /'
echo ""

VIOLATIONS=0

while IFS= read -r file; do
  FILE_PATH="${REPO_ROOT}/${file}"
  if [[ ! -f "$FILE_PATH" ]]; then
    continue
  fi

  COUNT=$(
    rg --count-matches "[ąćęłńóśźżĄĆĘŁŃÓŚŹŻ]" "$FILE_PATH" 2>/dev/null \
    | awk -F: '{sum += $2} END {print sum + 0}'
  )

  if [[ "$COUNT" -gt 0 ]]; then
    echo "FAIL ✗ ${file}: ${COUNT} hardcoded Polish string(s)"
    rg -n "[ąćęłńóśźżĄĆĘŁŃÓŚŹŻ]" "$FILE_PATH" 2>/dev/null \
      | sed 's/^/    /'
    echo ""
    VIOLATIONS=$((VIOLATIONS + COUNT))
  fi
done <<< "$CHANGED_FILES"

if [[ "$VIOLATIONS" -gt 0 ]]; then
  echo "──────────────────────────────────────────────────"
  echo "GATE FAILED ✗ — ${VIOLATIONS} hardcoded Polish string(s) in changed files."
  echo "Wrap all user-facing text in t() calls and use i18n translation keys."
  echo "See: docs/ROADMAP.md G4 — Zero-Hardcode rule."
  echo "──────────────────────────────────────────────────"
  exit 1
fi

echo "Gate passed ✓ — no hardcoded Polish strings in changed files."
exit 0
