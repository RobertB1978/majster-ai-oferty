#!/usr/bin/env bash
# =============================================================================
# check-perf-regressions.sh — Advisory performance regression check
# =============================================================================
# Purpose : Surface potential performance regressions before opening a PR.
# Outcome : Always exits 0 — this is INFORMATIONAL, not a blocking gate.
# Usage   : npm run check:perf
#           bash scripts/check-perf-regressions.sh
# =============================================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

echo ""
echo "╔══════════════════════════════════════════════════════════════╗"
echo "║   PERFORMANCE REGRESSION CHECK (Advisory)                   ║"
echo "║   Docs: docs/PERFORMANCE_GUARDRAILS.md                      ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo ""
echo "  This script is advisory. Exit code is always 0."
echo "  Review any findings below before opening your PR."
echo ""

FINDINGS=0

# ─────────────────────────────────────────────────────────────────────────────
# CHECK 1: select('*') in hooks/ and pages/
# Rule: new code must not use select('*') (docs/PERFORMANCE_GUARDRAILS.md §4)
# ─────────────────────────────────────────────────────────────────────────────
echo "── CHECK 1: select('*') usage in src/hooks/ and src/pages/ ─────────────"
echo ""

SELECT_STAR_HITS=$(grep -rn "\.select('\*')\|\.select(\"\*\")" \
  "$REPO_ROOT/src/hooks/" \
  "$REPO_ROOT/src/pages/" \
  2>/dev/null || true)

if [ -n "$SELECT_STAR_HITS" ]; then
  echo "  ⚠️  Found select('*') occurrences (review each one):"
  echo ""
  echo "$SELECT_STAR_HITS" | while IFS= read -r line; do
    echo "     $line"
  done
  echo ""
  echo "  → Known accepted exceptions (see PERFORMANCE_GUARDRAILS.md §4):"
  echo "     src/hooks/useProjects.ts   — useProjects() deprecated list"
  echo "     src/hooks/useClients.ts    — useClients() deprecated list"
  echo "     src/hooks/useItemTemplates.ts — import dialog (small dataset)"
  echo ""
  echo "  → If your change added a NEW select('*'), replace with explicit columns."
  echo "  → If this is an existing grandfathered exception, no action needed."
  FINDINGS=$((FINDINGS + 1))
else
  echo "  ✅  No select('*') found in hooks/ and pages/."
fi
echo ""

# ─────────────────────────────────────────────────────────────────────────────
# CHECK 2: staleTime: 0 usage
# Rule: staleTime: 0 is forbidden without documented reason (GUARDRAILS §5)
# ─────────────────────────────────────────────────────────────────────────────
echo "── CHECK 2: staleTime: 0 in src/ ───────────────────────────────────────"
echo ""

STALETIME_HITS=$(grep -rn "staleTime:\s*0" \
  "$REPO_ROOT/src/" \
  2>/dev/null || true)

if [ -n "$STALETIME_HITS" ]; then
  echo "  ⚠️  Found staleTime: 0 occurrences:"
  echo ""
  echo "$STALETIME_HITS" | while IFS= read -r line; do
    echo "     $line"
  done
  echo ""
  echo "  → staleTime: 0 forces a network request on every mount."
  echo "  → Unless this is an approved exception, remove or raise staleTime."
  echo "  → See PERFORMANCE_GUARDRAILS.md §5 for the policy."
  FINDINGS=$((FINDINGS + 1))
else
  echo "  ✅  No staleTime: 0 found."
fi
echo ""

# ─────────────────────────────────────────────────────────────────────────────
# CHECK 3: Heavy static imports in startup-path files
# Rule: jspdf, recharts, exceljs, leaflet, html2canvas must NOT be statically
#       imported in startup-path files (GUARDRAILS §1)
# ─────────────────────────────────────────────────────────────────────────────
echo "── CHECK 3: Heavy library imports in startup-path files ────────────────"
echo ""

STARTUP_FILES=(
  "$REPO_ROOT/src/main.tsx"
  "$REPO_ROOT/src/App.tsx"
  "$REPO_ROOT/src/components/layout/AppLayout.tsx"
  "$REPO_ROOT/src/components/layout/PageTransition.tsx"
)

HEAVY_PATTERN="from ['\"]jspdf|from ['\"]recharts|from ['\"]exceljs|from ['\"]leaflet|from ['\"]html2canvas|from ['\"]framer-motion"
STARTUP_HITS=""

for f in "${STARTUP_FILES[@]}"; do
  if [ -f "$f" ]; then
    HITS=$(grep -n "$HEAVY_PATTERN" "$f" 2>/dev/null || true)
    if [ -n "$HITS" ]; then
      STARTUP_HITS="${STARTUP_HITS}${f}:"$'\n'"${HITS}"$'\n'
    fi
  fi
done

if [ -n "$STARTUP_HITS" ]; then
  echo "  ⚠️  Heavy library imported in startup-path file:"
  echo ""
  echo "$STARTUP_HITS" | while IFS= read -r line; do
    echo "     $line"
  done
  echo ""
  echo "  → These libraries must be in lazy chunks (React.lazy or dynamic import)."
  echo "  → A static import here increases the main bundle and delays TTI."
  echo "  → See PERFORMANCE_GUARDRAILS.md §1 and §3."
  FINDINGS=$((FINDINGS + 1))
else
  echo "  ✅  No heavy library static imports in startup-path files."
fi
echo ""

# ─────────────────────────────────────────────────────────────────────────────
# CHECK 4: Animation duration ceiling
# Rule: no transition > 200ms (GUARDRAILS §7)
# ─────────────────────────────────────────────────────────────────────────────
echo "── CHECK 4: Animation durations > 200 ms in src/ ──────────────────────"
echo ""

# Match duration values > 200 in CSS-in-JS or Tailwind inline styles
# Patterns: duration-[NNNms] where NNN > 200, or `duration: NNN` where NNN > 200
ANIM_HITS=$(grep -rn \
  "duration-\[2[0-9][1-9]ms\]\|duration-\[3[0-9][0-9]ms\]\|duration-\[[4-9][0-9][0-9]ms\]\|duration: [3-9][0-9][0-9]\b" \
  "$REPO_ROOT/src/" \
  2>/dev/null || true)

if [ -n "$ANIM_HITS" ]; then
  echo "  ⚠️  Possible animation duration > 200 ms found:"
  echo ""
  echo "$ANIM_HITS" | while IFS= read -r line; do
    echo "     $line"
  done
  echo ""
  echo "  → Review these. Sheet open/close and content fades must be ≤ 200 ms."
  echo "  → See PERFORMANCE_GUARDRAILS.md §7."
  FINDINGS=$((FINDINGS + 1))
else
  echo "  ✅  No obviously oversized animation durations found."
fi
echo ""

# ─────────────────────────────────────────────────────────────────────────────
# Summary
# ─────────────────────────────────────────────────────────────────────────────
echo "╔══════════════════════════════════════════════════════════════╗"
if [ "$FINDINGS" -eq 0 ]; then
  echo "║  ✅  All advisory checks passed. No findings.                ║"
else
  echo "║  ⚠️   $FINDINGS finding(s) above. Review before opening PR.         ║"
  echo "║      Findings may be grandfathered exceptions — check the    ║"
  echo "║      docs/PERFORMANCE_GUARDRAILS.md before deciding.         ║"
fi
echo "╚══════════════════════════════════════════════════════════════╝"
echo ""
echo "  Advisory reference: docs/PERFORMANCE_GUARDRAILS.md"
echo ""

# Always exit 0 — this is advisory, not a gate
exit 0
