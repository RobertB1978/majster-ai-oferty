# TRACEABILITY_MATRIX.md

**Last updated:** 2026-02-07 (automated audit on HEAD `6d0f2bf`)

## PR Deliverables

| Modul / wymaganie | Pliki referencyjne | PR (wewn.) | Test / dowod | Status |
|---|---|---|---|---|
| Source of Truth roadmap | `docs/ROADMAP_ENTERPRISE.md`, `docs/ADR/ADR-0000-source-of-truth.md` | PR#00 | Review dokumentu + zgodnosc scope fence | ✅ DONE |
| Deployment truth (Vercel) | `docs/DEPLOYMENT_TRUTH.md`, `docs/P0_EVIDENCE_PACK.md`, `docs/P0_EVIDENCE_REQUEST.md`, `scripts/verify/repo_inventory.sh`, `scripts/verify/vercel_repo_checks.sh`, `vercel.json` | PR#01 (consolidated) | `scripts/verify/repo_inventory.sh`, `scripts/verify/vercel_repo_checks.sh`, screeny z Vercel Dashboard | ⏳ DOCS_READY — awaiting dashboard evidence |
| Deployment truth (Supabase) | `docs/DEPLOYMENT_TRUTH.md`, `docs/P0_EVIDENCE_PACK.md`, `docs/P0_EVIDENCE_REQUEST.md`, `scripts/verify/supabase_repo_checks.sh`, `supabase/migrations/*`, `supabase/functions/*`, `.github/workflows/supabase-deploy.yml` | PR#01 (consolidated) | `scripts/verify/supabase_repo_checks.sh`, log `supabase-deploy.yml`, screeny Supabase Dashboard | ⏳ DOCS_READY — awaiting dashboard evidence |
| Dyscyplina PR (process) | `docs/PR_PLAYBOOK.md`, `.github/pull_request_template.md`, `AGENTS.md` | PR#03 | PR testowy przechodzacy template i checks | 🔲 TODO |
| Governance: no direct main | `AGENTS.md`, branch protection (operacyjnie) | PR#03 | ustawienia repo + green checks | 🔲 TODO |

## Risk Backlog (PR#04.x)

| Ryzyko | Pliki referencyjne | PR (wewn.) | Test / dowod | Status |
|---|---|---|---|---|
| ACTION_LABELS hardcoded | `ATOMIC_PR_PLAN.md`, `docs/ROADMAP.md` | PR#04.x | Test i18n + code review | 🔲 TODO |
| CSP frame-ancestors vs /offer/* | `vercel.json`, `docs/DEPLOYMENT_TRUTH.md` | PR#04.x | Test osadzania + naglowki odpowiedzi | 🔲 TODO |
| ESLint warnings (25 warnings, 0 errors) | `docs/ROADMAP.md`, raport lint | PR#04.x | `npm run lint` (spadek warning count) | 🔲 TODO |
| npm engine mismatch (Node 20.x strict) | `package.json`, logi CI/Vercel | PR#01.5 / PR#04.x | build na docelowych engine | 🔲 TODO |

## New Findings (audit 2026-02-07)

| Ryzyko | Pliki referencyjne | PR (wewn.) | Test / dowod | Status |
|---|---|---|---|---|
| config.toml missing 6/16 Edge Functions | `supabase/config.toml` | PR#01.5 | Compare config entries vs `supabase/functions/*/index.ts` | 🔲 TODO |
| Test libs in dependencies (not devDependencies) | `package.json` | PR#01.5 | `npm ls vitest` in prod install | 🔲 TODO |
| PRODUCTION_READINESS.md fully unchecked | `docs/PRODUCTION_READINESS.md` | — | Manual review | 🔲 TODO |
| CI_STATUS.md vs CONFORMANCE_MATRIX.md contradiction | `docs/CI_STATUS.md`, `docs/CONFORMANCE_MATRIX.md` | — | Reconcile testing metrics | 🔲 TODO |
| healthcheck + stripe-webhook default to verify_jwt=true | `supabase/config.toml`, `supabase/functions/healthcheck/index.ts` | PR#01.5 | Deploy + test unauthenticated access | 🔲 TODO |

## Quality Gates (verified 2026-02-07)

| Gate | Result | Detail |
|------|--------|--------|
| `npm run type-check` | ✅ PASS | 0 errors |
| `npm run lint` | ✅ PASS | 0 errors, 25 warnings |
| `npm run test` | ✅ PASS | 20 files, 281 tests |
| `npm run build` | ✅ PASS | 30.34s |
