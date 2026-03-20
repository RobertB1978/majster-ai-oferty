# CLAUDE CODE — WYTYCZNE OPERACYJNE MAJSTER.AI
Wersja: 2026-03-20 | Status: AKTYWNA
Źródło prawdy: to jest nadrzędny dokument dla każdej sesji Claude Code na tym repo.

## 0. ZASADA NADRZĘDNA
Przed każdą sesją przeczytaj ten plik + CLAUDE.md + STAN_PROJEKTU.md. Każda zmiana MUSI pasować do jednej z kategorii z sekcji 2. Jeśli coś jest niejasne — ZATRZYMAJ SIĘ i zapytaj zamiast zgadywać.

## 1. ARCHITEKTURA — ŹRÓDŁA PRAWDY

### System projektów (krytyczne)

| Kryterium | LEGACY (nie dotykaj) | CANONICAL (tutaj pracuj) |
|-----------|---------------------|--------------------------|
| Tabela DB | `projects` | `v2_projects` |
| Hook | `useProjects.ts` | `useProjectsV2.ts` |
| Strony UI | QuoteEditor, Gantt | ProjectsList, ProjectHub, NewProjectV2 |
| Edge Functions | — | `approve-offer` (dual-write) |
| Nowe funkcje | ❌ ZAKAZ | ✅ zawsze tutaj |

**Zasada:** Każda nowa funkcja projektowa idzie do `v2_projects`. Legacy istnieje tylko żeby stare widoki nie crashowały. Docelowo legacy zastąpimy jedną migracją FK — termin otwarty.

**Wyjątek:** `QuoteEditor.tsx` i `PdfGenerator.tsx` nadal czytają z `projects` (legacy) przez `useProject()`. Dopóki migracja nie jest gotowa — nie przenoś ich. Jeśli tworzysz nową funkcję w tych plikach — dodaj obsługę obu źródeł lub poczekaj na decyzję właściciela.

### Routing — strefy

```
ZONE 1: /           → public, no auth (landing, legal, /oferta/:token, /a/:token)
ZONE 2: /app/*      → auth required (AppLayout lub NewShellLayout gdy FF_NEW_SHELL=true)
ZONE 3: /admin/*    → admin role required (AdminGuard + AdminLayout)
```

### Feature flags

`FF_NEW_SHELL` — kontroluje stary vs nowy shell. Env var ma pierwszeństwo nad localStorage. Każdy PR musi działać przy `FF_NEW_SHELL=true` ORAZ `FF_NEW_SHELL=false`. Nowe flagi: tylko przez `VITE_*` env var. Nie dodawaj nowych flag do localStorage bez zgody właściciela.

## 2. KATEGORYZACJA ZADAŃ

Każde zadanie należy do JEDNEJ kategorii:

### CAT-A: Bloker produkcji (P0)
Przerywasz inne prace i robisz to najpierw.
- Błąd który niszczy dane użytkownika
- Błąd który blokuje core flow (oferta → akceptacja → projekt)
- Błąd security (IDOR, auth bypass, data leak)
- TypeScript error blokujący build

### CAT-B: Naprawa (P1)
Robi się w następnym PR, nie odkłada dłużej.
- Bug wpływający na UX < 100% użytkowników
- Nieprawidłowe zachowanie edge case
- Race condition bez natychmiastowych konsekwencji

### CAT-C: Refaktor (P2)
Robi się gdy nie ma aktywnych P0/P1.
- Podział god-componentów (WorkspaceLineItems, OfferPublicAccept)
- Migracja legacy hooków
- Czyszczenie dead code

### CAT-D: Feature (P3)
Tylko po aprobacie właściciela. Zawsze nowy branch.

## 3. STANDARD PR — OBOWIĄZKOWY

### Branch naming

```
fix/short-description-[suffix]      # P0/P1
refactor/short-description-[suffix] # P2
feat/short-description-[suffix]     # P3
```

Suffix = 4-5 losowych znaków alfanumerycznych.

### Przed każdym commitem

```bash
npm run type-check    # 0 błędów — obowiązkowe
npm run lint          # 0 błędów ERROR — obowiązkowe (warnings OK)
npm test              # coverage >= 40% lines — obowiązkowe
```

### Commit format (Conventional Commits)

```
fix(offers): correct hasVariants threshold in OfferPublicAccept
feat(billing): add Stripe checkout session creation
refactor(workspace): extract WorkspaceLineItemRow from WorkspaceLineItems
```

### PR description — wymagane sekcje

```markdown
## Co zmienia ten PR
[1-3 zdania]

## Kategoria
CAT-[A/B/C/D] — [P0/P1/P2/P3]

## Pliki zmienione
- `src/...` — co i dlaczego
- `supabase/functions/...` — co i dlaczego

## Testy
- [ ] type-check: PASS
- [ ] lint: PASS (N warnings, 0 errors)
- [ ] unit tests: PASS (N/N)
- [ ] e2e: [PASS / SKIP — uzasadnienie]

## Wpływ na legacy
- [ ] Nie dotyka `projects` / `useProjects` (legacy)
- [ ] FF_NEW_SHELL=true: PASS
- [ ] FF_NEW_SHELL=false: PASS
```

## 4. SECURITY — REGUŁY NIENARUSZALNE

### Edge Functions
- **CORS:** używaj `getCorsHeaders(req)` z `_shared/cors.ts`. Nigdy hardcoded `*` w nowych funkcjach.
- **Auth:** każda funkcja chroniąca dane użytkownika musi wywołać `supabase.auth.getUser(token)`.
- **Service role key:** tylko w Edge Functions, nigdy w kodzie frontendowym.
- **Rate limiting:** `checkRateLimit()` z `_shared/rate-limiter.ts` dla każdego publicznego endpointu.

### Frontend
- Brak sekretów w kodzie. Tylko `VITE_*` env vars w kliencie.
- Zod validation na każdym formularzu przed wysłaniem do API.
- Nie ufaj danym z URL params bez walidacji (szczególnie tokeny, UUID).

### Baza danych
- Nowe tabele: zawsze RLS enabled + minimum 2 polityki (SELECT własnych danych, INSERT z user_id).
- Nowe funkcje RPC: `SECURITY DEFINER` + explicite ownership check w ciele funkcji.
- Migracje: plik w `supabase/migrations/` z timestamp. Nigdy ręczna zmiana schematu.

## 5. ZNANE DŁUGI TECHNICZNE — KONTEKST

### [DEBT-001] useProjects legacy w QuoteEditor / PdfGenerator / WorkTasksGantt
**Status:** Świadoma decyzja właściciela — nie naprawiaj bez polecenia.
**Ryzyko:** Projekt z nowego flow może być niewidoczny w edytorze wycen.
**Plan:** Migracja FK gdy `legacy projects → v2_projects` będzie gotowa.

### [DEBT-002] WorkspaceLineItems.tsx — god component (1143 LOC)
**Status:** Zaplanowany refaktor (CAT-C). Plan rozbicia:
- `WorkspaceLineItemRow.tsx` — jeden wiersz tabeli
- `WorkspaceTotalsBar.tsx` — pasek sum netto/VAT/brutto
- `useWorkspaceItems.ts` — logika stanu i edycji
- `WorkspaceColumnSettings.tsx` — ustawienia widoczności kolumn

**Warunek:** Napisz testy dla obecnego zachowania PRZED refaktorem. Porównaj output przed/po.

### [DEBT-003] OfferPublicAccept.tsx — oversized (712 LOC)
**Status:** Zaplanowany refaktor (CAT-C). BUG hasVariants naprawiony — bezpieczne do podziału. Plan rozbicia:
- `OfferPublicHeader.tsx` — logo + dane firmy
- `OfferPublicVariantTabs.tsx` — zakładki wyboru wariantu
- `OfferPublicItemsTable.tsx` — tabela pozycji
- `OfferPublicActionBar.tsx` — przyciski akceptuj/odrzuć + podpis

### [DEBT-004] FF_NEW_SHELL w localStorage
**Status:** Świadoma decyzja — pozostaje do czasu pełnego rolloutu nowego shella.
**Ograniczenie:** Nie używaj localStorage dla żadnych nowych flag.

### [DEBT-005] Rate limiter bypass (allowed:true gdy brak klienta)
**Status:** Otwarty bug P1.
**Naprawa:** Zmień na `allowed: false` + `console.error` gdy `!supabaseClient`.

### [DEBT-006] CORS — 3 niezmienione funkcje
**Status:** Częściowo akceptowalne, częściowo otwarte.
- `csp-report`: wildcard uzasadniony (browser reporting z dowolnej domeny)
- `cleanup-expired-data`: cron job, wildcard nieistotny (wymaga auth header)
- `send-expiring-offer-reminders`: otwarte — migruj na `getCorsHeaders()` w następnym PR

### [DEBT-007] ProtectedRoute — nowy komponent, nie wdrożony
**Status:** P1 — komponent istnieje ale nie jest użyty w `App.tsx`.
**Problem:** Property mismatch: używa `loading` zamiast `isLoading` z `AuthContext`.
**Akcja:** Naprawić + wdrożyć w `/app/*` routes lub usunąć.

## 6. STRIPE — STATUS MONETYZACJI

Kod Stripe jest gotowy (checkout session, webhook z weryfikacją podpisu, customer portal). Brakuje wyłącznie konfiguracji właściciela:
- Stripe Price IDs w `src/config/plans.ts` (obecnie `null`)
- `VITE_STRIPE_ENABLED=true` w Vercel env
- `STRIPE_WEBHOOK_SECRET` w Supabase Secrets

**Nie modyfikuj logiki Stripe bez polecenia. Nie "naprawiaj" działającego kodu płatności.**

## 7. I18N — POLITYKA OSTRZEŻEŃ

627 warningów ESLint `i18next/no-literal-string` to istniejący dług sprzed obecnej pracy. Reguła:
- **Nowy kod:** ZERO hardcoded strings w JSX — zawsze `t('klucz')`
- **Istniejący dług:** nie naprawiaj w PR który robi coś innego (scope creep)
- **Dedykowany PR i18n cleanup:** tylko gdy właściciel zleca

## 8. TESTOWANIE

### Wymagane przy nowych komponentach

```typescript
// Minimum: smoke test + 1 przypadek happy path + 1 edge case
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
```

### Wymagane przy nowych hookach
- Testy jednostkowe dla funkcji pure (jak `computeTotalsForItems`)
- Mock Supabase dla hooków z side effects

### Wymagane przy nowych Edge Functions
- Test happy path z poprawnym payload
- Test walidacji (brakujące pola, złe typy)
- Test auth (brak tokenu, wygasły token)

### Nie blokuj PR z powodu pokrycia < 40% jeśli
- Zmiana jest bugfixem jednej linii
- Zmiana jest w pliku który już był < 40% przed zmianą
- Właściciel zatwierdził wyjątek

## 9. CHECKLIST PRZED ZAKOŃCZENIEM SESJI

- [ ] `npm run type-check` — 0 błędów
- [ ] `npm run lint` — 0 błędów ERROR
- [ ] `npm test` — wszystkie testy zielone
- [ ] Żaden nowy hardcoded string w JSX
- [ ] Żadne sekrety w kodzie
- [ ] PR description wypełniony zgodnie z sekcją 3
- [ ] Wpływ na legacy (`projects`/`useProjects`) oceniony
- [ ] `FF_NEW_SHELL=true` i `false` — oba działają
- [ ] `CLAUDE.md` i `STAN_PROJEKTU.md` zaktualizowane jeśli zmiana architekturalna
