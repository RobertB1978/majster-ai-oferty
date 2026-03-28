# Audyt Hybrydowy — Surowe Ustalenia (Raw Findings)

**Data:** 2026-03-28
**Tryb:** RESEARCH STATIC-ONLY (brak runtime, brak przeglądarki, brak node_modules)
**Branch:** `claude/audit-research-reconciliation-ANtpX`
**Audytor:** Claude Opus 4.6 (Principal SaaS Auditor — tryb badawczy)

---

## FAZA 0 — PRE-FLIGHT

| Parametr | Wartość |
|----------|---------|
| Katalog roboczy | `/home/user/majster-ai-oferty` |
| Branch | `claude/audit-research-reconciliation-ANtpX` |
| Git status | Czysty (brak zmian niestageowanych) |
| node_modules | **BRAK** — analiza statyczna jedynie |
| Package manager | npm 10.9.2 (wymuszony w `preinstall`) |
| Stack | Vite 5.4 + React 18.3 + TypeScript 5.8 (SPA) |
| Wersja aplikacji | v0.2.0 (package.json) |
| Tryb przeglądarki | **NIE** — brak runtime |
| Tryb końcowy | **RESEARCH STATIC-ONLY** |

---

## FAZA 1 — INWENTARZ

### 1.1 Struktura repozytorium

| Element | Liczba/Opis |
|---------|-------------|
| Pliki TS/TSX w `src/` | ~500 |
| Strony (pages/) | 40+ plików |
| Komponenty React | ~215 |
| Custom hooks | ~72 |
| Pliki testowe | ~68 plików testowych w `src/test/` |
| Lokalizacje i18n | 3 (pl, en, uk) — po 5151 linii każdy |
| Migracje Supabase | 56 plików (2025-12-05 → 2026-03-26) |
| Edge Functions | 22 funkcje (w tym `_shared`) |
| Workflows CI | 7 plików w `.github/workflows/` |
| Pliki ADR | 12 decyzji architektonicznych |
| Dokumenty w `docs/` | 90+ plików MD + podkatalogi |

### 1.2 Dokumentacja już obecna

**Raporty audytowe (historyczne):**
- `AUDIT_REPORT_2025-12-12.md` — pierwszy audit
- `AUDIT_REPORT_v6.3_2026-02-23.md` — ocena 57.5%
- `FINAL_GRADE_2026.md` — ocena A+ (95/100) — grudzień 2025
- `docs/AUDIT_360_2026-03-11.md` — launch readiness 6/10
- `docs/FINAL_CLOSING_AUDIT_2026-03-13.md` — conditional beta 7/10
- `docs/FULL_AUDIT_REPORT_2026-03-18.md` — ocena 8.2/10
- `docs/FULL_AUDIT_REPORT_V2_2026-03-18.md` — skorygowana 7.8/10
- Oraz ~15 dodatkowych raportów i supplementów

**Dokumentacja operacyjna:**
- `docs/DEPLOYMENT_TRUTH.md` — kanoniczna ścieżka deploy
- `docs/TRUTH.md` — baseline reconciliation
- `docs/LAUNCH_CHECKLIST.md` — gate decisions
- `docs/CI_STATUS.md` — stan CI (2026-03-19)
- `docs/KNOWN_ISSUES.md` — znane problemy
- `docs/SECURITY_BASELINE.md` — baseline bezpieczeństwa
- `docs/SENTRY_SETUP.md` — konfiguracja error tracking
- `docs/STRIPE_SETUP.md` — konfiguracja płatności
- `docs/COMPLIANCE/` — GDPR, usuwanie konta, inspekcje

**ADR (Architecture Decision Records):**
- ADR-0000: Source of truth
- ADR-0001: Current stack fact (Vite/React, nie Next.js)
- ADR-0002: CSP frame-ancestors
- ADR-0003: Field OS refactor
- ADR-0004: Free tier limit
- ADR-0005: Shell feature flag (FF_NEW_SHELL)
- ADR-0006: QR status scope
- ADR-0007: Burn bar basic
- ADR-0008: Offline minimum
- ADR-0009: Onboarding scope
- ADR-0010: Compliance inspections source of truth
- ADR-0012: Admin RBAC route split

### 1.3 Workflows CI/CD

| Workflow | Trigger | Blokuje merge? | Uwagi |
|----------|---------|----------------|-------|
| `ci.yml` | push/PR main,develop | **TAK** | lint + test + build + security |
| `deployment-truth.yml` | push main + PR | **CZĘŚCIOWE** | Jedyny autoryzowany deploy do prod |
| `supabase-deploy.yml` | PR (tylko veryfikacja) | **TAK** | Walidacja migracji, brak deploy |
| `e2e.yml` | push/PR main,develop | **TAK** | 12 testów Playwright |
| `i18n-ci.yml` | push/PR main,develop | **TAK** | Parytet kluczy, hardcoded strings |
| `bundle-analysis.yml` | push/PR main | **NIE** | Informacyjny |
| `security.yml` | push/PR + cron poniedziałek | **CZĘŚCIOWE** | npm audit (critical-only) + CodeQL |

### 1.4 Supabase — struktura

- **config.toml:** Project ID `xwxvqhhnozfrjcjmcltv`
- **56 migracji** (2025-12-05 → 2026-03-26)
- **22 Edge Functions** (10 z JWT, 8 publicznych/cron/webhook)
- **Folder `policies/`** z template'em RLS
- **`verify_database.sql`** — skrypt weryfikacyjny

### 1.5 Skrypty weryfikacyjne (`scripts/verify/`)

| Skrypt | Funkcja |
|--------|---------|
| `repo_inventory.sh` | Diagnostyka repo (branch, stack, counts) |
| `supabase_pipeline_check.sh` | Walidacja kanonicznego workflow |
| `vercel_pipeline_check.sh` | Sprawdzenie gotowości Vercel |

### 1.6 Dowody observability

| Element | Status |
|---------|--------|
| Sentry (error tracking) | KOD GOTOWY, DSN niekonfigurowany |
| Plausible (analytics) | Skrypt w `index.html`, domena `majsterai.com` |
| Web Vitals | Zintegrowane z Sentry |
| Version tracking | `APP_VERSION` v0.2.0, tagowane w Sentry |

### 1.7 Dowody billing/Stripe

| Element | Status |
|---------|--------|
| Stripe webhook handler | Kod gotowy (`stripe-webhook/`) |
| Checkout session | Kod gotowy (`create-checkout-session/`) |
| Customer portal | Kod gotowy (`customer-portal/`) |
| Idempotencja webhook | Tabela `stripe_events` |
| Konfiguracja cenowa | **BRAK** — wymaga Stripe Dashboard + secrets |

### 1.8 Feature flags

| Flag | Typ | Opis |
|------|-----|------|
| `FF_NEW_SHELL` | env/localStorage | Przełącznik UI shell (ADR-0005) |
| `usePlanGate` | DB (plan_slug) | Gating AI/premium features |

Brak zewnętrznego systemu feature flags (LaunchDarkly itp.).

### 1.9 Dowody prawne/compliance

| Dokument | Ścieżka |
|----------|---------|
| Privacy Policy | `/legal/privacy` route + komponent |
| Terms of Service | `/legal/terms` route + komponent |
| Cookies Policy | `/legal/cookies` route + komponent |
| DPA | `/legal/dpa` route + komponent |
| GDPR/RODO Center | `/legal/rodo` route + komponent |
| Cookie Consent | 3 kategorie: essential/analytics/marketing |
| Account Deletion | GDPR Art. 17 — pełna implementacja |
| Compliance docs | `docs/COMPLIANCE/` — usuwanie konta, inspekcje |

### 1.10 Husky pre-commit

- Plik: `.husky/pre-commit`
- Komenda: `npm run type-check && npm run lint`
- **UWAGA:** Wymaga `node_modules` (npm install) aby działać

---

## FAZA 4 — REPO / INFRA TRUTH CHECK

### 4.1 Struktura routingu

**Strefy:**

| Strefa | Prefix | Auth | Rola |
|--------|--------|------|------|
| Publiczna | `/`, `/login`, `/register`, `/legal/*`, `/offer/*`, `/a/*`, `/p/*`, `/d/*`, `/plany` | NIE | Brak |
| Aplikacja | `/app/*` | TAK (ProtectedRoute) | Dowolny zalogowany |
| Admin | `/admin/*` | TAK (AdminGuard) | `user_roles.role = 'admin'` |

**Routy aplikacji `/app/*`:**
- `/app/dashboard` — Dashboard (kanoniczny home)
- `/app/offers` — Lista ofert
- `/app/offers/new` — Nowa oferta (OfferDetail)
- `/app/offers/:id` — Edycja oferty
- `/app/projects` — Lista projektów
- `/app/projects/new` — Nowy projekt (V2)
- `/app/projects/:id` — ProjectHub
- `/app/customers` — Klienci (CRUD)
- `/app/calendar` — Kalendarz
- `/app/finance` — Finanse
- `/app/photos` — Zdjęcia
- `/app/szybka-wycena` — Quick Estimate
- `/app/quick-mode` — Quick Mode
- `/app/team` — Zespół
- `/app/marketplace` — Marketplace
- `/app/analytics` — Analityka
- `/app/templates` — Szablony pozycji
- `/app/plan` / `/app/billing` — Plan/Billing
- `/app/profile` — Profil firmy
- `/app/settings` — Ustawienia
- `/app/document-templates` — Szablony dokumentów
- `/app/more` — Ekran "więcej" (mobile)

**Routy admin `/admin/*`:**
- `/admin/dashboard` — Panel admin
- `/admin/users` — Zarządzanie użytkownikami
- `/admin/theme` — Personalizacja motywu

### 4.2 Admin / Auth / RBAC — dowody

| Element | Status | Dowód |
|---------|--------|-------|
| AdminGuard | ✅ ISTNIEJE | `src/components/layout/AdminGuard.tsx` — redirect dla nie-admin |
| AdminLayout | ✅ ISTNIEJE | Wraps AdminGuard + sidebar |
| useAdminRole | ✅ ISTNIEJE | Queries `user_roles` table, exposes `isAdmin` |
| RLS na user_roles | ✅ DOKUMENTOWANE | ADR-0012: users can only read own roles |
| grant_admin_role() | ✅ DOKUMENTOWANE | SECURITY DEFINER — only service_role |
| Separacja routów | ✅ PEŁNA | 3 strefy (public/app/admin) z oddzielnymi guardami |

**WNIOSEK:** Admin separation jest PRAWDZIWA i dobrze zaimplementowana. Prior claim "no true admin separation" jest **DENIED** na poziomie kodu.

### 4.3 Offer flow — dowody

| Element | Plik | Status |
|---------|------|--------|
| Lista ofert | `src/pages/Offers.tsx` | ISTNIEJE |
| Tworzenie/edycja | `src/pages/OfferDetail.tsx` | ISTNIEJE (route `/app/offers/new`) |
| PDF generation | `supabase/functions/generate-offer-pdf/` | ISTNIEJE |
| Email wysyłka | `supabase/functions/send-offer-email/` | ISTNIEJE |
| Akceptacja klienta | `src/pages/OfferPublicAccept.tsx` | ISTNIEJE |
| Publiczny widok | `src/pages/OfferPublicPage.tsx` | ISTNIEJE |
| Approval | `supabase/functions/approve-offer/` | ISTNIEJE |

**WNIOSEK:** Offer flow istnieje w kodzie. Claim "/app/offers/new broken" wymaga runtime verification — kod jest obecny i zarutowany.

### 4.4 Customer creation — dowody

| Element | Plik | Status |
|---------|------|--------|
| Klienci CRUD | `src/pages/Clients.tsx` | ISTNIEJE |
| Route | `/app/customers` | ZARUTOWANY |
| Nowy klient | `/app/customers?new=1` (redirect) | ZARUTOWANY |

**WNIOSEK:** Komponent klientów istnieje. Runtime verification potrzebna.

### 4.5 Dossier — dowody

| Element | Plik | Status |
|---------|------|--------|
| DossierPanel | `src/components/documents/DossierPanel.tsx` | ISTNIEJE |
| DossierShareModal | `src/components/documents/DossierShareModal.tsx` | ISTNIEJE |
| DossierPublicPage | `src/pages/DossierPublicPage.tsx` | ISTNIEJE |
| useDossier hook | `src/hooks/useDossier.ts` | ISTNIEJE |
| Public route | `/d/:token` | ZARUTOWANY |

**WNIOSEK:** Dossier jest zaimplementowany z pełnym share flow. Prior claim "Dossier broken" wymaga runtime test.

### 4.6 Photo Report — dowody

| Element | Plik | Status |
|---------|------|--------|
| Photos page | `src/pages/Photos.tsx` | ISTNIEJE |
| Photo report notes | `docs/PHOTO_REPORT_NOTES.md` | ISTNIEJE |
| analyze-photo function | `supabase/functions/analyze-photo/` | ISTNIEJE |
| Route | `/app/photos` | ZARUTOWANY |

**WNIOSEK:** Kod foto istnieje. Runtime verification potrzebna.

### 4.7 Warranty — dowody

| Element | Plik | Status |
|---------|------|--------|
| WarrantySection | `src/components/documents/WarrantySection.tsx` | ISTNIEJE |
| WarrantySection test | `src/components/documents/WarrantySection.test.tsx` | ISTNIEJE |
| useWarranty hook | `src/hooks/useWarranty.ts` | ISTNIEJE |
| warrantyPdfGenerator | `src/lib/warrantyPdfGenerator.ts` | ISTNIEJE |
| i18n klucze | Obecne w pl/en/uk.json | ISTNIEJE |

**WNIOSEK:** Warranty ma komponent, hook, test i PDF generator. Prior claim "Warranty save broken" wymaga runtime verification.

### 4.8 Calendar — dowody

| Element | Plik | Status |
|---------|------|--------|
| Calendar page | `src/pages/Calendar.tsx` | ISTNIEJE |
| Route | `/app/calendar` | ZARUTOWANY |
| CalendarSync | Feature flag = false (ukryty) | POTWIERDZONE w audycie 03-13 |

**WNIOSEK:** Kalendarz istnieje. Claim o timezone wymaga runtime test. CalendarSync poprawnie ukryty.

### 4.9 AI/Chat — dowody

| Element | Plik | Status |
|---------|------|--------|
| AiChatAgent | `src/components/ai/AiChatAgent.tsx` | ISTNIEJE (~200+ linii) |
| ai-chat-agent function | `supabase/functions/ai-chat-agent/` | ISTNIEJE |
| ai-quote-suggestions | `supabase/functions/ai-quote-suggestions/` | ISTNIEJE |
| voice-quote-processor | `supabase/functions/voice-quote-processor/` | ISTNIEJE |
| useAiChatHistory hook | `src/hooks/useAiChatHistory.ts` | ISTNIEJE |
| usePlanGate | Gating AI features by plan | ISTNIEJE |

**WNIOSEK:** AI chat istnieje w kodzie, jest gated przez usePlanGate. Wymaga API key (OPENAI/ANTHROPIC/GEMINI) do działania runtime. Claim "AI/chat absent" jest **DENIED** — kod jest obecny.

### 4.10 Cookie consent — dowody

**FAKT ZWERYFIKOWANY:** Cookie consent ma **3 kategorie** (essential/analytics/marketing) z:
- Granularne przełączniki (Switch UI)
- Opcje: Accept All / Essential Only / Save Selected
- Zapis do localStorage + bazy (user_consents table) dla GDPR
- Linki do Privacy Policy i Terms
- i18n (wszystkie teksty przetłumaczone)

**WNIOSEK:** Prior claim "coarse cookie consent only" jest **DENIED**. Consent jest granularny (3 kategorie).

### 4.11 i18n — dowody

| Element | Wartość |
|---------|---------|
| Lokalizacje | 3: pl, en, uk |
| Linii na lokalizację | 5151 (identyczne) |
| Parytet kluczy | Wymuszony przez CI (i18n-ci.yml) |
| ESLint reguła | i18next/no-literal-string |

**WNIOSEK:** i18n jest solidne z CI enforcement. 647 warnings w ESLint mogą wskazywać na resztkowe hardcoded strings.

### 4.12 PDF generation — dowody

| Element | Plik | Status |
|---------|------|--------|
| PdfGenerator page | `src/pages/PdfGenerator.tsx` | ISTNIEJE |
| generate-offer-pdf | `supabase/functions/generate-offer-pdf/` | ISTNIEJE |
| warrantyPdfGenerator | `src/lib/warrantyPdfGenerator.ts` | ISTNIEJE |
| templatePdfGenerator | `src/lib/templatePdfGenerator.ts` | ISTNIEJE |

### 4.13 CI gates — potwierdzone

Merge do main wymaga:
1. ✅ ESLint 0 errors
2. ✅ TypeScript 0 errors
3. ✅ Wszystkie testy pass
4. ✅ Coverage thresholds (lines≥40%, branches≥34%, functions≥33%)
5. ✅ Build bez błędów
6. ✅ Build z FF_NEW_SHELL=true
7. ✅ i18n key parity
8. ✅ npm audit (critical-only)
9. ✅ CodeQL brak krytycznych
10. ✅ E2E smoke tests pass

### 4.14 Security headers (vercel.json) — potwierdzone

- `X-Frame-Options: DENY`
- `X-Content-Type-Options: nosniff`
- `Strict-Transport-Security: max-age=31536000; includeSubDomains; preload`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy: camera=(), microphone=(), geolocation=()`
- `Cross-Origin-Opener-Policy: same-origin`
- CSP z explicit allowlist (self + Supabase + AI providers + Sentry + Plausible)

---

## NIEZNANE (UNKNOWNS)

| # | Element | Dlaczego nieznane |
|---|---------|-------------------|
| U-01 | Runtime poprawność `/app/offers/new` | Brak przeglądarki/runtime |
| U-02 | Runtime customer creation | Brak runtime |
| U-03 | Runtime Dossier share | Brak runtime |
| U-04 | Runtime Photo Report | Brak runtime |
| U-05 | Runtime Warranty save | Brak runtime |
| U-06 | Calendar timezone correctness | Brak runtime |
| U-07 | Stripe checkout z prawdziwymi Price IDs | Wymaga Stripe Dashboard |
| U-08 | Email delivery (RESEND_API_KEY) | Wymaga Supabase secrets |
| U-09 | Sentry DSN konfiguracja prod | Wymaga Vercel env vars |
| U-10 | AI features runtime (API keys) | Wymaga provider keys |
| U-11 | Stan bazy produkcyjnej (migracje pushed?) | Wymaga Supabase Dashboard |
| U-12 | Vercel deployment aktywny? | Wymaga Vercel Dashboard |
| U-13 | Google OAuth callback URL | Wymaga Auth config |
| U-14 | user_roles RLS policy na produkcji | Wymaga DB access |
| U-15 | Mobile/responsive behavior | Wymaga browser testing |
| U-16 | Bundle size aktualny | Brak node_modules/build |
| U-17 | npm audit vulnerabilities aktualne | Brak node_modules |
| U-18 | Repo-vs-production drift | Brak dostępu do prod |
| U-19 | E2E tests z auth user | Testy smoke bez auth |
| U-20 | Analytics URL leak (/app/analytics) | Wymaga runtime - audyt 03-13 zgłosił |

---

## SPRZECZNOŚCI

| # | Sprzeczność | Detale |
|---|-------------|--------|
| S-01 | Ocena A+ (95/100) vs 57.5% vs 7/10 vs 7.8/10 | Drastycznie różne oceny w różnych audytach (grudzień 2025 vs luty-marzec 2026). FINAL_GRADE_2026.md (A+) jest wyraźnie zawyżona lub mierzy inne kryteria. |
| S-02 | "1366 testów" vs "1113 testów" vs "866 testów" | Różne liczby testów w różnych raportach. CI_STATUS.md (03-19) mówi 1380. Prawdopodobnie wynik ewolucji kodu — nie sprzeczność, ale chronologiczna progresja. |
| S-03 | "Enterprise-ready" vs "Late Alpha / 60% MVP" | Raporty używają skrajnie różnych terminów dojrzałości. |
| S-04 | Cookie consent "coarse only" vs granularne 3 kategorie | Prior claim jest **błędny** — kod pokazuje granularne consent. |
| S-05 | "No true admin separation" vs AdminGuard + ADR-0012 | Prior claim jest **błędny** — RBAC jest pełne. |

---

## INDEKS DOWODÓW

| ID | Plik | Co potwierdza |
|----|------|---------------|
| E-001 | `src/components/layout/AdminGuard.tsx` | RBAC admin separation |
| E-002 | `src/hooks/useAdminRole.ts` | Role query from user_roles |
| E-003 | `docs/ADR/ADR-0012-admin-rbac-route-split.md` | Admin RBAC decision |
| E-004 | `src/components/legal/CookieConsent.tsx` | Granularne cookie consent |
| E-005 | `src/components/ai/AiChatAgent.tsx` | AI chat implementation |
| E-006 | `.github/workflows/ci.yml` | CI gates |
| E-007 | `.github/workflows/deployment-truth.yml` | Kanoniczny deploy |
| E-008 | `vercel.json` | Security headers + CSP |
| E-009 | `src/i18n/locales/*.json` | 3 lokalizacje, 5151 linii |
| E-010 | `supabase/config.toml` | Edge function JWT config |
| E-011 | `src/App.tsx` | Kompletny routing 3 stref |
| E-012 | `src/lib/sentry.ts` | Error tracking code |
| E-013 | `.husky/pre-commit` | Pre-commit hooks |
| E-014 | `scripts/verify/*.sh` | Pipeline verification scripts |
| E-015 | `docs/COMPLIANCE/ACCOUNT_DELETION.md` | GDPR Art. 17 |

---

*Dokument wygenerowany automatycznie w sesji audytowej 2026-03-28. Tryb: RESEARCH STATIC-ONLY.*
