# AUDIT-A4 Closure Audit Pack 2 — Majster.AI

**Data audytu:** 2026-04-14
**Typ:** READ-ONLY closure verification — brak zmian kodu
**Zakres:** Pack 2 targets: PR-INFRA-01, PR-OPS-01, PR-OPS-02, PR-BE-LOW-01, PR-DOCS-01
**Audytor:** Claude Code (Opus 4.6)
**Branch audytu:** `claude/audit-closure-pack-ahmVb`

---

## CLAUDE.md Execution Note

CLAUDE.md przeczytany w całości (linie 1–949+) przed rozpoczęciem jakiejkolwiek pracy.
Prompt rozłożony na 24 atomowe wymagania w TodoWrite.
Lista wymagań potwierdzona przez Roberta przed rozpoczęciem audytu.

---

## Files / Sources Read

### Pliki w repozytorium (Read / Grep / Glob)

| Plik | Cel odczytu |
|------|-------------|
| `CLAUDE.md` (linie 1–949+) | Obowiązkowy start sesji |
| `docs/DECISIONS.md` (linie 1–11) | Log decyzji — wpisy PR-OPS-01, PR-DOCS-01 |
| `docs/DOCS_INDEX.md` (linie 1–100) | Nawigacja source-of-truth, rejestr ADR |
| `docs/VISUAL_DEPLOYMENT_TRUTH_AUDIT_2026-04-13.md` (linie 1–100) | Kontekst ostatniego audytu |
| `docs/COMPATIBILITY_MATRIX.md` | Macierz kompatybilności offer flow |
| `docs/TRACEABILITY_MATRIX.md` | Macierz śledzenia wymagań |
| `docs/ADR/ADR-0014-public-offer-canonical-flow.md` | ADR kanoniczny offer flow |
| `docs/ADR/ADR-0013-dynamic-docx-mode-b.md` | ADR Mode B DOCX |
| `docs/ops/REPO_HYGIENE_RUNBOOK.md` (linie 1–50) | Runbook sprzątania repo |
| `docs/ops/REPO_HYGIENE_CANDIDATES_2026-04-14.md` (linie 1–50) | Candidate matrix |
| `src/config/featureFlags.ts` (linie 1–156) | Feature flags — FF_MODE_B_DOCX_ENABLED |
| `src/pages/ReadyDocuments.tsx` (linie 62–481, grep kontekst) | Gate FF_MODE_B_DOCX_ENABLED |
| `src/lib/storage.ts` (linie 1–50) | Centralne stałe bucket |
| `src/test/lib/storage-constants.test.ts` (linie 1–72) | Testy regresji stałych |

### Źródła GitHub API (MCP tools)

| Źródło | Dane |
|--------|------|
| `pull_request_read(#689)` | PR-INFRA-01: state=open, merged=false, CI=13/13 pass, +29/-24, 5 files |
| `pull_request_read(#690)` | PR-OPS-01: state=closed, merged=true (2026-04-14 06:08 UTC), +173/-21, 9 files |
| `pull_request_read(#691)` | PR-OPS-02: state=closed, merged=true (2026-04-14 06:53 UTC), +706, 3 files |
| `pull_request_read(#692)` | PR-BE-LOW-01: state=closed, merged=true (2026-04-14 07:40 UTC), +186/-65, 17 files |
| `pull_request_read(#694)` | PR-DOCS-01: state=closed, merged=true (2026-04-14 08:59 UTC), +23/-1, 2 files |
| `get_check_runs(#689)` | PR-INFRA-01 CI: 13 checks, all conclusion=success |
| `get_comments(#689)` | Vercel bot: preview deployment READY |

### Git log / show (Bash)

| Komenda | Wynik |
|---------|-------|
| `git log --oneline -30` | Potwierdzono commity: 06f84c2 (#694), fd98459 (#692), 95b6b86 (#691), b665a8b (#690) na main |
| `git show --stat b665a8b` | PR-OPS-01: 9 files, 173+/21- |
| `git show --stat 95b6b86` | PR-OPS-02: 3 files, 706+ |
| `git show --stat fd98459` | PR-BE-LOW-01: 17 files, 186+/65- |
| `git show --stat 06f84c2` | PR-DOCS-01: 2 files, 23+/1- |
| `git branch -a` | Potwierdzono branch `claude/audit-closure-pack-ahmVb` |

---

## Closure Matrix — Pack 2

| Target | Status | Evidence | Files/Sources Read | What Was Done | What Failed / Was Not Done | Remaining Risk |
|--------|--------|----------|--------------------|---------------|----------------------------|----------------|
| **PR-INFRA-01** | **OPEN — NOT MERGED** | GitHub PR#689: state=open, merged=false. CI 13/13 green. Vercel preview READY. Branch: `claude/pr-infra-01-canonical-og-sitemap-8fb5d` | PR#689 body, CI checks, Vercel comment, `docs/ops/REPO_HYGIENE_CANDIDATES_2026-04-14.md:167` | SEO fix: usunięto `VERCEL_URL` z fallback chain sitemap generator; canonical/og:url w SEOHead.tsx używa `siteUrl` z env; `.env.example` zaktualizowany; 5 plików, +29/-24. CI green (lint 0 errors, tsc 0 errors, vitest 2275 passed, build 25.24s). | PR nie został zmergowany. Czeka na decyzję Roberta. Wymaga ręcznej weryfikacji: `VITE_PUBLIC_SITE_URL=https://majsterai.com` w Vercel Dashboard. | **NISKI** — zmiana jest gotowa i zweryfikowana (CI green), ale wymaga merge + env variable verification na Vercel. Brak merge = preview domain leakage w sitemap/canonical/og:url wciąż możliwy w specyficznych warunkach build. |
| **PR-OPS-01** | **PASS — MERGED** | GitHub PR#690: merged=true, merged_at=2026-04-14T06:08:36Z. Commit `b665a8b` na main. | PR#690 body+stats, `docs/DECISIONS.md:8-9`, `docs/DOCS_INDEX.md`, `docs/ADR/ADR-0014-public-offer-canonical-flow.md` nota | 1) Audyt fantomowego hash `5669817` — pełny grep + git log, zero trafień, udokumentowany negatywny wynik. 2) Naprawiono kolizję ADR-0005 → ADR-0014 (przeniesienie + renumeracja). 3) Stworzono `DOCS_INDEX.md` — nawigacja source-of-truth. 4) Zaktualizowano ADR-0000, COMPATIBILITY_MATRIX.md, DECISIONS.md. 5) Dodano banery ARCHIWUM do 4 przestarzałych docs. 6) Naprawiono fałszywy status PR-00 w ROADMAP_STATUS.md. 9 plików, +173/-21. | Nic — zakres w pełni zrealizowany. Zero zmian runtime/kodu. | **ZEROWY** — czysto dokumentacyjna zmiana, zmergowana i na main. |
| **PR-OPS-02** | **PASS — MERGED** | GitHub PR#691: merged=true, merged_at=2026-04-14T06:53:13Z. Commit `95b6b86` na main. | PR#691 body+stats, `docs/ops/REPO_HYGIENE_RUNBOOK.md:1-50`, `docs/ops/REPO_HYGIENE_CANDIDATES_2026-04-14.md:1-50` | 1) `REPO_HYGIENE_RUNBOOK.md` — 10 reguł bezpieczeństwa (S1-S10), 4-fazowa strategia, procedury GitHub UI, rollback. 2) `REPO_HYGIENE_CANDIDATES_2026-04-14.md` — inventory 687 branchy, 68 open PR, klasyfikacja A-E. 3) `scripts/ops/list-stale-branches.sh` — helper read-only. 3 pliki, +706. Zero akcji destrukcyjnych. | Nic — zakres w pełni zrealizowany. Zero zmian runtime/kodu. Akcje cleanup celowo odroczone do decyzji Roberta. | **NISKI** — inventory jest snapshoten z 2026-04-14; starzeje się z każdym nowym PR. Robert musi wykonać cleanup manualnie wg runbook. |
| **PR-BE-LOW-01** | **PASS — MERGED** | GitHub PR#692: merged=true, merged_at=2026-04-14T07:40:17Z. Commit `fd98459` na main. | PR#692 body+stats, `src/lib/storage.ts:1-50`, `src/test/lib/storage-constants.test.ts:1-72`, `src/config/featureFlags.ts` | 1) Scentralizowano bucket names: `MEDIA_BUCKET`, `DOSSIER_BUCKET`, `COMPANY_DOCUMENTS_BUCKET` w `src/lib/storage.ts`. 2) Dodano `TEAM_MEMBERS_TABLE` constant. 3) Naprawiono `normalizeStoragePath` — używa stałej zamiast hardcoded string. 4) Usunięto 14 hardcoded bucket stringów z 11 plików. 5) Re-export `DOSSIER_BUCKET` z `useDossier.ts` dla backward compat. 6) Dodano 10 testów regresji. 17 plików, +186/-65. Weryfikacja: tsc 0 new errors, lint 0 errors, vitest 2285 passed. | **UWAGA:** PR body deklaruje `npm run build:dev` zamiast `npm run build` (prod). CLAUDE.md wymaga `npm run build` (zasada #15). Jednakże CI `Build Application` check passed (conclusion=success) — CI uruchamia prod build. | **NISKI** — follow-up `PR-BE-LOW-02` zdefiniowany dla relational join strings `team_members(*)`. Build:dev vs build rozbieżność w evidence — ale CI prod build green potwierdza poprawność. |
| **PR-DOCS-01** | **CONDITIONAL PASS — MERGED** | GitHub PR#694: merged=true, merged_at=2026-04-14T08:59:16Z. Commit `06f84c2` na main. | PR#694 body+stats, `src/pages/ReadyDocuments.tsx:62-481`, `src/config/featureFlags.ts:101-114`, `docs/DECISIONS.md:10`, `docs/ADR/ADR-0013-dynamic-docx-mode-b.md` | 1) Zaimportowano `FF_MODE_B_DOCX_ENABLED` w `ReadyDocuments.tsx:67`. 2) Dodano guard (linia ~476): gdy flaga=false → dormant placeholder. 3) Mode A (PDF, jsPDF) nietknięty. 4) Zaktualizowano `DECISIONS.md`. 2 pliki, +23/-1. Weryfikacja: tsc 0 errors, lint 0 errors, vitest 2285/0, build success. | PR jest **wstępem (foundation)** do Mode B DOCX, nie pełną implementacją. Celowo NIE implementuje: Edge Function DOCX, upload DOCX, zmianę domyślnej ścieżki użytkownika. Następny: PR-DOCS-02 (pilot). | **NISKI** — flaga domyślnie OFF (false). Żaden użytkownik nie zobaczy Mode B dopóki nie zostanie świadomie włączona. Ryzyko: jeśli PR-DOCS-02 nigdy nie powstanie, dormant code pozostanie w kodzie. |

---

## PR-DOCS-01 Conditional Matrix

PR-DOCS-01 jest warunkowy — jest wstępem (foundation/gate) do Mode B DOCX, nie pełną implementacją.
Audyt traktuje go jako **warunkowy PASS** z jasnym rozgraniczeniem co zostało zrobione, a co jest prerequisite dla następnych kroków.

| Condition | Result | Evidence |
|-----------|--------|----------|
| Flaga `FF_MODE_B_DOCX_ENABLED` zdefiniowana w `featureFlags.ts` | **SPEŁNIONY** | `src/config/featureFlags.ts:110-114` — export const, resolveFlag, default=false |
| Flaga faktycznie importowana i sprawdzana w UI | **SPEŁNIONY** | `src/pages/ReadyDocuments.tsx:67` — import; `:476` — `if (!FF_MODE_B_DOCX_ENABLED)` guard |
| Guard renderuje dormant placeholder gdy flaga=false | **SPEŁNIONY** | `ReadyDocuments.tsx:477-481` — `<div>` z `FileCheck` icon, muted style, empty state i18n |
| Mode A (PDF, DocumentTemplates, jsPDF) nienaruszony | **SPEŁNIONY** | Grep po `FF_MODE_B_DOCX_ENABLED` w repo → 6 plików; żaden plik Mode A nie zawiera referencji do flagi |
| Edge Function `generate-docx-mode-b` dostarczona | **NIE — celowo poza zakresem** | DECISIONS.md:10 jawnie deklaruje: "Co ten PR celowo NIE robi: nie wdraża Edge Function generatora DOCX" |
| Upload pliku DOCX przez użytkownika | **NIE — celowo poza zakresem** | DECISIONS.md:10 — poza scope |
| Pilot DOCX (S1-S10 z ADR-0013) przetestowany | **NIE — prerequisite dla PR-DOCS-02** | ADR-0013 definiuje kryteria S1-S10; PR-DOCS-02 ma je zrealizować |
| GO/NO-GO decision dla Mode B | **NIE PODJĘTA — prerequisite** | ADR-0013: "Mandatory explicit decision after PR-02 pilot; silence = NO-GO" |
| Domyślny stan flagi = OFF | **SPEŁNIONY** | `featureFlags.ts:113` — `false` jako default; DECISIONS.md potwierdza |
| Dokumentacja decyzji | **SPEŁNIONY** | `docs/DECISIONS.md:10` — pełny wpis z boundary next-PR, explicit scope in/out |

**Werdykt:** PR-DOCS-01 jest **CONDITIONAL PASS** — zrealizował swój zadeklarowany zakres (wiring flagi),
ale jest to dopiero krok 1 z wieloetapowego procesu Mode B. NIE jest force-closed.
Następne kroki (PR-DOCS-02 pilot, GO/NO-GO) są jasno zdefiniowane w ADR-0013 i DECISIONS.md.

---

## Open Issues — Pack 2

| Severity | Area | Finding | Why Still Open | Evidence | Next PR |
|----------|------|---------|----------------|----------|---------|
| **MEDIUM** | PR-INFRA-01 | PR#689 nie jest zmergowany — SEO canonical/og:url/sitemap fix czeka na decyzję Roberta | Robert nie zmergował PR. CI green, Vercel preview ready. | GitHub PR#689: state=open, merged=false | Robert: merge PR#689 lub zamknij z uzasadnieniem |
| **LOW** | PR-INFRA-01 | Wymaga weryfikacji env var `VITE_PUBLIC_SITE_URL=https://majsterai.com` w Vercel Dashboard | Env variable jest wymagana aby fix był aktywny na produkcji. Agent nie ma dostępu do Vercel Dashboard. | PR#689 body: "Robert — action required: Verify VITE_PUBLIC_SITE_URL" | Robert: sprawdź Vercel Dashboard |
| **LOW** | PR-BE-LOW-01 | PR body deklaruje `build:dev` zamiast `npm run build` (prod) w weryfikacji | CLAUDE.md zasada #15 wymaga prod build. Jednakże CI `Build Application` (prod) passed. | PR#692 body: "npm run build:dev → ✅"; CI check "Build Application" → conclusion=success | Brak akcji — CI green potwierdza prod build |
| **LOW** | PR-BE-LOW-01 | Follow-up PR-BE-LOW-02: relational join strings `team_members(*)` w select queries | Celowo odroczone — wymaga głębszego refaktoru (>30 LOC, decyzja architektoniczna) | PR#692 body: "Follow-up (out of scope)" | PR-BE-LOW-02 |
| **INFO** | PR-OPS-02 | Candidate matrix (687 branchy, 68 open PRs) jest snapshoten — starzeje się | Każdy nowy PR/branch zmienia stan. Robert musi działać w rozsądnym oknie czasowym. | `docs/ops/REPO_HYGIENE_CANDIDATES_2026-04-14.md:6-24` | Robert: wykonaj cleanup wg runbook |
| **INFO** | PR-DOCS-01 | Mode B DOCX pilot (PR-DOCS-02) nie istnieje — flaga jest dormant | Celowo — PR-DOCS-01 to tylko foundation. Pilot jest następnym krokiem. | DECISIONS.md:10, ADR-0013 | PR-DOCS-02 |
| **INFO** | PR-DOCS-01 | GO/NO-GO decision dla Mode B nie podjęta | Wymaga najpierw dostarczenia pilota (PR-DOCS-02) i spełnienia S1-S10 z ADR-0013 | ADR-0013: "silence = NO-GO" | Po PR-DOCS-02 |

---

## Remaining Unknowns

| # | Unknown | Dotyczy | Dlaczego nie da się rozstrzygnąć w tym audycie | Kto rozstrzyga |
|---|---------|---------|-----------------------------------------------|-----------------|
| 1 | Czy `VITE_PUBLIC_SITE_URL` jest ustawione poprawnie w Vercel Dashboard (prod scope) | PR-INFRA-01 | Audytor nie ma dostępu do Vercel Dashboard — to jest secret/config poza repo | Robert |
| 2 | Czy PR-INFRA-01 (#689) zostanie zmergowany, zamknięty czy zmodyfikowany | PR-INFRA-01 | Decyzja biznesowa — PR jest open, CI green, ale Robert nie podjął akcji | Robert |
| 3 | Runtime weryfikacja ReadyDocuments z FF_MODE_B_DOCX_ENABLED=false | PR-DOCS-01 | Wymaga zalogowanego użytkownika — brak dostępu runtime w audycie read-only | Smoke test po deploy |
| 4 | Czy prod build PR-BE-LOW-01 przeszedł lokalnie (nie tylko w CI) | PR-BE-LOW-01 | PR body deklaruje `build:dev`; CI prod build = success, ale lokalna weryfikacja nieznana | CI evidence wystarczające |
| 5 | Aktualny stan branchy/PRs od czasu inventory PR-OPS-02 (2026-04-14 rano) | PR-OPS-02 | Snapshot starzeje się; nowe PRs mogły zostać utworzone/zmergowane od czasu inventory | Ponowny run `list-stale-branches.sh` |

---

## Evidence Log

- **Symptom:** Wymagany closure audit Pack 2 (5 targetów: PR-INFRA-01, PR-OPS-01, PR-OPS-02, PR-BE-LOW-01, PR-DOCS-01)
- **Dowód:** GitHub API (5 PR reads, CI checks, comments), pliki repo (14 plików przeczytanych), git log/show (5 commitów zweryfikowanych)
- **Zmiana:** Brak zmian implementacyjnych — tylko raport audytowy `docs/AUDIT_A4_PACK2_CLOSURE_2026-04-14.md`
- **Weryfikacja:** Audyt read-only; każdy status ma evidence z pliku/API
- **Rollback:** `git revert <commit-sha>` raportu audytowego

---

## Podsumowanie Werdyktów

| Target | Werdykt | Na main? |
|--------|---------|----------|
| PR-INFRA-01 | **OPEN** — CI green, czeka na merge | NIE |
| PR-OPS-01 | **PASS** | TAK (commit `b665a8b`) |
| PR-OPS-02 | **PASS** | TAK (commit `95b6b86`) |
| PR-BE-LOW-01 | **PASS** | TAK (commit `fd98459`) |
| PR-DOCS-01 | **CONDITIONAL PASS** | TAK (commit `06f84c2`) |

---

## Agent does / Robert does

### Agent zrobił:
- Przeczytał CLAUDE.md, rozłożył prompt na 24 atomowe wymagania
- Przeczytał 14 plików repo + 7 źródeł GitHub API
- Zbudował Closure Matrix, Open Issues, PR-DOCS-01 Conditional Matrix, Remaining Unknowns
- Zapisał raport do `docs/AUDIT_A4_PACK2_CLOSURE_2026-04-14.md`
- Commit + push na branch `claude/audit-closure-pack-ahmVb`

### Robert musi:
1. **PR-INFRA-01 (#689):** Zdecydować — merge lub close. CI jest green.
2. **PR-INFRA-01:** Zweryfikować `VITE_PUBLIC_SITE_URL=https://majsterai.com` w Vercel Dashboard → Settings → Environment Variables → Production scope
3. **PR-OPS-02:** Wykonać cleanup repo wg runbook (`docs/ops/REPO_HYGIENE_RUNBOOK.md`) — agent NIE wykonywał żadnych akcji destrukcyjnych
4. **PR-DOCS-01:** Zdecydować kiedy rozpocząć PR-DOCS-02 (pilot DOCX) i podjąć GO/NO-GO po pilocie
