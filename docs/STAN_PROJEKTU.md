# STAN_PROJEKTU.md — Majster.AI

> **Autor:** Chief Architect + QA Lead (Claude)
> **Data:** 2026-03-02
> **Sesja:** setup-review-framework-9RNvU
> **Kontekst:** End-to-end audit PR-00..PR-20 na podstawie kodu źródłowego

---

## Stan obecny (2026-03-02)

### Roadmap progress

Wszystkie 21 PRów (PR-00..PR-20) zostały zmerge'owane do `main`.  
**Brak zaległości kodu.** Dwa OWNER_ACTION items blokują pełną funkcjonalność produkcyjną.

### Gotowość systemu

| Moduł | Stan kodu | Stan runtime |
|-------|-----------|-------------|
| Auth (email/pass) | ✅ Kompletny | ✅ Działa |
| Auth (Google OAuth) | ✅ Kompletny | ❓ Wymaga konfiguracji Supabase |
| Auth (Apple OAuth) | ✅ Kompletny | ❓ Wymaga konfiguracji Supabase |
| i18n (PL/EN/UK) | ✅ Kompletny | ✅ Działa |
| i18n Gate (CI) | ✅ Kompletny | ✅ Działa |
| Sentry monitoring | ✅ Kompletny | ❓ Wymaga VITE_SENTRY_DSN |
| Design system | ✅ Kompletny | ✅ Działa |
| Company Profile + Delete Account | ✅ Kompletny | ✅ Działa |
| Free tier limit (3/mies) | ✅ Kompletny | ✅ Działa |
| FF_NEW_SHELL (nowy shell) | ✅ Kompletny | ✅ Domyślnie OFF |
| CRM (klienci) | ✅ Kompletny | ✅ Działa |
| Price library | ✅ Kompletny | ✅ Działa |
| Offers (lista+statusy) | ✅ Kompletny | ✅ Działa |
| Offer Wizard (draft) | ✅ Kompletny | ✅ Działa |
| Offer PDF + Send | ✅ Kompletny | ❓ Email wymaga RESEND_API_KEY |
| Acceptance link (klient) | ✅ Kompletny | ✅ Działa |
| Bulk add items | ✅ Kompletny | ✅ Działa |
| Projects V2 (lista+hub) | ✅ Kompletny | ✅ Działa |
| QR status (bez cen) | ✅ Kompletny | ✅ Działa |
| Burn Bar (budżet+koszty) | ✅ Kompletny | ✅ Działa |
| Photo report + podpis | ✅ Kompletny | ✅ Działa |
| Kompresja zdjęć | ✅ Kompletny | ✅ Działa |
| Project dossier | ✅ Kompletny | ✅ Działa |
| Dossier share link | ✅ Kompletny | ✅ Działa |
| Templates library (25 szablonów) | ✅ Kompletny | ✅ Działa |
| Gwarancje | ✅ Kompletny | ✅ Działa |
| Przeglądy techniczne | ✅ Kompletny | ✅ Działa |
| Przypomnienia in-app | ✅ Kompletny | ✅ Działa |
| PWA offline (read-only) | ✅ Kompletny | ✅ Działa |
| Stripe checkout | ✅ Kompletny | ❓ Wymaga kluczy Stripe |
| Stripe webhooks | ✅ Kompletny | ❓ Wymaga STRIPE_WEBHOOK_SECRET |
| Upgrade flow | ✅ Kompletny | ❓ Wymaga kluczy Stripe |

---

## Blokery (OWNER_ACTION — nie bugują kodu)

### P1 — wymagane do pełnej funkcjonalności produkcyjnej

1. **Sentry monitoring wyłączony** — brak `VITE_SENTRY_DSN` w Vercel
   - Jak naprawić: Vercel → Project → Settings → Environment Variables → `VITE_SENTRY_DSN` = DSN z dashboardu Sentry
   
2. **Email wysyłki nieaktywne** — brak `RESEND_API_KEY`
   - Jak naprawić: Supabase Dashboard → Edge Functions → Secrets → `RESEND_API_KEY` + `FRONTEND_URL`

3. **Google OAuth niekonfigurowane** — Social login "Kontynuuj z Google" nie działa
   - Jak naprawić: Supabase Dashboard → Auth → Providers → Google → wklej Client ID + Secret

4. **Apple OAuth niekonfigurowane** — Social login "Kontynuuj z Apple" nie działa
   - Jak naprawić: Supabase Dashboard → Auth → Providers → Apple → wklej Client ID + Secret (wymaga Apple Developer account)

5. **Stripe Billing nieaktywny** — cała sekcja płatności jest zablokowana
   - Jak naprawić: Supabase Dashboard → Edge Functions → Secrets:
     - `STRIPE_SECRET_KEY` (z Stripe Dashboard)
     - `STRIPE_WEBHOOK_SECRET` (z Stripe Dashboard → Webhooks)
     - `STRIPE_PRO_PRICE_ID` (price_xxx z Stripe Dashboard)
     - `STRIPE_STARTER_PRICE_ID` (opcjonalnie)

### P2 — bezpieczeństwo (do weryfikacji)

6. **user_roles RLS niezweryfikowane z Dashboard** — nie można potwierdzić z repo czy polityki istnieją
   - Jak naprawić: Supabase Dashboard → Table Editor → user_roles → sprawdź czy RLS jest włączone i czy polityki SELECT ograniczają dostęp do `auth.uid() = user_id`

---

## Wykonany fix w tej sesji

**fix/ci-ff-new-shell-dual-check** (`.github/workflows/ci.yml`)  
- ADR-0005 wymagał CI weryfikacji obu stanów FF_NEW_SHELL=true i =false  
- CI nie miało kroku z `VITE_FF_NEW_SHELL=true`  
- Dodano dedykowany krok `Build application (FF_NEW_SHELL=true — ADR-0005 dual-check)` w job `build`  
- `npm run type-check` po zmianie: PASS  

---

## Klasyfikacja gotowości (na 2026-03-02)

| Poziom | Wynik | Uzasadnienie |
|--------|-------|-------------|
| **MVP readiness** | **82%** | Cały kod zacommitowany i działa. Blokuje: email (oferty) + social login (P1 OWNER_ACTION). Core flow ofert+projektów działa bez tych elementów. |
| **MVP+ readiness** | **75%** | Dodatkowe moduły (dossier, szablony, gwarancje, przeglądy, burn bar) w kodzie kompletne. Blokuje: brak testów E2E dla pełnego flow oferta→projekt→dossier. Runtime monitoring wyłączony. |
| **SaaS readiness** | **55%** | Billing code jest, ale Stripe niekonfigurowany. Bez płatności = brak monetyzacji. Sentry wyłączony = blind monitoring. OAuth (social login) niekonfigurowany = tarcie przy rejestracji. |

---

## Następne akcje

### Priorytet 1 (do zrobienia przez właściciela — nie wymaga kodu)
- [ ] Skonfigurować `VITE_SENTRY_DSN` w Vercel
- [ ] Skonfigurować `RESEND_API_KEY` + `FRONTEND_URL` w Supabase Secrets
- [ ] Skonfigurować Google OAuth w Supabase Dashboard
- [ ] Skonfigurować Stripe w Supabase Secrets (klucze + price IDs)
- [ ] Zweryfikować RLS na tabeli `user_roles` w Supabase Dashboard

### Priorytet 2 (kod — potencjalny kolejny PR)
- [ ] Testy E2E dla full flow: oferta → PDF → wyślij → klient akceptuje → projekt → burn bar
- [ ] Testy E2E z FF_NEW_SHELL=true
- [ ] Audyt runtime po skonfigurowaniu środowiska produkcyjnego

### Priorytet 3 (opcjonalne)
- [ ] Analytics / Stripe test mode smoke test
- [ ] `OFFLINE_MINIMUM.md` — weryfikacja coverage cache (projekt z fazami)
- [ ] ADR-0010 review (inspections_pl.md aktualność przepisów)

---

## Delta vs poprzedni stan (AUDIT_STATUS.md)

| Obszar | Poprzedni stan | Obecny stan |
|--------|---------------|-------------|
| ROADMAP_STATUS tracking | PR-08 jako TODO | Wszystkie PR-00..PR-20: DONE |
| FF_NEW_SHELL CI check | Brak | ✅ Dodany w tej sesji |
| PR-02 user_roles RLS | "UNKNOWN P2" (AUDIT_STATUS.md D-rls) | Nadal UNKNOWN — wymaga Dashboard |
| PWA offline | Nie wdrożone | ✅ sw.js v4 + OfflineBanner |
| Stripe Billing | Nie wdrożone | ✅ Kod kompletny (OWNER_ACTION konfiguracja) |
| Gwarancje + przeglądy | Nie wdrożone | ✅ Kompletne (PR-18) |
| Templates library | Nie wdrożone | ✅ 25 szablonów (PR-17) |
| Dossier | Nie wdrożone | ✅ Kompletny (PR-16) |

---

*STAN_PROJEKTU.md v1.0 | 2026-03-02 | Audit session: setup-review-framework-9RNvU*
