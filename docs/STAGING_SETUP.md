# Staging Environment Setup

**Security Pack Δ1 - PROMPT 10/10**

This guide explains how to set up a staging environment for safe testing.

---

## Why Staging?

Staging environment allows you to:
- Test changes before production
- Verify migrations with real-like data
- Run E2E tests in production-like environment
- Train users on new features
- Debug production issues safely

---

## Architecture

```
Development (localhost)
    ↓
Staging (Vercel Preview + Supabase Staging)
    ↓
Production (Vercel Production + Supabase Production)
```

---

## Step 1: Create Staging Supabase Project

### Option A: Separate Project (Recommended)

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Click "New Project"
3. **Name:** `majster-ai-oferty-staging`
4. **Region:** Same as production (for consistency)
5. **Database Password:** Generate strong password

### Option B: Branching (Requires Pro Plan)

1. In your production project
2. Go to **Settings → Database → Branching**
3. Create branch: `staging`
4. Use branch URL for staging

---

## Step 2: Copy Database Schema

### Method 1: SQL Dump

```bash
# From production
pg_dump -h db.xxx.supabase.co -U postgres -d postgres \
  --schema-only > schema.sql

# To staging
psql -h db.staging.supabase.co -U postgres -d postgres \
  < schema.sql
```

### Method 2: Migrations (Recommended)

```bash
# Apply same migrations to staging
npx supabase db push --project-ref STAGING_PROJECT_ID
```

---

## Step 3: Configure Vercel Staging

1. Go to [Vercel Dashboard](https://vercel.com)
2. Select project: `majster-ai-oferty`
3. Go to **Settings → Environment Variables**
4. Add **Preview** environment variables:

| Variable | Value | Environment |
|----------|-------|-------------|
| `VITE_SUPABASE_URL` | https://STAGING_ID.supabase.co | Preview |
| `VITE_SUPABASE_ANON_KEY` | staging_anon_key | Preview |
| `VITE_SENTRY_DSN` | (optional, separate project) | Preview |

---

## Step 4: Seed Staging Data

Create realistic test data:

```sql
-- Example seed data for staging
INSERT INTO profiles (user_id, company_name, email_for_offers)
VALUES
  ('test-user-1', 'Test Company 1', 'test1@example.com'),
  ('test-user-2', 'Test Company 2', 'test2@example.com');

INSERT INTO projects (user_id, project_name, client_id)
VALUES
  ('test-user-1', 'Test Project', 'test-client-1');
```

**⚠️ Never use production data in staging!** (GDPR violation)

---

## Step 5: Configure Staging Secrets

In **Supabase Dashboard → Edge Functions → Secrets** (staging project):

```bash
RESEND_API_KEY=test_...         # Use Resend test mode
OPENAI_API_KEY=sk-test-...      # Use lower-tier key
FRONTEND_URL=https://majster-ai-oferty-git-BRANCH.vercel.app
```

---

## Step 6: Test Staging

### Automated Tests

```bash
# Run E2E against staging
BASE_URL=https://your-staging-deployment.vercel.app npm run e2e
```

### Manual Smoke Test

- [ ] Login works
- [ ] Create project
- [ ] Generate quote
- [ ] Send email (check test inbox)
- [ ] Delete test data

---

## Deployment Flow

### Development → Staging → Production

1. **Create PR** from feature branch
2. **Vercel Preview** auto-deploys to staging
3. **Run E2E tests** on preview
4. **Manual QA** on preview
5. **Merge to main** (after approval)
6. **Production deployment** (automatic)

---

## Release Checklist

Before merging to main:

- [ ] All tests pass (unit + E2E)
- [ ] Code review approved
- [ ] Changelog updated
- [ ] Documentation updated
- [ ] Tested on staging
- [ ] No high/critical vulnerabilities
- [ ] Bundle size within budget
- [ ] Migration scripts tested

---

## Staging Maintenance

### Weekly Tasks

- [ ] Clear old test data
- [ ] Check staging database size
- [ ] Update to match production schema
- [ ] Rotate test API keys

### Monthly Tasks

- [ ] Review staging costs
- [ ] Update seed data
- [ ] Test disaster recovery
- [ ] Verify backups

---

## Cost Optimization

**Staging should be cheaper than production:**

- ✅ Use smaller Supabase plan (Free or Pro)
- ✅ Use Vercel Preview (included in Pro plan)
- ✅ Use test-mode APIs (Resend, Stripe)
- ✅ Lower rate limits
- ✅ Disable expensive features (AI if not testing)

**Expected cost:** $0-25/month (vs $50-100 production)

---

## Troubleshooting

### Staging and production data mixed

**Cause:** Wrong env vars
**Fix:**
1. Check `VITE_SUPABASE_URL` in Vercel
2. Ensure Preview uses staging URL
3. Re-deploy preview

### Migrations failing on staging

**Cause:** Schema drift
**Fix:**
1. Backup staging database
2. Drop and recreate
3. Re-run all migrations

### Tests failing on staging but passing locally

**Cause:** Environment differences
**Fix:**
1. Check env vars match
2. Verify test data exists
3. Check network/CORS settings

---

## Security Notes

- ✅ **Never** use production credentials in staging
- ✅ **Never** copy production data to staging (GDPR)
- ✅ Use separate Sentry project
- ✅ Use test payment methods
- ✅ Disable production integrations

---

**Last updated:** 2025-12-16
