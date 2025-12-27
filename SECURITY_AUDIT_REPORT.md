# 🔒 SUPABASE SECURITY AUDIT REPORT

**Projekt:** Majster.AI (Production)
**Supabase Ref:** `xwvxqhhnozfrjcjmcltv`
**Data Audytu:** 2025-12-27
**Audytor:** Senior Security + Backend Engineer

---

## A) 🚨 EXECUTIVE VERDICT

### ❌ **STATUS: NIE MOŻNA URUCHOMIĆ PRODUKCJI**

**Powód:** Analiza repozytorium wykazała, że migracje zawierają błędy składniowe (polskie znaki w kodzie SQL), które prawdopodobnie spowodowały, że część migracji NIE została wykonana na produkcji. **Baza danych jest niekompletna.**

**Ryzyko:** Jeśli nie wszystkie 33 tabele są wdrożone, aplikacja nie może działać poprawnie. Jeśli tabele istnieją ale NIE mają RLS policies, **dane użytkowników są publicznie dostępne.**

---

## B) 🔥 BLOCKERS & CRITICAL ISSUES

### BLOCKER #1: Migracje nie są wykonane (P0 - CRITICAL)

**Problem:**
- Master migration zawiera polskie znaki w `RAISE NOTICE`
- Błąd: `ERROR: 42601: syntax error at or near "RAISE" LINE 34`
- **KONSEKWENCJA:** Jeśli migracje nie przeszły, baza danych ma tylko ~11 tabel zamiast 33

**Weryfikacja:**
Wykonaj QUERY 1 i QUERY 3 z `security_audit_queries.sql` i sprawdź:
1. Czy wszystkie 20 migracji są w `schema_migrations`
2. Czy wszystkie 33 tabele istnieją

**FIX (P0 - IMMEDIATE):**

```sql
-- KROK 1: Sprawdź ile tabel masz
SELECT COUNT(*) FROM information_schema.tables
WHERE table_schema = 'public' AND table_type = 'BASE TABLE';

-- Jeśli mniej niż 33, uruchom migration bez polskich znaków:
```

Użyj pliku: `supabase/migration_part_1_podstawowe.sql` (bez polskich znaków)

---

### BLOCKER #2: Brak weryfikacji RLS Policies (P0 - CRITICAL)

**Problem:**
- W migracjach jest 218 policies (✅ to dobrze)
- Ale NIE WIEMY czy są na produkcji
- Jeśli RLS policies nie zostały utworzone → **WSZYSCY widzą wszystkie dane**

**Weryfikacja:**
Wykonaj QUERY 4, 5, 7 z `security_audit_queries.sql`

**Oczekiwany wynik:**
- QUERY 4: 33 tabele, każda z 4 policies (SELECT, INSERT, UPDATE, DELETE)
- QUERY 5: 0 wyników (brak anon/public policies)
- QUERY 7: 0 wyników (wszystkie tabele mają RLS)

**FIX (P0 - IMMEDIATE):**

Jeśli QUERY 7 zwraca tabele BEZ RLS:

```sql
-- Dla KAŻDEJ tabeli bez RLS:
ALTER TABLE public.<table_name> ENABLE ROW LEVEL SECURITY;

-- Przykład dla clients:
CREATE POLICY "Users can view their own clients"
  ON public.clients FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own clients"
  ON public.clients FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own clients"
  ON public.clients FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own clients"
  ON public.clients FOR DELETE
  USING (auth.uid() = user_id);
```

---

### BLOCKER #3: Test RLS jako ANON (P0 - CRITICAL)

**Problem:**
NIE WIEMY czy RLS działa w praktyce.

**Weryfikacja:**
Wykonaj QUERY 13 z `security_audit_queries.sql`:

```sql
SET ROLE anon;
SELECT COUNT(*) as anon_can_see_clients FROM public.clients;
SELECT COUNT(*) as anon_can_see_projects FROM public.projects;
SELECT COUNT(*) as anon_can_see_quotes FROM public.quotes;
RESET ROLE;
```

**Oczekiwany wynik:** 0, 0, 0

**Jeśli widzisz dane:**
❌ RLS NIE DZIAŁA - natychmiastowo wycofaj produkcję!

**FIX:**
```sql
-- Dla każdej tabeli która zwraca > 0:
ALTER TABLE public.<table_name> FORCE ROW LEVEL SECURITY;
```

---

## C) ⚠️  HIGH PRIORITY ISSUES (P1)

### ISSUE #1: Brak weryfikacji Foreign Keys

**Problem:** FK są z `ON DELETE CASCADE` - jeśli użytkownik usunie konto, wszystkie dane znikają.

**Weryfikacja:** QUERY 8

**Fix:** To jest zamierzone zachowanie według CLAUDE.md - OK

---

### ISSUE #2: Storage Security

**Problem:** NIE WIEMY czy bucket "logos" ma poprawne policies.

**Weryfikacja:** QUERY 9, QUERY 10

**Oczekiwany wynik:**
- Bucket `logos` jest PUBLIC (✅ OK dla logo firm)
- Storage policies pozwalają tylko właścicielowi upload/update/delete

**FIX jeśli brakuje policies:**

```sql
-- Logo images are publicly accessible (READ)
CREATE POLICY "Logo images are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'logos');

-- Users can upload their own logo
CREATE POLICY "Users can upload their own logo"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'logos'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Users can update their own logo
CREATE POLICY "Users can update their own logo"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'logos'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Users can delete their own logo
CREATE POLICY "Users can delete their own logo"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'logos'
  AND auth.uid()::text = (storage.foldername(name))[1]
);
```

---

### ISSUE #3: Performance - Missing Indexes

**Problem:** Brak indeksów na `user_id` może powodować powolne zapytania.

**Weryfikacja:** QUERY 11, QUERY 14

**FIX:**

```sql
-- Dla każdej tabeli bez indeksu na user_id:
CREATE INDEX IF NOT EXISTS idx_<table>_user_id
ON public.<table>(user_id);

-- Przykłady (jeśli brakują):
CREATE INDEX IF NOT EXISTS idx_ai_chat_history_user_id ON public.ai_chat_history(user_id);
CREATE INDEX IF NOT EXISTS idx_api_keys_user_id ON public.api_keys(user_id);
CREATE INDEX IF NOT EXISTS idx_team_members_user_id ON public.team_members(user_id);
CREATE INDEX IF NOT EXISTS idx_subcontractors_user_id ON public.subcontractors(user_id);
CREATE INDEX IF NOT EXISTS idx_work_tasks_user_id ON public.work_tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_financial_reports_user_id ON public.financial_reports(user_id);
CREATE INDEX IF NOT EXISTS idx_company_documents_user_id ON public.company_documents(user_id);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_user_id ON public.user_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_push_tokens_user_id ON public.push_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON public.user_roles(user_id);
```

---

## D) 📋 AUDIT CHECKLIST - CO MUSISZ SPRAWDZIĆ

### I. DB Schema & Migrations

```
[ ] QUERY 1: Wszystkie 20 migracji są w schema_migrations
[ ] QUERY 2: Extension pgcrypto jest zainstalowany
[ ] QUERY 3: Wszystkie 33 tabele istnieją w public schema
```

**Expected:**
- 20 migrations applied
- 1 extension (pgcrypto)
- 33 tables

---

### II. RLS (Row Level Security)

```
[ ] QUERY 3: Wszystkie 33 tabele mają RLS enabled (status = '✅ ENABLED')
[ ] QUERY 4: Każda tabela ma 4 policies (SELECT, INSERT, UPDATE, DELETE)
[ ] QUERY 5: 0 policies dla anon/public (ZERO results expected)
[ ] QUERY 7: 0 tables without RLS (ZERO results expected)
[ ] QUERY 13: Test as anon returns 0 rows for clients/projects/quotes
```

**Expected:**
- 33 tables with RLS = true
- 132 policies minimum (33 tables × 4 policies)
- 0 anon/public policies
- 0 tables without RLS
- anon role sees 0 rows

---

### III. GRANTs / Privileges

```
[ ] QUERY 6: Tabele mają tylko SELECT grant dla authenticated
[ ] NIE MA: INSERT/UPDATE/DELETE/TRUNCATE dla anon
[ ] NIE MA: Żadnych grantów dla public role
```

**Expected:**
- authenticated: SELECT only na większości tabel
- anon: BRAK dostępu (RLS blokuje)
- public: BRAK dostępu

---

### IV. Storage

```
[ ] QUERY 9: Bucket 'logos' istnieje i jest PUBLIC
[ ] QUERY 10: Storage policies dla logos są poprawne
```

**Expected:**
- 1 bucket (logos) - public = true
- 4 storage policies (SELECT, INSERT, UPDATE, DELETE)

---

### V. Foreign Keys

```
[ ] QUERY 8: Wszystkie FK mają ON DELETE CASCADE
[ ] FK do auth.users(id) jest na każdej tabeli z user_id
```

**Expected:**
- ~60 foreign keys total
- Wszystkie z `delete_rule = CASCADE`

---

### VI. Performance

```
[ ] QUERY 11: Wszystkie tabele z user_id mają index
[ ] QUERY 14: Brak high sequential scans (> 1000)
```

**Expected:**
- 33 indexes na user_id (po jednym na tabelę)
- performance_status = '✅ OK' dla wszystkich

---

### VII. Auth Configuration (Manual Check)

```
[ ] Email confirmation: ENABLED
[ ] Password strength: Minimum 8 chars
[ ] JWT expiry: < 3600s (1 hour)
[ ] Redirect URLs: Tylko https://your-domain.com
```

**Sprawdź w:** Dashboard → Authentication → Settings

---

### VIII. Edge Functions (Manual Check)

```
[ ] send-offer-email: verify_jwt = true
[ ] ai-quote-suggestions: verify_jwt = true
[ ] analyze-photo: verify_jwt = true
[ ] ocr-invoice: verify_jwt = true
[ ] approve-offer: verify_jwt = false (public, ale weryfikuje token)
```

**Sprawdź w:** Dashboard → Edge Functions

---

## E) 🔧 STEP-BY-STEP FIX PLAN

### Krok 1: Weryfikacja Stanu Bazy (5 min)

```bash
# Otwórz Supabase SQL Editor
# Skopiuj i uruchom queries 1, 3, 7, 13

# Jeśli QUERY 3 zwraca < 33 tabel → BLOCKER #1
# Jeśli QUERY 7 zwraca > 0 tabel → BLOCKER #2
# Jeśli QUERY 13 zwraca > 0 rows → BLOCKER #3
```

---

### Krok 2: FIX Blockers (w kolejności)

**Jeśli BLOCKER #1 (brak tabel):**

```sql
-- Użyj migration_part_1_podstawowe.sql
-- Link: https://raw.githubusercontent.com/RobertB1978/majster-ai-oferty/880a383/supabase/migration_part_1_podstawowe.sql

-- Skopiuj, wklej do SQL Editor, Run
```

**Jeśli BLOCKER #2 (brak RLS):**

```sql
-- Dla każdej tabeli z QUERY 7:
ALTER TABLE public.<table_name> ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.<table_name> FORCE ROW LEVEL SECURITY;

-- Następnie dodaj 4 policies (wzór powyżej w BLOCKER #2)
```

**Jeśli BLOCKER #3 (RLS nie działa):**

```sql
-- To znaczy że policies są źle skonfigurowane
-- Usuń policies i dodaj ponownie:

DROP POLICY IF EXISTS "policy_name" ON public.<table>;

-- Dodaj poprawne (wzór w BLOCKER #2)
```

---

### Krok 3: Weryfikacja Storage (5 min)

```sql
-- Run QUERY 9, 10

-- Jeśli brak bucket:
-- Idź do Dashboard → Storage → Create bucket
-- Name: logos
-- Public: YES

-- Jeśli brak policies:
-- Skopiuj SQL z ISSUE #2
```

---

### Krok 4: Dodaj Brakujące Indeksy (5 min)

```sql
-- Run QUERY 11

-- Dla każdej tabeli bez indeksu:
-- Skopiuj SQL z ISSUE #3
```

---

### Krok 5: Finalna Weryfikacja (10 min)

```sql
-- Re-run wszystkie queries (1-14)

-- Wszystkie powinny zwrócić expected results
-- Jeśli tak → ✅ Możesz uruchomić produkcję
```

---

## F) 📊 PODSUMOWANIE ZNALEZIONYCH PROBLEMÓW

### Z Analizy Repozytorium:

| Issue | Severity | Status |
|-------|----------|--------|
| Migracje z polskimi znakami | ❌ P0 BLOCKER | Wymaga fixa |
| 218 policies w kodzie | ✅ OK | Ale trzeba zweryfikować na prod |
| Brak policies dla anon/public | ✅ OK | Poprawnie skonfigurowane |
| auth.jwt() tylko w service_role | ✅ OK | Poprawne użycie |
| ON DELETE CASCADE na FK | ✅ OK | Zgodne z wymaganiami |

### Wymaga Weryfikacji Na Żywo:

| Check | Query | Expected | Priority |
|-------|-------|----------|----------|
| Liczba tabel | Q3 | 33 | P0 |
| RLS enabled | Q3, Q7 | 33, 0 | P0 |
| Policy count | Q4 | 132+ | P0 |
| Anon access | Q13 | 0, 0, 0 | P0 |
| Storage bucket | Q9 | 1 bucket | P1 |
| Storage policies | Q10 | 4 policies | P1 |
| Indexes | Q11 | 33 indexes | P1 |
| Performance | Q14 | All OK | P2 |

---

## G) 🎯 WERDYKT KOŃCOWY

### ❌ **NIE MOŻESZ URUCHOMIĆ PRODUKCJI** dopóki nie:

1. ✅ Zweryfikujesz że wszystkie 33 tabele istnieją
2. ✅ Zweryfikujesz że wszystkie tabele mają RLS enabled
3. ✅ Zweryfikujesz że RLS działa (test as anon = 0 rows)
4. ✅ Naprawisz wszelkie błędy z queries 1-14

### ✅ **MOŻESZ URUCHOMIĆ PRODUKCJĘ** gdy:

- Wszystkie queries (1-14) zwracają expected results
- Test RLS jako anon zwraca 0 rows
- Storage ma poprawne policies
- Wszystkie tabele mają indeksy na user_id

---

## H) 📝 NASTĘPNE KROKI

1. **TERAZ (0-30 min):** Uruchom queries 1, 3, 7, 13
2. **JEŚLI BLOCKERS:** Napraw używając SQL z sekcji B
3. **PO NAPRAWIE:** Uruchom pozostałe queries (2, 4-6, 8-12, 14)
4. **FINALNA WERYFIKACJA:** Wszystkie queries OK → ✅ Możesz uruchomić prod

---

## I) 📎 ZAŁĄCZNIKI

- `security_audit_queries.sql` - Wszystkie 14 queries do wykonania
- `supabase/migration_part_1_podstawowe.sql` - Migration bez polskich znaków
- `DATABASE_STRUCTURE.md` - Pełna dokumentacja struktury

---

**WAŻNE:**
- NIE uruchamiaj produkcji bez weryfikacji queries
- Wykonaj queries w kolejności (1-14)
- Zapisz wyniki każdego query
- Jeśli coś jest nie tak - ZATRZYMAJ i napraw PRZED uruchomieniem

---

**Przygotował:** Claude Code AI
**Data:** 2025-12-27
**Projekt:** Majster.AI (majster-ai-prod)
