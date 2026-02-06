#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT_DIR"

printf '== Vercel repo checks ==\n'

printf '\n[1] Pliki sugerujące integrację z Vercel:\n'
found_any=0
for candidate in vercel.json vercel.json. .vercel/project.json; do
  if [[ -f "$candidate" ]]; then
    printf ' - znaleziono: %s\n' "$candidate"
    found_any=1
  fi
done
if [[ "$found_any" -eq 0 ]]; then
  printf ' - brak jawnych plików integracji\n'
fi

printf '\n[2] Miejsca z rewrites/headers/routes:\n'
for file in vercel.json vercel.json.; do
  if [[ -f "$file" ]]; then
    printf ' - %s\n' "$file"
    rg -n 'rewrites|routes|headers|source|destination' "$file" || true
  fi
done

printf '\n[3] Miejsca z nazwami env Vercel/Supabase (zakres: docs + workflows + config):\n'
rg -n 'VITE_SUPABASE_URL|VITE_SUPABASE_ANON_KEY|SUPABASE_URL|SUPABASE_ANON_KEY|VERCEL_' \
  vercel.json vercel.json. .github/workflows/*.yml docs/P0_EVIDENCE_PACK.md docs/DEPLOYMENT_TRUTH.md docs/P0_EVIDENCE_REQUEST.md docs/VERCEL_SETUP_CHECKLIST.md docs/VERCEL_DEPLOYMENT_GUIDE.md docs/SUPABASE_SETUP_GUIDE.md docs/SUPABASE_SETUP_CHECKLIST.md 2>/dev/null || true

printf '\n[4] Workflow/deployment references (zakres: docs + workflows):\n'
rg -n 'vercel|Vercel|deployment|deploy' .github/workflows/*.yml docs/P0_EVIDENCE_PACK.md docs/DEPLOYMENT_TRUTH.md docs/P0_EVIDENCE_REQUEST.md docs/VERCEL_SETUP_CHECKLIST.md docs/VERCEL_DEPLOYMENT_GUIDE.md docs/SUPABASE_SETUP_GUIDE.md docs/SUPABASE_SETUP_CHECKLIST.md 2>/dev/null || true
