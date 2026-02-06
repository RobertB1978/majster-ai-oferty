#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT_DIR"

printf '== Supabase repo checks ==\n'

printf '\n[1] project_id z supabase/config.toml:\n'
if [[ -f "supabase/config.toml" ]]; then
  project_id_line="$(rg -n '^project_id\s*=\s*"' supabase/config.toml || true)"
  if [[ -n "$project_id_line" ]]; then
    printf '%s\n' "$project_id_line"
  else
    printf 'project_id: nie znaleziono wpisu\n'
  fi
else
  printf 'supabase/config.toml: brak pliku\n'
fi

printf '\n[2] Liczba migracji:\n'
if [[ -d "supabase/migrations" ]]; then
  migrations_count="$(find supabase/migrations -maxdepth 1 -type f | wc -l | tr -d ' ')"
  printf 'migrations_count=%s\n' "$migrations_count"
  printf 'lista migracji:\n'
  find supabase/migrations -maxdepth 1 -type f -printf '%f\n' | sort
else
  printf 'supabase/migrations: brak katalogu\n'
fi

printf '\n[3] Lista Edge Functions:\n'
if [[ -d "supabase/functions" ]]; then
  functions_count="$(find supabase/functions -mindepth 1 -maxdepth 1 -type d | wc -l | tr -d ' ')"
  printf 'functions_count=%s\n' "$functions_count"
  find supabase/functions -mindepth 1 -maxdepth 1 -type d -printf '%f\n' | sort
else
  printf 'supabase/functions: brak katalogu\n'
fi
