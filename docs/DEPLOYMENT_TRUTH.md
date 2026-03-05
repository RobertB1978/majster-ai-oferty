# DEPLOYMENT_TRUTH.md

## Cel
Ten dokument daje binarny dowód, czy po merge do `main` pipeline ma działające sekrety i wykonuje **realny deploy** do właściwego projektu Supabase.

## Single Source of Truth (Supabase project)
- Repo source of truth: `supabase/config.toml` (`project_id`).
- CI source of truth: secret `SUPABASE_PROJECT_REF`.
- Workflow wymusza zgodność `project_id == SUPABASE_PROJECT_REF`; mismatch kończy się `SUPABASE_DEPLOY: FAIL`.

## Status matrix (repo-side)

| Etap Supabase | Status (repo-side) | Dowód w workflow `deployment-truth.yml` |
|---|---|---|
| Precheck (inventory + kontrakty) | **PASS (pipeline gotowy)** | Kroki `Repo inventory` i `Verify pipeline contracts`. |
| Secrets gate | **PASS (pipeline gotowy)** | `Validate required Supabase secrets/vars` sprawdza wyłącznie nazwy i fail-fast. |
| Login + link | **PASS (pipeline gotowy)** | Krok `Login and link project` + log `supabase link succeeded`. |
| Migrations deploy | **PASS (pipeline gotowy)** | `supabase db push` na `push main` gdy są zmiany w `supabase/**`. |
| Functions deploy | **PASS (pipeline gotowy)** | Pętla `supabase functions deploy <fn>` na `push main` gdy są zmiany w `supabase/**`. |
| Final deployment truth | **PASS (pipeline gotowy)** | Jawny marker `SUPABASE_DEPLOY: PASS` albo `SUPABASE_DEPLOY: FAIL (<powód>)`. |

> Uwaga: bez logów z GitHub Actions nie da się potwierdzić runtime-side, że **konkretny run** przeszedł. Repo pokazuje gotowość i mechanizm dowodowy.

## Wymagane secrets (tylko nazwy)
Ustawiane przez ownera: **GitHub → Repository → Settings → Secrets and variables → Actions → New repository secret**.

- `SUPABASE_ACCESS_TOKEN`
- `SUPABASE_DB_PASSWORD`
- `SUPABASE_PROJECT_REF`
- `SUPABASE_ANON_KEY`

Workflow nigdy nie wypisuje wartości sekretów; loguje tylko obecność/brak i PASS/FAIL.

## Co dokładnie musi być w logach (Binary DoD)
Aby uznać deployment proof za DONE po merge do `main`, w logach runu `Deployment Truth Gate` muszą wystąpić:
1. `Using SUPABASE_PROJECT_REF from secrets: PRESENT`
2. `supabase link succeeded`
3. Dla zmian w `supabase/**`: `SUPABASE_DEPLOY: PASS`
4. W przypadku błędu: `SUPABASE_DEPLOY: FAIL (<jednoznaczny powód>)`

## Najczęstsze awarie i znaczenie
1. `SUPABASE_DEPLOY: FAIL (brak wymaganych secrets/vars)`
   - Co znaczy: co najmniej jeden wymagany secret nie jest dostępny w kontekście workflow.
2. `SUPABASE_DEPLOY: FAIL (project ref mismatch: config.toml vs secret)`
   - Co znaczy: CI celuje w inny projekt niż repo source of truth.
3. `SUPABASE_DEPLOY: FAIL (supabase login failed)`
   - Co znaczy: token jest nieważny, wygasł lub ma niewystarczające uprawnienia.
4. `SUPABASE_DEPLOY: FAIL (supabase link failed)`
   - Co znaczy: błędny `SUPABASE_PROJECT_REF` i/lub hasło DB albo problem z dostępem do projektu.
5. `SUPABASE_DEPLOY: FAIL (supabase db push failed)` / `...functions deploy failed...`
   - Co znaczy: błąd migracji SQL albo błąd publikacji konkretnej Edge Function.
