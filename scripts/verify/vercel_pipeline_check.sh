#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"
cd "$ROOT_DIR"

echo "=== VERCEL PIPELINE CHECK (repo-side) ==="

if [ -f vercel.json ]; then
  echo "[PASS] vercel.json obecny"
else
  echo "[FAIL] vercel.json nie istnieje"
  exit 1
fi

if command -v rg >/dev/null 2>&1; then
  if rg -n "vercel deploy|vercel-action|VERCEL_TOKEN|vercel --prod" .github/workflows/*.yml >/tmp/vercel_hits.txt 2>/dev/null; then
    echo "[PASS] Znaleziono ślady repo-side deploy na Vercel:"
    sed 's/^/  /' /tmp/vercel_hits.txt
  else
    echo "[UNKNOWN] Brak jawnych kroków vercel deploy w .github/workflows/*.yml"
  fi
else
  if grep -nE "vercel deploy|vercel-action|VERCEL_TOKEN|vercel --prod" .github/workflows/*.yml >/tmp/vercel_hits.txt 2>/dev/null; then
    echo "[PASS] Znaleziono ślady repo-side deploy na Vercel:"
    sed 's/^/  /' /tmp/vercel_hits.txt
  else
    echo "[UNKNOWN] Brak jawnych kroków vercel deploy w .github/workflows/*.yml"
  fi
fi

echo "Co wiemy: repo zawiera konfigurację vercel.json."
echo "Czego nie wiemy z repo: mapowanie projektu Vercel, ustawienia Git Integration, status auto-deploy po stronie panelu Vercel."
