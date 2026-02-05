#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT_DIR"

echo "=== Supabase repo checks ==="

CONFIG_FILE="supabase/config.toml"
if [ -f "$CONFIG_FILE" ]; then
  project_id="$(sed -n 's/^project_id = "\(.*\)"/\1/p' "$CONFIG_FILE" | head -n 1)"
  echo "project_id (supabase/config.toml): ${project_id:-NIE ZNALEZIONO}"
else
  echo "project_id (supabase/config.toml): brak pliku"
fi

if [ -d "supabase/migrations" ]; then
  migrations_count="$(find supabase/migrations -maxdepth 1 -type f -name '*.sql' | wc -l | tr -d ' ')"
  echo "Liczba migracji (*.sql): $migrations_count"
  echo "Najnowsze migracje (top 5):"
  find supabase/migrations -maxdepth 1 -type f -name '*.sql' -printf '%f\n' | sort | tail -n 5
else
  echo "Liczba migracji (*.sql): brak katalogu supabase/migrations"
fi

if [ -d "supabase/functions" ]; then
  echo "Lista funkcji (katalogi):"
  find supabase/functions -mindepth 1 -maxdepth 1 -type d -printf ' - %f\n' | sort
  echo "Liczba funkcji: $(find supabase/functions -mindepth 1 -maxdepth 1 -type d | wc -l | tr -d ' ')"
else
  echo "Lista funkcji: brak katalogu supabase/functions"
fi
