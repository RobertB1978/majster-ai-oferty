# Database Backup & Restore Playbook

**TIER 1.4 - Disaster Recovery Verification**

**Manifest compliance:**
- ✅ Playbook = komenda + expected output
- ✅ Reprodukuj, nie zgaduj
- ✅ System > narzędzie

---

## Why This Matters

**Business Risk Without Backups:**
- Data loss = lost customers, contracts, invoices
- No recovery = business stops
- GDPR compliance requires data protection

**Recovery Time Objective (RTO):** < 4 hours
**Recovery Point Objective (RPO):** < 24 hours

---

## Supabase Backup Configuration

### Automatic Backups (Built-in)

Supabase automatically backs up all paid projects:

**Free Tier:**
- ❌ No automatic backups
- Manual export required

**Pro Plan ($25/month):**
- ✅ Daily backups
- Retention: 7 days
- Point-in-time recovery (PITR): Last 7 days

**Team/Enterprise:**
- ✅ Daily backups
- Retention: 14-30+ days
- PITR: 14-30+ days

---

## ⚠️ Current Status Check

### Step 1: Verify Backup Configuration

**Command:**
```bash
# Check Supabase project tier
curl -X GET 'https://api.supabase.com/v1/projects' \
  -H "Authorization: Bearer $SUPABASE_ACCESS_TOKEN"
```

**Expected Output:**
```json
{
  "id": "your-project-id",
  "organization_id": "...",
  "name": "majster-ai-oferty",
  "plan": "pro",  // ← Should be "pro" or higher
  "region": "eu-central-1"
}
```

**Manual Check (Recommended):**
1. Go to https://supabase.com/dashboard/project/YOUR_PROJECT/settings/general
2. Check "Plan" section
3. Verify: **Pro** or higher ✅
4. If Free: **UPGRADE IMMEDIATELY** ⚠️

---

## 🧪 Backup Test Procedure

### Test 1: Verify Backup Exists

**Frequency:** Monthly
**Duration:** 5 minutes
**Risk:** None (read-only)

**Steps:**
1. Go to https://supabase.com/dashboard/project/YOUR_PROJECT/database/backups
2. Verify you see backup list
3. Check latest backup date (should be < 24h)
4. Check backup size (should be > 0 MB)

**Expected Output:**
```
Backup Date       | Size      | Status
2025-12-17 03:00 | 145.2 MB  | ✅ Completed
2025-12-16 03:00 | 143.8 MB  | ✅ Completed
2025-12-15 03:00 | 142.1 MB  | ✅ Completed
```

**❌ If No Backups Shown:**
```bash
# CRITICAL: Upgrade plan immediately
# This is a P0 issue - data is at risk!
```

---

### Test 2: Test Restore to Staging (Recommended)

**Frequency:** Quarterly
**Duration:** 30 minutes
**Risk:** Low (isolated test project)

**Prerequisites:**
- Staging Supabase project (separate from production)
- Database dump from production backup

**Steps:**

1. **Download Backup** (from Production):
   ```bash
   # Via Supabase CLI
   supabase db dump -f backup_$(date +%Y%m%d).sql \
     --db-url "postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres"
   ```

   Expected: `backup_20251217.sql` file created (~100-500 MB)

2. **Create Staging Project**:
   - Go to https://supabase.com/dashboard
   - Click "New Project"
   - Name: "majster-ai-staging"
   - Region: Same as production
   - Database Password: Save securely

3. **Restore to Staging**:
   ```bash
   # Upload backup to staging
   psql "postgresql://postgres:[STAGING-PASSWORD]@db.[STAGING-REF].supabase.co:5432/postgres" \
     < backup_20251217.sql
   ```

   Expected output:
   ```
   CREATE TABLE
   CREATE TABLE
   ... (many lines)
   ALTER TABLE
   COPY 1250  ← Number of rows restored
   ```

4. **Verify Restored Data**:
   ```sql
   -- Connect to staging database
   psql "postgresql://postgres:[STAGING-PASSWORD]@db.[STAGING-REF].supabase.co:5432/postgres"

   -- Check tables exist
   \dt

   -- Expected output:
   -- projects (should have rows)
   -- clients (should have rows)
   -- quotes (should have rows)
   -- etc.

   -- Check row counts
   SELECT
     'projects' as table, COUNT(*) as rows FROM projects
   UNION ALL
   SELECT 'clients', COUNT(*) FROM clients
   UNION ALL
   SELECT 'quotes', COUNT(*) FROM quotes;
   ```

   Expected:
   ```
    table    | rows
   ----------+------
    projects | 1250
    clients  | 450
    quotes   | 890
   ```

5. **Test Application Connection**:
   ```bash
   # Update .env.local to point to staging
   VITE_SUPABASE_URL=https://[STAGING-REF].supabase.co
   VITE_SUPABASE_ANON_KEY=[STAGING-ANON-KEY]

   # Start app
   npm run dev

   # Test:
   # 1. Login with test user
   # 2. View projects list (should show restored data)
   # 3. Open a project (should load details)
   # 4. View clients list
   ```

   **✅ Success Criteria:**
   - App loads without errors
   - Can log in
   - Data is visible and correct
   - No broken references

6. **Cleanup**:
   ```bash
   # Delete staging project after test
   # Or keep it for testing new features
   ```

---

### Test 3: Point-in-Time Recovery (PITR) Test

**Frequency:** Annually or after major incidents
**Duration:** 1 hour
**Risk:** Medium (requires coordination)

**Only available on Pro plan or higher.**

**Steps:**
1. Go to https://supabase.com/dashboard/project/YOUR_PROJECT/database/backups
2. Click "Point-in-Time Recovery"
3. Select timestamp (e.g., "4 hours ago")
4. Review changes that will be restored
5. **Test on staging first!**
6. Click "Restore"

**Expected:**
- Database reverted to selected point in time
- Recent changes after that point are lost
- Application continues to work

---

## 🚨 Disaster Recovery Procedure

**When to Use:** Production database corruption, accidental deletion, ransomware

**Emergency Contact:**
- Supabase Support: https://supabase.com/dashboard/support
- Priority: P0 - Production Down

**Steps:**

### Step 1: Assess Damage (5 min)
```sql
-- Check if tables exist
\dt

-- Check row counts
SELECT COUNT(*) FROM projects;
SELECT COUNT(*) FROM clients;
SELECT COUNT(*) FROM quotes;

-- Compare to expected numbers (from monitoring)
```

### Step 2: Stop Write Operations (Immediate)
```bash
# Disable Edge Functions
supabase functions list  # Note all functions
supabase functions delete [function-name]  # Repeat for all

# Or: Set maintenance mode in app
# (prevents users from making changes during recovery)
```

### Step 3: Restore from Backup (30 min)

**Option A: Via Supabase Dashboard (Recommended)**
1. Go to Backups page
2. Click "Restore" on latest good backup
3. Confirm restore
4. Wait for completion (10-30 min)

**Option B: Via CLI**
```bash
# Download backup
supabase db dump -f emergency_restore.sql \
  --db-url "[BACKUP-CONNECTION-STRING]"

# Restore
psql "[PRODUCTION-CONNECTION-STRING]" < emergency_restore.sql
```

### Step 4: Verify Restoration (10 min)
```sql
-- Check tables
\dt

-- Check row counts
SELECT COUNT(*) FROM projects;  -- Should match pre-disaster count
SELECT COUNT(*) FROM clients;
SELECT COUNT(*) FROM quotes;

-- Spot check recent records
SELECT * FROM projects ORDER BY created_at DESC LIMIT 10;
```

### Step 5: Re-enable Services (5 min)
```bash
# Redeploy Edge Functions
supabase functions deploy

# Remove maintenance mode
# Test app functionality
```

### Step 6: Post-Mortem (1 hour)
Document:
- What happened?
- What data was lost?
- How long was downtime?
- What can prevent this?

---

## 📊 Backup Monitoring

### Automated Checks

Create a monthly calendar reminder:
- **Day 1 of month:** Run Test 1 (Verify Backup Exists)
- **First Monday of quarter:** Run Test 2 (Restore to Staging)

### Metrics to Track

| Metric | Target | Alert If |
|--------|--------|----------|
| Backup Age | < 24h | > 48h |
| Backup Size | 100-500 MB | < 10 MB or > 5 GB |
| Restore Test Success | 100% | Any failure |
| RTO (Recovery Time) | < 4h | > 4h |
| RPO (Data Loss) | < 24h | > 24h |

---

## ✅ Pre-Production Checklist

Before going live, verify:

- [ ] Supabase project is on **Pro plan or higher**
- [ ] Automatic backups are **enabled**
- [ ] Latest backup is **< 24 hours old**
- [ ] Backup restore has been **tested successfully** (Test 2)
- [ ] Emergency contacts are **documented**
- [ ] Team knows how to **access backups**
- [ ] Disaster recovery playbook is **bookmarked**

---

## 📚 References

- [Supabase Backup Documentation](https://supabase.com/docs/guides/platform/backups)
- [PostgreSQL Backup Best Practices](https://www.postgresql.org/docs/current/backup.html)
- [Disaster Recovery Planning](https://www.supabase.com/docs/guides/platform/going-into-prod)

---

## 🎯 Success Criteria

**TIER 1.4 Complete When:**
- ✅ Backups are configured and verified
- ✅ Restore procedure has been tested (at least once)
- ✅ Team knows how to perform recovery
- ✅ Monitoring is in place
- ✅ This playbook is accessible and up-to-date

---

**Last Updated:** 2025-12-17
**Next Test Due:** 2026-01-01 (monthly verification)
**Owned By:** Platform Owner / DevOps
