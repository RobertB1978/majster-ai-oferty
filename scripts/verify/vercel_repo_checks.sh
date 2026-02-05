#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT_DIR"

echo "=== Vercel repo checks ==="

echo "[1] Pliki sugerujące integrację Vercel"
for file in vercel.json .vercel/project.json .github/workflows/ci.yml .github/workflows/supabase-deploy.yml package.json vite.config.ts; do
  if [ -f "$file" ]; then
    echo "- znaleziono: $file"
  fi
done

echo ""
if [ -f "vercel.json" ]; then
  echo "[2] vercel.json (istotne wpisy)"
  nl -ba vercel.json | sed -n '1,220p'
else
  echo "[2] vercel.json: brak"
fi

echo ""
echo "[3] Miejsca z rewrites/redirects/headers/routes"
rg -n --glob '!node_modules/**' --glob '!dist/**' 'rewrites|redirects|headers|routes' vercel.json .github/workflows package.json vite.config.ts docs 2>/dev/null || true

echo ""
echo "[4] Miejsca z nazwami zmiennych środowiskowych powiązanych z Vercel/Supabase"
rg -n --glob '!node_modules/**' --glob '!dist/**' 'VERCEL_|VITE_SUPABASE_|SUPABASE_URL|SUPABASE_ANON_KEY|NEXT_PUBLIC_' .github package.json vercel.json docs src 2>/dev/null || true
