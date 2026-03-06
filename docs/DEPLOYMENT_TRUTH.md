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
  - `SUPABASE_DB_PASSWORD`
  - `SUPABASE_PROJECT_REF`
  - `SUPABASE_ANON_KEY`

## Co robi canonical Deployment Truth Gate
1. Start na `pull_request` i `push` do `main`.
2. Odpala diagnostykę repo (`scripts/verify/repo_inventory.sh`, `supabase_pipeline_check.sh`, `vercel_pipeline_check.sh`).
3. Fail-fast, jeśli brakuje wymaganych sekretów/zmiennych (w logu tylko **nazwy**, bez wartości).
4. Loguje do Supabase CLI i linkuje projekt.
5. Na `push main`: wykonuje `supabase db push` i deploy Edge Functions.
6. Weryfikuje wynik przez `supabase migration list` + `supabase functions list` i status komend (exit code truth).
7. Na końcu logu emituje dokładnie jeden marker binarny:
   - sukces: `SUPABASE_DEPLOY: PASS`
   - porażka: `SUPABASE_DEPLOY: FAIL`

## Co robi teraz `supabase-deploy.yml`
- Uruchamia się tylko na `pull_request` (zmiany w Supabase/workflow/docs/checker).
- Weryfikuje kontrakt canonical workflow (`scripts/verify/supabase_pipeline_check.sh`).
- Sprawdza sekrety (nazwy), integralność `project_id` i porządek/nazewnictwo migracji.
- Nie wykonuje `supabase db push` ani `supabase functions deploy`.

## Owner actions minimalne (tylko jeśli brak)
1. Dodać 4 sekrety repo w GitHub Actions: `SUPABASE_ACCESS_TOKEN`, `SUPABASE_DB_PASSWORD`, `SUPABASE_PROJECT_REF`, `SUPABASE_ANON_KEY`.
2. Upewnić się, że merge do `main` jest jedyną ścieżką wdrożenia produkcyjnego.
3. Monitorować wynik workflow `Deployment Truth Gate` po każdym merge oraz marker `SUPABASE_DEPLOY: PASS/FAIL`.

## Czego repo nadal nie potwierdza
- Vercel dashboard-side: mapowanie repo→project, branch produkcyjny, status ostatniego deploymentu, konfiguracja ENV w panelu.
