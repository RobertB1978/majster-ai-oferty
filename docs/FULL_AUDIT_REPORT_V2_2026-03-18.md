# PEŁNY AUDYT APLIKACJI MAJSTER.AI — WERSJA 2 (ROZSZERZONA)

**Data audytu:** 18 marca 2026
**Wersja aplikacji:** 0.1.0-alpha
**Audytor:** Claude Code (Opus 4.6)
**Agentów audytowych:** 17 (7 runda 1 + 10 runda 2)
**Dokumentów planistycznych znalezionych:** 13+

---

## SPIS TREŚCI

1. [Podsumowanie wykonawcze](#1-podsumowanie-wykonawcze)
2. [Porównanie z ROADMAPAMI — status realizacji](#2-porównanie-z-roadmapami)
3. [Audyt kodu i architektury](#3-audyt-kodu-i-architektury)
4. [Audyt wydajności (Core Web Vitals)](#4-audyt-wydajności)
5. [Audyt UX/UI](#5-audyt-uxui)
6. [Audyt przepływu danych i API](#6-audyt-przepływu-danych)
7. [Audyt bezpieczeństwa](#7-audyt-bezpieczeństwa)
8. [Audyt testów i CI/CD](#8-audyt-testów-i-cicd)
9. [Audyt i18n (wielojęzyczność)](#9-audyt-i18n)
10. [Audyt Supabase (backend)](#10-audyt-supabase)
11. [Audyt Vercel (deployment)](#11-audyt-vercel)
12. [Audyt panelu admina](#12-audyt-panelu-admina)
13. [Audyt billing/Stripe](#13-audyt-billingstripe)
14. [Audyt SEO, polityk prawnych, tekstów, grafik](#14-audyt-seo-polityk-tekstów-grafik)
15. [Audyt głęboki — dead code, TODO, XSS](#15-audyt-głęboki)
16. [Analiza biznesowa i rynkowa](#16-analiza-biznesowa)
17. [Analiza SWOT](#17-analiza-swot)
18. [Samodzielnie wykryte braki (plan własny)](#18-samodzielnie-wykryte-braki)
19. [Plan rozwoju — pełna mapa drogowa](#19-plan-rozwoju)
20. [Podsumowanie ocen końcowych](#20-podsumowanie-ocen)

---

## 1. PODSUMOWANIE WYKONAWCZE

### Ogólna ocena: 7.8/10 (skorygowana z 8.2 po pogłębionym audycie)

Korekta wynika z odkrycia nowych problemów w pogłębionym audycie:
- 30 hooków używa `select('*')` (krytyczne dla wydajności)
- Formatowanie dat/walut zahardkodowane na `pl-PL` (20+ plików)
- Brak pre-commit hooks (Husky niezainstalowany)
- Panel admina: ~10 niezaimplementowanych funkcji (mock data)
- Brak globalnego wyszukiwania, brak Cmd+K
- Analytics.tsx ładuje Recharts bezpośrednio (420 KB w main bundle)

| Obszar | Ocena v1 | Ocena v2 | Zmiana |
|--------|----------|----------|--------|
| Kod i architektura | 9/10 | 8.5/10 | ↓ select('*'), duże komponenty |
| Supabase backend | 9/10 | 9/10 | = |
| Vercel deployment | 8.8/10 | 8.8/10 | = |
| Bezpieczeństwo | 8/10 | 7.5/10 | ↓ innerHTML w PdfGenerator |
| SEO | 7/10 | 7/10 | = |
| UX/UI | — | 7.5/10 | NOWE |
| Wydajność | — | 5.5/10 | NOWE — krytyczne problemy |
| Testy i CI/CD | 7.5/10 | 7/10 | ↓ brak Husky, shallow hook tests |
| i18n | 8.5/10 | 6/10 | ↓↓ zahardkodowane pl-PL formatting |
| Billing/Stripe | — | 8/10 | NOWE |
| Panel admina | — | 5.5/10 | NOWE — dużo mock data |
| Data flow/API | — | 8.5/10 | NOWE |
| Biznes i rynek | 8.5/10 | 8.5/10 | = |
| **ŚREDNIA WAŻONA** | **8.2/10** | **7.8/10** | **↓ 0.4** |

---

## 2. PORÓWNANIE Z ROADMAPAMI

### Znalezione dokumenty planistyczne (13+)

| Dokument | Wersja | Status | Lokalizacja |
|----------|--------|--------|-------------|
| **ROADMAP.md** | v5.0 (Mar 2026) | 🟢 AKTYWNY — PRIMARY TRUTH | docs/ROADMAP.md |
| ROADMAP_STATUS.md | Bieżący | 🟢 AKTYWNY — tracker | docs/ROADMAP_STATUS.md |
| ULTRA_ENTERPRISE_ROADMAP.md | v1.0 FINAL | 🟢 AKTYWNY — strategiczny | docs/ULTRA_ENTERPRISE_ROADMAP.md |
| STRATEGIC_ARCHITECTURE_REVIEW | Mar 14, 2026 | 🟢 AKTYWNY | docs/STRATEGIC_ARCHITECTURE_REVIEW_2026-03-14.md |
| PREMIUM_UPLIFT_EXECUTION_BASELINE | Mar 14, 2026 | 🟢 AKTYWNY — plan wykonania | docs/PREMIUM_UPLIFT_EXECUTION_BASELINE_2026-03-14.md |
| PRODUCT_SCOPE.md | — | 🟢 AKTYWNY | docs/PRODUCT_SCOPE.md |
| ROADMAP_ENTERPRISE.md | v4 | 🟡 SUPERSEDED | docs/ROADMAP_ENTERPRISE.md |
| MVP_COMPLETION_REPORT.md | Feb 8, 2026 | 📸 SNAPSHOT | docs/MVP_COMPLETION_REPORT.md |
| PHASE_7A_BETA_DIAGNOSTICS.md | Dec 9, 2025 | 📸 SNAPSHOT | docs/PHASE_7A_BETA_DIAGNOSTICS.md |
| BETA_STATUS.md | Dec 10, 2025 | 📸 SNAPSHOT | docs/BETA_STATUS.md |
| STAN_PROJEKTU.md | Feb 17-21, 2026 | 📋 LOG | STAN_PROJEKTU.md |
| CHANGELOG.md | Bieżący | 📋 LOG | CHANGELOG.md |
| ADR-0000 do ADR-0012 | — | 🟢 AKTYWNE | docs/ADR/*.md |

### Status realizacji ROADMAP.md v5.0 (21 PRów, 6 faz)

| Faza | PRy | Ukończenie | Status |
|------|-----|-----------|--------|
| **Faza 0: Fundamenty** | PR-01 Tooling, PR-02 Security RLS, PR-03 Design System | 100% | ✅ DONE |
| **Faza 1: Dostęp** | PR-04 Social login, PR-05 Company profile, PR-06 Free tier | 100% | ✅ DONE |
| **Faza 2: Shell** | PR-07 FF_NEW_SHELL | 95% | ✅ MOSTLY DONE |
| **Faza 3: Data anchors** | PR-08 CRM, PR-09 Offers list | 100% | ✅ DONE |
| **Faza 4: Offers as process** | PR-10 Wizard, PR-11 PDF, PR-12 Acceptance | 100% | ✅ DONE |
| **Faza 5: Projects** | PR-13-18 Hub, Burn bar, Photos, Docs, Templates, Warranties | 95% | 🟠 IN PROGRESS |
| **Faza 6: Offline + Stripe** | PR-19 PWA Offline, PR-20 Stripe Billing | 30% | 🔴 BLOCKED |

### Status wg ROADMAP_STATUS.md

- **PR-01 do PR-20:** Wszystkie oznaczone jako DONE w trackerze
- **PR-00 (Roadmap-as-code):** TODO
- **PR-08 (CRM + Cennik):** IN PROGRESS

### Blokery (wymagają akcji właściciela)

| Bloker | Opis | Wpływ |
|--------|------|-------|
| 🔴 Stripe Price IDs | Konfiguracja w Stripe Dashboard | Blokuje monetyzację |
| 🔴 DB Migrations push | `supabase db push` do produkcji | Blokuje deployment |
| 🔴 RESEND_API_KEY | Email service secret | Blokuje wysyłkę ofert |
| 🔴 FRONTEND_URL | URL dla linków w emailach | Blokuje email links |
| 🟡 Google OAuth Callback | Konfiguracja redirect URL | Blokuje login Google |

### PREMIUM_UPLIFT_EXECUTION (niezrealizowany)

Plan na 4 prompty (Prompt 2-5), 8-11 tygodni pracy:
- **Prompt 2:** Premium Design System (2-3 tyg.) — ❌ NIE ROZPOCZĘTY
- **Prompt 3:** Psychology & Trust (2-3 tyg.) — ❌ NIE ROZPOCZĘTY
- **Prompt 4:** Landing + PDF + Public Offers (2-3 tyg.) — ❌ NIE ROZPOCZĘTY
- **Prompt 5:** Mobile Polish + Cleanup (1-2 tyg.) — ❌ NIE ROZPOCZĘTY

### STRATEGIC_ARCHITECTURE_REVIEW kluczowe wnioski

- Ocena produktu: 7.0-7.5/10 (kod 8.5, visual 5.5, psychologia 5.0)
- **Stack NIE jest wąskim gardłem** — design language i psychologia są
- **Rekomendacja PRZECIW migracji do Next.js** (koszt 2-3 mies., minimalny zysk UX)
- 26 materialnych zmian zrealizowanych w PRach #370-#431

---

## 3. AUDYT KODU I ARCHITEKTURY

### Statystyki

| Metryka | Wartość |
|---------|---------|
| Pliki TypeScript/TSX | 500 |
| Komponenty React | 215 |
| Strony/trasy | 63 strony, 70+ tras |
| Custom hooki | 72 |
| Utility/lib | 53 |
| Pliki testowe | 93 |
| Testy | 1 366 pass, 5 skip |
| Linie kodu | ~70 114 |
| shadcn/ui components | 58 |
| Memoizacja (memo/useMemo/useCallback) | 145 instancji |
| ARIA atrybuty | 306+ |

### Problemy kodu wykryte w pogłębionym audycie

| Problem | Plik | Ważność |
|---------|------|---------|
| 30 hooków używa `select('*')` | Cały codebase | 🔴 P0 |
| Analytics.tsx importuje Recharts bezpośrednio | src/pages/Analytics.tsx | 🔴 P0 |
| innerHTML pattern w PdfGenerator | src/pages/PdfGenerator.tsx:171 | 🔴 P0 |
| 27 plików omija logger (console.*) | Wiele plików | 🟡 P1 |
| WorkspaceLineItems.tsx 1143 linii | quickEstimate/ | 🟡 P1 |
| supabase/types.ts 1771 linii | integrations/ | 🟢 Info |
| Tylko 2 instancje `as any` | Akceptowalne | ✅ OK |

---

## 4. AUDYT WYDAJNOŚCI

### Ocena: 5.5/10 — KRYTYCZNE PROBLEMY

| Obszar | Ocena | Status |
|--------|-------|--------|
| Web Vitals monitoring | 10/10 | ✅ Sentry + requestIdleCallback |
| Optymalizacja obrazów | 3/10 | 🔴 Brak lazy loading, brak srcset |
| Ładowanie fontów | 7/10 | 🟡 Inter z Google Fonts CDN |
| Code splitting | 7/10 | 🟡 Analytics.tsx przebija pattern |
| Prefetching/Preloading | 0/10 | 🔴 Brak jakiegokolwiek |
| Service Worker caching | 0/10 | 🔴 Celowo wyłączony |
| Zapytania DB (select) | 3/10 | 🔴 30 hooków select('*') |
| Virtual scrolling | 0/10 | 🔴 Brak |
| Rozmiar bundle | 4/10 | 🔴 283 KB gzip (cel < 200) |
| Animacje | 9/10 | ✅ GPU-accelerated, prefers-reduced-motion |

### Top 5 problemów wydajności (P0)

1. **30 hooków `select('*')`** — fetchuje 30-50% więcej danych niż potrzeba
2. **Analytics.tsx bezpośrednio importuje Recharts** — 420 KB w main bundle
3. **Main bundle 930 KB / 283 KB gzip** — powinien być < 200 KB gzip
4. **Brak image lazy loading** — wszystkie obrazy ładowane eagerly
5. **Taby renderowane eagerly** — Settings (9 tabów), ProjectDetail (6 tabów)

---

## 5. AUDYT UX/UI

### Ocena: 7.5/10

| Obszar | Ocena | Uwagi |
|--------|-------|-------|
| Onboarding | ✅ 9/10 | 2 ścieżki: pełna + lekka |
| Formularze | ✅ 8/10 | Wizard 3-step, walidacja, brak auto-save |
| Nawigacja | ✅ 8/10 | Dual shell, bottom nav, FAB |
| Powiadomienia | ✅ 8/10 | Toast + NotificationCenter |
| Wyszukiwanie | ⚠️ 4/10 | Tylko per-page, brak globalnego |
| Filtrowanie/sortowanie | ✅ 7/10 | Status tabs, sort dropdown |
| Responsive design | ✅ 9/10 | Mobile-first, safe areas |
| Loading skeletons | ✅ 9/10 | Content-shaped placeholders |
| Confirmation dialogs | ✅ 7/10 | Destrukcyjne akcje, brak "unsaved changes" |
| Keyboard shortcuts | ❌ 1/10 | Brak Cmd+K, brak skrótów |
| Drag & drop | ❌ 0/10 | Nie zaimplementowany |
| Eksport danych | ❌ 2/10 | Tylko admin CSV + GDPR JSON |
| Undo/Redo | ❌ 0/10 | Brak |
| Auto-save | ⚠️ 3/10 | Deklarowany ale nie widoczny |
| Animacje | ✅ 8/10 | Framer Motion, spring animations |
| Dark mode | ✅ 9/10 | Pełne wsparcie |

### Krytyczne braki UX

1. ❌ **Brak globalnego wyszukiwania** (Cmd+K / Ctrl+K)
2. ❌ **Brak ostrzeżenia "niezapisane zmiany"** przy opuszczaniu formularza
3. ❌ **Brak eksportu danych** (CSV ofert, PDF raportów)
4. ❌ **Brak breadcrumbs** — trudno zrozumieć hierarchię
5. ❌ **Brak auto-save** widocznego w UI (brak "Saved at 14:30")

---

## 6. AUDYT PRZEPŁYWU DANYCH

### Ocena: 8.5/10 — Solidna architektura

**Trzy warstwy stanu:**
1. **TanStack Query v5.83** — stan serwera (fetch, cache, invalidate)
2. **React Context** — stan globalny (Auth, Config, Draft)
3. **Component state** — stan lokalny (UI, formularze)

**Kluczowe wzorce:**
- ✅ Pojedyncza instancja Supabase client (type-safe)
- ✅ Factory pattern dla query keys (cache coherence)
- ✅ Hierarchiczne invalidation (parent invaliduje children)
- ✅ Offline Queue (IndexedDB, 5 akcji, 5 prób retry)
- ✅ Non-fatal email/PDF (oferta SENT nawet gdy email/PDF fail)
- ✅ Stripe Checkout via Edge Function (sekrety server-side)
- ❌ Brak real-time subscriptions (polling via cache invalidation)
- ❌ Brak optimistic updates (UI czeka na serwer)

---

## 7. AUDYT BEZPIECZEŃSTWA

### Ocena: 7.5/10

**Silne strony:** RLS 100%, CSP, HSTS, walidacja Zod, sanityzacja, PII masking w loggerze.

**Krytyczne znaleziska:**
1. 🔴 **jsPDF ≤4.2.0 — HTML injection** → `npm audit fix`
2. 🔴 **Plan limits tylko client-side** → dodać server-side triggers
3. 🟡 **innerHTML w PdfGenerator.tsx:171** → refaktoryzacja
4. 🟡 **Rate limiter fail-open** → zmienić na fail-closed
5. 🟡 **27 plików omija PII logger** → użyć logger.error()

---

## 8. AUDYT TESTÓW I CI/CD

### Ocena: 7/10

**7 workflow GitHub Actions:**

| Workflow | Cel | Status |
|----------|-----|--------|
| ci.yml | Lint, type-check, tests, build, security | ✅ |
| e2e.yml | Playwright (7 speców, axe-core a11y) | ✅ |
| security.yml | npm audit + CodeQL SAST | ✅ |
| bundle-analysis.yml | Wizualizacja bundle | ✅ |
| deployment-truth.yml | Supabase + Vercel deploy | ✅ |
| i18n-ci.yml | Parytet kluczy, hardcode audit | ✅ |
| supabase-deploy.yml | Weryfikacja migracji | ✅ |

**Problemy:**
1. 🔴 **Husky niezainstalowany** — brak pre-commit hooks (package.json ma prepare script ale husky nie jest w devDependencies)
2. 🔴 **Prettier nie w devDependencies** — format scripts fail bez globalnego install
3. 🟡 **Brak progów coverage** — mierzone ale nie egzekwowane
4. 🟡 **Shallow hook tests** — testują mock zamiast renderHook()
5. 🟡 **665 ESLint warnings** (i18n/no-literal-string) — intencjonalnie warn, ale duży backlog
6. 🟡 **E2E częściowo zablokowane** — brak test user credentials

---

## 9. AUDYT i18n

### Ocena: 6/10 (SKORYGOWANA Z 8.5)

**Strukturalnie doskonałe:** 3 języki, 4448 kluczy, 100% parytet, CI check.

**KRYTYCZNE problemy odkryte w pogłębionym audycie:**

| Problem | Plików | Ważność |
|---------|--------|---------|
| `Intl.NumberFormat('pl-PL')` zahardkodowane | 20+ | 🔴 KRYTYCZNY |
| `toLocaleDateString('pl-PL')` zahardkodowane | 15+ | 🔴 KRYTYCZNY |
| Polskie jednostki miary zahardkodowane | 2 | 🔴 KRYTYCZNY |
| AdBanner mockAds w polskim | 1 | 🔴 KRYTYCZNY |
| ProjectStatus type z polskimi stringami | 1 | 🔴 KRYTYCZNY |
| Default templates po polsku | 1 | 🟡 ŚREDNI |
| index.html meta tagi po polsku | 1 | 🟡 ŚREDNI |
| OG locale zahardkodowane na pl_PL | 2 | 🟡 ŚREDNI |
| Email templates — tylko nazwy kategorii | 1 | 🟡 ŚREDNI |

**Wpływ:** Użytkownicy EN i UK widzą polskie formatowanie walut (1 000,00 zł zamiast PLN 1,000.00), polskie daty, polskie jednostki miary.

---

## 10. AUDYT SUPABASE

### Ocena: 9/10

- 49 migracji, 53 tabele z RLS (100% pokrycia)
- 20 Edge Functions z walidacją i rate limiting
- Shared utilities: validation (17 walidatorów), sanitization, rate-limiter, ai-provider
- RODO Art. 17: pełne kasowanie konta z audit trail
- Dual-token system (public_token + accept_token)
- ⚠️ Minor: race condition w rate limiter (check-then-increment)
- ⚠️ Dual offer system (legacy + new) — akceptowalne na etapie migracji

---

## 11. AUDYT VERCEL

### Ocena: 8.8/10

- Security headers: X-Frame-Options DENY, HSTS, CSP, COOP, Permissions-Policy
- Build: `npm ci` + `npm run build` → `dist/`
- SPA rewrite: `/(.*) → /index.html`
- No-cache na index.html, version.json, sw-register.js
- Sourcemapy: hidden w produkcji (Sentry upload)
- ⚠️ robots.txt: zahardkodowana domena `majsterai.com`
- ⚠️ CSP `style-src 'unsafe-inline'` — wymagane przez Tailwind

---

## 12. AUDYT PANELU ADMINA

### Ocena: 5.5/10

**12 stron admina, z czego ~50% to mock/placeholder:**

| Strona | Status | Uwagi |
|--------|--------|-------|
| Dashboard | ⚠️ Mock data | Statystyki zahardkodowane (156 users, 432 projects) |
| Users | ✅ Działa | Zarządzanie rolami, wyszukiwanie |
| Theme Editor | ✅ Działa | HSL kolory, fonty, border-radius |
| Content Editor | ⚠️ localStorage | Nie w bazie danych — gubi się po czyszczeniu |
| System Settings | ✅ Działa | Toggles, limity, email config |
| Audit Logs | ✅ Działa | CSV export, filtry |
| Database Manager | ⚠️ Read-only | Export/backup niezaimplementowane |
| CRON Manager | ⚠️ Częściowy | Toggle nie działa, Run Now działa |
| Plans | ✅ Działa | Konfiguracja planów |
| Navigation | ✅ Działa | Reorder, visibility |
| API | ✅ Deleguje | ApiKeysPanel |
| Diagnostics | ⚠️ Zahardkodowane | "All Operational" — brak real checks |

**Niezaimplementowane funkcje admina:**
- ❌ Usuwanie użytkowników (tylko zarządzanie rolami)
- ❌ Blokowanie kont (UI jest, brak logiki)
- ❌ Wysyłanie emaili (UI jest, brak logiki)
- ❌ Backup bazy danych
- ❌ Real health checks (wszystko zahardkodowane jako "operational")
- ❌ Impersonacja użytkownika
- ❌ 2FA (toggle jest, brak implementacji)

---

## 13. AUDYT BILLING/STRIPE

### Ocena: 8/10

**Pełny flow:** Checkout Session → Stripe Portal → Webhook → DB sync

**4 plany:** Free (0 zł), Pro (49 zł), Business (99 zł), Enterprise (199 zł)

**Silne strony:**
- ✅ Webhook signature verification + idempotency (stripe_events)
- ✅ Server-side quota enforcement (trigger enforce_monthly_offer_send_limit)
- ✅ Price ID validation (blokuje placeholdery)
- ✅ Least-privilege status mapping (unknown → inactive)
- ✅ RLS na user_subscriptions (read-only dla userów)

**Braki:**
- ❌ Tylko karty (brak BLIK, Przelewy24, Apple Pay)
- ❌ Add-ony zaprojektowane ale niezaimplementowane (Coming Soon)
- ❌ Brak custom polskich faktur VAT
- ❌ Brak email po nieudanej płatności (TODO w kodzie)
- ❌ Brak in-app cancellation (wymaga Stripe Portal)

---

## 14. AUDYT SEO, POLITYK, TEKSTÓW, GRAFIK

### SEO: 7/10
- ✅ Kompletne meta tagi, Open Graph, Twitter Card, sitemap, robots.txt
- ✅ JSON-LD structured data (WebApplication, Organization, FAQ)
- ⚠️ Brak alt text na obrazach, brak WebP, OG image 512x512 (powinien 1200x630)

### Polityki prawne: 8/10
- ✅ Prywatność, Regulamin, Cookies, DPA, Centrum RODO — w 3 językach
- ✅ Cookie Consent z granularnymi zgodami
- ⚠️ Brak mechanizmu wycofania zgody cookies po akceptacji
- ⚠️ Brak adresu pocztowego (Art. 13 RODO może wymagać)

### Grafiki: 6/10
- ✅ favicon.svg/ico, PWA icons (192, 512), manifest.json
- ❌ Brak WebP/AVIF, brak screenshots w manifest, brak splash iOS, brak logo w public/

---

## 15. AUDYT GŁĘBOKI

| Znalezisko | Plików | Ważność |
|------------|--------|---------|
| innerHTML w PdfGenerator.tsx:171-209 | 1 | 🔴 XSS risk |
| console.* omijając logger | 27 | 🟡 PII risk |
| Error objects logowane bez maskowania | 3 | 🟡 PII risk |
| TODO comments w kodzie produkcyjnym | 3 pliki, 7 komentarzy | 🟡 Przenieść do issue tracker |
| dangerouslySetInnerHTML w chart | 1 | ✅ Bezpieczne (app-controlled CSS) |
| Memory leaks | 2 minor (SplashScreen, AdBanner) | 🟢 Niskie |
| Race conditions | 1 (PdfGenerator query gate) | ✅ Handled |
| `as any` usage | 2 instancje | ✅ Akceptowalne |
| Dark mode | ✅ Pełne wsparcie | ✅ |
| Empty states | ✅ Pokryte | ✅ |
| Loading states | ✅ Skeleton screens | ✅ |

---

## 16. ANALIZA BIZNESOWA

### Rynek: 437 000 firm budowlanych w PL, brak bezpośredniej konkurencji

| Metryka | Wartość |
|---------|---------|
| Wartość rynku budowlanego PL | 350+ mld PLN |
| TAM (adresowalny rynek) | ~434 000 firm |
| Bezpośrednia konkurencja w kategorii | **BRAK** |
| Koszty infra per user (1000 users) | ~0.50-0.80 PLN/mies. |
| Break-even | ~562 płatnych użytkowników |
| Marża brutto | ~97% |

### Rekomendowany model cenowy

| Plan | Cena | Target |
|------|------|--------|
| Free | 0 PLN | Pozyskanie użytkowników |
| Starter | 49 PLN | Mikrofirmy 1-2 os. |
| Professional | 99 PLN | Firmy 3-10 os. |
| Business | 199 PLN | Firmy 10+ os. |

---

## 17. ANALIZA SWOT

### Mocne strony
1. Unikalna pozycja — brak polskiego konkurenta w AI business management
2. Niskie koszty operacyjne (Supabase + Vercel + Gemini)
3. AI jako wyróżnik — nikt w PL nie oferuje AI wycen
4. Pełna lokalizacja (PL/EN/UK)
5. Mobile-first (Capacitor + PWA)
6. Silne RLS 100% + security headers
7. 1 366 testów, 7 CI workflows

### Słabe strony
1. Wczesna faza (brak użytkowników)
2. Formatowanie zahardkodowane na pl-PL (20+ plików)
3. Brak integracji z KSeF, iFirma, Fakturownia
4. Marketplace minimalny (1 komponent)
5. Panel admina ~50% mock data
6. Main bundle za duży (283 KB gzip)
7. 30 hooków select('*')

### Szanse
1. 437 000 niezdigitalizowanych firm
2. KSeF (obowiązkowe e-faktury)
3. Fundusze UE na cyfryzację MSP
4. CAGR 4-5% rynku budowlanego
5. Ekspansja na CZ/SK/kraje bałtyckie

### Zagrożenia
1. Fixly/Oferteo mogą dodać zarządzanie
2. Globalni gracze (Houzz Pro, Jobber) wejście na PL
3. Niska adopcja tech w branży
4. Sezonowość budownictwa

---

## 18. SAMODZIELNIE WYKRYTE BRAKI (PLAN WŁASNY)

Poniższe problemy **nie były wymienione w żadnej roadmapie** i zostały wykryte samodzielnie przez audyt:

### Krytyczne (blokują production-grade)

| # | Problem | Odkryty przez | Wpływ |
|---|---------|---------------|-------|
| 1 | 30 hooków `select('*')` — payload bloat 30-50% | Performance audit | Wolne ładowanie na 4G |
| 2 | Formatowanie dat/walut zahardkodowane na pl-PL | i18n audit | EN/UK users widzą polski format |
| 3 | Brak pre-commit hooks (Husky nie zainstalowany) | Testing audit | Brak lokalnych quality gates |
| 4 | Prettier nie w devDependencies | Testing audit | Format scripts failują |
| 5 | Analytics.tsx bezpośrednio importuje Recharts (420 KB) | Performance audit | Main bundle za duży |
| 6 | Brak image lazy loading | Performance audit | Długie ładowanie stron ze zdjęciami |
| 7 | Brak prefetch/preconnect dla Supabase | Performance audit | Wolniejsze pierwsze zapytanie |
| 8 | ProjectStatus type z polskimi stringami | i18n audit | Type-level coupling do PL |
| 9 | Jednostki miary zahardkodowane po polsku | i18n audit | "szt.", "godz." w EN interface |
| 10 | innerHTML pattern w PdfGenerator | Deep audit | Potencjalny XSS vector |

### Średnie (powinny być naprawione przed public launch)

| # | Problem | Odkryty przez |
|---|---------|---------------|
| 11 | Panel admina: dashboard mock data | Admin audit |
| 12 | Panel admina: diagnostics zahardkodowane | Admin audit |
| 13 | Brak globalnego wyszukiwania (Cmd+K) | UX audit |
| 14 | Brak ostrzeżenia "niezapisane zmiany" | UX audit |
| 15 | Brak eksportu danych (CSV ofert/projektów) | UX audit |
| 16 | Brak breadcrumbs w nawigacji | UX audit |
| 17 | Brak virtual scrolling dla długich list | Performance audit |
| 18 | Inter font z Google Fonts CDN (brak self-host) | Performance audit |
| 19 | Content Editor w localStorage (nie w DB) | Admin audit |
| 20 | Email po nieudanej płatności (TODO w kodzie) | Billing audit |

### Niskie (nice-to-have)

| # | Problem | Odkryty przez |
|---|---------|---------------|
| 21 | Brak keyboard shortcuts | UX audit |
| 22 | Brak drag & drop | UX audit |
| 23 | Brak undo/redo | UX audit |
| 24 | Brak real-time subscriptions | Data flow audit |
| 25 | Brak optimistic updates | Data flow audit |
| 26 | Service Worker celowo wyłączony | Performance audit |
| 27 | Brak coverage thresholds | Testing audit |
| 28 | Brak git tags (version tagging) | Git audit |
| 29 | E2E tests częściowo zablokowane | Testing audit |
| 30 | 665 ESLint i18n warnings backlog | Testing audit |

---

## 19. PLAN ROZWOJU — PEŁNA MAPA DROGOWA

### NATYCHMIAST (przed soft-launch, 1-2 tygodnie)

| # | Zadanie | Priorytet | Wysiłek |
|---|---------|-----------|---------|
| 1 | `npm audit fix` — jsPDF + 3 inne | 🔴 P0 | 1h |
| 2 | Zamienić `select('*')` na jawne kolumny w 30 hookach | 🔴 P0 | 8-12h |
| 3 | Stworzyć locale-aware formatters (waluta, data) | 🔴 P0 | 4-6h |
| 4 | Zainstalować Husky + dodać Prettier do devDeps | 🔴 P0 | 30min |
| 5 | Fix Analytics.tsx → użyć chart-lazy wrapper | 🔴 P0 | 1h |
| 6 | Dodać `loading="lazy"` na wszystkie `<img>` | 🔴 P0 | 2h |
| 7 | Fix theme-color mismatch (SEOHead vs index.html) | 🔴 P0 | 15min |
| 8 | Stworzyć OG image 1200x630 | 🔴 P0 | 30min |
| 9 | Dodać alt text do obrazów | 🔴 P0 | 2h |
| 10 | Server-side plan enforcement (triggers) | 🔴 P0 | 4-8h |

### SPRINT 1 (po soft-launch, 2-3 tygodnie)

| # | Zadanie | Priorytet |
|---|---------|-----------|
| 11 | Globalne wyszukiwanie (Cmd+K) | 🟠 P1 |
| 12 | Przeniesienie jednostek miary do i18n | 🟠 P1 |
| 13 | Przeniesienie AdBanner text do i18n | 🟠 P1 |
| 14 | Lazy-load tab content (Settings, ProjectDetail) | 🟠 P1 |
| 15 | Virtual scrolling dla list (offers, projects) | 🟠 P1 |
| 16 | Preconnect/prefetch dla Supabase + Google Fonts | 🟠 P1 |
| 17 | Breadcrumbs w nawigacji | 🟠 P1 |
| 18 | "Niezapisane zmiany" warning | 🟠 P1 |
| 19 | Real admin dashboard data (zamiast mock) | 🟠 P1 |
| 20 | Cookie Preference Center (link w footer) | 🟠 P1 |

### SPRINT 2 (4-6 tygodni)

| # | Zadanie | Priorytet |
|---|---------|-----------|
| 21 | Integracja KSeF (Krajowy System e-Faktur) | 🔴 KRYTYCZNY |
| 22 | Eksport danych CSV/PDF (oferty, projekty, klienci) | 🟠 P1 |
| 23 | BLIK/Przelewy24 w Stripe | 🟠 P1 |
| 24 | Rozbudowa Marketplace (profil firmy, portfolio, oceny) | 🟠 P1 |
| 25 | Integracja z iFirma/Fakturownia | 🟠 P1 |
| 26 | Add-on system (extra projekty/klienci) | 🟡 P2 |
| 27 | Coverage thresholds w CI | 🟡 P2 |
| 28 | Self-host Inter font | 🟡 P2 |
| 29 | Refaktoryzacja PdfGenerator (usunąć innerHTML) | 🟡 P2 |
| 30 | Git tags + release workflow | 🟡 P2 |

### Q3-Q4 2026

| # | Zadanie |
|---|---------|
| 31 | Rozbudowa modułu finansów (P&L, cash flow) |
| 32 | Moduł kosztorysowania KNR |
| 33 | Chat z klientem w aplikacji |
| 34 | Automatyczne follow-upy (email/SMS) |
| 35 | Śledzenie czasu pracy |
| 36 | Galeria realizacji (portfolio online) |
| 37 | Program poleceń |
| 38 | Keyboard shortcuts (pełny set) |
| 39 | Drag & drop (reorder items, kanban) |
| 40 | Real health checks w admin diagnostics |

### 2027+

| # | Zadanie |
|---|---------|
| 41 | Integracja z hurtowniami (cenniki real-time) |
| 42 | CRM zaawansowany (pipeline, scoring) |
| 43 | Open Banking (automatyczne rozliczenia) |
| 44 | Aplikacja mobilna natywna (App Store + Google Play) |
| 45 | Ekspansja CZ/SK/kraje bałtyckie |
| 46 | AI Copilot (pełny asystent biznesowy) |
| 47 | Moduł ubezpieczeń (partnerstwa) |
| 48 | Szkolenia online dla wykonawców |
| 49 | Real-time collaboration (Supabase Realtime) |
| 50 | Service Worker caching (Workbox) |

---

## 20. PODSUMOWANIE OCEN KOŃCOWYCH

| Obszar | Ocena | Status |
|--------|-------|--------|
| Architektura kodu | 8.5/10 | Solidna, TypeScript strict, 72 hooki |
| Supabase backend | 9/10 | 53 tabele RLS, 20 Edge Functions |
| Vercel deployment | 8.8/10 | Pełne security headers |
| Bezpieczeństwo | 7.5/10 | 1 krytyczna + 4 średnie |
| Testy i CI/CD | 7/10 | 1366 testów, 7 workflows, ale brak Husky |
| UX/UI | 7.5/10 | Mobile-first, brak global search |
| Wydajność | 5.5/10 | **Najsłabszy punkt** — select('*'), bundle |
| i18n | 6/10 | Struktura OK, formatting zahardkodowane |
| SEO | 7/10 | Solidna baza, brak optymalizacji grafik |
| Polityki prawne | 8/10 | Pełne RODO z drobnymi lukami |
| Panel admina | 5.5/10 | ~50% mock/placeholder |
| Billing/Stripe | 8/10 | Pełny flow, brak BLIK |
| Data flow/API | 8.5/10 | TanStack Query + contexts + offline |
| Pozycja rynkowa | 9/10 | Brak konkurencji, ogromny TAM |
| **ŚREDNIA WAŻONA** | **7.8/10** | **Production-capable z naprawami P0** |

### Czy to się opłaca? ✅ TAK — z zastrzeżeniami

**Argumenty ZA:**
- 437 000 firm bez dedykowanego narzędzia
- Break-even przy 562 użytkownikach (0.13% rynku)
- Marża brutto ~97%
- AI jako unikalna wartość
- KSeF wymusi cyfryzację

**Warunek:** Naprawić 10 problemów P0 (lista w sekcji 19) przed soft-launch.

### Rekomendacja końcowa

Aplikacja jest technicznie zaawansowana (500 plików, 1366 testów, 53 tabele z RLS, 7 CI workflows, 3 języki). Pogłębiony audyt ujawnił jednak **30+ problemów niewidocznych w pierwszym przeglądzie**, z których 10 jest krytycznych (P0). Po ich naprawie aplikacja będzie gotowa do soft-launch.

**Kluczowe priorytety:**
1. Wydajność (select('*'), bundle size, lazy loading)
2. i18n formatting (locale-aware formatters)
3. Bezpieczeństwo (jsPDF, server-side enforcement)
4. Tooling (Husky, Prettier, coverage thresholds)
5. Monetyzacja (Stripe Price IDs — akcja właściciela)

---

*Raport v2 wygenerowany: 18 marca 2026*
*Narzędzie: Claude Code (Opus 4.6)*
*Agentów: 17 (7 runda 1 + 10 runda 2)*
*Dokumentów przeanalizowanych: 150+ .md, 500 .ts/.tsx, 49 migracji*
*Branch: claude/app-audit-compliance-liXVW*
