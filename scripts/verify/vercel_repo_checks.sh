#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"
cd "$ROOT_DIR"

echo "=== VERCEL REPO CHECKS (offline, bez sekretów) ==="

echo
if [ -f vercel.json ]; then
  echo "[PASS] vercel.json istnieje"
  echo "framework/build/output z vercel.json:"
  node -e '
    const fs = require("fs");
    const v = JSON.parse(fs.readFileSync("vercel.json", "utf8"));
    console.log("  framework:", v.framework || "brak");
    console.log("  buildCommand:", v.buildCommand || "brak");
    console.log("  outputDirectory:", v.outputDirectory || "brak");
    console.log("  rewrite_count:", Array.isArray(v.rewrites) ? v.rewrites.length : 0);
  '
else
  echo "[FAIL] brak vercel.json"
fi

echo
if [ -d .github/workflows ]; then
  MATCHES=$(rg -n "vercel|vercel-action|VERCEL" .github/workflows/*.yml || true)
  if [ -n "$MATCHES" ]; then
    echo "[INFO] Wzmianki o Vercel w workflow:"
    echo "$MATCHES" | sed 's/^/  /'
  else
    echo "[INFO] Brak wzmianki o Vercel w .github/workflows/*.yml"
  fi
else
  echo "[WARN] Brak katalogu .github/workflows"
fi

echo
DOC_FILE="docs/VERCEL_SETUP_CHECKLIST.md"
EXPECTED_VARS=(
  "VITE_SUPABASE_URL"
  "VITE_SUPABASE_ANON_KEY"
  "VITE_SENTRY_DSN"
  "VITE_SENTRY_ORG"
  "VITE_SENTRY_PROJECT"
  "VITE_SENTRY_AUTH_TOKEN"
)

if [ -f "$DOC_FILE" ]; then
  echo "[INFO] Zmienne ENV opisane w $DOC_FILE (sprawdzam tylko nazwy):"
  for var_name in "${EXPECTED_VARS[@]}"; do
    if rg -q "$var_name" "$DOC_FILE"; then
      echo "  + $var_name"
    else
      echo "  - brak wzmianki: $var_name"
    fi
  done
else
  echo "[WARN] Brak $DOC_FILE"
fi

echo
echo "Werdykt repo-side:"
echo "- Ten skrypt NIE potwierdza dashboardu Vercel."
echo "- Jeśli brak dowodów dashboardowych, finalny status pozostaje FAIL."
