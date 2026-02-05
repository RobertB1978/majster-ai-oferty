#!/usr/bin/env bash
set -euo pipefail

echo "== VERCEL REPO CHECKS =="

if [ -f vercel.json ]; then
  echo "[PASS] vercel.json exists"
  if grep -q '"framework"[[:space:]]*:[[:space:]]*"vite"' vercel.json; then
    echo "[PASS] framework=vite"
  else
    echo "[WARN] framework=vite not found"
  fi

  if grep -q '"destination"[[:space:]]*:[[:space:]]*"/index.html"' vercel.json; then
    echo "[PASS] SPA rewrite to /index.html detected"
  else
    echo "[WARN] SPA rewrite not detected"
  fi
else
  echo "[FAIL] vercel.json missing"
fi

echo
if [ -d .github/workflows ]; then
  echo "workflow files mentioning 'vercel':"
  rg -n --glob '.github/workflows/*' -i 'vercel|deploy' .github/workflows || echo "  (no matches)"
else
  echo "[WARN] .github/workflows missing"
fi

echo
if [ -f docs/VERCEL_SETUP_CHECKLIST.md ]; then
  echo "env vars documented (names only):"
  rg -n 'VITE_SUPABASE_URL|VITE_SUPABASE_ANON_KEY|VITE_SENTRY_DSN|VITE_SENTRY_ORG|VITE_SENTRY_PROJECT|VITE_SENTRY_AUTH_TOKEN' docs/VERCEL_SETUP_CHECKLIST.md | sed 's#^#  #' || true
else
  echo "[WARN] docs/VERCEL_SETUP_CHECKLIST.md missing"
fi

echo
echo "note: skrypt nie czyta sekretów i nie łączy się z siecią"
