#!/usr/bin/env bash
# =============================================================================
# PR4 — Performance Guardrails Advisory Check
# =============================================================================
# This script is ADVISORY ONLY. It always exits 0 and never blocks CI.
# Run manually or in CI as an informational step only.
#
# Usage:
#   npm run check:perf-guardrails
#   bash scripts/check-perf-guardrails.sh
#
# See docs/PERFORMANCE_GUARDRAILS.md for full rule explanations.
# =============================================================================

set -uo pipefail

ERRORS=0
WARNINGS=0

echo "=== Performance Guardrails Advisory Check ==="
echo "Date: $(date -u +%Y-%m-%dT%H:%M:%SZ)"
echo "Rules: docs/PERFORMANCE_GUARDRAILS.md"
echo ""

# ---------------------------------------------------------------------------
# RULE 1 — Heavy library eager imports in startup path
# Checks App.tsx and main.tsx for direct imports of heavy libraries.
# These must be lazy-loaded, not eagerly imported.
# ---------------------------------------------------------------------------
echo "--- RULE 1: Heavy library eager imports in startup path ---"

STARTUP_FILES="src/App.tsx src/main.tsx"
HEAVY_FOUND=""

for lib in recharts jspdf html2canvas exceljs; do
  MATCH=$(grep -n "^import.*from.*['\"]${lib}['\"]" $STARTUP_FILES 2>/dev/null || true)
  if [ -n "$MATCH" ]; then
    HEAVY_FOUND="${HEAVY_FOUND}  [${lib}] ${MATCH}\n"
  fi
done

if [ -n "$HEAVY_FOUND" ]; then
  echo "🔴 HARD ERROR: Heavy library imported eagerly in startup path:"
  echo -e "$HEAVY_FOUND"
  echo "   Action: Move to React.lazy() + Suspense."
  echo "   See: docs/PERFORMANCE_GUARDRAILS.md RULE 1 + RULE 2"
  ERRORS=$((ERRORS + 1))
else
  echo "✅ No heavy libraries in startup path (App.tsx, main.tsx)."
fi

echo ""

# ---------------------------------------------------------------------------
# RULE 2 — select('*') in read hooks and pages
# Advisory: mutation select('*') calls are legitimate but read queries must
# use explicit column lists. Review the output manually.
# ---------------------------------------------------------------------------
echo "--- RULE 2: Wildcard SELECT in hooks/pages (advisory) ---"

SELECT_STAR=$(grep -rn "\.select\('\*'\)\|\.select(\"\*\")" src/hooks/ src/pages/ 2>/dev/null \
  | grep -v "\.test\." \
  | grep -v "__tests__" \
  || true)

if [ -n "$SELECT_STAR" ]; then
  echo "⚠️  WARNING: select('*') found. Verify each is in a mutation (insert/update/upsert),"
  echo "   not in a read query. Read queries must use explicit column lists."
  echo ""
  echo "$SELECT_STAR"
  echo ""
  echo "   Known-OK: mutation .select('*') after .insert()/.update()/.upsert()"
  echo "   Not OK:   .from('table').select('*') as a standalone read hook"
  WARNINGS=$((WARNINGS + 1))
else
  echo "✅ No wildcard SELECT found in hooks/pages."
fi

echo ""

# ---------------------------------------------------------------------------
# RULE 3 — staleTime: 0 (disables cache, forces refetch on every mount)
# Advisory: some uses are intentional (payment status, real-time tokens).
# All intentional uses should have a comment explaining why.
# ---------------------------------------------------------------------------
echo "--- RULE 3: staleTime: 0 (cache disabled) ---"

STALE_ZERO=$(grep -rn "staleTime:\s*0" src/hooks/ src/pages/ src/components/ 2>/dev/null \
  | grep -v "\.test\." \
  | grep -v "__tests__" \
  || true)

if [ -n "$STALE_ZERO" ]; then
  echo "⚠️  WARNING: staleTime: 0 found. This disables caching and causes a refetch"
  echo "   on every component mount. Only use for data that must always be fresh"
  echo "   (e.g., payment status). Add a comment explaining the reason."
  echo ""
  echo "$STALE_ZERO"
  WARNINGS=$((WARNINGS + 1))
else
  echo "✅ No staleTime: 0 found."
fi

echo ""

# ---------------------------------------------------------------------------
# RULE 4 — AnimatePresence mode="wait" at route level (serializes navigation)
# ---------------------------------------------------------------------------
echo "--- RULE 4: AnimatePresence mode='wait' at route level ---"

ANIMATE_WAIT=$(grep -rn "mode=['\"]wait['\"]" src/App.tsx src/components/layout/ 2>/dev/null || true)

if [ -n "$ANIMATE_WAIT" ]; then
  echo "🔴 HARD ERROR: AnimatePresence mode='wait' found in routing/layout layer."
  echo "   This serializes navigation — all route transitions are blocked until exit"
  echo "   animation completes. Remove mode='wait' from route-level AnimatePresence."
  echo ""
  echo "$ANIMATE_WAIT"
  echo ""
  echo "   See: docs/PERFORMANCE_GUARDRAILS.md RULE 6"
  ERRORS=$((ERRORS + 1))
else
  echo "✅ No mode='wait' in routing/layout layer."
fi

echo ""

# ---------------------------------------------------------------------------
# SUMMARY
# ---------------------------------------------------------------------------
echo "============================================================"
echo "=== ADVISORY SUMMARY ==="
echo "Hard errors (must fix): $ERRORS"
echo "Warnings (review manually): $WARNINGS"
echo ""

if [ $ERRORS -gt 0 ]; then
  echo "🔴 $ERRORS hard error(s) found. These indicate definite regressions."
  echo "   This script is advisory — it does NOT block CI automatically."
  echo "   However, hard errors should be fixed before merge."
fi

if [ $WARNINGS -gt 0 ]; then
  echo "⚠️  $WARNINGS warning(s) found. Review each occurrence manually."
  echo "   Add a comment in code if the pattern is intentional."
fi

if [ $ERRORS -eq 0 ] && [ $WARNINGS -eq 0 ]; then
  echo "✅ All advisory checks passed."
fi

echo ""
echo "Full rules: docs/PERFORMANCE_GUARDRAILS.md"

# Always exit 0 — advisory only. To make a check blocking, remove this line
# and let $ERRORS drive the exit code.
exit 0
