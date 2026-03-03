# DB Deploy Parity Runbook

**Purpose:** Validate that all required tables exist in the production Supabase database
after running the `Supabase Deploy Autopilot` workflow, and understand how to diagnose
PGRST205 ("Could not find the table") errors.

---

## 1. Pre-flight: Confirm the correct project ref

The canonical project ref is stored in `supabase/config.toml`:

```
project_id = "xwxvqhhnozfrjcjmcltv"
```

The GitHub Actions secret `SUPABASE_PROJECT_REF` **must** match this value exactly.
The workflow (step 4) will fail-fast with a clear error if they differ.

---

## 2. SQL Queries — Run in Supabase SQL Editor

### 2a. Check which migrations have been applied

```sql
-- Lists every migration recorded by the Supabase CLI in order.
SELECT version, name, statements
FROM supabase_migrations.schema_migrations
ORDER BY version ASC;
```

Expected: rows for every file in `supabase/migrations/`.

---

### 2b. Confirm required tables exist

```sql
-- Must return rows for all three tables.
SELECT table_name, row_security
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN ('offers', 'user_subscriptions', 'offer_approvals')
ORDER BY table_name;
```

Expected output (all 3 rows present, `row_security = 'YES'`):

| table_name         | row_security |
|--------------------|--------------|
| offer_approvals    | YES          |
| offers             | YES          |
| user_subscriptions | YES          |

If any row is missing → the corresponding migration did not apply.

---

### 2c. List ALL public tables (broader health check)

```sql
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_type = 'BASE TABLE'
ORDER BY table_name;
```

---

### 2d. Check RLS is enabled

```sql
-- Every table in this list must have rowsecurity = true.
SELECT relname AS table_name, relrowsecurity AS rls_enabled
FROM pg_class
WHERE relnamespace = 'public'::regnamespace
  AND relkind = 'r'
  AND relname IN ('offers', 'user_subscriptions', 'offer_approvals')
ORDER BY relname;
```

---

### 2e. Identify which migration creates a missing table

```sql
-- Replace 'offers' with the missing table name.
SELECT version, name
FROM supabase_migrations.schema_migrations
WHERE statements::text ILIKE '%CREATE TABLE%offers%'
   OR statements::text ILIKE '%CREATE TABLE%"offers"%';
```

---

## 3. REST Contract Gate (manual verification)

Run these commands from any terminal (replace `<ANON_KEY>` with the project's
`anon` key from Supabase → Settings → API — never commit this key).

```bash
PROJECT_REF="xwxvqhhnozfrjcjmcltv"
REST_BASE="https://${PROJECT_REF}.supabase.co/rest/v1"
ANON_KEY="<ANON_KEY>"

for table in offers user_subscriptions offer_approvals; do
  HTTP=$(curl -s -o /tmp/resp -w "%{http_code}" \
    -H "apikey: ${ANON_KEY}" \
    -H "Authorization: Bearer ${ANON_KEY}" \
    "${REST_BASE}/${table}?limit=0")
  CODE=$(python3 -c "import json; d=json.load(open('/tmp/resp')); print(d.get('code',''))" 2>/dev/null)
  echo "${table}: HTTP ${HTTP} code=${CODE:-none}"
done
```

**Expected results:**
- `HTTP 200` or `HTTP 206` → table exists, RLS allows anonymous read
- `HTTP 401` or `HTTP 403` → table exists, RLS blocks anonymous read (correct)
- `HTTP 404` + `code=PGRST205` → table **missing** → run migrations

---

## 4. Diagnosing PGRST205 errors

| Symptom | Likely Cause | Fix |
|---------|-------------|-----|
| PGRST205 on `offers` or `user_subscriptions` | Migration never ran | Re-run workflow; check step 6 logs |
| PGRST205 on `offer_approvals` | Migration never ran or wrong project linked | Verify `config.toml` project_id matches secret |
| PGRST205 on ALL tables | Wrong project ref — hitting wrong Supabase project | Fix `SUPABASE_PROJECT_REF` secret to match `config.toml` |
| Workflow step 4 fails "mismatch" | `config.toml` and `SUPABASE_PROJECT_REF` differ | Update the secret or the file to match |

---

## 5. How to re-run the deploy workflow

1. Go to: **GitHub → Actions → Supabase Deploy Autopilot → Run workflow**
2. Select branch: `main` (or `claude/fix-supabase-project-ref-JmuZm` for this PR)
3. Environment: `production`
4. Click **Run workflow**
5. Watch steps 6 (Push database migrations) and 9 (REST Contract Gate)

---

## 6. Rollback notes

- **Migrations are append-only.** To "roll back" a migration, create a new migration
  that reverses the schema change (e.g., `DROP TABLE IF EXISTS ...`).
- **Never modify files in `supabase/migrations/`** — each file is applied exactly once.
- **Table data is not affected** by re-running `supabase db push` for already-applied
  migrations (idempotent check via `schema_migrations` table).

---

## 7. Required GitHub Actions secrets

| Secret name | Description | Where to get it |
|-------------|-------------|-----------------|
| `SUPABASE_ACCESS_TOKEN` | Supabase personal access token | supabase.com → Account → Access Tokens |
| `SUPABASE_PROJECT_REF` | Must equal `xwxvqhhnozfrjcjmcltv` | Supabase → Project Settings → General |
| `SUPABASE_ANON_KEY` | Project's `anon` public key | Supabase → Project Settings → API |

To add/update secrets: **GitHub → repo → Settings → Secrets and variables → Actions → New/Edit repository secret**
