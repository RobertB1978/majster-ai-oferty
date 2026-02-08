# Majster.AI — ROADMAP ENTERPRISE v4 (SOURCE OF TRUTH)

**Status:** ACTIVE — Stage: MVP ENGINEERING COMPLETE (Pending Owner Verification)
**Właściciel decyzji:** Product Owner + Tech Lead
**Zakres dokumentu:** plan wdrożeniowy i dyscyplina PR dla repozytorium
**Ostatnia weryfikacja:** 2026-02-08 (MVP completion audit)

---

## 0) Inwentarz repo (snapshot — verified 2026-02-07)
1. Framework: **Vite 7.3.1 + React 18.3 + TypeScript 5.8** (`vite.config.ts`, `package.json` scripts `vite`).
2. Nie jest to Next.js (brak `next.config.*`, brak katalogu root `app/` dla Next).
3. Routing jest po stronie klienta przez **react-router-dom** (`BrowserRouter`, `Routes`, `Route`).
4. Publiczny route oferty: `/offer/:token` w `src/App.tsx`.
5. Rewrite pod SPA jest w `vercel.json` (`/(.*) -> /index.html`).
6. `vercel.json` ma globalne CSP z `frame-ancestors 'none'` oraz osobny blok nagłówków dla `/offer/(.*)`.
7. W repo istnieją migracje Supabase w `supabase/migrations` (22 pliki).
8. Lista Edge Functions (`supabase/functions`): `_shared`, `ai-chat-agent`, `ai-quote-suggestions`, `analyze-photo`, `approve-offer`, `cleanup-expired-data`, `create-checkout-session`, `csp-report`, `delete-user-account`, `finance-ai-analysis`, `healthcheck`, `ocr-invoice`, `public-api`, `send-expiring-offer-reminders`, `send-offer-email`, `stripe-webhook`, `voice-quote-processor`.
9. **Vitest** v4.0.16, **ESLint** v9.39.2, **TypeScript** v5.8.3.
10. `package.json` engines: `>=20` (accepts Node 20.x and 22.x LTS).
11. All 16 Edge Functions configured in `config.toml` with explicit `verify_jwt` values.
12. Test libraries correctly in `devDependencies`.

---

## 1) Dla laika (bez żargonu)
Ten dokument jest od teraz **jedyną mapą pracy**: co robimy, w jakiej kolejności i po czym poznać, że etap jest skończony.
Najpierw porządkujemy „prawdę wdrożeniową" (Vercel + Supabase), żeby było jasne co naprawdę działa w produkcji, a co tylko lokalnie.
Dopiero potem robimy małe, bezpieczne PR-y: każdy PR ma jeden cel, jasne testy, plan wycofania i brak „dodatkowych poprawek przy okazji".

> **UWAGA:** Plik `docs/ROADMAP.md` jest przestarzały i zastąpiony przez ten dokument. Patrz ADR-0000.

---

## 2) Najważniejsze ryzyka (z audytu — updated 2026-02-07)

### Aktywne ryzyka:
1. **Brak jednej prawdy wdrożeniowej Vercel** (co jest ustawione vs co tylko opisane). ⛔ BLOCKER — wymaga dowodów od Ownera
2. **Brak jednej prawdy migracji Supabase** (co jest faktycznie zastosowane na środowiskach). ⛔ BLOCKER — wymaga dowodów od Ownera
3. **Ryzyko merge/push na `main` bez pełnego review i green checks**. ⏳ Mitigation documented in `docs/PR03_BRANCH_PROTECTION.md` — awaiting owner to apply settings.
4. **Polityka CSP:** globalne `frame-ancestors 'none'` może być sprzeczne z potrzebą osadzania widoku oferty.
5. **ESLint warnings** — 17 warnings (0 errors) po PR#05. Wszystkie to `react-refresh/only-export-components` (kosmetyczne, oczekiwane w shadcn/ui).

### Ryzyka rozwiązane (od v3):
- ~~`config.toml` — 6/16 Edge Functions brak konfiguracji~~ → NAPRAWIONE w commit `0770247`
- ~~Test libraries w `dependencies` zamiast `devDependencies`~~ → NAPRAWIONE w commit `0770247`
- ~~Engine constraint Node 20.x zbyt restrykcyjny~~ → NAPRAWIONE: `>=20` akceptuje Node 22 LTS
- ~~Hardcoded `ACTION_LABELS`~~ → NAPRAWIONE w commit `e38f90a` (i18n keys)

---

## 3) Roadmapa realizacji (PR#00–PR#05)

### PR#00 — Instalacja SOURCE OF TRUTH (docs-only) — ✅ DONE
- **Cel:** ustanowienie dokumentów nadrzędnych + szablonu PR + guardrails pracy.
- **Scope fence:** tylko `docs/**`, `docs/ADR/**`, `.github/**`.
- **DoD:** dokumenty utworzone, spójne i gotowe do użycia operacyjnego.
- **Verified:** 2026-02-07. Commit `6d0f2bf`. All 7 docs present and internally consistent.

### PR#01 — Deployment Truth (Vercel + Supabase) — 🚫 BLOCKED (awaiting owner evidence)
- **Cel:** potwierdzona „prawda" konfiguracji i deploy flow.
- **Zakres:** dokumentacja + dowody; bez zmian produktu.
- **Ryzyka główne:** env drift, rewrites/headers drift, brak dowodów build logs.
- **Repo-side work:** DONE — DEPLOYMENT_TRUTH.md §1.1 and §2.1 all checked.
- **Dashboard evidence:** NOT DONE — 0/11 mandatory items have evidence. P0 = UNRESOLVED.
- **Blocker:** Requires Product Owner to provide 11 screenshots (5 Vercel + 6 Supabase).
- **Pass/fail criteria:** `docs/PROD_VERIFICATION.md` — ALL 11 mandatory items must PASS.
- **Owner checklist:** `docs/P0_EVIDENCE_REQUEST.md` — step-by-step screenshot guide.
- **Next action:** Owner collects screenshots → evidence into `P0_EVIDENCE_PACK.md` → evaluate PASS/FAIL → close PR#01.

### PR#02 — (consolidated into PR#01)

### PR#01.5 — Config & Tooling Fixes — ✅ DONE
- **Cel:** naprawić luki konfiguracyjne znalezione w audycie.
- **Zakres:** `supabase/config.toml`, `package.json` (devDeps, engines).
- **Items (all completed):**
  1. ✅ Add missing 6 Edge Functions to `config.toml` — commit `0770247`
  2. ✅ Test libraries in `devDependencies` — verified in current `package.json`
  3. ✅ Engine constraint widened to `>=20` — verified in current `package.json`
- **Verified:** 2026-02-07 by independent audit on HEAD `143ba55`.

### PR#03 — Governance PR discipline — ⏳ DOCS_READY (awaiting owner to apply in GitHub UI)
- **Cel:** egzekwowanie review/green checks/no-direct-main.
- **Zakres:** proces + template + branch protection (operacyjnie).
- **Deliverables:**
  - ✅ `docs/PR03_BRANCH_PROTECTION.md` — exact click-path, required toggles, verification steps
  - ✅ Owner checklist included in document §4
  - 🔲 Owner applies settings in GitHub UI (Settings → Branches)
  - 🔲 Owner runs verification tests from §5
- **Ryzyka główne:** omijanie procesu w pilnych poprawkach (bypass procedure documented in §6).
- **Dependencies:** None — can proceed independently of PR#01.

### PR#04 — Techniczny cleanup ryzyk z audytu — ⏳ PARTIALLY DONE
- **Cel:** zaplanowany backlog napraw (CSP, lint warnings).
- **Zakres:** atomowe PR-y produktowe.
- **DONE items:**
  - ✅ ~~ACTION_LABELS i18n~~ → commit `e38f90a`
  - ✅ ~~react-hooks/exhaustive-deps warnings~~ → PR#05
  - ✅ CSP `frame-ancestors` documented as ADR-0002 — awaiting owner decision
- **Remaining items:**
  - 17 `react-refresh/only-export-components` warnings (cosmetic, low priority, shadcn/ui patterns)
- **Dependencies:** CSP code change requires owner input (ADR-0002). Lint warnings are cosmetic.

### PR#05 (NEW) — ESLint warnings fix — ✅ DONE
- **Cel:** naprawić `react-hooks/exhaustive-deps` warnings w kodzie produkcyjnym.
- **Zakres:** 8 plików z warningami — 2 fixes + 6 documented suppressions.
- **Files:** `ProjectTimeline.tsx`, `BiometricSettings.tsx`, `VoiceQuoteCreator.tsx`, `useTheme.ts`, `Dashboard.tsx`, `NewProject.tsx`, `OfferApproval.tsx`, `PdfGenerator.tsx`
- **Risk:** LOW — each suppression includes documented reasoning.

### PR#06 (NEW) — MVP Completion — ✅ DONE
- **Cel:** Bootstrap semantic versioning, create CHANGELOG, document CSP as ADR, finalize MVP status.
- **Zakres:** `package.json` (version), `CHANGELOG.md`, `docs/ADR/ADR-0002-csp-frame-ancestors.md`, roadmap update.
- **Items:**
  - ✅ Version bootstrapped: `0.0.0` → `0.1.0-alpha`
  - ✅ CHANGELOG.md created with full feature inventory
  - ✅ ADR-0002 created: CSP frame-ancestors inconsistency documented
  - ✅ Roadmap updated to reflect MVP engineering-complete state
  - ✅ MVP Completion Report created

---

## 4) Verified Quality Gates (2026-02-08, MVP completion)

| Command | Result | Detail |
|---------|--------|--------|
| `tsc --noEmit` | ✅ PASS | 0 errors |
| `npm run lint` | ✅ PASS | 0 errors, 17 warnings (all cosmetic react-refresh) |
| `npm test` | ✅ PASS | 20 files, 281 tests, all green |
| `npm run build` | ✅ PASS | Built in 28.59s |

---

## 5) Definition of Done (globalny)
1. 1 objaw → 1 minimal fix → 1 PR.
2. Te same komendy weryfikacji w każdym PR:
   - `npm run lint`
   - `npm run test`
   - `npm run build`
   - `npm run type-check`
3. W PR musi być: Scope Fence, DoD, testy, rollback, ryzyka i dowody.
4. Brak merge jeśli checks != green.
5. Brak merge bez review.

---

## 6) Plan PR (tabela — updated 2026-02-07)
| PR | Cel | Status | Scope fence | DoD | Blocker |
|---|---|---|---|---|---|
| PR#00 | Zainstalować SOURCE OF TRUTH | ✅ DONE | docs/.github/ADR only | komplet dokumentów | — |
| PR#01 | Ustalić prawdę wdrożeniową | 🚫 BLOCKED | docs + dowody, bez runtime zmian | 11/11 mandatory PASS (`PROD_VERIFICATION.md`) | Owner: 11 screenshots (see `P0_EVIDENCE_REQUEST.md`) |
| PR#01.5 | Config & tooling fixes | ✅ DONE | config.toml, package.json | config complete, deps correct | — |
| PR#03 | Wymusić dyscyplinę PR/merge | ⏳ DOCS_READY | docs/ | no direct main, review required | Owner applies in GitHub UI |
| PR#04 | Domknąć ryzyka audytowe | ⏳ PARTIAL | atomowe zmiany produktowe | każde ryzyko osobny mini-PR | CSP: owner input (ADR-0002) |
| PR#05 | Fix ESLint exhaustive-deps | ✅ DONE | 8 files, lint only | warnings reduced | — |
| PR#06 | MVP Completion | ✅ DONE | version, CHANGELOG, ADR, docs | MVP engineering-complete | — |

### Execution Order (final):
1. ~~PR#00~~ ✅
2. ~~PR#01.5~~ ✅
3. ~~PR#05~~ ✅
4. ~~PR#06~~ ✅ — MVP Completion (version, CHANGELOG, ADR-0002, docs)
5. **PR#03** ⏳ DOCS_READY — docs complete, awaiting owner to apply branch protection in GitHub UI
6. **When owner provides evidence:** PR#01 → close
7. **After owner CSP decision:** PR#04 — remaining cleanup (ADR-0002)

### All engineering work is COMPLETE. Remaining items require owner action:
- **PR#03** — Owner applies branch protection in GitHub UI (5 min)
- **PR#01** — Owner provides 11 deployment evidence screenshots (10-15 min)
- **PR#04** — Owner makes CSP business decision per ADR-0002

---

## 7) Stage Assessment (2026-02-07)

### Current Stage: **MVP Engineering Complete** (pending owner verification)

**What this means:**
- ✅ Code compiles, all tests pass (281/281), build succeeds
- ✅ Infrastructure exists (CI/CD, monitoring, security headers, RLS)
- ✅ Feature set is comprehensive (auth, quotes, offers, PDF, i18n, admin, calendar, marketplace)
- ✅ Semantic versioning established (`0.1.0-alpha`)
- ✅ CHANGELOG created with full feature inventory
- ✅ CSP inconsistency documented as ADR-0002
- ✅ All engineering-executable work is DONE
- ❌ No verified production deployment evidence (owner action)
- ❌ Governance not enforced — branch protection not applied (owner action)
- ❌ CSP business decision pending (owner action)

**What "MVP Engineering Complete" means:**
- All code, tests, configuration, and documentation that engineering can deliver — is delivered
- The ONLY remaining items require Product Owner action (screenshots, GitHub settings, business decision)
- Once owner completes their checklist, the project can honestly be labeled "Ready for Beta"

### Path to Beta (all owner actions):
1. Owner provides deployment evidence (PR#01) → confirms real production state
2. Governance enforced (PR#03) → protects main branch
3. Owner decides on CSP frame-ancestors (ADR-0002) → resolves last technical risk

### Path to Production (v1.0):
1. All Beta prerequisites met
2. CSP policy resolved for offer embedding
3. Real user testing completed
4. Custom domain configured
5. Backup and monitoring verified

---

## Related
- ADR: `docs/ADR/ADR-0000-source-of-truth.md`
- ADR: `docs/ADR/ADR-0001-current-stack-fact.md`
- ADR: `docs/ADR/ADR-0002-csp-frame-ancestors.md` — CSP frame-ancestors decision (PENDING)
- Traceability: `docs/TRACEABILITY_MATRIX.md`
- PR Playbook: `docs/PR_PLAYBOOK.md`
- Deployment Truth: `docs/DEPLOYMENT_TRUTH.md`
- **Production Verification (PR#01):** `docs/PROD_VERIFICATION.md` — pass/fail criteria (11 mandatory items)
- **Evidence Request (PR#01):** `docs/P0_EVIDENCE_REQUEST.md` — owner screenshot guide
- **Evidence Pack (PR#01):** `docs/P0_EVIDENCE_PACK.md` — template for pasting evidence
- Branch Protection: `docs/PR03_BRANCH_PROTECTION.md`
- Stage Assessment: `docs/STAGE_ASSESSMENT_2026-02-07.md`
- **MVP Completion:** `docs/MVP_COMPLETION_REPORT.md`
- **Changelog:** `CHANGELOG.md`
- **Superseded:** `docs/ROADMAP.md` (v1, Feb 3 — replaced by this document)
