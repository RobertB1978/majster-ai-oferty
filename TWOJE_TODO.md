# 🎯 TWOJE TODO - Konfiguracja Supabase dla Majster.AI

> **Status:** Kod jest gotowy! Teraz kolej na konfigurację infrastruktury.

## 📝 Co zostało zrobione przez Claude Code

✅ **1. Ujednolicono zmienne środowiskowe**
   - Zmieniono `VITE_SUPABASE_PUBLISHABLE_KEY` → `VITE_SUPABASE_ANON_KEY` (standard Supabase)
   - Dodano walidację w `src/integrations/supabase/client.ts`
   - Zaktualizowano całą dokumentację
   - Utworzono plik `.env.example`

✅ **2. Przygotowano kompletny skrypt migracji bazy danych**
   - Plik: `CONSOLIDATED_MIGRATIONS.sql` (56KB)
   - 32 tabele + RLS policies
   - 3 storage buckets + policies
   - 8 funkcji pomocniczych
   - 12 indeksów
   - Gotowy do wykonania w Supabase SQL Editor (jeden klik!)

✅ **3. Naprawiono Edge Functions**
   - Usunięto wszystkie hardcoded URLs
   - Dodano zmienną `FRONTEND_URL` dla przypomniedeń o ofertach
   - Wszystkie funkcje używają `Deno.env.get()` - brak hardcoded secrets

✅ **4. Utworzono kompleksową dokumentację**
   - `docs/SUPABASE_SETUP_GUIDE.md` - przewodnik krok po kroku dla laika
   - Zaktualizowano `docs/MIGRATION_GUIDE.md`
   - Zaktualizowano wszystkie pliki dokumentacji (`.md`)

---

## 🚀 CO MUSISZ TERAZ ZROBIĆ

### FAZA 1: Supabase - Migracja Bazy Danych (5 minut)

#### Krok 1: Otwórz Supabase SQL Editor
1. Wejdź na https://supabase.com/dashboard
2. Otwórz swój projekt: `majster-ai-prod`
3. Kliknij **SQL Editor** (ikona z lewej strony)
4. Kliknij **"New query"**

#### Krok 2: Wykonaj skrypt migracji
1. Otwórz plik `CONSOLIDATED_MIGRATIONS.sql` z repozytorium
2. Skopiuj **całą zawartość** (Ctrl+A, Ctrl+C)
3. Wklej do SQL Editor (Ctrl+V)
4. Kliknij **"Run"** (lub Ctrl+Enter)
5. Poczekaj 5-10 sekund

**Oczekiwany rezultat:** "Success. No rows returned"

#### Krok 3: Weryfikuj tabele
1. Kliknij **Table Editor** (ikona z lewej strony)
2. Sprawdź czy widzisz tabele: `clients`, `projects`, `quotes`, `profiles`, etc.

**Checkpoint:** ✅ Masz ~30 tabel w Table Editor

---

### FAZA 2: Supabase - Konfiguracja Sekretów (10 minut)

#### Krok 4: Przejdź do Edge Functions → Secrets
1. W panelu Supabase kliknij **Edge Functions**
2. Kliknij zakładkę **"Secrets"**

#### Krok 5: Dodaj wymagane sekrety

Kliknij **"Add new secret"** i dodaj po kolei:

| Nazwa Sekretu | Gdzie znaleźć wartość |
|---------------|----------------------|
| `SUPABASE_URL` | Settings → API → Project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Settings → API → service_role key (⚠️ TAJNE!) |
| `RESEND_API_KEY` | Wejdź na [resend.com](https://resend.com) → API Keys → Create |
| `FRONTEND_URL` | URL Twojej app na Vercel (np. https://majster-ai-oferty-foom.vercel.app) |

**+ JEDEN z trzech AI providers (wybierz najlepszy dla Ciebie):**

**OPCJA A: OpenAI (rekomendowane, najlepsze AI)**
- Nazwa: `OPENAI_API_KEY`
- Wartość: `sk-...` (z https://platform.openai.com → API Keys)
- Koszt: ~$0.01-0.03 za zapytanie
- Musisz dodać środki na koncie

**OPCJA B: Google Gemini (DARMOWY!)**
- Nazwa: `GEMINI_API_KEY`
- Wartość: `AIza...` (z https://aistudio.google.com → Get API Key)
- Koszt: Darmowy do 15 req/min
- Najlepszy na start!

**OPCJA C: Anthropic Claude (droższe, ale bardzo dobre)**
- Nazwa: `ANTHROPIC_API_KEY`
- Wartość: `sk-ant-...` (z https://console.anthropic.com → API Keys)
- Koszt: ~$0.01-0.05 za zapytanie

**Checkpoint:** ✅ W zakładce Secrets widzisz 5 sekretów (lub 4 jeśli nie masz FRONTEND_URL)

---

### FAZA 3: Supabase - Deployment Edge Functions (15 minut)

#### Krok 6: Zainstaluj Supabase CLI

**Windows (PowerShell):**
```powershell
npm install -g supabase
```

**Mac:**
```bash
brew install supabase/tap/supabase
```

**Linux:**
```bash
npm install -g supabase
```

#### Krok 7: Zaloguj się i połącz z projektem

```bash
# Zaloguj się
supabase login

# Przejdź do katalogu projektu
cd C:\ścieżka\do\majster-ai-oferty

# Połącz z projektem (zastąp PROJECT_ID swoim ID)
supabase link --project-ref TWOJE_PROJECT_ID
```

Gdzie `TWOJE_PROJECT_ID` znajdziesz w Supabase → Settings → General → Reference ID

#### Krok 8: Deploy wszystkich funkcji

```bash
supabase functions deploy --no-verify-jwt
```

Poczekaj 2-3 minuty, aż wszystkie funkcje się wgrają.

**Checkpoint:** ✅ Widzisz 9 zielonych checkmarków (funkcje wdrożone)

---

### FAZA 4: Vercel - Konfiguracja Zmiennych Środowiskowych (5 minut)

#### Krok 9: Ustaw zmienne środowiskowe na Vercel

1. Wejdź na https://vercel.com
2. Otwórz projekt: `majster-ai-oferty-foom`
3. Kliknij **Settings** → **Environment Variables**

#### Krok 10: Dodaj zmienne dla Production, Preview, Development

| Name | Value | Gdzie znaleźć |
|------|-------|---------------|
| `VITE_SUPABASE_URL` | https://xxxxx.supabase.co | Supabase → Settings → API → Project URL |
| `VITE_SUPABASE_ANON_KEY` | eyJhbGci... | Supabase → Settings → API → anon public (⚠️ NIE service_role!) |

**⚠️ UWAGA:** Na Vercel używasz `VITE_SUPABASE_ANON_KEY` (klucz publiczny), NIE `service_role`!

**Checkpoint:** ✅ Masz 2 zmienne środowiskowe ustawione dla wszystkich środowisk

---

### FAZA 5: Vercel - Redeploy (3 minuty)

#### Krok 11: Uruchom ponownie deployment

1. Przejdź do **Deployments**
2. Kliknij **...** (trzy kropki) przy ostatnim deploymencie
3. Kliknij **Redeploy**
4. Poczekaj 2-3 minuty

#### Krok 12: Sprawdź czy działa!

1. Kliknij **Visit** po zakończeniu deploymentu
2. Powinieneś zobaczyć stronę logowania Majster.AI

**Checkpoint:** ✅ Aplikacja ładuje się bez błędów (nie ma białego ekranu)

---

### FAZA 6: Test Pełnego Flow (10 minut)

#### Krok 13: Zarejestruj konto i przetestuj

1. **Rejestracja:**
   - Kliknij "Zarejestruj się"
   - Wypełnij formularz
   - Sprawdź email (link aktywacyjny z Supabase)

2. **Pierwszy klient:**
   - Zaloguj się
   - Przejdź do "Klienci" → "Dodaj klienta"
   - Wypełnij dane (nazwa, email, telefon)
   - Zapisz

3. **Pierwszy projekt:**
   - Przejdź do "Projekty" → "Nowy projekt"
   - Wybierz klienta
   - Wpisz nazwę projektu
   - Zapisz

4. **Pierwsza wycena:**
   - Otwórz projekt
   - Kliknij "Utwórz wycenę"
   - Dodaj pozycje (materiały, robocizna)
   - Zapisz

5. **Test AI (opcjonalny):**
   - Kliknij ikonę chatu (AI Assistant)
   - Napisz: "Ile kosztuje malowanie pokoju 20m2?"
   - Sprawdź czy AI odpowiada

6. **Test PDF:**
   - W projekcie przejdź do zakładki "PDF"
   - Kliknij "Generuj PDF"
   - Sprawdź podgląd

7. **Test wysyłki email (jeśli masz RESEND_API_KEY):**
   - Kliknij "Wyślij ofertę"
   - Wpisz email testowy
   - Sprawdź czy email dotarł

**Checkpoint:** ✅ Wszystkie 7 testów przeszły pomyślnie

---

## 📊 KOMPLETNA CHECKLIST WERYFIKACJI

### ✅ Supabase Database
- [ ] W Table Editor widzę ~30 tabel (clients, projects, quotes, itp.)
- [ ] W Storage widzę 3 buckety (logos, project-photos, company-documents)

### ✅ Supabase Secrets
- [ ] SUPABASE_URL
- [ ] SUPABASE_SERVICE_ROLE_KEY
- [ ] RESEND_API_KEY
- [ ] OPENAI_API_KEY (lub ANTHROPIC_API_KEY lub GEMINI_API_KEY)
- [ ] FRONTEND_URL (opcjonalny)

### ✅ Supabase Edge Functions
- [ ] Funkcje są wdrożone (9 funkcji z zielonymi checkmarkami)
- [ ] W Logs nie ma czerwonych błędów

### ✅ Vercel Environment Variables
- [ ] VITE_SUPABASE_URL (Production, Preview, Development)
- [ ] VITE_SUPABASE_ANON_KEY (Production, Preview, Development)

### ✅ Vercel Build Settings
- [ ] Framework: Vite
- [ ] Build Command: npm run build
- [ ] Output Directory: dist
- [ ] Install Command: npm install

### ✅ Aplikacja działa
- [ ] Strona się ładuje (bez białego ekranu)
- [ ] Mogę się zarejestrować i zalogować
- [ ] Mogę dodać klienta
- [ ] Mogę utworzyć projekt
- [ ] Mogę dodać wycenę
- [ ] Mogę wygenerować PDF
- [ ] AI Chat odpowiada (jeśli skonfigurowano)
- [ ] Email wysyła się (jeśli skonfigurowano RESEND_API_KEY)

---

## 🎉 CO DALEJ?

Po zakończeniu wszystkich kroków:

1. **Przetestuj dokładnie** pełny flow z prawdziwymi danymi
2. **Skonfiguruj własną domenę** na Vercel (opcjonalne)
3. **Dodaj członków zespołu** w aplikacji (opcjonalne)
4. **Zaimportuj dane** z starego systemu (jeśli masz)
5. **Ustaw backup** bazy danych w Supabase (Settings → Database → Backups)

---

## 🆘 Problemy?

Jeśli coś nie działa:

1. **Sprawdź logi:**
   - Vercel: Deployments → Function Logs
   - Supabase: Edge Functions → Logs

2. **Przeczytaj szczegółowy przewodnik:**
   - `docs/SUPABASE_SETUP_GUIDE.md` - pełny przewodnik krok po kroku

3. **Typowe problemy:**
   - **Biały ekran:** Sprawdź zmienne środowiskowe na Vercel
   - **AI nie działa:** Sprawdź sekrety w Supabase Edge Functions
   - **Email nie wysyła:** Sprawdź RESEND_API_KEY
   - **Brak tabel:** Uruchom ponownie CONSOLIDATED_MIGRATIONS.sql

---

## 📞 Kontakt

Jeśli potrzebujesz pomocy:
- Sprawdź dokumentację: `docs/SUPABASE_SETUP_GUIDE.md`
- Utwórz issue na GitHub: https://github.com/RobertB1978/majster-ai-oferty/issues

---

## 📋 Mapa Zmiennych Środowiskowych

### Frontend (Vercel / .env)
```
VITE_SUPABASE_URL           → URL projektu Supabase
VITE_SUPABASE_ANON_KEY      → Klucz publiczny (anon)
```

### Backend (Supabase Edge Functions Secrets)
```
SUPABASE_URL                → URL projektu Supabase (auto-inject)
SUPABASE_SERVICE_ROLE_KEY   → Klucz prywatny (auto-inject)
RESEND_API_KEY              → Klucz do wysyłki emaili
FRONTEND_URL                → URL aplikacji frontend (dla linków w emailach)

# AI Provider (wybierz JEDEN)
OPENAI_API_KEY              → OpenAI (GPT-4)
ANTHROPIC_API_KEY           → Anthropic (Claude)
GEMINI_API_KEY              → Google (Gemini) - DARMOWY!
```

---

**Powodzenia! 🚀**

Claude Code
