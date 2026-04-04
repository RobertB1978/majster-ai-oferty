# ACCEPTANCE FLOW MAP — 2026-04-04

> **READ-ONLY AUDIT** — branch `claude/acceptance-flow-audit-ykNaS`  
> SHA: `75bd71847df55d7f6c62e0f545bdb82f87969bf4`  
> Autor: Claude Code Web (Senior Backend Engineer + Domain Auditor)

---

## PRE-FLIGHT

| Parametr | Wartość |
|---|---|
| Branch | `claude/acceptance-flow-audit-ykNaS` |
| SHA | `75bd71847df55d7f6c62e0f545bdb82f87969bf4` |
| node_modules | **MISSING** — tryb STATIC-ONLY |
| type-check | **UNKNOWN** — brak node_modules |
| vitest | **UNKNOWN** — brak node_modules |
| Tryb wykonania testów | STATIC-ONLY (testy jako kontrakt, nie jako wynik runtime) |
| Live / production state | **UNKNOWN** — brak dostępu do dashboard |

---

## MAPA FLOW AKCEPTACJI

### FLOW A — Legacy (`offer_approvals` + Edge Function `approve-offer`)

| Aspekt | Wartość |
|---|---|
| **Plik główny (frontend)** | `src/pages/OfferApproval.tsx:15` |
| **Publiczny route** | `/offer/:token` (`src/App.tsx:245`) |
| **Token source** | `offer_approvals.public_token` (UUID v4, auto-gen przy INSERT) |
| **1-click token** | `offer_approvals.accept_token` (oddzielna kolumna, walidowana po stronie edge) |
| **Tabela źródłowa** | `public.offer_approvals` |
| **Edge Function** | `supabase/functions/approve-offer/index.ts` |
| **HTTP wywołanie** | `POST ${VITE_SUPABASE_URL}/functions/v1/approve-offer` (`OfferApproval.tsx:101`) |
| **Akcje** | `approve`, `reject`, `cancel_accept` (10 min), `withdraw` (auth required) |
| **Status progression** | `pending` → `sent` → `viewed` → `accepted/approved` → `rejected/expired/withdrawn` |
| **Tabela statusu** | `offer_approvals.status` (lowercase: `accepted`, `approved`) |
| **Tworzy v2_project** | **TAK** — `createAndLinkV2Project()` (`approve-offer/index.ts:28–95`) |
| **Idempotencja v2** | `offer_approvals.v2_project_id` (kolumna dodana w `20260311180000_acceptance_bridge.sql`) |
| **Powiadomienia** | **TAK** — viewed, accepted, rejected, expired, cancel_accept (`approve-offer/index.ts:172,197,401,408`) |
| **Zależność legacy** | `projects.project_name`, `quotes.total` (do budżetu v2_project) |
| **Aktywny w repo** | **TAK** |

#### Ścieżka boczna — `src/lib/publicOfferApi.ts:83`

`acceptPublicOffer()` wywołuje ten sam edge function `approve-offer` z `action: 'approve'` i `accepted_via: 'web_button'`. Jest to alternatywny caller dla tego samego LEGACY flow.

---

### FLOW B — New (`acceptance_links` + SECURITY DEFINER DB functions)

| Aspekt | Wartość |
|---|---|
| **Plik główny (frontend)** | `src/pages/OfferPublicAccept.tsx:227` |
| **Publiczny route** | `/a/:token` (`src/App.tsx:251`) |
| **Token source** | `acceptance_links.token` (UUID v4, 30-day TTL, UNIQUE per offer) |
| **Tabela źródłowa** | `public.acceptance_links` + `public.offer_public_actions` (audit) |
| **Edge Function** | **BRAK** — wywołania bezpośrednio do DB funkcji SECURITY DEFINER |
| **DB funkcja — read** | `resolve_offer_acceptance_link(p_token uuid)` (`20260301170000_pr12_acceptance_links.sql:97`) |
| **DB funkcja — write** | `process_offer_acceptance_action(p_token, p_action, p_comment)` (`20260301170000_pr12_acceptance_links.sql:205`) |
| **Akcje** | `ACCEPT`, `REJECT` |
| **Status progression** | `SENT` → `ACCEPTED` / `REJECTED` (uppercase) |
| **Tabela statusu** | `offers.status` (UPPERCASE: `ACCEPTED`, `REJECTED`) |
| **Tworzy v2_project** | **NIE automatycznie** — po ACCEPTED wyświetlany przycisk "Utwórz projekt" w `AcceptanceLinkPanel.tsx:116` |
| **Tworzenie v2 (manualne)** | `useCreateProjectV2({ title, source_offer_id: offerId })` (`AcceptanceLinkPanel.tsx:123`) |
| **Powiadomienia** | **BRAK** — `process_offer_acceptance_action` nie wstawia do tabeli `notifications` |
| **Audit log** | `offer_public_actions` (INSERT przy każdej akcji) |
| **Zależność legacy** | **BRAK** — działa tylko na `offers`, `offer_items`, `clients`, `profiles` |
| **Aktywny w repo** | **TAK** |

#### Zarządzanie linkiem (owner side)

| Plik | Linia | Akcja |
|---|---|---|
| `src/hooks/useAcceptanceLink.ts:54` | | `upsert_acceptance_link(p_offer_id, p_user_id)` — atomowy UPSERT |
| `src/hooks/useAcceptanceLink.ts:81` | | DELETE linku |
| `src/components/offers/AcceptanceLinkPanel.tsx:45` | | Panel UI (tworzenie/kopiowanie/status) |
| `src/components/offers/OfferPreviewModal.tsx:186` | | Podgląd + wysyłka emaila z linkiem `/a/TOKEN` |

---

## MACIERZ LEGACY VS NEW

| Aspekt | Legacy flow (`offer_approvals`) | New flow (`acceptance_links`) |
|---|---|---|
| **Trigger** | Klient otwiera `/offer/:token` | Klient otwiera `/a/:token` |
| **Public route** | `/offer/:token` | `/a/:token` |
| **Token source** | `offer_approvals.public_token` (UUID v4) | `acceptance_links.token` (UUID v4, TTL 30 dni) |
| **Tabela źródłowa** | `offer_approvals` | `acceptance_links` → `offers` |
| **Funkcja / RPC / Edge** | Edge Function `approve-offer` (Deno) | SECURITY DEFINER: `resolve_offer_acceptance_link`, `process_offer_acceptance_action` |
| **Status finalny** | `offer_approvals.status = 'accepted'` (lowercase) | `offers.status = 'ACCEPTED'` (UPPERCASE) |
| **Auto-konwersja do v2_project** | **TAK** (Acceptance Bridge, idempotentna) | **NIE** (manualne kliknięcie w AcceptanceLinkPanel) |
| **Powiadomienia wykonawcy** | **TAK** (viewed, accepted, rejected, expired, cancel) | **NIE** |
| **Cancel window (10 min)** | **TAK** (`cancel_accept` action) | **NIE** |
| **Withdraw przez wykonawcę** | **TAK** (wymaga JWT) | **NIE** |
| **1-click accept z emaila** | **TAK** (`?t=` query param + `accept_token`) | **NIE** |
| **Warianty oferty** | **NIE** | **TAK** (renders variants gdy `offer_variants` istnieją) |
| **Audit log** | Implicitny (statusy w `offer_approvals`) | Explicitny (`offer_public_actions`) |
| **Zależność od legacy `projects`** | **TAK** (czyta `project_name`, `quotes.total`) | **NIE** |
| **Expiry enforcement** | `offer_approvals.expires_at` + `valid_until` (server-side w edge fn) | `acceptance_links.expires_at` (server-side w DB fn) |
| **Aktywny w repo** | **TAK** | **TAK** |
| **Aktywny na produkcji** | **UNKNOWN** | **UNKNOWN** |

---

## LUKI W NOWYM FLOW

### L-1: Brak auto-tworzenia v2_project po akceptacji

**Gdzie:** `process_offer_acceptance_action` (`20260301170000_pr12_acceptance_links.sql:205`) — aktualizuje tylko `offers.status`, nie tworzy `v2_projects`.

**Konsekwencja:** Jeśli klient zaakceptuje ofertę przez nowy flow i wykonawca zamknie panel przed kliknięciem "Utwórz projekt" — projekt nie zostanie stworzony. Nowy flow wymaga ręcznej akcji wykonawcy po akceptacji.

**Porównanie:** Legacy flow tworzy v2_project automatycznie w edge function przy każdej akceptacji (idempotentnie).

### L-2: Brak powiadomień wykonawcy

**Gdzie:** `process_offer_acceptance_action` nie zawiera żadnego INSERT do tabeli `notifications`.

**Konsekwencja:** Wykonawca nie otrzymuje powiadomienia gdy klient zaakceptuje lub odrzuci ofertę przez nowy flow (`/a/:token`). W legacy flow powiadomienia są wysyłane dla każdego zdarzenia (viewed, accepted, rejected, expired, cancel).

### L-3: Brak cancel window

**Gdzie:** `process_offer_acceptance_action` — brak akcji `cancel_accept`.

**Konsekwencja:** Klient nie może cofnąć akceptacji w ciągu 10 minut. W legacy flow `cancel_accept` cofa status do `sent` i notyfikuje wykonawcę.

### L-4: Brak withdraw przez wykonawcę

**Gdzie:** `process_offer_acceptance_action` — brak akcji `withdraw` z weryfikacją JWT wykonawcy.

**Konsekwencja:** Wykonawca nie może wycofać oferty (oznaczyć jako `withdrawn`) przez nowy flow.

### L-5: Rozbieżność statusu — `offers.status` vs `offer_approvals.status`

**Gdzie:** Nowy flow aktualizuje `offers.status` (UPPERCASE), legacy flow aktualizuje `offer_approvals.status` (lowercase).

**Konsekwencja:** Dashboard, filtry, hooki (`useOffers`, `useOfferStats`) muszą obsługiwać OBA statusy z różnych tabel. Brak synchronizacji między tabelami — jeśli oferta jest zaakceptowana przez nowy flow, `offer_approvals.status` pozostaje `sent`/`pending`. Jeśli zaakceptowana przez legacy flow, `offers.status` może nie odzwierciedlać zmiany.

### L-6: Brak 1-click accept z emaila

**Gdzie:** `process_offer_acceptance_action` nie obsługuje `accept_token` (`?t=` query param).

**Konsekwencja:** Nie można wysłać linku do 1-click akceptacji przez email w nowym flow. Legacy flow ma pełną obsługę `email_1click` z walidacją `accept_token`.

### L-7: `upsert_acceptance_link` RPC istnieje w repo, status na produkcji UNKNOWN

**Gdzie:** `20260403160000_upsert_acceptance_link_rpc.sql` — migracja w repo.

**Konsekwencja:** `useCreateAcceptanceLink` (`useAcceptanceLink.ts:66`) wywołuje `supabase.rpc('upsert_acceptance_link', ...)`. Czy RPC jest wdrożone na produkcji — **UNKNOWN**.

---

## FLOW KANONICZNY — REKOMENDACJA

### Rekomendacja: New flow (`acceptance_links`) jako docelowy

**Uzasadnienie:**

1. **Architektura:** Nowy flow jest bezpośrednio powiązany z tabelą `offers` (nie przechodzi przez `projects` → `quotes`). Eliminuje zależność od legacy tabel.
2. **Bezpieczeństwo:** SECURITY DEFINER DB funkcje zamiast Edge Function — mniejszy attack surface, brak potrzeby serwisu Deno.
3. **Token z TTL:** `acceptance_links.expires_at` enforced server-side z jawnym TTL (30 dni), UNIQUE per offer — czystszy model.
4. **Audit log:** `offer_public_actions` — explicitny, dedykowany log akcji klientów.
5. **Warianty oferty:** Tylko nowy flow obsługuje warianty (z `offer-versioning-7RcU5`).
6. **Idempotencja:** UNIQUE constraint `acceptance_links_offer_unique` na poziomie DB.

### Co trzeba dodać do nowego flow zanim legacy można wygasić:

| Brakujący feature | Priorytet | Opis |
|---|---|---|
| Auto-tworzenie v2_project | P0 | Dodać INSERT do `v2_projects` w `process_offer_acceptance_action` (lub trigger DB) |
| Powiadomienia wykonawcy | P0 | Dodać INSERT do `notifications` przy ACCEPT/REJECT |
| 1-click accept z emaila | P1 | Dodać obsługę `accept_token` w `process_offer_acceptance_action` |
| Cancel window (10 min) | P2 | Nowa akcja w `process_offer_acceptance_action` |
| Withdraw przez wykonawcę | P2 | Nowa akcja z weryfikacją JWT |

### Co wygasić i w jakiej kolejności:

1. **Nie wygaszać nic** dopóki nowy flow nie ma auto-tworzenia v2_project i powiadomień (P0).
2. Po dodaniu P0: deprecated `/offer/:token` → redirect do `/a/:token` (zachować stary route dla starych linków).
3. Po redirectach przez ~30 dni: usunąć `OfferApproval.tsx` i Edge Function `approve-offer`.
4. Migracja historycznych `offer_approvals` → `acceptance_links` — osobny plan.

---

## FIRST FIX PLAN

### PR-1: `feat: Add v2_project auto-creation and notifications to new acceptance flow`

**Scope:**
- Modyfikacja: `supabase/migrations/NEW_process_offer_acceptance_action_v2.sql`  
  (NOWA migracja — nie modyfikujemy istniejącej `20260301170000`)
- Dodać w `process_offer_acceptance_action`: INSERT do `v2_projects` po ACCEPT
- Dodać w `process_offer_acceptance_action`: INSERT do `notifications` po ACCEPT/REJECT

**DoD:**
- [ ] `process_offer_acceptance_action` przy `ACCEPT` tworzy wpis w `v2_projects` (idempotentnie)
- [ ] `process_offer_acceptance_action` przy ACCEPT/REJECT wstawia powiadomienie do `notifications`
- [ ] Migracja stosuje `CREATE OR REPLACE FUNCTION` — nie narusza istniejącej migracji
- [ ] Test SQL: wywołanie funkcji z tokenem ACCEPT → `v2_projects` zawiera nowy wiersz
- [ ] Test SQL: wywołanie funkcji dwukrotnie → tylko jeden `v2_projects` wiersz (idempotencja)

**Rollback:** `CREATE OR REPLACE FUNCTION` — przywrócenie poprzedniej wersji funkcji nową migracją.

---

### PR-2: `feat: Add acceptance_links status sync to offers hook`

**Scope:**
- Modyfikacja: `src/hooks/useOffers.ts` — synchronizacja stanu `ACCEPTED` z `offers.status`
- Ewentualnie: widok DB `offer_status_unified` łączący oba źródła statusu

**DoD:**
- [ ] `useOffers` poprawnie pokazuje status `ACCEPTED` dla ofert zaakceptowanych przez nowy flow
- [ ] Dashboard i filtry działają dla obu źródeł statusu
- [ ] Brak duplikacji — jeśli `offer_approvals.status = accepted` i `offers.status = ACCEPTED` — jedno wyświetlenie

**Rollback:** Revert hooka, brak zmian DB.

---

### PR-3: `chore: Deprecate /offer/:token route — redirect to /a/:token for existing approvals`

**Scope:**
- `src/App.tsx` — dodać redirect z `/offer/:token` → wyszukaj token w `acceptance_links`, jeśli brak — zostań na starym route
- Tylko po wdrożeniu PR-1 i PR-2

**DoD:**
- [ ] Stare linki `/offer/TOKEN` nadal działają (backward compat przez 90 dni)
- [ ] Nowe linki generowane tylko jako `/a/TOKEN`
- [ ] Test: GET `/offer/OLD_TOKEN` → przekierowanie lub fallback do starego widoku

**Rollback:** Revert `App.tsx` routing.

---

## WYNIKI TESTÓW

**STATUS: STATIC-ONLY MODE**

node_modules nie istnieje → nie można uruchomić vitest ani type-check.

Plik testowy `src/test/features/acceptance-flow-parity.test.ts` został utworzony jako **kontrakt statyczny** — testy mogą być uruchomione po `npm install`.

Przewidywany wynik po `npm install && npx vitest run src/test/features/acceptance-flow-parity.test.ts`:

- TESTY REALNE: powinny przejść (czysta logika, brak runtime dependencies)
- TESTY SKIP: oznaczone `.skip` — wymagają Supabase client / staging tokenów
- TESTY TODO: oznaczone `.todo` — wymagają pełnego środowiska runtime

---

## UNKNOWN / SKIP

| Element | Status | Powód |
|---|---|---|
| Live state `offer_approvals` na produkcji | UNKNOWN | Brak dostępu do dashboard |
| Live state `acceptance_links` na produkcji | UNKNOWN | Brak dostępu do dashboard |
| `upsert_acceptance_link` RPC na produkcji | UNKNOWN | Migracja w repo, weryfikacja live niemożliwa |
| Która % ofert używa nowego vs legacy flow | UNKNOWN | Wymaga zapytania SQL na live DB |
| Czy `offer_approvals.offer_id` backfill przeszedł | UNKNOWN | Weryfikacja live niemożliwa |
| type-check (0 błędów) | UNKNOWN | Brak node_modules |
| vitest (wyniki) | UNKNOWN | Brak node_modules |

---

## OSTRZEŻENIE WDROŻENIOWE

**Production truth pozostaje UNKNOWN — ten raport NIE jest zgodą na wdrożenie.**

Raport jest oparty wyłącznie na analizie statycznej kodu z repozytorium (branch `claude/acceptance-flow-audit-ykNaS`, SHA `75bd71847df55d7f6c62e0f545bdb82f87969bf4`). Żadne twierdzenia o kompletności lub gotowości produkcyjnej nie zostały tu zawarte. Przed jakimkolwiek wdrożeniem wymagana jest:

1. Weryfikacja migracji na staging/produkcji
2. Uruchomienie testów z kompletem zależności (`npm install`)
3. Przegląd właściciela projektu
4. Ręczny test obu flow (`/offer/:token` i `/a/:token`) na staging

---

*Wygenerowano: 2026-04-04 | Tryb: READ-ONLY, repo-only | Live: UNKNOWN*
