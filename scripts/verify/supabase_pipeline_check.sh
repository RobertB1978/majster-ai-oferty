#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"
cd "$ROOT_DIR"

CANONICAL_WF=".github/workflows/deployment-truth.yml"
SECONDARY_WF=".github/workflows/supabase-deploy.yml"
REQUIRED_SECRETS=(SUPABASE_ACCESS_TOKEN SUPABASE_DB_PASSWORD SUPABASE_PROJECT_REF SUPABASE_ANON_KEY)
REQUIRED_MARKERS=(
  "on:"
  "pull_request:"
  "push:"
  "branches: [main]"
  "supabase db push"
  "supabase functions deploy"
  "SUPABASE_DEPLOY: PASS"
  "SUPABASE_DEPLOY: FAIL"
)

has_fixed() {
  local needle="$1"
  local file="$2"
  if command -v rg >/dev/null 2>&1; then
    rg -qF "$needle" "$file"
  else
    grep -qF -- "$needle" "$file"
  fi
}

has_regex() {
  local pattern="$1"
  local file="$2"
  if command -v rg >/dev/null 2>&1; then
    rg -q "$pattern" "$file"
  else
    grep -qE -- "$pattern" "$file"
  fi
}

echo "=== SUPABASE PIPELINE CHECK ==="
for wf in "$CANONICAL_WF" "$SECONDARY_WF"; do
  if [ ! -f "$wf" ]; then
    echo "[FAIL] Brak $wf"
    exit 1
  fi
  echo "[PASS] Workflow istnieje: $wf"
done

for marker in "${REQUIRED_MARKERS[@]}"; do
  if has_fixed "$marker" "$CANONICAL_WF"; then
    echo "[PASS] marker w canonical: $marker"
  else
    echo "[FAIL] Brak markera w canonical: $marker"
    exit 1
  fi
done

echo "Oczekiwane sekrety/zmienne (nazwy) w canonical:"
for s in "${REQUIRED_SECRETS[@]}"; do
  if has_regex "$s" "$CANONICAL_WF"; then
    echo "  - $s"
  else
    echo "[FAIL] Brak odwołania do $s w $CANONICAL_WF"
    exit 1
  fi
done

if has_regex '^\s*supabase\s+db\s+push\b|^\s*supabase\s+functions\s+deploy\b' "$SECONDARY_WF"; then
  echo "[FAIL] $SECONDARY_WF nie może zawierać komend production deploy"
  exit 1
fi
echo "[PASS] $SECONDARY_WF nie zawiera komend production deploy"

if has_regex '^\s*push:\s*$' "$SECONDARY_WF"; then
  echo "[FAIL] $SECONDARY_WF nie może być triggerowany przez push"
  exit 1
fi
echo "[PASS] $SECONDARY_WF nie jest triggerowany przez push"

deploy_workflow_count="$(rg -l '^\s*supabase\s+db\s+push\b|^\s*supabase\s+functions\s+deploy\b' .github/workflows/*.yml | wc -l | tr -d ' ')"
if [ "$deploy_workflow_count" != "1" ]; then
  echo "[FAIL] Oczekiwano dokładnie 1 workflow z komendami deploy Supabase, znaleziono: $deploy_workflow_count"
  rg -n '^\s*supabase\s+db\s+push\b|^\s*supabase\s+functions\s+deploy\b' .github/workflows/*.yml || true
  exit 1
fi
echo "[PASS] Dokładnie 1 workflow zawiera komendy deploy Supabase"

echo "[PASS] Supabase pipeline ma pojedynczą ścieżkę deploy i marker PASS/FAIL"
