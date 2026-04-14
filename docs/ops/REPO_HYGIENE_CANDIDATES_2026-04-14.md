# Repo Hygiene — Candidate Matrix
<!-- docs/ops/REPO_HYGIENE_CANDIDATES_2026-04-14.md -->
<!-- Data inventory: 2026-04-14 | Autor: Claude Code (PR-OPS-02) -->
<!-- AKCJE DESTRUKCYJNE: WYŁĄCZNIE przez Roberta po przeczytaniu RUNBOOK.md -->

## Inventory Totals (KROK 0 — Stan na 2026-04-14)

| Metryka | Liczba | Źródło |
|---------|--------|--------|
| Łączna liczba branchy zdalnych (GitHub) | **687** | GitHub API — list_branches (7 stron × 100) |
| Branch chroniony (`main`) | **1** | GitHub API — protected: true |
| Branch roboczy tej sesji | **1** | `claude/pr-ops-02-repo-hygiene-runbook-2Gh0N` |
| Branche `claude/` | **~590** | GitHub API |
| Branche `codex/` | **~65** | GitHub API |
| Branche `dependabot/` | **9** | GitHub API |
| Branche inne (`fix/`, `docs/`, `reset/`, `revert-`) | **7** | GitHub API |
| Branche `RobertB1978-patch-*` | **2** | GitHub API |
| **Łączna liczba PR-ów (wszystkie stany)** | **~690** | GitHub API (najwyższy nr: #690) |
| **Otwarte PR-y (open)** | **68** | GitHub API — list_pull_requests (state=open) |
| **Zamknięte/merged PR-y** | **~622** | 690 - 68 |
| PR-y nieaktywne > 30 dni | **~55** | Z 68 open — analiza updated_at |
| PR-y nieaktywne > 90 dni | **~45** | Z 68 open — analiza updated_at |
| PR-y nieaktywne > 180 dni (>6 mies.) | **~30** | Wszystkie PR z 2025-12 |

---

## Pliki / Źródła Przeczytane Jako Dowód

| Źródło | Co sprawdzono |
|--------|---------------|
| GitHub API `list_branches` (strony 1-7) | Pełna lista 687 branchy zdalnych |
| GitHub API `list_pull_requests` (state=all, top 100) | Ostatnie 100 PR-ów (PR#591–#690) |
| GitHub API `list_pull_requests` (state=open) | Wszystkie 68 otwartych PR-ów z datami |
| `git log --oneline -10 origin/main` | 10 ostatnich commitów na main |
| `git status` | Stan lokalnego working tree |
| `docs/ops/` (Glob) | Istniejące pliki ops (8 plików) |
| `docs/ops/REALITY_CHECK_RUNBOOK.md` (Read) | Istniejący runbook — wzorzec formatu |
| `scripts/` (ls) | Istniejące skrypty |

---

## KLASYFIKACJA — Grupy

### GRUPA A — Safe to Delete NOW (merged branches)

Branche gdzie odpowiedni PR jest **merged** do main.
GitHub przechowuje SHA → można zawsze odtworzyć przez "Restore branch".

**TOP 20 kandydatów — Najnowsze merged branche (do usunięcia w FAZIE 2):**

| Branch | PR# | Data Merge | Tytuł PR |
|--------|-----|-----------|----------|
| `claude/pr-ops-01-docs-cleanup-l2Jz4` | #690 | 2026-04-14 | docs(ops): clean stale hash references |
| `claude/pr-arch-02-public-offer-phase2-0Kgl9` | #688 | 2026-04-13 | refactor(public-offer): consolidate callers |
| `claude/pr-arch-01-public-offer-bxIEp` | #687 | 2026-04-13 | refactor(public-offer): canonical flow |
| `claude/pr-sec-01-harden-public-offer-ItF0m` | #686 | 2026-04-13 | fix(security): harden public offer |
| `claude/pr-supa-02-config-functions-ELW0a` | #685 | 2026-04-13 | fix(supabase): register edge functions |
| `claude/pr-supa-01-regenerate-types-T0Tcl` | #684 | 2026-04-13 | fix(types): sync Supabase types |
| `claude/document-operating-rules-adsLA` | #683 | 2026-04-13 | docs: Add global operating rules |
| `claude/visual-track-closure-nNcp4` | #682 | 2026-04-13 | docs: VT-CLOSE-03 visual workstream |
| `claude/final-deployment-audit-xK3vs` | #681 | 2026-04-13 | docs: visual deployment truth audit |
| `claude/vt-smoke-logged-in-test-WXJuZ` | #680 | 2026-04-13 | docs(qa): VT-SMOKE-02 logged-in test |
| `claude/social-preview-meta-hardening-TA0mo` | #679 | 2026-04-13 | Upgrade OG image to PNG format |
| `claude/f4-03-social-proof-placeholder` | #678 | 2026-04-13 | feat(landing): premium social proof |
| `claude/landing-video-demo-section-iuVXR` | #677 | 2026-04-13 | Redesign video demo placeholder |
| `claude/landing-screenshot-section-i71Lt` | #676 | 2026-04-13 | feat(landing): product screenshot |
| `claude/f4-00-asset-placeholder-foundation-8bkFc` | #675 | 2026-04-13 | Centralize landing page asset config |
| `claude/pr-f3-03-motion-icon-polish-NYdcb` | #674 | 2026-04-13 | feat(ui): premium motion and icon |
| `claude/pr-f3-02-social-proof-q6Vpq` | #673 | 2026-04-13 | feat(landing): premium social proof |
| `claude/landing-video-demo-xXo6e` | #672 | 2026-04-13 | feat(landing): premium product video |
| `claude/pr-f2-03-landing-depth-DWFRW` | #671 | 2026-04-13 | feat(ui): landing visual depth |
| `claude/pr-f2-02-secondary-accent-system` | #670 | 2026-04-12 | feat(ui): secondary accent color system |

**Szacowana łączna liczba branchy w grupie A: ~550+**
(Wszystkie branche powiązane z merged PR-ami — zdecydowana większość z 687)

**Procedura usunięcia (Faza 2):**
- GitHub UI: Pull Requests → filter "Merged" → każdy PR → "Delete branch"
- Czas: ~5-10 sekund na branch przez UI
- Rollback: "Restore branch" na zamkniętym PR

---

### GRUPA B — Safe to Close NOW (stale otwarte PR-y)

Otwarte PR-y starsze niż 60 dni, wyraźnie zastąpione późniejszą pracą.

**TOP 20 kandydatów do zamknięcia:**

| PR# | Dni otwarte | Branch | Tytuł | Powód zamknięcia |
|-----|-------------|--------|-------|-----------------|
| #31 | **~121** | `codex/implement-service-role-lockdown-and-auth-gate` | KROK 5 — Service Role Lockdown | Zastąpiony przez liczne późniejsze security PRs (merged) |
| #32 | **~121** | `codex/fix-ci-for-pr-#17` | Adjust CI lint handling | Zastąpiony przez nowe CI workflow |
| #33 | **~121** | `codex/fix-ci-blocking-errors-in-majster-ai-oferty` | Improve typings for finance and team | Typowania wielokrotnie aktualizowane od tamtej pory |
| #34 | **~121** | `codex/remove-test-job-from-ci/cd` | Remove test job from CI workflow | Zastąpiony — CI workflow był wielokrotnie refaktoryzowany |
| #35 | **~121** | `claude/majster-ai-full-audit-7hGHq` | fix: critical security audit Fix Pack Δ4 | Zastąpiony przez nowe audyty bezpieczeństwa 2026 |
| #36 | **~121** | `claude/fix-ci-installation-7miEb` | Fix CI installation issues | Zastąpiony — CI installation naprawione wielokrotnie od tamtej pory |
| #61 | **~118** | `claude/fix-production-blockers-UkTNu` | fix: production blockers | Blokery produkcyjne wielokrotnie naprawiane od Dec 2025 |
| #62 | **~118** | `claude/fix-production-blockers-DXfJb` | Fix production blockers for merge readiness | j.w. — dwa PR-y z tym samym celem |
| #65 | **~117** | `codex/fix-e2e-tests-in-pr-#63` | Add React Query devtools dependency | Zależność dodana inaczej później |
| #70 | **~115** | `codex/perform-non-functional-cleanup-and-guardrails` | chore: organize audit docs | Audit docs reorganizowane wielokrotnie od tamtej pory |
| #71 | **~115** | `codex/fix-e2e-tests-by-conditionally-loading-react-query-devtools` | fix(e2e): load devtools only in DEV | Zastąpiony |
| #72 | **~115** | `codex/fix-e2e-pipeline-hangs-in-ci` | ci(e2e): add timeouts and diagnostics | Zastąpiony — E2E CI było wielokrotnie refaktoryzowane |
| #73 | **~115** | `codex/fix-e2e-tests-to-reuse-existing-server` | fix(e2e): reuse existing server | j.w. |
| #74 | **~115** | `codex/improve-e2e-stability-and-diagnostics-in-ci` | Stabilize Playwright CI | j.w. |
| #75 | **~115** | `codex/conduct-full-application-audit-and-fix-issues` | Fix Pack: CI/Lint/Type/E2E | Zastąpiony przez późniejsze fix packs |
| #76 | **~114** | `codex/fix-unresolved-issues-from-previous-pr-audit` | Fix pack Δ2: stabilize E2E | j.w. |
| #77 | **~114** | `codex/achieve-deterministic-green-ci` | [CI-FIX] Absolute stabilization | Zastąpiony — CI stabilizowany wielokrotnie |
| #78 | **~114** | `codex/fix-eslint-error-for-explicit-any` | fix: type supabase mock | Zastąpiony |
| #79 | **~114** | `codex/fix-failing-e2e-tests-due-to-missing-devtools` | fix(e2e): add react-query devtools | Zastąpiony |
| #85 | **~113** | `codex/achieve-100%-ci-green-checks` | chore: harden audits | Zastąpiony — CI harden wielokrotnie od tamtej pory |

**Dodatkowe kandydaty grupy B (PRs #86-#94, #105, #113, #125, #126, #127, #128, #136, #152-#156, #193, #236, #243):**

| PR# | Dni otwarte | Powód zamknięcia |
|-----|-------------|-----------------|
| #86-#92 | ~113 | Seria CI fix PR-ów z Dec 2025 — wszystkie zastąpione |
| #94 | ~112 | "Unblock production" — produkcja wielokrotnie naprawiana od tamtej pory |
| #105 | ~110 | Fix pack delta1 Dec 2025 — zastąpiony przez późniejsze packs |
| #113 | ~106 | Audit Vercel production Dec 2025 — wielokrotnie audytowane od tamtej pory |
| #125 | ~74 | Security audit evidence Jan 2026 — nowszy PR #686 to zastąpił |
| #126 | ~73 | npm audit Jan 2026 — nowszy Dependabot PR to zastąpił |
| #127 | ~72 | Enterprise roadmap v1.0 — zastąpiony przez aktualne docs |
| #128 | ~72 | Audit trail offer approvals — sprawdzić czy merged inaczej |
| #136 | ~71 | E2E CI hardening — zastąpiony przez nowsze CI workflow |
| #152-#156 | ~67-68 | Deployment Truth PRs Feb 2026 — zastąpione przez #683+ |
| #193 | ~27 | Dependabot prod deps — patrz GRUPA D |
| #236 | ~54 | Final gaps 175qb — sprawdzić zawartość |
| #243 | ~52 | Landing sync — landing wielokrotnie aktualizowany od tamtej pory |

**Draft komentarz do zamknięcia (tekst angielski — standard repo):**

```
Closing this PR as it has been superseded by subsequent work merged
into main. The issues addressed here were resolved through later PRs.
No active review was ongoing. Thank you.

If this PR contained unique work not captured elsewhere, please
reopen with a description of what's missing.
```

---

### GRUPA C — Keep for Evidence / History

Branche i PR-y do zachowania jako historyczny zapis:

| Zasób | Typ | Powód zachowania |
|-------|-----|-----------------|
| `docs/evidence/screens/2026-02-17` | Branch | Archiwalny zapis screenshotów z audytu — przed usunięciem zachowaj pliki w docs/ |
| PR#125 docs: security audit evidence | PR | Historyczny log audytu bezpieczeństwa — zamknąć, ale zachować branch 90 dni |
| `fix/remove-sensitive-logging` | Branch | Może zawierać bezpieczeństwo-krytyczne zmiany — nie usuwać bez audytu zawartości |
| `fix/enable-pgcrypto-extension` | Branch | Baza danych — weryfikacja produkcji przed usunięciem |
| PR#127 enterprise roadmap v1.0 | PR | Roadmap dokument — sprawdzić czy zawartość jest w docs/ na main |
| `revert-2-claude/phase-2-stability-*` | Branch | Revert commit jako reference — zachować do Q3 2026 |

---

### GRUPA D — Manual Review Required

Branche i PR-y wymagające indywidualnej decyzji Roberta:

**Aktywne open PRs (< 30 dni, wysoki priorytet):**

| PR# | Data | Branch | Tytuł | Status / Decyzja |
|-----|------|--------|-------|-----------------|
| #689 | 2026-04-14 | `claude/pr-infra-01-canonical-og-sitemap-8fb5d` | fix(seo): align canonical, og:url | **AKTYWNY** — Robert decyduje czy merge |
| #650 | 2026-04-11 | `claude/review-finnse-function-yp9mH` | fix(finance): napraw błędy modułu | **AKTYWNY** — Robert decyduje czy merge |
| #639 | 2026-04-09 | `claude/p0-truth-gate-audit-8tStH` | chore: P0 Truth Gate audit | **AKTYWNY** — sitemap date bump |
| #627 | 2026-04-06 | `claude/mode-b-pr02-docx-pilot-HHW1Y` | feat(PR-02): Mode B DOCX pilot | **AKTYWNY** — duża funkcja Mode B |
| #608 | 2026-04-05 | `claude/basemap-runtime-diagnostics-ZxMxI` | feat: debug mapy | Diagnostics feature — merge lub close |

**Starsze open PRs — wymagają oceny (30-60 dni):**

| PR# | Data | Branch | Tytuł | Uwaga |
|-----|------|--------|-------|-------|
| #521 | 2026-03-28 | `claude/safe-error-diagnostics-KhY8p` | feat: safe error diagnostics PR-OBS-01 | Sprawdź czy zaimplementowane inaczej |
| #506 | 2026-03-26 | `claude/pdf-migration-finish-5YsM1` | feat(pdf-migration): finish PR 3+4+5 | PDF migration — sprawdź czy merged inaczej |
| #390 | 2026-03-11 | `claude/add-photo-upload-HkaLh` | feat: napraw upload zdjęć (PR-21) | Photo upload — sprawdź aktualny stan |
| #337 | 2026-03-08 | `claude/performance-diagnosis-D8NZY` | docs: performance diagnosis report | Docs PR — sprawdź czy zawarty w docs/ |
| #338 | 2026-03-22 | `dependabot/npm_and_yarn/development-dependencies-f84bf206f2` | Dependabot: dev deps | **Dependabot** — Robert decyduje |

**Dependabot PRs (wszystkie wymagają decyzji Roberta):**

| PR# | Data | Pakiet | Uwaga |
|-----|------|--------|-------|
| #338 | 2026-03-22 | dev-dependencies group | Sprawdź czy nowszy Dependabot PR nie zastąpił |
| #193 | 2026-03-18 | production-dependencies group | Prod deps — ważne |
| #112 | 2026-02-02 | react-day-picker 9.13.0 | Sprawdź aktualną wersję w package.json |
| #56 | 2026-01-19 | date-fns 4.1.0 | Sprawdź aktualną wersję |
| #58 | 2026-01-19 | react @types/react | Sprawdź aktualną wersję |
| #49 | 2026-01-19 | romeovs/lcov-reporter-action 0.4.0 | GitHub Actions |
| #50 | 2026-01-19 | codecov/codecov-action 5 | GitHub Actions |
| #51 | 2026-01-19 | actions/upload-artifact 6 | GitHub Actions |
| #52 | 2026-01-19 | actions/setup-node 6 | GitHub Actions |
| #53 | 2026-01-19 | github/codeql-action 4 | GitHub Actions |

---

### GRUPA E — High Risk / Do Not Touch

| Zasób | Typ | Ryzyko | Wymagana akcja przed dotknięciem |
|-------|-----|--------|--------------------------------|
| `main` | Branch | **PRODUKCJA** | NIE DOTYKAĆ |
| `fix/remove-sensitive-logging` | Branch | Bezpieczeństwo — mogą być wrażliwe dane w historii | `git log` + audyt manualny |
| `fix/enable-pgcrypto-extension` | Branch | Baza danych — migracja crypto | Weryfikacja czy pgcrypto aktywne na produkcji |
| `reset/ci-clean` | Branch | CI/CD — może zawierać zmiany workflow | `git diff main..origin/reset/ci-clean` |
| PR#31 KROK 5 Service Role Lockdown | PR | Auth/Security — lockdown serwisowy | Sprawdź czy wszystkie zmiany są na main |
| PR#95 fix(security): remove token logging | PR | Security | Sprawdź czy zmiany są na main przez #686 |
| `docs/evidence/screens/2026-02-17` | Branch | Evidence preservation | Zachowaj pliki przed usunięciem brancha |

---

## BATCH PLAN (Plan Wykonania)

### BATCH 1 — Zamknięcie oczywistych stale PRs (Faza 1)

**Cel:** Zamknąć ~30 PR-ów z Dec 2025 (PR#31-#94)

```
Sesja 1 (max 20 PR-ów):
  Zamknij: PR#31, #32, #33, #34, #36, #61, #62, #65, #70, #71,
           #72, #73, #74, #75, #76, #77, #78, #79, #85, #86

Sesja 2 (max 10 PR-ów):
  Zamknij: PR#87, #88, #89, #90, #91, #92, #94, #105, #113, #35

Sesja 3 (Dependabot — decyzja Roberta):
  Review: PR#49, #50, #51, #52, #53, #56, #58 (GitHub Actions Dependabot)
  Review: PR#112, #193, #338 (npm Dependabot)
```

### BATCH 2 — Usunięcie merged branches (Faza 2)

```
Sesja 1 (20 branchy):
  Merged PR#670-#690 → usuń odpowiednie branche
  (chronologicznie, od najnowszych)

Sesja 2 (20 branchy):
  Merged PR#640-#669

Sesja 3 (20 branchy):
  Merged PR#610-#639

[... kontynuuj w batchach po 20 ...]
```

### BATCH 3 — Manual Review (Faza 3-4)

```
Robert osobiście:
  1. Sprawdza PR#689, #650, #639, #627, #608 → decyduje merge/close
  2. Sprawdza Dependabot PRs → merge lub dismiss
  3. Sprawdza branche GRUPY E → decyduje czy safe do usunięcia
```

---

## Potwierdzenie: Żadna Destrukcyjna Akcja Nie Została Wykonana

```
✅ Inventory zostało zebrane wyłącznie read-only
✅ Żaden branch nie został usunięty
✅ Żaden PR nie został zamknięty
✅ Żaden PR nie został zmodyfikowany
✅ Żadna operacja git push --delete nie została wykonana
✅ Żadna operacja git merge/rebase nie została wykonana
✅ Jedyne zmiany: docs/ops/ i scripts/ops/ (nowe pliki dokumentacyjne)
```

---

## Evidence Log (Obowiązkowy)

| Pole | Wartość |
|------|---------|
| **Symptom** | Repo ma bałagan operacyjny: 687 branchy, 68 open PRs (najstarszy Dec 2025) |
| **Dowód bałaganu** | GitHub API: branch pages 1-7 = 687 branchy; open PRs = 68; najstarszy open PR #31 z 2025-12-13 (>120 dni) |
| **Jakie źródła przeczytano** | GitHub API list_branches (7 stron), list_pull_requests (state=all top 100), list_pull_requests (state=open 68 szt.), git log, docs/ops/REALITY_CHECK_RUNBOOK.md, Glob docs/** |
| **Klasyfikacja** | A: ~550 merged branches safe to delete; B: ~45 stale PRs safe to close; C: 6 evidence/risk items to keep; D: 14 manual review; E: 7 high-risk |
| **Zmiana** | Tylko nowe pliki: docs/ops/REPO_HYGIENE_RUNBOOK.md, docs/ops/REPO_HYGIENE_CANDIDATES_2026-04-14.md, scripts/ops/list-stale-branches.sh |
| **Co wolno usunąć teraz** | NIC — decyzja destrukcyjna należy do Roberta |
| **Co wymaga ręcznego review** | 14 pozycji grupy D + 7 pozycji grupy E (patrz wyżej) |
| **Rollback** | Nie dotyczy — żadnych destrukcyjnych zmian nie wykonano |
| **Branch / PR** | Branch: `claude/pr-ops-02-repo-hygiene-runbook-2Gh0N` / PR: do stworzenia |
