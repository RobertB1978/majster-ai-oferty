# Majster.AI - Kompletny Przewodnik Konfiguracji Supabase

> **Dla kogo?** Ten przewodnik jest dla osób nietechnicznych, które chcą uruchomić Majster.AI na własnym projekcie Supabase.

## 📋 Spis treści

1. [Przygotowanie Supabase](#1-przygotowanie-supabase)
2. [Migracja Bazy Danych](#2-migracja-bazy-danych)
3. [Konfiguracja Sekretów](#3-konfiguracja-sekretów)
4. [Deployment Edge Functions](#4-deployment-edge-functions)
5. [Konfiguracja Vercel](#5-konfiguracja-vercel)
6. [Lokalne Uruchomienie](#6-lokalne-uruchomienie)
7. [Checklist Weryfikacji](#7-checklist-weryfikacji)

---

## 1. Przygotowanie Supabase

### Krok 1.1: Utwórz projekt Supabase

1. Wejdź na https://supabase.com
2. Zaloguj się lub załóż konto
3. Kliknij **"New Project"**
4. Wypełnij dane:
   - **Name:** `majster-ai-prod` (lub inna nazwa)
   - **Database Password:** Zapisz hasło w bezpiecznym miejscu!
   - **Region:** Wybierz najbliższy region (np. `Europe West (London)`)
   - **Pricing Plan:** Free tier wystarczy na start
5. Kliknij **"Create new project"**
6. Poczekaj 2-3 minuty, aż projekt się utworzy

### Krok 1.2: Zapisz dane dostępowe

Po utworzeniu projektu przejdź do **Settings → API**.

Zapisz następujące dane (będą potrzebne później):

```
Project URL: https://xxxxxxxxxxxxx.supabase.co
anon public key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9... (długi ciąg znaków)
service_role key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9... (długi ciąg znaków, INNY niż anon)
Project ID: xxxxxxxxxxxxx (samo ID z URL)
```

⚠️ **WAŻNE:** `service_role key` to BARDZO WAŻNY klucz - trzymaj go w tajemnicy!

---

## 2. Migracja Bazy Danych

### Krok 2.1: Otwórz SQL Editor

1. W panelu Supabase kliknij **SQL Editor** (ikona z lewej strony)
2. Kliknij **"New query"**

### Krok 2.2: Uruchom skrypt migracji

1. Otwórz plik `CONSOLIDATED_MIGRATIONS.sql` z repozytorium (znajduje się w głównym katalogu)
2. Skopiuj **całą zawartość** pliku (Ctrl+A, Ctrl+C)
3. Wklej do SQL Editor w Supabase (Ctrl+V)
4. Kliknij **"Run"** (lub naciśnij Ctrl+Enter)
5. Poczekaj 5-10 sekund

✅ **Sukces!** Jeśli zobaczysz "Success. No rows returned" - wszystko działa!

❌ **Błąd?** Jeśli zobaczysz błąd:
   - Skopiuj treść błędu
   - Sprawdź czy skopiowałeś cały plik (powinien mieć ~1500 linii)
   - Spróbuj ponownie

### Krok 2.3: Weryfikacja

Sprawdź czy tabele zostały utworzone:

1. Kliknij **Table Editor** (ikona z lewej strony)
2. Powinieneś zobaczyć listę tabel: `clients`, `projects`, `quotes`, `profiles`, itd.

![Supabase Tables](https://placeholder-for-screenshot.png)

✅ Jeśli widzisz tabele - migracja powiodła się!

---

## 3. Konfiguracja Sekretów

### Krok 3.1: Przejdź do Edge Functions → Secrets

1. W panelu Supabase kliknij **Edge Functions** (ikona z lewej strony)
2. Kliknij zakładkę **"Secrets"** u góry
3. Zobaczysz listę sekretów do skonfigurowania

### Krok 3.2: Dodaj wymagane sekrety

Kliknij **"Add new secret"** i dodaj następujące sekrety:

#### ✅ Wymagane Sekrety

| Nazwa | Wartość | Gdzie znaleźć |
|-------|---------|---------------|
| `SUPABASE_URL` | https://xxxxx.supabase.co | Settings → API → Project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | eyJhbGci... | Settings → API → service_role key |
| `RESEND_API_KEY` | re_... | [resend.com](https://resend.com) → API Keys |

#### ⚙️ Sekret AI (wybierz JEDEN z trzech)

**Opcja A: OpenAI (rekomendowane)**
- Nazwa: `OPENAI_API_KEY`
- Wartość: `sk-...`
- Gdzie: [platform.openai.com](https://platform.openai.com) → API Keys

**Opcja B: Anthropic Claude**
- Nazwa: `ANTHROPIC_API_KEY`
- Wartość: `sk-ant-...`
- Gdzie: [console.anthropic.com](https://console.anthropic.com) → API Keys

**Opcja C: Google Gemini (darmowy)**
- Nazwa: `GEMINI_API_KEY`
- Wartość: `AIza...`
- Gdzie: [aistudio.google.com](https://aistudio.google.com) → Get API Key

#### 🌐 Sekret dla Vercel (opcjonalny, ale rekomendowany)

| Nazwa | Wartość | Przykład |
|-------|---------|----------|
| `FRONTEND_URL` | URL Twojej aplikacji na Vercel | https://majster-ai.vercel.app |

### Krok 3.3: Weryfikacja

Po dodaniu sekretów powinieneś zobaczyć listę:
- ✅ SUPABASE_URL
- ✅ SUPABASE_SERVICE_ROLE_KEY
- ✅ RESEND_API_KEY
- ✅ OPENAI_API_KEY (lub ANTHROPIC_API_KEY lub GEMINI_API_KEY)
- ✅ FRONTEND_URL (opcjonalny)

---

## 4. Deployment Edge Functions

### Krok 4.1: Zainstaluj Supabase CLI

**Windows:**
```powershell
# Pobierz z https://github.com/supabase/cli/releases
# Lub zainstaluj przez npm:
npm install -g supabase
```

**Mac/Linux:**
```bash
brew install supabase/tap/supabase
# lub
npm install -g supabase
```

### Krok 4.2: Zaloguj się do Supabase

```bash
supabase login
```

Otworzy się okno przeglądarki - zaloguj się i wróć do terminala.

### Krok 4.3: Połącz się z projektem

```bash
cd /ścieżka/do/majster-ai-oferty
supabase link --project-ref <TWOJE_PROJECT_ID>
```

Gdzie `<TWOJE_PROJECT_ID>` to ID z Kroku 1.2 (np. `zpawgcecwqvypodzvlzy`)

### Krok 4.4: Deploy wszystkich funkcji

```bash
supabase functions deploy --no-verify-jwt
```

✅ Po kilku minutach zobaczysz:
```
Deployed Functions:
✓ ai-chat-agent
✓ ai-quote-suggestions
✓ analyze-photo
✓ approve-offer
✓ finance-ai-analysis
✓ ocr-invoice
✓ send-offer-email
✓ send-expiring-offer-reminders
✓ voice-quote-processor
```

---

## 5. Konfiguracja Vercel

### Krok 5.1: Przejdź do ustawień projektu

1. Wejdź na https://vercel.com
2. Otwórz swój projekt (`majster-ai-oferty-foom` lub inna nazwa)
3. Kliknij **Settings** u góry

### Krok 5.2: Dodaj zmienne środowiskowe

1. Kliknij **Environment Variables** z lewej strony
2. Dodaj następujące zmienne dla **Production**, **Preview** i **Development**:

| Name | Value |
|------|-------|
| `VITE_SUPABASE_URL` | https://xxxxx.supabase.co |
| `VITE_SUPABASE_ANON_KEY` | eyJhbGci... (anon public key) |

⚠️ **UWAGA:** To są inne zmienne niż w Supabase Secrets!
- Vercel: `VITE_SUPABASE_ANON_KEY` (klucz publiczny)
- Supabase: `SUPABASE_SERVICE_ROLE_KEY` (klucz prywatny)

### Krok 5.3: Weryfikuj konfigurację Build

1. Przejdź do **Settings → General**
2. Sprawdź **Build & Development Settings**:
   - **Framework Preset:** `Vite`
   - **Build Command:** `npm run build` (lub `vite build`)
   - **Output Directory:** `dist`
   - **Install Command:** `npm install`

Jeśli coś jest inne - popraw i kliknij **Save**.

### Krok 5.4: Redeploy aplikacji

1. Przejdź do **Deployments**
2. Kliknij **...** (trzy kropki) przy ostatnim deployment
3. Kliknij **Redeploy**
4. Poczekaj 2-3 minuty

✅ Po zakończeniu kliknij **Visit** - aplikacja powinna się załadować!

---

## 6. Lokalne Uruchomienie

### Krok 6.1: Sklonuj repozytorium (jeśli jeszcze nie masz)

```bash
git clone https://github.com/RobertB1978/majster-ai-oferty.git
cd majster-ai-oferty
```

### Krok 6.2: Skopiuj plik .env.example do .env

```bash
cp .env.example .env
```

### Krok 6.3: Edytuj plik .env

Otwórz plik `.env` w edytorze tekstu i wklej swoje dane:

```env
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGci...
```

Zapisz plik (Ctrl+S).

### Krok 6.4: Zainstaluj zależności

```bash
npm install
```

Poczekaj 1-2 minuty, aż zainstalują się wszystkie pakiety.

### Krok 6.5: Uruchom aplikację

```bash
npm run dev
```

✅ Zobaczysz komunikat:
```
  VITE v5.x.x  ready in XXX ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
```

### Krok 6.6: Otwórz w przeglądarce

1. Otwórz http://localhost:5173
2. Powinieneś zobaczyć stronę logowania Majster.AI
3. Utwórz konto i zaloguj się!

---

## 7. Checklist Weryfikacji

### ✅ Supabase Database

Wejdź w **Table Editor** i sprawdź:

- [ ] Widzę tabelę `clients`
- [ ] Widzę tabelę `projects`
- [ ] Widzę tabelę `quotes`
- [ ] Widzę tabelę `profiles`
- [ ] Widzę tabelę `offer_approvals`
- [ ] Łącznie jest ~30 tabel

### ✅ Supabase Storage

Wejdź w **Storage** i sprawdź:

- [ ] Jest bucket `logos` (public)
- [ ] Jest bucket `project-photos` (private)
- [ ] Jest bucket `company-documents` (private)

### ✅ Supabase Edge Functions

Wejdź w **Edge Functions** i sprawdź:

- [ ] Funkcje są wdrożone (widać zielone checkmarki)
- [ ] W zakładce **Secrets** są wszystkie wymagane sekrety
- [ ] W zakładce **Logs** nie ma błędów (czerwonych wpisów)

### ✅ Vercel Deployment

Wejdź na URL swojej aplikacji na Vercel:

- [ ] Strona się ładuje (nie ma błędu 500 lub białego ekranu)
- [ ] Widzę stronę logowania
- [ ] Mogę się zarejestrować (wypełnić formularz rejestracji)
- [ ] Po zalogowaniu widzę dashboard

### ✅ Funkcjonalność (po zalogowaniu)

W aplikacji przetestuj podstawowy flow:

- [ ] **Krok 1:** Mogę dodać nowego klienta (Klienci → Dodaj klienta)
- [ ] **Krok 2:** Mogę utworzyć projekt dla klienta (Projekty → Nowy projekt)
- [ ] **Krok 3:** Mogę dodać wycenę do projektu (otwórz projekt → Utwórz wycenę)
- [ ] **Krok 4:** Mogę wygenerować PDF (w zakładce PDF)
- [ ] **Krok 5:** Mogę wysłać ofertę emailem (jeśli masz RESEND_API_KEY)

### ✅ AI Funkcjonalność (opcjonalna)

Jeśli skonfigurowałeś klucz AI:

- [ ] Mogę otworzyć AI Chat (ikona chatu)
- [ ] AI odpowiada na pytania
- [ ] Mogę użyć AI do generowania wyceny

---

## 🎉 Gratulacje!

Jeśli wszystkie checklisty są zaznaczone - **Twoja instalacja Majster.AI jest gotowa!**

---

## 🆘 Rozwiązywanie Problemów

### Problem: Biały ekran na Vercel

**Rozwiązanie:**
1. Sprawdź **Vercel → Deployment → Function Logs**
2. Szukaj błędów związanych z `VITE_SUPABASE_*`
3. Upewnij się, że zmienne środowiskowe są ustawione dla **Production**

### Problem: "Missing Supabase configuration"

**Rozwiązanie:**
1. Sprawdź czy plik `.env` (lokalnie) lub zmienne w Vercel są poprawnie ustawione
2. Upewnij się, że używasz `VITE_SUPABASE_URL` i `VITE_SUPABASE_ANON_KEY` (z przedrostkiem `VITE_`)

### Problem: "AI nie odpowiada"

**Rozwiązanie:**
1. Sprawdź **Supabase → Edge Functions → Logs**
2. Sprawdź czy w Secrets masz ustawiony jeden z kluczy AI:
   - `OPENAI_API_KEY`
   - `ANTHROPIC_API_KEY`
   - `GEMINI_API_KEY`
3. Sprawdź saldo na koncie providera AI

### Problem: "Email nie wysyła się"

**Rozwiązanie:**
1. Sprawdź czy w **Supabase → Edge Functions → Secrets** masz `RESEND_API_KEY`
2. Sprawdź czy klucz jest aktywny na [resend.com](https://resend.com)
3. Sprawdź logi w **Edge Functions → send-offer-email → Logs**

### Problem: "Cannot access table XXX"

**Rozwiązanie:**
1. Sprawdź w **SQL Editor** czy tabela istnieje:
   ```sql
   SELECT * FROM information_schema.tables WHERE table_schema = 'public';
   ```
2. Jeśli tabeli nie ma - uruchom ponownie skrypt `CONSOLIDATED_MIGRATIONS.sql`

---

## 📞 Wsparcie

Jeśli masz problemy:

1. **Sprawdź logi:**
   - Vercel: Deployments → Function Logs
   - Supabase: Edge Functions → Logs

2. **Dokumentacja:**
   - Supabase: https://supabase.com/docs
   - Vercel: https://vercel.com/docs

3. **GitHub Issues:**
   - Utwórz issue w repozytorium z opisem problemu i logami

---

**Autor:** Claude Code
**Wersja:** 1.0
**Data:** 2024-12-10
