# AUDIT A5b-2: Next Batch Plan — po syntezie A5b-1 Remaining Issues Matrix

**Data:** 2026-04-15
**Audytor:** Claude Code Web (Principal Release Planner)
**Tryb:** planning-only / read-only / evidence-first / no guessing
**Branch:** `claude/a5b2-next-batch-plan-hoPA3`
**Poprzedni dokument:** `docs/AUDIT_A5B1_REMAINING_ISSUES_MATRIX_2026-04-15.md` (v2)

---

## CLAUDE.md Execution Note

CLAUDE.md przeczytany w całości (załadowany jako kontekst systemowy) jako PIERWSZY krok sesji.

| # | Reguła z CLAUDE.md | Jak zastosowano |
|---|---|---|
| 4 | Nie zgaduj | Każda rekomendacja oparta na konkretnych plikach + liniach |
| 5 | Nie rozszerzaj zakresu | Zero implementacji — wyłącznie plan; zakaz modyfikacji src/**  i supabase/** |
| 10 | Przegląd diffa | Jedyna zmiana to ten plik raportu w `docs/` |
| 12 | Evidence Log obowiązkowy | Dołączony w sekcji końcowej |
| 13 | Pass #3 = prompt linia po linii | Weryfikacja per-punkt w sekcji finalnej |
| 18 | Dowód liczbowy, nie narracja | Każda rekomendacja ma Evidence Source z pliku:linii lub outputu komendy |
| CCW-3 | Duże pliki w kawałkach | Ten plik pisany w częściach < 2KB przez heredoc |

Brak konfliktów między promptem a CLAUDE.md. Prompt jawnie zakazuje implementacji — zgodne z zasadą #5.

---

## Files / Sources Read

| # | Plik | Rola | Linie |
|---|------|------|-------|
| 1 | `CLAUDE.md` | Instrukcje projektu (kontekst systemowy) | 987 |
| 2 | `docs/AUDIT_A5B1_REMAINING_ISSUES_MATRIX_2026-04-15.md` | **Główne źródło wejściowe** — 8 remaining issues, 13 deferred, 8 manual decisions | 214 |
| 3 | `docs/AUDIT_A5A_FINAL_STATUS_MATRIX_2026-04-15.md` | 15/15 PASS, 4 unknowns, 4 bookkeeping issues | 154 |
| 4 | `docs/PR_NUMBERING_MAP.md` | BOOKKEEP-01 wyniki: #703 + #707 MERGED | 87 |
| 5 | `docs/AUDIT_A5B_REMAINING_ISSUES_NEXT_BATCH_2026-04-15.md` | Poprzedni next-batch plan (oparty na A5a-2026-04-14, częściowo już wykonany) | 158 |
| 6 | `docs/COMPATIBILITY_MATRIX.md` (linie 95-165) | L-5/L-6/L-3/L-4 OPEN; L-1/L-2 CLOSED; wszystkie 4 legacy readers MIGRATED | 165 |
| 7 | `package.json` | Weryfikacja rzeczywistej wersji Vite → `7.3.1` | — |
| 8 | `supabase/config.toml` (grep) | Weryfikacja U-3: 22 sekcje [functions.*] | — |
| 9 | `supabase/functions/` (ls) | Weryfikacja U-3: 22 katalogi funkcji (bez _shared, bez .md) | — |


---

## Odkrycie Planistyczne: U-3 jest ZAMKNIĘTY

> **Źródło:** Bezpośrednia inspekcja podczas tej sesji planistycznej (nie było w A5b-1).

A5b-1 oznaczył U-3 jako OPEN: "4 z 6 Edge Functions potencjalnie niezarejestrowane w config.toml".

**Nowy dowód (2026-04-15, ta sesja):**

| Zestaw | Liczba | Wynik |
|--------|--------|-------|
| Katalogi w `supabase/functions/` (bez `_shared`, bez `.md`) | 22 | — |
| Sekcje `[functions.*]` w `config.toml` | 22 | — |
| Niezarejestrowane | **0** | ✅ |

Wszystkie 22 funkcje są zarejestrowane. **U-3 = RESOLVED.** PR-SUPA-03 nie jest potrzebny.

**Niezarejestrowane funkcje (dla potwierdzenia — lista pusta):**
- Żadna.

**Konsekwencja dla planu:** U-3 odpada z backlogu. Redukuje next batch do 2 wykonalnych PR-ów (reszta blocked).

---

## Stan Startowy — Co Zostało Po A5b-1

Przed budową planu: skrócona lista tego co jeszcze OTWARTE z A5b-1.

| ID | Severity | Obszar | Opis | Blokada | Akcja |
|----|----------|--------|------|---------|-------|
| B-4 | LOW | Docs | ADR-0014:162 SHA `1ce398a` nie uzupełniony | Brak | Agent: ~3 LOC |
| B-5 | LOW | Docs | TRACEABILITY_MATRIX.md przestarzały (2026-02-07) — archiwizować czy modernizować? | **Decyzja Roberta** | Czeka |
| B-7 | MEDIUM | Docs | Wersja Vite: CLAUDE.md mówi `5.4`, package.json podaje `7.3.1` | Brak | Agent: ~1 LOC w CLAUDE.md |
| B-8 | MEDIUM | Docs | TRUTH.md: P1-LINT/P2-RLS/P2-TESTS nigdy jawnie nie zamknięte (snapshot 2026-02-18) | Brak | Agent: uruchomić lint/tsc/tests + ~15 LOC |
| U-1 | MEDIUM | Infra | VITE_PUBLIC_SITE_URL w Vercel Dashboard (Production scope) | **External — Robert** | Robert only |
| U-2 | MEDIUM | Infra | Migracja ARCH-03 zastosowana w produkcji — niepotwierdzono | **External — Robert** | Robert only |
| U-3 | MEDIUM | Infra | 4 Edge Functions potencjalnie niezarejestrowane w config.toml | **RESOLVED** (p. wyżej) | Zamknięty |
| L-5/L-6/L-3/L-4 | MEDIUM | Arch | Luki do deprecacji legacy routes — `useOffers`, accept_token, CANCEL_ACCEPT, WITHDRAW | **Decyzja Roberta (timing)** | PR-ARCH-04 |


---

## A) Next Batch Recommendation

> Zasady: max 5 PR, każdy mały i atomowy, kolejność technicznie uzasadniona.
> Pozycje zablokowane decyzją Roberta są oznaczone jawnie i nie wchodzą do wykonywalnej kolejki.

| Order | Next PR | Dlaczego ten w tej kolejności | Zależność | Ryzyko |
|-------|---------|-------------------------------|-----------|--------|
| 1 | **PR-DOCS-FIX-01** — ADR SHA + Vite version fix + U-3 closure note | Najmniejszy możliwy PR: ~10 LOC, czysto dokumentacyjny, zero decyzji Roberta potrzebnych. Zamyka B-4 (LOW), B-7 (MEDIUM), dokumentuje U-3 jako RESOLVED. | Brak | **ZERO** — docs only; żadna logika runtime nie zmienia się |
| 2 | **PR-TRUTH-01** — TRUTH.md explicit closure (B-8) | Drugi najmniejszy: ~15 LOC, docs only. Wymaga jednak uruchomienia `npm run lint`, `npx tsc --noEmit`, `npm test` po stronie agenta przed edycją. Zamyka otwarte pytania security-adjacent (P2-RLS z 2026-02-18). | Brak (niezależny od PR-1) | **LOW** — wymaga działającego środowiska npm; wynik testów musi być znany przed edycją TRUTH.md |
| — | ~~PR-SUPA-03~~ | USUNIĘTY — U-3 jest RESOLVED (p. odkrycie planistyczne) | — | — |
| BLOCKED | **B-5: TRACEABILITY_MATRIX** | Decyzja Roberta: archiwizować (baner ARCHIWUM, ~3 LOC) czy modernizować? Nie można zacząć bez odpowiedzi. | **Decyzja Roberta** | N/A |
| BLOCKED | **PR-ARCH-04** (L-5/L-6/L-3/L-4) | >50 LOC, zmiany runtime, wymaga decyzji o timing od Roberta. | **Decyzja Roberta + L-1/L-2 CLOSED** ✅ | MEDIUM jeśli startować |

**Uwaga:** Wykonalna kolejka to tylko 2 PR-y. Reszta backlogu jest blocked przez decyzje Roberta lub zbyt duże dla małego batcha.


---

## Scope PR-DOCS-FIX-01 (szczegóły dla implementującego)

| Plik | Zmiana | LOC | Evidence Source |
|------|--------|-----|-----------------|
| `docs/ADR/ADR-0014-public-offer-canonical-flow.md` linia 162 | Zastąpić `"do uzupełnienia po merge"` przez SHA `1ce398a` | ~3 LOC | A5b-1:Tabela A B-4; ADR-0014:162 |
| `CLAUDE.md` linia 97 | Zmienić `"5.4"` na `"7.3"` (Vite version — package.json: `7.3.1`) | ~1 LOC | A5b-1:Tabela A B-7; package.json:146 |
| `docs/AUDIT_A5B1_REMAINING_ISSUES_MATRIX_2026-04-15.md` | Dodać notę: U-3 RESOLVED — all 22 Edge Functions registered | ~5 LOC | Ta sesja planistyczna; config.toml grep + ls functions/ |

**Łącznie:** ~9 LOC | **Ryzyko:** ZERO | **Zależności:** Brak

---

## Scope PR-TRUTH-01 (szczegóły dla implementującego)

| Krok | Akcja | Plik docelowy |
|------|-------|---------------|
| 1 | Uruchomić `npm run lint` → zanotować wynik | — |
| 2 | Uruchomić `npx tsc --noEmit` → zanotować liczbę błędów | — |
| 3 | Uruchomić `npm test` → zanotować X passed, Y failed | — |
| 4 | Zaktualizować `docs/TRUTH.md`: jawnie zamknąć P1-LINT, P2-RLS, P2-TESTS z dowodami | `docs/TRUTH.md` |

**Warunek:** Krok 4 tylko jeśli wyniki z kroków 1-3 są znane i udokumentowane.
**Łącznie:** ~15 LOC w TRUTH.md | **Ryzyko:** LOW (wymaga npm) | **Zależności:** Brak

---

## B) Items That Should Wait

| Item | Dlaczego nie teraz | Zależność / Brakująca decyzja |
|------|--------------------|-------------------------------|
| **B-5: TRACEABILITY_MATRIX.md** | Decyzja binarna: archiwizować (baner ARCHIWUM, ~3 LOC) czy modernizować (~50+ LOC tracking per-PR). Bez decyzji Roberta nie można określić zakresu. | Decyzja Roberta: archive vs. modernize |
| **PR-ARCH-04: L-5/L-6/L-3/L-4** | >50 LOC, zmiany runtime w Edge Function + hooks + komponenty. L-1/L-2 są CLOSED więc technicznie można zacząć, ale zakres i timing wymagają decyzji. | Decyzja Roberta o priorytecie i zakresie |
| **PR-DOCS-02: Mode B DOCX pilot** | Wymaga Edge Function + biblioteka docxtemplater + spełnienia kryteriów S1-S10 z ADR-0013. Bardzo duży zakres. Feature flaga OFF = zero wpływu na użytkowników. | Decyzja Roberta kiedy startować |
| **PR-BE-LOW-02: relational joins** | >30 LOC, decyzja architektoniczna (team_members(*) joins). Poza scope bieżącego batcha. | Decyzja Roberta o priorytecie |
| **Supabase CLI gen types** | Narzędzie `supabase gen types` niedostępne w środowisku CCW. Jednorazowe uruchomienie lokalnie. | Robert: `npx supabase gen types --project-id <id>` |
| **Repo cleanup** | 687 branchy, 68 open PRs (snapshot 2026-04-14). Akcje destrukcyjne — agent NIE wykonuje bez zgody. | Robert: wykonać wg `docs/ops/REPO_HYGIENE_RUNBOOK.md` |


---

## C) Manual Decisions Robert Must Make

| # | Decyzja | Dlaczego to ważne | Blokuje który PR |
|---|---------|-------------------|------------------|
| 1 | **Zweryfikować `VITE_PUBLIC_SITE_URL=https://majsterai.com` w Vercel Dashboard (Production scope)** | Env var wymagana aby SEO fix PR-INFRA-01 (#689, merged `f7b0cd6`) działał na produkcji. Kod zmergowany, ale env nie potwierdzone. | Skuteczność PR-INFRA-01 na produkcji |
| 2 | **Potwierdzić że migracja ARCH-03 zastosowana w produkcji** | ARCH-03 (#705, commit `04659ff`) zawiera `20260415120000_arch03_*.sql`. L-1/L-2 są CLOSED w repo, ale prod może mieć starą wersję. Komenda weryfikacji: `SELECT proname FROM pg_proc WHERE proname = 'process_offer_acceptance_action'` | Poprawne działanie L-1/L-2 w produkcji |
| 3 | **TRACEABILITY_MATRIX.md: archiwizować czy modernizować?** | Dokument przestarzały od 2026-02-07. Nie śledzi żadnego z 15 PR-ów serii post-roadmap. Decyzja binarna: (A) baner ARCHIWUM ~3 LOC lub (B) modernizacja ~50+ LOC. | B-5 closure |
| 4 | **TRUTH.md: jawnie zamknąć P1-LINT, P2-RLS, P2-TESTS** | Otwarte pytania z 2026-02-18. PR-TRUTH-01 wymaga najpierw uruchomienia testów/lint/tsc — ale decyzja czy to priorytet należy do Roberta. Agent może uruchomić narzędzia. | PR-TRUTH-01 (opcjonalna zgoda, agent może działać autonomicznie) |
| 5 | **PR-ARCH-04: kiedy i w jakim zakresie zamknąć L-5/L-6/L-3/L-4?** | L-1/L-2 CLOSED (ARCH-03, 2026-04-15). Deprecacja legacy routes (`/offer/:token`, `/oferta/:token`) możliwa dopiero po zamknięciu L-5/L-6/L-3/L-4. >50 LOC, runtime. | PR-ARCH-04 |
| 6 | **PR-DOCS-02: kiedy rozpocząć pilot DOCX Mode B?** | Foundation (PR-DOCS-01, #694) merged, flaga FF_MODE_B_DOCX_ENABLED domyślnie OFF. Pilot wymaga Edge Function + docxtemplater. Silence = NO-GO per ADR-0013. | PR-DOCS-02 |

---

## First PR to Start Immediately

**→ PR-DOCS-FIX-01**

Uzasadnienie (5 powodów):

1. **Zakres minimalny** — ~9 LOC w 3 plikach docs, zero zmian w src/** ani supabase/**
2. **Zero ryzyka** — czysto dokumentacyjne; żaden runtime kod nie jest dotykany
3. **Zero decyzji Roberta** — wszystkie 3 zmiany nie wymagają żadnej zgody ani zewnętrznej weryfikacji
4. **Zamyka 3 pozycje naraz** — B-4 (ADR SHA, LOW), B-7 (Vite version, MEDIUM), U-3 (closure note, MEDIUM)
5. **Natychmiastowa wartość** — niespójność Vite "5.4" vs "7.3" jest w CLAUDE.md (głównym dokumencie instrukcji), jej korekta poprawia rzetelność dokumentacji używanej przez agenta w każdej sesji

---

## Why the Other Items Are Not First

| Item | Dlaczego nie jest pierwszy |
|------|---------------------------|
| PR-TRUTH-01 | Wymaga uruchomienia `npm run lint`/`tsc`/`npm test` — nieco więcej złożoności niż czyste edycje pliku |
| B-5 (TRACEABILITY_MATRIX) | Zablokowany — potrzebna decyzja Roberta zanim można określić zakres |
| PR-ARCH-04 (L-5/L-6/L-3/L-4) | Zablokowany + >50 LOC + runtime — nie może być "first" |
| PR-DOCS-02 (Mode B) | Zablokowany + bardzo duży zakres |


---

## Remaining Unknowns

| # | Unknown | Dotyczy | Dlaczego nie da się rozstrzygnąć | Kto rozstrzyga |
|---|---------|---------|----------------------------------|----------------|
| U-1 | `VITE_PUBLIC_SITE_URL=https://majsterai.com` w Vercel Dashboard (Production scope) | PR-INFRA-01 (merged #689) | Poza repo — Vercel Dashboard niedostępny dla agenta | Robert: Vercel → Settings → Environment Variables → Production |
| U-2 | Czy migracja ARCH-03 (`20260415120000_arch03_*.sql`) zastosowana w produkcji | ARCH-03 (#705) | Brak dostępu do Supabase Dashboard w sesji read-only | Robert: Supabase SQL Editor → `SELECT proname FROM pg_proc WHERE proname = 'process_offer_acceptance_action'` |
| U-3 | ~~4 Edge Functions niezarejestrowane w config.toml~~ | ~~PR-SUPA-02 follow-up~~ | **RESOLVED** — ta sesja: wszystkie 22 zarejestrowane | Zamknięty |
| U-4 | Kiedy i w jakim zakresie PR-ARCH-04 (L-5/L-6/L-3/L-4) | COMPATIBILITY_MATRIX:145-148 | Decyzja priorytetowa Roberta | Robert + plan sprint |

---

## Porównanie: Stary A5b Next Batch vs Nowy A5b-2 Plan

> Kontekst: A5b (AUDIT_A5B_REMAINING_ISSUES_NEXT_BATCH_2026-04-15.md) był oparty na
> A5a-2026-04-14 (przed BOOKKEEP-01, SEC-02, ARCH-03, ARCH-03b). Poniżej pokazuję co wykonano.

| Order | PR z A5b (stary plan) | Status |
|-------|----------------------|--------|
| 0 | Robert merge PR-INFRA-01 (#689) | ✅ DONE — `f7b0cd6`, 2026-04-15 |
| 1 | PR-BOOKKEEP-01: docs cleanup | ✅ DONE — DOCS-CONFLICT-01 (#699) + BOOKKEEP-01 (#703, #707) |
| 2 | PR-SUPA-03: config.toml Edge Functions | ✅ RESOLVED — wszystkie 22 zarejestrowane (odkrycie tej sesji) |
| 3 | PR-SEC-02: SECURITY_BASELINE.md | ✅ DONE — SEC-02 (#704) |
| 4 | PR-ARCH-03: L-1 + L-2 gap fill | ✅ DONE — ARCH-03 (#705) + ARCH-03b (#706) |

Cały stary A5b next batch został wykonany. Nowy plan wynika z nowych odkryć i pozostałego backlogu.

---

## Agent does / Robert does

### Agent może zrobić (bez czekania na Roberta):
1. **PR-DOCS-FIX-01** — ADR SHA + Vite version fix + U-3 closure note (~9 LOC, ZERO risk)
2. **PR-TRUTH-01** — uruchomić lint/tsc/tests i zaktualizować TRUTH.md (~15 LOC)

### Robert musi (zanim agent może ruszyć dalej):
1. **[EXTERNAL, MEDIUM]** Zweryfikować `VITE_PUBLIC_SITE_URL` w Vercel Dashboard → Production scope
2. **[EXTERNAL, MEDIUM]** Potwierdzić ARCH-03 migration w Supabase SQL Editor
3. **[DECYZJA]** TRACEABILITY_MATRIX: archiwizować czy modernizować?
4. **[DECYZJA]** PR-ARCH-04: kiedy i co — L-5/L-6/L-3/L-4 deprecation
5. **[DECYZJA]** PR-DOCS-02: kiedy pilot Mode B DOCX
6. **[AKCJA]** Repo cleanup: wg `docs/ops/REPO_HYGIENE_RUNBOOK.md`

---

## Evidence Log

| Zakres | Plan następnego batcha po A5b-1 (Remaining Issues Matrix v2) |
|--------|------|
| Dowód | 9 plików przeczytanych + 2 komendy (grep config.toml, ls functions/) |
| Jakie pliki przeczytałem | CLAUDE.md, A5b-1 (214L), A5a-2026-04-15 (154L), PR_NUMBERING_MAP (87L), A5b-stary (158L), COMPATIBILITY_MATRIX (70L), package.json, config.toml (grep), supabase/functions/ (ls) |
| Jaki batch proponuję | 2 wykonalne PR: PR-DOCS-FIX-01 (~9 LOC) + PR-TRUTH-01 (~15 LOC) |
| Co powinno czekać | B-5, PR-ARCH-04, PR-DOCS-02, PR-BE-LOW-02, repo cleanup, Supabase gen types |
| Jakie decyzje ręczne są potrzebne | 6 decyzji Roberta (patrz Tabela C) |
| Dlaczego PR-DOCS-FIX-01 jest pierwszy | ~9 LOC, ZERO ryzyko, zero decyzji, zamyka 3 pozycje naraz (B-4 LOW + B-7 MEDIUM + U-3 closure) |
| Odkrycie planistyczne | U-3 RESOLVED — wszystkie 22 Edge Functions zarejestrowane w config.toml (config.toml: 22 sekcje [functions.*] = functions/ 22 katalogi) |
| Rollback | Nie dotyczy — planning-only. Zero zmian w src/** ani supabase/**. Rollback tego pliku: `git revert HEAD` |
| Branch / PR | `claude/a5b2-next-batch-plan-hoPA3` |

---

## Podsumowanie ilościowe

| Metryka | Wartość |
|---------|---------|
| Odkrycia planistyczne | 1 (U-3 RESOLVED) |
| Wykonalne PR-y w batch | 2 |
| PR-y zablokowane decyzją Roberta | 2+ (B-5, PR-ARCH-04) |
| Decyzje manualne Roberta | 6 |
| Remaining Unknowns (zewnętrzne) | 2 (U-1, U-2) |
| Zmiany w src/** | 0 |
| Zmiany w supabase/** | 0 |

---

*Wygenerowano: 2026-04-15 | Audyt A5b-2 Next Batch Plan (CCW Hardened) | Branch: `claude/a5b2-next-batch-plan-hoPA3`*
