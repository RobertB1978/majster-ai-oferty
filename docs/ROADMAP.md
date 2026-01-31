# MAJSTER.AI — ENTERPRISE ROADMAP v1.0

**Gold Standard · Existing App · PWA-first · Hidden Owner Panel**

> Ten dokument jest jedynym źródłem prawdy dla przebudowy Majster.AI.
> Nie podlega reinterpretacji. Nie może być rozszerzany bez zgody właściciela.
> Każda zmiana musi być zgodna z tym dokumentem.

---

## ZATWIERDZONE DECYZJE WŁAŚCICIELA

### Architektura (FINAL)
- Aplikacja pozostaje: **React 18 + Vite 5 + React Router 6** (SPA).
- **NIE migrujemy do Next.js** i **nie przebudowujemy od zera**.
- Bezpieczeństwo server-side realizujemy przez:
  - **Supabase RLS** (Row Level Security) — jedyna brama do danych.
  - **Supabase Edge Functions** — logika biznesowa po stronie serwera.
- Brak danych = logiczne 404/puste odpowiedzi dla nieuprawnionych.

### Panel zarządzania (FINAL)
- **Nie tworzymy `/owner-panel`.**
- Istniejący **`/admin` = Hidden Owner Panel**:
  - Brak linków w UI nawigacji dla zwykłych userów (już zrealizowane).
  - Twarde zabezpieczenie: **RLS + Edge Functions**.
  - Jeden panel, jedna baza prawdy.

### PWA (FINAL)
- Aplikacja **PWA-first**, instalowalna z przeglądarki.
- Brak publikacji w Google Play / App Store na etapie MVP.

### Tryb pracy (OBOWIĄZKOWY)
- **1 PR = 1 logiczny etap** z tej roadmapy.
- Każdy PR max 200-300 LOC (chyba że migracje/typy).
- Brak zmian poza zakresem aktualnego PR.

---

## SCOPE — CO BUDUJEMY (ZAMKNIĘTA LISTA)

| # | Funkcjonalność | Status w repo | Do zrobienia |
|---|---------------|---------------|--------------|
| 1 | **Oferty** (tworzenie, PDF, wysyłka) | ✅ Zbudowane (~80%) | Hardening, edge cases |
| 2 | **Lead generation** (publiczne strony ofert) | ⚠️ Częściowo (OfferApproval) | Rozbudowa publicznego widoku |
| 3 | **Akceptacja online** (podpis, status) | ✅ Zbudowane | Hardening, UX |
| 4 | **Paywall** (plany, Stripe, feature gating) | ⚠️ Częściowo (UI jest, Stripe nie podpięty) | Aktywacja Stripe, egzekucja limitów |
| 5 | **Hidden Owner Control** (/admin) | ⚠️ Częściowo (UI jest, security client-side) | RLS + Edge hardening |
| 6 | **PWA** (instalacja, offline) | ⚠️ Częściowo (InstallPrompt, OfflineFallback) | Service worker, manifest, cache |

---

## ANTI-SCOPE — CZEGO NIE BUDUJEMY

❌ Rozbudowany CRM
❌ Zespoły / role / pracownicy (poza owner)
❌ Faktury / księgowość
❌ ERP / magazyny
❌ AI "dla AI" (chatboty bez celu biznesowego)
❌ Osobny panel admina (osobna aplikacja / domena)
❌ Redesign całego UI
❌ Migracja do Next.js
❌ Google Play / App Store

---

## ANALYSIS SUMMARY (STAN REPO — STYCZEŃ 2026)

| # | Obszar | Status | Uwagi |
|---|--------|--------|-------|
| 1 | Layout system | ✅ OK | `AppLayout.tsx` z React Router `<Outlet />`. TopBar + Navigation + Footer + AI Chat. |
| 2 | CSS / Tailwind | ✅ OK | `index.css` (~350 LOC), CSS variables, dark mode. `tailwind.config.ts` z premium palette. Brak ryzyka kolizji. |
| 3 | Globalny layout / grid | ✅ OK | Flex column, container-based, mobile-first. |
| 4 | Routing | ✅ OK | React Router 6.30, 28 stron, lazy loading. Publiczne: login, register, offer/:token, legal. |
| 5 | Auth | ⚠️ Do wzmocnienia | Supabase Auth + AuthContext. Cała autoryzacja client-side (useAdminRole hook → redirect). Brak server-side enforcement na /admin. |
| 6 | Komponenty dashboardowe | ✅ Zachować | DashboardStats, QuoteCreationHub, RecentProjects, QuickActions — działają. |
| 7 | Wrażliwe miejsca UI | ⚠️ Zidentyfikowane | `index.css` variables, `tailwind.config.ts` theme, `src/components/ui/` (50+ shadcn). Zmiana = kaskadowy efekt na 28 stronach. |
| 8 | Admin panel | ⚠️ Do wzmocnienia | 8 tabów (Dashboard, Users, Theme, Content, DB, System, API, Logs). Security jest client-side only — `useAdminRole()` + `useEffect` redirect. |
| 9 | PWA / Capacitor | ⚠️ Częściowe | InstallPrompt + OfflineFallback istnieją. Capacitor skonfigurowany. Brak service workera. |
| 10 | Edge Functions | ✅ OK | 17 funkcji (approve-offer, send-offer-email, AI chat, OCR, voice). Działające, z rate limiting i walidacją. |

### Obecny stan kluczowych systemów

**System ofert:**
- `OfferApproval.tsx` — publiczna strona akceptacji z podpisem ✅
- `approve-offer` Edge Function — walidacja, sanityzacja, rate limiting ✅
- `send-offer-email` Edge Function — wysyłka przez Resend ✅
- `useOfferApprovals` — CRUD z tokenami, expiration ✅
- `useOfferSends` — tracking wysyłek ✅
- `useOfferStats` — statystyki (follow-up tracking niekompletny) ⚠️

**System paywall:**
- 5 planów: Free / Pro / Starter / Business / Enterprise ✅
- `usePlanGate` — feature gating z limitami ✅
- `useCreateCheckoutSession` — Stripe hooks istnieją ✅
- Stripe klucze niekonfigurowane w produkcji ⚠️
- Egzekucja limitów w Edge Functions — brak ❌

**Nawigacja /admin:**
- Brak linku `/admin` w Navigation.tsx ✅ (już ukryty)
- Dostępny tylko przez bezpośredni URL ✅
- Security client-side only ❌ (do naprawienia)

---

## FAZY IMPLEMENTACJI

### PR#1 — Admin Security Hardening

**Cel:** Zabezpieczyć `/admin` server-side przez RLS + Edge Function, żeby nieuprawnieni nie otrzymali żadnych danych.

**Zakres zmian:**
1. Nowa migracja SQL: polityka RLS na `user_roles` — SELECT tylko dla owner/admin.
2. Nowa migracja SQL: polityka RLS na `admin_settings`, `audit_logs` — dostęp tylko dla admin.
3. Weryfikacja istniejących RLS na tabelach administracyjnych.
4. Upewnienie się, że `useAdminRole` hook zwraca puste dane (nie błąd) dla non-adminów dzięki RLS.
5. `<meta name="robots" content="noindex, nofollow" />` na stronie Admin (już jest ✅).
6. Test: non-admin wchodzący na `/admin` widzi "Brak dostępu" i nie otrzymuje danych z bazy.

**Nie ruszamy:**
- UI admin panelu
- Komponentów dashboardu
- Routingu
- Nawigacji

**Definicja "Done":**
- Non-admin na `/admin` → brak danych z Supabase (RLS blokuje)
- Admin na `/admin` → pełny dostęp jak dotychczas
- Zero regresji w istniejących funkcjach

---

### PR#2 — Offer System Hardening

**Cel:** Upewnić się, że cały flow ofert działa end-to-end i jest odporny na edge cases.

**Zakres zmian:**
1. Audit istniejącego flow: tworzenie oferty → generowanie PDF → wysyłka email → publiczny link → akceptacja/odrzucenie.
2. Naprawienie follow-up tracking w `useOfferStats` (obecnie zwraca 0).
3. Walidacja expiration logic w `useOfferApprovals` — czy wygasłe oferty są poprawnie obsługiwane.
4. Upewnienie się, że `approve-offer` Edge Function poprawnie aktualizuje status projektu.
5. Obsługa edge cases: podwójna akceptacja, wygasły token, brak podpisu.
6. RLS review na tabelach: `offer_approvals`, `offer_sends`, `quotes`.

**Nie ruszamy:**
- UI komponentów ofert (tylko logika)
- Systemu PDF (działa)
- Systemu email (działa)

**Definicja "Done":**
- Pełny flow oferty działa bez błędów
- Edge cases obsłużone (expired, double-submit, missing data)
- Offer stats poprawnie wyliczane

---

### PR#3 — Paywall Activation

**Cel:** Aktywować system paywall — Stripe checkout działa, limity planów są egzekwowane server-side.

**Zakres zmian:**
1. Weryfikacja `usePlanGate` — czy feature gating działa poprawnie na froncie.
2. Nowa Edge Function lub rozszerzenie istniejącej: server-side enforcement limitów (projekty, klienci, AI).
3. RLS policies: limity zasobów per plan (np. max 3 projekty na Free).
4. Weryfikacja Stripe hooks (`useCreateCheckoutSession`) — czy flow checkout jest kompletny.
5. Webhook handler (`stripe-webhook`) — obsługa subscription events.
6. Obsługa downgrade/upgrade — co się dzieje z danymi powyżej limitu.

**Nie ruszamy:**
- UI strony Billing (już zbudowane)
- Definicji planów (5 tierów jest OK)
- Stripe Dashboard konfiguracji (to po stronie właściciela)

**Definicja "Done":**
- Feature gating działa na froncie i backendzie
- Stripe checkout tworzy sesję i redirectuje poprawnie
- Webhooky aktualizują status subskrypcji w bazie
- Limity planów egzekwowane przez RLS

---

### PR#4 — Lead Generation Enhancement

**Cel:** Rozbudować publiczny widok oferty jako narzędzie do zbierania leadów.

**Zakres zmian:**
1. Ulepszenie publicznej strony `/offer/:token`:
   - Branding firmy wykonawcy (logo, nazwa, dane kontaktowe)
   - Profesjonalny wygląd (landing page quality)
   - CTA do kontaktu z wykonawcą
2. Zbieranie danych kontaktowych klienta (imię, email, telefon) przy akceptacji.
3. Powiadomienie wykonawcy o nowym leadzie (email + in-app notification).
4. Lead tracking: kto otworzył link, kiedy, ile razy (Edge Function + analytics).

**Nie ruszamy:**
- Wewnętrznego systemu ofert
- Dashboardu
- Panelu admina

**Definicja "Done":**
- Publiczna strona oferty wygląda profesjonalnie z brandingiem firmy
- Dane kontaktowe klienta zbierane przy interakcji
- Wykonawca dostaje powiadomienie o aktywności na ofercie
- Basic analytics: otwarcia, akceptacje, odrzucenia

---

### PR#5 — PWA Optimization

**Cel:** Aplikacja w pełni instalowalna z przeglądarki, z offline fallback.

**Zakres zmian:**
1. Service worker (Workbox lub custom):
   - Cache static assets (JS, CSS, images)
   - Cache API responses (stale-while-revalidate)
   - Offline fallback page
2. Web App Manifest (`manifest.json`):
   - App name, icons, theme color, display mode
   - Start URL, scope
3. InstallPrompt improvements — timing, UX.
4. OfflineFallback — wyświetlenie cached danych lub przyjazny komunikat.
5. Testowanie na Android Chrome i iOS Safari.

**Nie ruszamy:**
- Capacitor config (to na later)
- Push notifications (już działają)
- Logiki biznesowej

**Definicja "Done":**
- Aplikacja instalowalna na telefonie z Chrome/Safari
- Offline: cached strony działają, nowe requesty pokazują fallback
- Lighthouse PWA score > 90

---

### PR#6 — Stabilizacja i QA

**Cel:** Bug fixes, performance, finalna weryfikacja przed produkcją.

**Zakres zmian:**
1. Przegląd i naprawa błędów zgłoszonych podczas PR#1-5.
2. Performance audit (bundle size, lazy loading, image optimization).
3. Accessibility audit (a11y) — keyboard navigation, screen readers.
4. Security audit — przegląd RLS policies, Edge Functions, input validation.
5. i18n review — brakujące klucze tłumaczeń.
6. Error boundary testing — czy ErrorBoundary łapie wszystkie crashes.

**Definicja "Done":**
- Zero known critical/high bugs
- Bundle size w akceptowalnych granicach
- RLS policies zaudytowane i potwierdzone
- Aplikacja działa poprawnie w PL/EN/UK

---

## ZASADY PRACY (OBOWIĄZKOWE)

### Dla każdego PR:
1. **Plan** → opis zmian w PR description.
2. **Kod** → max 200-300 LOC (wyjątek: migracje, auto-generowane typy).
3. **Test** → weryfikacja manualna + unit testy dla krytycznych ścieżek.
4. **Review** → właściciel zatwierdza przed mergem.

### Bezwzględne zakazy:
- ❌ Zmiana istniejących migracji SQL
- ❌ Rename tabel / kolumn w bazie
- ❌ Usuwanie tabel bez zgody
- ❌ Osłabienie RLS policies
- ❌ Service role key w frontendzie
- ❌ Nowe dependencies bez zgody
- ❌ Zmiany w CI/CD bez zgody
- ❌ Commity z sekretami / API keys
- ❌ `any` w TypeScript
- ❌ Disabling ESLint rules

### Komunikacja:
- Prosty język, bez żargonu.
- Każda decyzja techniczna wyjaśniona w kontekście biznesowym.
- Przy wątpliwościach → STOP i pytanie do właściciela.

---

## SECURITY MODEL

### Warstwa 1: Supabase RLS (baza danych)
- Każda tabela z danymi użytkownika ma RLS enabled.
- Polityki: users see only their own data.
- Admin-only tables: `user_roles`, `admin_settings`, `audit_logs`.
- Owner isolation: `user_id = auth.uid()` w każdej policy.

### Warstwa 2: Edge Functions (logika serwera)
- Walidacja inputu (Zod schemas).
- Rate limiting per IP/user.
- Sanityzacja danych (XSS, injection prevention).
- Service role key TYLKO w Edge Functions.

### Warstwa 3: Frontend (UI)
- Auth guard w `AppLayout` (redirect to /login).
- Feature gating w `usePlanGate` (UI-level).
- `noindex, nofollow` na admin pages.
- No sensitive data in error messages.

### /admin Security Flow:
```
User → /admin route → AppLayout auth check → useAdminRole hook
                                                    ↓
                                            Supabase RLS query
                                                    ↓
                                    ┌─────────────────────────────┐
                                    │ user_roles WHERE user_id =  │
                                    │ auth.uid() AND role IN      │
                                    │ ('admin', 'moderator')      │
                                    └─────────────────────────────┘
                                                    ↓
                                    RLS returns data → show admin panel
                                    RLS returns empty → "Brak dostępu"
```

---

## TECH STACK (ZAMKNIĘTY — BEZ ZMIAN)

| Warstwa | Technologia | Wersja |
|---------|-------------|--------|
| Frontend | React | 18.3 |
| Routing | React Router | 6.30 |
| Build | Vite | 5.4 |
| Styling | Tailwind CSS | 3.4 |
| Components | shadcn/ui (Radix) | latest |
| Forms | React Hook Form + Zod | 7.61 / 3.25 |
| Server State | TanStack Query | 5.83 |
| Backend | Supabase | 2.86 |
| Language | TypeScript | 5.8 (strict) |
| i18n | i18next | 25.7 |
| Mobile | Capacitor | 7.4 |
| Charts | Recharts | 2.15 |
| Payments | Stripe | via Edge Functions |
| Email | Resend | via Edge Functions |
| Monitoring | Sentry | latest |

---

## TIMELINE

| PR | Etap | Zależności |
|----|------|-----------|
| PR#1 | Admin Security Hardening | Brak — start |
| PR#2 | Offer System Hardening | PR#1 (RLS patterns) |
| PR#3 | Paywall Activation | PR#1 (RLS patterns) |
| PR#4 | Lead Generation Enhancement | PR#2 (offer system) |
| PR#5 | PWA Optimization | Brak zależności |
| PR#6 | Stabilizacja i QA | PR#1-5 ukończone |

---

*Dokument wygenerowany na podstawie analizy repozytorium i zatwierdzeń właściciela.*
*Data analizy: Styczeń 2026*
*Wersja: 1.0*
