# Supabase Backups & PITR Guide

**Purpose:** Ensure database can be restored in case of data loss or corruption
**Priority:** P1 (High) - Critical for production
**Setup Time:** ~15 minutes

---

## Why Backups Matter

Data loss can happen due to:
- **User error:** Accidental deletion, wrong update
- **App bug:** Code that corrupts or deletes data
- **Malicious action:** Compromised account, SQL injection
- **Infrastructure failure:** Database corruption (rare)

**Without backups:** Data loss is permanent and irrecoverable.

---

## Supabase Backup Features

Supabase provides two backup mechanisms:

### 1. Daily Automated Backups

**What:** Full database snapshots taken daily
**Retention:** 7 days (Free/Pro), 30 days (Team/Enterprise)
**When to use:** Restore from yesterday's backup
**Cost:** Included in all plans

### 2. Point-in-Time Recovery (PITR)

**What:** Restore database to ANY point in time (down to the second)
**Retention:** 7-30 days depending on plan
**When to use:** Restore from 2 hours ago, yesterday at 3 PM, etc.
**Cost:** **Pro plan or higher** ($25/month) - **NOT available on Free plan**

---

## Check Your Current Plan

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project: `majster-ai-oferty`
3. Go to **Settings → Billing**
4. Check current plan:
   - **Free:** Daily backups only (7 days)
   - **Pro:** PITR available (7-30 days)
   - **Team/Enterprise:** Extended PITR (30+ days)

---

## Setup 1: Enable Daily Backups (Free Plan)

Daily backups are **enabled by default** on all plans.

### Verify Backups Are Running

1. Go to **Settings → Backups**
2. You should see:
   - ✅ "Daily backups enabled"
   - List of recent backups (last 7 days)

### Test Restore (Dry Run)

⚠️ **Do NOT restore to production - use test project**

1. Create a test Supabase project
2. Go to test project → **Settings → Backups**
3. Find a backup
4. Click **Restore**
5. Confirm restore (this will **OVERWRITE** current database)
6. Wait 5-10 minutes for restore to complete
7. Verify data restored correctly

**Important:** Restoring a backup **OVERWRITES** the entire database. Always verify first.

---

## Setup 2: Enable Point-in-Time Recovery (Pro Plan)

⚠️ **Requires Pro plan ($25/month)**

### Step 1: Upgrade to Pro Plan

1. Go to **Settings → Billing**
2. Click **Upgrade to Pro**
3. Enter payment information
4. Confirm upgrade ($25/month)

### Step 2: Enable PITR

1. After upgrading, go to **Settings → Backups**
2. Find "Point-in-Time Recovery (PITR)" section
3. Click **Enable PITR**
4. Select retention period:
   - 7 days (standard)
   - 14 days
   - 30 days (recommended for production)
5. Confirm - PITR will be enabled within 1 hour

### Step 3: Verify PITR is Active

1. Go to **Settings → Backups**
2. You should see:
   - ✅ "Point-in-Time Recovery enabled"
   - "WAL (Write-Ahead Log) archiving: Active"

---

## Restore Procedures

### Restore from Daily Backup

**Use case:** "We need to restore from yesterday"

1. Go to **Settings → Backups**
2. Find the backup from desired date
3. Click **Restore** next to backup
4. **CONFIRM:** This will overwrite current database
5. Wait 5-10 minutes
6. Verify data restored correctly
7. **Restart app** (clear connections)

### Restore from PITR (Specific Timestamp)

**Use case:** "We need to restore from 2 hours ago"

1. Go to **Settings → Backups**
2. Click **Point-in-Time Recovery**
3. Select date and time (e.g., "2025-12-17 14:30:00")
4. Click **Restore to this point**
5. **CONFIRM:** This will overwrite current database
6. Wait 5-10 minutes
7. Verify data restored correctly
8. **Restart app** (clear connections)

---

## Backup Best Practices

### 1. Regular Backup Verification

**Monthly:** Download and verify a backup

```bash
# Download backup using Supabase CLI
supabase db dump --db-url postgresql://postgres:[PASSWORD]@db.[PROJECT].supabase.co:5432/postgres > backup.sql

# Check file size (should be > 0)
ls -lh backup.sql

# Optional: Restore to local Postgres to verify
createdb test_restore
psql test_restore < backup.sql
```

### 2. Critical Operation Procedure

**Before any risky database operation:**

1. **Announce downtime** (if applicable)
2. **Take manual backup:**
   ```bash
   supabase db dump --db-url [CONNECTION_STRING] > pre-migration-backup.sql
   ```
3. **Perform operation** (migration, bulk update, etc.)
4. **Verify success**
5. **If failure:** Restore from backup immediately

### 3. Testing Restores

**Quarterly:** Test full restore procedure

1. Create a test Supabase project
2. Restore production backup to test project
3. Verify:
   - All tables present
   - Row counts match
   - Sample queries work
   - RLS policies work
4. Document restore time (for RTO planning)

### 4. Backup Retention Policy

**Recommended:**
- **Daily backups:** Keep 7 days (Supabase automatic)
- **Manual backups:** Keep before major releases (30-90 days)
- **PITR:** 30 days retention (if on Pro plan)

### 5. Off-Site Backups (Extra Safety)

**For critical production:**

Store manual backups off-site (S3, Google Drive, etc.)

```bash
# Weekly manual backup to S3
supabase db dump --db-url [CONNECTION_STRING] | gzip > backup-$(date +%Y%m%d).sql.gz
aws s3 cp backup-$(date +%Y%m%d).sql.gz s3://my-backups/majster-ai/
```

---

## Disaster Recovery Plan

### Scenario 1: Accidental Data Deletion

**User deleted all offers by mistake**

1. **Immediate action:** STOP the app (prevent further changes)
2. **Identify timestamp:** When did deletion occur?
3. **Restore from PITR:** Select timestamp BEFORE deletion
4. **Alternative (no PITR):** Restore from last daily backup (may lose up to 24h of data)
5. **Verify restoration:** Check deleted data is back
6. **Restart app**

**Recovery Time Objective (RTO):** 10-15 minutes with PITR

### Scenario 2: Database Corruption

**Database returns errors, data looks corrupted**

1. **Check Supabase Status:** https://status.supabase.com
2. **If Supabase issue:** Wait for resolution
3. **If our issue:**
   - Restore from PITR (1 hour ago)
   - OR restore from last daily backup
4. **Verify data integrity**
5. **Investigate root cause**

### Scenario 3: Migration Gone Wrong

**Migration script corrupted data**

1. **STOP migration** if still running
2. **Restore from manual backup** taken before migration
3. **Fix migration script**
4. **Test migration on test project**
5. **Re-run migration**

### Scenario 4: Complete Database Loss

**Supabase project deleted or unrecoverable**

1. **Create new Supabase project**
2. **Restore from latest off-site backup** (if available)
3. **OR contact Supabase support** for project recovery
4. **Update ENV variables** in Vercel with new Supabase URL
5. **Redeploy app**

**Recovery Time Objective (RTO):** 30-60 minutes with off-site backups

---

## Backup Checklist for Production

### Pre-Launch (Required)

- [ ] Verify daily backups are enabled in Supabase
- [ ] Test restore procedure on test project
- [ ] Document recovery procedures
- [ ] Decide: Do we need PITR? (Recommended: Yes)
- [ ] If PITR needed: Upgrade to Pro plan and enable

### Post-Launch (Recommended)

- [ ] Set up manual weekly/monthly backups to S3/GCS
- [ ] Test restore from manual backup
- [ ] Document RTO (Recovery Time Objective)
- [ ] Create disaster recovery runbook
- [ ] Train team on restore procedures

### Ongoing (Monthly)

- [ ] Verify backups are running (check Supabase dashboard)
- [ ] Test restore to test project (quarterly)
- [ ] Review backup retention policy
- [ ] Check backup storage costs

---

## Costs

### Free Plan

- ✅ Daily backups (7 days): **Included**
- ❌ PITR: **Not available**
- **Total:** $0/month

### Pro Plan

- ✅ Daily backups (7 days): **Included**
- ✅ PITR (7-30 days): **Included**
- **Total:** $25/month

**Recommendation for production:** Upgrade to Pro for PITR

---

## Monitoring Backups

### Check Backup Status

1. **Supabase Dashboard:**
   - Go to Settings → Backups
   - Verify "Last backup" timestamp is recent (< 24h)

2. **Email Notifications:**
   - Supabase sends email if backups fail
   - Check your project owner email

3. **Manual Check (Weekly):**
   ```bash
   # Test backup download works
   supabase db dump --db-url [CONNECTION_STRING] > test-backup.sql
   ```

### Alerts to Set Up

**If using monitoring tool (Sentry, etc.):**
- Alert if last backup > 48 hours old
- Alert if backup size suddenly drops (may indicate data loss)

---

## Rollback Decision Tree

```
Data issue detected
    |
    ├─ Is data critical? (YES) → Restore immediately
    └─ Is data critical? (NO) → Investigate first
           |
           ├─ Can fix manually? (YES) → Fix manually
           └─ Can fix manually? (NO) → Restore
```

**When to restore:**
- ✅ Critical data lost (user data, financial records, etc.)
- ✅ Data corruption affecting many records
- ✅ Security breach requiring rollback

**When NOT to restore:**
- ❌ Single test record deleted
- ❌ Non-critical configuration change
- ❌ Can fix with manual SQL query

**Always:** Take manual backup BEFORE restoring!

---

## Testing Your Restore Knowledge

**Quiz: Can you answer these?**

1. Where do you find backups in Supabase?
2. How long are daily backups retained on Free plan?
3. What is PITR and when would you use it?
4. What happens when you restore a backup?
5. How do you take a manual backup?
6. What is the fastest way to restore from 2 hours ago?

**Answers:**
1. Settings → Backups
2. 7 days
3. Point-in-Time Recovery - restore to any specific timestamp, use when you need precise restoration
4. It OVERWRITES the current database entirely
5. `supabase db dump --db-url [URL] > backup.sql` OR Supabase Dashboard
6. PITR (if enabled) - select timestamp and restore

---

## Additional Resources

- [Supabase Backup Docs](https://supabase.com/docs/guides/platform/backups)
- [Supabase PITR Guide](https://supabase.com/docs/guides/platform/pitr)
- [Database Disaster Recovery Best Practices](https://supabase.com/docs/guides/platform/disaster-recovery)

---

## Summary

**For Production, ensure:**
1. ✅ Daily backups enabled (automatic)
2. ✅ PITR enabled (upgrade to Pro - $25/month) - **HIGHLY RECOMMENDED**
3. ✅ Tested restore procedure
4. ✅ Manual backups before major changes
5. ✅ Off-site backups (weekly/monthly)
6. ✅ Team trained on restore procedures

**Recovery Time:**
- With PITR: ~10-15 minutes to any point in time
- Without PITR: ~10-15 minutes to last daily backup (may lose up to 24h)

**Don't wait for disaster - test your backups today!** ✅
