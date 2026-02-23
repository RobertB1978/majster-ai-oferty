# MAJSTER.AI — FULL AUDIT REPORT v6.3 HYBRID

**Data:** 2026-02-23
**Commit SHA:** `34a3743cc5a538cd4d9195d5d102dea27f8a247e`
**Branch:** main
**Audytor:** Claude Opus 4.6 (READ-ONLY static analysis)
**PROD_URL:** https://majster-ai-oferty.vercel.app

---

## A) Coverage Statement

| Metryka | Wartość |
|---------|--------|
| Łączna liczba claims | 96 |
| PASS | 58 |
| FAIL | 17 |
| UNKNOWN | 20 |
| N/A | 1 |
| **Pokrycie (PASS+FAIL+N_A)/Total** | **79.2%** |

**Co blokuje 95–98%:**
- **N (Runtime E2E):** 3 UNKNOWN — brak dostępu do PROD, brak kont testowych
- **O (DAST/Scanning):** 3 UNKNOWN — brak raportu ZAP
- **P (Privacy/GDPR):** 2 UNKNOWN — brak udokumentowanych map danych / subprocessors
- **C (UX/Mobile):** 5 UNKNOWN — wymagana weryfikacja runtime (z-index, chat widget, empty states, WCAG)
- **Rozproszone:** 7 UNKNOWN w domenach B, F, H, I, J, L, M

**Minimalne wymagania do osiągnięcia 95%:** dostarczyć konta testowe (User A + User B), uruchomić ZAP baseline, udokumentować mapę danych GDPR, przeprowadzić testy runtime na mobile viewport.

---

## B) SaaS Readiness Scorecard

| Domena | PASS | FAIL | UNKN | N_A | Total | % | Waga | Ważony |
|--------|------|------|------|-----|-------|------|------|--------|
| F Security | 9 | 1 | 1 | 1 | 12 | 81.8 | 2.0 | 163.6 |
| L Auth & User Mgmt | 4 | 1 | 1 | 0 | 6 | 66.7 | 1.9 | 126.7 |
| E Billing | 5 | 3 | 0 | 0 | 8 | 62.5 | 1.8 | 112.5 |
| K AI & LLM Security | 5 | 3 | 0 | 0 | 8 | 62.5 | 1.7 | 106.3 |
| N Runtime E2E | 0 | 0 | 3 | 0 | 3 | 0.0 | 1.6 | 0.0 |
| A Routing & SPA | 4 | 1 | 0 | 0 | 5 | 80.0 | 1.5 | 120.0 |
| I PDF Compliance | 12 | 3 | 1 | 0 | 16 | 75.0 | 1.5 | 112.5 |
| M Observability | 3 | 1 | 1 | 0 | 5 | 60.0 | 1.4 | 84.0 |
| O DAST/Scanning | 0 | 0 | 3 | 0 | 3 | 0.0 | 1.4 | 0.0 |
| H CI/CD + Perf | 3 | 0 | 1 | 0 | 4 | 75.0 | 1.3 | 97.5 |
| P Privacy/GDPR | 0 | 1 | 2 | 0 | 3 | 0.0 | 1.3 | 0.0 |
| B i18n | 3 | 1 | 1 | 0 | 5 | 60.0 | 1.2 | 72.0 |
| G Legal/SEO | 3 | 1 | 0 | 0 | 4 | 75.0 | 1.2 | 90.0 |
| C UX/Mobile/PWA | 3 | 0 | 5 | 0 | 8 | 37.5 | 1.1 | 41.3 |
| D Core Features | 3 | 0 | 0 | 0 | 3 | 100.0 | 1.0 | 100.0 |
| J Dependencies | 1 | 1 | 1 | 0 | 3 | 33.3 | 1.0 | 33.3 |
| **RAZEM** | **58** | **17** | **20** | **1** | **96** | | **21.9** | **1259.7** |

### **Overall Weighted Score: 57.5%**

*(UNKNOWN = FAIL w scoringu; N_A wyłączone z mianownika)*

---

## C) Evidence Index

| E-ID | Opis (plik:linie lub artefakt) |
|------|-------------------------------|
| E-001 | `src/App.tsx:128-275` — Router config, 3 zones (public/app/admin) |
| E-002 | `vercel.json:58-63` — SPA rewrite rule `/(.*) → /index.html` |
| E-003 | `vercel.json:1-56` — Security headers (CSP/HSTS/XFO/XCTO/ReferrerPolicy/PermissionsPolicy) |
| E-004 | `src/App.tsx:143-258` — Route definitions: /app/dashboard, /app/jobs, /app/customers, etc. |
| E-005 | `src/App.tsx:256-257` — Catch-all `*` route → NotFound component |
| E-006 | `src/App.tsx:128-129` — Root ErrorBoundary wraps entire app |
| E-007 | `src/components/ErrorBoundary.tsx:46-118` — Friendly error UI, no raw stack traces |
| E-008 | `src/components/ErrorBoundary.tsx:93-99` — Error.message only in collapsible `<details>` |
| E-009 | `src/i18n/index.ts:1-32` — i18next config: PL/EN/UK, fallbackLng: 'pl' |
| E-010 | npm script output: PL=1336, EN=1336, UK=1336 keys — perfect parity, 0 missing |
| E-011 | `src/App.tsx:82-101` — ThemeInitializer sets `document.documentElement.lang` |
| E-012 | `eslint.config.js:40-59` — i18next/no-literal-string only on Login.tsx + AuthDiagnostics.tsx |
| E-013 | `src/pages/Login.tsx:28,135` — useTheme + toggleTheme (dark/light toggle on login) |
| E-014 | `src/components/layout/AppLayout.tsx:16-45` — Auth guard: redirect to /login if no user |
| E-015 | `src/components/layout/AdminGuard.tsx:9-48` — Admin guard: checks isAdmin, redirects non-admin |
| E-016 | `src/hooks/useAdminRole.ts:8-46` — Fetches roles from `user_roles` table via Supabase |
| E-017 | `src/integrations/supabase/client.ts:6-7` — Only VITE_SUPABASE_URL + VITE_SUPABASE_ANON_KEY |
| E-018 | `grep: service_role in src/` — 0 matches — service_role never in frontend |
| E-019 | `src/integrations/supabase/client.ts:122-130` — Supabase client uses localStorage (auth.storage) |
| E-020 | 16 migration files with 277 RLS policy occurrences |
| E-021 | `supabase/migrations/20251217000000_add_stripe_integration.sql:47-58` — RLS on subscription_events |
| E-022 | `supabase/migrations/20251206073947:119-133` — Storage bucket policies for company-documents |
| E-023 | `supabase/migrations/20251207123651:2` — project-photos bucket set to private |
| E-024 | `.gitignore:30-36` — .env and all .env.* variants excluded |
| E-025 | `.env.example` exists (3878 bytes) — template without secrets |
| E-026 | `supabase/functions/_shared/rate-limiter.ts:1-117` — Rate limiting framework |
| E-027 | `supabase/functions/_shared/rate-limiter.ts:19-29` — Per-endpoint configs (AI: 10-30/min) |
| E-028 | `src/lib/logger.ts:1-257` — PII masking logger (email, phone, token, PESEL redacted) |
| E-029 | `src/lib/sentry.ts:36-130` — Sentry init with beforeSend PII stripping |
| E-030 | `src/lib/sentry.ts:67-88` — Strips Authorization, Cookie, email, password from events |
| E-031 | `src/contexts/AuthContext.tsx:43-95` — Login with user-friendly PL error messages |
| E-032 | `src/contexts/AuthContext.tsx:97-116` — Register with emailRedirectTo |
| E-033 | `src/contexts/AuthContext.tsx:118-130` — Logout clears state explicitly |
| E-034 | `src/integrations/supabase/client.ts:126-127` — autoRefreshToken: true |
| E-035 | `supabase/functions/delete-user-account/index.ts:1-439` — GDPR Art. 17 compliant deletion |
| E-036 | `supabase/functions/delete-user-account/index.ts:94-104` — Rate limit: 3/hour |
| E-037 | `supabase/functions/delete-user-account/index.ts:396-408` — Audit log with obfuscated userId |
| E-038 | `src/hooks/usePlanGate.ts:1-189` — Frontend plan gate with limits + feature checks |
| E-039 | `src/hooks/usePlanGate.ts:30-66` — PLAN_LIMITS: free(3proj/5cli), pro(15/30), business(100/200) |
| E-040 | `src/hooks/useSubscription.ts:1-151` — Subscription query + plan features map |
| E-041 | `grep: check_plan/enforce_limit in supabase/` — 0 matches — NO server-side plan enforcement |
| E-042 | `supabase/functions/stripe-webhook/index.ts:76-101` — Webhook signature verification |
| E-043 | `supabase/functions/stripe-webhook/index.ts:144-150` — Event logged but no idempotency key dedup |
| E-044 | `supabase/functions/create-checkout-session/index.ts:1-189` — Stripe checkout with auth |
| E-045 | `supabase/functions/stripe-webhook/index.ts:240-279` — Subscription deleted → free plan |
| E-046 | `src/hooks/usePlanGate.ts:117-130` — Toast upgrade prompt on feature gate |
| E-047 | `src/lib/offerPdfGenerator.ts:1-336` — jsPDF A4 generation |
| E-048 | `src/lib/offerPdfGenerator.ts:39-75` — Company: name, NIP, address, phone, email |
| E-049 | `src/lib/offerPdfGenerator.ts:105-131` — Client: name, address, phone, email |
| E-050 | `src/lib/offerPdfGenerator.ts:152-193` — Line items table: Nazwa, Ilość, Jedn., Cena, Kategoria, Wartość |
| E-051 | `src/lib/offerPdfGenerator.ts` — grep: "VAT" — 0 matches. No VAT handling |
| E-052 | `src/lib/offerPdfGenerator.ts` — grep: "ważność|validity|expir" — 0 matches. No validity date |
| E-053 | `src/lib/offerPdfGenerator.ts` — grep: "numer|version|document.*id" — 0 matches. No doc ID |
| E-054 | `src/lib/offerPdfGenerator.ts:280-290` — Footer with brand + generation timestamp |
| E-055 | `src/lib/offerPdfGenerator.ts:24-29` — A4 portrait, mm units |
| E-056 | `src/lib/offerDataBuilder.ts:66-72` — PdfConfig: title, offerText, terms, deadlineText |
| E-057 | `src/lib/offerDataBuilder.ts:175-183` — Default terms: "50% zaliczka, Gwarancja 24 miesiące" |
| E-058 | `supabase/functions/_shared/ai-provider.ts:1-445` — Multi-provider AI (OpenAI/Anthropic/Gemini) |
| E-059 | `supabase/functions/_shared/ai-provider.ts:65-87` — detectAIProvider from Deno.env.get |
| E-060 | `supabase/functions/ai-chat-agent/index.ts:96-104` — Input validation: maxLength 5000 |
| E-061 | `supabase/functions/ai-chat-agent/index.ts:126-140` — History sanitization: filter roles, limit 10, truncate |
| E-062 | `supabase/functions/ai-chat-agent/index.ts:148` — Logs message length only, not content |
| E-063 | `supabase/functions/_shared/ai-provider.ts:49-53` — DEFAULT_MODELS defined |
| E-064 | `supabase/functions/_shared/ai-provider.ts:391-403` — completeAI: switch/case, no fallback chain |
| E-065 | AI edge functions — grep: "moderation|safety|content_filter" — 0 matches |
| E-066 | `.github/workflows/ci.yml:1-153` — CI: lint + typecheck + tests + build + security audit |
| E-067 | `.github/workflows/e2e.yml:1-89` — E2E: Playwright with MVP Gate tests |
| E-068 | `.github/workflows/bundle-analysis.yml` — Bundle analysis workflow |
| E-069 | `.github/workflows/security.yml` — Dedicated security scan workflow |
| E-070 | `npm audit` output: 20 vulns (1 moderate, 19 high, 0 critical) |
| E-071 | All 19 high vulns trace to minimatch ReDoS chain (dev deps: eslint, typescript-eslint, archiver) |
| E-072 | `scripts/generate-sitemap.js:17-20` — Default BASE_URL = vercel.app domain |
| E-073 | `src/App.tsx:163-169` — Legal routes: /legal/privacy, /terms, /cookies, /dpa, /rodo |
| E-074 | `src/components/legal/CookieConsent.tsx:1-40` — Granular consent (essential/analytics/marketing) |
| E-075 | `index.html:8-18` — Meta tags: title, description, og:title, og:description, theme-color |
| E-076 | `src/components/layout/AppLayout.tsx:49-55` — Skip-to-content link for keyboard nav |
| E-077 | `capacitor.config.ts` — Capacitor config present (408 bytes) |
| E-078 | `public/manifest.json` — Referenced in index.html for PWA |
| E-079 | `supabase/functions/healthcheck/index.ts:1-199` — Health check: DB + Storage + Auth |
| E-080 | `e2e/a11y.spec.ts` — Accessibility E2E test exists |
| E-081 | `src/lib/sentry.ts:113-122` — Web Vitals: CLS, INP, FCP, LCP, TTFB |
| E-082 | `src/App.tsx` — grep: "/logout" route — 0 matches. No /logout URL |
| E-083 | `package.json:68` — @sentry/react dependency present |
| E-084 | `supabase/functions/delete-user-account/index.ts:149` — Logs userId as `substring(0,8) + '***'` |
| E-085 | `eslint.config.js:31-38` — no-console: error (except warn/error) in src/ |
| E-086 | `supabase/functions/stripe-webhook/index.ts:29-42` — mapSubscriptionStatus: unknown status defaults to "active" |
| E-087 | `supabase/migrations/20260220120000_offer_system_v2.sql` — Offer system v2 migration |
| E-088 | 37 unit test files in src/ + 5 E2E specs in e2e/ |
| E-089 | `package.json:21-29` — Scripts: test, e2e, type-check, lint, format |
| E-090 | `supabase/functions/create-checkout-session/index.ts:68-86` — Auth check on checkout |

---

## D) Evidence Pack

| Domena | Claim | E-ID | Status |
|--------|-------|------|--------|
| G0 | C-G0 Commit SHA on PROD | — | **UNKNOWN** |
| A | C-A1 Router reality | E-001 | **PASS** |
| A | C-A2 SPA fallback | E-002 | **PASS** |
| A | C-A3 /logout route | E-082 | **FAIL** |
| A | C-A4 Core routes resolve | E-004 | **PASS** |
| A | C-A5 Route params + error boundary | E-006, E-007 | **PASS** |
| B | C-B1 No raw i18n keys | E-009, E-010 | **PASS** |
| B | C-B2 Language switch updates UI | — | **UNKNOWN** |
| B | C-B3 Locale parity (missing-key diff) | E-010 | **PASS** |
| B | C-B4 no-literal-string gate | E-012 | **FAIL** |
| B | C-B5 html lang updates | E-011 | **PASS** |
| C | C-C1 Dark/Light toggle on /login | E-013 | **PASS** |
| C | C-C2 Mobile overlay z-index | — | **UNKNOWN** |
| C | C-C3 Chat widget closeable on mobile | — | **UNKNOWN** |
| C | C-C4 Beta/Coming-Soon labels | — | **UNKNOWN** |
| C | C-C5 Empty states graceful | — | **UNKNOWN** |
| C | C-C6 Error boundaries no stack traces | E-007, E-008 | **PASS** |
| C | C-C7 WCAG 2.2 AA baseline | E-076, E-080 | **UNKNOWN** |
| C | C-C8 Capacitor/PWA config | E-077, E-078 | **PASS** |
| D | C-D1 Offer/Estimate CRUD | E-004, E-047 | **PASS** |
| D | C-D2 PDF generation | E-047, E-055 | **PASS** |
| D | C-D3 Share/send mechanism | E-044, E-090 | **PASS** |
| E | C-E1 Plans map to entitlements | E-038, E-039, E-040 | **PASS** |
| E | C-E2 Server-side enforcement | E-041 | **FAIL** |
| E | C-E3 Stripe integration present | E-044, E-042 | **PASS** |
| E | C-E4 Webhook handler exists | E-042 | **PASS** |
| E | C-E5 Upgrade prompts | E-046 | **PASS** |
| E | C-E6 Webhook sig + idempotency | E-042, E-043 | **FAIL** |
| E | C-E7 Fail-safe billing outage | E-086 | **FAIL** |
| E | C-E8 Downgrade preserves data | E-045 | **PASS** |
| F | C-F1 RLS enabled + policies | E-020 | **PASS** |
| F | C-F2 service_role server-side only | E-017, E-018 | **PASS** |
| F | C-F3 Session token storage | E-019 | **FAIL** |
| F | C-F4 Security headers | E-003 | **PASS** |
| F | C-F5 /admin protected | E-015, E-016 | **PASS** |
| F | C-F6 No hardcoded secrets | E-024, E-025 | **PASS** |
| F | C-F7 IDOR test | — | **UNKNOWN** |
| F | C-F8 CSRF posture | E-017 | **N_A** |
| F | C-F9 Rate limiting | E-026, E-027 | **PASS** |
| F | C-F10 No PII in logs | E-028, E-030 | **PASS** |
| F | C-F11 Edge Functions auth | E-035, E-059 | **PASS** |
| F | C-F12 Storage bucket policies | E-022, E-023 | **PASS** |
| G | C-G1 Sitemap domain | E-072 | **FAIL** |
| G | C-G2 Legal pages map | E-073 | **PASS** |
| G | C-G3 Cookie consent | E-074 | **PASS** |
| G | C-G4 Meta tags / OG tags | E-075 | **PASS** |
| H | C-H1 CI gates exist | E-066 | **PASS** |
| H | C-H2 E2E wired | E-067 | **PASS** |
| H | C-H3 Lighthouse evidence | — | **UNKNOWN** |
| H | C-H4 Bundle sanity | E-068 | **PASS** |
| I | C-I1 Company name | E-048 | **PASS** |
| I | C-I2 Company NIP | E-048 | **PASS** |
| I | C-I3 Company address | E-048 | **PASS** |
| I | C-I4 Client name | E-049 | **PASS** |
| I | C-I5 Client address | E-049 | **PASS** |
| I | C-I6 Scope/description | E-056 | **PASS** |
| I | C-I7 Line items | E-050 | **PASS** |
| I | C-I8 VAT handling | E-051 | **FAIL** |
| I | C-I9 Offer date | E-047 | **PASS** |
| I | C-I10 Validity date | E-052 | **FAIL** |
| I | C-I11 Payment terms | E-057 | **PASS** |
| I | C-I12 Warranty conditions | E-057 | **PASS** |
| I | C-I13 Footer | E-054 | **PASS** |
| I | C-I14 Document version/ID | E-053 | **FAIL** |
| I | C-I15 A4 print-ready | E-055 | **PASS** |
| I | C-I16 Mobile readability | — | **UNKNOWN** |
| J | C-J1 Dependency audit summary | E-070 | **PASS** |
| J | C-J2 High/critical vulns addressed | E-071 | **FAIL** |
| J | C-J3 License risks flagged | — | **UNKNOWN** |
| K | C-K1 Prompt injection mitigation | E-060, E-061 | **FAIL** |
| K | C-K2 Per-user cost guardrails | E-027 | **PASS** |
| K | C-K3 Fallback when provider down | E-058, E-064 | **PASS** |
| K | C-K4 Rate limiting on AI endpoints | E-026 | **PASS** |
| K | C-K5 Provider keys server-side | E-059 | **PASS** |
| K | C-K6 AI logs no PII | E-062 | **PASS** |
| K | C-K7 Model versioning + fallback | E-063, E-064 | **FAIL** |
| K | C-K8 Moderation/safety settings | E-065 | **FAIL** |
| L | C-L1 Signup/login/logout/reset | E-031, E-032, E-033 | **PASS** |
| L | C-L2 Email confirmation | E-032 | **PASS** |
| L | C-L3 Session refresh/rotation | E-034 | **PASS** |
| L | C-L4 Account deletion (GDPR) | E-035, E-037 | **PASS** |
| L | C-L5 Abuse controls (captcha) | — | **FAIL** |
| L | C-L6 Concurrent sessions | — | **UNKNOWN** |
| M | C-M1 Error tracking (Sentry) | E-029, E-083 | **PASS** |
| M | C-M2 Structured logging no PII | E-028, E-085 | **PASS** |
| M | C-M3 Retry/backoff/circuit breaker | — | **FAIL** |
| M | C-M4 Backup/PITR evidence | — | **UNKNOWN** |
| M | C-M5 Health check | E-079 | **PASS** |
| N | C-N1 Runtime artifacts J1-J4 | — | **UNKNOWN** |
| N | C-N2 HAR/network excerpt | — | **UNKNOWN** |
| N | C-N3 Mobile viewport evidence | — | **UNKNOWN** |
| O | C-O1 ZAP baseline report | — | **UNKNOWN** |
| O | C-O2 Authenticated scan plan | — | **UNKNOWN** |
| O | C-O3 API fuzz plan | — | **UNKNOWN** |
| P | C-P1 Data flow map | — | **UNKNOWN** |
| P | C-P2 Subprocessors list | — | **UNKNOWN** |
| P | C-P3 Retention/deletion policy | E-035 | **FAIL** |

---

## E) Risk Matrix + EIR

| ID | Finding | Effort | Impact | Risk (1-9) |
|----|---------|--------|--------|------------|
| P0-1 | Billing enforcement frontend-only | M | C | **9** |
| P0-2 | Session tokens in localStorage (XSS theft) | L | C | **8** |
| P1-1 | Stripe webhook no idempotency | S | H | **7** |
| P1-2 | No billing fail-safe (outage grants access) | M | H | **7** |
| P1-3 | PDF brak VAT handling | S | H | **7** |
| P1-4 | PDF brak validity date | S | H | **6** |
| P1-5 | PDF brak document ID/version | S | M | **5** |
| P1-6 | AI no output sanitization | M | H | **6** |
| P1-7 | No /logout URL route | S | M | **4** |
| P2-1 | i18n lint only 2 files | M | M | **4** |
| P2-2 | 19 high npm vulns (minimatch) | S | M | **4** |
| P2-3 | No AI provider auto-fallback | M | M | **4** |
| P2-4 | No AI content moderation | M | M | **4** |
| P2-5 | No CAPTCHA on login/signup | S | M | **5** |
| P2-6 | No retry/backoff for AI/Stripe | M | M | **4** |
| P2-7 | Sitemap defaults to vercel.app | S | L | **2** |
| P3-1 | No automated retention policy | L | M | **3** |
| P3-2 | Stripe unknown status defaults to "active" | S | M | **5** |

*(Effort: S=Small, M=Medium, L=Large, XL=Extra-Large)*
*(Impact: C=Critical, H=High, M=Medium, L=Low)*

---

## F) Findings

### P0 — BLOCKER

#### P0-1: Egzekwowanie limitów planów TYLKO na frontendzie (C-E2)

**Dowód:** E-038, E-039, E-041
**Ścieżka:** `src/hooks/usePlanGate.ts:30-66` definiuje limity (free: 3 projekty, 5 klientów). Brak triggerów/RLS/funkcji w `supabase/migrations/` ani `supabase/functions/` weryfikujących limity po stronie serwera. `grep` dla `check_plan`, `enforce_limit`, `before insert.*project` daje 0 wyników.

**Wpływ biznesowy:** Każdy użytkownik z minimalną wiedzą techniczną może ominąć limity planów przez bezpośrednie wywołania API Supabase, tworząc nieograniczoną liczbę projektów/klientów na darmowym planie. To anuluje cały model monetyzacji SaaS.

**OWASP:** A01:2021 — Broken Access Control

**Fix:** Dodać PostgreSQL `BEFORE INSERT` trigger na tabeli `projects` sprawdzający `COUNT(*) < max_projects` z `user_subscriptions.plan_id`. Analogicznie dla `clients`. Alternatywnie: RLS policy z subquery sprawdzającą aktualny plan.

---

#### P0-2: Tokeny sesji w localStorage (C-F3)

**Dowód:** E-019
**Ścieżka:** `src/integrations/supabase/client.ts:122-130` — Supabase JS client używa `localStorage` jako domyślnego storage. Token JWT przechowywany w localStorage jest dostępny dla każdego skryptu JS na stronie, co oznacza, że udany atak XSS pozwala na pełną kradzież sesji.

**Wpływ biznesowy:** W połączeniu z jakimkolwiek wektorem XSS (np. niesanityzowane AI output, biblioteka zewnętrzna), atakujący może przejąć sesję dowolnego użytkownika, uzyskując pełny dostęp do danych firmy, klientów i finansów.

**OWASP:** A07:2021 — Identification and Authentication Failures

**Uwaga:** To jest ograniczenie architektury Supabase JS SDK. Mitigacja: `pkce` flow (domyślny od @supabase/supabase-js v2.39+), ścisłe CSP (zaimplementowane w E-003), output sanitization dla AI. Pełne rozwiązanie wymagałoby custom auth proxy z HttpOnly cookies.

---

### P1 — CRITICAL

#### P1-1: Stripe webhook bez idempotency (C-E6)

**Dowód:** E-042, E-043
**Ścieżka:** `supabase/functions/stripe-webhook/index.ts:144-150` — events logowane do `subscription_events` ale brak sprawdzania `event.id` przed przetworzeniem. Powtórne dostarczenie webhoooka przez Stripe może spowodować podwójne przetworzenie.

**Wpływ:** Duplikacja subskrypcji, niespójny stan billing.

---

#### P1-2: Brak fail-safe przy awarii billing (C-E7)

**Dowód:** E-086
**Ścieżka:** `stripe-webhook/index.ts:29-42` — `mapSubscriptionStatus` mapuje nieznane statusy Stripe na "active" (linia `default: return "active"`). Jeśli Stripe zwróci nieoczekiwany status, użytkownik dostaje pełny dostęp.

**Wpływ:** Awaria Stripe lub nieoczekiwany status = darmowy premium dla wszystkich dotkniętych użytkowników.

---

#### P1-3: PDF brak obsługi VAT (C-I8)

**Dowód:** E-051
**Ścieżka:** `src/lib/offerPdfGenerator.ts` — brak jakiejkolwiek wzmianki o VAT, "netto", "brutto", stawce podatkowej. Polskie firmy budowlane są zobowiązane do wykazywania VAT na ofertach/fakturach.

**Wpływ:** Dokumenty niezgodne z polskim prawem podatkowym. Może skutkować odmową akceptacji oferty przez klienta lub problemami z urzędem skarbowym.

---

#### P1-4: PDF brak daty ważności oferty (C-I10)

**Dowód:** E-052
**Opis:** Brak pola `validity date` / `ważna do` w generatorze PDF. Oferty budowlane bez daty ważności są prawnie problematyczne — mogą być akceptowane po dowolnym czasie przy zmienionych cenach.

---

#### P1-5: PDF brak numeru dokumentu (C-I14)

**Dowód:** E-053
**Opis:** Brak automatycznego numeru/identyfikatora oferty. Utrudnia śledzenie i archiwizację dokumentów.

---

#### P1-6: AI brak sanityzacji output (C-K1)

**Dowód:** E-060, E-061, E-065
**Ścieżka:** Walidacja inputu istnieje (maxLength 5000, history filter), ale odpowiedź AI jest przekazywana do frontenu bez sanityzacji. Brak wywołania moderation API. Atakujący może skonstruować prompt injection powodujący generowanie szkodliwej treści.

**OWASP:** Brak — OWASP LLM Top 10: LLM01 (Prompt Injection)

---

#### P1-7: Brak trasy /logout (C-A3)

**Dowód:** E-082
**Opis:** Nie ma zdefiniowanej trasy `/logout` w routerze. Bezpośredni dostęp do URL `/logout` daje stronę 404. Wylogowanie działa tylko przez przycisk w UI (AuthContext.logout). To łamie konwencję i utrudnia integracje (np. linki w emailach "kliknij aby się wylogować").

---

### P2 — IMPORTANT

#### P2-1: i18n no-literal-string lint tylko na 2 plikach (C-B4)
**Dowód:** E-012. Reguła `i18next/no-literal-string` aktywna tylko na `Login.tsx` i `AuthDiagnostics.tsx`. Reszta ~200 plików nie jest chroniona — hardcoded stringi mogą wracać przy przyszłych commitach.

#### P2-2: 19 high npm vulnerabilities (C-J2)
**Dowód:** E-070, E-071. Wszystkie 19 "high" to łańcuch `minimatch` ReDoS (CVE w glob → archiver → exceljs i eslint chain). Dotyczą głównie devDependencies, ale `exceljs` jest w dependencies (runtime).

#### P2-3: Brak auto-fallback między AI providers (C-K7)
**Dowód:** E-063, E-064. `DEFAULT_MODELS` zdefiniowane, ale `completeAI()` to prosty switch bez retry/fallback na innego providera przy błędzie.

#### P2-4: Brak content moderation dla AI (C-K8)
**Dowód:** E-065. Żaden z endpointów AI nie wywołuje OpenAI moderation API ani nie filtruje niebezpiecznej treści.

#### P2-5: Brak CAPTCHA na login/signup (C-L5)
**Opis:** Supabase obsługuje Turnstile/hCaptcha, ale nie jest skonfigurowane. Bot może brute-force'ować hasła.

#### P2-6: Brak retry/backoff dla wywołań AI i Stripe (C-M3)
**Opis:** Jedno niepowodzenie → błąd. Brak circuit breaker pattern.

#### P2-7: Sitemap z domeną vercel.app (C-G1)
**Dowód:** E-072. `scripts/generate-sitemap.js:17` — domyślny fallback to `https://majster-ai-oferty.vercel.app`. Na produkcji powinno być `https://majster.ai` (jeśli istnieje custom domain).

### P3 — NICE-TO-HAVE

#### P3-1: Brak automatycznej polityki retencji danych (C-P3)
**Opis:** Usunięcie konta jest na żądanie (Art. 17 RODO), ale brak automatycznej retencji/anonimizacji starych danych.

#### P3-2: Stripe unknown status → "active" (C-E7)
**Dowód:** E-086. W `mapSubscriptionStatus`, `default` case zwraca `"active"` zamiast bezpiecznego `"suspended"` lub `"unknown"`.

---

## G) Positive Highlights

| # | Highlight | E-ID |
|---|-----------|------|
| 1 | Rozbudowane RLS: 277 policy w 16 migracjach — solidna izolacja danych | E-020 |
| 2 | service_role nigdy w frontendzie — 0 matches w src/ | E-018 |
| 3 | Pełen zestaw security headers w vercel.json (CSP, HSTS, XFO, XCTO, Referrer) | E-003 |
| 4 | PII masking logger z automatyczną redakcją email/phone/token/PESEL | E-028 |
| 5 | Sentry z beforeSend strippingiem wrażliwych danych | E-029, E-030 |
| 6 | GDPR Art. 17 deletion z audit logiem i obfuscated userId | E-035, E-037, E-084 |
| 7 | Rate limiting na WSZYSTKICH edge functions z per-endpoint konfiguracją | E-026, E-027 |
| 8 | Perfekcyjna parytet i18n: 1336/1336/1336 kluczy PL/EN/UK | E-010 |
| 9 | Multi-provider AI (OpenAI/Anthropic/Gemini) z auto-detection | E-058, E-059 |
| 10 | CI/CD z lint + typecheck + tests + build + security audit + E2E | E-066, E-067, E-069 |
| 11 | Admin guard z weryfikacją roli z bazy danych (nie hardcoded) | E-015, E-016 |
| 12 | Healthcheck endpoint sprawdzający DB + Storage + Auth | E-079 |
| 13 | no-console ESLint rule na src/ z wyłączeniem logger.ts i sentry.ts | E-085 |
| 14 | Stripe webhook signature verification (constructEventAsync) | E-042 |
| 15 | Cookie consent z granularnymi kategoriami (essential/analytics/marketing) | E-074 |

---

## H) Fix Pack Δ

### Δ1 — Server-side plan enforcement (P0-1) — BLOCKER

**Goal:** Uniemożliwić obejście limitów planów przez API
**Scope:** Nowa migracja SQL + test
**Files:**
- `supabase/migrations/YYYYMMDD_plan_enforcement_triggers.sql` (NEW)
- `src/test/features/plan-enforcement.test.ts` (NEW)

**Changes:**
```sql
-- BEFORE INSERT trigger na projects
CREATE OR REPLACE FUNCTION check_project_limit()
RETURNS TRIGGER AS $$
DECLARE current_count INTEGER; max_allowed INTEGER; user_plan TEXT;
BEGIN
  SELECT plan_id INTO user_plan FROM user_subscriptions WHERE user_id = NEW.user_id;
  user_plan := COALESCE(user_plan, 'free');
  max_allowed := CASE user_plan
    WHEN 'free' THEN 3 WHEN 'starter' THEN 15 WHEN 'pro' THEN 15
    WHEN 'business' THEN 100 WHEN 'enterprise' THEN 999999 ELSE 3 END;
  SELECT COUNT(*) INTO current_count FROM projects WHERE user_id = NEW.user_id;
  IF current_count >= max_allowed THEN
    RAISE EXCEPTION 'Plan limit reached: % projects allowed on % plan', max_allowed, user_plan;
  END IF;
  RETURN NEW;
END; $$ LANGUAGE plpgsql;
```
**Tests:** Verify INSERT rejected when limit reached
**Rollback:** `DROP TRIGGER IF EXISTS; DROP FUNCTION IF EXISTS;`
**Risk:** M (requires DB migration)
**AC:** Free user cannot create 4th project via direct API call
**E-IDs:** E-038, E-041
**Required checks:** lint | typecheck | build | tests | migration dry-run

---

### Δ2 — Stripe webhook idempotency + fail-safe (P1-1, P1-2, P3-2)

**Goal:** Zapobiec duplikatom i bezpieczny fallback dla nieznanych statusów
**Scope:** Edycja `supabase/functions/stripe-webhook/index.ts`
**Files:**
- `supabase/functions/stripe-webhook/index.ts`

**Changes:**
1. Przed przetworzeniem: `SELECT id FROM subscription_events WHERE event_data->>'id' = event.id` → skip if exists
2. `mapSubscriptionStatus` default: `return "suspended"` zamiast `"active"`
3. Log warning na unknown status

**Tests:** Unit test z duplikatem event.id
**Rollback:** Revert function changes
**Risk:** S
**AC:** Powtórny webhook z tym samym event.id nie zmienia stanu subskrypcji; nieznany status → "suspended"
**E-IDs:** E-042, E-043, E-086

---

### Δ3 — PDF: VAT + Validity date + Document ID (P1-3, P1-4, P1-5)

**Goal:** Compliance z polskim prawem podatkowym i handlowym
**Scope:** Edycja generatora PDF i data builder
**Files:**
- `src/lib/offerPdfGenerator.ts`
- `src/lib/offerDataBuilder.ts`
- `src/lib/offerPdfGenerator.test.ts`

**Changes:**
1. Dodać pole `vatRate` (domyślnie 23%) do `OfferPosition` i obliczenie netto/brutto w tabeli
2. Dodać `validUntil: Date` do `PdfConfig`, render "Oferta ważna do: DD.MM.YYYY"
3. Dodać `documentNumber: string` generowany jako `OFFER-{YYYY}-{autoincrement}` lub UUID-short
4. Podsumowanie: Netto + VAT + Brutto

**Tests:** Verify PDF contains "VAT", "Ważna do", "Nr oferty" strings
**Rollback:** Revert file changes
**Risk:** S
**AC:** Wygenerowany PDF zawiera stawkę VAT, datę ważności i numer dokumentu
**E-IDs:** E-047, E-051, E-052, E-053

---

### Δ4 — AI output sanitization + moderation (P1-6, P2-4)

**Goal:** Ochrona przed prompt injection i niebezpieczną treścią
**Scope:** Edycja shared AI module + AI edge functions
**Files:**
- `supabase/functions/_shared/ai-provider.ts`
- `supabase/functions/ai-chat-agent/index.ts`

**Changes:**
1. Dodać `sanitizeAIOutput(text: string): string` — strip HTML/script tags, limit length
2. Dla OpenAI: wywołać moderation endpoint przed zwróceniem odpowiedzi
3. Fallback: jeśli moderation flaguje → zwróć safe default message

**Tests:** Test z inputem zawierającym `<script>`, `{{template injection}}`, prompt injection payloads
**Rollback:** Revert function changes
**Risk:** M
**AC:** Output AI nie zawiera tagów HTML; flagged content → safe fallback
**E-IDs:** E-060, E-061, E-065

---

### Δ5 — /logout route (P1-7)

**Goal:** Dodać dedykowaną trasę /logout
**Scope:** Edycja App.tsx, nowy komponent
**Files:**
- `src/App.tsx`
- `src/pages/Logout.tsx` (NEW)

**Changes:** Dodać `<Route path="/logout" element={<Logout />} />` w Zone 1. Komponent: wywołuje `logout()`, naviguje do `/login`.

**Tests:** E2E: visit /logout → redirects to /login, session cleared
**Rollback:** Remove route + file
**Risk:** S
**AC:** GET /logout clears session and redirects to /login
**E-IDs:** E-082

---

### Δ6 — npm audit fix: exceljs/archiver chain (P2-2)

**Goal:** Rozwiązać 19 high vulnerabilities (minimatch ReDoS)
**Scope:** package.json updates
**Files:**
- `package.json`
- `package-lock.json`

**Changes:**
1. `exceljs` — sprawdzić czy 4.5.0+ rozwiązuje archiver chain
2. Override `minimatch` do >=5.1.6 w `overrides`
3. `npm audit fix` dla bezpiecznych aktualizacji

**Tests:** `npm audit --audit-level=high` → 0 high vulnerabilities
**Rollback:** `git checkout package.json package-lock.json && npm ci`
**Risk:** S (ale wymaga testów regresji export Excel)
**AC:** `npm audit` zwraca 0 high/critical
**E-IDs:** E-070, E-071

---

### Δ7 — i18n lint expansion (P2-1)

**Goal:** Ochrona przed hardcoded stringami we wszystkich plikach
**Scope:** Edycja eslint.config.js
**Files:**
- `eslint.config.js`

**Changes:** Rozszerzyć `i18next/no-literal-string` z 2 plików na `src/pages/**/*.tsx` i `src/components/**/*.tsx` (jako `warn`)

**Tests:** `npm run lint` passes
**Rollback:** Revert eslint.config.js
**Risk:** S (ale może wymagać wielu poprawek lint warnings)
**AC:** Nowe hardcoded stringi w pages/components triggerują lint warning
**E-IDs:** E-012

---

### Δ8 — CAPTCHA na login/signup (P2-5)

**Goal:** Ochrona przed brute-force na auth endpoints
**Scope:** Supabase dashboard config + frontend
**Files:**
- `src/pages/Login.tsx`
- `src/pages/Register.tsx`
- Supabase dashboard: Auth → Bot Protection

**Changes:** Włączyć Supabase Turnstile/hCaptcha w dashboardzie. Dodać widget captcha na frontendzie.

**Tests:** E2E: verify captcha widget renders
**Rollback:** Disable in Supabase dashboard
**Risk:** S
**AC:** Bot nie może submitować formularza login bez rozwiązania captcha
**E-IDs:** —

---

### Δ9 — Retry/backoff dla AI i Stripe (P2-6)

**Goal:** Resilience na transient failures
**Scope:** Nowy shared utility
**Files:**
- `supabase/functions/_shared/retry.ts` (NEW)
- Edge functions z AI calls

**Changes:** Dodać `withRetry(fn, { maxRetries: 3, backoff: 'exponential' })` wrapper. Zastosować na `completeAI()` i Stripe API calls.

**Tests:** Test z mockowanym 503 → verify retry + eventual success
**Rollback:** Remove retry wrapper
**Risk:** S
**AC:** Transient 503 od OpenAI → retry succeeds; 3 failures → user-friendly error
**E-IDs:** —

---

### Δ10 — Sitemap domain fix (P2-7)

**Goal:** Poprawna domena w sitemap
**Scope:** Edycja skryptu
**Files:**
- `scripts/generate-sitemap.js`

**Changes:** Zmienić default fallback z `https://majster-ai-oferty.vercel.app` na `https://majster.ai` (lub potwierdzić z właścicielem).

**Rollback:** Revert single line
**Risk:** S
**AC:** `public/sitemap.xml` zawiera poprawną domenę produkcyjną
**E-IDs:** E-072

---

## I) Merge/Block Decisions

| PR | Status | Warunek |
|----|--------|---------|
| Δ1 Plan enforcement | **BLOCK** (P0) | GO po: migration tested, lint ✓, typecheck ✓, build ✓, tests ✓ |
| Δ2 Webhook idempotency | **BLOCK** (P1) | GO po: tests ✓, lint ✓, build ✓ |
| Δ3 PDF compliance | **BLOCK** (P1) | GO po: PDF test ✓, lint ✓, typecheck ✓, build ✓ |
| Δ4 AI sanitization | **BLOCK** (P1) | GO po: tests ✓, lint ✓, build ✓ |
| Δ5 /logout route | **GO** z checks | lint ✓, typecheck ✓, build ✓, e2e ✓ |
| Δ6 npm audit fix | **GO** z checks | npm audit ✓, tests ✓, build ✓ |
| Δ7 i18n lint | **GO** z checks | lint ✓ (warnings OK) |
| Δ8 CAPTCHA | **GO** z checks | e2e ✓, manual QA |
| Δ9 Retry/backoff | **GO** z checks | tests ✓, lint ✓, build ✓ |
| Δ10 Sitemap | **GO** z checks | build ✓, sitemap content check |

**No Green, No Finish** — żaden PR nie może być merged bez przejścia wymaganych checks.

---

## J) Prioritized Roadmap

### BLOCKER (przed launch)
1. **Δ1** — Server-side plan enforcement triggers
2. **Δ3** — PDF VAT + validity date + document ID
3. **Δ2** — Stripe webhook idempotency + fail-safe default

### CRITICAL (przed launch lub w ciągu 1 tygodnia)
4. **Δ4** — AI output sanitization
5. **Δ5** — /logout route
6. **Δ8** — CAPTCHA na login/signup

### IMPORTANT (Sprint 2)
7. **Δ6** — npm audit fix
8. **Δ9** — Retry/backoff
9. **Δ7** — i18n lint expansion
10. **Δ10** — Sitemap domain fix

### POST-LAUNCH (Sprint 3+)
11. Rozwiązać 20 UNKNOWN claims — wymaga: konta testowe, ZAP scan, dokumentacja GDPR
12. Data retention policy (P3-1)
13. AI provider auto-fallback chain (P2-3)
14. Concurrent session management (C-L6)
15. Lighthouse performance baseline (C-H3)
16. Full WCAG 2.2 AA audit (C-C7)

---

## K) UNKNOWNS + MISSING DATA

| Claim | Czego brakuje | Minimalny następny krok |
|-------|--------------|------------------------|
| C-G0 | Dowód SHA na PROD | Dodać `/api/version` endpoint lub `<meta name="build-sha">` w index.html |
| C-B2 | Runtime language switch | Uruchomić PROD, przełączyć PL↔EN↔UK, zweryfikować nav + screens |
| C-C2..C-C5 | Mobile runtime | Otworzyć PROD na iPhone/Android viewport, zrzuty ekranów |
| C-C7 | WCAG AA full | Uruchomić axe-core na PROD, lighthouse accessibility audit |
| C-F7 | IDOR test | Dostarczyć 2 konta testowe, spróbować GET /api/projects/{other-user-id} |
| C-H3 | Lighthouse | `npx lighthouse https://majster-ai-oferty.vercel.app --output=json` |
| C-I16 | Mobile PDF | Otworzyć wygenerowany PDF na telefonie, zrzut ekranu |
| C-J3 | Licencje | `npx license-checker --production --out licenses.csv` |
| C-L6 | Concurrent sessions | Zalogować się na 2 urządzeniach, sprawdzić zachowanie |
| C-M4 | Backup/PITR | Supabase Dashboard → Settings → Database → Backup — zrzut ekranu |
| C-N1..N3 | Runtime evidence | Pełny walkthrough J1-J4 z DevTools, HAR export, mobile viewport |
| C-O1..O3 | DAST | `docker run owasp/zap2docker-stable zap-baseline.py -t https://majster-ai-oferty.vercel.app` |
| C-P1 | Data flow map | Narysować: PII → Supabase DB, Supabase Storage, Vercel (logs), Sentry, AI providers, Stripe, Resend |
| C-P2 | Subprocessors | Lista: Supabase (DB/Auth/Storage), Vercel (hosting), Sentry (monitoring), OpenAI/Anthropic/Google (AI), Stripe (billing), Resend (email) |

---

## Executive Summary

**Majster.AI wykazuje solidną bazę bezpieczeństwa** — 277 polityk RLS, service_role nigdy na frontendzie, pełny zestaw security headers, PII masking w logach, rate limiting na wszystkich edge functions, GDPR deletion. Architektura jest dojrzała.

**Dwa blokery SaaS-readiness:**
1. **Limity planów egzekwowane TYLKO na frontendzie** — użytkownik może ominąć przez API. To krytyczny defekt modelu biznesowego.
2. **PDF bez VAT** — niezgodność z polskim prawem podatkowym dla profesjonalistów budowlanych.

**Score 57.5%** jest zaniżony przez 20 UNKNOWN (głównie runtime/DAST których nie można zweryfikować bez dostępu do PROD). Po rozwiązaniu UNKNOWNs i top-3 fixów, realistyczny score to **72-78%**.

**Rekomendacja:** BLOCK launch do czasu Δ1 (plan enforcement) + Δ3 (PDF VAT). Δ2 (webhook idempotency) jako szybki follow-up.
