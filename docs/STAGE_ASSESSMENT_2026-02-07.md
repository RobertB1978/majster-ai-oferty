# Stage Assessment — 2026-02-07

**Auditor:** Automated (Claude Opus 4.6)
**Repo HEAD:** `6d0f2bf` (main)
**Method:** Full repo analysis — read all governance docs, CI configs, Supabase configs, ran all quality gates.

---

## 1. Current Stage

### **Foundation Ready — Blocked on External Evidence**

The project has a solid governance framework (PR#00) and working quality gates, but cannot claim deployment verification because no dashboard evidence has been collected for either Vercel or Supabase.

---

## 2. PR Status Summary

| PR | Status | Evidence |
|----|--------|----------|
| PR#00 (Source of Truth) | **DONE** | All 7 docs present, internally consistent |
| PR#01 (Deployment Truth) | **DOCS_READY** | Repo-side checks done; dashboard evidence: ZERO |
| PR#02 | N/A | Consolidated into PR#01 |
| PR#01.5 (Config fixes) | **NEW — TODO** | Added based on audit findings |
| PR#03 (Governance) | **TODO** | Docs exist, enforcement not verified |
| PR#04 (Tech cleanup) | **TODO** | Blocked on PR#01 |

---

## 3. Quality Gates (executed on HEAD)

| Gate | Result |
|------|--------|
| `tsc --noEmit` | PASS — 0 errors |
| `eslint .` | PASS — 0 errors, 25 warnings |
| `vitest run` | PASS — 20 files, 281 tests |
| `vite build` | PASS — 30.34s, dist/ produced |

---

## 4. Roadmap vs Reality Deltas

| # | Roadmap Says | Reality | Severity |
|---|-------------|---------|----------|
| 1 | PR#01 is a deliverable | PR#01 is blocked on external human action (owner screenshots) | HIGH — reframe as DOCS_READY |
| 2 | 22 migrations, 17 functions | Confirmed accurate | None |
| 3 | CI runs lint/test/build/type-check | Confirmed — ci.yml does all four | None |
| 4 | Supabase deploy is manual | Confirmed — workflow_dispatch only | None |
| 5 | CSP conflict exists | Confirmed — `frame-ancestors 'none'` vs SAMEORIGIN | Known risk |
| 6 | ESLint warnings persist | Confirmed — 25 warnings | Known risk |
| 7 | config.toml covers all functions | FALSE — only 9/16 configured | NEW finding |
| 8 | Test libs properly categorized | FALSE — vitest et al. in dependencies | NEW finding |
| 9 | Node 20.x engine lock | Blocks npm ci on Node 22.x LTS | NEW finding |
| 10 | CI_STATUS claims production ready | Contradicts CONFORMANCE_MATRIX (Testing: F) | Inconsistency |

---

## 5. New Findings (not in original roadmap)

### 5.1 config.toml gaps (Security risk)

6 Edge Functions lack explicit `verify_jwt` config:
- `cleanup-expired-data` — should likely be `true` (internal scheduled task)
- `create-checkout-session` — should likely be `true` (requires auth)
- `csp-report` — should likely be `false` (browser sends CSP reports without auth)
- `delete-user-account` — should likely be `true` (requires auth)
- `healthcheck` — should be `false` (monitoring endpoints must be unauthenticated)
- `stripe-webhook` — should be `false` (Stripe sends webhooks without JWT)

**Impact:** If deployed with defaults, `healthcheck` and `stripe-webhook` will reject unauthenticated requests. Stripe webhook processing would break.

### 5.2 Test libraries in production dependencies

`vitest`, `jsdom`, `@testing-library/jest-dom`, `@testing-library/react`, `@testing-library/user-event` are in `dependencies` instead of `devDependencies`. This doesn't affect the Vite build (tree-shaking), but inflates `npm install` size and is incorrect packaging practice.

### 5.3 Engine constraint too strict

`package.json` declares `"node": "20.x"` which rejects Node 22.x (current LTS). `npm ci` fails without `--force`. This affects developer onboarding and any CI runner using Node 22.

---

## 6. Decisions Made

1. **PR#01 reframed** as DOCS_READY (not DONE). Blocked on owner.
2. **PR#01.5 created** for config/tooling fixes discovered in this audit.
3. **Execution reordered**: PR#01.5 and PR#03 can proceed in parallel while waiting for PR#01 evidence.
4. **Roadmap structure retained** — v2 to v3 update, not a rewrite.

---

## 7. Recommended Next Actions

### Immediate (no blockers):
1. PR#01.5 — Fix config.toml gaps + move test deps + evaluate engine constraint
2. PR#03 — Enforce governance (branch protection, process verification)

### Owner-dependent:
3. PR#01 — Owner provides dashboard screenshots per P0_EVIDENCE_REQUEST.md

### After PR#01 PASS:
4. PR#04 — Technical cleanup (CSP, lint warnings, ACTION_LABELS)

---

## 8. Artifacts Updated in This Assessment

| File | Change |
|------|--------|
| `docs/ROADMAP_ENTERPRISE.md` | v2 -> v3: added verified statuses, new risks, PR#01.5, execution order |
| `docs/TRACEABILITY_MATRIX.md` | Added new findings section, quality gates section, updated statuses |
| `docs/STAGE_ASSESSMENT_2026-02-07.md` | Created (this file) |
