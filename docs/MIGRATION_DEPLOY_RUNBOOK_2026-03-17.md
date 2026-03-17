# Runbook: Wdrożenie Migracji DB na Produkcję — 2026-03-17

**Projekt Supabase:** `xwxvqhhnozfrjcjmcltv`
**Autor:** Senior Supabase Production Deployment Engineer
**Status audytu:** Produkcja zatrzymana ~Dec 2025. Repo ma 31 niezastosowanych migracji (2026-01-26 → 2026-03-14).

---

## 1. KRÓTKIE SEDNO

Produkcja Supabase jest o **31 migracji za repo** (ok. 3 miesiące schemy do dogonienia).
Krytyczne tabele Stage 1 — `offers`, `offer_items`, `acceptance_links`, `offer_public_actions`,
`v2_projects`, `project_costs`, `project_public_status_tokens` — nie istnieją w produkcji.

**Jedyna autoryzowana ścieżka deploymentu to merge do `main` → `deployment-truth.yml`.**
Plik `.github/workflows/supabase-deploy.yml` jest **wyłącznie weryfikacyjny** — nie deployuje nic.

> ⚠️ **BLOKADA PRZED DEPLOYMENTEM:** Bez weryfikacji 4 GitHub Secrets
> (`SUPABASE_ACCESS_TOKEN`, `SUPABASE_DB_PASSWORD`, `SUPABASE_PROJECT_REF`, `SUPABASE_ANON_KEY`)
> workflow pomija deploy Supabase bez błędu (silent skip). Sprawdź sekrety **PRZED** mergem.

---

## 2. PRE-DEPLOY CHECKLIST

### 2a. Weryfikacja GitHub Secrets (KRYTYCZNE — silent skip gdy brak!)

Idź do: **GitHub → repo → Settings → Secrets and variables → Actions**

Muszą istnieć **wszystkie 4** sekrety:

| Nazwa sekretu | Skąd wziąć | Status |
|---|---|---|
| `SUPABASE_ACCESS_TOKEN` | supabase.com → Avatar → Account Settings → Access Tokens | [ ] |
| `SUPABASE_DB_PASSWORD` | supabase.com → Project `xwxvqhhnozfrjcjmcltv` → Settings → Database → Database password | [ ] |
| `SUPABASE_PROJECT_REF` | Wartość: `xwxvqhhnozfrjcjmcltv` | [ ] |
| `SUPABASE_ANON_KEY` | supabase.com → Project → Settings → API → Project API keys → anon/public | [ ] |

> ⚠️ `SUPABASE_PROJECT_REF` MUSI równać się dokładnie `xwxvqhhnozfrjcjmcltv` (małe litery, 20 znaków).
> `supabase/config.toml` potwierdza: `project_id = "xwxvqhhnozfrjcjmcltv"`.

### 2b. Weryfikacja lokalnego stanu repo

```bash
# Upewnij się, że repo jest na main i jest aktualne
git checkout main
git pull origin main

# Policz migracje — powinny być dokładnie 51 pliki .sql
ls supabase/migrations/*.sql | wc -l
# Oczekiwany wynik: 51

# Sprawdź ostatnią migrację
ls supabase/migrations/*.sql | sort | tail -3
# Oczekiwane:
#   supabase/migrations/20260312200835_sprint_d_template_activation.sql
#   supabase/migrations/20260314120000_offer_variants.sql
#   supabase/migrations/20260314130000_offer_photos_public_access.sql
```

### 2c. Sprawdzenie stanu produkcji PRZED deploymentem

Uruchom w Supabase SQL Editor (Dashboard → Project `xwxvqhhnozfrjcjmcltv` → SQL Editor):

```sql
-- Które migracje są już zastosowane?
SELECT version, name
FROM supabase_migrations.schema_migrations
ORDER BY version DESC
LIMIT 10;

-- Czy tabele Stage 1 już istnieją (nie powinny)?
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN (
    'offers', 'offer_items', 'acceptance_links', 'offer_public_actions',
    'v2_projects', 'project_costs', 'project_public_status_tokens'
  )
ORDER BY table_name;
-- Oczekiwane: 0 wierszy (tabele nie istnieją)
```

> Zapisz wyniki obu zapytań jako baseline do porównania po deployu.

### 2d. Backup bazy

```bash
# Opcja A — przez Supabase Dashboard (zalecane bez Supabase CLI):
# Dashboard → Project → Settings → Database → "Backups" → "Create backup"
# LUB: Idź do Database → Backups i potwierdź, że ostatni Point-in-time backup
# jest aktualny (Supabase robi automatyczne PITR co godzinę na planach Pro+).

# Opcja B — przez pg_dump (wymaga DB connection string):
# Settings → Database → Connection string → URI
# pg_dump "postgresql://postgres:PASS@db.xwxvqhhnozfrjcjmcltv.supabase.co:5432/postgres" \
#   --schema=public \
#   --no-owner \
#   -f backup_pre_migration_$(date +%Y%m%d_%H%M%S).sql
```

---

## 3. DEPLOYMENT COMMANDS

### Ścieżka A: GitHub Actions (ZALECANA — canonical, autoryzowana)

```
1. Upewnij się, że 4 GitHub Secrets są ustawione (checklist 2a)
2. Pushuj/merguj do gałęzi main:
      git checkout main
      git merge <twoja_gałąź>
      git push origin main
3. Idź do: GitHub → Actions → "Deployment Truth Gate"
4. Obserwuj job "Supabase Deploy (migrations + functions)"
5. Oczekiwane komunikaty w logach:
      PASS: Wszystkie wymagane secrets/vars są dostępne
      [step: Deploy migrations] supabase db push --password *** --yes
      PASS: Supabase deploy commands zakończone kodem 0
      SUPABASE_DEPLOY: PASS
```

### Ścieżka B: Lokalnie przez Supabase CLI (fallback gdy Actions niedostępne)

**Wymagania:** Supabase CLI zainstalowane, tokeny dostępne lokalnie (nigdy w repo!).

```bash
# Krok 1: Ustaw zmienne środowiskowe (nie commituj tych wartości!)
export SUPABASE_ACCESS_TOKEN="sbp_xxxxxxxxxxxxxxxxxxxx"
export SUPABASE_DB_PASSWORD="twoje_haslo_db"

# Krok 2: Zaloguj się do Supabase CLI
supabase login --token "$SUPABASE_ACCESS_TOKEN"

# Krok 3: Połącz z projektem produkcyjnym
cd /path/to/majster-ai-oferty
supabase link --project-ref xwxvqhhnozfrjcjmcltv --password "$SUPABASE_DB_PASSWORD"
# Oczekiwane: "Linked to project xwxvqhhnozfrjcjmcltv"

# Krok 4: Sprawdź które migracje zostaną zastosowane (DRY RUN)
supabase migration list
# Kolumna "Local" = migracje w repo, "Remote" = zastosowane w produkcji
# Migracje bez znacznika Remote są oczekujące

# Krok 5: Zastosuj migracje (NIE odwracalne dla DDL!)
supabase db push --password "$SUPABASE_DB_PASSWORD" --yes
# Oczekiwane: "Applying migration XXXXXXXXXXXXXXXX_name.sql..." dla każdej oczekującej migracji
# "Finished supabase db push."

# Krok 6: Zweryfikuj
supabase migration list
# Wszystkie 51 migracji powinny mieć znacznik Remote
```

### Ścieżka C: Supabase Dashboard SQL Editor (OSTATECZNY FALLBACK)

Użyj tylko gdy CLI i GitHub Actions są całkowicie niedostępne.
Kolejność jest krytyczna — pliki muszą być aplikowane chronologicznie.

```
1. Dashboard → Project xwxvqhhnozfrjcjmcltv → SQL Editor
2. Otwórz każdy plik migracji z supabase/migrations/ od najstarszego
   do najnowszego (lista w sekcji 3d poniżej)
3. Wklej zawartość i kliknij "Run"
4. Potwierdź: "Success. No rows returned" lub "X rows affected"
5. Przejdź do następnego pliku
```

### 3d. Lista 31 brakujących migracji (w kolejności chronologicznej)

```
01. 20260126_admin_control_plane.sql
02. 20260203141118_fix_admin_panel_rls_policies.sql
03. 20260208190000_grant_admin_role_function.sql
04. 20260220120000_offer_system_v2.sql           ← wymaga: offer_approvals (z Dec 2025)
05. 20260220130000_user_addons.sql
06. 20260223000001_server_side_plan_limits.sql
07. 20260223000002_stripe_events_idempotency.sql  ← wymaga: user_subscriptions (z Dec 2025)
08. 20260223110000_add_vat_rate_to_pdf_data.sql   ← wymaga: pdf_data (z Dec 2025)
09. 20260224000001_plan_requests.sql
10. 20260301120000_pr05_company_profile_additions.sql  ← wymaga: profiles
11. 20260301130000_pr06_monthly_offer_quota.sql
12. 20260301140000_pr09_offers_table.sql          ← TWORZY: offers (Stage 1)
13. 20260301150000_pr10_offer_items.sql           ← TWORZY: offer_items; wymaga: offers, clients
14. 20260301160000_pr11_quota_fn_update.sql       ← wymaga: offers
15. 20260301161000_pr11_quota_fn_legacy_status_compat.sql
16. 20260301170000_pr12_acceptance_links.sql      ← TWORZY: acceptance_links, offer_public_actions
17. 20260301180000_pr13_projects_v2.sql           ← TWORZY: v2_projects, project_public_status_tokens
18. 20260301190000_pr14_burn_bar.sql              ← TWORZY: project_costs; wymaga: v2_projects
19. 20260301200000_pr15_photo_report.sql
20. 20260302000000_pr16_dossier.sql
21. 20260302100000_pr17_document_instances.sql
22. 20260302200000_pr18_warranties.sql
23. 20260302210000_pr18_inspections.sql
24. 20260302220000_pr18_reminders.sql
25. 20260302300000_pr20_billing.sql               ← wymaga: user_subscriptions
26. 20260311000000_pr_pdf_v2_relax_pdf_data_fk.sql ← DROP CONSTRAINT na pdf_data
27. 20260311120000_quick_estimate_draft.sql
28. 20260311180000_acceptance_bridge.sql          ← wymaga: v2_projects, offer_approvals
29. 20260312200835_sprint_d_template_activation.sql
30. 20260314120000_offer_variants.sql             ← wymaga: offers
31. 20260314130000_offer_photos_public_access.sql
```

> ✅ Wszystkie migracje używają `IF NOT EXISTS` / `IF EXISTS` — są idempotentne.
> ✅ Kolejność plików (sortowanie chronologiczne) gwarantuje poprawną kolejność zależności.
> `supabase db push` sam sortuje i stosuje w tej kolejności.

---

## 4. ROLLBACK PLAN

> ⚠️ **Migracje DDL są NIEODWRACALNE przez `db push`.**
> Supabase nie ma wbudowanego `db rollback` dla produkcji.

### Opcje rollback

**Opcja 1: Point-in-Time Recovery (PITR) — PREFEROWANA**
```
Dostępna TYLKO na planach Pro lub wyższych.
1. Dashboard → Project xwxvqhhnozfrjcjmcltv → Settings → Database → Backups
2. Wybierz punkt w czasie PRZED deploymentem
3. Kliknij "Restore" — UWAGA: przywraca całą bazę, usuwa dane po tym punkcie!
```

**Opcja 2: Nowa migracja odwracająca zmiany (safe forward-rollback)**
```sql
-- Przykładowy template rollback migration dla Stage 1:
-- Utwórz nowy plik: supabase/migrations/20260317000000_rollback_stage1.sql

-- KOLEJNOŚĆ: odwrócona (najpierw tabele z FK, potem bazowe)
DROP TABLE IF EXISTS public.project_public_status_tokens CASCADE;
DROP TABLE IF EXISTS public.project_costs CASCADE;
DROP TABLE IF EXISTS public.v2_projects CASCADE;
DROP TABLE IF EXISTS public.offer_public_actions CASCADE;
DROP TABLE IF EXISTS public.acceptance_links CASCADE;
DROP TABLE IF EXISTS public.offer_items CASCADE;
DROP TABLE IF EXISTS public.offer_variants CASCADE;
DROP TABLE IF EXISTS public.offers CASCADE;
-- UWAGA: CASCADE usuwa też FK-zależne wiersze w offer_approvals (v2_project_id)!
```

> NIE twórz rollback migration chyba że deployment rzeczywiście był błędny.
> Dane w tabelach Stage 1 zostaną utracone bezpowrotnie.

**Opcja 3: pg_dump backup (przywracanie ręczne)**
```bash
# Jeśli zrobiłeś backup przed deploymentem (checklist 2d):
psql "postgresql://postgres:PASS@db.xwxvqhhnozfrjcjmcltv.supabase.co:5432/postgres" \
  < backup_pre_migration_YYYYMMDD_HHMMSS.sql
```

---

## 5. POST-DEPLOY SQL VERIFICATION PACK

Uruchom wszystkie zapytania w Supabase SQL Editor po deployu.

### 5a. Weryfikacja migracji — czy wszystkie 51 jest zastosowanych

```sql
SELECT COUNT(*) AS total_applied
FROM supabase_migrations.schema_migrations;
-- Oczekiwane: 51

-- Lista ostatnich 10 (sprawdź czy 20260314* są na liście)
SELECT version, name
FROM supabase_migrations.schema_migrations
ORDER BY version DESC
LIMIT 10;
```

### 5b. Weryfikacja istnienia tabel Stage 1

```sql
SELECT table_name, row_security AS rls
FROM information_schema.tables t
JOIN pg_class c ON c.relname = t.table_name
  AND c.relnamespace = 'public'::regnamespace
WHERE t.table_schema = 'public'
  AND t.table_name IN (
    'offers',
    'offer_items',
    'acceptance_links',
    'offer_public_actions',
    'v2_projects',
    'project_costs',
    'project_public_status_tokens'
  )
ORDER BY t.table_name;
-- Oczekiwane: 7 wierszy, wszystkie rls = 'YES'
```

### 5c. Weryfikacja RLS (Row Level Security)

```sql
SELECT relname AS table_name,
       relrowsecurity AS rls_enabled
FROM pg_class
WHERE relnamespace = 'public'::regnamespace
  AND relkind = 'r'
  AND relname IN (
    'offers', 'offer_items', 'acceptance_links', 'offer_public_actions',
    'v2_projects', 'project_costs', 'project_public_status_tokens'
  )
ORDER BY relname;
-- Oczekiwane: 7 wierszy, wszystkie rls_enabled = true
```

### 5d. Weryfikacja polityk RLS na tabelach Stage 1

```sql
SELECT tablename, policyname, cmd
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN (
    'offers', 'offer_items', 'acceptance_links', 'offer_public_actions',
    'v2_projects', 'project_costs', 'project_public_status_tokens'
  )
ORDER BY tablename, cmd;
-- Oczekiwane:
--   offers:                    4 polityki (SELECT, INSERT, UPDATE, DELETE)
--   offer_items:               4 polityki
--   acceptance_links:          4 polityki
--   offer_public_actions:      1 polityka (SELECT tylko dla właściciela)
--   v2_projects:               4 polityki
--   project_costs:             4 polityki
--   project_public_status_tokens: 4 polityki
-- Razem: 25 polityk
```

### 5e. Weryfikacja funkcji SECURITY DEFINER

```sql
SELECT routine_name, security_type
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name IN (
    'resolve_offer_acceptance_link',
    'process_offer_acceptance_action',
    'resolve_project_public_token'
  );
-- Oczekiwane: 3 wiersze, security_type = 'DEFINER'
```

### 5f. Weryfikacja kolumn kluczowych tabel

```sql
-- offers: sprawdź status CHECK constraint
SELECT column_name, data_type, column_default, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'offers'
ORDER BY ordinal_position;

-- v2_projects: sprawdź kolumny budget z PR-14
SELECT column_name
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'v2_projects'
  AND column_name IN ('budget_net', 'budget_source', 'budget_updated_at');
-- Oczekiwane: 3 wiersze (te kolumny dodane przez PR-14 burn_bar)
```

### 5g. Weryfikacja istnienia wszystkich publicznych tabel (health check)

```sql
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_type = 'BASE TABLE'
ORDER BY table_name;
-- Oczekiwane: ok. 40+ tabel (w tym wszystkie Stage 1)
```

### 5h. Smoke test — REST API (z terminala)

```bash
PROJECT_REF="xwxvqhhnozfrjcjmcltv"
REST_BASE="https://${PROJECT_REF}.supabase.co/rest/v1"
ANON_KEY="<ANON_KEY_Z_SETTINGS_API>"

for table in offers offer_items acceptance_links offer_public_actions \
             v2_projects project_costs project_public_status_tokens; do
  HTTP=$(curl -s -o /tmp/resp -w "%{http_code}" \
    -H "apikey: ${ANON_KEY}" \
    -H "Authorization: Bearer ${ANON_KEY}" \
    "${REST_BASE}/${table}?limit=0")
  CODE=$(python3 -c "import json; d=json.load(open('/tmp/resp')); print(d.get('code',''))" 2>/dev/null || echo "")
  echo "${table}: HTTP ${HTTP} code=${CODE:-none}"
done
# Oczekiwane: HTTP 200 lub HTTP 401/403 (tabela istnieje, RLS blokuje anon)
# BŁĄD: HTTP 404 + code=PGRST205 → tabela NIE istnieje → migracja nie poszła
```

---

## 6. REKOMENDACJA — NASTĘPNY PR

### Decyzja: `types.ts regeneration` PRZED `v2_projects CANCELLED constraint fix`

**Uzasadnienie:**

1. **`types.ts` jest nieaktualny — tabele `acceptance_links` i `offer_public_actions` są NIEOBECNE.**
   Grep potwierdza: te tabele nie mają wpisów w `src/integrations/supabase/types.ts`.
   Każdy komponent próbujący typować `acceptance_links` ma `any` lub błąd kompilacji.

2. **Bez aktualnego `types.ts` TypeScript nie może weryfikować poprawności zapytań Supabase.**
   To oznacza że cały Stage 1 działa bez type-safety — ukryte runtime błędy.

3. **`v2_projects CANCELLED constraint` to schema-patch** (ADD COLUMN lub ALTER CHECK).
   Może poczekać 1 PR. Nie blokuje Stage 1 odczytu/zapisu.

### Kolejność następnych PRów

```
1. PR: types.ts regeneration
   → supabase gen types typescript --project-id xwxvqhhnozfrjcjmcltv > src/integrations/supabase/types.ts
   → Commit, PR, merge do main

2. PR: v2_projects CANCELLED status constraint
   → Nowa migracja dodająca 'CANCELLED' do CHECK constraint w v2_projects.status
   → Commit, PR, merge do main
```

---

## 7. RYZYKA I RED FLAGS

### 🔴 KRYTYCZNE

**RF-1: GitHub Secrets mogą nie być ustawione → silent skip deploy bez błędu**
`deployment-truth.yml` loguje WARN i pomija deploy gdy brak secrets — workflow kończy się SUKCESEM
ale nic nie wdrożyło. Sprawdź sekrety w Settings → Secrets → Actions PRZED mergem.

**RF-2: Brak PITR (Point-in-Time Recovery) jeśli plan jest Free/Starter**
Na darmowym planie Supabase nie ma PITR. Jedynym rollbackiem jest nowa migracja DROP.
Zalecane: upgrade do Pro PRZED deploymentem lub wykonanie pg_dump manualnie.

### 🟠 WYSOKIE

**RF-3: `offer_approvals` musi istnieć dla migracji #04 (offer_system_v2)**
`20260220120000_offer_system_v2.sql` robi `ALTER TABLE public.offer_approvals`.
Jeśli produkcja nie ma `offer_approvals` z Dec 2025, ta migracja FAILUJE.
Evidence: `DEPLOY_DB_PARITY_RUNBOOK.md` wymienia `offer_approvals` jako krytyczną tabelę Dec 2025.
Prawdopodobieństwo problemu: NISKIE — tabela powinna być z wcześniejszych migracji.

**RF-4: `pdf_data` musi istnieć dla migracji #26 (relax_pdf_data_fk)**
`20260311000000_pr_pdf_v2_relax_pdf_data_fk.sql` robi `ALTER TABLE public.pdf_data DROP CONSTRAINT`.
`DROP CONSTRAINT IF EXISTS` — bezpieczne nawet gdy constraint nie istnieje.
Jeśli `pdf_data` nie istnieje → błąd. Evidence z Dec 2025 migracji sugeruje że istnieje.

**RF-5: `types.ts` NIE zawiera `acceptance_links` i `offer_public_actions`**
Po deployu te tabele będą w bazie ale brakuje ich w types.ts.
Frontend kod odwołujący się do nich będzie miał błędy TypeScript lub używał `any`.
Mitygacja: natychmiast po deploy uruchom PR z `types.ts regeneration`.

### 🟡 ŚREDNIE

**RF-6: Migracja `20260301150000_pr10_offer_items.sql` — FK do `clients`**
Dodaje `CONSTRAINT offers_client_id_fkey FOREIGN KEY (client_id) REFERENCES public.clients(id)`.
Używa `ADD CONSTRAINT IF NOT EXISTS` — bezpieczne. Wymaga że tabela `clients` istnieje.
Clients powinna być z Dec 2025 scope. Ryzyko: NISKIE.

**RF-7: `deployment-truth.yml` działa na `push main` — wymaga merge do main**
Nie ma możliwości uruchomienia produkcyjnego deploy bez merge do main.
Nie istnieje workflow dispatch ani manual run który deployuje do produkcji.
To jest świadomy design (single authoritative path) — nie jest to bug.

**RF-8: `offer_variants` (migracja #30) aktualizuje `resolve_offer_acceptance_link`**
Ta migracja robi `CREATE OR REPLACE FUNCTION` na funkcji z PR-12.
Jeśli PR-12 nie zostało zastosowane, OR REPLACE stworzy funkcję od nowa — OK.
Kolejność jest prawidłowa (30 po 16 w liście migracji). Ryzyko: BRAK.

### 🟢 NISKIE / INFORMACYJNE

**RF-9: Wszystkie migracje używają `IF NOT EXISTS` / `IF EXISTS`**
Migracje są w pełni idempotentne. Re-run `supabase db push` dla już zastosowanych
migracji jest bezpieczny — Supabase CLI pomija je na podstawie `schema_migrations`.

**RF-10: `supabase db push --linked` vs `--project-ref`**
`deployment-truth.yml` linkuje przez `supabase link --project-ref xwxvqhhnozfrjcjmcltv`
a następnie `supabase db push`. To jest identyczne z `supabase db push --project-ref`.
Zalecane: użyj CLI path z link + push (zgodny z deployment-truth.yml).
**Nie używaj `supabase db push --linked`** — flaga `--linked` nie istnieje w Supabase CLI.

---

## APPENDIX: Zależności między migracjami

```
auth.users (Supabase built-in)
    └── profiles              [Dec 2025]
    └── organizations         [Dec 2025]
    └── clients               [Dec 2025]
    └── offer_approvals       [Dec 2025]
    └── user_subscriptions    [Dec 2025]
    └── pdf_data              [Dec 2025]
    │
    ├── offers                [PR-09 / 20260301140000]
    │   ├── offer_items       [PR-10 / 20260301150000] ← też FK: clients
    │   ├── acceptance_links  [PR-12 / 20260301170000]
    │   ├── offer_public_actions [PR-12 / 20260301170000]
    │   ├── offer_variants    [20260314120000]
    │   └── v2_projects       [PR-13 / 20260301180000] ← też FK: clients, offers
    │       ├── project_public_status_tokens [PR-13]
    │       └── project_costs [PR-14 / 20260301190000]
    │
    └── offer_approvals       ← ALTER w PR-20, Acceptance Bridge
        └── v2_project_id FK → v2_projects [acceptance_bridge / 20260311180000]
```

---

*Dokument wygenerowany: 2026-03-17*
*Project ref: xwxvqhhnozfrjcjmcltv*
*Repo: RobertB1978/majster-ai-oferty*
*Branch deploy: merge do main → deployment-truth.yml*
