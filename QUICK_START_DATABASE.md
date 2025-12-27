# 🚀 Szybki Start - Wdrożenie Bazy Danych Supabase

## ⚡ Najszybsza Metoda (5 minut)

### Krok 1: Otwórz Supabase Dashboard

1. Przejdź do: https://supabase.com/dashboard/project/xwvxqhhnozfrjcjmcltv
2. Zaloguj się (jeśli jeszcze nie jesteś zalogowany)

### Krok 2: Uruchom Skrypt Weryfikacyjny

1. W menu bocznym kliknij: **"SQL Editor"**
2. Kliknij: **"New query"**
3. Skopiuj CAŁĄ zawartość pliku: `supabase/verify_database.sql`
4. Wklej do edytora SQL
5. Kliknij: **"Run"** (lub Ctrl+Enter)

### Krok 3: Przeanalizuj Wyniki

Po uruchomieniu skryptu zobaczysz w sekcji "Results":

**✅ JEŚLI WSZYSTKO OK:**
```
║  ✅ SUCCESS! DATABASE IS FULLY DEPLOYED                   ║
Tables:           33 / 33 expected
RLS Enabled:      33 / 33 expected
Functions:        3 / 3 expected
Storage Buckets:  1 / 1 expected
```

**❌ JEŚLI BRAKUJE TABEL:**
```
║  ⚠️  WARNING: DATABASE SETUP INCOMPLETE                   ║
Tables:           11 / 33 expected
Missing tables: calendar_events, onboarding_progress, ...
```

### Krok 4A: Jeśli Wszystko OK - Pomiń do Kroku 5

Baza danych jest w pełni wdrożona! Możesz przejść do testowania aplikacji.

### Krok 4B: Jeśli Brakuje Tabel - Wdróż Migracje

1. W SQL Editor, utwórz NOWĄ kwerendę
2. Dla KAŻDEJ brakującej migracji:
   - Otwórz plik z `supabase/migrations/`
   - Skopiuj zawartość
   - Wklej do SQL Editor
   - Kliknij "Run"
   - Sprawdź czy nie ma błędów

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

3. Po wdrożeniu wszystkich migracji, uruchom ponownie skrypt weryfikacyjny (Krok 2)

### Krok 5: Weryfikacja w Table Editor

1. W menu bocznym kliknij: **"Table Editor"**
2. Powinieneś zobaczyć **33 tabele**:
   - api_keys
   - ai_chat_history
   - biometric_credentials
   - calendar_events
   - clients
   - company_documents
   - financial_reports
   - item_templates
   - notifications
   - offer_approvals
   - offer_sends
   - onboarding_progress
   - organization_members
   - organizations
   - pdf_data
   - profiles
   - project_photos
   - projects
   - purchase_costs
   - push_tokens
   - quote_versions
   - quotes
   - subcontractor_reviews
   - subcontractor_services
   - subcontractors
   - subscription_events
   - team_locations
   - team_members
   - user_consents
   - user_roles
   - user_subscriptions
   - work_tasks
   - api_rate_limits

3. Kliknij na kilka tabel aby zweryfikować strukturę

### Krok 6: Sprawdź Storage

1. W menu bocznym kliknij: **"Storage"**
2. Powinieneś zobaczyć bucket: **"logos"**
3. Bucket powinien być: **Public** (ikona globusa)

---

## 🎯 Następne Kroki - Konfiguracja Aplikacji

### 1. Utwórz plik .env (jeśli nie istnieje)

```bash
cp .env.example .env
```

### 2. Pobierz Dane Dostępowe Supabase

1. Przejdź do: https://supabase.com/dashboard/project/xwvxqhhnozfrjcjmcltv/settings/api
2. Skopiuj:
   - **Project URL**: `https://xwvxqhhnozfrjcjmcltv.supabase.co`
   - **anon/public key**: Długi klucz zaczynający się od `eyJ...`

### 3. Zaktualizuj plik .env

Edytuj `.env` i wklej wartości:

```env
VITE_SUPABASE_URL=https://xwvxqhhnozfrjcjmcltv.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGci... [twój klucz anon - skopiuj z dashboardu]
```

**⚠️ WAŻNE:**
- NIE używaj `service_role` key w pliku `.env` (tylko w Edge Functions!)
- Używaj TYLKO `anon` key (publiczny klucz)

### 4. Uruchom Aplikację

```bash
npm run dev
```

### 5. Testuj Połączenie

1. Otwórz aplikację: http://localhost:5173
2. Otwórz konsolę przeglądarki (F12)
3. Sprawdź czy nie ma błędów Supabase
4. Spróbuj się zarejestrować - sprawdź czy profil jest tworzony automatycznie

---

## 📊 Co Zostało Wdrożone?

### Tabele (33)

**Moduł Klienci & Projekty:**
- ✅ clients - Klienci
- ✅ projects - Projekty
- ✅ project_photos - Zdjęcia projektów

**Moduł Wyceny & Oferty:**
- ✅ quotes - Wyceny
- ✅ quote_versions - Wersje wycen
- ✅ item_templates - Szablony pozycji
- ✅ pdf_data - Dane do PDF
- ✅ offer_sends - Historia wysyłek ofert
- ✅ offer_approvals - Zatwierdzenia ofert

**Moduł Firmowy:**
- ✅ profiles - Profile firmowe
- ✅ company_documents - Dokumenty firmowe
- ✅ user_consents - Zgody użytkowników

**Moduł Zespół:**
- ✅ team_members - Członkowie zespołu
- ✅ team_locations - Lokalizacje GPS zespołu

**Moduł Podwykonawcy:**
- ✅ subcontractors - Podwykonawcy
- ✅ subcontractor_services - Usługi podwykonawców
- ✅ subcontractor_reviews - Opinie o podwykonawcach

**Moduł Zadania:**
- ✅ work_tasks - Zadania robocze
- ✅ calendar_events - Wydarzenia kalendarza

**Moduł Finanse:**
- ✅ purchase_costs - Koszty zakupów
- ✅ financial_reports - Raporty finansowe

**Moduł Subskrypcje:**
- ✅ user_subscriptions - Subskrypcje Stripe
- ✅ subscription_events - Logi webhook Stripe

**Moduł AI:**
- ✅ ai_chat_history - Historia czatu AI

**Moduł API:**
- ✅ api_keys - Klucze API
- ✅ api_rate_limits - Limity API

**Moduł Powiadomienia:**
- ✅ notifications - Powiadomienia
- ✅ push_tokens - Tokeny push notifications

**Moduł Onboarding:**
- ✅ onboarding_progress - Postęp onboardingu

**Moduł Multi-tenant:**
- ✅ organizations - Organizacje
- ✅ organization_members - Członkowie organizacji

**Moduł Bezpieczeństwo:**
- ✅ user_roles - Role użytkowników
- ✅ biometric_credentials - Dane biometryczne

### Funkcje PostgreSQL (3)

- ✅ `handle_new_user()` - Auto-tworzenie profilu przy rejestracji
- ✅ `update_profiles_updated_at()` - Auto-aktualizacja timestamp
- ✅ `sync_subscription_from_stripe()` - Sync subskrypcji Stripe

### Storage Buckets (1)

- ✅ **logos** - Publiczny bucket na logo firm

### Bezpieczeństwo

- ✅ Row Level Security (RLS) włączone na wszystkich tabelach
- ✅ Polityki RLS dla izolacji danych użytkowników
- ✅ Triggery automatyczne
- ✅ Foreign Key constraints

### Wydajność

- ✅ Indeksy na kluczowych kolumnach
- ✅ JSONB dla elastycznych struktur
- ✅ Timestamp indexes

---

## 🔍 Rozwiązywanie Problemów

### Problem: "Nie widzę 33 tabel w Table Editor"

**Rozwiązanie:**
1. Uruchom skrypt weryfikacyjny (Krok 2)
2. Zobacz które tabele brakują
3. Wdróż brakujące migracje (Krok 4B)

### Problem: "relation already exists"

**Przyczyna:** Tabela już istnieje.

**Rozwiązanie:** To normalne - pomiń tę migrację i przejdź do następnej.

### Problem: "RLS is not enabled"

**Rozwiązanie:**
```sql
ALTER TABLE nazwa_tabeli ENABLE ROW LEVEL SECURITY;
```

### Problem: "permission denied"

**Przyczyna:** Brak uprawnień.

**Rozwiązanie:** Upewnij się, że jesteś zalogowany jako właściciel projektu.

---

## 📚 Dodatkowe Zasoby

- **DATABASE_STRUCTURE.md** - Kompletna dokumentacja struktury bazy danych (33 tabele)
- **DEPLOYMENT_INSTRUCTIONS.md** - Szczegółowe instrukcje wdrożenia (wszystkie metody)
- **supabase/verify_database.sql** - Skrypt weryfikacyjny SQL
- **CLAUDE.md** - Pełna dokumentacja projektu i standardy kodowania

---

## ✅ Checklist Wdrożenia

Po wykonaniu wszystkich kroków sprawdź:

- [ ] Uruchomiłem skrypt weryfikacyjny
- [ ] Widzę 33 tabele w Table Editor
- [ ] RLS jest włączone na wszystkich tabelach
- [ ] Storage bucket "logos" istnieje
- [ ] 3 funkcje PostgreSQL są utworzone
- [ ] Plik .env jest skonfigurowany z prawdziwymi kluczami
- [ ] Aplikacja działa lokalnie (npm run dev)
- [ ] Mogę się zarejestrować i profil jest tworzony automatycznie
- [ ] Brak błędów w konsoli przeglądarki

---

## 🎉 Gotowe!

Jeśli wszystkie punkty z checklisty są zaznaczone, Twoja baza danych Supabase jest w pełni wdrożona i skonfigurowana!

**Następne kroki:**
1. Wdróż Edge Functions (funkcje serverless)
2. Skonfiguruj sekrety w Supabase (RESEND_API_KEY, OPENAI_API_KEY, etc.)
3. Przetestuj flow użytkownika od rejestracji do wysyłki oferty
4. Wdróż na produkcję (Vercel + Supabase)

---

**Data utworzenia:** 2025-12-27
**Projekt:** Majster.AI - majster-ai-prod
**Supabase Project ID:** xwvxqhhnozfrjcjmcltv
