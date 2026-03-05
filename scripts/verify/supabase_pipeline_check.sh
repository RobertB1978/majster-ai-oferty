#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"
cd "$ROOT_DIR"

WF=".github/workflows/deployment-truth.yml"
REQUIRED_SECRETS=(SUPABASE_ACCESS_TOKEN SUPABASE_DB_PASSWORD SUPABASE_PROJECT_REF SUPABASE_ANON_KEY)
REQUIRED_MARKERS=(
  "on:"
  "pull_request:"
  "push:"
  "branches: [main]"
  "supabase db push"
  "supabase functions deploy"
)

has_fixed() {
  local needle="$1"
  local file="$2"
  if command -v rg >/dev/null 2>&1; then
    rg -qF "$needle" "$file"
  else
    grep -qF -- "$needle" "$file"
  fi
}

has_regex() {
  local pattern="$1"
  local file="$2"
  if command -v rg >/dev/null 2>&1; then
    rg -q "$pattern" "$file"
  else
    grep -qE -- "$pattern" "$file"
  fi
}

echo "=== SUPABASE PIPELINE CHECK ==="
if [ ! -f "$WF" ]; then
  echo "[FAIL] Brak $WF"
  exit 1
fi

echo "[PASS] Workflow istnieje: $WF"

for marker in "${REQUIRED_MARKERS[@]}"; do
  if has_fixed "$marker" "$WF"; then
    echo "[PASS] marker: $marker"
  else
    echo "[FAIL] marker: $marker"
    exit 1
  fi
done

echo "Oczekiwane sekrety/zmienne (nazwy):"
for s in "${REQUIRED_SECRETS[@]}"; do
  if has_regex "$s" "$WF"; then
    echo "  - $s"
  else
    echo "[FAIL] Brak odwołania do $s w $WF"
    exit 1
  fi
done

echo "[PASS] Supabase pipeline ma wymagane kroki i nazwy sekretów"
