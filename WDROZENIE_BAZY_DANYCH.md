# 🚀 WDROŻENIE BAZY DANYCH - INSTRUKCJA KROK PO KROKU

## ⚡ Super Prosta Metoda (10 minut)

### 📋 Czego Potrzebujesz:
- ✅ Dostęp do Supabase Dashboard
- ✅ Pliku `supabase/master_migration_complete.sql` (GOTOWY!)

---

## 🎯 KROK 1: Otwórz Supabase Dashboard

1. Przejdź do: **https://supabase.com/dashboard/project/xwvxqhhnozfrjcjmcltv**
2. Zaloguj się jeśli trzeba
3. Powinieneś zobaczyć swój projekt: **majster-ai-prod**

---

## 🎯 KROK 2: Otwórz SQL Editor

1. W menu po lewej stronie kliknij: **"SQL Editor"** (ikona </>)
2. Kliknij zielony przycisk: **"New query"**
3. Zobaczysz pusty edytor SQL

---

## 🎯 KROK 3: Skopiuj Plik Master Migration

### Na Komputerze:

1. Otwórz plik: `supabase/master_migration_complete.sql`
2. Zaznacz **CAŁĄ** zawartość (Ctrl+A)
3. Skopiuj (Ctrl+C)

### Lub Pobierz z GitHub:

1. Idź do: https://github.com/RobertB1978/majster-ai-oferty/blob/claude/deploy-supabase-database-Asqqj/supabase/master_migration_complete.sql
2. Kliknij przycisk **"Raw"**
3. Zaznacz wszystko (Ctrl+A)
4. Skopiuj (Ctrl+C)

---

## 🎯 KROK 4: Wklej do SQL Editor

1. Wróć do Supabase SQL Editor
2. Kliknij w puste pole edytora
3. Wklej skopiowany kod (Ctrl+V)
4. Powinieneś zobaczyć ~2550 linii kodu SQL

---

## 🎯 KROK 5: Uruchom Migrację

1. Kliknij zielony przycisk: **"Run"** (lub naciśnij Ctrl+Enter)
2. **POCZEKAJ** ~30-60 sekund
3. Nie zamykaj okna, nie odświeżaj strony!
4. Zobaczysz komunikat o postępie

---

## 🎯 KROK 6: Sprawdź Wynik

### Powinieneś zobaczyć komunikat:

```
✅ SUKCES! Wszystkie tabele zostały utworzone!
Utworzono tabel: 33 (lub więcej)
```

### Jeśli widzisz BŁĄD:

- Sprawdź czy cały kod został skopiowany
- Spróbuj ponownie uruchomić (Run)
- Jeśli błąd się powtarza, skopiuj treść błędu i wyślij mi

---

## 🎯 KROK 7: Weryfikacja w Table Editor

1. W menu po lewej kliknij: **"Table Editor"** (ikona tabeli)
2. Powinieneś zobaczyć **33 tabele:**

**✅ Sprawdź czy widzisz:**
- api_keys
- api_rate_limits
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

---

## 🎯 KROK 8: Uruchom Skrypt Weryfikacyjny (Opcjonalnie)

Aby mieć **100% pewność** że wszystko działa:

1. W SQL Editor kliknij **"New query"**
2. Skopiuj zawartość pliku: `supabase/verify_database.sql`
3. Wklej i kliknij **"Run"**
4. Sprawdź wyniki

---

## ❓ Co Robi Ten Skrypt?

Ten **master migration** automatycznie:

1. ✅ **Usuwa stare polskie tabele** (klienci, cytaty, projektowanie, etc.)
2. ✅ **Tworzy 33 nowe angielskie tabele** (clients, quotes, projects, etc.)
3. ✅ **Konfiguruje Row Level Security (RLS)** na wszystkich tabelach
4. ✅ **Tworzy indeksy** dla wydajności
5. ✅ **Tworzy funkcje PostgreSQL** (auto-tworzenie profilu, etc.)
6. ✅ **Konfiguruje Storage** (bucket dla logo)
7. ✅ **Dodaje wszystkie polityki bezpieczeństwa**

---

## 🔍 Rozwiązywanie Problemów

### Problem: "already exists"

**Rozwiązanie:** To OK! Znaczy że część tabel już istnieje. Skrypt wykona się do końca.

### Problem: "permission denied"

**Rozwiązanie:** Upewnij się że jesteś zalogowany jako **właściciel projektu**.

### Problem: "syntax error"

**Rozwiązanie:**
1. Sprawdź czy skopiowałeś **cały** plik (wszystkie 2550 linii)
2. Spróbuj pobrać plik ponownie z GitHub

### Problem: Widzę mniej niż 33 tabele

**Rozwiązanie:**
1. Uruchom skrypt weryfikacyjny (`verify_database.sql`)
2. Sprawdź które tabele brakują
3. Wyślij mi informację o błędach

---

## ✅ Checklist Po Wdrożeniu

Zaznacz gdy zrobione:

- [ ] Uruchomiłem master migration w SQL Editor
- [ ] Widzę komunikat "SUKCES"
- [ ] W Table Editor widzę 33 tabele (lub więcej)
- [ ] Nazwy tabel są po angielsku (clients, projects, quotes, etc.)
- [ ] Nie ma już starych polskich tabel (klienci, cytaty, etc.)
- [ ] Uruchomiłem skrypt weryfikacyjny (opcjonalnie)

---

## 🎉 Gotowe!

Jeśli wszystkie punkty są zaznaczone - **GRATULACJE!**

Twoja baza danych jest w pełni wdrożona i gotowa do użycia! 🚀

---

## 🔧 Następne Kroki

Teraz możesz:

1. **Skonfigurować Edge Functions** (funkcje serverless)
2. **Ustawić zmienne środowiskowe** w pliku `.env`
3. **Uruchomić aplikację** lokalnie: `npm run dev`
4. **Przetestować rejestrację** użytkownika

---

## 📞 Pomoc

Jeśli coś nie działa:

1. Zrób screenshot błędu
2. Wyślij mi treść błędu
3. Powiedz na którym kroku jesteś

---

**Data utworzenia:** 2025-12-27
**Projekt:** Majster.AI
**Supabase Project ID:** xwvxqhhnozfrjcjmcltv
**Plik migracji:** `supabase/master_migration_complete.sql`
