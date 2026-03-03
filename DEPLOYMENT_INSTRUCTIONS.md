# 🚀 Instrukcje Wdrożenia Bazy Danych Supabase

## 📋 Wymagania

Przed rozpoczęciem upewnij się, że masz:
- ✅ Konto Supabase (https://supabase.com)
- ✅ Dostęp do projektu: `xwxvqhhnozfrjcjmcltv`
- ✅ Zainstalowane Supabase CLI lub dostęp do Supabase Dashboard

---

## Metoda 1: Wdrożenie przez Supabase Dashboard (ZALECANE)

### Krok 1: Zaloguj się do Supabase Dashboard

1. Przejdź do: https://supabase.com/dashboard
2. Zaloguj się na swoje konto
3. Wybierz projekt: **majster-ai-prod** (`xwxvqhhnozfrjcjmcltv`)

### Krok 2: Otwórz SQL Editor

1. W menu bocznym kliknij **"SQL Editor"**
2. Kliknij **"New query"**

### Krok 3: Uruchom Migracje

Wykonaj migracje w **kolejności chronologicznej**:

#### 3.1. Sprawdź obecny stan bazy danych

Wklej i uruchom:
```sql
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_type = 'BASE TABLE'
ORDER BY table_name;
```

To pokaże Ci, które tabele już istnieją.

#### 3.2. Sprawdź historię migracji

Wklej i uruchom:
```sql
SELECT * FROM supabase_migrations.schema_migrations
ORDER BY version DESC;
```

To pokaże Ci, które migracje były już uruchomione.

#### 3.3. Uruchom brakujące migracje

Dla każdej migracji, która NIE jest w historii:

1. Otwórz plik migracji z folderu `supabase/migrations/`
2. Skopiuj całą zawartość
3. Wklej do SQL Editor
4. Kliknij **"Run"** (lub naciśnij Ctrl+Enter)
5. Sprawdź czy nie ma błędów

**Kolejność migracji (chronologicznie):**

```
1.  20251205000000_enable_pgcrypto.sql
2.  20251205160746_6a58fb47-b2dd-4b92-98f6-ba211dc13689.sql
3.  20251205164727_c0d6cba6-5adf-4a2e-ad97-db70f142d298.sql
4.  20251205170743_62650200-473b-4d91-9c2d-d69171409f31.sql
5.  20251205192507_95697a22-e254-4e2a-ac94-fc2873b81e0a.sql
6.  20251205220356_a6edf8bd-0a1a-4d88-80d4-79dc3b8cb7ed.sql
7.  20251205230527_143aedf1-03a7-4204-9a86-f200f74cfa53.sql
8.  20251206073947_dbba8272-c7ab-422b-b702-a7c8498adc54.sql
9.  20251206221151_3de2c381-4106-4dfe-b189-85119bb757df.sql
10. 20251207082500_bedade0c-2e85-41f5-a8a7-3cc2502fa89a.sql
11. 20251207105202_02089cee-a466-4633-8357-f010f4ce35e7.sql
12. 20251207110925_fd116312-a252-4680-870a-632e137bf7ef.sql
13. 20251207123630_7642361c-8055-430b-91c9-3c513940c57a.sql
14. 20251207123651_686d6de5-61b2-438d-9b7c-d1089353d4a5.sql
15. 20251209073921_add_performance_indexes.sql
16. 20251209152221_add_pdf_url_to_offer_sends.sql
17. 20251209154608_add_tracking_status_to_offer_sends.sql
18. 20251209154800_harden_tracking_status_not_null.sql
19. 20251211212307_ff99280e-5828-4d0a-90eb-e69c98f1eeb6.sql
20. 20251217000000_add_stripe_integration.sql
```

### Krok 4: Weryfikacja

Po uruchomieniu wszystkich migracji, uruchom skrypt weryfikacyjny:

```sql
-- SKRYPT WERYFIKACYJNY (skopiuj z /tmp/database_verification.sql)
-- Lub użyj poniższego uproszczonego skryptu:

SELECT
  'Tables' as check_type,
  COUNT(*) as count
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_type = 'BASE TABLE'

UNION ALL

SELECT
  'RLS Enabled Tables',
  COUNT(*)
FROM pg_tables
WHERE schemaname = 'public'
  AND rowsecurity = true

UNION ALL

SELECT
  'Storage Buckets',
  COUNT(*)
FROM storage.buckets

UNION ALL

SELECT
  'Functions',
  COUNT(*)
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name IN (
    'handle_new_user',
    'update_profiles_updated_at',
    'sync_subscription_from_stripe'
  );
```

**Oczekiwane wyniki:**
- Tables: **33**
- RLS Enabled Tables: **33**
- Storage Buckets: **1** (logos)
- Functions: **3**

---

## Metoda 2: Wdrożenie przez Supabase CLI

### Krok 1: Zainstaluj Supabase CLI

```bash
# macOS/Linux
brew install supabase/tap/supabase

# Windows (przez Scoop)
scoop bucket add supabase https://github.com/supabase/scoop-bucket.git
scoop install supabase

# Lub przez NPM (uniwersalnie)
npm install -g supabase
```

### Krok 2: Zaloguj się do Supabase

```bash
supabase login
```

Postępuj zgodnie z instrukcjami - otworzy się przeglądarka do autoryzacji.

### Krok 3: Połącz z projektem

```bash
cd /home/user/majster-ai-oferty
supabase link --project-ref xwxvqhhnozfrjcjmcltv
```

### Krok 4: Wdróż migracje

```bash
supabase db push
```

Ta komenda:
- Przeskanuje folder `supabase/migrations/`
- Porówna z historią migracji na Supabase
- Uruchomi TYLKO brakujące migracje
- Wyświetli podsumowanie

### Krok 5: Weryfikacja

```bash
# Sprawdź status
supabase db status

# Lista wszystkich tabel
supabase db list
```

---

## Metoda 3: Automatyczne Wdrożenie (CI/CD)

Jeśli używasz CI/CD (np. GitHub Actions), możesz dodać automatyczne wdrażanie migracji.

### Przykład GitHub Actions Workflow:

```yaml
name: Deploy Supabase Migrations

on:
  push:
    branches:
      - main
    paths:
      - 'supabase/migrations/**'

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup Supabase CLI
        uses: supabase/setup-cli@v1
        with:
          version: latest

      - name: Link to Supabase project
        run: supabase link --project-ref ${{ secrets.SUPABASE_PROJECT_REF }}
        env:
          SUPABASE_ACCESS_TOKEN: ${{ secrets.SUPABASE_ACCESS_TOKEN }}

      - name: Deploy migrations
        run: supabase db push
        env:
          SUPABASE_ACCESS_TOKEN: ${{ secrets.SUPABASE_ACCESS_TOKEN }}
```

**Wymagane sekrety w GitHub:**
- `SUPABASE_PROJECT_REF`: `xwxvqhhnozfrjcjmcltv`
- `SUPABASE_ACCESS_TOKEN`: Token dostępu (wygeneruj w: https://supabase.com/dashboard/account/tokens)

---

## 🔍 Rozwiązywanie Problemów

### Problem: "relation already exists"

**Przyczyna:** Tabela już istnieje w bazie danych.

**Rozwiązanie:**
1. Sprawdź historię migracji (Krok 3.2)
2. Pomiń migrację, która tworzy tę tabelę
3. Lub użyj `CREATE TABLE IF NOT EXISTS` w migracji

### Problem: "permission denied for schema public"

**Przyczyna:** Brak uprawnień do tworzenia obiektów.

**Rozwiązanie:**
1. Upewnij się, że jesteś zalogowany jako właściciel projektu
2. Sprawdź czy używasz poprawnego klucza API (anon key vs service_role key)

### Problem: "constraint already exists"

**Przyczyna:** Ograniczenie (constraint) już istnieje.

**Rozwiązanie:**
1. Użyj `DROP CONSTRAINT IF EXISTS` przed dodaniem nowego
2. Lub użyj `ALTER TABLE ... ADD CONSTRAINT IF NOT EXISTS` (PostgreSQL 15+)

### Problem: Migracje nie są uruchamiane

**Rozwiązanie:**
1. Sprawdź format nazwy pliku: `YYYYMMDDHHMMSS_uuid.sql`
2. Upewnij się, że plik jest w folderze `supabase/migrations/`
3. Sprawdź uprawnienia do pliku: `chmod +r supabase/migrations/*.sql`

---

## ✅ Checklist Wdrożenia

Po wdrożeniu sprawdź:

- [ ] Wszystkie 33 tabele istnieją
- [ ] RLS jest włączone na wszystkich tabelach
- [ ] Storage bucket 'logos' istnieje
- [ ] Funkcje PostgreSQL są utworzone (3 funkcje)
- [ ] Indeksy są utworzone (sprawdź plany wykonania zapytań)
- [ ] Triggery działają (sprawdź auto-tworzenie profilu przy rejestracji)
- [ ] Polityki RLS działają (sprawdź dostęp do danych)

---

## 📊 Weryfikacja Aplikacji

### Krok 1: Sprawdź plik konfiguracyjny

Upewnij się, że masz plik `.env` z poprawnymi danymi:

```bash
cat .env
```

Powinien zawierać:
```env
VITE_SUPABASE_URL=https://xwxvqhhnozfrjcjmcltv.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ... (twój klucz anon)
```

### Krok 2: Sprawdź klienta Supabase w kodzie

```bash
cat src/integrations/supabase/client.ts
```

### Krok 3: Przetestuj połączenie

Uruchom aplikację i sprawdź konsolę:

```bash
npm run dev
```

Otwórz konsolę przeglądarki (F12) i sprawdź:
- Brak błędów połączenia
- Zapytania do Supabase działają
- Dane są pobierane poprawnie

---

## 🎯 Następne Kroki

Po pomyślnym wdrożeniu bazy danych:

1. **Skonfiguruj Edge Functions:**
   - Przejdź do: Supabase Dashboard → Edge Functions
   - Wdróż funkcje z folderu `supabase/functions/`
   - Ustaw sekrety (RESEND_API_KEY, OPENAI_API_KEY, etc.)

2. **Skonfiguruj Storage:**
   - Sprawdź czy bucket 'logos' ma poprawne polityki
   - Przetestuj upload logo

3. **Przetestuj Flow Użytkownika:**
   - Rejestracja (sprawdź czy tworzy profil automatycznie)
   - Tworzenie klienta
   - Tworzenie projektu
   - Generowanie wyceny
   - Wysyłanie oferty email

---

## 📞 Wsparcie

Jeśli napotkasz problemy:

1. Sprawdź logi w Supabase Dashboard → Database → Logs
2. Sprawdź dokumentację: https://supabase.com/docs
3. Skontaktuj się z supportem Supabase: https://supabase.com/support

---

**Ostatnia aktualizacja:** 2025-12-27
**Wygenerowano przez:** Claude Code AI Assistant
