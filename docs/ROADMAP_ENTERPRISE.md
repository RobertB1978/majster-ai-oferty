# Majster.AI — ROADMAP ENTERPRISE v3 (SOURCE OF TRUTH)

**Status:** ACTIVE — Stage: Foundation Ready, Blocked on External Evidence
**Właściciel decyzji:** Product Owner + Tech Lead
**Zakres dokumentu:** plan wdrożeniowy i dyscyplina PR dla repozytorium
**Ostatnia weryfikacja:** 2026-02-07 (automated audit on HEAD `6d0f2bf`)

---

## 0) Inwentarz repo (snapshot — verified 2026-02-07)
1. Framework: **Vite + React + TypeScript** (`vite.config.ts`, `package.json` scripts `vite`).
2. Nie jest to Next.js (brak `next.config.*`, brak katalogu root `app/` dla Next).
3. Routing jest po stronie klienta przez **react-router-dom** (`BrowserRouter`, `Routes`, `Route`).
4. Publiczny route oferty: `/offer/:token` w `src/App.tsx`.
5. Rewrite pod SPA jest w `vercel.json` (`/(.*) -> /index.html`).
6. `vercel.json` ma globalne CSP z `frame-ancestors 'none'` oraz osobny blok nagłówków dla `/offer/(.*)`.
7. W repo istnieją migracje Supabase w `supabase/migrations` (22 pliki).
8. Lista Edge Functions (`supabase/functions`): `_shared`, `ai-chat-agent`, `ai-quote-suggestions`, `analyze-photo`, `approve-offer`, `cleanup-expired-data`, `create-checkout-session`, `csp-report`, `delete-user-account`, `finance-ai-analysis`, `healthcheck`, `ocr-invoice`, `public-api`, `send-expiring-offer-reminders`, `send-offer-email`, `stripe-webhook`, `voice-quote-processor`.
9. **Vite** v7.3.1, **Vitest** v4.0.16, **ESLint** v9, **TypeScript** v5.8.
10. `package.json` engines: Node 20.x, npm 10.x (strict — blocks install on Node 22.x without `--force`).

---

## 1) Dla laika (bez żargonu)
Ten dokument jest od teraz **jedyną mapą pracy**: co robimy, w jakiej kolejności i po czym poznać, że etap jest skończony.
Najpierw porządkujemy „prawdę wdrożeniową" (Vercel + Supabase), żeby było jasne co naprawdę działa w produkcji, a co tylko lokalnie.
Dopiero potem robimy małe, bezpieczne PR-y: każdy PR ma jeden cel, jasne testy, plan wycofania i brak „dodatkowych poprawek przy okazji".

---

## 2) Najważniejsze ryzyka (z audytu — updated 2026-02-07)
1. **Brak jednej prawdy wdrożeniowej Vercel** (co jest ustawione vs co tylko opisane). ⛔ BLOCKER
2. **Brak jednej prawdy migracji Supabase** (co jest faktycznie zastosowane na środowiskach). ⛔ BLOCKER
3. **Ryzyko merge/push na `main` bez pełnego review i green checks**.
4. **Hardcoded `ACTION_LABELS` / i18n dług techniczny**.
5. **Polityka CSP:** globalne `frame-ancestors 'none'` może być sprzeczne z potrzebą osadzania widoku oferty.
6. **ESLint warnings** — 25 warnings (0 errors) utrzymują się (nie blokują builda, ale zwiększają ryzyko regresji).
7. **NEW: `config.toml` — 6/16 Edge Functions brak jawnej konfiguracji `verify_jwt`** — w tym `healthcheck` i `stripe-webhook`, które powinny mieć `verify_jwt = false`.
8. **NEW: Test libraries (vitest, jsdom, @testing-library/*) w `dependencies` zamiast `devDependencies`** — zwiększa rozmiar produkcyjnej paczki.
9. **NEW: Engine constraint Node 20.x może być zbyt restrykcyjny** — Node 22 jest LTS od 2024-10, a `npm ci` odmawia instalacji.

---

## 3) Roadmapa realizacji (PR#00–PR#04 + nowe)

### PR#00 — Instalacja SOURCE OF TRUTH (docs-only) — ✅ DONE
- **Cel:** ustanowienie dokumentów nadrzędnych + szablonu PR + guardrails pracy.
- **Scope fence:** tylko `docs/**`, `docs/ADR/**`, `.github/**`.
- **DoD:** dokumenty utworzone, spójne i gotowe do użycia operacyjnego.
- **Verified:** 2026-02-07. Commit `6d0f2bf`. All 7 docs present and internally consistent.

### PR#01 — Deployment Truth (Vercel + Supabase) — ⏳ DOCS_READY (blocked on owner)
- **Cel:** potwierdzona „prawda" konfiguracji i deploy flow.
- **Zakres:** dokumentacja + dowody; bez zmian produktu.
- **Ryzyka główne:** env drift, rewrites/headers drift, brak dowodów build logs.
- **Repo-side work:** DONE — DEPLOYMENT_TRUTH.md §1.1 and §2.1 all checked, verify scripts in `scripts/verify/`.
- **Dashboard evidence:** NOT DONE — DEPLOYMENT_TRUTH.md §1.2 and §2.2 all unchecked. P0 = UNRESOLVED.
- **Blocker:** Requires Product Owner to provide Vercel and Supabase dashboard screenshots per `docs/P0_EVIDENCE_REQUEST.md`.
- **Next action:** Owner provides evidence → fill in P0_EVIDENCE_PACK.md → mark PASS/FAIL → close PR#01.

### PR#02 — (consolidated into PR#01)

### PR#01.5 (NEW) — Config & Tooling Fixes
- **Cel:** naprawić luki konfiguracyjne znalezione w audycie 2026-02-07.
- **Zakres:** `supabase/config.toml`, `package.json` (devDeps, engines).
- **Items:**
  1. Add missing 6 Edge Functions to `config.toml` with correct `verify_jwt` values.
  2. Move test libraries from `dependencies` to `devDependencies`.
  3. Evaluate widening engine constraint to `>=20` to accept Node 22 LTS.
- **Ryzyka główne:** config.toml change affects deploy behavior; engine change affects CI.
- **Dependencies:** None — can proceed independently of PR#01.

### PR#03 — Governance PR discipline — 🔲 NOT STARTED
- **Cel:** egzekwowanie review/green checks/no-direct-main.
- **Zakres:** proces + template + branch protection (operacyjnie).
- **Ryzyka główne:** omijanie procesu w pilnych poprawkach.
- **Dependencies:** None — can proceed independently of PR#01.

### PR#04 — Techniczny cleanup ryzyk z audytu — 🔲 NOT STARTED
- **Cel:** zaplanowany backlog napraw (ACTION_LABELS, CSP, lint warnings).
- **Zakres:** atomowe PR-y produktowe po zatwierdzeniu prawdy wdrożeniowej.
- **Ryzyka główne:** scope creep i łączenie wielu fixów naraz.
- **Dependencies:** PR#01 (deployment truth) should be PASS before production code changes.

---

## 4) Verified Quality Gates (2026-02-07)

| Command | Result | Detail |
|---------|--------|--------|
| `npm run type-check` | ✅ PASS | 0 errors |
| `npm run lint` | ✅ PASS | 0 errors, 25 warnings |
| `npm run test` | ✅ PASS | 20 files, 281 tests, all green |
| `npm run build` | ✅ PASS | Built in 30.34s |

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
| PR#01.5 | Config & tooling fixes | 🔲 TODO | config.toml, package.json | config complete, deps correct | — |
| PR#03 | Wymusić dyscyplinę PR/merge | 🔲 TODO | .github + docs | no direct main, review required | — |
| PR#04 | Domknąć ryzyka audytowe | 🔲 TODO | atomowe zmiany produktowe | każde ryzyko osobny mini-PR | PR#01 PASS |

### Execution Order (recommended):
1. **Now:** This status update PR (docs-only)
2. **Next (parallel track A):** PR#01.5 — config/tooling fixes (no external dependency)
3. **Next (parallel track B):** PR#03 — governance enforcement (no external dependency)
4. **When owner provides evidence:** PR#01 → close
5. **After PR#01 PASS:** PR#04 — technical cleanup

---

## Related
- ADR: `docs/ADR/ADR-0000-source-of-truth.md`
- ADR: `docs/ADR/ADR-0001-current-stack-fact.md`
- Traceability: `docs/TRACEABILITY_MATRIX.md`
- PR Playbook: `docs/PR_PLAYBOOK.md`
- Deployment Truth: `docs/DEPLOYMENT_TRUTH.md`
- Stage Assessment: `docs/STAGE_ASSESSMENT_2026-02-07.md`
