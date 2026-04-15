# AUDIT A5b-1: Remaining Issues and Deferred Work Matrix

**Data:** 2026-04-15
**Typ:** Synthesis-only (read-only, zero implementation changes)
**Źródła:** A2, A3, A4, A5a

---

## CLAUDE.md Execution Note

CLAUDE.md przeczytany w całości (linie 1-987). Kluczowe zasady zastosowane:
- Komunikacja po polsku
- Synthesis-only / read-only — zero zmian w src/** i supabase/**
- Evidence-first — każde twierdzenie oparte na źródle
- Nie rozszerzaj zakresu (zasada #5)

---

## Files / Sources Read

| # | Plik | Rola |
|---|------|------|
| 1 | `CLAUDE.md` | Instrukcje projektu |
| 2 | `docs/AUDIT_A2_CORE_DOCS_CONSISTENCY_2026-04-14.md` | Audyt spójności dokumentacji |
| 3 | `docs/AUDIT_A3_PACK1_CLOSURE_2026-04-14.md` | Audyt zamknięcia Pack 1 |
| 4 | `docs/AUDIT_A4_PACK2_CLOSURE_2026-04-14.md` | Audyt zamknięcia Pack 2 |
| 5 | `docs/AUDIT_A5A_FINAL_STATUS_MATRIX_2026-04-14.md` | Finalna matryca statusów |

---

## Tabela A: Remaining Issues

| Severity | Area | Finding | Evidence Source | Why Still Open |
|----------|------|---------|-----------------|----------------|
| HIGH | PR-INFRA-01 | PR#689 (SEO canonical/og:url/sitemap) NIE zmergowany — CI green, Vercel preview ready | A4:69, A5a:6 | Czeka na decyzję Roberta (merge/close) |
| HIGH | ROADMAP_STATUS.md | Wskaźniki postępu 12/20=60% sprzeczne z tabelą statusów 20/20=100% DONE (C-02) | A2:C-02, A5a:B-1 | Wskaźniki nie zaktualizowane po PR-08..PR-20 |
| HIGH | ROADMAP_ENTERPRISE.md | Linia 229 "Superseded" sprzeczna z banerem ARCHIWUM (C-01) | A2:C-01, A5a:B-3 | PR-OPS-01 dodał baner ale nie usunął l.229 |
| HIGH | Docs cross-ref | PR numbering reuse — te same numery PR(00-05) = różne zadania w ROADMAP_ENTERPRISE vs ROADMAP_STATUS (C-04) | A2:C-04 | Brak tabeli mapowania |
| HIGH | Docs cross-ref | Dwa konkurujące frameworki: ROADMAP.md (21 PR) vs ULTRA (6 Stages+Gate Cards) (C-06) | A2:C-06 | ULTRA oznaczony archiwum ale ma executable prompts |
| HIGH | Arch | Luki L-1 (auto-create v2_projects) i L-2 (powiadomienia) blokują deprecację legacy routes | A3:75, COMPATIBILITY_MATRIX:141-148 | Zaplanowane na PR-ARCH-03 |
| MEDIUM | Infra | 4 z 6 brakujących Edge Functions z TRACEABILITY_MATRIX:28 nadal potencjalnie niezarejestrowane | A3:80, A5a:U-3 | PR-SUPA-02 naprawił tylko 2 z 6 |
| MEDIUM | Arch | 4 legacy readers nadal czytają z offer_approvals | A3:81, COMPATIBILITY_MATRIX:106-109 | Celowo odroczone P2/P3 do PR-ARCH-03+ |
| MEDIUM | Security | SECURITY_BASELINE.md nie dokumentuje wzorca SECURITY DEFINER (z SEC-01) | A3:76 | Poza scope PR-SEC-01 |
| MEDIUM | Docs | Vite version: 7.3 (ROADMAP_ENTERPRISE/ULTRA) vs 5.4 (CLAUDE.md) (C-05) | A2:C-05 | Wymaga weryfikacji package.json |
| MEDIUM | Docs | TRUTH.md PR numbering confusion — stara numeracja PR# vs nowa PR- (C-03) | A2:C-03 | Brak ostrzeżenia w TRUTH.md |
| MEDIUM | Docs | Legacy P1-LINT, P2-RLS, P2-TESTS z TRUTH.md nigdy jawnie nie zamknięte (C-07) | A2:C-07 | Brak dowodu zamknięcia mimo 20 PR merges |
| MEDIUM | Docs | ROADMAP_STATUS.md nie śledzi post-roadmap PRs (SUPA/SEC/ARCH/OPS series) | A3:79, A5a:B-2 | Seria post-roadmap nie ma trackera |
| MEDIUM | Infra | VITE_PUBLIC_SITE_URL env var wymaga weryfikacji w Vercel Dashboard | A4:106 | Agent nie ma dostępu do Vercel |
| LOW | Docs | ADR-0014 linia 162: "SHA: do uzupełnienia po merge" — nigdy nie uzupełniony | A3:77, A5a:B-4 | Przeoczenie dokumentacyjne |
| LOW | Docs | TRACEABILITY_MATRIX.md przestarzały (2026-02-07) | A3:78, A5a:B-5 | Nie utrzymywany dla post-roadmap PRs |
| LOW | Docs | Raporty audytowe A2/A3/A4 nie linkowane w DOCS_INDEX.md | A5a:B-6 | Przeoczenie |
| LOW | Types | types.ts generowane ręcznie — mogą dryfować od schematu | A3:83 | CLI supabase gen types niedostępne w CCW |
| LOW | PR-DOCS-01 | CONDITIONAL PASS — foundation Mode B DOCX, nie pełna implementacja | A4:73, A5a:10 | Celowo — PR-DOCS-02 jest następnym krokiem |
| LOW | PR-BE-LOW-01 | PR body deklaruje build:dev zamiast npm run build w weryfikacji | A4:107 | CI prod build passed — brak akcji |

---

## Tabela B: Deferred / Not Done / Could Not Complete

| Item | Type | Evidence Source | Why | Recommended Handling |
|------|------|-----------------|-----|----------------------|
| PR-DOCS-02 pilot DOCX | Deferred intentionally | A4:73, ADR-0013, DECISIONS.md:10 | PR-DOCS-01 to foundation; pilot jest następnym krokiem | Zaplanować PR-DOCS-02 gdy priorytet biznesowy |
| GO/NO-GO decision Mode B | Blocked by external decision | A4:111, ADR-0013 | Wymaga PR-DOCS-02 + kryteriów S1-S10 | Czekać na PR-DOCS-02 |
| PR-BE-LOW-02 relational join strings | Deferred intentionally | A4:108 | >30 LOC, decyzja architektoniczna | Osobny PR gdy priorytet |
| 4 legacy readers (offer_approvals) | Deferred intentionally | A3:81, COMPATIBILITY_MATRIX:106-109 | P2/P3, planowane na przyszły sprint | PR-ARCH-03+ |
| L-1 auto-create v2_projects | Deferred intentionally | A3:75, ADR-0014:122-128 | Zaplanowane na PR-ARCH-03 | PR-ARCH-03 |
| L-2 powiadomienia (notifications) | Deferred intentionally | A3:75, ADR-0014:123-128 | Zaplanowane na PR-ARCH-03 | PR-ARCH-03 |
| 4 Edge Functions registration | Could not complete in scope | A3:80, TRACEABILITY_MATRIX:28 | PR-SUPA-02 obejmował tylko 2 z 6 | PR-SUPA-xx |
| SECURITY_BASELINE.md update | Deferred intentionally | A3:76 | Poza scope PR-SEC-01 | PR-DOCS-xx |
| ADR-0014 SHA completion (l.162) | Failed in execution | A3:77, A5a:B-4 | Przeoczenie dokumentacyjne | <10 LOC, zrób w następnym PR-DOCS |
| TRACEABILITY_MATRIX.md update | Could not complete in scope | A3:78, A5a:B-5 | Nie utrzymywany post-roadmap | Decyzja: utrzymywać czy archiwizować? |
| ROADMAP_STATUS.md extension | Not done | A3:79, A5a:B-2 | Brak trackera dla post-roadmap PRs | Decyzja Roberta |
| Supabase CLI gen types | Could not verify | A3:83 | CLI niedostępne w CCW | Jednorazowe uruchomienie lokalnie |
| Repo cleanup (687 branchy, 68 PRs) | Deferred intentionally | A4:71, docs/ops/REPO_HYGIENE_RUNBOOK.md | Zero akcji destrukcyjnych — celowo | Robert: wykonaj wg runbook |
| Audit reports → DOCS_INDEX.md | Not done | A5a:B-6 | Przeoczenie | <5 LOC, zrób w następnym PR |
| ROADMAP_ENTERPRISE.md l.229 fix | Not done | A2:C-01, A5a:B-3 | PR-OPS-01 dodał baner ale nie usunął l.229 | <5 LOC, wymaga decyzji Roberta |
| ROADMAP_STATUS.md indicators 20/20 | Not done | A2:C-02, A5a:B-1 | Wskaźniki nie zaktualizowane | ~15 LOC, wymaga decyzji Roberta |

---

## Tabela C: Manual / External Decisions Still Needed

| Decision | Why Needed | Evidence Source | Blocking What |
|----------|-----------|-----------------|---------------|
| PR-INFRA-01 (#689): merge lub close? | PR open z green CI — wymaga jawnej decyzji | A4:69, A5a:6 | SEO fix na produkcji |
| VITE_PUBLIC_SITE_URL w Vercel Dashboard | Env var wymagana aby SEO fix działał na prod | A4:106 | PR-INFRA-01 skuteczność |
| ROADMAP_STATUS.md: zaktualizować wskaźniki do 20/20? | Sprzeczność C-02 aktywna — 60% vs 100% | A2:C-02, A5a:B-1 | Spójność dokumentacji |
| ROADMAP_ENTERPRISE.md l.229: usunąć "Superseded"? | Sprzeczność C-01 z banerem ARCHIWUM | A2:C-01 | Spójność dokumentacji |
| Tabela mapowania PR numeracji? | C-04: te same numery = różne zadania | A2:C-04 | Czytelność dokumentacji |
| ULTRA_ENTERPRISE_ROADMAP.md: aktywnie używany? | C-06: jeśli tak — powiązać z ROADMAP.md; jeśli nie — usunąć prompts | A2:C-06 | Architektura dokumentacji |
| Vite version: zweryfikować package.json | C-05: 7.3 vs 5.4 — który poprawny? | A2:C-05 | Poprawność dokumentacji |
| TRUTH.md: dodać ostrzeżenie o numeracji? | C-03: czytelnik może pomylić PR# z PR- | A2:C-03 | Czytelność |
| Legacy issues (P1-LINT, P2-RLS, P2-TESTS): jawnie zamknąć? | C-07: brak dowodu zamknięcia mimo 20 PR merges | A2:C-07 | Otwarte pytania bezpieczeństwa |
| PR-SEC-01: migracja zastosowana w produkcji? | Audyt repo-only — brak dostępu do Supabase Dashboard | A3:U-2, A5a:U-4 | Bezpieczeństwo produkcji |
| GO/NO-GO Mode B DOCX | Wymaga PR-DOCS-02 + S1-S10 z ADR-0013 | A4:111, ADR-0013 | Rozwój Mode B |
| Repo cleanup: wykonać wg runbook? | 687 branchy, 68 open PRs — snapshot z 2026-04-14 | A4:71, REPO_HYGIENE_RUNBOOK.md | Higiena repo |
| TRACEABILITY_MATRIX.md: utrzymywać czy archiwizować? | Przestarzały (2026-02-07), nie pokrywa post-roadmap | A3:78, A5a:B-5 | Śledzenie zmian |

---

## What Is Actually Closed and Should NOT Be Reopened

1. **PR-SUPA-01** — PASS, merged. Typy Supabase zsynchronizowane. (A3:64)
2. **PR-SUPA-02** — PASS, merged. 2 Edge Functions zarejestrowane w config.toml. (A3:65)
3. **PR-SEC-01** — PASS, merged. SECURITY DEFINER RPC, 20 testów. (A3:66)
4. **PR-ARCH-01** — PASS, merged. FLOW-B kanoniczny, ADR-0014, 32+ testów. (A3:67)
5. **PR-ARCH-02** — PASS, merged. Dead code usunięty, COMPATIBILITY_MATRIX, 34 testy. (A3:68)
6. **PR-OPS-01** — PASS, merged. Phantom hash audit, DOCS_INDEX, banery ARCHIWUM. (A4:70)
7. **PR-OPS-02** — PASS, merged. Runbook + inventory. Zero akcji destrukcyjnych. (A4:71)
8. **PR-BE-LOW-01** — PASS, merged. Centralizacja bucket names, 10 testów regresji. (A4:72)
9. **DECISIONS.md** — Consistent across all audits (A2, A4). Spójny log decyzji.
10. **ADR framework** — Functioning correctly. ADR-0013, ADR-0014 opublikowane i referencyjne.

---

## Remaining Unknowns

| # | Unknown | Dotyczy | Dlaczego nie da się rozstrzygnąć | Kto rozstrzyga |
|---|---------|---------|----------------------------------|-----------------|
| U-1 | Czy 4 Edge Functions z TRACEABILITY_MATRIX:28 są zarejestrowane w config.toml? | PR-SUPA-02 follow-up | PR-SUPA-02 naprawił 2 z 6; pełna weryfikacja poza scope | Osobny audyt config.toml vs functions/ |
| U-2 | Czy migracja SEC-01 zastosowana w produkcji? | PR-SEC-01 | Audyt repo-only — brak dostępu Supabase Dashboard | Robert: SQL Editor w Supabase |
| U-3 | Czy CI/CD przeszło dla commitów #684-#688? | Pack 1 targets | Brak dostępu do GitHub Actions logs | Robert: gh run list |
| U-4 | Czy healthcheck/stripe-webhook mają verify_jwt=true? | config.toml | Poza scope Pack 1 | Odczyt config.toml + test bez JWT |
| U-5 | Czy VITE_PUBLIC_SITE_URL ustawione w Vercel Dashboard? | PR-INFRA-01 | Env var poza repo | Robert: Vercel Dashboard |
| U-6 | Runtime weryfikacja ReadyDocuments z FF=false | PR-DOCS-01 | Wymaga zalogowanego użytkownika | Smoke test po deploy |
| U-7 | Aktualny stan branchy/PRs od inventory 2026-04-14 | PR-OPS-02 | Snapshot starzeje się | Ponowny run list-stale-branches.sh |
| U-8 | Actual Vite version w package.json | C-05 | Audyt A2 był docs-only | Odczyt package.json |
| U-9 | Czy ULTRA_ENTERPRISE_ROADMAP.md jest aktywnie używany? | C-06 | Oznaczony archiwum ale ma prompts | Decyzja Roberta |
| U-10 | Status P1-LINT, P2-RLS, P2-TESTS z TRUTH.md | C-07 | TRUTH.md to snapshot z 2026-02-18 | Uruchomienie lint/tsc/tests |

---

## Podsumowanie ilościowe

| Metryka | Wartość |
|---------|---------|
| Remaining Issues (Tabela A) | 20 (6 HIGH, 8 MEDIUM, 6 LOW) |
| Deferred / Not Done (Tabela B) | 16 pozycji |
| Manual Decisions Needed (Tabela C) | 13 decyzji |
| Closed — do NOT reopen | 10 pozycji |
| Remaining Unknowns | 10 (U-1..U-10) |
| Implementation changes | 0 (synthesis-only) |
| Files modified in src/** | 0 |
| Files modified in supabase/** | 0 |
