#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"
cd "$ROOT_DIR"

workflow_count="$(find .github/workflows -maxdepth 1 -type f -name '*.yml' 2>/dev/null | wc -l | tr -d ' ')"
migrations_count="$(find supabase/migrations -maxdepth 1 -type f -name '*.sql' 2>/dev/null | wc -l | tr -d ' ')"
functions_count="$(find supabase/functions -mindepth 1 -maxdepth 1 -type d 2>/dev/null | wc -l | tr -d ' ')"

{
  echo "=== REPO INVENTORY (max 30 linii) ==="
  echo "root: $ROOT_DIR"
  echo "branch: $(git branch --show-current 2>/dev/null || echo 'nieznany')"
  echo "stack: $( [ -f vite.config.ts ] || [ -f vite.config.js ] || [ -f vite.config.mjs ] && echo 'Vite' || echo 'brak Vite' )"
  echo "next_config: $( [ -f next.config.js ] || [ -f next.config.mjs ] || [ -f next.config.ts ] && echo 'obecny' || echo 'brak' )"
  echo "vercel.json: $( [ -f vercel.json ] && echo 'obecny' || echo 'brak' )"
  echo "workflows_count: $workflow_count"
  echo "workflows:"
  find .github/workflows -maxdepth 1 -type f -name '*.yml' -printf '  - %f\n' 2>/dev/null | sort
  echo "supabase/migrations: ${migrations_count} plików .sql"
  echo "supabase/functions: ${functions_count} katalogów funkcji"
} | head -n 30
