#!/usr/bin/env bash
# Majster.AI — Supabase Truth Checklist (diagnostyka lokalna)
# Cel: Sprawdzić co możemy zweryfikować z poziomu repo.
# Uwaga: Pełna weryfikacja wymaga dostępu do Supabase Dashboard.
#
# Użycie: bash scripts/verify/supabase-checklist.sh

set -euo pipefail

echo "================================================"
echo "  Majster.AI — Supabase Truth Checklist"
echo "  Data: $(date '+%Y-%m-%d %H:%M:%S')"
echo "================================================"
echo ""

# 1. Sprawdź migracje w repo
echo "--- 1. Migracje SQL w repo ---"
MIGRATION_DIR="supabase/migrations"
if [ -d "$MIGRATION_DIR" ]; then
    MIGRATION_COUNT=$(ls -1 "$MIGRATION_DIR"/*.sql 2>/dev/null | wc -l)
    echo "PASS: Znaleziono $MIGRATION_COUNT migracji w $MIGRATION_DIR"
    echo ""
    echo "Najnowsze 5 migracji:"
    ls -1 "$MIGRATION_DIR"/*.sql 2>/dev/null | sort | tail -5 | while read -r f; do
        echo "  $(basename "$f")"
    done
    echo ""
    echo "PYTANIE: Czy te migracje są wdrożone na produkcji?"
    echo "  Sprawdź: Supabase Dashboard → SQL Editor → SELECT * FROM supabase_migrations.schema_migrations;"
else
    echo "FAIL: Katalog $MIGRATION_DIR nie istnieje"
fi
echo ""

# 2. Sprawdź Edge Functions w repo
echo "--- 2. Edge Functions w repo ---"
FUNCTIONS_DIR="supabase/functions"
if [ -d "$FUNCTIONS_DIR" ]; then
    FUNC_COUNT=$(ls -1d "$FUNCTIONS_DIR"/*/ 2>/dev/null | grep -v "_shared" | wc -l)
    echo "PASS: Znaleziono $FUNC_COUNT Edge Functions (+ _shared)"
    echo ""
    echo "Lista funkcji:"
    ls -1d "$FUNCTIONS_DIR"/*/ 2>/dev/null | while read -r d; do
        FUNC_NAME=$(basename "$d")
        if [ "$FUNC_NAME" = "_shared" ]; then
            echo "  $FUNC_NAME (shared utils)"
        else
            # Sprawdź czy ma index.ts
            if [ -f "$d/index.ts" ]; then
                echo "  $FUNC_NAME (index.ts OK)"
            else
                echo "  $FUNC_NAME (WARN: brak index.ts)"
            fi
        fi
    done
    echo ""
    echo "PYTANIE: Czy te funkcje są wdrożone na produkcji?"
    echo "  Sprawdź: Supabase Dashboard → Edge Functions → lista"
else
    echo "FAIL: Katalog $FUNCTIONS_DIR nie istnieje"
fi
echo ""

# 3. Sprawdź kluczowe tabele z migracji
echo "--- 3. Kluczowe tabele (z analizy migracji) ---"
echo "Na podstawie migracji SQL, te tabele POWINNY istnieć na produkcji:"
echo ""

# Szukaj CREATE TABLE w migracjach
if [ -d "$MIGRATION_DIR" ]; then
    echo "Tabele znalezione w migracjach:"
    grep -rh "CREATE TABLE" "$MIGRATION_DIR"/*.sql 2>/dev/null | \
        sed 's/.*CREATE TABLE[^"]*"\?\([a-zA-Z_]*\)"\?.*/  \1/' | \
        sort -u | head -30
    echo ""
    echo "PYTANIE: Czy te tabele istnieją w Supabase Dashboard → Table Editor?"
fi
echo ""

# 4. Sprawdź RLS w migracjach
echo "--- 4. RLS Policies (z migracji) ---"
if [ -d "$MIGRATION_DIR" ]; then
    RLS_ENABLE=$(grep -rch "ENABLE ROW LEVEL SECURITY" "$MIGRATION_DIR"/*.sql 2>/dev/null | paste -sd+ | bc 2>/dev/null || echo "0")
    RLS_POLICIES=$(grep -rch "CREATE POLICY" "$MIGRATION_DIR"/*.sql 2>/dev/null | paste -sd+ | bc 2>/dev/null || echo "0")
    echo "  RLS ENABLED statements: $RLS_ENABLE"
    echo "  CREATE POLICY statements: $RLS_POLICIES"
    echo ""
    echo "PYTANIE: Czy RLS jest aktywne na produkcji?"
    echo "  Sprawdź: Supabase Dashboard → Authentication → Policies"
fi
echo ""

# 5. Sprawdź Supabase config
echo "--- 5. Supabase Config ---"
if [ -f "supabase/config.toml" ]; then
    echo "PASS: supabase/config.toml istnieje"
    # Sprawdź project_id
    if grep -q "project_id" supabase/config.toml 2>/dev/null; then
        echo "  project_id znaleziony (nie wyświetlam wartości ze względów bezpieczeństwa)"
    fi
else
    echo "WARN: supabase/config.toml nie istnieje"
fi
echo ""

# 6. Sprawdź deploy workflow
echo "--- 6. Supabase Deploy Workflow ---"
DEPLOY_WORKFLOW=".github/workflows/supabase-deploy.yml"
if [ -f "$DEPLOY_WORKFLOW" ]; then
    echo "PASS: $DEPLOY_WORKFLOW istnieje"
    if grep -q "workflow_dispatch" "$DEPLOY_WORKFLOW" 2>/dev/null; then
        echo "  Trigger: manual (workflow_dispatch)"
    fi
    if grep -q "supabase db push" "$DEPLOY_WORKFLOW" 2>/dev/null; then
        echo "  Migracje: supabase db push"
    fi
    if grep -q "supabase functions deploy" "$DEPLOY_WORKFLOW" 2>/dev/null; then
        echo "  Functions: supabase functions deploy"
    fi
else
    echo "WARN: Brak workflow do deployu Supabase"
fi
echo ""

echo "================================================"
echo "  WYMAGANA RĘCZNA WERYFIKACJA (Supabase Dashboard)"
echo "================================================"
echo ""
echo "Otwórz: https://supabase.com/dashboard (zaloguj się)"
echo ""
echo "Sprawdź i wypełnij docs/DEPLOYMENT_TRUTH.md:"
echo "  [ ] Projekt ACTIVE"
echo "  [ ] Tabele istnieją (Table Editor)"
echo "  [ ] RLS enabled na tabelach z danymi"
echo "  [ ] Edge Functions wdrożone (lista w Dashboard)"
echo "  [ ] Auth redirect URLs pasują do Vercel domain"
echo "  [ ] Secrets ustawione (RESEND_API_KEY, FRONTEND_URL, AI provider)"
echo "  [ ] Healthcheck: curl https://[ref].supabase.co/functions/v1/healthcheck"
echo ""
echo "Skrypt zakończony."
