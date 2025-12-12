# Majster.AI - Kompletny Przewodnik Wdrożenia na Vercel

> **Dla kogo?** Ten przewodnik jest dla osób nietechnicznych i zaawansowanych użytkowników, którzy chcą wdrożyć Majster.AI na Vercel.

## 📋 Spis treści

1. [Wymagania wstępne](#1-wymagania-wstępne)
2. [Przygotowanie projektu](#2-przygotowanie-projektu)
3. [Konfiguracja Supabase](#3-konfiguracja-supabase)
4. [Wdrożenie na Vercel](#4-wdrożenie-na-vercel)
5. [Konfiguracja zmiennych środowiskowych](#5-konfiguracja-zmiennych-środowiskowych)
6. [Weryfikacja wdrożenia](#6-weryfikacja-wdrożenia)
7. [Troubleshooting](#7-troubleshooting)

---

## 1. Wymagania wstępne

Przed rozpoczęciem upewnij się, że masz:

- ✅ Konto GitHub z repozytorium projektu
- ✅ Konto Vercel (za darmo na [vercel.com](https://vercel.com))
- ✅ Konto Supabase (za darmo na [supabase.com](https://supabase.com))
- ✅ Klucz API providera AI (OpenAI / Anthropic / Gemini)
- ✅ Klucz API Resend (za darmo na [resend.com](https://resend.com))

**Szacowany czas:** 45-60 minut (pierwsze wdrożenie)

---

## 2. Przygotowanie projektu

### Krok 2.1: Sprawdź lokalne środowisko

Upewnij się, że plik `.env` jest poprawnie skonfigurowany lokalnie:

```bash
# W katalogu projektu
cat .env
```

Powinien zawierać:
```env
VITE_SUPABASE_URL=https://twoj-projekt.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGci...
```

### Krok 2.2: Zweryfikuj build lokalnie

```bash
# Zainstaluj zależności
npm install

# Sprawdź czy projekt się buduje
npm run build

# Sprawdź czy nie ma błędów TypeScript
npm run type-check

# Sprawdź linting
npm run lint
```

✅ **Wszystko działa?** Przejdź dalej!
❌ **Są błędy?** Napraw je przed wdrożeniem.

---

## 3. Konfiguracja Supabase

### Krok 3.1: Utwórz projekt Supabase (jeśli jeszcze nie masz)

1. Idź na: https://supabase.com/dashboard
2. Kliknij **"New Project"**
3. Wypełnij:
   - **Name:** `majster-ai-production`
   - **Database Password:** Wygeneruj silne hasło i **zapisz je**
   - **Region:** `Europe West (London)` (najbliżej Polski)
4. Czekaj 2-3 minuty na utworzenie projektu

### Krok 3.2: Zapisz credentials z Supabase

Przejdź do **Settings → API** i zapisz:

```
Project URL: https://xxxxxxxxxxxxx.supabase.co
anon public key: eyJhbGci... (długi string)
service_role key: eyJhbGci... (INNY długi string - BARDZO POUFNY!)
Project ID: xxxxxxxxxxxxx
```

⚠️ **UWAGA:** `service_role` key to admin key - **nigdy nie commituj go do gita!**

### Krok 3.3: Uruchom migracje bazy danych

**Opcja A: Przez Supabase CLI (zalecane)**

```bash
# Zainstaluj Supabase CLI globalnie
npm install -g supabase

# Zaloguj się
supabase login

# Połącz z projektem
supabase link --project-ref xxxxxxxxxxxxx

# Uruchom wszystkie migracje
supabase db push
```

**Opcja B: Przez SQL Editor (prostsze dla nietechników)**

1. W panelu Supabase kliknij **SQL Editor**
2. Kliknij **"New query"**
3. Skopiuj zawartość plików z `supabase/migrations/` w kolejności (po dacie)
4. Wklej i uruchom każdą migrację po kolei
5. Sprawdź w **Table Editor** czy tabele się utworzyły

### Krok 3.4: Skonfiguruj sekrety dla Edge Functions

Przejdź do **Edge Functions → Secrets** i dodaj:

| Nazwa | Wartość | Opis |
|-------|---------|------|
| `SUPABASE_URL` | https://xxx.supabase.co | Twój Project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | eyJhbGci... | Klucz service_role |
| `RESEND_API_KEY` | re_... | Z https://resend.com/api-keys |
| `FRONTEND_URL` | https://twoja-domena.vercel.app | URL Twojej aplikacji (ustaw później) |

**Wybierz JEDEN provider AI:**

| Provider | Nazwa sekretu | Gdzie uzyskać |
|----------|---------------|----------------|
| OpenAI | `OPENAI_API_KEY` | https://platform.openai.com/api-keys |
| Anthropic | `ANTHROPIC_API_KEY` | https://console.anthropic.com/settings/keys |
| Google Gemini | `GEMINI_API_KEY` | https://makersuite.google.com/app/apikey |

💡 **Wskazówka:** Gemini ma darmowy tier z hojnym limitem!

### Krok 3.5: Wdróż Edge Functions

```bash
# Wdróż wszystkie funkcje
supabase functions deploy

# Lub pojedynczo
supabase functions deploy send-offer-email
supabase functions deploy ai-quote-suggestions
# ... itd
```

✅ **Sprawdź:** Edge Functions → Lista funkcji powinny być **zielone**

---

## 4. Wdrożenie na Vercel

### Krok 4.1: Połącz GitHub z Vercel

1. Idź na: https://vercel.com/login
2. Zaloguj się przez GitHub
3. Kliknij **"Add New..."** → **"Project"**
4. Znajdź swoje repozytorium: `RobertB1978/majster-ai-oferty`
5. Kliknij **"Import"**

### Krok 4.2: Skonfiguruj ustawienia projektu

Na stronie konfiguracji:

**Framework Preset:** `Vite` (powinno wykryć automatycznie)

**Build Command:**
```bash
npm run build
```

**Output Directory:**
```
dist
```

**Install Command:**
```bash
npm install --legacy-peer-deps
```

**Root Directory:**
```
./
```

### Krok 4.3: Skonfiguruj Environment Variables

⚠️ **KRYTYCZNE!** Bez tego aplikacja nie zadziała.

W sekcji **Environment Variables** dodaj:

| Nazwa | Wartość | Środowisko |
|-------|---------|------------|
| `VITE_SUPABASE_URL` | https://xxx.supabase.co | Production, Preview, Development |
| `VITE_SUPABASE_ANON_KEY` | eyJhbGci... (anon key) | Production, Preview, Development |

**Opcjonalne (dla Sentry monitoring):**

| Nazwa | Wartość | Środowisko |
|-------|---------|------------|
| `VITE_SENTRY_DSN` | https://xxx@xxx.ingest.sentry.io/xxx | Production |
| `VITE_SENTRY_ORG` | your-org | Production |
| `VITE_SENTRY_PROJECT` | your-project | Production |
| `VITE_SENTRY_AUTH_TOKEN` | sntrys_xxx | Production |

### Krok 4.4: Deploy!

1. Kliknij **"Deploy"**
2. Czekaj 2-3 minuty na build
3. Zobacz deployment log w czasie rzeczywistym

✅ **Sukces!** Zobaczysz **"Deployment Successful"**

---

## 5. Konfiguracja zmiennych środowiskowych

### Krok 5.1: Zapisz URL z Vercel

Po pierwszym wdrożeniu Vercel przypisze URL:
```
https://majster-ai-oferty-xxx.vercel.app
```

Lub jeśli masz domenę:
```
https://twoja-domena.pl
```

### Krok 5.2: Zaktualizuj FRONTEND_URL w Supabase

1. Wróć do Supabase Dashboard
2. **Edge Functions → Secrets**
3. Edytuj `FRONTEND_URL`
4. Ustaw na URL z Vercel: `https://majster-ai-oferty-xxx.vercel.app`
5. Zapisz

### Krok 5.3: Skonfiguruj domeny w Supabase Auth

1. Supabase Dashboard → **Authentication → URL Configuration**
2. **Site URL:** `https://majster-ai-oferty-xxx.vercel.app`
3. **Redirect URLs:** Dodaj:
   ```
   https://majster-ai-oferty-xxx.vercel.app/**
   https://majster-ai-oferty-xxx.vercel.app/auth/callback
   ```
4. Zapisz

---

## 6. Weryfikacja wdrożenia

### Krok 6.1: Podstawowa weryfikacja

✅ **Checklist:**

- [ ] Aplikacja otwiera się w przeglądarce
- [ ] Nie ma błędów w konsoli przeglądarki (F12)
- [ ] Strona główna się ładuje poprawnie
- [ ] CSS i style działają poprawnie

### Krok 6.2: Weryfikacja autentykacji

- [ ] Możesz kliknąć "Zaloguj się"
- [ ] Formularz logowania się wyświetla
- [ ] Możesz się zarejestrować (nowe konto)
- [ ] Otrzymujesz email weryfikacyjny (sprawdź spam!)
- [ ] Możesz się zalogować

### Krok 6.3: Weryfikacja funkcjonalności

Po zalogowaniu sprawdź:

- [ ] Dashboard się ładuje
- [ ] Możesz otworzyć "Nowa oferta"
- [ ] Możesz wypełnić formularz oferty
- [ ] AI suggestions działają (jeśli masz API key)
- [ ] Możesz zapisać ofertę
- [ ] Możesz wygenerować PDF
- [ ] Możesz wysłać ofertę emailem (jeśli masz Resend API key)

### Krok 6.4: Weryfikacja Edge Functions

Sprawdź logi funkcji:

1. Supabase Dashboard → **Edge Functions**
2. Kliknij na funkcję (np. `send-offer-email`)
3. Kliknij **"Logs"**
4. Sprawdź czy nie ma błędów

### Krok 6.5: Weryfikacja bazy danych

1. Supabase Dashboard → **Table Editor**
2. Otwórz tabelę `profiles` - powinien być Twój profil
3. Otwórz tabelę `quotes` - jeśli utworzyłeś ofertę, powinna być tutaj

---

## 7. Troubleshooting

### Problem: Aplikacja nie ładuje się, biały ekran

**Diagnoza:**
```
Otwórz konsolę przeglądarki (F12 → Console)
Szukaj błędów związanych z Supabase
```

**Rozwiązania:**

1. Sprawdź czy `VITE_SUPABASE_URL` i `VITE_SUPABASE_ANON_KEY` są ustawione w Vercel
2. Sprawdź czy wartości są poprawne (bez spacji, pełne)
3. Redeploy projektu: Vercel Dashboard → **Deployments → ... → Redeploy**

### Problem: Nie mogę się zalogować

**Możliwe przyczyny:**

1. **Email verification nie działa:**
   - Sprawdź folder spam
   - Supabase Dashboard → **Authentication → Email Templates**
   - Sprawdź czy Supabase może wysyłać emaile (domyślnie TAK)

2. **Redirect URL niepoprawny:**
   - Supabase → **Authentication → URL Configuration**
   - Sprawdź czy Site URL i Redirect URLs zawierają Twój Vercel URL

### Problem: AI suggestions nie działają

**Diagnoza:**

1. Sprawdź Supabase Logs: **Edge Functions → ai-quote-suggestions → Logs**
2. Szukaj błędu typu:
   ```
   Error: No AI provider API key configured
   ```

**Rozwiązanie:**

1. Upewnij się że ustawiłeś JEDEN z kluczy:
   - `OPENAI_API_KEY` lub
   - `ANTHROPIC_API_KEY` lub
   - `GEMINI_API_KEY`
2. Sprawdź czy klucz jest poprawny (skopiuj ponownie)
3. Redeploy funkcji: `supabase functions deploy ai-quote-suggestions`

### Problem: Nie mogę wysłać oferty emailem

**Diagnoza:**

Sprawdź logs: **Edge Functions → send-offer-email → Logs**

**Możliwe błędy:**

1. **Brak RESEND_API_KEY:**
   - Uzyskaj klucz z https://resend.com/api-keys
   - Dodaj w Supabase → Edge Functions → Secrets

2. **Niepoprawny email nadawcy:**
   - Resend wymaga zweryfikowanej domeny lub użyj testowej
   - Testowy email: `onboarding@resend.dev`

### Problem: Build nie przechodzi na Vercel

**Diagnoza:**

Sprawdź Vercel Build Logs:

```
Vercel Dashboard → Deployments → [Failed deployment] → View Logs
```

**Częste błędy:**

1. **TypeScript errors:**
   ```bash
   # Lokalnie uruchom
   npm run type-check
   # Napraw błędy
   ```

2. **Linting errors:**
   ```bash
   npm run lint
   npm run lint:fix
   ```

3. **Out of memory:**
   - Vercel Free tier ma limit pamięci
   - Zoptymalizuj build lub przejdź na Pro plan

### Problem: Bardzo wolne ładowanie

**Możliwe przyczyny:**

1. **Brak optymalizacji obrazków:**
   - Skompresuj obrazki przed uploadem
   - Użyj formatu WebP

2. **Za duży bundle size:**
   ```bash
   # Sprawdź rozmiar buildu
   npm run build
   # Sprawdź wyjście - powinno być < 5MB
   ```

3. **Supabase daleko od użytkowników:**
   - Wybierz region bliżej użytkowników
   - Dla Polski: London lub Frankfurt

---

## 🎯 Następne kroki

Po pomyślnym wdrożeniu:

1. ✅ **Skonfiguruj domenę własną:**
   - Vercel Dashboard → **Settings → Domains**
   - Dodaj swoją domenę
   - Skonfiguruj DNS

2. ✅ **Włącz monitoring:**
   - Sentry dla błędów aplikacji
   - Vercel Analytics dla metryk
   - Supabase Monitoring dla bazy danych

3. ✅ **Zabezpiecz produkcję:**
   - Włącz 2FA na Vercel
   - Włącz 2FA na Supabase
   - Regularnie rotuj API keys

4. ✅ **Ustaw backupy:**
   - Supabase ma automatyczne backupy
   - Rozważ dodatkowe backupy dla krytycznych danych

5. ✅ **Przygotuj proces CI/CD:**
   - GitHub Actions automatycznie buduje na PR
   - Automatyczne deploymenty z main brancha

---

## 📚 Dodatkowe zasoby

- [Dokumentacja Vercel](https://vercel.com/docs)
- [Dokumentacja Supabase](https://supabase.com/docs)
- [SUPABASE_SETUP_GUIDE.md](./SUPABASE_SETUP_GUIDE.md)
- [MIGRATION_GUIDE.md](./MIGRATION_GUIDE.md)
- [AI_PROVIDERS_REFERENCE.md](./AI_PROVIDERS_REFERENCE.md)

---

## 🆘 Potrzebujesz pomocy?

1. Sprawdź [GitHub Issues](https://github.com/RobertB1978/majster-ai-oferty/issues)
2. Dokumentacja projektu w `/docs`
3. Supabase Support: https://supabase.com/support
4. Vercel Support: https://vercel.com/support

**Gratulacje! 🎉 Twoja aplikacja Majster.AI jest teraz live!**
