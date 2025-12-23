# ⚠️ Production Deploy - Risk Assessment & Detection

**Date:** 2025-12-23
**Branch:** `claude/unblock-production-deploy-DOXDQ`
**Commander:** Incident Response Team

---

## 🎯 Executive Summary

**Risk Level:** 🟡 **MEDIUM** (down from 🔴 HIGH after fixes)

**Why deploy now:**
- Blockers have been identified and fixed
- Changes are minimal and surgical
- No deployment = no production service

**Why wait might be worse:**
- Cannot test Edge Functions without deployment
- Cannot verify full stack without live environment
- Users are waiting for features

---

## 📊 Risk Matrix

| Risk | Probability | Impact | Severity | Mitigation |
|------|-------------|--------|----------|------------|
| Migration fails mid-apply | LOW | HIGH | 🟡 MEDIUM | Tested pgcrypto fix, idempotent migrations |
| Wrong Supabase project | VERY LOW | CRITICAL | 🟡 MEDIUM | Added validation checks, config verification |
| Edge Functions fail to deploy | LOW | MEDIUM | 🟢 LOW | Functions previously deployed, workflow tested |
| RLS policies block users | LOW | HIGH | 🟡 MEDIUM | RLS unchanged, existing policies preserved |
| Data corruption | VERY LOW | CRITICAL | 🟢 LOW | No data deletion, only schema addition |
| Downtime during deploy | MEDIUM | MEDIUM | 🟡 MEDIUM | Supabase zero-downtime migrations |

---

## 🔴 CRITICAL RISKS (P0)

### RISK 1: Migration Applies to Wrong Supabase Project

**What could happen:**
- Workflow uses wrong `SUPABASE_PROJECT_REF`
- Migrations apply to staging/dev instead of production
- Or vice versa - production migrations hit wrong DB

**Likelihood:** VERY LOW (after our fix)

**Detection:**
```bash
# In workflow logs, look for:
📋 Config.toml declares project_id: zpawgcecwqvypodzvlzy
✅ SUPABASE_PROJECT_REF secret found: zpawgcecwqvypodzvlzy
🔗 Linking to project: zpawgcecwqvypodzvlzy

# If these DON'T match, you'll see:
⚠️ WARNING: SUPABASE_PROJECT_REF (xxx) != config.toml (yyy)
```

**Mitigation:**
- ✅ Added validation in workflow (lines 67-107)
- ✅ Workflow echoes project ref before linking
- ✅ Workflow warns if secret != config.toml

**If it happens:**
1. **STOP immediately** - cancel workflow
2. **Check** which project was affected:
   - Go to https://supabase.com/dashboard
   - Check recent activity in each project
3. **Document** what was deployed where
4. **Rollback** if needed (contact Supabase support for DB restore)

---

### RISK 2: pgcrypto Extension Fails to Enable

**What could happen:**
- `CREATE EXTENSION pgcrypto` fails (permission issue, Supabase limits)
- Subsequent migrations using `gen_random_bytes()` fail
- Deployment halts mid-migration
- Partial schema in production

**Likelihood:** LOW (Supabase allows pgcrypto by default)

**Detection:**
```bash
# In workflow logs during migration step:
🚀 Pushing migrations to Supabase...
Error: error applying migration 20251205160746 (line X):
pq: permission denied to create extension "pgcrypto"

# Or in verification:
🔌 Checking required extensions...
  ⚠️ Extension status unclear: pgcrypto (may need manual check)
```

**Mitigation:**
- ✅ Used `IF NOT EXISTS` (idempotent, won't fail if already exists)
- ✅ Placed in FIRST migration (runs before all usage)
- ✅ Added verification check for extensions

**If it happens:**
1. **Check** Supabase dashboard → Database → Extensions
2. **Manually enable** pgcrypto via SQL Editor:
   ```sql
   CREATE EXTENSION IF NOT EXISTS pgcrypto;
   ```
3. **Re-run** workflow (it will continue from where it failed)

---

### RISK 3: Migration Fails Mid-Apply (Partial Schema)

**What could happen:**
- Network timeout during `supabase db push`
- Migration syntax error on line N
- Migration partially applied (some tables created, others not)
- App breaks due to missing tables

**Likelihood:** LOW (migrations have been validated)

**Detection:**
```bash
# In workflow logs:
📤 Push database migrations
Error: error applying migration 20251205230527 (line 259):
pq: syntax error at or near "INVALID_SQL"

# Or in verification:
📊 Checking critical tables...
  ❌ Table MISSING: offer_approvals
❌ VERIFICATION FAILED: 3 critical table(s) missing
```

**Mitigation:**
- ✅ Migrations are SQL-validated
- ✅ Verification step checks all critical tables
- ✅ Workflow fails fast if verification fails
- ✅ Migrations use idempotent patterns where possible

**If it happens:**
1. **DO NOT panic** - migrations are transactional per file
2. **Check** Supabase logs: Dashboard → Logs → Postgres
3. **Identify** which migration failed and why
4. **Options:**
   - If network timeout: Re-run workflow (will resume)
   - If syntax error: Fix migration, create NEW migration file
   - If constraint violation: Investigate data issue
5. **Contact support** if stuck

---

## 🟡 MEDIUM RISKS (P1)

### RISK 4: Edge Functions Deploy Fails

**What could happen:**
- `supabase functions deploy` times out
- Some functions deploy, others don't
- Production functions out of sync with database

**Likelihood:** LOW (functions previously deployed)

**Detection:**
```bash
# In workflow logs:
📦 Deploying: send-offer-email...
  ❌ send-offer-email deployment failed
Error: Unable to deploy function
```

**Mitigation:**
- ✅ Workflow deploys functions one by one (loop)
- ✅ Workflow fails if ANY function deployment fails
- ✅ Can manually re-deploy individual functions

**If it happens:**
1. **Identify** which function(s) failed
2. **Check** Supabase dashboard → Edge Functions → Logs
3. **Manual deploy** from CLI:
   ```bash
   supabase functions deploy <function-name> --project-ref zpawgcecwqvypodzvlzy
   ```
4. **Or** re-run entire workflow

---

### RISK 5: RLS Policies Block Legitimate Users

**What could happen:**
- New tables have overly restrictive RLS policies
- Users can't read/write data they should have access to
- App shows "permission denied" errors

**Likelihood:** LOW (RLS policies follow existing patterns)

**Detection:**
```javascript
// In browser console (F12):
Error: permission denied for table "api_keys"

// Or users report:
"I can't see my projects"
"Error saving quote"
```

**Mitigation:**
- ✅ All new tables have RLS policies defined
- ✅ Policies follow existing patterns (auth.uid() checks)
- ✅ Public access where needed (offer approvals, marketplace)

**If it happens:**
1. **Check** Supabase dashboard → Authentication → Policies
2. **Identify** which table has the issue
3. **Test** policy with SQL:
   ```sql
   -- Impersonate user
   SET request.jwt.claims.sub = 'user-uuid-here';
   -- Try query
   SELECT * FROM problematic_table WHERE user_id = 'user-uuid-here';
   ```
4. **Create** new migration to fix policy if needed

---

## 🟢 LOW RISKS (P2)

### RISK 6: Workflow Timeout (15 minute limit)

**What could happen:**
- Deployment takes > 15 minutes
- Workflow auto-cancels
- Need to re-run manually

**Likelihood:** VERY LOW (typical deploy ~3-5 min)

**Mitigation:**
- ✅ Timeout set to 15 minutes (line 21)
- ✅ Supabase CLI is fast
- ✅ Migrations are small

**If it happens:**
- Re-run workflow (it's idempotent)

---

### RISK 7: Incorrect Verification Check (False Negative)

**What could happen:**
- `supabase db remote list` command fails to detect tables
- Workflow incorrectly reports missing tables
- Blocks successful deployment

**Likelihood:** LOW

**Mitigation:**
- ✅ Verification uses `grep -q` for existence check
- ✅ Manual check always available

**If it happens:**
1. **Bypass** verification by checking Supabase dashboard directly
2. **Manually verify** tables exist in Table Editor
3. **Report** issue to improve verification step

---

## 🔍 DETECTION & MONITORING

### Real-time Detection During Deploy

**Watch these in GitHub Actions logs:**

✅ **GOOD SIGNS:**
```
✅ SUPABASE_ACCESS_TOKEN found (123 chars)
✅ SUPABASE_PROJECT_REF secret found: zpawgcecwqvypodzvlzy
🔗 Linking to project: zpawgcecwqvypodzvlzy
📁 Found 19 migration file(s)
✅ Database migrations applied successfully
  ✅ Extension enabled: pgcrypto
  ✅ Table exists: clients (x10)
🎉 VERIFICATION PASSED!
```

🚨 **WARNING SIGNS:**
```
⚠️ WARNING: SUPABASE_PROJECT_REF != config.toml
⚠️ Extension status unclear: pgcrypto
⚠️ No function folders found
```

❌ **ABORT SIGNALS:**
```
❌ ERROR: SUPABASE_ACCESS_TOKEN is not set
❌ FATAL: PROJECT_REF is empty
❌ Table MISSING: clients
Error: error applying migration
```

---

### Post-Deploy Health Checks (T+5 minutes)

**In Supabase Dashboard:**
- [ ] Database → Extensions → pgcrypto is enabled
- [ ] Database → Table Editor → All 20+ tables visible
- [ ] Edge Functions → 10+ functions with recent timestamps
- [ ] Database → Logs → No error spikes

**In Production App:**
- [ ] Open browser console (F12)
- [ ] Login works
- [ ] Navigate to "Projects" page
- [ ] Create new client
- [ ] Check console for errors
- [ ] Create new quote
- [ ] Generate PDF preview

**If ANY check fails:**
1. Screenshot the issue
2. Check corresponding Supabase dashboard section
3. Review GitHub Actions logs
4. Escalate to technical support

---

### Monitoring (First 24 Hours)

**What to watch:**

1. **Error Rate** (Supabase Logs)
   - Baseline: <1% error rate
   - Alert if: >5% error rate
   - Check: Hourly for first 6 hours

2. **User Complaints**
   - Monitor: Email, support tickets
   - Red flag: "Can't save", "Permission denied"

3. **Edge Function Errors**
   - Supabase → Edge Functions → Logs
   - Filter: Error level
   - Alert if: Any function has >10 errors/hour

4. **Database Performance**
   - Supabase → Reports → Performance
   - Watch: Query time, connection count
   - Alert if: Spike >2x baseline

---

## 🛡️ ROLLBACK STRATEGY

### If Deployment Catastrophically Fails:

**Option 1: Quick Rollback (Code Only)**
```bash
# In GitHub
git revert <commit-sha>
git push origin main

# Edge Functions stay (harmless if DB schema missing)
```

**Option 2: Database Rollback (DESTRUCTIVE)**
⚠️ **DANGER:** This deletes data!

1. **Contact Supabase Support:**
   - Request restore from backup
   - Specify timestamp BEFORE deployment
   - Understand: May lose recent user data

2. **Manual Migration Rollback:**
   - NOT RECOMMENDED (migrations aren't designed for rollback)
   - Only if Supabase support advises

**Option 3: Hotfix Forward**
- If issue is small (e.g., one RLS policy wrong)
- Create NEW migration to fix
- Deploy via workflow
- Faster than rollback

---

## 📋 DECISION MATRIX: Should You Deploy?

**Deploy if:**
- ✅ You've reviewed this risk doc
- ✅ GitHub Actions workflow is green (after merge)
- ✅ You have 15 minutes to monitor
- ✅ It's business hours (easier to get support)

**Wait if:**
- ❌ Major production incidents ongoing
- ❌ Friday evening (no weekend support)
- ❌ You're unfamiliar with Supabase dashboard
- ❌ No backups configured in Supabase

**Abort immediately if:**
- 🚨 Workflow shows wrong project ref
- 🚨 Migration errors appear in logs
- 🚨 Verification fails
- 🚨 You see production data you don't recognize

---

## ✅ SIGN-OFF CHECKLIST

Before clicking "Run workflow":

- [ ] I've read the DEPLOY_RUNBOOK.md
- [ ] I've read this DEPLOY_RISKS.md
- [ ] I understand the risks (medium level)
- [ ] I have Supabase dashboard access
- [ ] I have 15 minutes to monitor deployment
- [ ] I have a way to contact support if needed
- [ ] I've verified GitHub Secrets are set correctly
- [ ] I'm ready to run smoke tests immediately after

**Signature:** _________________ **Date:** _________

---

## 📞 ESCALATION PATH

**If deployment fails:**

1. **Tier 1 - Self-service (0-5 min)**
   - Check DEPLOY_RUNBOOK.md troubleshooting
   - Re-read error message carefully
   - Check Supabase dashboard

2. **Tier 2 - Claude Code (5-30 min)**
   - Provide error screenshot
   - Share GitHub Actions run URL
   - Describe what you see in Supabase dashboard

3. **Tier 3 - Supabase Support (30+ min)**
   - https://supabase.com/dashboard/support
   - Include: Project ref, error message, timestamp
   - Request: Specific help or backup restore

---

**Remember:** The fix is tested, surgical, and addresses a critical blocker. Risk is medium but manageable. You've got this! 🚀
