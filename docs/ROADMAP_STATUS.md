# Majster.AI — Status Roadmapy (Tracker)

> **Źródło prawdy:** [`ROADMAP.md`](./ROADMAP.md) | Aktualizuj ten plik PO KAŻDYM MERGE.
> Format: `docs: aktualizuj status PR-XX w ROADMAP_STATUS`

**Ostatnia aktualizacja:** 2026-03-01 (PR-13 DONE)
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
| **PR-09** | Oferty A: lista + statusy | ✅ DONE | `claude/offers-list-pr-09-bppeV` | 2026-03-01 | Tabela offers + RLS, lista z filtrami/wyszukiwaniem/sortowaniem, badge "brak odpowiedzi X dni", FF_NEW_SHELL ON/OFF, i18n PL/EN/UK |
| **PR-10** | Oferty B1: Wizard bez PDF | ✅ DONE | `claude/offer-wizard-draft-mUypo` | 2026-03-01 | offer_items migration + RLS, OfferWizard (3 kroki: klient/pozycje/podsumowanie), inline new client, Price Library search, live totals, i18n PL/EN/UK, FF_NEW_SHELL ON/OFF |
| **PR-11** | Oferty B2: PDF + wysyłka | ✅ DONE | `claude/pr-11-offers-pdf-send-UtBtT` | 2026-03-01 | OfferPreviewModal (podgląd HTML A4 + download PDF + Send), useSendOffer (quota check + SENT status + PDF upload + email best-effort), offerPdfPayloadBuilder (payload z offer_items), migracja quota fn (+ offers table), i18n PL/EN/UK (offerPreview.*), FF_NEW_SHELL ON/OFF |
| **PR-12** | Oferty C: domykanie | ✅ DONE | `claude/pr-12-acceptance-links-zAx3e` | 2026-03-01 | acceptance_links + offer_public_actions (migration + RLS + SECURITY DEFINER fn), publiczna strona akceptacji (/a/:token), AcceptanceLinkPanel (SENT/ACCEPTED/REJECTED), BulkAddItems (paste + CSV import), CTA "Utwórz projekt" po akceptacji, i18n PL/EN/UK (acceptanceLink.* + publicOffer.* + bulkAdd.*) |
| **PR-13** | Projekty + QR status | ✅ DONE | `claude/pr-13-projects-module-BilaR` | 2026-03-01 | v2_projects + project_public_status_tokens (migration + RLS + SECURITY DEFINER), ProjectsList (ACTIVE/COMPLETED/ON_HOLD, search), ProjectHub (accordion: stages/costs/docs/photos placeholders, progress slider, QR link), ProjectPublicStatus (/p/:token — NO prices), create-from-offer CTA (Offers + AcceptanceLinkPanel), i18n PL/EN/UK (projectsV2.*), FF_NEW_SHELL ON (BottomNav /app/projects) + OFF, IDOR documented |
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
| 2026-03-01 | PR-09 | `claude/offers-list-pr-09-bppeV` | Tabela `offers` (migration 20260301140000) + RLS 4 polityki + typy TS, useOffers hook (TanStack Query), Offers page (status tabs ALL/DRAFT/SENT/ACCEPTED/REJECTED/ARCHIVED, search, sort, OfferRow z badge "brak odpowiedzi X dni"), OfferDetail placeholder, routing /app/offers + /app/offers/:id + /app/offers/new, Navigation+defaultConfig (oferty w starym shellu), i18n PL/EN/UK (offersList.*), ROADMAP_STATUS PR-09 DONE |
| 2026-03-01 | PR-10 | `claude/offer-wizard-draft-mUypo` | Migration offer_items (+ FK offers.client_id + total_vat), useOfferWizard hook (load+save draft), OfferWizard 3-krokowy (WizardStepClient/Items/Review), inline new client, Price Library search, live totals (net/VAT/gross), i18n PL/EN/UK (offerWizard.*), FF_NEW_SHELL ON/OFF, ROADMAP_STATUS PR-10 DONE |
| 2026-03-01 | PR-11 | `claude/pr-11-offers-pdf-send-UtBtT` | Migration 20260301160000 (quota fn update: counts offers+offer_approvals, index offers.sent_at), offerPdfPayloadBuilder.ts, useSendOffer hook (idempotent, quota check, SENT status, PDF upload, email best-effort), OfferPreviewModal (HTML A4 preview, Download PDF, Send+quota gate, shareable link, FreeTierPaywallModal), WizardStepReview+OfferWizard (Preview & Send button), i18n PL/EN/UK (offerPreview.* 30 kluczy), ROADMAP_STATUS PR-11 DONE |
| 2026-03-01 | PR-12 | `claude/pr-12-acceptance-links-zAx3e` | acceptance_links + offer_public_actions (migration + RLS + SECURITY DEFINER fn), OfferPublicAccept (/a/:token), AcceptanceLinkPanel, BulkAddItems, CTA Utwórz projekt, i18n PL/EN/UK |
| 2026-03-01 | PR-13 | `claude/pr-13-projects-module-BilaR` | Migration 20260301180000 (v2_projects + project_public_status_tokens, RLS, SECURITY DEFINER resolve_project_public_token — NO prices), useProjectsV2 hook, ProjectsList (/app/projects, ACTIVE/COMPLETED/ON_HOLD + search), ProjectHub (accordion: stages + progress slider + QR link; costs/docs/photos placeholders), ProjectPublicStatus (/p/:token — NO prices), create-from-offer w Offers.tsx + AcceptanceLinkPanel, NewShellBottomNav /app/projects, i18n PL/EN/UK (projectsV2.* 55 kluczy), FF_NEW_SHELL ON+OFF |

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
Faza 3 (Dane/Oferty):   1/2 PR  █████░░░░░  50%
Faza 4 (Oferty flow):   3/3 PR  ██████████  100%
Faza 5 (Projekty):      1/6 PR  ██░░░░░░░░  17%
Faza 6 (Offline+$):     0/2 PR  ░░░░░░░░░░  0%
─────────────────────────────────────────
RAZEM:                  11/20 PR ██████░░░░  55%
(PR-00 nie wliczany do progresu funkcjonalnego)
```

*Aktualizuj ręcznie po każdym merge.*

---

---

## PR-09 — Oferty A: Lista + Statusy + Filtry + Quick Actions: co zostało wdrożone

### Baza danych

| Plik | Opis |
|------|------|
| `supabase/migrations/20260301140000_pr09_offers_table.sql` | Nowa tabela `offers` z pełnym RLS (4 polityki) + indeksy + trigger `updated_at` |
| `src/integrations/supabase/types.ts` | Dodane typy TS dla tabeli `offers` (Row/Insert/Update) |

### Tabela offers — schemat

```sql
offers (
  id               uuid PK,
  user_id          uuid NOT NULL  → auth.users(id) ON DELETE CASCADE,
  client_id        uuid NULL,     -- wypełni PR-10
  status           text           CHECK IN ('DRAFT','SENT','ACCEPTED','REJECTED','ARCHIVED'),
  title            text NULL,
  total_net        numeric(14,2) NULL,
  total_gross      numeric(14,2) NULL,
  currency         text DEFAULT 'PLN',
  sent_at          timestamptz NULL,
  accepted_at      timestamptz NULL,
  rejected_at      timestamptz NULL,
  last_activity_at timestamptz DEFAULT now(),
  created_at       timestamptz DEFAULT now(),
  updated_at       timestamptz DEFAULT now()
)
```

### RLS — weryfikacja IDOR (test SQL)

```sql
-- W Supabase Dashboard → SQL Editor (symulacja 2 kont):
-- 1. Zaloguj się jako User A, utwórz ofertę → zapisz offer_id
-- 2. Przełącz JWT na User B:
SET SESSION "request.jwt.claims" = '{"sub": "user-b-uuid"}';

-- 3. Próba SELECT cudzej oferty → 0 wierszy (RLS blokuje):
SELECT * FROM public.offers WHERE user_id = 'user-a-uuid';
-- Oczekiwane: 0 rows

-- 4. Próba UPDATE cudzej oferty → 0 rows affected:
UPDATE public.offers SET title = 'hacked' WHERE user_id = 'user-a-uuid';
-- Oczekiwane: UPDATE 0

-- 5. Próba DELETE cudzej oferty → 0 rows affected:
DELETE FROM public.offers WHERE user_id = 'user-a-uuid';
-- Oczekiwane: DELETE 0
```

### Pliki zmienione / dodane

| Plik | Opis |
|------|------|
| `supabase/migrations/20260301140000_pr09_offers_table.sql` | Nowa migracja — tabela + RLS + indeksy |
| `src/integrations/supabase/types.ts` | Typy TS dla tabeli `offers` |
| `src/hooks/useOffers.ts` | TanStack Query hook: `useOffers({ status, search, sort })` |
| `src/pages/Offers.tsx` | Strona listy ofert (status tabs, search, sort, OfferRow, EmptyState, ErrorState, SkeletonList) |
| `src/pages/OfferDetail.tsx` | Placeholder dla /app/offers/:id i /app/offers/new (PR-10) |
| `src/App.tsx` | Trasy: `/app/offers`, `/app/offers/new`, `/app/offers/:id` (zastąpiono redirect) |
| `src/data/defaultConfig.ts` | Dodano `offers` do domyślnej nawigacji (order=1, między dashboard a jobs) |
| `src/components/layout/Navigation.tsx` | `NAV_LABEL_KEYS['offers']` + fallback gwarantowany dla starych konfigów |
| `src/i18n/locales/pl.json` | `nav.offers`, `offersList.*` (35 kluczy) |
| `src/i18n/locales/en.json` | `nav.offers`, `offersList.*` (35 kluczy) |
| `src/i18n/locales/uk.json` | `nav.offers`, `offersList.*` (35 kluczy) |
| `docs/ROADMAP_STATUS.md` | Ten plik — aktualizacja statusu PR-09 DONE |

### Jak testować PR-09

**5-krokowa lista kontrolna (manualna):**

1. **FF_NEW_SHELL=ON — zakładka "Oferty":**
   ```js
   localStorage.setItem('FF_NEW_SHELL', 'true'); location.reload();
   ```
   - Dolna nawigacja: zakładka "Oferty" → `/app/offers`
   - Strona pokazuje: nagłówek "Oferty", tabs statusów, pole wyszukiwania, select sortowania
   - Przy pustej bazie: EmptyState z CTA "Utwórz pierwszą ofertę"

2. **FF_NEW_SHELL=OFF — stary shell:**
   ```js
   localStorage.setItem('FF_NEW_SHELL', 'false'); location.reload();
   ```
   - Nawigacja górna (desktop) → link "Oferty" widoczny
   - `/app/offers` otwiera listę ofert
   - Hamburger menu (mobile) → link "Oferty"

3. **Filtrowanie i wyszukiwanie:**
   - Kliknij zakładkę "Wysłane" → lista filtruje się do statusu SENT
   - Wpisz tekst → oferty filtrują się po tytule
   - Zmień sortowanie → kolejność się zmienia
   - Brak wyników z filtrem → EmptyState z informacją o filtrze (bez CTA)

4. **Badge "Brak odpowiedzi":**
   - W bazie: ustaw ofertę na status `SENT`, `sent_at` = 8 dni temu
   - Na liście: amber badge "Brak odpowiedzi 8 dni" widoczny przy tej ofercie

5. **i18n PL/EN/UK:**
   - Zmień język na angielski → napisy "Offers", "Draft", "Sent", itd.
   - Zmień na ukraiński → "Пропозиції", "Чернетка", "Надіслані", itd.
   - Wszystkie napisy tłumaczone bez hardcoded polskiego

**RLS/IDOR — pełny test (Supabase SQL Editor):**
```sql
-- 1. User A tworzy ofertę
INSERT INTO public.offers (user_id, title, status)
VALUES ('user-a-uuid', 'Oferta testowa A', 'DRAFT');

-- 2. Symuluj User B (zmień JWT)
SET SESSION "request.jwt.claims" = '{"sub": "user-b-uuid"}';

-- 3. User B NIE widzi oferty User A
SELECT count(*) FROM public.offers WHERE user_id = 'user-a-uuid';
-- Oczekiwane: count = 0
```

---

## PR-10 — Oferty B1: Wizard bez PDF: co zostało wdrożone

### Baza danych

| Plik | Opis |
|------|------|
| `supabase/migrations/20260301150000_pr10_offer_items.sql` | Nowa tabela `offer_items` (RLS 4 polityki + indeksy + trigger) + FK `offers.client_id → clients.id` + kolumna `total_vat` w `offers` |

### Tabela offer_items — schemat

```sql
offer_items (
  id               uuid PK,
  user_id          uuid NOT NULL  → auth.users(id) ON DELETE CASCADE,
  offer_id         uuid NOT NULL  → offers(id) ON DELETE CASCADE,
  item_type        text           CHECK IN ('labor','material','service','travel','lump_sum'),
  name             text NOT NULL,
  unit             text NULL,
  qty              numeric NOT NULL DEFAULT 1,
  unit_price_net   numeric NOT NULL DEFAULT 0,
  vat_rate         numeric NULL,
  line_total_net   numeric NOT NULL,
  created_at, updated_at
)
```

### RLS — weryfikacja IDOR (test SQL)

```sql
-- 1. User A tworzy ofertę + pozycje
INSERT INTO public.offers (user_id, title, status)
VALUES ('user-a-uuid', 'Oferta A', 'DRAFT');

INSERT INTO public.offer_items (user_id, offer_id, name, qty, unit_price_net, line_total_net)
VALUES ('user-a-uuid', '<offer-a-id>', 'Malowanie', 1, 100, 100);

-- 2. Symuluj User B
SET SESSION "request.jwt.claims" = '{"sub": "user-b-uuid"}';

-- 3. User B NIE widzi pozycji User A (RLS blokuje)
SELECT count(*) FROM public.offer_items WHERE user_id = 'user-a-uuid';
-- Oczekiwane: count = 0

-- 4. User B NIE może usunąć pozycji User A
DELETE FROM public.offer_items WHERE user_id = 'user-a-uuid';
-- Oczekiwane: DELETE 0
```

### Pliki zmienione / dodane

| Plik | Opis |
|------|------|
| `supabase/migrations/20260301150000_pr10_offer_items.sql` | Migracja offer_items + FK + total_vat |
| `src/hooks/useOfferWizard.ts` | Types WizardItem/WizardFormData, computeTotals(), useLoadOfferDraft(), useSaveDraft() |
| `src/components/offers/wizard/OfferWizard.tsx` | Główny kontener 3-krokowy (step indicator, walidacja, nawigacja) |
| `src/components/offers/wizard/WizardStepClient.tsx` | Krok 1: wyszukiwanie klientów + inline nowy klient |
| `src/components/offers/wizard/WizardStepItems.tsx` | Krok 2: biblioteka cennika + manualne dodawanie + live totals |
| `src/components/offers/wizard/WizardStepReview.tsx` | Krok 3: podsumowanie + tytuł + zapisz szkic |
| `src/pages/OfferDetail.tsx` | Zastąpiono placeholder → OfferWizard (new/edit) |
| `src/i18n/locales/pl.json` | Klucze `offerWizard.*` (PL) |
| `src/i18n/locales/en.json` | Klucze `offerWizard.*` (EN) |
| `src/i18n/locales/uk.json` | Klucze `offerWizard.*` (UK) |
| `docs/ROADMAP_STATUS.md` | Ten plik — aktualizacja statusu PR-10 DONE |

### Reguła draftów (ADR-0004 respektowana)

- ✅ Szkice **NIE** liczą się do limitu `FREE_TIER_OFFER_LIMIT`
- ✅ `useSaveDraft` zawsze pozwala zapisać — bez sprawdzania kwoty
- ✅ Kwota sprawdzana dopiero przy SEND (PR-11+)

### Jak testować PR-10 — 5-krokowa lista kontrolna

**Krok 1 — Nowa oferta z empty state:**
1. Idź na `/app/offers` → lista pusta → kliknij CTA "Utwórz pierwszą ofertę"
2. Otwiera się wizard na `/app/offers/new`
3. Krok 1 (Klient): wybierz klienta z listy LUB kliknij "Dodaj nowego klienta" → wypełnij imię
4. Krok "Następna" → Krok 2 (Pozycje): wyszukaj cennik lub "Dodaj ręcznie"
5. Dodaj 2-3 pozycje, edytuj qty/cenę → totals aktualizują się na żywo
6. "Następna" → Krok 3 (Podsumowanie): wpisz tytuł, kliknij "Zapisz szkic"
7. Toast sukcesu → przekierowanie na listę → szkic widoczny na liście

**Krok 2 — Edycja szkicu:**
1. Na liście kliknij szkic → otwiera się wizard w trybie edycji
2. Dane wczytane poprawnie (klient, pozycje, tytuł)
3. Zmień pozycję → zapisz → lista zaktualizowana

**Krok 3 — Walidacja:**
1. Na kroku 1: kliknij "Następna" bez wyboru klienta → pojawia się błąd
2. Na kroku 2: kliknij "Następna" bez pozycji → pojawia się błąd
3. Na kroku 2: zostaw nazwę pozycji pustą → błąd przy próbie przejścia

**Krok 4 — FF_NEW_SHELL ON/OFF:**
```js
// ON
localStorage.setItem('FF_NEW_SHELL', 'true'); location.reload();
// OFF
localStorage.setItem('FF_NEW_SHELL', 'false'); location.reload();
```
W obu trybach: `/app/offers/new` otwiera wizard poprawnie.

**Krok 5 — i18n PL/EN/UK:**
1. Zmień język w ustawieniach
2. Wszystkie etykiety wizarda przetłumaczone (tytuł, przyciski, komunikaty błędów)
3. Brak hardcoded polskich tekstów w nowych komponentach

---

## PR-11 — Oferty B2: PDF + wysyłka: co zostało wdrożone

### Baza danych

| Plik | Opis |
|------|------|
| `supabase/migrations/20260301160000_pr11_quota_fn_update.sql` | Aktualizacja `count_monthly_finalized_offers()` — teraz zlicza z OBYDWU tabel: `offer_approvals` (stary flow) + `offers` (nowy flow PR-11). Index `idx_offers_user_status_sent_at`. Backward-compatible. |

### Reguła kwoty (ADR-0004 — niezmieniona)

- ✅ Drafty **NIE** blokowane (quota = 0 dla szkiców)
- ✅ SEND → quota +1 (zliczane przez `sent_at` w nowym flow)
- ✅ **Idempotentność**: re-wysyłka tej samej oferty (status już SENT) → quota nie zmienia się, `sent_at` nie nadpisywany
- ✅ Dwa flow (stary przez `offer_approvals`, nowy przez `offers`) → bez double-countingu (różne tabele)

### Pliki zmienione / dodane

| Plik | Opis |
|------|------|
| `supabase/migrations/20260301160000_pr11_quota_fn_update.sql` | Migracja DB — aktualizacja funkcji quota |
| `src/lib/offerPdfPayloadBuilder.ts` | Buduje `OfferPdfPayload` z tabel `offers + offer_items + clients + profiles` |
| `src/hooks/useSendOffer.ts` | Mutation: idempotency check → SENT status → PDF upload → email (best-effort) |
| `src/components/offers/OfferPreviewModal.tsx` | Modal: podgląd HTML A4, Download PDF, Send (quota gate), link kopiowania |
| `src/components/offers/wizard/WizardStepReview.tsx` | Dodano prop `onPreviewAndSend` + przycisk "Podgląd i Wyślij" |
| `src/components/offers/wizard/OfferWizard.tsx` | Dodano `handlePreviewAndSend`, stan `previewOfferId`, `<OfferPreviewModal>` |
| `src/i18n/locales/pl.json` | Klucze `offerPreview.*` (32 klucze PL) + `offerWizard.reviewStep.previewAndSend` |
| `src/i18n/locales/en.json` | Klucze `offerPreview.*` (32 klucze EN) |
| `src/i18n/locales/uk.json` | Klucze `offerPreview.*` (32 klucze UK) |
| `docs/ROADMAP_STATUS.md` | Ten plik — aktualizacja statusu PR-11 DONE |

### Architektura decyzji (send flow)

```
DRAFT → [user kliknie "Podgląd i Wyślij"]
  → saveDraft() → offerId
  → OfferPreviewModal otwiera się
  → [user kliknie "Wyślij do klienta"]
    → useFreeTierOfferQuota check (canSend?)
    → TAK: useSendOffer.mutate(offerId, clientEmail)
      → offers.status = 'SENT', sent_at = now()    ← kwota +1
      → generateOfferPdf() → uploadOfferPdf()       ← non-fatal
      → send-offer-email EF                          ← non-fatal
      → invalidate: offers + quota caches
    → NIE: FreeTierPaywallModal
```

### Jak testować PR-11

**Happy path (nowa oferta → wyślij):**
1. Idź na `/app/offers/new`
2. Krok 1: Wybierz klienta (lub dodaj nowego z emailem)
3. Krok 2: Dodaj 2-3 pozycje z cenami
4. Krok 3: Wpisz tytuł → kliknij "Podgląd i Wyślij"
5. Modal podglądu otwiera się → widać logo firmy, dane klienta, tabelę pozycji, sumy
6. Kliknij "Pobierz PDF" → PDF pobierany lokalnie
7. Kliknij "Wyślij do klienta" → toast sukcesu, status = SENT
8. Na liście ofert → oferta z badge "Wysłana"

**Quota gating (free plan 3/3):**
1. Miej 3 wysłane oferty w bieżącym miesiącu
2. Utwórz nowy szkic → krok 3 → "Podgląd i Wyślij"
3. Modal otwiera się → alert o wyczerpaniu limitu
4. Kliknij "Wyślij" → FreeTierPaywallModal się otwiera (nie wysyła)
5. Zamknij modal → szkic niezmieniony (wciąż DRAFT)

**Idempotentność:**
1. Wyślij ofertę → status SENT (kwota +1)
2. Otwórz tę samą ofertę → przycisk "Wyślij" niewidoczny (już SENT)
3. (Przez API) wywołaj useSendOffer ponownie → `alreadySent = true`, quota niezmieniona

**FF_NEW_SHELL:**
- OFF: `/app/offers/:id` otwiera wizard → Krok 3 → "Podgląd i Wyślij" działa
- ON: zakładka "Oferty" → wybierz szkic → to samo działanie

**i18n:**
- Zmień język na EN → wszystkie napisy modalu przetłumaczone
- Zmień na UK → "Попередній перегляд пропозиції"

### RLS / bezpieczeństwo
- Nowe migracje nie tworzą nowych tabel — tylko aktualizują funkcję DB
- Funkcja `count_monthly_finalized_offers` jest `SECURITY DEFINER` — użytkownik widzi tylko swoje dane
- `useSendOffer` aktualizuje tylko wiersz z `eq('id', offerId)` — RLS oferuje dodatkową ochronę

---

## PR-12 — Oferty C: Acceptance Link + Bulk Add: co zostało wdrożone

### Pliki dotknięte

| Plik | Zmiana |
|------|--------|
| `supabase/migrations/20260301170000_pr12_acceptance_links.sql` | Nowe tabele: `acceptance_links` + `offer_public_actions`, RLS, SECURITY DEFINER functions |
| `src/hooks/useAcceptanceLink.ts` | Hook: fetch/create/delete acceptance link (owner side) |
| `src/components/offers/AcceptanceLinkPanel.tsx` | Panel w offer detail: utwórz/kopiuj link, status ACCEPTED/REJECTED, CTA "Utwórz projekt" |
| `src/components/offers/BulkAddItems.tsx` | Dialog: wklej linie lub upload CSV, podgląd + walidacja, dodaj pozycje |
| `src/pages/OfferPublicAccept.tsx` | Publiczna strona `/a/:token`: podgląd oferty + Accept/Reject bez logowania |
| `src/pages/OfferDetail.tsx` | DRAFT → wizard; SENT/ACCEPTED/REJECTED → AcceptanceLinkPanel |
| `src/pages/Offers.tsx` | OfferRow: CTA "Utwórz projekt" dla ACCEPTED ofert |
| `src/components/offers/wizard/WizardStepItems.tsx` | Dodano BulkAddItems obok "Dodaj ręcznie" |
| `src/App.tsx` | Nowa trasa: `/a/:token` → `OfferPublicAccept` |
| `src/i18n/locales/pl.json` | Klucze: `acceptanceLink.*`, `publicOffer.*`, `bulkAdd.*` |
| `src/i18n/locales/en.json` | Jak wyżej (EN) |
| `src/i18n/locales/uk.json` | Jak wyżej (UK) |
| `docs/ROADMAP_STATUS.md` | Ten plik — aktualizacja statusu |

### Architektura bezpieczeństwa

- **Token:** UUID v4 generowany przez PostgreSQL (`gen_random_uuid()`) — 122 bity entropii, niemożliwy do zgadnięcia
- **Wygaśnięcie:** 30 dni, egzekwowane server-side w funkcji DB (nie tylko klient)
- **Cross-tenant:** niemożliwy — token → jeden offer_id (FK + UNIQUE)
- **Publiczny dostęp:** SECURITY DEFINER function `resolve_offer_acceptance_link()` — omija RLS bezpiecznie, zwraca tylko dane tej jednej oferty
- **Akcja (ACCEPT/REJECT):** SECURITY DEFINER function `process_offer_acceptance_action()` — waliduje token, wygaśnięcie, status SENT, idempotentna
- **Rate limiting:** Dokumentacja w SECURITY_BASELINE.md — zastosuj na warstwie CDN/Edge (Vercel Edge Middleware lub Supabase rate limiter), nie wymaga nowej infrastruktury

### Jak testować PR-12

**Flow akceptacji:**
1. Utwórz ofertę → wyślij → status SENT
2. Otwórz `/app/offers/:id` → kliknij "Utwórz link akceptacji" → skopiuj URL
3. Otwórz URL `/a/<token>` w przeglądarce (bez logowania) → widać ofertę
4. Kliknij "Akceptuję ofertę" → status zmienia się na ACCEPTED, wyświetla banner
5. Wróć do `/app/offers` → oferta ma badge "Zaakceptowana" + CTA "Utwórz projekt"
6. Ścieżka REJECT też działa
7. Stary/wygasły token → strona pokazuje "Link wygasł"

**Bulk add:**
1. Utwórz nową ofertę → Krok 2 (pozycje) → kliknij "Dodaj wiele pozycji"
2. Wklej 3 linie w formacie "Nazwa; Ilość; Jedn.; Cena"
3. Kliknij "Podgląd" → tabela z walidacją
4. Nieprawidłowa linia pokazuje błąd i nie zapisuje się
5. Kliknij "Dodaj X pozycji" → pozycje pojawiają się w ofercie

**FF_NEW_SHELL:**
- OFF: `/app/offers` + `/app/offers/:id` działają normalnie
- ON: zakładka "Oferty" → to samo działanie

**i18n:**
- Publiczna strona `/a/:token` tłumaczona na PL/EN/UK (zależy od localStorage `i18nextLng`)

*Tracker: v1.0 | Data: 2026-03-01 | Właściciel: Robert B. + Claude*

---

## PR-13 — Projekty + QR Status: co zostało wdrożone

### Baza danych

| Plik | Opis |
|------|------|
| `supabase/migrations/20260301180000_pr13_projects_v2.sql` | Tabela `v2_projects` (RLS 4 polityki + indeksy + trigger updated_at), `project_public_status_tokens` (RLS 4 polityki), SECURITY DEFINER `resolve_project_public_token()` — zwraca TYLKO tytuł/etapy/postęp, BEZ cen |

### Schemat v2_projects

```sql
v2_projects (
  id               uuid PK,
  user_id          uuid NOT NULL → auth.users(id) ON DELETE CASCADE,
  client_id        uuid NULL → clients(id) ON DELETE SET NULL,
  source_offer_id  uuid NULL → offers(id) ON DELETE SET NULL,
  title            text NOT NULL,
  status           text DEFAULT 'ACTIVE' CHECK IN ('ACTIVE','COMPLETED','ON_HOLD'),
  start_date       date NULL,
  end_date         date NULL,
  progress_percent integer DEFAULT 0 CHECK (0..100),
  stages_json      jsonb DEFAULT '[]',  -- [{name, due_date, is_done, sort_order}]
  total_from_offer numeric(14,2) NULL,  -- STORED but NOT exposed in QR view
  created_at, updated_at
)
```

### Zakres QR — co NIE jest ujawniane

Funkcja `resolve_project_public_token()` zwraca WYŁĄCZNIE:
- `title`, `status`, `progress_percent`, `start_date`, `end_date`, `stages_json`, `created_at`
- **NIE zwraca:** `total_from_offer`, `client_id`, `user_id`, żadnych kwot finansowych
- Publiczna strona `/p/:token` nie wyświetla żadnych cen

### Pliki zmienione / dodane

| Plik | Opis |
|------|------|
| `supabase/migrations/20260301180000_pr13_projects_v2.sql` | Schemat DB (v2_projects + tokens + SECURITY DEFINER) |
| `src/hooks/useProjectsV2.ts` | Hooki: list, single, create, update, token fetch/create |
| `src/pages/ProjectsList.tsx` | Lista projektów (/app/projects) — filtry status + search |
| `src/pages/ProjectHub.tsx` | Hub projektu (/app/projects/:id) — accordion + progress + QR |
| `src/pages/ProjectPublicStatus.tsx` | Publiczna strona QR (/p/:token) — bez logowania, bez cen |
| `src/pages/Offers.tsx` | Aktualizacja handleCreateProject → useCreateProjectV2 + navigate |
| `src/components/offers/AcceptanceLinkPanel.tsx` | CTA "Utwórz projekt" → useCreateProjectV2 + navigate do hub |
| `src/App.tsx` | Trasy: /app/projects, /app/projects/:id, /p/:token |
| `src/components/layout/NewShellBottomNav.tsx` | Projekty → /app/projects (było: /app/jobs) |
| `src/i18n/locales/pl.json` | projectsV2.* (55 kluczy PL) |
| `src/i18n/locales/en.json` | projectsV2.* (55 kluczy EN) |
| `src/i18n/locales/uk.json` | projectsV2.* (55 kluczy UK) |
| `docs/ROADMAP_STATUS.md` | Ten plik — aktualizacja statusu PR-13 DONE |

### RLS — weryfikacja IDOR (kroki testowe)

```sql
-- W Supabase Dashboard → SQL Editor

-- 1. User A tworzy projekt
INSERT INTO public.v2_projects (user_id, title, status, progress_percent, stages_json)
VALUES ('user-a-uuid', 'Projekt Testowy A', 'ACTIVE', 0, '[]');
-- Zapisz: projekt_a_id

-- 2. Symuluj User B (zmień JWT)
SET SESSION "request.jwt.claims" = '{"sub": "user-b-uuid"}';

-- 3. User B NIE widzi projektu User A (RLS blokuje)
SELECT count(*) FROM public.v2_projects WHERE user_id = 'user-a-uuid';
-- Oczekiwane: count = 0

-- 4. User B NIE może modyfikować projektu User A
UPDATE public.v2_projects SET title = 'hacked' WHERE user_id = 'user-a-uuid';
-- Oczekiwane: UPDATE 0

DELETE FROM public.v2_projects WHERE user_id = 'user-a-uuid';
-- Oczekiwane: DELETE 0

-- 5. Token projektu A — publiczny dostęp przez SECURITY DEFINER
-- Utwórz token dla projektu A (jako User A):
INSERT INTO public.project_public_status_tokens (user_id, project_id)
VALUES ('user-a-uuid', '<projekt_a_id>');
-- Pobierz token UUID

-- 6. Wywołaj SECURITY DEFINER function (anon key, bez RLS):
SELECT public.resolve_project_public_token('<token-uuid>');
-- Oczekiwane: tylko title/status/progress/stages — BEZ total_from_offer

-- 7. Token projektu A nie ujawnia projektu User B
-- Sprawdź że response NIE zawiera user_id, client_id, total_from_offer
```

### Jak testować PR-13

**Flow: oferta → projekt:**
1. Przejdź do `/app/offers` → znajdź ofertę ze statusem ACCEPTED
2. Kliknij "Utwórz projekt" → toast sukcesu → przekierowanie na `/app/projects/:id`
3. Projekt powinien mieć tytuł z oferty + klienta + total_from_offer (stored)

**ProjectsList:**
1. `/app/projects` → lista projektów z filtrem ACTIVE/COMPLETED/ON_HOLD
2. Wyszukaj po tytule → filtruje na żywo (debounce 300ms)
3. EmptyState z CTA → prowadzi do `/app/offers?filter=ACCEPTED`

**ProjectHub:**
1. Otwórz projekt → sekcja "Etapy prac" otwarta domyślnie
2. Dodaj etap (wpisz nazwę → Enter lub kliknij +) → pojawia się na liście
3. Kliknij checkbox etapu → oznacza jako ukończony, progress aktualizuje się
4. Suwak postępu → przeciągnij → "Zapisz postęp" lub auto-save (onValueCommit)
5. Sekcje "Koszty", "Dokumenty", "Zdjęcia" → placeholder informuje o przyszłych PR

**QR link:**
1. W ProjectHub → panel "Link statusu dla klienta" → kliknij "Wygeneruj link"
2. Skopiuj URL `/p/<token>`
3. Otwórz URL bez logowania → widać tytuł, postęp, etapy — BEZ cen
4. Strona wyświetla notatkę "Strona statusu nie zawiera informacji o cenach"

**FF_NEW_SHELL:**
- ON: BottomNav zakładka "Projekty" → `/app/projects` (nowa lista)
- OFF: `/app/projects` dostępne przez URL (stary shell bez dolnej nawigacji)
- Obie ścieżki: `/app/jobs` nadal działa (stary system — nie usunięty)

**i18n PL/EN/UK:**
- Zmień język → ProjectsList, ProjectHub, ProjectPublicStatus — wszystkie napisy tłumaczone
- Klucze: `projectsV2.*` (55 kluczy w każdym języku)
