# Plan Limits — Operational Reference

**Status:** Live as of migration `20260223000001_server_side_plan_limits.sql`

---

## 1. Where is the plan stored?

| Layer | Table / Field | Notes |
|---|---|---|
| Subscription record | `public.user_subscriptions.plan_id` | One row per user (`UNIQUE user_id`). Values: `free`, `pro`, `starter`, `business`, `enterprise` |
| Subscription status | `public.user_subscriptions.status` | Active enforcement only for `active` or `trial` status |
| Plan limits (server) | `public.plan_limits` | Authoritative numeric limits table (see §2) |
| Plan limits (client) | `src/hooks/usePlanGate.ts` `PLAN_LIMITS` | UI-only hints; must match `plan_limits` table |

---

## 2. How limits are calculated

### `plan_limits` table

```
plan_id     | max_projects | max_clients | max_offers
------------+--------------+-------------+-----------
free        |            3 |           5 |          3
pro         |           15 |          30 |         15
starter     |           15 |          30 |         15
business    |          100 |         200 |        100
enterprise  |  2147483647  |  2147483647 |  2147483647
```

`max_offers` = maximum number of **distinct projects** a user may send offers for.
Re-sending an offer to a project that already has one is always permitted (no additional slot consumed).

### Resolution order (`get_user_plan_limits`)

```
user_subscriptions (status IN ('active','trial'))
  ↓ found → use that plan's limits
  ↓ not found → fallback to 'free' limits
```

Users without a subscription row, or with a `cancelled`/`expired` subscription,
are treated as `free`.

---

## 3. Enforcement mechanism

Three **BEFORE INSERT** triggers enforce limits at the database layer.
They fire for every INSERT regardless of how the call is made (Supabase client,
direct API call, service-role key, psql).

| Trigger | Table | Counts |
|---|---|---|
| `trg_enforce_project_limit` | `public.projects` | `COUNT(*)` WHERE `user_id = NEW.user_id` |
| `trg_enforce_offer_limit` | `public.offer_approvals` | `COUNT(DISTINCT project_id)` WHERE `user_id = NEW.user_id` (resends exempt) |
| `trg_enforce_client_limit` | `public.clients` | `COUNT(*)` WHERE `user_id = NEW.user_id` |

### Error raised on violation

```sql
RAISE EXCEPTION 'PLAN_LIMIT_REACHED'
  USING
    DETAIL = 'Project limit reached. Your plan allows a maximum of 3 project(s). Current count: 3.',
    HINT   = 'Upgrade your plan to create more projects.';
```

Supabase translates this to the following JSON error in the client:

```json
{
  "error": {
    "message": "PLAN_LIMIT_REACHED",
    "code":    "P0001",
    "details": "Project limit reached. ...",
    "hint":    "Upgrade your plan ..."
  }
}
```

Frontend detection:

```typescript
if (error?.message === 'PLAN_LIMIT_REACHED') {
  // show upgrade prompt
}
```

---

## 4. Helper functions

### `get_user_plan_limits(user_id UUID) → plan_limits`

Returns the applicable `plan_limits` row for a user.
SECURITY DEFINER, read-only, search_path locked to `public`.

### `verify_plan_limits_enforced(user_id UUID)`

Operator smoke-test. Run in Supabase SQL editor:

```sql
SELECT * FROM public.verify_plan_limits_enforced('<user-uuid>');
```

Returns:

```
check_name                  | plan_id | limit_value | current_count | status
----------------------------+---------+-------------+---------------+---------------
projects                    | free    |           3 |             2 | UNDER_LIMIT
clients                     | free    |           5 |             1 | UNDER_LIMIT
offers (distinct projects)  | free    |           3 |             0 | UNDER_LIMIT
```

---

## 5. Modifying plan limits

1. Update the `plan_limits` table directly via a new migration:

```sql
-- Example: raise business plan project limit to 200
UPDATE public.plan_limits SET max_projects = 200 WHERE plan_id = 'business';
```

2. Update `src/hooks/usePlanGate.ts` `PLAN_LIMITS` to match.
3. Update `src/hooks/useSubscription.ts` `features` object to match.

> **Never edit** `20260223000001_server_side_plan_limits.sql` after it has been applied.
> Always create a **new migration** for any subsequent change.

---

## 6. Rollback procedure

### Step 1 — Remove triggers

```sql
DROP TRIGGER IF EXISTS trg_enforce_project_limit ON public.projects;
DROP TRIGGER IF EXISTS trg_enforce_offer_limit   ON public.offer_approvals;
DROP TRIGGER IF EXISTS trg_enforce_client_limit  ON public.clients;
```

### Step 2 — Remove trigger functions

```sql
DROP FUNCTION IF EXISTS public.enforce_project_limit();
DROP FUNCTION IF EXISTS public.enforce_offer_limit();
DROP FUNCTION IF EXISTS public.enforce_client_limit();
```

### Step 3 — Remove helper functions

```sql
DROP FUNCTION IF EXISTS public.get_user_plan_limits(UUID);
DROP FUNCTION IF EXISTS public.verify_plan_limits_enforced(UUID);
```

### Step 4 — Remove plan_limits table

```sql
DROP TABLE IF EXISTS public.plan_limits;
```

> After rollback, plan limits are enforced **client-side only** (UI layer).
> Users can bypass limits via direct API calls until enforcement is re-applied.

### Step 5 — Deploy via migration

Wrap the SQL above in a new timestamped migration file and apply it.
Do **not** modify or delete the original migration file.

---

## 7. Testing enforcement directly (bypassing the UI)

Use `psql` or Supabase SQL editor with a user JWT to confirm triggers fire:

```sql
-- As a free-plan user who already has 3 projects:
INSERT INTO public.projects (user_id, client_id, project_name)
VALUES ('<user-id>', '<client-id>', 'Should fail');
-- Expected: ERROR: PLAN_LIMIT_REACHED
```

Or run the smoke-test function:

```sql
SELECT * FROM public.verify_plan_limits_enforced('<user-id>');
```

---

## 8. Files changed in this delta

| File | Purpose |
|---|---|
| `supabase/migrations/20260223000001_server_side_plan_limits.sql` | All DB objects: table, triggers, functions |
| `src/test/hooks/planLimits.test.ts` | Vitest tests for error code contract |
| `docs/ops/plan-limits.md` | This document |
