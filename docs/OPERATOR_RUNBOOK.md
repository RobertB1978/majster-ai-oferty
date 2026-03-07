# Majster.AI — Operator Runbook (Production Closure)

**Version:** 1.0
**Date:** 2026-03-07
**Scope:** Frontend (Vercel) + Backend (Supabase) deployment verification and freshness checks.

---

## 1. What Triggers Deployment

### Frontend (Vercel)
- **Trigger:** Push to `main` branch (GitHub Actions: `deployment-truth.yml`, job `vercel-deploy`)
- **Method:** Vercel CLI (`vercel build --prod` → `vercel deploy --prebuilt --prod`)
- **Required GitHub Secrets:** `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID`
- **Skip condition:** If any of the 3 secrets are missing → deploy is skipped with `VERCEL_DEPLOY: SKIP` in logs

### Backend (Supabase)
- **Trigger:** Push to `main` branch (GitHub Actions: `deployment-truth.yml`, job `supabase-deploy`)
- **Method:** Supabase CLI (`supabase db push` + `supabase functions deploy`)
- **Required GitHub Secrets:** `SUPABASE_ACCESS_TOKEN`, `SUPABASE_DB_PASSWORD`, `SUPABASE_PROJECT_REF`, `SUPABASE_ANON_KEY`
- **Failure behavior:** Exits with `SUPABASE_DEPLOY: FAIL` in logs; Vercel deploy is blocked (runs `needs: supabase-deploy`)

---

## 2. Required Secret Names

Add these in: **GitHub → Repo Settings → Secrets and variables → Actions**
URL: `https://github.com/RobertB1978/majster-ai-oferty/settings/secrets/actions`

| Secret name | Where to get it | Required for |
|---|---|---|
| `VERCEL_TOKEN` | Vercel Dashboard → Account → Tokens | Frontend deploy |
| `VERCEL_ORG_ID` | Vercel Dashboard → Project → Settings → General → Team ID | Frontend deploy |
| `VERCEL_PROJECT_ID` | Vercel Dashboard → Project → Settings → General → Project ID | Frontend deploy |
| `SUPABASE_ACCESS_TOKEN` | Supabase Dashboard → Account → Access Tokens | Backend deploy |
| `SUPABASE_DB_PASSWORD` | Supabase Dashboard → Project → Settings → Database | Backend deploy |
| `SUPABASE_PROJECT_REF` | Supabase Dashboard → Project → Settings → General (20-char ref) | Backend deploy |
| `SUPABASE_ANON_KEY` | Supabase Dashboard → Project → Settings → API → anon key | Backend deploy |

Also required in Vercel project environment (Vercel Dashboard → Project → Settings → Environment Variables):

| Variable | Value source |
|---|---|
| `VITE_SUPABASE_URL` | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Supabase anon/public key |

---

## 3. How to Verify Production is Fresh

### 3a. Check runtime proof (version.json)
```bash
curl -sS -H "Cache-Control: no-cache" https://majster-ai-oferty.vercel.app/version.json
```
Expected response (fields must be present):
```json
{
  "appVersion": "0.1.0-alpha",
  "commitSha": "<first 7 chars of latest main SHA>",
  "buildTimestamp": "<ISO timestamp of latest build>",
  "environment": "production"
}
```
Verify `commitSha` matches: `git log origin/main -1 --format='%h'`

### 3b. Verify SW cleanup path
```bash
curl -sSo /dev/null -w "%{http_code}" https://majster-ai-oferty.vercel.app/sw.js
```
Expected: `308` (permanent redirect to `/`)  — confirms no stale service worker can be served.

### 3c. Verify SPA routing works
```bash
curl -sSo /dev/null -w "%{http_code}" https://majster-ai-oferty.vercel.app/login
curl -sSo /dev/null -w "%{http_code}" https://majster-ai-oferty.vercel.app/app
```
Expected: `200` for both (SPA rewrite active).

### 3d. Verify security headers
```bash
curl -sS -I https://majster-ai-oferty.vercel.app/ | grep -iE "x-frame|x-content|content-security|strict-transport"
```
Expected: All 4 headers present.

### 3e. Check GitHub Actions log
Go to: `https://github.com/RobertB1978/majster-ai-oferty/actions/workflows/deployment-truth.yml`
- Look for latest `push` run on `main`
- `supabase-deploy` job → must end with `SUPABASE_DEPLOY: PASS`
- `vercel-deploy` job → must end with `VERCEL_DEPLOY: PASS — https://...`

---

## 4. First Checks When Production Looks Stale

In order:

1. **Check GitHub Actions run** for the last `main` push (link above). Look for `VERCEL_DEPLOY: SKIP` — if present, Vercel secrets are missing. Fix → add `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID` to GitHub Secrets.

2. **Check `commitSha` in `/version.json`** (step 3a). If it doesn't match latest `main`:
   - Deploy either didn't run or failed.
   - Check Actions log for error.

3. **Hard-reload browser** (`Ctrl+Shift+R` / `Cmd+Shift+R`) and check again. If that fixes it:
   - Browser cache was stale. `sw-register.js` should have cleaned up; if it didn't, clear browser cache manually.

4. **Check Supabase dashboard** for migration status:
   `Supabase Dashboard → Project → Database → Migrations`
   - All migrations from `supabase/migrations/` should show as applied.

5. **Check Edge Functions** are deployed:
   `Supabase Dashboard → Project → Edge Functions`
   - All functions from `supabase/functions/` (excluding `_shared/`) should be listed.

---

## 5. Rollback

### Frontend rollback (Vercel)
- Go to: `Vercel Dashboard → Project → Deployments`
- Find the last known-good deployment → click `...` → **Promote to Production**
- Vercel instantly switches traffic. No code change needed.

### Backend rollback (Supabase)
- Supabase migrations are irreversible (append-only).
- For data-breaking changes: create a NEW migration that reverses the schema change.
- For Edge Functions: re-deploy the previous function version from git history:
  ```bash
  git checkout <previous-sha> -- supabase/functions/<fn-name>/
  git commit -m "fix: rollback <fn-name> to <previous-sha>"
  # then push to main to trigger redeploy
  ```

---

## 6. Stale Runtime — What Protects Against It

| Mechanism | What it does |
|---|---|
| `public/sw-register.js` | Loaded in `index.html`; unregisters ALL service workers and deletes `majster-ai-*` caches on page load |
| `vercel.json` → redirect `/sw.js` → `/` (308) | Prevents browser from fetching/registering a new service worker from `/sw.js` |
| `vercel.json` → headers: `sw-register.js` no-store | Ensures `sw-register.js` is never cached; always fetched fresh |
| `vercel.json` → headers: `index.html` no-store | Ensures HTML entry point is always fetched fresh |
| `vercel.json` → headers: `version.json` no-store | Ensures runtime proof is never cached |
| Vite content-hash filenames | JS/CSS assets are immutable with hash in filename; fresh deploy = new URL |
| `vite.config.ts` → `runtimeVersionPlugin` | Emits `dist/version.json` with `commitSha` and `buildTimestamp` at every build |

---

## 7. Canonical Deployment Path (Single Source of Truth)

```
git push origin main
        │
        ▼
GitHub Actions: deployment-truth.yml
        │
        ├─── supabase-deploy (always, push+PR)
        │      ├─ supabase db push
        │      └─ supabase functions deploy (all in supabase/functions/ except _shared/)
        │
        └─── vercel-deploy (only on push to main, needs supabase-deploy success)
               ├─ vercel pull --environment=production
               ├─ vercel build --prod
               └─ vercel deploy --prebuilt --prod
```

No other deployment path should be active. If Vercel Git Integration is also enabled in the Vercel dashboard, it creates a **parallel/duplicate deploy path** — disable it to avoid race conditions:
> Vercel Dashboard → Project → Settings → Git → Disconnect Git Repository (or just leave Git Integration enabled AND remove the GitHub Actions Vercel steps — pick ONE path).
