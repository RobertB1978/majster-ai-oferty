# Majster.AI — Status Roadmapy (Tracker)

> **Źródło prawdy:** [`ROADMAP.md`](./ROADMAP.md) | Aktualizuj ten plik PO KAŻDYM MERGE.
> Format: `docs: aktualizuj status PR-XX w ROADMAP_STATUS`

**Ostatnia aktualizacja:** 2026-03-01 (PR-07 DONE)
**Prowadzi:** Tech Lead (Claude) + Product Owner (Robert B.)

---

## Legenda statusów

| Symbol | Status | Znaczenie |
|--------|--------|-----------|
| ⬜ TODO | Nie rozpoczęty | PR jest zaplanowany, praca nie ruszyła |
| 🔵 IN PROGRESS | W trakcie | Trwa kodowanie / review |
| 🟡 REVIEW | W review | PR otwarto, czeka na approve |
| ✅ DONE | Scalony | PR zmerge'owany do `main` |
| 🔴 BLOCKED | Zablokowany | Czeka na zewnętrzny input |
| ❌ CANCELLED | Anulowany | Zakres usunięty z planu |

---

## Tabela statusów PR-00..PR-20

| PR | Nazwa | Status | Branch / PR Link | Data merge | Uwagi |
|----|-------|--------|-----------------|------------|-------|
| **PR-00** | Roadmap-as-code | 🔵 IN PROGRESS | `claude/pr-00-roadmap-as-code-ZDfe2` | — | Ten PR |
| **PR-01** | Tooling: i18n Gate + Sentry | ✅ DONE | `claude/tooling-fundamentals-pr-01-VoocS` | 2026-03-01 | i18n gate + Sentry release tag + version metadata |
| **PR-02** | Security Baseline + RLS | ✅ DONE | `claude/security-baseline-rls-Ad5Tx` | 2026-03-01 | SECURITY_BASELINE.md + RLS template + IDOR procedure |
| **PR-03** | Design System + UI States | ✅ DONE | `claude/design-system-ui-states-ufHHS` | 2026-03-01 | Tokens (CSS vars), SkeletonBlock/List, EmptyState, ErrorState, touch targets, UI_SYSTEM.md |
| **PR-04** | Social Login PACK | ✅ DONE | `claude/social-login-pack-ouzu9` | 2026-03-01 | Google + Apple OAuth + email/password fallback; SocialLoginButtons, AuthCallback, docs/AUTH_SETUP.md |
| **PR-05** | Profil firmy + Ustawienia | ✅ DONE | `claude/company-profile-settings-2eKBa` | 2026-03-01 | Company Profile form (profiles table + address_line2/country/website), Settings tabs (Company + Account), DeleteAccountSection (USUŃ keyword), delete-user-account EF fix, i18n PL/EN/UK, docs/COMPLIANCE/ACCOUNT_DELETION.md |
| **PR-06** | Free plan + paywall | ✅ DONE | `claude/free-tier-paywall-0b5OO` | 2026-03-01 | FREE_TIER_OFFER_LIMIT=3, canSendOffer(), DB function count_monthly_finalized_offers(), useFreeTierOfferQuota hook, OfferQuotaIndicator, FreeTierPaywallModal, SendOfferModal quota check, i18n PL/EN/UK, unit tests, ADR-0004 |
| **PR-07** | Shell (FF_NEW_SHELL) | ✅ DONE | `claude/new-shell-bottom-nav-Hr4DV` | 2026-03-01 | FF_NEW_SHELL flag, NewShellLayout, BottomNav5, FAB+sheet, HomeLobby, MoreScreen, 3-step onboarding, i18n PL/EN/UK |
| **PR-08** | CRM + Cennik | ⬜ TODO | — | — | Wymaga merge PR-07 |
| **PR-09** | Oferty A: lista + statusy | ⬜ TODO | — | — | Wymaga merge PR-08 |
| **PR-10** | Oferty B1: Wizard bez PDF | ⬜ TODO | — | — | Wymaga merge PR-09 |
| **PR-11** | Oferty B2: PDF + wysyłka | ⬜ TODO | — | — | Wymaga merge PR-10 |
| **PR-12** | Oferty C: domykanie | ⬜ TODO | — | — | Wymaga merge PR-11 |
| **PR-13** | Projekty + QR status | ⬜ TODO | — | — | Wymaga merge PR-12 |
| **PR-14** | Burn Bar BASIC | ⬜ TODO | — | — | Wymaga merge PR-13 |
| **PR-15** | Fotoprotokół + podpis | ⬜ TODO | — | — | Wymaga merge PR-13 |
| **PR-16** | Teczka dokumentów | ⬜ TODO | — | — | Wymaga merge PR-13 |
| **PR-17** | Wzory dokumentów | ⬜ TODO | — | — | Wymaga merge PR-16 |
| **PR-18** | Gwarancje + przypomnienia | ⬜ TODO | — | — | Wymaga merge PR-13 |
| **PR-19** | PWA Offline minimum | ⬜ TODO | — | — | Wymaga merge PR-07 |
| **PR-20** | Stripe Billing | ⬜ TODO | — | — | Wymaga merge PR-06 i PR-07 |

---

## PR-01 — Tooling Fundamentals: co zostało wdrożone

### i18n Gate
- **Skrypt:** `scripts/i18n/gate-pr-changes.sh`
- **CI step:** `.github/workflows/i18n-ci.yml` — krok "i18n Gate — block new hardcoded strings"
- **Zasada:** Sprawdza TYLKO pliki zmienione w danym PR (vs gałąź bazowa). Nowe polskie znaki diakrytyczne w `src/components/`, `src/pages/`, `src/hooks/` powodują błąd CI (exit 1).
- **Pliki testowe:** wyłączone (`*.test.ts`, `*.spec.tsx`)
- **Legacy violations:** raportowane (krok 2a, `continue-on-error: true`), nie blokują

### Sentry (monitoring błędów)
- **SDK:** `@sentry/react` + `@sentry/vite-plugin` (już w dependencies)
- **Init:** `src/lib/sentry.ts` — `initSentry()` wywoływana z `src/main.tsx`
- **Env vars do ustawienia w Vercel:**
  - `VITE_SENTRY_DSN` — DSN z dashboardu Sentry (wymagane do aktywacji)
  - `VITE_SENTRY_AUTH_TOKEN` — token do uploadu source maps (opcjonalne)
  - `VITE_SENTRY_ORG` — slug organizacji Sentry (opcjonalne)
  - `VITE_SENTRY_PROJECT` — nazwa projektu Sentry (opcjonalne)
- **Graceful degradation:** gdy `VITE_SENTRY_DSN` brak — Sentry wyłączone, app działa normalnie
- **Release tag:** `majster-ai@{APP_VERSION}` — każde zdarzenie tagowane wersją apki

### Wersjonowanie
- **Plik:** `src/lib/version.ts` — eksportuje `APP_VERSION` i `APP_NAME`
- **Źródło:** `package.json` → `version` → injektowane przez Vite `define` jako `__APP_VERSION__`
- **Boot log:** `src/main.tsx` → `logger.info("Majster.AI v{wersja} starting")`
- **Aktualna wersja:** `0.1.0-alpha` (z `package.json`)

---

## PR-02 — Security Baseline + RLS Standard: co zostało wdrożone

### Dokumentacja bezpieczeństwa
- **Główny dokument:** `docs/SECURITY_BASELINE.md` — pełny standard RLS, procedura IDOR, wytyczne logowania, CSP, rate limiting, backup/erasure
- **Szablon polityk:** `supabase/policies/rls_policy_template.sql` — 4 wzorce RLS (prywatny, org, token, systemowy) + helper SQL weryfikujący RLS

### Kluczowe sekcje SECURITY_BASELINE.md
1. **RLS-by-default** — każda tabela musi mieć `user_id` + RLS + 4 polityki
2. **Szablon migracji** — copy/paste snippet dla nowych tabel (wzorzec A i B)
3. **Procedura IDOR** — kroki dla 2 kont testowych: SELECT/UPDATE/DELETE + curl API
4. **Logowanie i higiena** — co logować, co nie (PII), request-id pattern
5. **CSP** — dokumentacja istniejących nagłówków w vercel.json + procedura zmian
6. **Rate limiting** — gdzie stosować, wzorzec kodu (do użycia przy konkretnych PR)
7. **Cookies/sesje** — stan obecny Supabase Auth, uwagi bezpieczeństwa
8. **Backup/erasure** — retencja 30 dni, kaskadowe usunięcie, snapshoty

### Stan istniejącego RLS (audyt przy PR-02)
- Wszystkie tabele core (`clients`, `projects`, `quotes`, `pdf_data`) mają RLS włączone od migracji `20251205160746`
- Tabele admin (`admin_system_settings`, `admin_audit_log`, `admin_theme_config`) mają RLS org-based od `20260203141118`
- `vercel.json` zawiera kompletny zestaw nagłówków bezpieczeństwa (CSP, HSTS, X-Frame-Options)
- Brak tabel bez RLS (weryfikacja SQL w `supabase/policies/rls_policy_template.sql`)

### Co przyszłe PR-y muszą spełniać
Każdy PR tworzący tabele z danymi użytkownika musi użyć szablonu z `SECURITY_BASELINE.md Sekcja 2` i przeprowadzić test IDOR z `Sekcji 3`. Wyniki testu IDOR wklejone w opis PR.

---

## PR-05 — Profil Firmy + Ustawienia + Usuń Konto: co zostało wdrożone

### Baza danych
- **Migracja:** `supabase/migrations/20260301120000_pr05_company_profile_additions.sql`
- Dodane kolumny do tabeli `profiles`: `address_line2`, `country` (DEFAULT 'PL'), `website`
- Tabela `profiles` pełni rolę `company_profiles` (zmiana nazwy zabroniona per CLAUDE.md)
- RLS: SELECT/INSERT/UPDATE/DELETE per `user_id = auth.uid()` — aktywne

### RLS — Weryfikacja (test IDOR)
Aby przetestować izolację danych:
```sql
-- Jako user A: próba odczytu profilu user B → 0 wierszy (RLS blokuje)
SET SESSION "request.jwt.claims" = '{"sub": "user-a-uuid"}';
SELECT * FROM public.profiles WHERE user_id = 'user-b-uuid';
-- Oczekiwane: 0 rows
```

### Edge Function: delete-user-account
- **Poprawka 1:** Słowo potwierdzające zmienione z `DELETE MY ACCOUNT` na `USUŃ` (wymóg PR-05)
- **Poprawka 2 (bug fix):** Usunięto z tabeli `user_profiles` → `profiles` (tabela `user_profiles` nie istnieje)
- Funkcja usuwa: quote_items, quotes, projects, clients, calendar_events, item_templates, notifications, offer_approvals, profiles, user_subscriptions, auth account
- Rate limit: 3 próby/godzina
- Logi: bez PII (userId obfuskowany)

### UI (Settings)
- **Nowa zakładka "Firma"** (`companyProfileTab`): wyświetla formularz profilu firmy (CompanyProfile) z nowymi polami: website, address_line2, country
- **Nowa zakładka "Konto"** (`accountTab`): DeleteAccountSection z słowem `USUŃ`
- Domyślna zakładka zmieniona na "Firma" (było: "Język")

### DeleteAccountSection
- Słowo potwierdzające: `USUŃ` (case-sensitive)
- Payload do EF: `{ confirmationPhrase: 'USUŃ' }` (naprawiono bug: wcześniej wysyłano `{ userId }`)
- i18n: wszystkie stringi w PL/EN/UK

### Dokumentacja
- `docs/COMPLIANCE/ACCOUNT_DELETION.md` — opis przepływu, retencja danych, IDOR SQL test, known limitations

### Jak testować PR-05

**Company Profile:**
1. Zaloguj się → Ustawienia → zakładka "Firma"
2. Wypełnij dane: nazwa firmy, NIP, adres, telefon, email, konto bankowe, strona www
3. Kliknij "Zapisz profil" → toast sukcesu
4. Odśwież stronę → dane zachowane
5. Wygeneruj PDF → dane firmy widoczne jako dane wystawcy

**Delete Account:**
1. Ustawienia → zakładka "Konto"
2. Kliknij "Usuń Konto Całkowicie"
3. W modalu wpisz cokolwiek innego niż `USUŃ` → przycisk nieaktywny
4. Wpisz `USUŃ` → przycisk aktywny
5. Kliknij → konto usunięte, przekierowanie na /login
6. Próba logowania → niemożliwa (konto usunięte)

**RLS (symulacja 2 kont):**
```sql
-- W Supabase Dashboard → SQL Editor
-- 1. Utwórz dwa konta testowe i pobierz ich UUID
-- 2. Wykonaj zapytanie:
SELECT * FROM public.profiles WHERE user_id = 'uuid-user-b';
-- Jeśli zalogowany jako user_a → 0 wierszy
```

---

## Checklista DoD per PR (skopiuj przy każdym PR)

Przed każdym merge wypełnij i wklej w opis PR:

```markdown
### Checklista DoD — PR-XX [NAZWA]

**CI / No Green No Finish:**
- [ ] `npm run lint` → 0 błędów
- [ ] `npm test` → wszystkie testy zielone
- [ ] `npm run build` → OK
- [ ] `npm run type-check` → 0 błędów TypeScript
- [ ] `npm audit --audit-level=high` → 0 wysokich CVE

**Scope Fence:**
- [ ] Diff zawiera TYLKO pliki z zaplanowanego zakresu
- [ ] Brak zmian "przy okazji"

**Jakość:**
- [ ] i18n: zero hardcoded tekstów (PL/EN/UK)
- [ ] RLS: nowe tabele mają polityki + test IDOR
- [ ] Walidacja Zod na formularzach
- [ ] Typy TypeScript bez `any`

**FF_NEW_SHELL (od PR-07):**
- [ ] Działa przy FF_NEW_SHELL=ON
- [ ] Działa przy FF_NEW_SHELL=OFF

**Dokumentacja:**
- [ ] ROADMAP_STATUS.md zaktualizowany po merge
- [ ] ADR dodany jeśli podjęto istotną decyzję

**Rollback:**
- [ ] Plan rollback opisany w PR
- [ ] Migracje odwracalne (jeśli dotyczy)
```

---

## Historia merge'ów

| Data | PR | Commit | Uwagi |
|------|----|--------|-------|
| 2026-03-01 | PR-00 | *(po merge)* | Roadmap-as-code — źródło prawdy |
| 2026-03-01 | PR-01 | `claude/tooling-fundamentals-pr-01-VoocS` | i18n gate (gate-pr-changes.sh) + Sentry release + version.ts |
| 2026-03-01 | PR-02 | `claude/security-baseline-rls-Ad5Tx` | SECURITY_BASELINE.md + RLS template (4 wzorce) + procedura IDOR |
| 2026-03-01 | PR-03 | `claude/design-system-ui-states-ufHHS` | SkeletonBlock/List, EmptyState (ctaLabel/onCta), ErrorState, .touch-target, UI_SYSTEM.md |
| 2026-03-01 | PR-04 | `claude/social-login-pack-ouzu9` | Google + Apple OAuth, AuthCallback, SocialLoginButtons, i18n PL/EN/UK, AUTH_SETUP.md |
| 2026-03-01 | PR-05 | `claude/company-profile-settings-2eKBa` | Company Profile (profiles + address_line2/country/website), Settings tabs, DeleteAccountSection (USUŃ), delete-user-account EF fixes, i18n, COMPLIANCE/ACCOUNT_DELETION.md |
| 2026-03-01 | PR-06 | `claude/free-tier-paywall-0b5OO` | FREE_TIER_OFFER_LIMIT=3, DB function, quota hook, OfferQuotaIndicator, FreeTierPaywallModal, SendOfferModal gate, i18n, unit tests |
| 2026-03-01 | PR-07 | `claude/new-shell-bottom-nav-Hr4DV` | FF_NEW_SHELL flag (env+localStorage), NewShellLayout, NewShellBottomNav (5 tabs), NewShellFAB+sheet (7 akcji), HomeLobby (3 bloki), MoreScreen (3 grupy), NewShellOnboarding (3 kroki, localStorage persist), i18n PL/EN/UK, routing /app/home + /app/more |

> *Uzupełniaj tabelę po każdym merge. Format: `docs: aktualizuj status PR-XX`*

---

## PR-07 — Shell za flagą FF_NEW_SHELL: co zostało wdrożone

### Jak włączyć / wyłączyć FF_NEW_SHELL

**Metoda 1 — localStorage (runtime, bez rebuildu):**
```js
// Włącz nowy shell
localStorage.setItem('FF_NEW_SHELL', 'true')
// Wyłącz (powrót do starego shella)
localStorage.setItem('FF_NEW_SHELL', 'false')
// Następnie odśwież stronę
```

**Metoda 2 — zmienna środowiskowa (build-time):**
```env
# .env lub Vercel Environment Variables
VITE_FF_NEW_SHELL=true   # nowy shell
VITE_FF_NEW_SHELL=false  # stary shell (domyślnie)
```
`VITE_FF_NEW_SHELL` ma pierwszeństwo przed localStorage.

### Pliki zmienione

| Plik | Opis |
|------|------|
| `src/config/featureFlags.ts` | Definicja FF_NEW_SHELL (env + localStorage + default=false) |
| `src/App.tsx` | Routing: wybór AppLayout vs NewShellLayout + trasy /home, /offers, /more |
| `src/components/layout/NewShellLayout.tsx` | Nowy shell — wrapper z auth guard |
| `src/components/layout/NewShellBottomNav.tsx` | Dolna nawigacja 5 zakładek (Home/Oferty/[FAB]/Projekty/Więcej) |
| `src/components/layout/NewShellFAB.tsx` | FAB + bottom sheet 7 akcji |
| `src/pages/HomeLobby.tsx` | Ekran Home (3 bloki: Continue/Today/QuickStart) |
| `src/pages/MoreScreen.tsx` | Ekran Więcej (3 grupy: Dokumenty/Org/Ustawienia) |
| `src/components/onboarding/NewShellOnboarding.tsx` | Onboarding 3-krokowy (localStorage: onboarding_new_shell_completed) |
| `src/i18n/locales/{pl,en,uk}.json` | Klucze i18n: `newShell.*` (nav/fab/home/more/onboarding) |
| `docs/ROADMAP_STATUS.md` | Ten plik — aktualizacja statusu |

### Architektura (decyzja)

- **FF_NEW_SHELL=false** (domyślnie): `<AppLayout>` — stary shell bez żadnych zmian
- **FF_NEW_SHELL=true**: `<NewShellLayout>` — nowy shell z dolną nawigacją
- Routing `/app/home` i `/app/more` dostępny w obu shellach (nie crashuje przy OFF)
- `/app/offers` → redirect do `/app/jobs` (tabela ofert = PR-09)
- Onboarding: 1 lokalny klucz `onboarding_new_shell_completed` w localStorage

### Jak testować PR-07

**FF_NEW_SHELL=OFF (domyślnie):**
1. Otwórz `/app/dashboard` → stary shell, topbar + poziomy nav
2. Brak nowej dolnej nawigacji
3. Ustawienia dostępne: `/app/settings`

**FF_NEW_SHELL=ON:**
```js
localStorage.setItem('FF_NEW_SHELL', 'true'); location.reload();
```
1. `/app/home` → ekran Home z 3 blokami
2. Dolna nawigacja: Home / Oferty / [FAB] / Projekty / Więcej
3. FAB (środkowy +) → bottom sheet z 7 akcjami
4. Zakładka "Więcej" → grupy linków, Ustawienia dostępne
5. Pierwsze uruchomienie → modal onboardingu 3-krokowy
6. Drugi raz → onboarding NIE pokazuje się
7. Zmiana języka (PL/EN/UK) → wszystkie napisy przetłumaczone

---

## PR-06 — Free plan limit + paywall + haczyk retencyjny: co zostało wdrożone

### Reguła (ADR-0004 — niezmieniona)

```typescript
// src/config/entitlements.ts
export const FREE_TIER_OFFER_LIMIT = 3; // oferty/miesiąc
// Liczone: sent | accepted | rejected (NIE drafty)
// Reset: 1. dzień każdego miesiąca UTC
```

### Pliki zmienione

| Plik | Opis |
|------|------|
| `src/config/entitlements.ts` | Jedyne źródło prawdy: stała + czyste funkcje `canSendOffer()`, `remainingOfferQuota()` |
| `supabase/migrations/20260301130000_pr06_monthly_offer_quota.sql` | Funkcja DB `count_monthly_finalized_offers(user_id)` + indeks |
| `src/hooks/useFreeTierOfferQuota.ts` | Hook React: pobiera miesięczny licznik, zwraca `{ used, limit, remaining, canSend, plan }` |
| `src/components/billing/OfferQuotaIndicator.tsx` | Wskaźnik kwoty (np. `1/3 ofert w mies.`) — widoczny w nagłówku SendOfferModal |
| `src/components/billing/FreeTierPaywallModal.tsx` | Modal paywalla — wyjaśnia limit, CTA → `/app/billing` |
| `src/components/offers/SendOfferModal.tsx` | Sprawdzanie kwoty PRZED wysyłką; pokazuje paywall modal gdy limit wyczerpany |
| `src/i18n/locales/{pl,en,uk}.json` | Klucze i18n: `offerQuota.*`, `paywall.*` |
| `src/test/features/entitlements.test.ts` | Testy jednostkowe logiki limit/canSend |
| `docs/ROADMAP_STATUS.md` | Ten plik — aktualizacja statusu |

### Zachowanie paywall (DoD)

- ✅ Drafty **NIE** blokowane — użytkownik może tworzyć i edytować bez ograniczeń
- ✅ Blokowana tylko akcja SEND (4. oferta w miesiącu)
- ✅ CRM i historia ofert zawsze dostępne
- ✅ Wskaźnik `X/3 ofert w mies.` widoczny w nagłówku modalu SendOffer
- ✅ Modal paywalla z wyjaśnieniem i CTA → `/app/billing`
- ✅ `/app/billing` to placeholder (Stripe wchodzi w PR-20)

### Jak testować PR-06

**Logika jednostkowa (automatyczne):**
```bash
npm test -- entitlements
```
Oczekiwane: wszystkie testy zielone (canSendOffer/remainingOfferQuota).

**Ręczne — quota indicator:**
1. Zaloguj się jako użytkownik z planem free
2. Otwórz SendOffer modal dla dowolnego projektu
3. Sprawdź nagłówek modalu → wskaźnik `X/3 ofert w mies.` widoczny

**Ręczne — paywall:**
1. Jako free-plan user wyślij 3 oferty (zmień statusy na 'sent' w bazie lub wyślij realnie)
2. Otwórz SendOffer modal dla 4. projektu
3. Kliknij "Wyślij" → modal paywalla powinien się pojawić
4. CRM i lista ofert: sprawdź że nadal dostępne (nie zablokowane)

**RLS funkcji DB:**
```sql
-- W Supabase SQL Editor:
-- Jako user A nie może odczytać danych user B przez count_monthly_finalized_offers
SELECT public.count_monthly_finalized_offers('user-a-uuid'); -- zwraca 0 dla user B
```

**Izolacja planów:**
- Free plan (0/3 used) → canSend = true
- Free plan (3/3 used) → canSend = false, paywall pojawia się
- Pro/Business plan → canSend = zawsze true, wskaźnik ukryty

---

## Wskaźniki postępu

```
Faza 0 (Fundament):     3/3 PR  ██████████  100%
Faza 1 (Dostęp):        3/3 PR  ██████████  100%
Faza 2 (Shell):         1/1 PR  ██████████  100%
Faza 3 (Dane/Oferty):   0/2 PR  ░░░░░░░░░░  0%
Faza 4 (Oferty flow):   0/3 PR  ░░░░░░░░░░  0%
Faza 5 (Projekty):      0/6 PR  ░░░░░░░░░░  0%
Faza 6 (Offline+$):     0/2 PR  ░░░░░░░░░░  0%
─────────────────────────────────────────
RAZEM:                  7/20 PR ███░░░░░░░  35%
(PR-00 nie wliczany do progresu funkcjonalnego)
```

*Aktualizuj ręcznie po każdym merge.*

---

*Tracker: v1.0 | Data: 2026-03-01 | Właściciel: Robert B. + Claude*
