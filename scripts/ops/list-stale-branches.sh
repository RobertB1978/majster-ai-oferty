#!/usr/bin/env bash
# scripts/ops/list-stale-branches.sh
# Repo Hygiene — Read-only inventory helper
# Wyświetla zdalne branche z informacją o ostatnim commicie
#
# UWAGA: Ten skrypt TYLKO CZYTA — nie usuwa, nie modyfikuje nic.
# Wszystkie operacje destrukcyjne wykonuje Robert RĘCZNIE po analizie wyników.
#
# Użycie:
#   bash scripts/ops/list-stale-branches.sh
#   bash scripts/ops/list-stale-branches.sh --days 90
#   bash scripts/ops/list-stale-branches.sh --merged-only
#
# Wymagania: git (zalogowany do remote), opcjonalnie gh CLI

set -euo pipefail

# --- Parametry ---
DAYS_THRESHOLD="${DAYS_THRESHOLD:-60}"
MODE="all"  # all | merged-only | unmerged-only

while [[ $# -gt 0 ]]; do
    case "$1" in
        --days)
            DAYS_THRESHOLD="$2"
            shift 2
            ;;
        --merged-only)
            MODE="merged-only"
            shift
            ;;
        --unmerged-only)
            MODE="unmerged-only"
            shift
            ;;
        *)
            echo "Nieznana opcja: $1" >&2
            exit 1
            ;;
    esac
done

# --- Konfiguracja ---
CUTOFF_DATE=$(date -d "-${DAYS_THRESHOLD} days" +%Y-%m-%d 2>/dev/null \
    || date -v-"${DAYS_THRESHOLD}"d +%Y-%m-%d)  # macOS fallback

echo "================================================"
echo "  Majster.AI — Repo Hygiene Branch Inventory"
echo "  Data: $(date +%Y-%m-%d)"
echo "  Próg nieaktywności: ${DAYS_THRESHOLD} dni (przed ${CUTOFF_DATE})"
echo "  Tryb: ${MODE}"
echo "================================================"
echo ""

# --- Fetch (read-only) ---
echo "[1/4] Pobieranie aktualnych informacji o zdalnych branchach..."
git fetch --prune origin 2>/dev/null || echo "  OSTRZEŻENIE: git fetch nieudany — używam lokalnego cache"
echo ""

# --- Inventory branchy ---
echo "[2/4] Analiza branchy..."
echo ""
printf "%-80s %-12s %-20s %s\n" "BRANCH" "OSTATNI_COMMIT" "DATA" "STATUS"
printf "%-80s %-12s %-20s %s\n" "------" "--------------" "----" "------"

TOTAL=0
STALE=0
MERGED=0
UNMERGED=0

while IFS= read -r branch; do
    # Pomiń main i current branch
    branch="${branch#remotes/origin/}"
    branch="${branch#* -> }"  # Pomiń HEAD -> main

    [[ "$branch" == "main" ]] && continue
    [[ "$branch" == "HEAD" ]] && continue
    [[ -z "$branch" ]] && continue

    # Data ostatniego commitu
    commit_date=$(git log -1 --format="%ad" --date=short "origin/${branch}" 2>/dev/null || echo "unknown")
    commit_sha=$(git log -1 --format="%h" "origin/${branch}" 2>/dev/null || echo "unknown")

    # Status merge
    merge_status="unmerged"
    if git merge-base --is-ancestor "origin/${branch}" "origin/main" 2>/dev/null; then
        merge_status="merged"
        MERGED=$((MERGED + 1))
    else
        UNMERGED=$((UNMERGED + 1))
    fi

    # Filtrowanie według MODE
    if [[ "$MODE" == "merged-only" ]] && [[ "$merge_status" != "merged" ]]; then
        TOTAL=$((TOTAL + 1))
        continue
    fi
    if [[ "$MODE" == "unmerged-only" ]] && [[ "$merge_status" != "unmerged" ]]; then
        TOTAL=$((TOTAL + 1))
        continue
    fi

    # Stale check
    stale_flag=""
    if [[ "$commit_date" != "unknown" ]] && [[ "$commit_date" < "$CUTOFF_DATE" ]]; then
        stale_flag="STALE"
        STALE=$((STALE + 1))
    fi

    printf "%-80s %-12s %-20s %s\n" \
        "${branch:0:79}" \
        "${commit_sha}" \
        "${commit_date}" \
        "${merge_status}${stale_flag:+ [${stale_flag}]}"

    TOTAL=$((TOTAL + 1))
done < <(git branch -r 2>/dev/null | grep -v 'HEAD' | sort)

echo ""
echo "================================================"
echo "[3/4] Podsumowanie"
echo "  Łącznie przeanalizowanych branchy: ${TOTAL}"
echo "  Merged (safe to delete):           ${MERGED}"
echo "  Unmerged (wymaga review):          ${UNMERGED}"
echo "  Stale (>${DAYS_THRESHOLD} dni bez aktywności):  ${STALE}"
echo "================================================"
echo ""

echo "[4/4] Branche HIGH-RISK — nie usuwać bez ręcznego audytu:"
HIGH_RISK_PATTERNS=("fix/remove-sensitive-logging" "fix/enable-pgcrypto" "reset/ci-clean" "docs/evidence" "revert-" "security" "rls")
for pattern in "${HIGH_RISK_PATTERNS[@]}"; do
    matches=$(git branch -r 2>/dev/null | grep -i "$pattern" | sed 's/remotes\/origin\///' || true)
    if [[ -n "$matches" ]]; then
        echo "  PATTERN '${pattern}':"
        echo "$matches" | while read -r m; do echo "    → $m"; done
    fi
done

echo ""
echo "================================================"
echo "WAŻNE: Ten skrypt TYLKO WYŚWIETLA informacje."
echo "Żadne branche nie zostały usunięte."
echo "Akcje destrukcyjne: WYŁĄCZNIE przez Roberta po analizie."
echo "Patrz: docs/ops/REPO_HYGIENE_RUNBOOK.md"
echo "================================================"
