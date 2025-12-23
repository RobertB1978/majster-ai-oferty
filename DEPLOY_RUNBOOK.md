# 🚀 Production Deploy Runbook - Unblock & Execute

**Author:** Incident Commander
**Date:** 2025-12-23
**Branch:** `claude/unblock-production-deploy-DOXDQ`
**Status:** ✅ READY TO DEPLOY

---

## 🎯 Quick Summary

**Problem Fixed:**
- ❌ Migrations were failing with `SQLSTATE 42883: function gen_random_bytes(integer) does not exist`
- ❌ Workflow lacked defensive checks for project ref consistency

**Solution Applied:**
- ✅ Added `pgcrypto` extension to first migration
- ✅ Added defensive validation to deployment workflow
- ✅ Enhanced verification checks

**Changes:**
1. File: `supabase/migrations/20251205160746_6a58fb47-b2dd-4b92-98f6-ba211dc13689.sql`
   - Line 1-2: Added `CREATE EXTENSION IF NOT EXISTS pgcrypto;`

2. File: `.github/workflows/supabase-deploy.yml`
   - Lines 67-107: Added project ref validation and mismatch detection
   - Lines 189-198: Added extension verification

---

## 📋 STEP-BY-STEP DEPLOYMENT GUIDE

### BEFORE YOU START ✋

**Prerequisites:**
- [ ] You have `SUPABASE_ACCESS_TOKEN` set in GitHub Secrets
- [ ] You have `SUPABASE_PROJECT_REF` set in GitHub Secrets (or it will use `zpawgcecwqvypodzvlzy` from config.toml)
- [ ] You are ready to wait ~3-5 minutes for deployment

### STEP 1: Merge the PR

**Option A: Via GitHub Web UI (RECOMMENDED)**

1. **Navigate to:** https://github.com/RobertB1978/majster-ai-oferty/pulls
2. **Find PR:** "fix: unblock production deploy - pgcrypto extension and workflow hardening"
3. **Review:** Check the "Files changed" tab - you should see:
   - ✅ 2 files changed
   - ✅ Migration has `CREATE EXTENSION IF NOT EXISTS pgcrypto;` at top
   - ✅ Workflow has defensive checks
4. **Merge:** Click green "Merge pull request" button
5. **Confirm merge:** Click "Confirm merge"

**Option B: Via Command Line**

```bash
# Switch to main branch
git checkout main

# Pull latest
git pull origin main

# Merge the fix branch
git merge claude/unblock-production-deploy-DOXDQ

# Push to main
git push origin main
```

---

### STEP 2: Trigger Supabase Deployment

**Direct URL (fastest):**
👉 https://github.com/RobertB1978/majster-ai-oferty/actions/workflows/supabase-deploy.yml

**Click-by-click:**

1. **Go to:** https://github.com/RobertB1978/majster-ai-oferty
2. **Click:** "Actions" tab (top menu, between "Pull requests" and "Projects")
3. **Find:** "Supabase Deploy Autopilot" in left sidebar under "All workflows"
4. **Click:** "Supabase Deploy Autopilot"
5. **Click:** "Run workflow" button (top right, gray button with dropdown)
6. **Select:**
   - Branch: `main` (default)
   - Environment: `production` (default)
7. **Click:** Green "Run workflow" button

---

### STEP 3: Monitor Deployment

**Watch the logs:**

1. You'll see a new workflow run appear at the top (yellow dot → spinning)
2. **Click** on the workflow run title (e.g., "Supabase Deploy Autopilot #12")
3. **Click** on "Deploy Migrations & Functions" job
4. **Watch** each step expand:

**Expected output (GOOD):**

```
✅ SUPABASE_ACCESS_TOKEN found (123 chars)
✅ SUPABASE_PROJECT_REF secret found: zpawgcecwqvypodzvlzy
📋 Config.toml declares project_id: zpawgcecwqvypodzvlzy
🔗 Linking to project: zpawgcecwqvypodzvlzy
📊 Checking for migrations...
📁 Found 19 migration file(s)
🚀 Pushing migrations to Supabase...
✅ Database migrations applied successfully
🔌 Checking required extensions...
  ✅ Extension enabled: pgcrypto
📊 Checking critical tables...
  ✅ Table exists: clients
  ✅ Table exists: projects
  ... (all tables)
🎉 VERIFICATION PASSED!
```

**Bad signs (ABORT):**

```
❌ ERROR: SUPABASE_ACCESS_TOKEN is not set!
❌ FATAL: PROJECT_REF is empty!
⚠️ WARNING: SUPABASE_PROJECT_REF (xxx) != config.toml (yyy)
❌ VERIFICATION FAILED: X critical table(s) missing
Error: error applying migrations
```

**If you see errors:**
1. **Stop immediately** - do NOT re-run
2. **Screenshot the error**
3. **Contact Claude Code** with the error message

---

### STEP 4: Verify Deployment Success

**In Supabase Dashboard:**

1. **Go to:** https://supabase.com/dashboard/project/zpawgcecwqvypodzvlzy
2. **Check Database:**
   - Click "Table Editor" (left sidebar)
   - Verify these tables exist:
     - ✅ `clients`
     - ✅ `projects`
     - ✅ `quotes`
     - ✅ `offer_sends`
     - ✅ `offer_approvals`
3. **Check Edge Functions:**
   - Click "Edge Functions" (left sidebar)
   - Verify you see ~10 functions deployed with recent timestamps

**In Your App:**

1. **Open:** Your production app (Vercel URL)
2. **Test:**
   - ✅ Login works
   - ✅ Creating a quote works
   - ✅ Viewing projects works
3. **Check Console:** No critical errors in browser console (F12)

---

### STEP 5: Post-Deploy Smoke Test Checklist

Run through these quickly (~3 minutes):

- [ ] **Auth:** Can login with existing account
- [ ] **Database:** Can view existing projects
- [ ] **Create:** Can create a new client
- [ ] **AI:** Can generate a quote (if you have AI keys configured)
- [ ] **PDF:** Can generate PDF preview
- [ ] **Email:** Can send offer email (check it arrives)
- [ ] **No errors:** Browser console (F12) shows no red errors

**If ALL checkboxes pass:** 🎉 **DEPLOYMENT SUCCESSFUL!**

---

## 🆘 TROUBLESHOOTING

### Error: "function gen_random_bytes does not exist"

**Diagnosis:** pgcrypto extension wasn't created properly

**Fix:**
```sql
-- Run this manually in Supabase SQL Editor
CREATE EXTENSION IF NOT EXISTS pgcrypto;
```

**Then re-run:** Workflow from Step 2

---

### Error: "SUPABASE_ACCESS_TOKEN is not set"

**Diagnosis:** GitHub Secret missing or expired

**Fix:**
1. **Go to:** https://supabase.com/dashboard → Account Settings → Access Tokens
2. **Generate** new token
3. **Go to:** https://github.com/RobertB1978/majster-ai-oferty/settings/secrets/actions
4. **Update:** `SUPABASE_ACCESS_TOKEN` secret
5. **Re-run** workflow

---

### Error: "Table MISSING: clients" (or other table)

**Diagnosis:** Migrations didn't apply completely

**Possible causes:**
- Network timeout
- Supabase API issue
- Migration has syntax error

**Fix:**
1. **Check:** Supabase dashboard → Database → SQL Editor
2. **Run:** Individual migration files manually if needed
3. **Or:** Contact support with error screenshot

---

### Warning: "SUPABASE_PROJECT_REF (xxx) != config.toml (yyy)"

**Diagnosis:** Mismatch between GitHub Secret and config file

**Impact:** Deploying to WRONG project!

**Fix:**
1. **Determine** which is correct:
   - `config.toml` has: `zpawgcecwqvypodzvlzy`
   - Secret should match this
2. **Update** GitHub Secret if wrong:
   - https://github.com/RobertB1978/majster-ai-oferty/settings/secrets/actions
   - Update `SUPABASE_PROJECT_REF` to `zpawgcecwqvypodzvlzy`

---

## 📞 SUPPORT CONTACTS

**If deployment fails:**
1. **Screenshot** the failing step in GitHub Actions
2. **Copy** the error message
3. **Document** what you were doing when it failed
4. **Contact:** Claude Code team with details

**Emergency rollback:**
- Supabase migrations are **append-only** - no automatic rollback
- Contact Supabase support if you need to restore from backup

---

## ✅ SUCCESS CRITERIA

**Deployment is successful when:**
- ✅ GitHub Actions workflow shows green checkmark
- ✅ All 10+ tables exist in Supabase Table Editor
- ✅ Edge Functions show recent deployment timestamps
- ✅ pgcrypto extension is enabled (verified in logs)
- ✅ App smoke tests pass (login, create, view)
- ✅ No critical errors in browser console

**You are now UNBLOCKED!** 🚀

---

**Questions?** Re-read this runbook or contact support with specific error messages.
