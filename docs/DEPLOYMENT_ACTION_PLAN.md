# Plan wdrożenia na produkcję — Instrukcja dla Roberta

**Data:** 2026-03-07
**Status:** Wymaga konfiguracji 3 paneli (GitHub, Supabase, Vercel)

---

## Diagnoza — dlaczego zmiany NIE są widoczne

Wszystkie 20 PRów z Roadmapy są w kodzie (branch `main`). Problem leży w konfiguracji:

| Warstwa | Problem | Priorytet |
|---|---|---|
| **Vercel** | Brak kroku deploy w GitHub Actions — frontend nie był wdrażany automatycznie | 🔴 KRYTYCZNY |
| **Supabase** | Workflow wymaga 4 sekretów GitHub — jeśli nie są ustawione, baza i funkcje nie były aktualizowane | 🔴 KRYTYCZNY |
| **GitHub Actions** | Wymaga secrets od Supabase i Vercel | 🟡 WYMAGANE |

---

## Co należy zrobić — krok po kroku

### KROK 1: GitHub Secrets (7 sekretów)

Idź na: **https://github.com/RobertB1978/majster-ai-oferty/settings/secrets/actions**

Dodaj te sekrety (kliknij "New repository secret"):

#### Supabase secrets (4 szt):

| Nazwa sekretu | Skąd wziąć |
|---|---|
| `SUPABASE_ACCESS_TOKEN` | https://supabase.com/dashboard/account/tokens → "Generate new token" |
| `SUPABASE_PROJECT_REF` | Panel Supabase → Twój projekt → Settings → General → "Reference ID" (np. `xwxvxxxxxxxx`) |
| `SUPABASE_DB_PASSWORD` | Panel Supabase → Settings → Database → "Database Password" (ten który ustawiłeś przy tworzeniu) |
| `SUPABASE_ANON_KEY` | Panel Supabase → Settings → API → "anon public" key |

#### Vercel secrets (3 szt):

| Nazwa sekretu | Skąd wziąć |
|---|---|
| `VERCEL_TOKEN` | https://vercel.com/account/tokens → "Create Token" (nazwij np. "majster-github-deploy") |
| `VERCEL_ORG_ID` | Panel Vercel → Twój projekt → Settings → General → "Team ID" (lub "Personal Account ID") |
| `VERCEL_PROJECT_ID` | Panel Vercel → Twój projekt → Settings → General → "Project ID" |

---

### KROK 2: Vercel — zmienne środowiskowe frontendu

Idź na: **Panel Vercel → Twój projekt → Settings → Environment Variables**

Dodaj (jeśli jeszcze nie ma):

| Nazwa zmiennej | Wartość |
|---|---|
| `VITE_SUPABASE_URL` | https://[twój-ref].supabase.co |
| `VITE_SUPABASE_ANON_KEY` | klucz anon z panelu Supabase (ten sam co SUPABASE_ANON_KEY) |

Opcjonalne (dla pełnych funkcji):

| Nazwa zmiennej | Wartość |
|---|---|
| `VITE_STRIPE_ENABLED` | `true` (jeśli chcesz Stripe Billing) |
| `VITE_SENTRY_DSN` | DSN z dashboardu Sentry (jeśli używasz) |

---

### KROK 3: Supabase — sekrety Edge Functions

Idź na: **Panel Supabase → Edge Functions → Secrets**

Dodaj:

| Nazwa | Wartość |
|---|---|
| `RESEND_API_KEY` | Klucz z https://resend.com (do wysyłki emaili) |
| `FRONTEND_URL` | URL aplikacji na Vercel, np. `https://majster-ai.vercel.app` |
| `OPENAI_API_KEY` lub `ANTHROPIC_API_KEY` | Klucz AI do generowania ofert |
| `STRIPE_SECRET_KEY` | Klucz Stripe (tylko jeśli włączasz billing) |
| `STRIPE_WEBHOOK_SECRET` | Secret webhooka Stripe (z panelu Stripe → Webhooks) |

---

### KROK 4: Uruchomienie deployu

Po ustawieniu wszystkich sekretów, deploy uruchomi się automatycznie przy następnym pushu do `main`.

Możesz też uruchomić manualnie:
1. Idź na: https://github.com/RobertB1978/majster-ai-oferty/actions
2. Wybierz workflow "Deployment Truth Gate"
3. Kliknij "Run workflow" → wybierz branch `main` → "Run workflow"

---

## Co się stanie po konfiguracji

Po ustawieniu sekretów i pushu do `main`:

1. **GitHub Actions uruchomi** workflow `Deployment Truth Gate`
2. **Supabase** — zastosuje wszystkie migracje bazy danych (PR-01 do PR-20) i wdroży Edge Functions
3. **Vercel** — zbuduje i wdroży nową wersję frontendu z wszystkimi nowymi funkcjami
4. **W aplikacji pojawią się** wszystkie 20 nowych funkcji:
   - Nowa nawigacja dolna (FF_NEW_SHELL)
   - Oferty z PDF i wysyłką emailem
   - Projekty z QR kodami
   - Teczka dokumentów
   - Wzory umów i protokołów
   - Gwarancje i przeglądy
   - Stripe Billing (płatności)
   - PWA offline mode
   - i wiele więcej

---

## Monitoring

Po deployu sprawdź:

1. **GitHub Actions logs**: https://github.com/RobertB1978/majster-ai-oferty/actions
   - Szukaj `SUPABASE_DEPLOY: PASS` i `VERCEL_DEPLOY: PASS`

2. **Vercel deployment**: Panel Vercel → Deployments → sprawdź ostatni deployment

3. **Supabase migrations**: Panel Supabase → Database → Migrations → sprawdź że wszystkie są "applied"

4. **Aplikacja**: Otwórz URL aplikacji i sprawdź czy widzisz nowe funkcje

---

## Pomoc

Jeśli masz problemy z konfiguracją, napisz do Claude Code z:
- Screenshotem błędu z GitHub Actions
- Informacją który sekret sprawia problem
