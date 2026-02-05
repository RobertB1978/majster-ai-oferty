#!/usr/bin/env bash
set -euo pipefail

echo "== P0 REPO INVENTORY =="
echo "root: $(pwd)"
echo "branch: $(git branch --show-current 2>/dev/null || echo 'N/A')"
echo "remote(s):"
git remote -v 2>/dev/null | awk '!seen[$0]++ {print "  - "$0}' || true

echo
for file in vercel.json docs/VERCEL_SETUP_CHECKLIST.md supabase/config.toml vite.config.ts package.json; do
  if [ -f "$file" ]; then
    echo "[FOUND] $file"
  else
    echo "[MISS ] $file"
  fi
done

for cfg in next.config.js next.config.mjs next.config.ts; do
  if [ -f "$cfg" ]; then
    echo "[FOUND] $cfg"
  fi
done

if [ -f "vite.config.ts" ]; then
  echo "stack_detect: vite"
elif [ -f "next.config.js" ] || [ -f "next.config.mjs" ] || [ -f "next.config.ts" ]; then
  echo "stack_detect: next"
else
  echo "stack_detect: unknown"
fi

echo
echo "workflows:"
find .github/workflows -maxdepth 1 -type f 2>/dev/null | sort | sed 's#^#  - #' || true

echo
if [ -d "supabase/migrations" ]; then
  echo "supabase_migrations_count: $(find supabase/migrations -maxdepth 1 -type f -name '*.sql' | wc -l | tr -d ' ')"
else
  echo "supabase_migrations_count: 0"
fi

if [ -d "supabase/functions" ]; then
  echo "supabase_functions_count: $(find supabase/functions -maxdepth 1 -mindepth 1 -type d | wc -l | tr -d ' ')"
else
  echo "supabase_functions_count: 0"
fi

echo
if [ -f package.json ]; then
  echo "engines_from_package_json:"
  grep -n '"engines"\|"node"\|"npm"\|"packageManager"' package.json | sed 's#^#  #' || true
fi
