#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"
cd "$ROOT_DIR"

echo "=== SUPABASE REPO CHECKS (offline, bez sekretów) ==="

echo
if [ -d supabase/migrations ]; then
  echo "[PASS] supabase/migrations istnieje"
  echo "Liczba migracji: $(find supabase/migrations -maxdepth 1 -type f -name '*.sql' | wc -l | tr -d ' ')"
  echo "Lista migracji:"
  find supabase/migrations -maxdepth 1 -type f -name '*.sql' -printf '%f\n' | sort | sed 's/^/  - /'
else
  echo "[FAIL] Brak supabase/migrations"
fi

echo
if [ -d supabase/functions ]; then
  echo "[PASS] supabase/functions istnieje"
  echo "Liczba katalogów funkcji: $(find supabase/functions -maxdepth 1 -mindepth 1 -type d | wc -l | tr -d ' ')"
  echo "Lista funkcji:"
  find supabase/functions -maxdepth 1 -mindepth 1 -type d -printf '%f\n' | sort | sed 's/^/  - /'
else
  echo "[FAIL] Brak supabase/functions"
fi

echo
if [ -f supabase/config.toml ]; then
  echo "[PASS] supabase/config.toml istnieje"
  PROJECT_ID=$(awk -F '"' '/project_id/ {print $2; exit}' supabase/config.toml)
  echo "project_id (z config.toml): ${PROJECT_ID:-brak}"
else
  echo "[WARN] Brak supabase/config.toml"
fi

echo
WF_FILE=".github/workflows/supabase-deploy.yml"
if [ -f "$WF_FILE" ]; then
  echo "[PASS] Workflow deploy istnieje: $WF_FILE"

  if rg -q "workflow_dispatch" "$WF_FILE"; then
    echo "tryb uruchamiania: manualny (workflow_dispatch)"
  else
    echo "tryb uruchamiania: inny/auto (brak workflow_dispatch)"
  fi

  if rg -q "supabase db push" "$WF_FILE"; then
    echo "deploy migracji: TAK (supabase db push)"
  else
    echo "deploy migracji: NIE wykryto"
  fi

  if rg -q "supabase functions deploy" "$WF_FILE"; then
    echo "deploy edge functions: TAK"
  else
    echo "deploy edge functions: NIE wykryto"
  fi
else
  echo "[FAIL] Brak workflow: $WF_FILE"
fi

echo
echo "Werdykt repo-side:"
echo "- Skrypt pokazuje stan plików, nie potwierdza wdrożenia na dashboardzie Supabase."
echo "- Bez dowodów z dashboardu/logów status końcowy pozostaje FAIL."
