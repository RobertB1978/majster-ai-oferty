#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"
cd "$ROOT_DIR"

WF=".github/workflows/deployment-truth.yml"
REQUIRED_SECRETS=(SUPABASE_ACCESS_TOKEN SUPABASE_DB_PASSWORD SUPABASE_PROJECT_REF SUPABASE_ANON_KEY)
REQUIRED_MARKERS=(
  "on:"
  "pull_request:"
  "push:"
  "branches: [main]"
  "supabase db push"
  "supabase functions deploy"
)

echo "=== SUPABASE PIPELINE CHECK ==="
if [ ! -f "$WF" ]; then
  echo "[FAIL] Brak $WF"
  exit 1
fi

echo "[PASS] Workflow istnieje: $WF"

for marker in "${REQUIRED_MARKERS[@]}"; do
  if rg -qF "$marker" "$WF"; then
    echo "[PASS] marker: $marker"
  else
    echo "[FAIL] marker: $marker"
    exit 1
  fi
done

echo "Oczekiwane sekrety/zmienne (nazwy):"
for s in "${REQUIRED_SECRETS[@]}"; do
  if rg -q "$s" "$WF"; then
    echo "  - $s"
  else
    echo "[FAIL] Brak odwołania do $s w $WF"
    exit 1
  fi
done

echo "[PASS] Supabase pipeline ma wymagane kroki i nazwy sekretów"
