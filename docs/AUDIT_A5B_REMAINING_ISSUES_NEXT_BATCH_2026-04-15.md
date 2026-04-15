# AUDIT-A5b: Remaining Issues & Next Batch Plan

**Data:** 2026-04-15
**Audytor:** Claude Code Web (Principal Release Planner + Audit Synthesizer)
**Tryb:** synthesis-only / read-only / evidence-first / no guessing
**Branch:** `claude/a5b-remaining-issues-next-batch-fklFh`

---

## CLAUDE.md Execution Note

CLAUDE.md przeczytany w calosci (linie 0-988, w 4 czesciach po 200 linii) PRZED rozpoczeciem pracy.

| # | Regula z CLAUDE.md | Jak zastosowano |
|---|---|---|
| 4 | Nie zgaduj | Kazdy status oparty na cytacie z A2/A3/A4/A5a |
| 5 | Nie rozszerzaj zakresu | Zero implementacji — tylko synteza |
| 10 | Przeglad diffa | Jedyna zmiana to ten raport w docs/ |
| 12 | Evidence Log obowiazkowy | Dolaczony ponizej |
| 13 | Pass #3 = prompt linia po linii | Weryfikacja per-punkt w sekcji finalnej |
| 18 | Dowod liczbowy, nie narracja | Kazdy finding ma zrodlo (audyt + linia) |

Brak konfliktow miedzy promptem a CLAUDE.md.

---

## Files / Sources Read

| # | Plik | Cel odczytu |
|---|---|---|
| 1 | `CLAUDE.md` (linie 0-988) | Obowiazkowy start sesji |
| 2 | `docs/AUDIT_A2_CORE_DOCS_CONSISTENCY_2026-04-14.md` (linie 0-135) | 7 sprzecznosci, 4 unknowns |
| 3 | `docs/AUDIT_A3_PACK1_CLOSURE_2026-04-14.md` (linie 0-112) | Closure Pack 1: 5 targetow, 8 open issues |
| 4 | `docs/AUDIT_A4_PACK2_CLOSURE_2026-04-14.md` (linie 0-162) | Closure Pack 2: 5 targetow, 7 open issues |
| 5 | `docs/AUDIT_A5A_FINAL_STATUS_MATRIX_2026-04-14.md` (linie 0-127) | Final matrix: 10 targetow, 6 bookkeeping issues |
| 6 | `docs/DECISIONS.md` (linie 1-11) | Log decyzji — 6 wpisow |
| 7 | `docs/DOCS_INDEX.md` (linie 0-123) | Nawigacja source-of-truth, naprawione sprzecznosci |
| 8 | `docs/COMPATIBILITY_MATRIX.md` (linie 95-165) | Legacy readers, L-1..L-6 gaps |

---

## A) Remaining Issues Table

| Severity | Area | Finding | Evidence Source | Why Still Open |
|----------|------|---------|----------------|----------------|
| **HIGH** | Docs/Bookkeeping | ROADMAP_STATUS.md wskazniki postepu (linie 416-431) pokazuja 12/20=60% mimo ze tabela statusow (linie 27-48) = 20/20 DONE | A2:C-02, A5a:B-1 | PR-OPS-01 naprawil status PR-00 w tabeli ale NIE zaktualizowal wskaznikow postepu |
| **MEDIUM** | Infra/PR | PR-INFRA-01 (#689) nie zmergowany — SEO canonical/og:url/sitemap fix czeka na decyzje | A4:linia 69, A5a:linia 52 | Robert nie podjal decyzji. CI 13/13 green, Vercel preview ready |
| **MEDIUM** | Docs | ROADMAP_STATUS.md nie sledzi serii post-roadmap (PR-SUPA/SEC/ARCH/INFRA/OPS/BE-LOW/DOCS) | A3:linia 79, A5a:B-2 | Seria post-roadmap nie ma trackera — ROADMAP_STATUS konczy sie na PR-20 |
| **MEDIUM** | Infra | config.toml — 4 z 6 brakujacych Edge Functions nadal potencjalnie niezarejestrowane | A3:linia 80, TRACEABILITY_MATRIX:28 | PR-SUPA-02 naprawil 2 z 6 (customer-portal, request-plan). Pozostale 4 niezweryfikowane |
| **MEDIUM** | Docs | Vite version niespojnosc: ROADMAP_ENTERPRISE i ULTRA mowia 7.3, CLAUDE.md mowi 5.4 | A2:C-05 | Audyt A2 byl docs-only — nie sprawdzil package.json |
| **MEDIUM** | Docs | TRUTH.md otwarte problemy (P1-LINT, P2-RLS, P2-TESTS) nigdy jawnie nie zamkniete | A2:C-07 | Po 20 PR-ach merge powinny byc rozwiazane ale brak jawnego dowodu zamkniecia |
| **MEDIUM** | Arch | 4 legacy readers (useExpirationMonitor, TodayTasks, useOfferStats, useFreeTierOfferQuota) nadal czytaja z offer_approvals | A3:linia 81, COMPATIBILITY_MATRIX:106-109 | Celowo odroczone na przyszly sprint (P2/P3) |
| **LOW** | Docs | ROADMAP_ENTERPRISE.md:229 resztka "Superseded" sprzeczna z banerem ARCHIWUM | A2:C-01, A5a:B-3 | PR-OPS-01 dodal baner ARCHIWUM ale nie usunal fałszywego twierdzenia w linii 229 |
| **LOW** | Docs | ADR-0014 linia 162: "SHA: do uzupelnienia po merge" — nigdy nie uzupelniony | A3:linia 77, A5a:B-4 | Drobne przeoczenie dokumentacyjne |
| **LOW** | Docs | TRACEABILITY_MATRIX.md przestarzaly (2026-02-07), nie pokrywa targetow post-roadmap | A3:linia 78, A5a:B-5 | Tracker nie jest aktywnie utrzymywany |
| **LOW** | Docs | Raporty audytowe A2/A3/A4/A5a NIE linkowane w DOCS_INDEX.md | A5a:B-6 | DOCS_INDEX traktuje AUDIT_*.md jako archiwalne |
| **LOW** | Docs | SECURITY_BASELINE.md nie dokumentuje wzorca SECURITY DEFINER (z PR-SEC-01) | A3:linia 76 | Dokument nie byl w scope PR-SEC-01 |
| **LOW** | Types | types.ts generowane recznie — moga dryfowac od schematu | A3:linia 83 | Supabase CLI niedostepne w CCW |
| **LOW** | Infra | Follow-up PR-BE-LOW-02: relational join strings team_members(*) | A4:linia 108 | Celowo odroczone — >30 LOC, decyzja architektoniczna |

---

## B) Deferred / Not Done / Could Not Complete

| Item | Type | Evidence Source | Why | Recommended Handling |
|------|------|----------------|-----|----------------------|
| PR-INFRA-01 merge | Blocked by external/manual decision | A4:linia 69, A5a:linia 52 | Robert nie podjal decyzji merge/close. CI green. | Robert: merge PR#689 lub zamknij z uzasadnieniem |
| ROADMAP_STATUS.md wskazniki postepu | Failed in execution | A2:C-02, A5a:B-1 | PR-OPS-01 naprawil tabele ale pominil wskazniki (linie 416-431) | Nowy PR: ~15 LOC, aktualizacja wskaznikow do 20/20=100% |
| ROADMAP_ENTERPRISE.md:229 resztka | Deferred intentionally | A2:C-01, A5a:B-3 | PR-OPS-01 dodal baner ale nie usunal linii 229 | Nowy PR: ~5 LOC, usuniecie/korekta linii 229 |
| ADR-0014 SHA merge | Could not complete in current scope | A3:linia 77, A5a:B-4 | Przeoczenie — SHA nie uzupelniony po merge | Nowy PR: ~3 LOC, wpisanie SHA commitu 1ce398a |
| SECURITY_BASELINE.md update | Deferred intentionally | A3:linia 76 | Poza scope PR-SEC-01 | Nowy PR: ~15 LOC, dodanie wzorca SECURITY DEFINER |
| config.toml 4 Edge Functions | Could not verify | A3:linia 80, U-1 | PR-SUPA-02 naprawil 2 z 6. Reszta niezweryfikowana | Audyt: porownanie ls supabase/functions/ z config.toml |
| Legacy readers migration (4 hooki) | Deferred intentionally | A3:linia 81, COMPATIBILITY_MATRIX:106-109 | P2/P3 priorytet, planowane na przyszly sprint | PR-ARCH-03+ po zamknieciu L-1/L-2 |
| L-1 auto-create v2_projects | Could not complete in current scope | A3:linia 82, COMPATIBILITY_MATRIX:143 | P0 gap w FLOW-B, wymaga implementacji w Edge Function | PR-ARCH-03: >50 LOC, architektura |
| L-2 notifications on ACCEPT/REJECT | Could not complete in current scope | A3:linia 82, COMPATIBILITY_MATRIX:144 | P0 gap w FLOW-B, wymaga implementacji w Edge Function | PR-ARCH-03: >50 LOC, architektura |
| Mode B DOCX pilot (PR-DOCS-02) | Deferred intentionally | A4:linia 110, DECISIONS.md:10 | PR-DOCS-01 to foundation — pilot jest nastepnym krokiem | PR-DOCS-02: Edge Function + docxtemplater + S1-S10 |
| GO/NO-GO Mode B | Blocked by external/manual decision | A4:linia 111, ADR-0013 | Wymaga najpierw dostarczenia pilota PR-DOCS-02 | Robert: decyzja po pilocie. Silence = NO-GO |
| VITE_PUBLIC_SITE_URL w Vercel | Blocked by external/manual decision | A4:linia 106, A5a:Unknown-2 | Agent nie ma dostepu do Vercel Dashboard | Robert: sprawdzic Vercel → Settings → Env Vars → Production |
| Repo cleanup (687 branchy, 68 open PR) | Blocked by external/manual decision | A4:linia 109 | Agent NIE wykonywal akcji destrukcyjnych | Robert: cleanup wg docs/ops/REPO_HYGIENE_RUNBOOK.md |
| Vite version verification | Could not verify | A2:C-05 | Audyt A2 docs-only — package.json poza scope | Sprawdzic package.json i skorygowac dokumenty |

---

## C) Next Batch Recommendation

Zasady: max 5 PR, kazdy maly i atomowy, kolejnosc technicznie uzasadniona.

| Order | Next PR | Why This First | Dependency | Risk |
|-------|---------|----------------|------------|------|
| 0 | **Robert: merge PR-INFRA-01 (#689)** | Juz gotowy, CI green, zero pracy agenta. Blokuje SEO fix (canonical/og:url leak). | Wymaga weryfikacji VITE_PUBLIC_SITE_URL w Vercel Dashboard | ZERO — kod zweryfikowany, CI 13/13 green |
| 1 | **PR-BOOKKEEP-01: Docs bookkeeping cleanup** | Naprawia HIGH (C-02 wskazniki 12/20→20/20), LOW (B-3 linia 229, B-4 ADR SHA, B-6 DOCS_INDEX linki). Wszystko docs-only, ~30 LOC. | Brak | ZERO — czysto dokumentacyjne |
| 2 | **PR-SUPA-03: config.toml Edge Functions audit** | Zamyka MEDIUM (4 potencjalnie niezarejestrowane Edge Functions). Weryfikacja + rejestracja, ~10-20 LOC. | Brak | NISKI — tylko config, nie zmienia runtime |
| 3 | **PR-SEC-02: SECURITY_BASELINE.md update** | Dokumentuje wzorzec SECURITY DEFINER z PR-SEC-01. ~15 LOC, docs-only. | PR-SEC-01 (merged) | ZERO — czysto dokumentacyjne |
| 4 | **PR-ARCH-03: L-1 + L-2 gap fill** | P0 blokery deprecjacji legacy routes. Auto-create v2_projects + notifications na ACCEPT/REJECT. >50 LOC, wymaga zmian w Edge Function. | PR-SEC-01, PR-ARCH-01 (oba merged) | SREDNI — zmiana logiki biznesowej w process_offer_acceptance_action |

**Uzasadnienie kolejnosci:**
- Order 0: zero pracy, tylko decyzja Roberta
- Order 1-3: male, bezpieczne, docs/config only — zamykaja wiele otwartych issues bez ryzyka
- Order 4: jedyny PR z kodem runtime — dlatego ostatni, po zamknieciu calego backlogu docs

---

## What Robert Still Has to Decide Manually

| # | Decyzja | Kontekst | Pilnosc |
|---|---------|----------|---------|
| 1 | **Merge lub close PR-INFRA-01 (#689)** | SEO fix, CI green, Vercel preview ready. Czeka od 2026-04-14. | WYSOKA — kazdy dzien bez merge = potencjalny SEO leak |
| 2 | **Zweryfikowac VITE_PUBLIC_SITE_URL w Vercel Dashboard** | Env var wymagana aby SEO fix dzialal na produkcji. Vercel → Settings → Environment Variables → Production scope. | WYSOKA — powiazane z PR-INFRA-01 |
| 3 | **Wykonac repo cleanup wg REPO_HYGIENE_RUNBOOK.md** | 687 branchy, 68 open PR. Inventory z 2026-04-14 starzeje sie. | SREDNIA — nie blokuje niczego ale rosnie z czasem |
| 4 | **Kiedy rozpoczac PR-DOCS-02 (pilot DOCX Mode B)?** | PR-DOCS-01 (foundation) merged, flaga OFF. Pilot wymaga Edge Function + docxtemplater. | NISKA — flaga OFF, zero wplywu na uzytkownikow |
| 5 | **GO/NO-GO dla Mode B po pilocie** | ADR-0013: "silence = NO-GO". Decyzja po dostarczeniu pilota i spelnieniu S1-S10. | NISKA — zalezy od PR-DOCS-02 |

---

## Remaining Unknowns

| # | Unknown | Dotyczy | Dlaczego nie da sie rozstrzygnac | Kto rozstrzyga |
|---|---------|---------|----------------------------------|-----------------|
| 1 | Czy 4 pozostale Edge Functions sa zarejestrowane w config.toml | PR-SUPA-02 follow-up | Wymaga porownania ls supabase/functions/ z sekcjami config.toml | PR-SUPA-03 (Next Batch #2) |
| 2 | Czy migracja SEC-01 zostala zastosowana w produkcji | PR-SEC-01 | Audyt repo-only — brak dostepu do Supabase Dashboard | Robert: SQL Editor → SELECT proname FROM pg_proc |
| 3 | Aktualna wersja Vite w package.json | A2:C-05 | Audyty A2 byly docs-only | PR-BOOKKEEP-01 moze zweryfikowac |
| 4 | Czy TRUTH.md problemy P1-LINT, P2-RLS, P2-TESTS sa rozwiazane | A2:C-07 | Snapshot z 2026-02-18, nigdy jawnie nie zamkniety | Wymaga uruchomienia lint/tsc/testow |
| 5 | Runtime weryfikacja ReadyDocuments z FF_MODE_B_DOCX_ENABLED=false | PR-DOCS-01 | Wymaga zalogowanego uzytkownika | Smoke test po deploy |
| 6 | Aktualny stan branchy/PRs od inventory OPS-02 | PR-OPS-02 | Snapshot starzeje sie | Ponowny run list-stale-branches.sh |

---

## Evidence Log

- **Symptom:** Wymagana synteza remaining issues + next batch plan po audytach A2/A3/A4/A5a
- **Dowod:** 4 raporty audytowe (A2: 135 linii, A3: 112 linii, A4: 162 linii, A5a: 127 linii) + DECISIONS.md (11 linii) + DOCS_INDEX.md (123 linie) + COMPATIBILITY_MATRIX.md (70 linii)
- **Zmiana:** Brak zmian implementacyjnych — tylko raport syntezy
- **Weryfikacja:** Synthesis-only; kazdy status ma evidence z audytu zrodlowego
- **Rollback:** git revert <commit-hash> — usuniecie jednego pliku raportu

---

## Agent does / Robert does

### Agent zrobil:
- Przeczytal CLAUDE.md w calosci (linie 0-988)
- Przeczytal 4 raporty audytowe (A2, A3, A4, A5a) w calosci
- Przeczytal DECISIONS.md, DOCS_INDEX.md, COMPATIBILITY_MATRIX.md
- Zbudowal 3 tabele: Remaining Issues (14 pozycji), Deferred/Not Done (14 pozycji), Next Batch (5 PR-ow)
- Zidentyfikowal 5 decyzji dla Roberta i 6 remaining unknowns
- Zapisal raport do docs/

### Robert musi:
1. Merge PR-INFRA-01 (#689) lub zamknij — CI green
2. Zweryfikowac VITE_PUBLIC_SITE_URL w Vercel Dashboard
3. Wykonac repo cleanup wg REPO_HYGIENE_RUNBOOK.md
4. Zdecydowac o starcie PR-DOCS-02 (pilot DOCX)
5. Review tego raportu i potwierdzic kolejnosc Next Batch

---

*Wygenerowano: 2026-04-15 | Audyt A5b Remaining Issues & Next Batch | Branch: claude/a5b-remaining-issues-next-batch-fklFh*
