#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT_DIR"

echo "=== Repo inventory ==="
echo "Repo root: $ROOT_DIR"

has_file() {
  local pattern="$1"
  compgen -G "$pattern" > /dev/null
}

framework_guess="Unknown"
reason="Brak jednoznacznych plików konfiguracyjnych."

if has_file "vite.config.ts" || has_file "vite.config.js" || has_file "vite.config.mjs"; then
  framework_guess="Vite"
  reason="Wykryto plik vite.config.*"
elif has_file "next.config.js" || has_file "next.config.mjs" || has_file "next.config.ts"; then
  framework_guess="Next"
  reason="Wykryto plik next.config.*"
fi

echo "Framework guess: ${framework_guess}"
echo "Powód: ${reason}"

echo "Kluczowe pliki:"
find . -maxdepth 2 -type f \( -name 'package.json' -o -name 'vite.config.*' -o -name 'next.config.*' -o -name 'vercel.json' \) | sort

echo ""
echo "Supabase artefakty:"
if [ -d "supabase/migrations" ]; then
  echo "- migracje: $(find supabase/migrations -maxdepth 1 -type f -name '*.sql' | wc -l)"
else
  echo "- migracje: brak katalogu supabase/migrations"
fi

if [ -d "supabase/functions" ]; then
  echo "- funkcje:  $(find supabase/functions -mindepth 1 -maxdepth 1 -type d | wc -l)"
else
  echo "- funkcje: brak katalogu supabase/functions"
fi
