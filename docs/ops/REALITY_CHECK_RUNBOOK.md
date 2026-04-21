# Supabase Reality Check — Runbook

## GitHub Secrets (nazwy — nigdy wartości)

Aby uruchomić Reality Check w CI, dodaj następujące sekrety do repozytorium:

**GitHub → Settings → Secrets and variables → Actions → New repository secret**

| Nazwa sekretu | Skąd wziąć | Wymagany? |
|---------------|------------|-----------|
| `SUPABASE_URL` | Supabase Dashboard → Project Settings → API → Project URL | ✅ Wymagany |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase Dashboard → Project Settings → API → `service_role` key | ✅ Wymagany |

**⚠️ Bezpieczeństwo:**
- `SUPABASE_SERVICE_ROLE_KEY` to klucz administratora — nigdy nie umieszczaj go w kodzie frontendu
- W logach CI skrypt loguje tylko NAZWY zmiennych, nigdy wartości
- Dostęp do GitHub Secrets ma tylko pipeline CI — nie jest eksponowany użytkownikom

---

## Owner Actions — RLS (Phase 1 limitation)

### Problem

W Phase 1 stan RLS (Row Level Security) jest oznaczony jako `UNKNOWN` dla wszystkich tabel.

**Powód techniczny:** PostgREST + `service_role_key` nie ujawnia wartości `relrowsecurity` z `pg_catalog.pg_class`. Jest to ograniczenie architektury PostgREST — service_role omija RLS całkowicie, więc stan RLS nie jest dostępny przez ten interface.

### Opcja A: Supabase Management API (zalecana)

Wymaga dodania dwóch sekretów już dostępnych w istniejącym workflow:

| Nazwa sekretu | Już w workflow? |
|---------------|----------------|
| `SUPABASE_ACCESS_TOKEN` | ✅ Tak (używany przez Supabase CLI) |
| `SUPABASE_PROJECT_REF` | ✅ Tak (używany przez Supabase CLI) |

Żeby aktywować RLS check przez Management API w przyszłej fazie:
1. Upewnij się, że `SUPABASE_ACCESS_TOKEN` i `SUPABASE_PROJECT_REF` są w GitHub Secrets
2. Zaktualizuj `supabase_reality_check.mjs` o wywołanie Management API
3. Endpoint: `GET https://api.supabase.com/v1/projects/{ref}/database/tables?included_schemas=public`
4. Wymaga implementacji Phase 2 — poza scopem Phase 1

### Opcja B: Bezpośrednie połączenie PostgreSQL

Wymaga dodania:

| Nazwa sekretu | Skąd wziąć |
|---------------|------------|
| `DATABASE_URL` | Supabase Dashboard → Project Settings → Database → Connection string |

Pozwala na zapytania do `pg_catalog.pg_class` przez `node-postgres` lub podobne.
Wymaga otwarcia dostępu do bazy z GitHub Actions (IP whitelisting lub przez Supabase pooler).

### Opcja C: RPC Function (wymaga zmiany schematu)

Dodanie SECURITY DEFINER funkcji w bazie, która zwraca stan RLS dla podanych tabel.
Poza scopem Phase 1 — wymaga nowej migracji.

---

## Procedura rollback

### Jeśli Reality Check generuje false positive P0 FAIL

**Krok 1: Sprawdź raport**

```bash
# Pobierz artifact z GitHub Actions: reality-check-report
cat scripts/verify/reality-report.json | jq '.tables[] | select(.status == "MISSING" or .status == "PARTIAL")'
```

**Krok 2: Zweryfikuj ręcznie w Supabase Dashboard**

- Supabase Dashboard → Table Editor → sprawdź czy tabela istnieje
- Supabase Dashboard → SQL Editor → `SELECT * FROM information_schema.columns WHERE table_name = 'nazwa_tabeli'`

**Krok 3: Jeśli tabela faktycznie istnieje (false positive)**

Możliwe przyczyny:
- Tabela nie jest eksponowana przez PostgREST (nie jest w schemacie `public`)
- Problem z połączeniem do PostgREST podczas CI

Naprawa: sprawdź `SUPABASE_URL` — czy wskazuje na właściwy projekt.

**Krok 4: Jeśli tabela faktycznie nie istnieje (prawdziwy P0)**

- Sprawdź czy migracja została wdrożona: Supabase Dashboard → Database → Migrations
- Uruchom ręcznie: `supabase db push --password "$SUPABASE_DB_PASSWORD" --yes`
- Weryfikacja: ponownie uruchom workflow

### Wyłączenie Reality Check (tymczasowe)

**NIE ZALECANE w produkcji.** Tylko do debugowania.

W `.github/workflows/deployment-truth.yml` zmień w stepie "Supabase Reality Check":
```yaml
if: false  # TYMCZASOWE — pamiętaj przywrócić
```

Lub usuń sekrety `SUPABASE_URL` i `SUPABASE_SERVICE_ROLE_KEY` z GitHub Secrets — wtedy step przejdzie jako UNKNOWN (exit 0).

### Przywrócenie po błędnym expected-schema.json

Jeśli `expected-schema.json` zawiera błędny kontrakt (np. kolumna której nie ma):

```bash
git log --oneline scripts/verify/expected-schema.json
git show <hash>:scripts/verify/expected-schema.json > /tmp/expected-schema-prev.json
# sprawdź różnicę
diff /tmp/expected-schema-prev.json scripts/verify/expected-schema.json
```

Cofnij zmianę kontraktu i utwórz nowy commit.

---

## Jak lokalnie symulować brakującą tabelę (test P0 FAIL)

```bash
# Zmodyfikuj tymczasowo expected-schema.json dodając nieistniejącą tabelę
# NIE commituj tej zmiany!
export SUPABASE_URL="https://twoj-projekt.supabase.co"
export SUPABASE_SERVICE_ROLE_KEY="eyJhbGci..."
node scripts/verify/supabase_reality_check.mjs
# Oczekiwany wynik: REALITY_CHECK: FAIL, exit code 1
```

---

## Jak lokalnie uruchomić testy (bez połączenia z Supabase)

```bash
node --test scripts/verify/reality_check.test.mjs
```

Testy unit nie wymagają żadnych env vars — testują wyłącznie czystą logikę porównywania.

---

## Artefakty CI

Po każdym uruchomieniu workflow "Deployment Truth Gate" dostępne są artefakty:

**GitHub Actions → run → Artifacts → `reality-check-report`**

Zawiera:
- `reality-report.json` — pełny raport maszynowy
- `reality-report.md` — raport czytelny dla człowieka

Przechowywane domyślnie 90 dni (ustawienie GitHub Actions).

---

## CI marker

Szukaj w logu CI:

```
REALITY_CHECK: PASS
```

lub

```
REALITY_CHECK: FAIL
REALITY_CHECK: PARTIAL
REALITY_CHECK: UNKNOWN
```

Grep po logu:
```bash
grep "REALITY_CHECK:" <plik_logu>
```

---

---

## Weryfikacja compliance stack post-deploy

Po deployu migracj PR-L1–PR-L8 Reality Check automatycznie weryfikuje obecność i strukturę tabel compliance. Poniżej lista **owner actions** wymaganych do pełnego potwierdzenia poprawności compliance stack.

### Krok 1 — Potwierdź P0: tabele compliance EXISTS

Gdy `REALITY_CHECK: PASS`, wszystkie poniższe tabele są automatycznie potwierdzone jako EXISTS:

```
dsar_requests, legal_documents, legal_acceptances,
compliance_audit_log, subprocessors, retention_rules, data_breaches
```

Jeśli któraś tabela ma status `MISSING` lub `PARTIAL` → P0 FAIL → sprawdź czy migracja została wdrożona przez Supabase Dashboard → Database → Migrations.

### Krok 2 — Potwierdź RLS (manual, Phase 1 limitation)

Dla tabel compliance wykonaj w Supabase Dashboard → SQL Editor:

```sql
-- Sprawdź stan RLS dla wszystkich tabel compliance
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN (
    'dsar_requests', 'legal_documents', 'legal_acceptances',
    'compliance_audit_log', 'subprocessors', 'retention_rules', 'data_breaches'
  )
ORDER BY tablename;
-- Oczekiwany wynik: rowsecurity = true dla wszystkich 7 tabel
```

### Krok 3 — Potwierdź funkcje compliance (manual)

```sql
-- Sprawdź czy 3 funkcje compliance istnieją z SECURITY DEFINER
SELECT routine_name, security_type
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name IN ('is_admin', 'publish_legal_document', 'create_legal_draft_from_published')
ORDER BY routine_name;
-- Oczekiwany wynik: 3 wiersze, security_type = 'DEFINER'
```

Jeśli któraś funkcja brakuje → migracja `20260421120000_pr_legal_l4_cms_admin.sql` nie została wdrożona.

### Krok 4 — Potwierdź seed danych (manual)

```sql
-- subprocessors: oczekiwane min. 8 rekordów (status active lub planned)
SELECT COUNT(*) FROM public.subprocessors;

-- retention_rules: oczekiwane min. 10 rekordów
SELECT COUNT(*) FROM public.retention_rules;

-- legal_documents: oczekiwane min. 5 rekordów (PL: privacy/terms/cookies/dpa/rodo)
SELECT COUNT(*) FROM public.legal_documents WHERE status = 'published';
```

---

## Powiązane dokumenty

- `docs/ops/REALITY_CHECK.md` — dokumentacja użytkowa, tabela compliance stack
- `docs/DEPLOYMENT_TRUTH.md` — Deployment Truth Gate overview
- `scripts/verify/expected-schema.json` — kontrakt schematu
