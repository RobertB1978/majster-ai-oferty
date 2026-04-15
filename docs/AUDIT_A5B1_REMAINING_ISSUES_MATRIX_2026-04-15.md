# AUDIT A5b-1: Remaining Issues and Deferred Work Matrix (v2 — post-15/15 PASS)

**Data:** 2026-04-15 (v2 — zastępuje wcześniejszy A5B1 z dnia 2026-04-15 commit #700)
**Typ:** Synthesis-only (read-only, zero implementation changes)
**Wersja:** 2 — pierwsza wersja oparta była na A5a-2026-04-14 (przed DOCS-CONFLICT-01, BOOKKEEP-01, SEC-02, ARCH-03, ARCH-03b)
**Źródła:** A2, A3, A4, BOOKKEEP-01 (ujęty w A5a), A5a-2026-04-15

---

## CLAUDE.md Execution Note

CLAUDE.md przeczytany w całości (załadowany jako kontekst systemowy) jako PIERWSZY krok sesji.

| # | Reguła z CLAUDE.md | Jak zastosowano |
|---|---|---|
| 4 | Nie zgaduj | Każdy status oparty na cytacie z A2/A3/A4/A5a lub COMPATIBILITY_MATRIX/ADR |
| 5 | Nie rozszerzaj zakresu | Zero implementacji — tylko synteza; zakaz planowania next batch |
| 10 | Przegląd diffa | Jedyna zmiana to ten raport w `docs/` |
| 12 | Evidence Log obowiązkowy | Dołączony w sekcji końcowej |
| 13 | Pass #3 = prompt linia po linii | Weryfikacja każdego punktu DOD w sekcji finalnej |
| 18 | Dowód liczbowy, nie narracja | Każdy finding ma źródło (audyt + linia/commit) |

Brak konfliktów między promptem a CLAUDE.md. Prompt jawnie zakazuje implementacji i next-batch planning — zgodne z zasadą #5.

**Uwaga BOOKKEEP-01:** Brak osobnego pliku docs/BOOKKEEP-01. Wyniki BOOKKEEP-01 są w całości ujęte w A5a-2026-04-15 jako target #15 (PASS, commits `3fa4ff4`/#703 + `ea68359`/#707). Źródło: A5a-2026-04-15:65.

---

## Files / Sources Read

| # | Plik | Rola | Linie |
|---|------|------|-------|
| 1 | `CLAUDE.md` | Instrukcje projektu (kontekst systemowy) | 987 |
| 2 | `docs/AUDIT_A2_CORE_DOCS_CONSISTENCY_2026-04-14.md` | 7 sprzeczności C-01..C-07, 4 unknowns | 136 |
| 3 | `docs/AUDIT_A3_PACK1_CLOSURE_2026-04-14.md` | Pack 1: 5/5 PASS, 8 open issues, 4 unknowns | 113 |
| 4 | `docs/AUDIT_A4_PACK2_CLOSURE_2026-04-14.md` | Pack 2: 4/5 PASS + PR-INFRA-01 OPEN, 7 issues | 163 |
| 5 | `docs/AUDIT_A5A_FINAL_STATUS_MATRIX_2026-04-15.md` | **Główne źródło prawdy** — 15/15 PASS, B-4/B-5/B-7/B-8 OPEN, 4 unknowns | 154 |
| 6 | `docs/AUDIT_A5B1_REMAINING_ISSUES_MATRIX_2026-04-15.md` (v1) | Wcześniejsza wersja tego pliku (#700) — oparta na A5a-2026-04-14 | 145 |
| 7 | `docs/AUDIT_A5B_REMAINING_ISSUES_NEXT_BATCH_2026-04-15.md` | Synteza + next batch plan (#701) — oparta na A5a-2026-04-14 | 158 |
| 8 | `docs/COMPATIBILITY_MATRIX.md` (linie 100-158) | Status L-gaps: L-1/L-2 CLOSED, L-5/L-6/L-3/L-4 OPEN | 158 |
| 9 | `docs/ADR/ADR-0014-public-offer-canonical-flow.md` (linia 162) | SHA: "do uzupełnienia po merge" — potwierdzony OPEN | 163 |

BOOKKEEP-01 nie ma osobnego pliku audytu — wyniki ujęte w A5a-2026-04-15:target#15.


---

## Tabela A: Remaining Issues

> **Kontekst:** Po A5a-2026-04-15 wszystkie 15 targetów mają status PASS.
> Poniższe pozycje to wyłącznie to, co pozostało OTWARTE pomimo zamknięcia wszystkich targetów.

| Severity | Area | Finding | Evidence Source | Why Still Open |
|----------|------|---------|-----------------|----------------|
| MEDIUM | Docs | **B-7**: Wersja Vite niespójna — ROADMAP_ENTERPRISE (l.16) i ULTRA (l.1142) mówią 7.3; CLAUDE.md (l.97) mówi 5.4. `package.json` nie zweryfikowany | A2:C-05 (l.74); A5a-2026-04-15:B-7 (l.101) | Audyty A2/A5a były docs-only — nie sprawdzały `package.json`. Brak implementacji. |
| MEDIUM | Docs | **B-8**: Otwarte problemy z TRUTH.md (P1-LINT UNKNOWN, P2-RLS UNKNOWN, P2-TESTS UNKNOWN z 2026-02-18) nigdy jawnie nie zamknięte | A2:C-07 (l.76); A5a-2026-04-15:B-8 (l.102) | TRUTH.md snapshot z 2026-02-18. Po 15 mergeach nadal brak dowodu jawnego zamknięcia. |
| MEDIUM | Infra | **U-3**: 4 z 6 brakujących Edge Functions z TRACEABILITY_MATRIX:28 nadal potencjalnie niezarejestrowane w `config.toml`. PR-SUPA-02 (#685) naprawił 2 z 6 (`customer-portal`, `request-plan`) | A3:l.80; A5a-2026-04-15:U-3 (l.115) | PR-SUPA-02 obejmował tylko 2 funkcje. Pełna weryfikacja poza scope audytów A2-A5a. |
| MEDIUM | Arch | **L-5/L-6/L-3/L-4**: Luki wymagane do deprecacji legacy routes — `useOffers` unified status (L-5), `accept_token` 1-click (L-6), `CANCEL_ACCEPT` (L-3), `WITHDRAW` (L-4) — wszystkie OPEN | COMPATIBILITY_MATRIX.md:145-148; A5a-2026-04-15:U-4 (l.116) | L-1 i L-2 zamknięte przez ARCH-03 (#705). Luki L-3/L-4/L-5/L-6 zaplanowane na PR-ARCH-04. |
| MEDIUM | Infra | **U-1 (BLOCKED)**: `VITE_PUBLIC_SITE_URL=https://majsterai.com` w Vercel Dashboard (production scope) — nie zweryfikowane | A4:l.106; A5a-2026-04-15:U-1 (l.113) | Poza repo — Vercel Dashboard niedostępny dla agenta. Wymaga ręcznej weryfikacji Roberta. |
| MEDIUM | Infra | **U-2 (BLOCKED)**: Migracja ARCH-03 (`20260415120000_arch03_*.sql`) zastosowana w produkcji — nie potwierdzone | A5a-2026-04-15:U-2 (l.114) | Brak dostępu do Supabase Dashboard w audycie read-only. |
| LOW | Docs | **B-4**: ADR-0014 linia 162: `"SHA: do uzupełnienia po merge"` — SHA merge #687 (`1ce398a`) nigdy nie uzupełniony | A3:l.77; A5a-2026-04-15:B-4 (l.99); ADR-0014:162 | Przeoczenie dokumentacyjne. ~3 LOC. |
| LOW | Docs | **B-5**: `TRACEABILITY_MATRIX.md` przestarzały (last updated: 2026-02-07) — nie pokrywa żadnego z 15 targetów tej serii | A3:l.78; A5a-2026-04-15:B-5 (l.100) | Tracker nie był aktywnie utrzymywany dla serii post-roadmap. Decyzja: utrzymywać czy archiwizować? |


---

## Tabela B: Deferred / Not Done / Could Not Complete

| Item | Type | Evidence Source | Why | Recommended Handling |
|------|------|-----------------|-----|----------------------|
| PR-BE-LOW-02: relational join strings `team_members(*)` | Deferred intentionally | A4:l.108; A5a-2026-04-14 v1:B | >30 LOC, decyzja architektoniczna — celowo poza scope PR-BE-LOW-01 | Osobny PR gdy priorytet biznesowy |
| PR-DOCS-02: pilot DOCX Mode B | Deferred intentionally | A4:l.110; DECISIONS.md:10; ADR-0013 | PR-DOCS-01 (#694) to foundation — pilot jest następnym krokiem | Zaplanować PR-DOCS-02 gdy priorytet biznesowy |
| GO/NO-GO Mode B DOCX | Blocked by external/manual decision | A4:l.111; ADR-0013 | Wymaga PR-DOCS-02 + spełnienia kryteriów S1-S10. Silence = NO-GO per ADR-0013 | Czekać na PR-DOCS-02 + decyzja Roberta |
| Repo cleanup (687 branchy, 68 open PRs) | Blocked by external/manual decision | A4:l.71 (PR-OPS-02); docs/ops/REPO_HYGIENE_RUNBOOK.md | Agent NIE wykonywał akcji destrukcyjnych — celowo. Inventory snapshot z 2026-04-14. | Robert: wykonać cleanup wg `docs/ops/REPO_HYGIENE_RUNBOOK.md` |
| Supabase CLI gen types | Could not complete in current scope | A3:l.83 | CLI `supabase gen types` niedostępne w środowisku CCW | Jednorazowe uruchomienie lokalnie: `npx supabase gen types --project-id <id>` |
| ARCH-03 SQL migration verification in prod | Could not verify | A5a-2026-04-15:U-2 (l.114) | Audyt repo-only — brak dostępu do Supabase Dashboard | Robert: SQL Editor → `SELECT proname FROM pg_proc WHERE proname = 'process_offer_acceptance_action'` |
| VITE_PUBLIC_SITE_URL in Vercel Dashboard | Could not verify | A4:l.106; A5a-2026-04-15:U-1 | Env var poza repo — Vercel Dashboard niedostępny dla agenta | Robert: Vercel Dashboard → Settings → Environment Variables → Production scope |
| 4 Edge Functions registration in config.toml | Could not verify | A3:l.80; A5a-2026-04-15:U-3 | PR-SUPA-02 (#685) naprawił 2 z 6. Pełna weryfikacja config.toml vs functions/ poza scope audytów | Porównanie: `ls supabase/functions/` vs sekcji `[functions.*]` w `config.toml` |
| ADR-0014 SHA completion (l.162) | Failed in execution | A3:l.77; ADR-0014:162 | Przeoczenie dokumentacyjne — SHA `1ce398a` PR-ARCH-01 nigdy nie uzupełniony | ~3 LOC w ADR-0014:162: zastąpić "do uzupełnienia" przez SHA `1ce398a` |
| TRACEABILITY_MATRIX.md modernization | Could not complete in scope | A3:l.78; A5a-2026-04-15:B-5 | Tracker nie był utrzymywany post-roadmap (2026-02-07). Archiwizacja vs modernizacja to decyzja Roberta. | Decyzja: archiwizować (dodać baner ARCHIWUM) lub utrzymywać per-PR |
| L-5/L-6/L-3/L-4 COMPATIBILITY_MATRIX gaps | Deferred intentionally | COMPATIBILITY_MATRIX:145-148; A5a-2026-04-15:U-4 | L-1/L-2 zamknięte przez ARCH-03. Luki P1/P2 zaplanowane na PR-ARCH-04. | PR-ARCH-04: legacy routes deprecation (>50 LOC, architektura) |
| B-7 Vite version verification | Could not verify | A2:C-05; A5a-2026-04-15:B-7 | Audyty były docs-only — `package.json` nie był w scope fence | Odczyt `package.json` i korekta ROADMAP_ENTERPRISE.md/ULTRA/CLAUDE.md |
| B-8 TRUTH.md legacy issues explicit closure | Could not complete in scope | A2:C-07; A5a-2026-04-15:B-8 | Brak jawnego zamknięcia P1-LINT/P2-RLS/P2-TESTS mimo 15 mergeach. Wymaga uruchomienia lint/tsc/tests + aktualizacji TRUTH.md | Uruchomić `npm run lint`, `npx tsc --noEmit`, `npm test` i udokumentować wyniki w TRUTH.md |


---

## Tabela C: Manual / External Decisions Still Needed

| Decision | Why Needed | Evidence Source | Blocking What |
|----------|-----------|-----------------|---------------|
| Zweryfikować `VITE_PUBLIC_SITE_URL=https://majsterai.com` w Vercel Dashboard (Production scope) | Env var wymagana aby SEO fix PR-INFRA-01 (#689) działał na produkcji. Kod zmergowany, ale env niezweryfikowane. | A4:l.106; A5a-2026-04-15:U-1 | Skuteczność PR-INFRA-01 na produkcji |
| Potwierdzić że migracja ARCH-03 SQL zastosowana w produkcji | ARCH-03 (#705) zawiera `20260415120000_arch03_*.sql`. Deploy Supabase wymaga ręcznego push lub auto-deploy z main. | A5a-2026-04-15:U-2 | Poprawne działanie L-1/L-2 (v2_projects + notifications) na produkcji |
| TRACEABILITY_MATRIX.md: archiwizować czy modernizować? | Przestarzały od 2026-02-07. Nie pokrywa żadnego z 15 nowych targetów. Decyzja architektoniczna: zakres trackera. | A3:l.78; A5a-2026-04-15:B-5 | Zarządzanie trackerem wymagań |
| TRUTH.md: jawnie zamknąć P1-LINT, P2-RLS, P2-TESTS? | Otwarte od 2026-02-18 (C-07). Brak dowodu zamknięcia mimo 15 mergeach. Wymaga uruchomienia lint/tsc/tests. | A2:C-07; A5a-2026-04-15:B-8 | Otwarte pytania bezpieczeństwa (P2-RLS) i jakości |
| B-7: Zweryfikować wersję Vite w `package.json` i skorygować dokumenty | ROADMAP_ENTERPRISE/ULTRA mówią 7.3; CLAUDE.md mówi 5.4. Sprzeczność w dokumentacji tech stack. | A2:C-05; A5a-2026-04-15:B-7 | Poprawność dokumentacji tech stack |
| Repo cleanup: wykonać wg `docs/ops/REPO_HYGIENE_RUNBOOK.md` | 687 branchy, 68 open PRs (snapshot 2026-04-14). Inventory starzeje się. Agent NIE wykonywał akcji destrukcyjnych. | A4:l.71 (PR-OPS-02) | Higiena repozytorium |
| PR-ARCH-04: kiedy i w jakim zakresie zamknąć L-5/L-6/L-3/L-4? | L-1/L-2 zamknięte. Deprecacja legacy routes czeka na L-5/L-6/L-3/L-4. Decyzja priorytetowa. | COMPATIBILITY_MATRIX:145-148; A5a-2026-04-15:U-4 | Możliwość deprecacji `/offer/:token` i `/oferta/:token` |
| PR-DOCS-02: kiedy rozpocząć pilot DOCX Mode B? | PR-DOCS-01 (#694) foundation merged, flaga OFF. Pilot wymaga Edge Function + docxtemplater + S1-S10 z ADR-0013. | A4:l.110; DECISIONS.md:10; ADR-0013 | Rozwój Mode B DOCX |


---

## What Is Actually Closed and Should NOT Be Reopened

Wszystkie 15 targetów z A5a-2026-04-15 mają status PASS i są na main. NIE RUSZAĆ:

1. **PR-SUPA-01** — Typy Supabase zsynchronizowane ręcznie. Commit `483fec0`/#684. (A3:64)
2. **PR-SUPA-02** — 2 Edge Functions zarejestrowane w config.toml. Commit `c4457b6`/#685. (A3:65)
3. **PR-SEC-01** — SECURITY DEFINER RPC, anon RLS usunięte, 20 testów. Commit `079a81e`/#686. (A3:66)
4. **PR-ARCH-01** — FLOW-B kanoniczny, ADR-0014, stałe routów, 32+ testów. Commit `1ce398a`/#687. (A3:67)
5. **PR-ARCH-02** — Dead code usunięty, COMPATIBILITY_MATRIX, 34 testy. Commit `0f7bd19`/#688. (A3:68)
6. **PR-INFRA-01** — SEO canonical/og:url/sitemap. Commit `f7b0cd6`/#689. Zmergowany 2026-04-15. (A5a:56)
7. **PR-OPS-01** — Phantom hash, ADR kolizja, DOCS_INDEX, banery ARCHIWUM. Commit `b665a8b`/#690. (A4:70)
8. **PR-OPS-02** — Runbook + inventory (687 branchy). Commit `95b6b86`/#691. (A4:71)
9. **PR-BE-LOW-01** — Centralizacja bucket names, 10 testów. Commit `fd98459`/#692. (A4:72)
10. **PR-DOCS-01** — FF_MODE_B_DOCX_ENABLED gate wired, flaga OFF. Commit `06f84c2`/#694. (A4:73)
11. **SEC-02** — SECURITY_BASELINE.md Section 11 (wzorzec SECURITY DEFINER). Commit `3ee8db1`/#704. (A5a:61)
12. **ARCH-03** — L-1/L-2 zamknięte, 2 legacy readers zmigowane, 40 testów. Commit `04659ff`/#705. (A5a:62)
13. **ARCH-03b** — Ostatnie 2 legacy readers zmigowane, 24 testy, 4/4 MIGRATED. Commit `31ec568`/#706. (A5a:63)
14. **DOCS-CONFLICT-01** — C-01, C-02, C-06 naprawione. Commit `93b964c`/#699. (A5a:64)
15. **BOOKKEEP-01** — PR_NUMBERING_MAP, TRUTH.md ostrzeżenie (C-03), ROADMAP_STATUS post-roadmap (C-04/B-2). Commits `3fa4ff4`/#703 + `ea68359`/#707. (A5a:65)

---

## Findings Excluded Because Superseded by Newer Merged State

Poniższe pozycje były w poprzedniej wersji A5B1 (commit #700, oparta na A5a-2026-04-14) jako OPEN.
Zostały zamknięte przez merge'e po jej powstaniu.

| # | Pozycja z A5B1 v1 (#700) | Co ją zamknęło | Commit |
|---|--------------------------|----------------|--------|
| S-1 | HIGH: PR-INFRA-01 (#689) NIE zmergowany | Zmergowany 2026-04-15 jako `f7b0cd6` | `f7b0cd6`/#689 |
| S-2 | HIGH: C-02 ROADMAP_STATUS.md wskaźniki 12/20=60% sprzeczne z tabelą 20/20 | DOCS-CONFLICT-01 zaktualizował wskaźniki do 20/20=100% | `93b964c`/#699 |
| S-3 | HIGH: C-01 ROADMAP_ENTERPRISE.md:229 "Superseded" sprzeczne z banerem | DOCS-CONFLICT-01 naprawił linię 229 ("Superseded by: ROADMAP.md v5") | `93b964c`/#699 |
| S-4 | HIGH: C-06 ULTRA executable prompts — dwa frameworki | DOCS-CONFLICT-01 usunął sekcję 31 (prompty wykonawcze) z ULTRA | `93b964c`/#699 |
| S-5 | HIGH: L-1 auto-create v2_projects + L-2 powiadomienia blokują deprecację | ARCH-03 zamknął L-1 i L-2 przez migrację SQL | `04659ff`/#705 |
| S-6 | MEDIUM: 4 legacy readers nadal czytają z offer_approvals (P2/P3) | ARCH-03 (#705) zmigował useOfferStats + useFreeTierOfferQuota; ARCH-03b (#706) zmigował useExpirationMonitor + TodayTasks | `04659ff`/#705 + `31ec568`/#706 |
| S-7 | MEDIUM: SECURITY_BASELINE.md nie dokumentuje wzorca SECURITY DEFINER | SEC-02 dodał Section 11 do SECURITY_BASELINE.md | `3ee8db1`/#704 |
| S-8 | MEDIUM: C-04 PR numbering reuse (te same numery 00-05 = różne zadania) | BOOKKEEP-01 r1 stworzył `docs/PR_NUMBERING_MAP.md` | `3fa4ff4`/#703 |
| S-9 | MEDIUM: Brak śledzenia post-roadmap PRs w ROADMAP_STATUS.md | BOOKKEEP-01 r1 dodał sekcję post-roadmap (11 PRs) w ROADMAP_STATUS.md | `3fa4ff4`/#703 |
| S-10 | MEDIUM: C-03 TRUTH.md PR numbering confusion — brak ostrzeżenia | BOOKKEEP-01 r1 dodał blok ostrzeżenia w TRUTH.md | `3fa4ff4`/#703 |
| S-11 | LOW: Raporty A2/A3/A4 nie linkowane w DOCS_INDEX.md | BOOKKEEP-01 r1 dodał sekcję "Aktywne Raporty Audytowe" w DOCS_INDEX.md | `3fa4ff4`/#703 |


---

## Remaining Unknowns

| # | Unknown | Dotyczy | Dlaczego nie da się rozstrzygnąć | Kto rozstrzyga |
|---|---------|---------|----------------------------------|-----------------|
| U-1 | `VITE_PUBLIC_SITE_URL=https://majsterai.com` w Vercel Dashboard (Production scope) | PR-INFRA-01 (merged #689) | Poza repo — Vercel Dashboard niedostępny dla agenta | Robert: Vercel → Settings → Environment Variables |
| U-2 | Czy migracja ARCH-03 (`20260415120000_arch03_*.sql`) zastosowana w produkcji | ARCH-03 (#705) | Brak dostępu do Supabase Dashboard w audycie read-only | Robert: SQL Editor → `SELECT proname FROM pg_proc WHERE proname = 'process_offer_acceptance_action'` |
| U-3 | Czy 4 pozostałe Edge Functions są zarejestrowane w `config.toml` | PR-SUPA-02 follow-up | PR-SUPA-02 naprawił 2/6. Pełna weryfikacja `ls functions/` vs config.toml poza scope | Dedykowany audyt: porównanie katalogów vs config.toml |
| U-4 | Kiedy i w jakim zakresie PR-ARCH-04 (L-5/L-6/L-3/L-4) | COMPATIBILITY_MATRIX:145-148 | Decyzja priorytetowa Roberta | Robert + plan sprint |

---

## Evidence Log

| Zakres | Synteza remaining issues po A2/A3/A4/BOOKKEEP-01/A5a — aktualizacja v2 po zamknięciu 15/15 targetów |
|--------|------|
| Dowód | 9 plików przeczytanych (patrz sekcja Files/Sources Read); kluczowe: A5a-2026-04-15 (15/15 PASS), COMPATIBILITY_MATRIX (L-gaps), ADR-0014:162 (SHA open) |
| Jakie pliki / źródła przeczytałem | CLAUDE.md, A2 (136L), A3 (113L), A4 (163L), A5a-2026-04-15 (154L), A5B1 v1 (145L), A5B next batch (158L), COMPATIBILITY_MATRIX (linie 100-158), ADR-0014 (linia 162) |
| Co nadal otwarte | 8 pozycji: B-7 (Vite version), B-8 (TRUTH.md legacy issues), U-3 (4 Edge Functions), L-5/L-6/L-3/L-4 (legacy deprecation gaps), U-1 (Vercel env), U-2 (ARCH-03 prod migration), B-4 (ADR SHA), B-5 (TRACEABILITY_MATRIX) |
| Co odroczone | PR-BE-LOW-02, PR-DOCS-02, GO/NO-GO Mode B, repo cleanup, Supabase gen types, ARCH-03 prod verification, Vite version check, TRUTH.md closure |
| Co zablokowane decyzją ręczną | Vercel Dashboard (U-1), Supabase Dashboard prod (U-2), repo cleanup, GO/NO-GO Mode B, ARCH-04 timing, TRACEABILITY_MATRIX fate |
| Co już zamknięte i nie ruszać | 15/15 PASS per A5a-2026-04-15; 11 pozycji z A5B1 v1 superseded (S-1..S-11) |
| Rollback | Nie dotyczy — synthesis-only. Zero zmian w src/** i supabase/**. Rollback pliku: `git revert HEAD` |
| Branch / PR | `claude/a5b1-remaining-issues-matrix-ZY9RT` |

---

## Agent does / Robert does

### Agent zrobił:
- Przeczytał CLAUDE.md, A2, A3, A4, A5a-2026-04-15, A5B1 v1, A5B next batch, COMPATIBILITY_MATRIX, ADR-0014
- Zidentyfikował 11 pozycji superseded z A5B1 v1
- Zbudował Tabelę A (8 remaining issues), Tabelę B (13 deferred/not done), Tabelę C (8 manual decisions)
- Udokumentował 15 zamkniętych targetów (nie ruszać)
- Zapisał raport v2 (zastępuje #700)
- Commit + push na branch

### Robert musi:
1. **[MEDIUM, BLOCKED]** Zweryfikować `VITE_PUBLIC_SITE_URL` w Vercel Dashboard → Settings → Environment Variables → Production
2. **[MEDIUM, BLOCKED]** Potwierdzić zastosowanie migracji ARCH-03 w Supabase Dashboard → SQL Editor
3. **[LOW, ~3 LOC]** Uzupełnić SHA w ADR-0014:162 (wartość: `1ce398a`)
4. **[DECYZJA]** TRACEABILITY_MATRIX.md: archiwizować (baner ARCHIWUM) czy modernizować?
5. **[DECYZJA]** Vite version: zweryfikować `package.json` i ustalić, które docs mają błędną wersję
6. **[DECYZJA]** TRUTH.md: uruchomić lint/tsc/tests i jawnie zamknąć P1-LINT/P2-RLS/P2-TESTS
7. **[DECYZJA]** PR-ARCH-04: kiedy zamknąć L-5/L-6/L-3/L-4 (deprecacja legacy routes)?
8. **[DECYZJA]** PR-DOCS-02: kiedy rozpocząć pilot DOCX Mode B?
9. **[DECYZJA]** Repo cleanup: wykonać wg `docs/ops/REPO_HYGIENE_RUNBOOK.md`

---

## Podsumowanie ilościowe

| Metryka | Wartość |
|---------|---------|
| Targety z A5a-2026-04-15 | 15/15 PASS |
| Remaining Issues (Tabela A) | 8 (4 MEDIUM, 4 LOW; 2 z nich BLOCKED external) |
| Deferred / Not Done (Tabela B) | 13 pozycji |
| Manual Decisions Needed (Tabela C) | 8 decyzji |
| Closed — do NOT reopen | 15 targetów |
| Superseded from A5B1 v1 (#700) | 11 pozycji |
| Remaining Unknowns | 4 (U-1..U-4) |
| Implementation changes | 0 (synthesis-only) |
| Files modified in src/** | 0 |
| Files modified in supabase/** | 0 |

---

*Wygenerowano: 2026-04-15 | Audyt A5b-1 Remaining Issues Matrix v2 (CCW Hardened) | Branch: `claude/a5b1-remaining-issues-matrix-ZY9RT`*
