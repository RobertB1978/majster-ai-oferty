# ✅ Supabase Setup Checklist

**Cel:** Skonfigurować Supabase Auth aby działało logowanie na localhost, github.dev i Vercel.

**Czas:** ~5 minut

---

## 📋 Przed startem - zdobądź swoje wartości

Będziesz potrzebować:

1. **Twoje Supabase Project ID** (znajdziesz w URL dashboardu)
   - Format: `https://supabase.com/dashboard/project/[YOUR_PROJECT_ID]`
   - Zapisz sobie: `[YOUR_PROJECT_ID]` = ?

2. **Twój Vercel Project Name** (nazwa projektu w Vercel)
   - Format: `https://vercel.com/[your-username]/[YOUR_VERCEL_PROJECT]`
   - Zapisz sobie: `[YOUR_VERCEL_PROJECT]` = ?

---

## Krok 1: Otwórz Supabase Dashboard

1. Przejdź do: https://supabase.com/dashboard
2. Zaloguj się
3. Wybierz swój projekt lub **utwórz nowy projekt**:
   - Jeśli tworzysz nowy:
     - Name: `majster-ai` (lub dowolna nazwa)
     - Database Password: **Zapisz hasło w bezpiecznym miejscu!**
     - Region: `Europe (eu-central-1)` (Frankfurt - najbliżej Polski)
     - Plan: `Free tier` (wystarczy na start)
     - Kliknij **Create new project**
     - ⏱️ Poczekaj 2-3 minuty aż projekt się uruchomi

---

## Krok 2: Pobierz API Credentials

1. W lewym menu kliknij **Settings** (ikona ⚙️ na dole)
2. Kliknij **API**
3. Skopiuj i zapisz:

```bash
# Project URL
VITE_SUPABASE_URL=https://[YOUR_PROJECT_ID].supabase.co

# anon/public key (długi token zaczynający się od "eyJ...")
VITE_SUPABASE_ANON_KEY=eyJ...
```

**WAŻNE:**
- ✅ Używaj `anon/public` key (to jest BEZPIECZNE dla frontendu)
- ❌ NIE używaj `service_role` key (to klucz super-admina, tylko dla backendu!)

---

## Krok 3: Skonfiguruj Authentication URLs

### 3.1 Otwórz ustawienia Auth

1. W lewym menu kliknij **Authentication** (ikona 🔐)
2. Kliknij **URL Configuration** (zakładka na górze)

### 3.2 Ustaw Site URL

**Site URL** = główny URL Twojej aplikacji produkcyjnej

```
Site URL:
https://[YOUR_VERCEL_PROJECT].vercel.app
```

**Przykład:**
```
https://majster-ai-oferty.vercel.app
```

**Co wpisać:**
- Zastąp `[YOUR_VERCEL_PROJECT]` nazwą Twojego projektu w Vercel
- Możesz też użyć własnej domeny, jeśli ją podłączyłeś (np. `https://majster-ai-oferty.vercel.app (TEMP)`)

### 3.3 Dodaj Redirect URLs

**Redirect URLs** = wszystkie URL-e, z których użytkownicy mogą się logować

**Kliknij "Add URL" i dodaj KAŻDY z poniższych URL-i (jeden po drugim):**

```
http://localhost:8080
http://localhost:8080/dashboard
http://localhost:8080/reset-password

https://[YOUR_VERCEL_PROJECT].vercel.app
https://[YOUR_VERCEL_PROJECT].vercel.app/dashboard
https://[YOUR_VERCEL_PROJECT].vercel.app/reset-password

https://[YOUR_VERCEL_PROJECT]-*.vercel.app
https://[YOUR_VERCEL_PROJECT]-*.vercel.app/dashboard
https://[YOUR_VERCEL_PROJECT]-*.vercel.app/reset-password
```

**Jeśli pracujesz w github.dev (opcjonalnie):**

```
https://*.github.dev
https://*.github.dev/dashboard
https://*.github.dev/reset-password
```

**Konkretny przykład z wypełnionymi wartościami:**

Jeśli Twój Vercel project to `majster-ai-oferty`, lista powinna wyglądać tak:

```
✅ http://localhost:8080
✅ http://localhost:8080/dashboard
✅ http://localhost:8080/reset-password
✅ https://majster-ai-oferty.vercel.app
✅ https://majster-ai-oferty.vercel.app/dashboard
✅ https://majster-ai-oferty.vercel.app/reset-password
✅ https://majster-ai-oferty-*.vercel.app
✅ https://majster-ai-oferty-*.vercel.app/dashboard
✅ https://majster-ai-oferty-*.vercel.app/reset-password
```

**Wyjaśnienie wildcard `*`:**
- `https://majster-ai-oferty-*.vercel.app` = obejmuje wszystkie preview deploymenty (np. `majster-ai-oferty-git-feature-branch.vercel.app`)
- To pozwoli Ci testować logowanie na każdym preview deployment

### 3.4 Zapisz zmiany

Kliknij **Save** na dole strony.

---

## Krok 4: Włącz Email Authentication

1. W lewym menu kliknij **Authentication** → **Providers**
2. Sprawdź czy **Email** provider jest włączony (powinien być domyślnie)
3. Jeśli nie jest włączony:
   - Kliknij **Email**
   - Przełącz **Enable Email provider** na ON
   - **Confirm email** powinno być włączone (domyślnie ON)
   - Kliknij **Save**

---

## Krok 5: Uruchom Database Migrations (KRYTYCZNE!)

**WAŻNE:** Aplikacja potrzebuje tabel w bazie danych. Bez migracji logowanie się nie uda!

### Opcja A: Lokalne uruchomienie migracji (ZALECANE)

```bash
# 1. Zainstaluj Supabase CLI (jeśli nie masz)
npm install -g supabase

# 2. Zaloguj się do Supabase
npx supabase login

# 3. Link do swojego projektu (WAŻNE: zamień [YOUR_PROJECT_ID])
npx supabase link --project-ref [YOUR_PROJECT_ID]
# Zostaniesz poproszony o database password (to hasło które ustawiłeś podczas tworzenia projektu)

# 4. Wypchaj migracje do Supabase
npx supabase db push

# 5. Sprawdź czy migracje się udały
npx supabase db remote commit
```

### Opcja B: Dashboard (jeśli nie masz dostępu do CLI)

1. W Supabase Dashboard → **SQL Editor**
2. Otwórz każdy plik z `supabase/migrations/` w repo
3. Skopiuj zawartość pliku i uruchom w SQL Editor
4. **WAŻNE:** Uruchamiaj w kolejności chronologicznej (po nazwie pliku)!

---

## Krok 6: Weryfikacja ✅

### 6.1 Sprawdź czy tabele istnieją

1. W Supabase Dashboard → **Table Editor**
2. Powinieneś zobaczyć tabele:
   - ✅ `profiles`
   - ✅ `organizations`
   - ✅ `projects`
   - ✅ `clients`
   - ✅ `quotes`
   - ✅ `offer_sends`
   - ✅ (i inne...)

Jeśli NIE widzisz tych tabel → wróć do **Krok 5** i uruchom migracje!

### 6.2 Sprawdź konfigurację Auth

W **Authentication** → **URL Configuration** powinieneś zobaczyć:

```
Site URL: https://[YOUR_VERCEL_PROJECT].vercel.app

Redirect URLs:
  ✅ http://localhost:8080
  ✅ http://localhost:8080/dashboard
  ✅ http://localhost:8080/reset-password
  ✅ https://[YOUR_VERCEL_PROJECT].vercel.app
  ✅ https://[YOUR_VERCEL_PROJECT].vercel.app/dashboard
  ✅ https://[YOUR_VERCEL_PROJECT].vercel.app/reset-password
  ✅ https://[YOUR_VERCEL_PROJECT]-*.vercel.app
  ✅ https://[YOUR_VERCEL_PROJECT]-*.vercel.app/dashboard
  ✅ https://[YOUR_VERCEL_PROJECT]-*.vercel.app/reset-password
```

---

## Krok 7: Utwórz plik .env lokalnie

W katalogu głównym projektu utwórz plik `.env` (jeśli nie istnieje):

```bash
# .env
VITE_SUPABASE_URL=https://[YOUR_PROJECT_ID].supabase.co
VITE_SUPABASE_ANON_KEY=eyJ... (twój długi klucz)
```

**PRZYKŁAD z wypełnionymi wartościami:**

```bash
# .env
VITE_SUPABASE_URL=https://abcdefghijklmnop.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFiY2RlZmdoaWprbG1ub3AiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTYxNjE2MTYxNiwiZXhwIjoxOTMxNzM3NjE2fQ.example_signature_here
```

**Sprawdź czy działa:**

```bash
# Uruchom dev server
npm run dev

# Otwórz http://localhost:8080
# Przejdź na stronę /login
# Powinieneś zobaczyć Auth Diagnostics panel (dolny prawy róg)
# Sprawdź czy:
#   ✅ Supabase URL jest poprawny (nie placeholder)
#   ✅ Anon Key ma > 100 znaków
#   ✅ "Test Connection" nie zwraca błędów
```

---

## Krok 8: Skonfiguruj Supabase Edge Functions Secrets (dla AI i Email)

**UWAGA:** To jest potrzebne tylko jeśli chcesz używać funkcji AI i wysyłki emaili.

1. W Supabase Dashboard → **Edge Functions** (w lewym menu)
2. Kliknij **Manage secrets** (przycisk na górze)
3. Dodaj następujące sekrety (kliknij **Add new secret**):

```bash
# WYMAGANE dla emaili (funkcja send-offer-email)
RESEND_API_KEY=re_... (zdobądź z https://resend.com/api-keys)

# WYMAGANE dla AI features (wybierz JEDEN):
OPENAI_API_KEY=sk-... (zdobądź z https://platform.openai.com/api-keys)
# LUB
ANTHROPIC_API_KEY=sk-ant-... (zdobądź z https://console.anthropic.com/settings/keys)
# LUB
GEMINI_API_KEY=AIza... (zdobądź z https://makersuite.google.com/app/apikey - DARMOWY!)

# WYMAGANE dla poprawnych linków w emailach
FRONTEND_URL=https://[YOUR_VERCEL_PROJECT].vercel.app

# AUTO-INJECTED (nie musisz dodawać ręcznie, Supabase robi to za Ciebie):
# SUPABASE_URL=https://[YOUR_PROJECT_ID].supabase.co
# SUPABASE_SERVICE_ROLE_KEY=... (Supabase wstrzykuje automatycznie)
```

**Przykład:**

```
Nazwa: RESEND_API_KEY
Wartość: re_123abc456def789ghi

Nazwa: GEMINI_API_KEY
Wartość: AIzaSyD_example_key_here_32chars

Nazwa: FRONTEND_URL
Wartość: https://majster-ai-oferty.vercel.app
```

4. Kliknij **Save** po dodaniu każdego secretu

---

## ✅ CHECKLIST KOŃCOWA

Zaznacz każdy punkt po wykonaniu:

- [ ] **Krok 1:** Utworzyłem/Otworzyłem projekt w Supabase
- [ ] **Krok 2:** Skopiowałem `VITE_SUPABASE_URL` i `VITE_SUPABASE_ANON_KEY`
- [ ] **Krok 3.2:** Ustawiłem **Site URL** na `https://[MY_VERCEL_PROJECT].vercel.app`
- [ ] **Krok 3.3:** Dodałem **wszystkie Redirect URLs** (localhost + vercel + wildcards)
- [ ] **Krok 4:** Email provider jest włączony
- [ ] **Krok 5:** Uruchomiłem database migrations (`npx supabase db push`)
- [ ] **Krok 6.1:** Widzę tabele w Table Editor (profiles, organizations, projects, etc.)
- [ ] **Krok 7:** Utworzyłem plik `.env` z prawdziwymi wartościami (nie placeholder!)
- [ ] **Krok 7:** `npm run dev` działa i Auth Diagnostics pokazuje ✅ (zielone checkmarki)
- [ ] **Krok 8:** (Opcjonalnie) Dodałem secrets dla Edge Functions (RESEND_API_KEY, AI key, FRONTEND_URL)

---

## 🚨 Troubleshooting

### Problem: "Invalid redirect URL" podczas logowania

**Rozwiązanie:**
- Sprawdź czy URL w przeglądarce DOKŁADNIE pasuje do jednego z Redirect URLs
- Sprawdź czy nie ma literówki (np. `http` vs `https`, trailing slash `/`)
- Sprawdź czy zapisałeś zmiany w Supabase Dashboard (przycisk **Save**)

### Problem: Auth Diagnostics pokazuje "No token" lub "Missing"

**Rozwiązanie:**
- Sprawdź czy `.env` ma PRAWDZIWE wartości (nie `your-project.supabase.co`)
- Sprawdź czy uruchomiłeś `npm run dev` PONOWNIE po utworzeniu `.env`
- Sprawdź w konsoli przeglądarki czy nie ma błędów (F12 → Console)

### Problem: Brak tabel w Table Editor

**Rozwiązanie:**
- Wróć do **Krok 5** i uruchom migracje
- Sprawdź w SQL Editor czy jest błąd podczas uruchamiania migracji
- Upewnij się że uruchamiasz migracje po kolei (chronologicznie po nazwie pliku)

---

## Następne kroki

Gdy skończysz tę checklistę, przejdź do:
- 📄 **VERCEL_SETUP_CHECKLIST.md** - konfiguracja deploymentu
- 🧪 **LOGIN_VERIFICATION_PLAN.md** - 5-minutowy test plan

---

**To wszystko! Po wykonaniu tych kroków Supabase będzie gotowy. 🎉**
