# TRACEABILITY_MATRIX.md

| Moduł / wymaganie | Pliki referencyjne | PR (wewn.) | Test / dowód | Status |
|---|---|---|---|---|
| Source of Truth roadmap | `docs/ROADMAP_ENTERPRISE.md`, `docs/ADR/ADR-0000-source-of-truth.md` | PR#00 | Review dokumentu + zgodność scope fence | DONE |
| Deployment truth (Vercel) | `docs/DEPLOYMENT_TRUTH.md`, `docs/P0_EVIDENCE_REQUEST.md`, `scripts/verify/repo_inventory.sh`, `scripts/verify/vercel_repo_checks.sh`, `vercel.json` | PR#01 | `scripts/verify/repo_inventory.sh`, `scripts/verify/vercel_repo_checks.sh`, screeny z Vercel Dashboard | IN_PROGRESS |
| Deployment truth (Supabase) | `docs/DEPLOYMENT_TRUTH.md`, `docs/P0_EVIDENCE_REQUEST.md`, `scripts/verify/supabase_repo_checks.sh`, `supabase/migrations/*`, `supabase/functions/*`, `.github/workflows/supabase-deploy.yml` | PR#01 | `scripts/verify/supabase_repo_checks.sh`, log `supabase-deploy.yml`, screeny Supabase Dashboard | IN_PROGRESS |
| Dyscyplina PR (process) | `docs/PR_PLAYBOOK.md`, `.github/pull_request_template.md`, `AGENTS.md` | PR#03 | PR testowy przechodzący template i checks | TODO |
| Ryzyko: ACTION_LABELS hardcoded | `ATOMIC_PR_PLAN.md`, `docs/ROADMAP.md` | PR#04.x | Test i18n + code review | TODO |
| Ryzyko: CSP frame-ancestors vs /offer/* | `vercel.json`, `docs/DEPLOYMENT_TRUTH.md` | PR#04.x | Test osadzania + nagłówki odpowiedzi | TODO |
| Ryzyko: ESLint warnings | `docs/ROADMAP.md`, raport lint | PR#04.x | `npm run lint` (spadek warning count) | TODO |
| Ryzyko: npm engine mismatch | `package.json`, logi CI/Vercel | PR#04.x | build na docelowych engine | TODO |
| Governance: no direct main | `AGENTS.md`, branch protection (operacyjnie) | PR#03 | ustawienia repo + green checks | TODO |
