# DEPLOYMENT_TRUTH.md

## Cel
Ten dokument zamyka pytanie: „czy PR-y realnie wdrażają zmiany do Supabase/Vercel?”.
Werdykt opiera się wyłącznie o dowody repo-side (GitHub), bez zgadywania dashboard-side.

## Wynik końcowy (repo-side)

| Obszar | Status | Dlaczego |
|---|---|---|
| Vercel | **UNKNOWN** | `vercel.json` istnieje, ale w repo brak twardego kroku `vercel deploy`; nie da się potwierdzić ustawień Git Integration wyłącznie z kodu. |
| Supabase | **PASS (single deployment authority)** | `deployment-truth.yml` jest jedyną autorytatywną ścieżką deploy na produkcję (`push main`) i emituje marker binarny `SUPABASE_DEPLOY: PASS/FAIL`. `supabase-deploy.yml` działa już tylko jako workflow weryfikacyjny bez deploy. |

## Fakty techniczne

### Stack
- Aplikacja to **Vite** (obecne `vite.config.ts`, skrypty `vite` w `package.json`).
- Brak `next.config.*` (czyli brak Next.js).

### Workflows
Repo zawiera workflowy w `.github/workflows/`, w tym:
- `deployment-truth.yml` (**canonical / authoritative production deploy**)
- `supabase-deploy.yml` (**verification-only**, bez produkcyjnego deploy)
- workflowy CI/test/security/e2e

### Supabase
- Obecne katalogi: `supabase/migrations/`, `supabase/functions/`.
- Gate wymaga nazw sekretów:
  - `SUPABASE_ACCESS_TOKEN`
  - `SUPABASE_PROJECT_REF`
  - `SUPABASE_ANON_KEY`
  - `SUPABASE_DB_URL` (**preferowany** — Session Pooler connection string) **lub** `SUPABASE_DB_PASSWORD` (fallback)
- **Rekomendacja:** używaj `SUPABASE_DB_URL` (Session Pooler). Rozwiązuje błędy SASL auth z GitHub Actions.

## Co robi canonical Deployment Truth Gate
1. Start na `pull_request` i `push` do `main`.
2. Odpala diagnostykę repo (`scripts/verify/repo_inventory.sh`, `supabase_pipeline_check.sh`, `vercel_pipeline_check.sh`).
3. **[PR-L3b]** Wykrywa zmiany w `supabase/migrations/` za pomocą GitHub API (`detect-migrations`).
4. Fail-hard, jeśli PR zawiera migracje **I** brakuje wymaganych sekretów — cichy skip jest niedopuszczalny dla migration-dependent PRs.
5. Fail-fast (skip, nie fail), jeśli brakuje sekretów i PR **nie** zawiera migracji — nie blokuje Vercel.
6. W logu wypisuje tylko **nazwy** brakujących sekretów, nigdy wartości.
7. Loguje do Supabase CLI i linkuje projekt.
8. Na `push main`: wykonuje `supabase db push` (przez `--db-url` jeśli `SUPABASE_DB_URL` jest ustawiony, inaczej `--password`) i deploy Edge Functions.
9. Weryfikuje wynik przez `supabase migration list` + `supabase functions list` i status komend (exit code truth).
10. Na końcu logu emituje dokładnie jeden marker binarny:
    - sukces: `SUPABASE_DEPLOY: PASS`
    - porażka: `SUPABASE_DEPLOY: FAIL`

## Kontrakt: PR z migracjami (od PR-L3b)

> **Twardy kontrakt:** Każdy PR zawierający pliki w `supabase/migrations/**` MUSI mieć skonfigurowane
> sekrety Supabase w GitHub Actions: `SUPABASE_ACCESS_TOKEN`, `SUPABASE_PROJECT_REF`, `SUPABASE_ANON_KEY`
> oraz `SUPABASE_DB_URL` (preferowany) lub `SUPABASE_DB_PASSWORD` (fallback).
> Brak sekretów = workflow FAIL, merge ZABLOKOWANY.

Dotyczy: każdego nowego PR dodającego lub modyfikującego migracje bazy danych.
Nie dotyczy: PR bez zmian w `supabase/migrations/` — dla nich brak sekretów nadal powoduje SKIP (nie FAIL).

## Reality Check coverage (od PR-L3b)

`scripts/verify/expected-schema.json` weryfikuje obecność i kolumny tabel po deployu.

Tabele objęte weryfikacją:
- `offers`, `v2_projects`, `clients`, `plan_limits`, `profiles`
- **`dsar_requests`** ← dodane w PR-L3b (migration: `20260420190000_pr_l3_dsar_requests.sql`)

## Co robi teraz `supabase-deploy.yml`
- Uruchamia się tylko na `pull_request` (zmiany w Supabase/workflow/docs/checker).
- Weryfikuje kontrakt canonical workflow (`scripts/verify/supabase_pipeline_check.sh`).
- Sprawdza sekrety (nazwy), integralność `project_id` i porządek/nazewnictwo migracji.
- Nie wykonuje `supabase db push` ani `supabase functions deploy`.

## Owner actions minimalne (tylko jeśli brak)
1. Dodać sekrety repo w GitHub Actions:
   - `SUPABASE_ACCESS_TOKEN`, `SUPABASE_PROJECT_REF`, `SUPABASE_ANON_KEY` (zawsze wymagane)
   - `SUPABASE_DB_URL` — **preferowany** (Session Pooler connection string; eliminuje błędy SASL auth)
   - `SUPABASE_DB_PASSWORD` — tylko jako fallback jeśli `SUPABASE_DB_URL` niedostępny
2. Upewnić się, że merge do `main` jest jedyną ścieżką wdrożenia produkcyjnego.
3. Monitorować wynik workflow `Deployment Truth Gate` po każdym merge oraz markery:
   - `SUPABASE_DEPLOY: PASS` / `SUPABASE_DEPLOY: FAIL`
   - `SUPABASE_DB_URL_MODE: ON` (gdy używany Session Pooler) lub `SUPABASE_DB_PASSWORD_MODE: ON` (fallback)

## Czego repo nadal nie potwierdza
- Vercel dashboard-side: mapowanie repo→project, branch produkcyjny, status ostatniego deploymentu, konfiguracja ENV w panelu.
- RLS enforcement w Reality Check — stan `relrowsecurity` jest `UNKNOWN` w Phase 1 (patrz `docs/ops/REALITY_CHECK_RUNBOOK.md`).
