# MACIERZ STATUSÓW — AUDYT RECONCILIATION

**Data:** 2026-03-17 | **Audytor:** Claude Opus 4.6 | **Tryb:** READ-ONLY

---

## LEGENDA

| Status | Znaczenie |
|--------|-----------|
| PASS | W pełni zaimplementowane, podłączone, działające |
| PARTIAL | Istnieje w kodzie, ale niekompletne lub nie w pełni widoczne |
| FAIL | Zepsute lub nie działa zgodnie z oczekiwaniami |
| UNKNOWN | Nie da się zweryfikować z poziomu repo (wymaga runtime/Supabase) |
| N/A | Nie dotyczy obecnego etapu |

---

## 1. GATE 0 — VISUAL AUTHORITY FOUNDATION

| Element | Status | Dowód | Bloker |
|---------|--------|-------|--------|
| E0-A: Design Token Foundation | **PARTIAL** | 36+ tokenów w `index.css` :root + .dark, `tailwind.config.ts` ds-* namespace | Landing (13 komponentów) ignoruje tokeny — hard-coded `bg-gray-*`, `text-amber-*` |
| E0-B: Event Tracking Architecture | **PASS** | `src/lib/analytics/` — 14 eventów, trackEvent() fire-and-forget, 5 fire points | Sink nie podłączony (dane nie trafiają do żadnego backendu) |
| E0-C: Offline Queue Foundation | **PASS** | `src/lib/offline-queue/` — 7 plików, flushQueue() podłączony w useOfflineSync, wyzwalany na mount + online | Brak widocznego UI statusu synchronizacji |
| E0-D: OfferDraft Interface | **PASS** | `src/types/offer-draft.ts` — 24 pola, readonly id, isReadyForTransition(), 50+ testów | — |
| Fonty self-hosted | **PASS** | `public/fonts/` — Bricolage Grotesque + JetBrains Mono woff2, preload w index.html | — |
| Dark mode tokens | **PASS** | index.css .dark sekcja — pełne remapowanie tokenów | — |

**Gate 0 WERDYKT: PARTIAL** — blokuje landing page token migration (13 komponentów)

---

## 2. GATE 1 — CORE VALUE FLOW

| Warunek | Status | Dowód | Zmiana vs. audyt E0+E1 |
|---------|--------|-------|----------------------|
| G1-C1: Quick Mode jedną ręką na mobile | **PASS** | `QuickMode.tsx` 497 linii, 4 sekcje, touch targets 48px, sticky CTA 52px | Bez zmian |
| G1-C2: Quick→Full draft_id stały, zero utraty | **PASS** | DraftContext.tsx zamontowany w App.tsx, IDB persistence, QuickEstimateWorkspace czyta quickDraft | **NAPRAWIONE** (PR #450) — był FAIL w audycie E0+E1 |
| G1-C3: PDF prestige jsPDF | **PASS** | offerPdfGenerator.ts — JBM, QR, amber, alternating rows, 3 szablony | Bez zmian |
| G1-C4: Oferta wysłana, klient dostaje link | **PASS** | useSendOffer — idempotentny, non-fatal PDF/email, OFFER_SENT tracking | Bez zmian |
| G1-C5: Cały flow jedną ręką na 390px | **UNKNOWN** | Kod sugeruje mobile-first, brak testu na prawdziwym urządzeniu | Brak evidence |

**Gate 1 WERDYKT: PASS (z zastrzeżeniem G1-C5 = UNKNOWN)**

---

## 3. ETAP 2 READINESS

| Element | Status | Gotowość | Bloker |
|---------|--------|----------|--------|
| Premium Design System Uplift (Prompt 2) | **N/A** | Nie rozpoczęty, baseline gotowy | Wymaga decyzji ownera |
| Psychologia produktu (Prompt 3) | **N/A** | Nie rozpoczęty | Zależy od Prompt 2 |
| Landing + PDF + Public (Prompt 4) | **N/A** | Nie rozpoczęty | Zależy od Prompt 2 |
| Mobile polish (Prompt 5) | **N/A** | Nie rozpoczęty | Zależy od Prompt 2 |
| Stripe Price IDs | **UNKNOWN** | null w plans.ts | OWNER ACTION |
| Migracje DB na produkcji | **UNKNOWN** | 53 migracji w repo, niezweryfikowane na prod | OWNER ACTION |
| RESEND_API_KEY | **UNKNOWN** | Wymagany przez send-offer-email EF | OWNER ACTION |
| FRONTEND_URL | **UNKNOWN** | Wymagany dla linków w emailach | OWNER ACTION |

---

## 4. REPO IMPLEMENTATION — SZCZEGÓŁOWA MACIERZ

| Funkcjonalność | Zaimplementowane? | Podłączone? | Widoczne dla usera? | Status |
|---------------|-------------------|-------------|--------------------|----|
| Tokeny kolorów | TAK | TAK (core app) | TAK (ale nie landing) | PARTIAL |
| Analytics tracking | TAK | TAK (5 fire points) | NIE (sink = console) | PARTIAL |
| Offline queue write | TAK | TAK | NIE (brak UI statusu) | PASS |
| Offline queue sync | TAK | TAK (useOfflineSync) | NIE (brak UI) | PASS |
| DraftContext Quick→Full | TAK | TAK (App root) | TAK (context panel) | PASS |
| Quick Mode page | TAK | TAK (route /app/quick-mode) | TAK | PASS |
| PDF prestige | TAK | TAK | TAK (3 szablony) | PASS |
| Send flow | TAK | TAK | TAK | PASS |
| Public offer | TAK | TAK | TAK | PASS |
| Landing page | TAK | TAK | TAK (ale hard-coded kolory) | PARTIAL |
| Offer variants | TAK | TAK | TAK | PASS |
| Offer photos | TAK | TAK | PARTIAL (brak na public page) | PARTIAL |
| v2_projects | TAK | TAK | TAK | PASS |
| Acceptance links | TAK | TAK | TAK | PASS |
| Billing/Stripe | TAK (kod) | NIE (null Price IDs) | NIE | FAIL |

---

## 5. SUPABASE / DATA REALITY

| Moduł | Schema match? | RLS OK? | Ryzyko | Status |
|-------|---------------|---------|--------|--------|
| offers | TAK — tabela istnieje, id uuid, status CHECK | TAK — 4 polityki (CRUD own) | Upsert z offline sync wymaga poprawnego user_id | SCHEMA MATCH OK |
| offer_items | TAK — FK do offers(id) | TAK | — | SCHEMA MATCH OK |
| clients | TAK | TAK | — | SCHEMA MATCH OK |
| profiles | TAK | TAK | — | SCHEMA MATCH OK |
| offer_sends | TAK | TAK | — | SCHEMA MATCH OK |
| acceptance_links | TAK | TAK | — | SCHEMA MATCH OK |
| v2_projects | TAK | TAK | — | SCHEMA MATCH OK |
| pdf_data | TAK — FK relaxed (PR-11) | TAK | — | SCHEMA MATCH OK |
| offer_variants | TAK | TAK | — | SCHEMA MATCH OK |
| offer_photos | TAK — public access policy | TAK | — | SCHEMA MATCH OK |
| quick_estimate_draft (IDB) | N/A — IndexedDB, nie Supabase | N/A | Dane lokalne, nie w DB | N/A |
| Stripe Price IDs | UNKNOWN | N/A | plans.ts = null | ENV CONFIG RISK |
| Migracje na produkcji | UNKNOWN | UNKNOWN | 53 migracji w repo | UNKNOWN |

---

## 6. WIDOCZNOŚĆ ZMIAN — EKRAN PO EKRANIE

| Ekran | Status zmiany | Co widzi owner | Co jest w kodzie |
|-------|--------------|---------------|-----------------|
| Dashboard | TECHNICAL CHANGE ONLY | Kolory zmienione na tokeny (PR #443, #452) ale layout ten sam | ds-* tokeny, animowane liczniki, staggered animations |
| Quick Mode | VISIBLE CHANGE | Nowy ekran (nie istniał wcześniej) | 4-sekcyjny formularz, sticky CTA, touch targets |
| Szybka Wycena (Full) | VISIBLE CHANGE | Context panel z danymi z Quick Mode (amber) | DraftContext integration, auto-save 2s |
| Offers list | TECHNICAL CHANGE ONLY | Wygląd podobny, wewnętrznie nowy system offers v2 | v2 tabela, RLS, statuses |
| Projects list | TECHNICAL CHANGE ONLY | Wygląd podobny, v2_projects wewnętrznie | v2_projects linked from offers |
| Landing | TECHNICAL CHANGE ONLY | Hard-coded kolory, wygląda tak samo | 13 komponentów z gray-*/amber-* |
| Billing | BROKEN | Checkout nie działa — Stripe Price IDs = null | Pełny kod, ale null config |
| PDF | VISIBLE CHANGE | JetBrains Mono, QR, amber, alternating rows | 3 szablony premium |
| Public offer | VISIBLE CHANGE | Akceptacja, pytania, expired handling | Formularz akceptacji, podpis |

---

## 7. EVIDENCE GAPS

| Claimed area | Screenshot? | Runtime? | Test? | Device? | User validation? |
|-------------|------------|---------|------|---------|-----------------|
| Gate 0 tokens | TAK (4 screenshots) | UNKNOWN | TAK | NIE | NIE |
| Quick Mode | NIE | UNKNOWN | TAK (unit) | NIE | NIE |
| Quick→Full continuity | NIE | UNKNOWN | TAK (unit) | NIE | NIE |
| PDF prestige | NIE | UNKNOWN | TAK (unit) | NIE | NIE |
| Send flow | NIE | UNKNOWN | TAK (unit) | NIE | NIE |
| Public offer | NIE | UNKNOWN | NIE | NIE | NIE |
| Offline sync | NIE | UNKNOWN | TAK (unit) | NIE | NIE |
| Mobile 390px | NIE | UNKNOWN | NIE | NIE | NIE |
| Dashboard tokens | NIE | UNKNOWN | NIE | NIE | NIE |
| Landing tokens | TAK (4 screenshots) | UNKNOWN | TAK | NIE | NIE |

---

## 8. BUILD & TEST REALITY (2026-03-17)

| Metryka | Wynik |
|---------|-------|
| `npx tsc --noEmit` | 0 błędów |
| `npm run build` | Sukces, 18.54s |
| `npx vitest run` | 93 plików, 1366 passed, 5 skipped, 0 failed |
| Main bundle (gzip) | 283.53 KB |
| Total chunks | 20+ lazy-loaded |
| ESLint errors | 0 (warnings: ~660, głównie i18next) |
