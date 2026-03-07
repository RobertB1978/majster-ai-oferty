# Production Alignment Audit — 2026-03-07

## Objective
Determine whether production reflects repository truth (release-relevant frontend + backend + deployment runtime).

## Evidence Snapshot
- Local HEAD at audit time: `7cdbc57`.
- Runtime proof endpoint responds: `https://majster-ai-oferty.vercel.app/version.json`.
- Runtime proof payload shows `commitSha: 7cdbc57` and `environment: production`.
- Supabase project ref in repo: `xwxvqhhnozfrjcjmcltv` (`supabase/config.toml`).
- Direct function checks against `https://xwxvqhhnozfrjcjmcltv.supabase.co/functions/v1/*` return `404 {"code":"NOT_FOUND"}` for multiple release-critical functions.

## Release-Relevant Truth (Repo)
The last merged release batches include PR-09..PR-20 functional slices plus post-merge deployment/runtime hardening (#314..#329), including:
- Offers list/wizard/PDF/send/finalize and acceptance links.
- Projects V2, Burn Bar, Photo Reports, Dossier, Templates, Inspections/Reminders.
- Stripe billing paths and webhooks.
- Runtime proof endpoint (`/version.json`) and stale-runtime neutralization.
- Canonical Supabase deployment truth gate workflows.

## Alignment Result
- **Frontend runtime alignment:** PASS (Vercel production serves the same commit as repo HEAD).
- **Backend (Supabase Functions) alignment:** FAIL (functions not found in production project endpoint).
- **Overall production alignment:** **NOT ALIGNED** (frontend is current, backend deployment is behind/missing).

## Gap Classification
Combination: **D + E**
- **D (missing DB/function apply in production):** Edge functions not deployed (NOT_FOUND).
- **E (env/config/deploy pipeline execution gap):** deployment workflows exist in repo, but production apply evidence is missing and backend runtime does not reflect repo artifacts.

## Minimal Safe Repo-Side Action Performed
- Added this auditable report with exact proof and deterministic owner runbook.
- No historical migrations were modified.
- No business logic changes.

## Required Owner Runbook (Exact)
1. Open GitHub Actions workflow runs for this repository and run the canonical production deploy workflow:
   - Workflow: `.github/workflows/deployment-truth.yml`
   - Branch: `main`
2. Ensure repository secrets exist and are current:
   - `SUPABASE_ACCESS_TOKEN`
   - `SUPABASE_DB_PASSWORD`
   - `SUPABASE_PROJECT_REF` = `xwxvqhhnozfrjcjmcltv`
   - `SUPABASE_ANON_KEY`
3. After workflow success, verify Supabase functions endpoints (expect no `NOT_FOUND`):
   - `/functions/v1/healthcheck`
   - `/functions/v1/approve-offer`
   - `/functions/v1/send-offer-email`
4. Re-check frontend runtime proof:
   - `https://majster-ai-oferty.vercel.app/version.json` commit must match deployed `main` SHA.
5. Run DB parity checks from `docs/DEPLOY_DB_PARITY_RUNBOOK.md` (migrations + table/RLS checks).

## Acceptance Criteria
Production can be considered aligned only when all are true:
- `/version.json` commit equals deployed `main` SHA.
- Supabase functions return non-404 responses for release-critical endpoints.
- Migration parity check shows repo migrations applied in production.
