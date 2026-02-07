# Production Verification — Pass/Fail Criteria (PR#01)

**Status:** 🚫 BLOCKED — awaiting owner evidence
**Created:** 2026-02-07
**Scope:** Evidence-based verification only. No code changes. No assumptions.
**Principle:** No evidence = FAIL. No exceptions.

---

## How This Works

This document defines the **exact evidence** required to mark PR#01 "Deployment Truth" as **Production Verified**. Each item below must have a concrete artifact (screenshot, URL, log) attached in `docs/P0_EVIDENCE_PACK.md`. Items without evidence are automatically **FAIL**.

**Verdict logic:**
- ALL mandatory items must be **PASS** → overall verdict = **PRODUCTION VERIFIED**
- ANY mandatory item is **FAIL** → overall verdict = **NOT VERIFIED**
- Nice-to-have items do not affect the overall verdict but are recorded

---

## 1) Vercel — Mandatory Evidence (V1–V5)

| ID | Evidence Item | What It Proves | Pass Criteria | Status |
|----|--------------|----------------|---------------|--------|
| V1 | Screenshot: Vercel → Project Settings → Git (repo name + production branch visible) | Git integration is connected to the correct repo and branch | Repo matches `RobertB1978/majster-ai-oferty` (or fork), production branch = `main` | ⬜ NO EVIDENCE |
| V2 | Screenshot: Vercel → Deployments (most recent production deploy with "Ready" status + timestamp) | Production deployment exists and succeeded | Status = "Ready", timestamp within last 30 days | ⬜ NO EVIDENCE |
| V3 | Screenshot or text: Deployment details showing commit SHA | Deploy traces back to a specific Git commit | SHA matches a commit that exists on `main` in GitHub | ⬜ NO EVIDENCE |
| V4 | Screenshot: Vercel → Settings → Environment Variables (variable names + scopes only, NO values) | Required env vars are configured for correct environments | `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` present for Production scope (minimum) | ⬜ NO EVIDENCE |
| V5 | Production URL (live link) + confirmation the app loads without blank screen or config errors | The deployed app is actually reachable and functional | URL opens, login page or landing page renders, no WSOD, no "Missing env" errors in console | ⬜ NO EVIDENCE |

### Vercel Verdict

```
V1: ⬜  V2: ⬜  V3: ⬜  V4: ⬜  V5: ⬜
Overall Vercel: ⬜ NOT VERIFIED (0/5 evidence items provided)
```

---

## 2) Supabase — Mandatory Evidence (S1–S6)

| ID | Evidence Item | What It Proves | Pass Criteria | Status |
|----|--------------|----------------|---------------|--------|
| S1 | Screenshot: Supabase → Project Settings → General (Project ID visible) | Correct Supabase project identified | Project ID is non-empty and matches what's referenced in deploy workflow | ⬜ NO EVIDENCE |
| S2 | Screenshot: Supabase → Database → Migrations (full list with timestamps) | Migrations from repo are applied to production | Count of applied migrations matches count in `supabase/migrations/` (22 files as of 2026-02-07) | ⬜ NO EVIDENCE |
| S3 | Screenshot: Supabase → Database → Tables (showing key tables exist) | Database schema is deployed | Tables `profiles`, `clients`, `projects`, `quotes`, `offers` are visible | ⬜ NO EVIDENCE |
| S4 | Screenshot: Supabase → Edge Functions (list of deployed functions + status) | Edge Functions from repo are deployed | All 16 functions from `supabase/functions/` are listed and show "Active" or deployed status | ⬜ NO EVIDENCE |
| S5 | Screenshot: Supabase → Authentication → URL Configuration (Site URL + Redirect URLs) | Auth redirects point to the correct production frontend | Site URL matches the Vercel production URL from V5 | ⬜ NO EVIDENCE |
| S6 | Log or screenshot: at least 1 Edge Function invocation succeeding (status 200) | At least one function is actually operational | `healthcheck` or any function returns HTTP 200 with a timestamp | ⬜ NO EVIDENCE |

### Supabase Verdict

```
S1: ⬜  S2: ⬜  S3: ⬜  S4: ⬜  S5: ⬜  S6: ⬜
Overall Supabase: ⬜ NOT VERIFIED (0/6 evidence items provided)
```

---

## 3) Nice-to-Have Evidence (N1–N5)

These items improve confidence but are NOT required for the PASS verdict.

| ID | Evidence Item | Status |
|----|--------------|--------|
| N1 | Vercel: screenshot of custom domain + SSL certificate status | ⬜ NOT PROVIDED |
| N2 | Vercel: screenshot of rewrites/headers configuration | ⬜ NOT PROVIDED |
| N3 | Supabase: screenshot of RLS policies on critical tables | ⬜ NOT PROVIDED |
| N4 | Supabase: screenshot of Edge Functions error rate (last 24h) | ⬜ NOT PROVIDED |
| N5 | GitHub Actions: log of last `supabase-deploy.yml` run (success/failure) | ⬜ NOT PROVIDED |

---

## 4) Overall Verdict

```
┌─────────────────────────────────────────────────┐
│  PRODUCTION VERIFICATION STATUS: NOT VERIFIED   │
│                                                 │
│  Vercel:   0/5 mandatory items passed           │
│  Supabase: 0/6 mandatory items passed           │
│  Total:    0/11 mandatory items passed          │
│                                                 │
│  Result:   🚫 BLOCKED — no evidence provided    │
│                                                 │
│  Required: 11/11 mandatory items = PASS         │
│            to mark Production Verified          │
└─────────────────────────────────────────────────┘
```

### Verdict State Machine

```
NO EVIDENCE  →  BLOCKED (current state)
     │
     ▼
PARTIAL EVIDENCE  →  BLOCKED (with specific items listed as PASS/FAIL)
     │
     ▼
ALL 11 MANDATORY PASS  →  ✅ PRODUCTION VERIFIED
     │
     ▼
ANY MANDATORY FAIL  →  FAIL + remediation plan required
```

---

## 5) What Happens After Evidence Is Provided

1. Owner provides evidence → artifacts go into `docs/P0_EVIDENCE_PACK.md`
2. Each item in this document is updated: `⬜ NO EVIDENCE` → `✅ PASS` or `❌ FAIL`
3. If ALL 11 mandatory items = PASS:
   - `DEPLOYMENT_TRUTH.md` status changes from `UNRESOLVED` → `PASS`
   - `ROADMAP_ENTERPRISE.md` PR#01 status changes from `🚫 BLOCKED` → `✅ DONE`
   - Project stage can advance from "Late Alpha" toward "Beta"
4. If ANY mandatory item = FAIL:
   - Specific remediation steps are documented
   - PR#01 remains `BLOCKED` until remediation + re-verification

---

## 6) Cross-References

| Document | Role |
|----------|------|
| `docs/P0_EVIDENCE_REQUEST.md` | Step-by-step guide for the owner to collect screenshots |
| `docs/P0_EVIDENCE_PACK.md` | Template where evidence artifacts are pasted |
| `docs/DEPLOYMENT_TRUTH.md` | Deployment state tracker (repo-side + dashboard-side) |
| `docs/ROADMAP_ENTERPRISE.md` | Master roadmap — PR#01 status controlled by this document |
