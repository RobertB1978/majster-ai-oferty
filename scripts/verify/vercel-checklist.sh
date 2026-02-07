#!/usr/bin/env bash
# Majster.AI — Vercel Truth Checklist (diagnostyka lokalna)
# Cel: Sprawdzić co możemy zweryfikować z poziomu repo i CLI.
# Uwaga: Pełna weryfikacja wymaga dostępu do Vercel Dashboard.
#
# Użycie: bash scripts/verify/vercel-checklist.sh

set -euo pipefail

echo "================================================"
echo "  Majster.AI — Vercel Truth Checklist"
echo "  Data: $(date '+%Y-%m-%d %H:%M:%S')"
echo "================================================"
echo ""

# 1. Sprawdź czy vercel.json istnieje
echo "--- 1. vercel.json ---"
if [ -f "vercel.json" ]; then
    echo "PASS: vercel.json istnieje"
    echo "  Framework: $(grep -o '"framework"[^,]*' vercel.json || echo 'nie znaleziono')"
    echo "  Build command: $(grep -o '"buildCommand"[^,]*' vercel.json || echo 'nie znaleziono')"
    echo "  Output dir: $(grep -o '"outputDirectory"[^,]*' vercel.json || echo 'nie znaleziono')"
else
    echo "FAIL: vercel.json NIE ISTNIEJE"
fi
echo ""

# 2. Sprawdź CSP headers
echo "--- 2. CSP Headers (z vercel.json) ---"
if grep -q "frame-ancestors 'none'" vercel.json 2>/dev/null; then
    echo "INFO: Globalny CSP ma frame-ancestors 'none'"
    echo "  UWAGA: To blokuje osadzanie aplikacji w iframe (dotyczy /offer/*)"
fi
if grep -q "X-Frame-Options.*SAMEORIGIN" vercel.json 2>/dev/null; then
    echo "INFO: /offer/* ma X-Frame-Options: SAMEORIGIN"
    echo "  UWAGA: CSP frame-ancestors ma wyższy priorytet niż X-Frame-Options"
fi
echo ""

# 3. Sprawdź build lokalnie
echo "--- 3. Build check ---"
if command -v npm &>/dev/null; then
    echo "npm version: $(npm --version)"
    echo "node version: $(node --version)"
    echo ""
    echo "Aby zweryfikować build:"
    echo "  npm ci"
    echo "  npm run build"
    echo "  ls -la dist/  # Sprawdź czy dist/ istnieje po build"
else
    echo "WARN: npm nie znaleziony"
fi
echo ""

# 4. Sprawdź env
echo "--- 4. Environment Variables ---"
if [ -f ".env" ]; then
    echo "PASS: .env istnieje"
    if grep -q "VITE_SUPABASE_URL" .env 2>/dev/null; then
        echo "  PASS: VITE_SUPABASE_URL jest w .env"
    else
        echo "  WARN: VITE_SUPABASE_URL NIE ZNALEZIONY w .env"
    fi
    if grep -q "VITE_SUPABASE_ANON_KEY" .env 2>/dev/null; then
        echo "  PASS: VITE_SUPABASE_ANON_KEY jest w .env"
    else
        echo "  WARN: VITE_SUPABASE_ANON_KEY NIE ZNALEZIONY w .env"
    fi
else
    echo "INFO: .env nie istnieje lokalnie (OK jeśli env są w Vercel Dashboard)"
fi
echo ""

if [ -f ".env.example" ]; then
    echo "PASS: .env.example istnieje (template)"
else
    echo "WARN: .env.example nie istnieje"
fi
echo ""

# 5. Sprawdź sekrety w kodzie
echo "--- 5. Secrets check ---"
SECRETS_FOUND=0
if grep -r "service_role" src/ 2>/dev/null | grep -v ".test." | grep -v "node_modules" | head -5; then
    echo "FAIL: Znaleziono 'service_role' w src/ — potencjalny wyciek!"
    SECRETS_FOUND=1
fi
if grep -r "sk-[a-zA-Z0-9]" src/ 2>/dev/null | grep -v ".test." | grep -v "node_modules" | head -5; then
    echo "FAIL: Znaleziono potencjalny API key w src/"
    SECRETS_FOUND=1
fi
if [ "$SECRETS_FOUND" -eq 0 ]; then
    echo "PASS: Brak widocznych sekretów w src/"
fi
echo ""

# 6. Sprawdź .gitignore
echo "--- 6. Gitignore check ---"
if grep -q "\.env$" .gitignore 2>/dev/null || grep -q "\.env\b" .gitignore 2>/dev/null; then
    echo "PASS: .env jest w .gitignore"
else
    echo "WARN: .env może NIE BYĆ w .gitignore!"
fi
echo ""

echo "================================================"
echo "  WYMAGANA RĘCZNA WERYFIKACJA (Vercel Dashboard)"
echo "================================================"
echo ""
echo "Otwórz: https://vercel.com (zaloguj się)"
echo ""
echo "Sprawdź i wypełnij docs/DEPLOYMENT_TRUTH.md:"
echo "  [ ] Git integration podpięte do repo"
echo "  [ ] ENV vars ustawione dla Production + Preview"
echo "  [ ] Ostatni deploy: SUCCESS"
echo "  [ ] Production URL działa (nie biała strona)"
echo "  [ ] Console (F12) bez błędów konfiguracji"
echo ""
echo "Skrypt zakończony."
