# ROLLBACK PLAN - MAJSTER.AI PRODUKCJA
**Cel:** Szybkie przywrócenie ostatniej działającej wersji  
**SLA:** <5 minut (dla krytycznych)  
**Owner:** DevOps / On-call engineer

---

## 🚨 KIEDY ROLLBACK?

### Natychmiastowy rollback (P0):
- ❌ Users nie mogą się zalogować (auth down)
- ❌ RLS blokuje wszystkie zapytania (data access denied)
- ❌ Database migrations failed (schema corrupted)
- ❌ Critical error rate >10% (Sentry)
- ❌ Payment processing down (Stripe webhook 100% failures)

### Warunkowy rollback (P1):
- ⚠️ Slow page loads (>5s dla critical pages)
- ⚠️ Minor features broken (non-critical)
- ⚠️ Email delivery failures
- ⚠️ Moderate error rate 5-10%

### Monitoring only (P2):
- ℹ️ Single isolated errors
- ℹ️ Performance degradation <10%
- ℹ️ Non-critical features unavailable

---

## 📋 ROLLBACK PROCEDURES

### SCENARIO 1: Frontend/Vercel Deployment Failure

**Symptomy:**
- Build failed
- 500 errors na wszystkich stronach
- Infinite redirect loops
- Blank page (white screen of death)

**Rollback Procedure:**

#### Option A: Vercel Dashboard (FASTEST - 1 min)
```
1. Idź do: https://vercel.com/[your-team]/majster-ai-oferty/deployments
2. Find ostatni WORKING deployment (zielony ✅ status)
3. Kliknij "..." menu → "Promote to Production"
4. Confirm
5. Wait ~30s dla propagacji
6. Verify: https://your-app.vercel.app
```

**CRITICAL:** Sprawdź deployment timestamp - nie promuj przypadkowo starej wersji!

#### Option B: Vercel CLI
```bash
# List recent deployments
vercel ls

# Rollback do previous
vercel rollback

# Lub specific deployment:
vercel alias set [deployment-url] production-domain.com
```

#### Option C: Git Revert
```bash
# Find bad commit
git log --oneline -n 10

# Revert (creates new commit)
git revert <bad-commit-hash>
git push origin main

# Vercel auto-deploys z main
# Wait ~2-3 min for build
```

**Timeline:** 1-3 minuty  
**Risk:** LOW (safe operation)

---

### SCENARIO 2: Database Migration Failure

**Symptomy:**
- "relation does not exist" errors
- "column not found" errors
- RLS policies missing
- Data corruption

**⚠️ WARNING:** Database rollback is **DESTRUCTIVE**. Always backup first!

**Rollback Procedure:**

#### Step 1: BACKUP (MANDATORY!)
```bash
# Supabase Dashboard → Database → Backups
# Or via CLI:
supabase db dump -f backup_$(date +%Y%m%d_%H%M%S).sql

# Download locally
```

#### Step 2: Identify Failed Migration
```sql
-- Supabase Dashboard → Database → SQL Editor
SELECT version, name, inserted_at 
FROM supabase_migrations.schema_migrations 
ORDER BY inserted_at DESC 
LIMIT 5;

-- Identify last working migration
```

#### Step 3: Rollback Migration (MANUAL)

**⚠️ Supabase nie ma automatycznego rollback!**

Musisz stworzyć **reverse migration** ręcznie:

**Example:**
```sql
-- Jeśli failed migration dodała kolumnę:
-- Original: 20251227_add_column.sql
ALTER TABLE users ADD COLUMN new_field TEXT;

-- Rollback: 20251227_rollback_add_column.sql
ALTER TABLE users DROP COLUMN new_field;
```

**Common rollback patterns:**
```sql
-- DROP TABLE → Nie da się cofnąć (data loss!)
-- Restore z backupu

-- ADD COLUMN
ALTER TABLE table_name DROP COLUMN column_name;

-- DROP COLUMN → Nie da się cofnąć (data loss!)
-- Restore z backupu

-- CREATE INDEX
DROP INDEX index_name;

-- CREATE POLICY
DROP POLICY policy_name ON table_name;

-- ALTER COLUMN TYPE → Trudny rollback
-- Może wymagać data migration
```

#### Step 4: Apply Rollback
```bash
# Create rollback migration
supabase migration new rollback_problematic_change

# Edit file w supabase/migrations/
# Add rollback SQL

# Test locally (jeśli możliwe)
supabase db reset

# Apply on production
supabase db push

# Verify
supabase db migrations list
```

#### Step 5: Verify Data Integrity
```sql
-- Check critical tables
SELECT COUNT(*) FROM users;
SELECT COUNT(*) FROM projects;
SELECT COUNT(*) FROM quotes;

-- Check RLS
SELECT tablename, COUNT(*) as policy_count
FROM pg_policies
WHERE schemaname = 'public'
GROUP BY tablename;
```

**Timeline:** 5-15 minut (zależy od complexity)  
**Risk:** **HIGH** (możliwa data loss)

**ALTERNATIVE (jeśli total failure):**
```bash
# Restore from Supabase automated backup
# Supabase Dashboard → Database → Backups → Restore Point

# ⚠️ To rollback CAŁEJ bazy do wcześniejszego stanu!
# Stracisz wszystkie dane po tym punkcie!
```

---

### SCENARIO 3: Edge Functions Failure

**Symptomy:**
- Stripe webhook returns 500
- AI features down
- Email sending fails
- Public API returns errors

**Rollback Procedure:**

#### Option A: Redeploy Previous Version (via Supabase)
```bash
# Supabase Dashboard → Edge Functions → [function-name] → Deployments
# Kliknij "Redeploy" na ostatnim working deployment

# Or via CLI:
cd supabase/functions

# Revert changes w git
git log -- functions/stripe-webhook/
git checkout <previous-commit> -- functions/stripe-webhook/

# Redeploy
supabase functions deploy stripe-webhook

# Verify
curl https://xwvxqhhnozfrjcjmcltv.supabase.co/functions/v1/healthcheck
```

#### Option B: Disable Failed Function (temporary)
```bash
# Supabase Dashboard → Edge Functions → [function] → Settings
# Toggle "Enabled" → OFF

# To prevents 500s, but feature będzie unavailable
# Fix i redeploy ASAP
```

**Timeline:** 2-5 minut  
**Risk:** LOW (izolowane od innych funkcji)

---

### SCENARIO 4: Stripe Webhook Catastrophic Failure

**Symptomy:**
- 100% webhook events failing
- Subscriptions nie update'ują się
- Users charge'd but no access

**Rollback Procedure:**

#### Step 1: Verify Issue
```bash
# Stripe Dashboard → Developers → Webhooks → Events
# Check failure rate

# Check endpoint:
curl -I https://xwvxqhhnozfrjcjmcltv.supabase.co/functions/v1/stripe-webhook
```

#### Step 2: Emergency Disable (jeśli total failure)
```bash
# Stripe Dashboard → Developers → Webhooks
# Kliknij webhook endpoint → "Disable"

# To stops errors, but:
# ⚠️ Subscription updates WON'T process until re-enabled!
```

#### Step 3: Rollback Edge Function
```bash
# See SCENARIO 3 - Edge Functions Rollback
supabase functions deploy stripe-webhook --rollback
```

#### Step 4: Re-enable Webhook
```bash
# Stripe Dashboard → Webhooks → Enable
```

#### Step 5: Replay Failed Events
```bash
# Stripe Dashboard → Webhooks → Events
# Filter: Failed events w last 1 hour
# For each event:
#   - Kliknij event → "Send test webhook"
#   - Verify success (200 OK)
```

**Timeline:** 5-10 minut  
**Risk:** MODERATE (może wymagać manual subscription sync)

**CRITICAL:** Stripe retries webhooks automatycznie do 3 dni, ale lepiej fix ASAP.

---

### SCENARIO 5: RLS Policy Lockout (Users can't see data)

**Symptomy:**
- Users widzą puste listy (mimo że mają dane)
- Console errors: "row-level security policy violation"
- Specific tables affected

**Rollback Procedure:**

#### Step 1: Identify Policy
```sql
-- Supabase Dashboard → SQL Editor
-- Check które policies są problematyczne:
SELECT schemaname, tablename, policyname, cmd, qual
FROM pg_policies
WHERE tablename = 'problematic_table'
ORDER BY policyname;
```

#### Step 2: Temporary Disable RLS (ONLY for debug!)
```sql
-- ⚠️ TYLKO w development lub krótkotrwale w prod!
ALTER TABLE public.problematic_table DISABLE ROW LEVEL SECURITY;

-- Verify users can access data
-- Sprawdź w app

-- RE-ENABLE immediately po debug:
ALTER TABLE public.problematic_table ENABLE ROW LEVEL SECURITY;
```

#### Step 3: Fix Policy
```sql
-- Przykład: Policy była za restrykcyjna
DROP POLICY IF EXISTS "problematic_policy" ON public.projects;

-- Recreate z fix:
CREATE POLICY "Users can view their projects" 
ON public.projects FOR SELECT 
TO authenticated
USING (auth.uid() = user_id);  -- Poprawiona logika
```

#### Step 4: Verify
```sql
-- Test jako authenticated user:
SET request.jwt.claims TO '{"sub": "test-user-uuid"}';
SELECT * FROM projects WHERE user_id = 'test-user-uuid';
-- Should return rows
```

**Timeline:** 3-5 minut  
**Risk:** LOW (policy changes są immediate)

---

### SCENARIO 6: Total Catastrophic Failure (Nuclear Option)

**Użyj TYLKO jeśli:**
- Wszystkie inne rollbacki failed
- Multiple systems down
- Data corruption suspected

**Procedure:**

#### 1. Pause incoming traffic (opcjonalnie)
```bash
# Vercel: Deployment Protection
# Enable password dla całej app (temporary maintenance mode)
```

#### 2. Restore Database
```bash
# Supabase Dashboard → Database → Backups
# Select restore point (np. 1h ago)
# Kliknij "Restore"
# ⚠️ To OVERWRITE current database!
```

#### 3. Rollback Vercel
```bash
# See SCENARIO 1
vercel rollback
```

#### 4. Rollback Edge Functions
```bash
# Redeploy all functions z previous commit
git checkout <last-working-commit> -- supabase/functions/
supabase functions deploy --all
```

#### 5. Verify & Resume
```bash
# Run SMOKE_TEST_PLAN.md
# If PASS → Resume traffic
```

**Timeline:** 10-30 minut  
**Risk:** **EXTREME HIGH** (data loss możliwa)  
**Approval:** Wymaga approval od project owner/CTO

---

## 📊 ROLLBACK CHECKLIST

**Przed rollback:**
- [ ] Zidentyfikuj scope (frontend/backend/DB?)
- [ ] Backup database (jeśli DB involved)
- [ ] Notify team (#incidents channel)
- [ ] Document symptoms

**Podczas rollback:**
- [ ] Execute rollback procedure (scenario above)
- [ ] Monitor error rates (Sentry/logs)
- [ ] Verify critical paths (smoke test)

**Po rollback:**
- [ ] Notify users (jeśli było downtime)
- [ ] Document root cause
- [ ] Create postmortem issue
- [ ] Schedule fix + redeployment

---

## 🔄 POST-ROLLBACK ACTIONS

### 1. Root Cause Analysis (RCA)
```markdown
## Incident Report

**Date:** YYYY-MM-DD
**Duration:** XX minutes
**Severity:** P0/P1/P2

**Symptom:**
[What users experienced]

**Root Cause:**
[Technical reason]

**Fix:**
[How we fixed it]

**Prevention:**
- [ ] Add test coverage
- [ ] Improve monitoring
- [ ] Update deployment checklist
```

### 2. Fix Forward
```bash
# NIE deploy ponownie tego samego kodu!
# Najpierw fix issue:

git checkout -b hotfix/issue-description
# Fix code
git commit -m "fix: issue description"
git push

# Test thoroughly
npm test
npm run build

# Deploy via PR (nie direct push)
```

### 3. Incident Review
- Schedule team postmortem (30 min)
- Identify gaps w testing/monitoring
- Update runbooks/documentation

---

## 📞 ESCALATION

**Jeśli rollback NIE rozwiązuje problemu:**

### Level 1: On-call Engineer
- Attempt rollback (procedures above)
- Monitor 5 min po rollback

### Level 2: Senior DevOps/Backend Lead
- Jeśli rollback failed lub partial
- Database issues
- Multi-system failures

### Level 3: CTO/Technical Owner
- Data corruption suspected
- Security breach
- Nuclear option needed (full restore)

**Contact:**
- Slack: #incidents
- Phone: [On-call rotation]

---

## 🎯 SUCCESS CRITERIA

**Rollback successful jeśli:**
- ✅ Error rate <1% (Sentry)
- ✅ Smoke tests PASS
- ✅ No data loss confirmed
- ✅ Users can access app normally

**Rollback failed jeśli:**
- ❌ Errors persist
- ❌ New errors introduced
- ❌ Data inconsistencies

**Action:** Escalate to Level 2/3

---

## 🔐 SECURITY NOTE

**Jeśli rollback triggered przez security issue:**
1. **DO NOT** rollback - może expose vulnerability
2. Patch forward (hotfix)
3. Notify security team
4. Follow security incident protocol

---

**Owner:** DevOps Team  
**Last Updated:** 2025-12-27  
**Next Review:** Po każdym major incident
