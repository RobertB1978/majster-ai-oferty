# Majster.AI — ROADMAP ENTERPRISE v4 (SOURCE OF TRUTH)

**Status:** ACTIVE — Stage: Late Alpha (Code Solid, Deployment Unverified)
**Właściciel decyzji:** Product Owner + Tech Lead
**Zakres dokumentu:** plan wdrożeniowy i dyscyplina PR dla repozytorium
**Ostatnia weryfikacja:** 2026-02-07 (independent audit on HEAD `143ba55`)

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
3. **Ryzyko merge/push na `main` bez pełnego review i green checks**.
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

### PR#01 — Deployment Truth (Vercel + Supabase) — ⏳ DOCS_READY (blocked on owner)
- **Cel:** potwierdzona „prawda" konfiguracji i deploy flow.
- **Zakres:** dokumentacja + dowody; bez zmian produktu.
- **Ryzyka główne:** env drift, rewrites/headers drift, brak dowodów build logs.
- **Repo-side work:** DONE — DEPLOYMENT_TRUTH.md §1.1 and §2.1 all checked.
- **Dashboard evidence:** NOT DONE — §1.2 and §2.2 all unchecked. P0 = UNRESOLVED.
- **Blocker:** Requires Product Owner to provide Vercel and Supabase dashboard screenshots.
- **Next action:** Owner provides evidence → mark PASS/FAIL → close PR#01.

### PR#02 — (consolidated into PR#01)

### PR#01.5 — Config & Tooling Fixes — ✅ DONE
- **Cel:** naprawić luki konfiguracyjne znalezione w audycie.
- **Zakres:** `supabase/config.toml`, `package.json` (devDeps, engines).
- **Items (all completed):**
  1. ✅ Add missing 6 Edge Functions to `config.toml` — commit `0770247`
  2. ✅ Test libraries in `devDependencies` — verified in current `package.json`
  3. ✅ Engine constraint widened to `>=20` — verified in current `package.json`
- **Verified:** 2026-02-07 by independent audit on HEAD `143ba55`.

### PR#03 — Governance PR discipline — 🔲 NOT STARTED
- **Cel:** egzekwowanie review/green checks/no-direct-main.
- **Zakres:** proces + template + branch protection (operacyjnie).
- **Ryzyka główne:** omijanie procesu w pilnych poprawkach.
- **Dependencies:** None — can proceed independently of PR#01.

### PR#04 — Techniczny cleanup ryzyk z audytu — 🔲 NOT STARTED (partially unblocked)
- **Cel:** zaplanowany backlog napraw (CSP, lint warnings).
- **Zakres:** atomowe PR-y produktowe.
- **Remaining items:**
  - CSP `frame-ancestors` policy review (requires business decision)
  - 18 `react-refresh/only-export-components` warnings (cosmetic, low priority)
- **Previously planned items now DONE:**
  - ~~ACTION_LABELS i18n~~ → commit `e38f90a`
  - ~~react-hooks/exhaustive-deps warnings~~ → PR#05
- **Dependencies:** CSP change requires owner input. Lint warnings are independent.

### PR#05 (NEW) — ESLint warnings fix — ✅ DONE (this session)
- **Cel:** naprawić `react-hooks/exhaustive-deps` warnings w kodzie produkcyjnym.
- **Zakres:** 8 plików z warningami — 2 fixes + 6 documented suppressions.
- **Files:** `ProjectTimeline.tsx`, `BiometricSettings.tsx`, `VoiceQuoteCreator.tsx`, `useTheme.ts`, `Dashboard.tsx`, `NewProject.tsx`, `OfferApproval.tsx`, `PdfGenerator.tsx`
- **Risk:** LOW — each suppression includes documented reasoning.

---

## 4) Verified Quality Gates (2026-02-07, independent)

| Command | Result | Detail |
|---------|--------|--------|
| `npm run type-check` | ✅ PASS | 0 errors |
| `npm run lint` | ✅ PASS | 0 errors, 17 warnings (all cosmetic react-refresh) |
| `npm run test` | ✅ PASS | 20 files, 281 tests, all green |
| `npm run build` | ✅ PASS | Built in 31.06s |

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
| PR#01 | Ustalić prawdę wdrożeniową | ⏳ DOCS_READY | docs + dowody, bez runtime zmian | PASS/FAIL + blockers | Owner dashboard evidence |
| PR#01.5 | Config & tooling fixes | ✅ DONE | config.toml, package.json | config complete, deps correct | — |
| PR#03 | Wymusić dyscyplinę PR/merge | 🔲 TODO | .github + docs | no direct main, review required | — |
| PR#04 | Domknąć ryzyka audytowe | 🔲 TODO (partially done) | atomowe zmiany produktowe | każde ryzyko osobny mini-PR | CSP: owner input |
| PR#05 | Fix ESLint exhaustive-deps | ✅ DONE | 8 files, lint only | warnings reduced | — |

### Execution Order (current):
1. ~~PR#00~~ ✅
2. ~~PR#01.5~~ ✅
3. ~~PR#05~~ ✅ (this session)
4. **Next (no blocker):** PR#03 — governance enforcement
5. **When owner provides evidence:** PR#01 → close
6. **After PR#01 + owner CSP decision:** PR#04 — remaining cleanup

### What is NOT blocked and can proceed NOW:
- PR#03 (governance) — process + templates, no code changes
- i18n remaining coverage (if desired) — PR-4B from ROADMAP.md scope

### What IS blocked:
- PR#01 — waiting on owner for Vercel/Supabase dashboard evidence
- PR#04 CSP item — requires business decision on `frame-ancestors`

---

## 7) Stage Assessment (2026-02-07)

### Current Stage: **Late Alpha**

**What this means:**
- Code compiles, all tests pass, build succeeds — the codebase is solid
- Infrastructure exists (CI/CD, monitoring, security headers, RLS)
- Feature set is comprehensive (auth, quotes, offers, PDF, i18n, admin, calendar, marketplace)
- BUT: no verified production deployment evidence
- BUT: no semantic versioning (still v0.0.0)
- BUT: no CHANGELOG or release process
- BUT: governance not enforced (branch protection)

**What "Late Alpha" does NOT mean:**
- It does NOT mean the code is bad — code quality is high
- It does NOT mean features are missing — the feature set is complete for MVP
- It DOES mean the project needs deployment verification and release process before calling it "production ready"

### Path to Beta:
1. Owner provides deployment evidence (PR#01) → confirms real production state
2. Governance enforced (PR#03) → protects main branch
3. Version bumped to 0.1.0 → semantic versioning begins
4. CHANGELOG created → track releases

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
- Traceability: `docs/TRACEABILITY_MATRIX.md`
- PR Playbook: `docs/PR_PLAYBOOK.md`
- Deployment Truth: `docs/DEPLOYMENT_TRUTH.md`
- Stage Assessment: `docs/STAGE_ASSESSMENT_2026-02-07.md`
- **Superseded:** `docs/ROADMAP.md` (v1, Feb 3 — replaced by this document)
