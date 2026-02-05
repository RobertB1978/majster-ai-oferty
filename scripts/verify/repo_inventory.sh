#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"
cd "$ROOT_DIR"

echo "=== REPO INVENTORY (P0 Deployment Truth) ==="
echo "root: $ROOT_DIR"
echo "branch: $(git branch --show-current 2>/dev/null || echo 'NIEZNANY')"
echo "remote:"
if git remote -v >/dev/null 2>&1; then
  git remote -v | sed 's/^/  - /'
else
  echo "  - brak remote"
fi

echo
echo "[Vercel]"
for f in vercel.json docs/VERCEL_SETUP_CHECKLIST.md; do
  if [ -f "$f" ]; then
    echo "  + $f"
  else
    echo "  - brak: $f"
  fi
done

echo
echo "[Supabase]"
for f in supabase/config.toml; do
  if [ -f "$f" ]; then
    echo "  + $f"
  else
    echo "  - brak: $f"
  fi
done

if [ -d supabase/migrations ]; then
  echo "  + migracje: $(find supabase/migrations -maxdepth 1 -type f -name '*.sql' | wc -l | tr -d ' ')"
else
  echo "  - brak katalogu supabase/migrations"
fi

if [ -d supabase/functions ]; then
  echo "  + funkcje: $(find supabase/functions -maxdepth 1 -mindepth 1 -type d | wc -l | tr -d ' ')"
else
  echo "  - brak katalogu supabase/functions"
fi

echo
echo "[Workflows]"
if [ -d .github/workflows ]; then
  find .github/workflows -maxdepth 1 -type f -name '*.yml' | sort | sed 's/^/  - /'
else
  echo "  - brak katalogu .github/workflows"
fi

echo
echo "[Stack detection]"
if [ -f vite.config.ts ] || [ -f vite.config.js ] || [ -f vite.config.mjs ]; then
  echo "  + Vite: wykryto"
else
  echo "  - Vite: brak"
fi

if [ -f next.config.js ] || [ -f next.config.mjs ] || [ -f next.config.ts ]; then
  echo "  + Next.js: wykryto"
else
  echo "  - Next.js: brak"
fi

echo
echo "[Node/npm from package.json]"
if [ -f package.json ]; then
  node -e '
    const fs = require("fs");
    const p = JSON.parse(fs.readFileSync("package.json", "utf8"));
    console.log("  packageManager:", p.packageManager || "brak");
    console.log("  engines.node:", (p.engines && p.engines.node) || "brak");
    console.log("  engines.npm:", (p.engines && p.engines.npm) || "brak");
  '
else
  echo "  - brak package.json"
fi
