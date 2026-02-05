#!/usr/bin/env bash
set -euo pipefail

echo "== SUPABASE REPO CHECKS =="

if [ -f supabase/config.toml ]; then
  echo "[PASS] supabase/config.toml exists"
  echo "project_id line:"
  grep -n 'project_id' supabase/config.toml | sed 's#^#  #' || true
else
  echo "[FAIL] supabase/config.toml missing"
fi

echo
if [ -d supabase/migrations ]; then
  echo "migrations list:"
  find supabase/migrations -maxdepth 1 -type f -name '*.sql' -printf '%f\n' | sort | sed 's#^#  - #' 
  echo "migrations_count: $(find supabase/migrations -maxdepth 1 -type f -name '*.sql' | wc -l | tr -d ' ')"
else
  echo "[FAIL] supabase/migrations missing"
fi

echo
if [ -d supabase/functions ]; then
  echo "functions list:"
  find supabase/functions -maxdepth 1 -mindepth 1 -type d -printf '%f\n' | sort | sed 's#^#  - #' 
  echo "functions_count: $(find supabase/functions -maxdepth 1 -mindepth 1 -type d | wc -l | tr -d ' ')"
else
  echo "[FAIL] supabase/functions missing"
fi

echo
if [ -f .github/workflows/supabase-deploy.yml ]; then
  echo "workflow: .github/workflows/supabase-deploy.yml"
  if rg -n 'workflow_dispatch' .github/workflows/supabase-deploy.yml >/dev/null; then
    echo "deploy_mode: manual (workflow_dispatch)"
  elif rg -n 'on:[[:space:]]*push|on:[[:space:]]*pull_request' .github/workflows/supabase-deploy.yml >/dev/null; then
    echo "deploy_mode: auto (push/pr trigger found)"
  else
    echo "deploy_mode: unknown"
  fi

  echo "deploy commands evidence:"
  rg -n 'supabase db push|supabase functions deploy' .github/workflows/supabase-deploy.yml | sed 's#^#  #' || true
else
  echo "[WARN] supabase deploy workflow missing"
fi

echo
echo "note: skrypt działa read-only, bez sieci i bez sekretów"
