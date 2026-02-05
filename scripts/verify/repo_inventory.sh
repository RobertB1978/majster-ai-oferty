#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT_DIR"

printf '== Repo inventory ==\n'

framework_guess="Unknown"
if [[ -f "vite.config.ts" || -f "vite.config.js" ]]; then
  framework_guess="Vite"
elif [[ -f "next.config.js" || -f "next.config.mjs" || -f "next.config.ts" ]]; then
  framework_guess="Next"
fi

printf 'Framework guess: %s\n' "$framework_guess"

printf '\nPliki sygnalizujące stack frontend:\n'
for candidate in vite.config.ts vite.config.js next.config.js next.config.mjs next.config.ts package.json tsconfig.json; do
  if [[ -f "$candidate" ]]; then
    printf ' - %s\n' "$candidate"
  fi
done

printf '\nInwentaryzacja Supabase:\n'
if [[ -d "supabase/migrations" ]]; then
  printf ' - migracje: %s\n' "$(find supabase/migrations -maxdepth 1 -type f | wc -l | tr -d ' ')"
else
  printf ' - migracje: brak katalogu\n'
fi

if [[ -d "supabase/functions" ]]; then
  printf ' - edge functions: %s\n' "$(find supabase/functions -mindepth 1 -maxdepth 1 -type d | wc -l | tr -d ' ')"
else
  printf ' - edge functions: brak katalogu\n'
fi
