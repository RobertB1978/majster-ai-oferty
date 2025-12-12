# Majster.AI - Checklist Zmiennych Środowiskowych

> **Cel:** Upewnić się, że wszystkie wymagane zmienne środowiskowe są poprawnie skonfigurowane przed wdrożeniem.

## 📋 Spis treści

1. [Frontend Environment Variables (Vercel)](#frontend-environment-variables-vercel)
2. [Backend Secrets (Supabase Edge Functions)](#backend-secrets-supabase-edge-functions)
3. [Opcjonalne zmienne](#opcjonalne-zmienne)
4. [Weryfikacja konfiguracji](#weryfikacja-konfiguracji)

---

## Frontend Environment Variables (Vercel)

### ✅ Wymagane (aplikacja nie zadziała bez nich)

Lokalizacja: **Vercel Dashboard → Settings → Environment Variables**

| Zmienna | Format | Przykład | Gdzie uzyskać |
|---------|--------|----------|---------------|
| `VITE_SUPABASE_URL` | https://[project-id].supabase.co | https://zpawgcecwqvypodzvlzy.supabase.co | Supabase → Settings → API → Project URL |
| `VITE_SUPABASE_ANON_KEY` | eyJhbGci... (JWT token) | eyJhbGciOiJIUzI1NiIsInR5cCI... | Supabase → Settings → API → anon/public key |

**Środowiska:** Production, Preview, Development (wszystkie trzy!)

**Weryfikacja:**
```bash
# Lokalnie (plik .env)
cat .env | grep VITE_SUPABASE

# Powinieneś zobaczyć:
# VITE_SUPABASE_URL=https://xxx.supabase.co
# VITE_SUPABASE_ANON_KEY=eyJhbGci...
```

### ⚠️ WAŻNE: Bezpieczeństwo

- ✅ **ZAWSZE używaj** `VITE_` prefix dla zmiennych w Vercel (są eksponowane do przeglądarki)
- ✅ **ZAWSZE używaj** `anon` key (publiczny klucz), **NIGDY** `service_role` key!
- ❌ **NIGDY nie commituj** pliku `.env` do gita (jest w `.gitignore`)

---

## Backend Secrets (Supabase Edge Functions)

### ✅ Wymagane podstawowe

Lokalizacja: **Supabase Dashboard → Edge Functions → Secrets**

| Sekret | Format | Przykład | Gdzie uzyskać | Wymagane dla |
|--------|--------|----------|---------------|--------------|
| `SUPABASE_URL` | https://[project-id].supabase.co | https://zpawgcecwqvypodzvlzy.supabase.co | Supabase → Settings → API → Project URL | Wszystkie funkcje |
| `SUPABASE_SERVICE_ROLE_KEY` | eyJhbGci... (JWT token) | eyJhbGciOiJIUzI1NiIsInR5cCI... | Supabase → Settings → API → **service_role** key | Wszystkie funkcje |
| `FRONTEND_URL` | https://twoja-domena.vercel.app | https://majster-ai-oferty.vercel.app | URL z Vercel po pierwszym wdrożeniu | CORS, emaile |

**⚠️ KRYTYCZNE:**
- `service_role` key to **ADMIN KEY** - ma pełny dostęp do bazy!
- **NIGDY** nie używaj go w frontendzie!
- Trzymaj go tylko w Supabase Secrets!

### ✅ Wymagane dla wysyłki emaili

| Sekret | Format | Przykład | Gdzie uzyskać | Funkcja |
|--------|--------|----------|---------------|---------|
| `RESEND_API_KEY` | re_... | re_AbC123... | https://resend.com/api-keys | `send-offer-email` |

**Bez tego:**
- ❌ Nie będzie działała wysyłka ofert emailem
- ✅ Reszta aplikacji zadziała normalnie

### ✅ Wymagane dla AI Features (wybierz JEDEN)

**OPCJA 1: OpenAI (najpopularniejszy)**

| Sekret | Format | Przykład | Gdzie uzyskać | Koszt |
|--------|--------|----------|---------------|-------|
| `OPENAI_API_KEY` | sk-... | sk-proj-AbC123... | https://platform.openai.com/api-keys | ~$0.01-0.03/zapytanie |

**Wspierane modele:**
- `gpt-4o` (domyślny, najnowszy)
- `gpt-4o-mini` (tańszy)
- `gpt-4-turbo`
- `gpt-3.5-turbo` (najtańszy)

---

**OPCJA 2: Anthropic Claude (najlepsze rozumowanie)**

| Sekret | Format | Przykład | Gdzie uzyskać | Koszt |
|--------|--------|----------|---------------|-------|
| `ANTHROPIC_API_KEY` | sk-ant-... | sk-ant-api03-AbC123... | https://console.anthropic.com/settings/keys | ~$0.01-0.05/zapytanie |

**Wspierane modele:**
- `claude-3-5-sonnet-20241022` (domyślny, rekomendowany)
- `claude-3-opus-20240229` (najlepszy)
- `claude-3-haiku-20240307` (najtańszy)

---

**OPCJA 3: Google Gemini (DARMOWY tier!)**

| Sekret | Format | Przykład | Gdzie uzyskać | Koszt |
|--------|--------|----------|---------------|-------|
| `GEMINI_API_KEY` lub `GOOGLE_AI_API_KEY` | AIza... | AIzaSyAbC123... | https://makersuite.google.com/app/apikey | DARMOWE 60 req/min! |

**Wspierane modele:**
- `gemini-2.5-flash` (domyślny, szybki, darmowy)
- `gemini-2.5-pro` (najlepszy)
- `gemini-1.5-pro` (stabilny)

💡 **Zalecenie dla początkujących:** Zacznij od Gemini (darmowy tier z hojnym limitem)!

---

**Automatyczne wykrywanie providera:**

System automatycznie wybierze pierwszego znalezionego providera w kolejności:
1. `OPENAI_API_KEY` → OpenAI
2. `ANTHROPIC_API_KEY` → Anthropic
3. `GEMINI_API_KEY` lub `GOOGLE_AI_API_KEY` → Google Gemini

**Bez AI provider:**
- ❌ Nie będą działać AI suggestions w ofercie
- ❌ Nie będzie działać analiza zdjęć
- ❌ Nie będzie działać OCR faktur
- ❌ Nie będzie działać AI chat agent
- ✅ Reszta aplikacji zadziała normalnie (ręczne tworzenie ofert)

---

## Opcjonalne zmienne

### 🔍 Sentry (Monitoring błędów)

Lokalizacja: **Vercel Dashboard → Settings → Environment Variables**

| Zmienna | Format | Gdzie uzyskać | Potrzebne dla |
|---------|--------|---------------|---------------|
| `VITE_SENTRY_DSN` | https://xxx@xxx.ingest.sentry.io/xxx | https://sentry.io → Settings → Projects → Keys | Error tracking |
| `VITE_SENTRY_ORG` | your-org-slug | https://sentry.io → Settings → General | Source maps |
| `VITE_SENTRY_PROJECT` | your-project-name | https://sentry.io → Settings → Projects | Source maps |
| `VITE_SENTRY_AUTH_TOKEN` | sntrys_... | https://sentry.io → Settings → Auth Tokens | Source maps upload |

**Środowiska:** Production (opcjonalnie Preview)

**Bez Sentry:**
- ✅ Aplikacja zadziała normalnie
- ❌ Nie będziesz widział błędów w production
- ❌ Trudniejsze debugowanie problemów użytkowników

---

## Weryfikacja konfiguracji

### ✅ Checklist przed wdrożeniem

#### Frontend (Vercel)

- [ ] `VITE_SUPABASE_URL` ustawione dla: Production, Preview, Development
- [ ] `VITE_SUPABASE_ANON_KEY` ustawione dla: Production, Preview, Development
- [ ] Klucze skopiowane bez spacji na początku/końcu
- [ ] Używasz `anon` key, NIE `service_role` key
- [ ] Opcjonalnie: Sentry zmienne (jeśli chcesz monitoring)

#### Backend (Supabase)

**Podstawowe:**
- [ ] `SUPABASE_URL` ustawione
- [ ] `SUPABASE_SERVICE_ROLE_KEY` ustawione (service_role, NIE anon!)
- [ ] `FRONTEND_URL` ustawione (URL z Vercel)

**Email:**
- [ ] `RESEND_API_KEY` ustawione (jeśli chcesz wysyłać oferty emailem)

**AI (wybierz jeden):**
- [ ] `OPENAI_API_KEY` ALBO
- [ ] `ANTHROPIC_API_KEY` ALBO
- [ ] `GEMINI_API_KEY` (lub `GOOGLE_AI_API_KEY`)

### 🧪 Test zmiennych lokalnie

```bash
# Sprawdź plik .env
cat .env

# Powinno pokazać:
# VITE_SUPABASE_URL=https://...
# VITE_SUPABASE_ANON_KEY=eyJ...

# Sprawdź czy aplikacja działa lokalnie
npm run dev

# Otwórz http://localhost:8080
# Sprawdź konsolę (F12) - nie powinno być błędów związanych z Supabase
```

### 🔍 Test zmiennych w Vercel

Po wdrożeniu:

```bash
# Otwórz aplikację w przeglądarce
# Otwórz konsolę (F12 → Console)

# Wpisz:
console.log(import.meta.env.VITE_SUPABASE_URL)
# Powinno wyświetlić: https://xxx.supabase.co

console.log(import.meta.env.VITE_SUPABASE_ANON_KEY?.substring(0, 20))
# Powinno wyświetlić: eyJhbGciOiJIUzI1NiIs...
```

### 🔍 Test sekretów Supabase

1. Supabase Dashboard → **Edge Functions**
2. Wybierz funkcję (np. `healthcheck`)
3. Kliknij **"Invoke"**
4. Jeśli działa → sekrety OK!
5. Jeśli błąd → sprawdź logi i sekrety

---

## 🆘 Częste problemy

### Problem: "Missing Supabase environment variables"

**Diagnoza:** Frontend nie ma dostępu do zmiennych Supabase.

**Rozwiązanie:**
1. Sprawdź Vercel → Settings → Environment Variables
2. Upewnij się że `VITE_SUPABASE_URL` i `VITE_SUPABASE_ANON_KEY` są ustawione
3. Upewnij się że są ustawione dla **wszystkich środowisk** (Production, Preview, Development)
4. Redeploy: Vercel → Deployments → ... → Redeploy

### Problem: "No AI provider API key configured"

**Diagnoza:** Edge Function nie ma klucza AI.

**Rozwiązanie:**
1. Supabase → Edge Functions → Secrets
2. Dodaj JEDEN z kluczy:
   - `OPENAI_API_KEY` lub
   - `ANTHROPIC_API_KEY` lub
   - `GEMINI_API_KEY`
3. Sprawdź czy wartość jest poprawna (bez spacji)
4. Poczekaj 1-2 minuty na propagację
5. Przetestuj ponownie

### Problem: Email sending fails

**Diagnoza:** Brak klucza Resend lub niepoprawny.

**Rozwiązanie:**
1. Supabase → Edge Functions → Secrets
2. Sprawdź czy `RESEND_API_KEY` istnieje
3. Sprawdź format: `re_...`
4. Wygeneruj nowy klucz: https://resend.com/api-keys
5. Zaktualizuj w Supabase Secrets

### Problem: Variables not updating

**Po zmianie zmiennych nie widzisz efektu?**

**Vercel:**
1. Zmiana zmiennych w Vercel **nie** redeploy automatycznie
2. Musisz ręcznie: Deployments → ... → Redeploy
3. Poczekaj 2-3 minuty na build

**Supabase:**
1. Zmiana sekretów w Supabase propaguje się ~1-2 minuty
2. Nie trzeba redeployować funkcji
3. Poczekaj chwilę i przetestuj ponownie

---

## 📚 Dodatkowe zasoby

- [.env.example](../.env.example) - Przykładowy plik z komentarzami
- [VERCEL_DEPLOYMENT_GUIDE.md](./VERCEL_DEPLOYMENT_GUIDE.md) - Kompletny przewodnik wdrożenia
- [AI_PROVIDERS_REFERENCE.md](./AI_PROVIDERS_REFERENCE.md) - Szczegóły konfiguracji AI
- [SUPABASE_SETUP_GUIDE.md](./SUPABASE_SETUP_GUIDE.md) - Setup Supabase

---

## ✅ Podsumowanie

### Minimalna konfiguracja (aplikacja zadziała podstawowo):

**Vercel:**
- `VITE_SUPABASE_URL` ✅
- `VITE_SUPABASE_ANON_KEY` ✅

**Supabase:**
- `SUPABASE_URL` ✅
- `SUPABASE_SERVICE_ROLE_KEY` ✅
- `FRONTEND_URL` ✅

### Pełna konfiguracja (wszystkie features):

**+ Email:**
- `RESEND_API_KEY` ✅

**+ AI:**
- `OPENAI_API_KEY` lub `ANTHROPIC_API_KEY` lub `GEMINI_API_KEY` ✅

**+ Monitoring:**
- `VITE_SENTRY_DSN` + `VITE_SENTRY_ORG` + `VITE_SENTRY_PROJECT` + `VITE_SENTRY_AUTH_TOKEN` ✅

**Gotowe! 🎉**
