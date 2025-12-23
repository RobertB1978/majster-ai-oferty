# Monitoring, Security & Optimization Setup

> **Status:** ✅ Wdrożone (Sprint 5 - Production Hardening)
> **Data:** 2024-12-10
> **Branch:** `claude/add-monitoring-security-optimization-01FRp2nHRxmjoUNP255G3NJ8`

## 📋 Spis Treści

1. [Integracja Sentry](#1-integracja-sentry)
2. [Uptime Monitoring (Healthcheck)](#2-uptime-monitoring-healthcheck)
3. [Cron Job - Czyszczenie Danych](#3-cron-job---czyszczenie-danych)
4. [Content Security Policy (CSP)](#4-content-security-policy-csp)
5. [Code Splitting & Optymalizacja](#5-code-splitting--optymalizacja)
6. [Konfiguracja Środowiska](#6-konfiguracja-środowiska)
7. [Testowanie](#7-testowanie)

---

## 1. Integracja Sentry

### 🎯 Cel
Monitoring błędów i wydajności aplikacji w czasie rzeczywistym.

### 📦 Komponenty
- **Frontend:** `src/lib/sentry.ts` + inicjalizacja w `src/main.tsx`
- **Edge Functions:** `supabase/functions/_shared/sentry.ts`
- **Build:** Plugin Sentry w `vite.config.ts`

### 🔧 Konfiguracja

#### Zmienne środowiskowe (.env)
```env
# Frontend Sentry
VITE_SENTRY_DSN=https://your-dsn@sentry.io/project-id
VITE_SENTRY_ORG=your-org-name
VITE_SENTRY_PROJECT=your-project-name
VITE_SENTRY_AUTH_TOKEN=your-auth-token  # Tylko dla buildu produkcyjnego

# Edge Functions Sentry (Supabase Secrets)
# supabase secrets set SENTRY_DSN=https://your-dsn@sentry.io/project-id
# supabase secrets set SENTRY_ENVIRONMENT=production
```

#### Supabase Secrets (dla Edge Functions)
```bash
supabase secrets set SENTRY_DSN="https://your-dsn@sentry.io/project-id"
supabase secrets set SENTRY_ENVIRONMENT="production"
```

### ✨ Funkcje

#### Frontend:
- **Error tracking** - automatyczne wychwytywanie błędów
- **Performance monitoring** - 10% sample rate w produkcji
- **Session Replay** - nagrywanie sesji z błędami
- **Breadcrumbs** - historia akcji użytkownika przed błędem
- **Filtrowanie wrażliwych danych** - automatyczne usuwanie emaili, tokenów, etc.

#### Edge Functions:
- **Error tracking** - logowanie błędów z Edge Functions
- **Custom events** - logowanie ważnych wydarzeń
- **Context tracking** - informacje o funkcji, użytkowniku, request
- **Wrapper** - `withSentryErrorTracking()` dla automatycznego trackingu

#### Przykład użycia w Edge Function:
```typescript
import { logErrorToSentry, withSentryErrorTracking } from "../_shared/sentry.ts";

// Sposób 1: Wrapper (zalecane)
serve(withSentryErrorTracking('my-function', async (req) => {
  // Twój kod
}));

// Sposób 2: Manualny
try {
  // Twój kod
} catch (error) {
  await logErrorToSentry(error, {
    functionName: 'my-function',
    userId: 'user-id',
    tags: { custom: 'tag' },
    extra: { additional: 'data' },
  });
  throw error;
}
```

### 🚀 Deployment
1. Utwórz projekt w Sentry (https://sentry.io)
2. Skopiuj DSN z ustawień projektu
3. Dodaj zmienne środowiskowe do `.env` (dla dev)
4. Dodaj secrets do Supabase (dla Edge Functions)
5. W CI/CD dodaj `VITE_SENTRY_AUTH_TOKEN` dla uploadowania source maps

---

## 2. Uptime Monitoring (Healthcheck)

### 🎯 Cel
Monitoring dostępności i statusu systemu dla zewnętrznych narzędzi uptime monitoring.

### 📦 Komponenty
- **Edge Function:** `supabase/functions/healthcheck/index.ts`

### 🔧 Endpoint
```
GET https://xwvxqhhnozfrjcjmcltv.supabase.co/functions/v1/healthcheck
```

### 📊 Response Format
```json
{
  "status": "healthy",
  "timestamp": "2024-12-10T12:00:00.000Z",
  "version": "1.0.0",
  "checks": {
    "database": {
      "status": "pass",
      "responseTime": 45
    },
    "storage": {
      "status": "pass",
      "responseTime": 23
    },
    "auth": {
      "status": "pass",
      "responseTime": 12
    }
  },
  "uptime": 80
}
```

### 📈 Status Codes
- `200` - Healthy / Degraded (częściowe problemy)
- `503` - Unhealthy (poważne problemy)

### 🔍 Checked Components
1. **Database** - sprawdzenie połączenia z PostgreSQL
2. **Storage** - sprawdzenie Supabase Storage
3. **Auth** - sprawdzenie Supabase Auth

### 🛠️ Konfiguracja Uptime Monitor

#### UptimeRobot (Zalecane - darmowe)
1. Dodaj nowy monitor (HTTP(s))
2. URL: `https://xwvxqhhnozfrjcjmcltv.supabase.co/functions/v1/healthcheck`
3. Interval: 5 minut
4. Alert Contacts: Twój email/Slack

#### Better Uptime
1. Utwórz nowy monitor
2. URL: endpoint healthcheck
3. Frequency: 1-5 minut
4. Expected status: 200
5. Notification channels: Email/Slack/SMS

#### Pingdom
Podobnie jak powyżej.

---

## 3. Cron Job - Czyszczenie Danych

### 🎯 Cel
Automatyczne czyszczenie wygasłych tokenów i nieaktywnych danych.

### 📦 Komponenty
- **Edge Function:** `supabase/functions/cleanup-expired-data/index.ts`

### 🧹 Czyszczone Dane

1. **API Keys** - nieaktywne klucze starsze niż 90 dni bez użycia
2. **Offer Approvals** - zatwierdzone/odrzucone oferty starsze niż 90 dni
3. **Push Tokens** - nieaktywne tokeny starsze niż 180 dni
4. **AI Chat History** - historia czatu starsza niż 180 dni

### 🔧 Konfiguracja

#### Supabase Secret (autoryzacja)
```bash
supabase secrets set CRON_SECRET="your-random-secret-key-here"
```

#### Endpoint
```
POST https://xwvxqhhnozfrjcjmcltv.supabase.co/functions/v1/cleanup-expired-data
Authorization: Bearer your-cron-secret-key
```

### ⏰ Konfiguracja Cron Job

#### GitHub Actions (Zalecane)
Utwórz plik `.github/workflows/cleanup-cron.yml`:
```yaml
name: Cleanup Expired Data

on:
  schedule:
    # Uruchom codziennie o 2:00 AM UTC
    - cron: '0 2 * * *'
  workflow_dispatch:  # Możliwość manualnego uruchomienia

jobs:
  cleanup:
    runs-on: ubuntu-latest
    steps:
      - name: Run cleanup
        run: |
          curl -X POST \
            -H "Authorization: Bearer ${{ secrets.CRON_SECRET }}" \
            https://xwvxqhhnozfrjcjmcltv.supabase.co/functions/v1/cleanup-expired-data
```

Dodaj secret `CRON_SECRET` w GitHub repo settings.

#### Zewnętrzny Cron Service (np. cron-job.org)
1. Utwórz darmowe konto na cron-job.org
2. Dodaj nowy job:
   - URL: `https://xwvxqhhnozfrjcjmcltv.supabase.co/functions/v1/cleanup-expired-data`
   - Method: POST
   - Header: `Authorization: Bearer your-cron-secret-key`
   - Schedule: Codziennie o 2:00 AM
3. Zapisz job

### 📊 Response Format
```json
{
  "success": true,
  "timestamp": "2024-12-10T02:00:00.000Z",
  "cleaned": {
    "apiKeys": 5,
    "offerApprovals": 12,
    "pushTokens": 3,
    "chatHistory": 234
  }
}
```

---

## 4. Content Security Policy (CSP)

### 🎯 Cel
Ochrona przed atakami XSS, clickjacking i innymi zagrożeniami.

### 📦 Komponenty
- **HTML:** CSP meta tag w `index.html`
- **Reporting:** `supabase/functions/csp-report/index.ts`

### 🔒 Policy (Report-Only Mode)

CSP jest włączone w trybie **report-only** - nie blokuje zasobów, tylko raportuje naruszenia.

```
default-src 'self';
script-src 'self' 'unsafe-inline' 'unsafe-eval' https://esm.sh https://cdn.jsdelivr.net;
style-src 'self' 'unsafe-inline';
img-src 'self' data: https: blob:;
font-src 'self' data:;
connect-src 'self' https://*.supabase.co https://sentry.io https://*.sentry.io wss://*.supabase.co;
media-src 'self' blob:;
object-src 'none';
base-uri 'self';
form-action 'self';
frame-ancestors 'none';
upgrade-insecure-requests;
report-uri https://xwvxqhhnozfrjcjmcltv.supabase.co/functions/v1/csp-report;
```

### 📊 Monitoring Naruszeń

Raporty są wysyłane do:
1. **Edge Function** - `csp-report` loguje naruszenia
2. **Sentry** - naruszenia są logowane jako warnings (jeśli skonfigurowane)
3. **Console** - w development mode

### 🚀 Przejście do Enforcement Mode

Po przetestowaniu i upewnieniu się, że wszystko działa:

1. **Przejrzyj raporty** - sprawdź co jest blokowane (Sentry lub logi)
2. **Zaktualizuj policy** - dostosuj CSP do potrzeb aplikacji
3. **Zmień meta tag** w `index.html`:
   ```html
   <!-- Zmień z: -->
   <meta http-equiv="Content-Security-Policy-Report-Only" ... />

   <!-- Na: -->
   <meta http-equiv="Content-Security-Policy" ... />
   ```

⚠️ **Uwaga:** Enforcement mode będzie **blokował** zasoby naruszające policy!

---

## 5. Code Splitting & Optymalizacja

### 🎯 Cel
Zmniejszenie rozmiaru bundle'a i przyspieszenie ładowania aplikacji.

### 📦 Komponenty
- **Konfiguracja:** `vite.config.ts` - sekcja `build.rollupOptions.output.manualChunks`

### 📊 Vendor Chunks

Największe biblioteki są podzielone na osobne chunki:

1. **react-vendor** - React, React DOM, React Router (~140 KB)
2. **ui-vendor** - Radix UI komponenty (~80 KB)
3. **supabase-vendor** - Supabase client (~60 KB)
4. **form-vendor** - React Hook Form, Zod (~40 KB)
5. **charts-vendor** - Recharts (~50 KB)

### ✨ Korzyści
- ⚡ **Szybsze ładowanie** - równoległe pobieranie chunków
- 💾 **Lepsze cache'owanie** - vendor chunki rzadko się zmieniają
- 📦 **Mniejszy bundle** - tylko potrzebne chunki są ładowane

### 📈 Analiza Bundle Size

```bash
# Build produkcyjny
npm run build

# Sprawdź rozmiary chunków
ls -lh dist/assets/
```

Przykładowe rozmiary (po gzip):
- `index-*.js` - ~50-80 KB (kod aplikacji)
- `react-vendor-*.js` - ~45 KB
- `ui-vendor-*.js` - ~25 KB
- `supabase-vendor-*.js` - ~20 KB
- `form-vendor-*.js` - ~15 KB
- `charts-vendor-*.js` - ~18 KB

### 🔮 Dalsze Optymalizacje

W przyszłości można dodać:
- **Route-based code splitting** - lazy loading stron
- **Component-based splitting** - lazy loading dużych komponentów
- **Tree shaking** - usuwanie nieużywanego kodu
- **Image optimization** - kompresja obrazków

---

## 6. Konfiguracja Środowiska

### Frontend (.env)
```env
# Supabase (required)
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key

# Sentry (optional - dla error trackingu)
VITE_SENTRY_DSN=https://your-dsn@sentry.io/project-id
VITE_SENTRY_ORG=your-org-name              # Tylko dla buildu
VITE_SENTRY_PROJECT=your-project-name      # Tylko dla buildu
VITE_SENTRY_AUTH_TOKEN=your-auth-token     # Tylko dla buildu
```

### Edge Functions (Supabase Secrets)
```bash
# Sentry
supabase secrets set SENTRY_DSN="https://your-dsn@sentry.io/project-id"
supabase secrets set SENTRY_ENVIRONMENT="production"

# Cron Job
supabase secrets set CRON_SECRET="your-random-secret-key"
```

### Weryfikacja Secrets
```bash
supabase secrets list
```

---

## 7. Testowanie

### Frontend Build Test
```bash
# Development build
npm run dev

# Production build
npm run build

# Preview production build
npm run preview
```

### Edge Functions Test

#### Healthcheck
```bash
curl https://xwvxqhhnozfrjcjmcltv.supabase.co/functions/v1/healthcheck
```

Expected: Status 200, JSON z "status": "healthy"

#### CSP Report (manual test)
```bash
curl -X POST \
  -H "Content-Type: application/json" \
  -d '{"csp-report":{"violated-directive":"script-src","blocked-uri":"https://evil.com/script.js","document-uri":"https://yourapp.com/"}}' \
  https://xwvxqhhnozfrjcjmcltv.supabase.co/functions/v1/csp-report
```

Expected: Status 204 No Content

#### Cleanup Job (manual test)
```bash
curl -X POST \
  -H "Authorization: Bearer your-cron-secret-key" \
  https://xwvxqhhnozfrjcjmcltv.supabase.co/functions/v1/cleanup-expired-data
```

Expected: Status 200, JSON z podsumowaniem czyszczenia

---

## 📝 Checklist Wdrożenia

### Sentry
- [ ] Utworzono projekt w Sentry
- [ ] Dodano `VITE_SENTRY_DSN` do `.env`
- [ ] Dodano `SENTRY_DSN` do Supabase secrets
- [ ] Zweryfikowano działanie w dev mode
- [ ] Przetestowano wysyłanie błędów
- [ ] Skonfigurowano alerty w Sentry

### Uptime Monitoring
- [ ] Przetestowano endpoint `/healthcheck`
- [ ] Dodano monitor w UptimeRobot/Better Uptime
- [ ] Skonfigurowano alerty (email/Slack)
- [ ] Zweryfikowano działanie alertów

### Cleanup Job
- [ ] Dodano `CRON_SECRET` do Supabase secrets
- [ ] Skonfigurowano GitHub Actions / cron-job.org
- [ ] Przetestowano manualnie endpoint
- [ ] Zweryfikowano logi pierwszego uruchomienia

### CSP
- [ ] Przetestowano aplikację z CSP report-only
- [ ] Przejrzano raporty naruszeń w Sentry/logach
- [ ] Dostosowano policy jeśli potrzebne
- [ ] Zaplanowano przejście do enforcement mode (po testach)

### Optymalizacja
- [ ] Sprawdzono rozmiary chunków (`npm run build`)
- [ ] Zweryfikowano poprawne ładowanie aplikacji
- [ ] Przetestowano cache'owanie w przeglądarce

---

## 🚨 Troubleshooting

### Sentry nie wysyła eventów
1. Sprawdź `VITE_SENTRY_DSN` w `.env`
2. Sprawdź console - powinno być "✅ Sentry zainicjalizowane"
3. Wymuś błąd: `throw new Error('Test Sentry')`
4. Sprawdź zakładkę Network - czy jest request do Sentry

### Healthcheck zwraca 503
1. Sprawdź logi Edge Function: `supabase functions logs healthcheck`
2. Sprawdź status Supabase w dashboard
3. Zweryfikuj RLS policies - czy nie blokują dostępu

### Cleanup Job nie działa
1. Sprawdź secret: `supabase secrets list`
2. Sprawdź authorization header w requescie
3. Sprawdź logi: `supabase functions logs cleanup-expired-data`

### CSP blokuje zasoby (po enforcement)
1. Przejrzyj raporty - które zasoby są blokowane
2. Dodaj dozwolone domeny do CSP policy
3. Przetestuj ponownie w report-only mode

---

## 📚 Dokumentacja

- [Sentry Docs](https://docs.sentry.io/)
- [Content Security Policy](https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP)
- [Vite Code Splitting](https://vitejs.dev/guide/build.html#chunking-strategy)
- [Supabase Edge Functions](https://supabase.com/docs/guides/functions)

---

**Autor:** Claude AI
**Data:** 2024-12-10
**Wersja:** 1.0
