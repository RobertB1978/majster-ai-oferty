# Majster.AI - Struktura Bazy Danych

## 📊 Podsumowanie

**Projekt Supabase ID:** `xwxvqhhnozfrjcjmcltv`
**URL Projektu:** `https://xwxvqhhnozfrjcjmcltv.supabase.co`
**Liczba Tabel:** 33 tabele
**Liczba Migracji:** 20 plików migracyjnych

---

## 🗂️ Lista Wszystkich Tabel

### 1. **clients** - Klienci
Przechowuje informacje o klientach użytkownika.

**Kolumny:**
- `id` (UUID, PRIMARY KEY) - Unikalny identyfikator
- `user_id` (UUID, FOREIGN KEY → auth.users) - Właściciel klienta
- `name` (TEXT, NOT NULL) - Nazwa klienta
- `phone` (TEXT) - Telefon
- `email` (TEXT) - Email
- `address` (TEXT) - Adres
- `created_at` (TIMESTAMP) - Data utworzenia

**RLS:** ✅ Włączone (4 polityki)
**Indeksy:** `idx_clients_user_id`

---

### 2. **projects** - Projekty
Przechowuje projekty/zlecenia dla klientów.

**Kolumny:**
- `id` (UUID, PRIMARY KEY)
- `user_id` (UUID, FOREIGN KEY → auth.users)
- `client_id` (UUID, FOREIGN KEY → clients)
- `project_name` (TEXT, NOT NULL)
- `status` (TEXT, CHECK) - 'Nowy', 'Wycena w toku', 'Oferta wysłana', 'Zaakceptowany'
- `created_at` (TIMESTAMP)

**RLS:** ✅ Włączone (4 polityki)
**Indeksy:** `idx_projects_user_id`, `idx_projects_client_id`

---

### 3. **quotes** - Wyceny
Przechowuje wyceny dla projektów.

**Kolumny:**
- `id` (UUID, PRIMARY KEY)
- `project_id` (UUID, FOREIGN KEY → projects, UNIQUE)
- `user_id` (UUID, FOREIGN KEY → auth.users)
- `positions` (JSONB) - Lista pozycji wyceny
- `summary_materials` (NUMERIC) - Suma materiałów
- `summary_labor` (NUMERIC) - Suma robocizny
- `margin_percent` (NUMERIC) - Procent marży
- `total` (NUMERIC) - Suma całkowita
- `created_at` (TIMESTAMP)

**RLS:** ✅ Włączone (4 polityki)
**Indeksy:** `idx_quotes_project_id`

---

### 4. **pdf_data** - Dane PDF
Przechowuje dane do generowania ofert PDF.

**Kolumny:**
- `id` (UUID, PRIMARY KEY)
- `project_id` (UUID, FOREIGN KEY → projects, UNIQUE)
- `user_id` (UUID, FOREIGN KEY → auth.users)
- `version` (TEXT, CHECK) - 'standard', 'premium'
- `title` (TEXT)
- `offer_text` (TEXT)
- `terms` (TEXT)
- `deadline_text` (TEXT)
- `created_at` (TIMESTAMP)

**RLS:** ✅ Włączone (4 polityki)
**Indeksy:** `idx_pdf_data_project_id`

---

### 5. **profiles** - Profile Firmowe
Przechowuje dane firmowe użytkowników.

**Kolumny:**
- `id` (UUID, PRIMARY KEY)
- `user_id` (UUID, FOREIGN KEY → auth.users, UNIQUE)
- `company_name` (TEXT, NOT NULL)
- `owner_name` (TEXT)
- `nip` (TEXT)
- `street` (TEXT)
- `city` (TEXT)
- `postal_code` (TEXT)
- `phone` (TEXT)
- `email_for_offers` (TEXT)
- `bank_account` (TEXT)
- `logo_url` (TEXT)
- `email_subject_template` (TEXT)
- `email_greeting` (TEXT)
- `email_signature` (TEXT)
- `created_at` (TIMESTAMP)
- `updated_at` (TIMESTAMP)

**RLS:** ✅ Włączone (3 polityki)
**Trigger:** Automatyczna aktualizacja `updated_at`
**Funkcja:** `handle_new_user()` - auto-tworzenie profilu przy rejestracji

---

### 6. **item_templates** - Szablony Pozycji
Przechowuje szablony pozycji do wielokrotnego użycia.

**Kolumny:**
- `id` (UUID, PRIMARY KEY)
- `user_id` (UUID, FOREIGN KEY → auth.users)
- `name` (TEXT, NOT NULL)
- `unit` (TEXT) - Domyślnie 'szt.'
- `default_qty` (NUMERIC)
- `default_price` (NUMERIC)
- `category` (TEXT) - Domyślnie 'Materiał'
- `description` (TEXT)
- `created_at` (TIMESTAMP)

**RLS:** ✅ Włączone (4 polityki)

---

### 7. **quote_versions** - Wersje Wycen
Przechowuje różne wersje wycen dla projektów.

**Kolumny:**
- `id` (UUID, PRIMARY KEY)
- `project_id` (UUID)
- `user_id` (UUID, FOREIGN KEY → auth.users)
- `version_name` (TEXT) - Domyślnie 'V1'
- `quote_snapshot` (JSONB) - Snapshot wyceny
- `is_active` (BOOLEAN)
- `created_at` (TIMESTAMP)

**RLS:** ✅ Włączone (4 polityki)

---

### 8. **offer_sends** - Historia Wysyłek Ofert
Przechowuje historię wysłanych ofert email.

**Kolumny:**
- `id` (UUID, PRIMARY KEY)
- `project_id` (UUID)
- `user_id` (UUID, FOREIGN KEY → auth.users)
- `client_email` (TEXT, NOT NULL)
- `subject` (TEXT, NOT NULL)
- `message` (TEXT)
- `status` (TEXT) - 'pending', 'sent', 'failed'
- `tracking_status` (TEXT) - Status śledzenia
- `pdf_url` (TEXT) - URL do PDF
- `error_message` (TEXT)
- `sent_at` (TIMESTAMP)

**RLS:** ✅ Włączone (3 polityki)
**Indeksy:** Dodatkowe indeksy wydajnościowe

---

### 9. **calendar_events** - Wydarzenia Kalendarza
Przechowuje wydarzenia w kalendarzu użytkownika.

**Kolumny:**
- `id` (UUID, PRIMARY KEY)
- `user_id` (UUID, FOREIGN KEY → auth.users)
- `title` (TEXT, NOT NULL)
- `description` (TEXT)
- `start_time` (TIMESTAMP, NOT NULL)
- `end_time` (TIMESTAMP, NOT NULL)
- `project_id` (UUID, FOREIGN KEY → projects)
- `created_at` (TIMESTAMP)

**RLS:** ✅ Włączone (4 polityki)

---

### 10. **onboarding_progress** - Postęp Onboardingu
Śledzi postęp użytkownika w procesie onboardingu.

**Kolumny:**
- `id` (UUID, PRIMARY KEY)
- `user_id` (UUID, FOREIGN KEY → auth.users, UNIQUE)
- `completed_steps` (JSONB) - Lista ukończonych kroków
- `current_step` (TEXT)
- `is_completed` (BOOLEAN)
- `created_at` (TIMESTAMP)
- `updated_at` (TIMESTAMP)

**RLS:** ✅ Włączone (4 polityki)

---

### 11. **notifications** - Powiadomienia
Przechowuje powiadomienia dla użytkowników.

**Kolumny:**
- `id` (UUID, PRIMARY KEY)
- `user_id` (UUID, FOREIGN KEY → auth.users)
- `title` (TEXT, NOT NULL)
- `message` (TEXT, NOT NULL)
- `type` (TEXT) - Typ powiadomienia
- `is_read` (BOOLEAN)
- `action_url` (TEXT)
- `created_at` (TIMESTAMP)

**RLS:** ✅ Włączone (4 polityki)

---

### 12. **project_photos** - Zdjęcia Projektów
Przechowuje zdjęcia związane z projektami.

**Kolumny:**
- `id` (UUID, PRIMARY KEY)
- `project_id` (UUID, FOREIGN KEY → projects)
- `user_id` (UUID, FOREIGN KEY → auth.users)
- `photo_url` (TEXT, NOT NULL)
- `caption` (TEXT)
- `uploaded_at` (TIMESTAMP)

**RLS:** ✅ Włączone (4 polityki)

---

### 13. **purchase_costs** - Koszty Zakupów
Przechowuje koszty zakupów materiałów.

**Kolumny:**
- `id` (UUID, PRIMARY KEY)
- `project_id` (UUID, FOREIGN KEY → projects)
- `user_id` (UUID, FOREIGN KEY → auth.users)
- `item_name` (TEXT, NOT NULL)
- `quantity` (NUMERIC, NOT NULL)
- `unit_price` (NUMERIC, NOT NULL)
- `total_cost` (NUMERIC, NOT NULL)
- `purchase_date` (DATE)
- `receipt_url` (TEXT)
- `created_at` (TIMESTAMP)

**RLS:** ✅ Włączone (4 polityki)

---

### 14. **offer_approvals** - Zatwierdzenia Ofert
Przechowuje informacje o zatwierdzonych ofertach przez klientów.

**Kolumny:**
- `id` (UUID, PRIMARY KEY)
- `project_id` (UUID, FOREIGN KEY → projects, UNIQUE)
- `approval_token` (TEXT, UNIQUE)
- `approved` (BOOLEAN)
- `approved_at` (TIMESTAMP)
- `client_signature` (TEXT)
- `created_at` (TIMESTAMP)

**RLS:** ✅ Włączone (specjalne polityki dla publicznego dostępu)

---

### 15. **team_members** - Członkowie Zespołu
Przechowuje członków zespołu użytkownika.

**Kolumny:**
- `id` (UUID, PRIMARY KEY)
- `user_id` (UUID, FOREIGN KEY → auth.users)
- `name` (TEXT, NOT NULL)
- `role` (TEXT)
- `phone` (TEXT)
- `email` (TEXT)
- `hourly_rate` (NUMERIC)
- `created_at` (TIMESTAMP)

**RLS:** ✅ Włączone (4 polityki)

---

### 16. **team_locations** - Lokalizacje Zespołu
Przechowuje lokalizacje członków zespołu (GPS tracking).

**Kolumny:**
- `id` (UUID, PRIMARY KEY)
- `team_member_id` (UUID, FOREIGN KEY → team_members)
- `user_id` (UUID, FOREIGN KEY → auth.users)
- `latitude` (NUMERIC, NOT NULL)
- `longitude` (NUMERIC, NOT NULL)
- `timestamp` (TIMESTAMP, NOT NULL)

**RLS:** ✅ Włączone (4 polityki)

---

### 17. **subcontractors** - Podwykonawcy
Przechowuje informacje o podwykonawcach.

**Kolumny:**
- `id` (UUID, PRIMARY KEY)
- `user_id` (UUID, FOREIGN KEY → auth.users)
- `name` (TEXT, NOT NULL)
- `company_name` (TEXT)
- `phone` (TEXT)
- `email` (TEXT)
- `specialization` (TEXT)
- `rating` (NUMERIC)
- `created_at` (TIMESTAMP)

**RLS:** ✅ Włączone (4 polityki)

---

### 18. **subcontractor_services** - Usługi Podwykonawców
Przechowuje usługi oferowane przez podwykonawców.

**Kolumny:**
- `id` (UUID, PRIMARY KEY)
- `subcontractor_id` (UUID, FOREIGN KEY → subcontractors)
- `user_id` (UUID, FOREIGN KEY → auth.users)
- `service_name` (TEXT, NOT NULL)
- `price_per_unit` (NUMERIC)
- `unit` (TEXT)
- `description` (TEXT)
- `created_at` (TIMESTAMP)

**RLS:** ✅ Włączone (4 polityki)

---

### 19. **subcontractor_reviews** - Opinie o Podwykonawcach
Przechowuje opinie o podwykonawcach.

**Kolumny:**
- `id` (UUID, PRIMARY KEY)
- `subcontractor_id` (UUID, FOREIGN KEY → subcontractors)
- `user_id` (UUID, FOREIGN KEY → auth.users)
- `rating` (INTEGER, CHECK 1-5)
- `review_text` (TEXT)
- `created_at` (TIMESTAMP)

**RLS:** ✅ Włączone (4 polityki)

---

### 20. **work_tasks** - Zadania Robocze
Przechowuje zadania do wykonania w projektach.

**Kolumny:**
- `id` (UUID, PRIMARY KEY)
- `project_id` (UUID, FOREIGN KEY → projects)
- `user_id` (UUID, FOREIGN KEY → auth.users)
- `task_name` (TEXT, NOT NULL)
- `description` (TEXT)
- `assigned_to` (UUID, FOREIGN KEY → team_members)
- `status` (TEXT) - 'todo', 'in_progress', 'done'
- `due_date` (DATE)
- `created_at` (TIMESTAMP)

**RLS:** ✅ Włączone (4 polityki)

---

### 21. **financial_reports** - Raporty Finansowe
Przechowuje wygenerowane raporty finansowe.

**Kolumny:**
- `id` (UUID, PRIMARY KEY)
- `user_id` (UUID, FOREIGN KEY → auth.users)
- `report_type` (TEXT, NOT NULL)
- `start_date` (DATE, NOT NULL)
- `end_date` (DATE, NOT NULL)
- `report_data` (JSONB)
- `created_at` (TIMESTAMP)

**RLS:** ✅ Włączone (4 polityki)

---

### 22. **api_keys** - Klucze API
Przechowuje klucze API użytkowników dla publicznego API.

**Kolumny:**
- `id` (UUID, PRIMARY KEY)
- `user_id` (UUID, FOREIGN KEY → auth.users)
- `key_name` (TEXT, NOT NULL)
- `api_key` (TEXT, UNIQUE, NOT NULL)
- `is_active` (BOOLEAN)
- `created_at` (TIMESTAMP)
- `last_used_at` (TIMESTAMP)

**RLS:** ✅ Włączone (4 polityki)

---

### 23. **ai_chat_history** - Historia Czatu AI
Przechowuje historię rozmów z AI.

**Kolumny:**
- `id` (UUID, PRIMARY KEY)
- `user_id` (UUID, FOREIGN KEY → auth.users)
- `session_id` (UUID)
- `role` (TEXT) - 'user', 'assistant', 'system'
- `content` (TEXT, NOT NULL)
- `created_at` (TIMESTAMP)

**RLS:** ✅ Włączone (4 polityki)

---

### 24. **company_documents** - Dokumenty Firmowe
Przechowuje dokumenty firmowe (regulaminy, umowy, etc.).

**Kolumny:**
- `id` (UUID, PRIMARY KEY)
- `user_id` (UUID, FOREIGN KEY → auth.users)
- `document_name` (TEXT, NOT NULL)
- `document_url` (TEXT, NOT NULL)
- `document_type` (TEXT)
- `created_at` (TIMESTAMP)

**RLS:** ✅ Włączone (4 polityki)

---

### 25. **user_consents** - Zgody Użytkowników
Przechowuje zgody użytkowników (RODO, marketing, etc.).

**Kolumny:**
- `id` (UUID, PRIMARY KEY)
- `user_id` (UUID, FOREIGN KEY → auth.users, UNIQUE)
- `terms_accepted` (BOOLEAN)
- `privacy_accepted` (BOOLEAN)
- `marketing_accepted` (BOOLEAN)
- `accepted_at` (TIMESTAMP)

**RLS:** ✅ Włączone (4 polityki)

---

### 26. **user_subscriptions** - Subskrypcje Użytkowników
Przechowuje informacje o subskrypcjach (Stripe integration).

**Kolumny:**
- `id` (UUID, PRIMARY KEY)
- `user_id` (UUID, FOREIGN KEY → auth.users, UNIQUE)
- `stripe_customer_id` (TEXT)
- `stripe_subscription_id` (TEXT)
- `plan_id` (TEXT, CHECK) - 'free', 'pro', 'starter', 'business', 'enterprise'
- `status` (TEXT) - 'active', 'canceled', 'past_due', etc.
- `current_period_start` (TIMESTAMP)
- `current_period_end` (TIMESTAMP)
- `cancel_at_period_end` (BOOLEAN)
- `trial_end` (TIMESTAMP)
- `created_at` (TIMESTAMP)
- `updated_at` (TIMESTAMP)

**RLS:** ✅ Włączone (4 polityki)

---

### 27. **subscription_events** - Wydarzenia Subskrypcji
Przechowuje logi webhook'ów Stripe.

**Kolumny:**
- `id` (UUID, PRIMARY KEY)
- `user_id` (UUID, FOREIGN KEY → auth.users)
- `subscription_id` (TEXT)
- `event_type` (TEXT) - Typ eventu Stripe
- `event_data` (JSONB) - Pełny payload
- `processed` (BOOLEAN)
- `processed_at` (TIMESTAMP)
- `error` (TEXT)
- `created_at` (TIMESTAMP)

**RLS:** ✅ Włączone (polityki dla service_role)
**Indeksy:** 4 indeksy dla wydajności

---

### 28. **push_tokens** - Tokeny Push Notifications
Przechowuje tokeny do powiadomień push (Capacitor).

**Kolumny:**
- `id` (UUID, PRIMARY KEY)
- `user_id` (UUID, FOREIGN KEY → auth.users)
- `token` (TEXT, NOT NULL)
- `platform` (TEXT) - 'ios', 'android', 'web'
- `created_at` (TIMESTAMP)

**RLS:** ✅ Włączone (4 polityki)

---

### 29. **user_roles** - Role Użytkowników
Przechowuje role użytkowników w systemie.

**Kolumny:**
- `id` (UUID, PRIMARY KEY)
- `user_id` (UUID, FOREIGN KEY → auth.users, UNIQUE)
- `role` (TEXT, CHECK) - 'admin', 'user'
- `created_at` (TIMESTAMP)

**RLS:** ✅ Włączone (4 polityki)

---

### 30. **api_rate_limits** - Limity API
Przechowuje informacje o limitach użycia API.

**Kolumny:**
- `id` (UUID, PRIMARY KEY)
- `api_key_id` (UUID, FOREIGN KEY → api_keys)
- `endpoint` (TEXT, NOT NULL)
- `request_count` (INTEGER)
- `window_start` (TIMESTAMP)
- `created_at` (TIMESTAMP)

**RLS:** ✅ Włączone (4 polityki)

---

### 31. **organizations** - Organizacje
Przechowuje organizacje (dla funkcji multi-tenant).

**Kolumny:**
- `id` (UUID, PRIMARY KEY)
- `name` (TEXT, NOT NULL)
- `owner_id` (UUID, FOREIGN KEY → auth.users)
- `created_at` (TIMESTAMP)

**RLS:** ✅ Włączone

---

### 32. **organization_members** - Członkowie Organizacji
Przechowuje członkostwo w organizacjach.

**Kolumny:**
- `id` (UUID, PRIMARY KEY)
- `organization_id` (UUID, FOREIGN KEY → organizations)
- `user_id` (UUID, FOREIGN KEY → auth.users)
- `role` (TEXT)
- `created_at` (TIMESTAMP)

**RLS:** ✅ Włączone

---

### 33. **biometric_credentials** - Dane Biometryczne
Przechowuje dane biometryczne do logowania (Face ID, Touch ID).

**Kolumny:**
- `id` (UUID, PRIMARY KEY)
- `user_id` (UUID, FOREIGN KEY → auth.users)
- `credential_id` (TEXT, UNIQUE)
- `public_key` (TEXT)
- `created_at` (TIMESTAMP)

**RLS:** ✅ Włączone

---

## 🪣 Storage Buckets

### 1. **logos** - Logo Firm
- **Public:** ✅ Tak
- **Polityki RLS:** 4 polityki (CRUD)
- **Struktura folderów:** `{user_id}/logo.{ext}`

---

## ⚙️ Funkcje PostgreSQL

### 1. **handle_new_user()**
**Typ:** TRIGGER FUNCTION
**Cel:** Automatyczne tworzenie profilu przy rejestracji użytkownika
**Trigger:** `on_auth_user_created` (AFTER INSERT ON auth.users)

### 2. **update_profiles_updated_at()**
**Typ:** TRIGGER FUNCTION
**Cel:** Automatyczna aktualizacja pola `updated_at` w tabeli profiles
**Trigger:** `update_profiles_updated_at` (BEFORE UPDATE ON profiles)

### 3. **sync_subscription_from_stripe()**
**Typ:** FUNCTION
**Cel:** Synchronizacja danych subskrypcji z webhook'ów Stripe
**Uprawnienia:** SECURITY DEFINER, dostęp dla service_role

---

## 📋 Weryfikacja Struktury

### Jak zweryfikować strukturę w Supabase Dashboard:

1. **Przejdź do:** https://supabase.com/dashboard/project/xwxvqhhnozfrjcjmcltv
2. **Kliknij:** "SQL Editor" w menu bocznym
3. **Wklej i uruchom:** Zawartość pliku `/tmp/database_verification.sql`
4. **Sprawdź wyniki:**
   - Wszystkie 33 tabele powinny być widoczne
   - RLS powinno być włączone na wszystkich tabelach
   - Powinny istnieć 3 funkcje
   - Powinien istnieć 1 bucket (logos)

### Alternatywnie - sprawdź w Table Editor:

1. **Przejdź do:** Table Editor w Supabase Dashboard
2. **Sprawdź liczbę tabel:** Powinieneś zobaczyć 33 tabele
3. **Kliknij na każdą tabelę:** Zweryfikuj kolumny i typy danych

---

## 🔐 Bezpieczeństwo

### Row Level Security (RLS)
✅ **Wszystkie tabele mają włączone RLS**
✅ **Każda tabela ma polityki dla:** SELECT, INSERT, UPDATE, DELETE
✅ **Polityki zapewniają:** Izolację danych między użytkownikami

### Storage Security
✅ **Bucket 'logos' jest publiczny** (tylko do odczytu)
✅ **Użytkownicy mogą:** Uploadować/edytować/usuwać tylko swoje logo

---

## 📊 Indeksy Wydajnościowe

Dodatkowe indeksy zostały utworzone dla:
- `clients.user_id`
- `projects.user_id`, `projects.client_id`
- `quotes.project_id`
- `pdf_data.project_id`
- `subscription_events.user_id`, `subscription_events.subscription_id`, `subscription_events.event_type`, `subscription_events.processed`

---

## 🚀 Status Wdrożenia

**Screenshot pokazuje:** 11 tabel w projekcie Supabase
**Oczekiwane:** 33 tabele

**Akcja wymagana:** Wdrożenie pozostałych migracji na Supabase

---

## 📝 Notatki

- Wszystkie tabele używają UUID jako PRIMARY KEY
- Wszystkie tabele mają `created_at` timestamp
- Większość tabel ma relację do `auth.users` (user_id)
- Używamy `ON DELETE CASCADE` dla automatycznego czyszczenia powiązanych danych
- JSONB jest używane do elastycznych struktur danych (positions, snapshots, event_data)

---

**Ostatnia aktualizacja:** 2025-12-27
**Wygenerowano przez:** Claude Code AI Assistant
