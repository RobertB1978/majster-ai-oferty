# DEPLOYMENT_TRUTH.md

## Cel
Ten dokument zamyka pytanie: „czy PR-y realnie wdrażają zmiany do Supabase/Vercel?”.
Werdykt opiera się wyłącznie o dowody repo-side (GitHub), bez zgadywania dashboard-side.

## Wynik końcowy (repo-side)

| Obszar | Status | Dlaczego |
|---|---|---|
| Vercel | **UNKNOWN** | `vercel.json` istnieje, ale w repo brak twardego kroku `vercel deploy`; nie da się potwierdzić ustawień Git Integration wyłącznie z kodu. |
| Supabase | **PASS (pipeline gotowy)** | Jest automatyczny gate `deployment-truth.yml` na `pull_request` i `push` do `main`, waliduje wymagane sekrety (nazwy), uruchamia deploy migracji i funkcji na `push main`, oraz kończy się PASS/FAIL wg kodu wyjścia komend Supabase CLI. |

## Fakty techniczne

### Stack
- Aplikacja to **Vite** (obecne `vite.config.ts`, skrypty `vite` w `package.json`).
- Brak `next.config.*` (czyli brak Next.js).

### Workflows
Repo zawiera workflowy w `.github/workflows/`, w tym nowy:
- `deployment-truth.yml` (Deployment Truth Gate)
- `supabase-deploy.yml` (istniejący deploy Supabase)
- workflowy CI/test/security/e2e

### Supabase
- Obecne katalogi: `supabase/migrations/`, `supabase/functions/`.
- Gate wymaga nazw sekretów:
  - `SUPABASE_ACCESS_TOKEN`
  - `SUPABASE_DB_PASSWORD`
  - `SUPABASE_PROJECT_REF`
  - `SUPABASE_ANON_KEY`

## Co robi Deployment Truth Gate
1. Start na `pull_request` i `push` do `main`.
2. Odpala diagnostykę repo (`scripts/verify/repo_inventory.sh`, `supabase_pipeline_check.sh`, `vercel_pipeline_check.sh`).
3. Fail-fast, jeśli brakuje wymaganych sekretów/zmiennych (w logu tylko **nazwy**, bez wartości).
4. Loguje do Supabase CLI i linkuje projekt.
5. Na `push main`: wykonuje `supabase db push` i deploy Edge Functions.
6. Weryfikuje wynik przez `supabase migration list` + `supabase functions list` i status komend (exit code truth).

## Owner actions minimalne (tylko jeśli brak)
1. Dodać 4 sekrety repo w GitHub Actions: `SUPABASE_ACCESS_TOKEN`, `SUPABASE_DB_PASSWORD`, `SUPABASE_PROJECT_REF`, `SUPABASE_ANON_KEY`.
2. Upewnić się, że merge do `main` jest jedyną ścieżką wdrożenia produkcyjnego.
3. Monitorować wynik workflow `Deployment Truth Gate` po każdym merge.

## Czego repo nadal nie potwierdza
- Vercel dashboard-side: mapowanie repo→project, branch produkcyjny, status ostatniego deploymentu, konfiguracja ENV w panelu.
