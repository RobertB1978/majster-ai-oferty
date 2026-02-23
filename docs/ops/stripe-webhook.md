# Stripe Webhook — Operations Guide

> **Audience:** operators, on-call engineers, non-technical owners.
> Plain-language explanation first; technical detail follows.

---

## What this webhook does (plain language)

Stripe sends a message to our server every time something happens with a
subscription — someone subscribes, cancels, or a payment fails. This Edge
Function receives that message and updates the user's account in our database.

---

## Security: Signature Verification

**Why it matters:** anyone on the internet could POST fake data to our webhook
URL. Stripe prevents this by signing every request with a secret key.

**How it works:**

1. Stripe sends a `Stripe-Signature` header with each request.
2. Our function reads `STRIPE_WEBHOOK_SECRET` (stored in Supabase Secrets —
   never in code or version control).
3. If the signature does not match, the request is rejected with HTTP 400.
   Business logic never runs.

**Rotate the signing secret:**

```
Stripe Dashboard → Developers → Webhooks → <endpoint> → Signing secret → Roll
```

Then update the secret in Supabase:

```
Supabase Dashboard → Edge Functions → Secrets → STRIPE_WEBHOOK_SECRET
```

---

## Idempotency: Handling Duplicate Deliveries

**Why it matters:** Stripe can deliver the same event more than once (network
retry, Stripe internal retry). Without idempotency, a single subscription
creation could create two records or charge the user twice.

### How it works

We maintain a dedicated table `stripe_events` as an idempotency store:

| Column        | Type        | Purpose                                    |
|---------------|-------------|--------------------------------------------|
| `event_id`    | TEXT (PK)   | Stripe event ID, e.g. `evt_1ABC…`         |
| `processed_at`| TIMESTAMPTZ | When we first saw this event               |
| `payload_hash`| TEXT        | Optional SHA-256 of raw body (audit/debug) |

**Processing flow:**

```
Incoming request
      │
      ▼
[1] Verify Stripe signature          ← reject fakes here
      │
      ▼
[2] INSERT event_id into stripe_events
      │
      ├─ PK conflict (duplicate) ──→ return HTTP 200 immediately, do nothing
      │
      ▼
[3] Run business logic (update user subscription)
      │
      ▼
[4] return HTTP 200
```

The INSERT in step [2] is atomic: two concurrent deliveries of the same event
cannot both succeed — only one will insert, the other will see the PK conflict.

### What "return 200 immediately" means

Stripe considers a webhook delivered when it receives HTTP 200. By returning 200
on duplicates we tell Stripe "got it, no need to retry", which stops the retry
loop. We do NOT return an error because the event _was_ successfully processed
the first time.

---

## Status Mapping (Least Privilege)

Stripe subscription statuses are mapped to our internal statuses before writing
to the database. Only `"active"` and `"trial"` grant paid-plan entitlements
(this matches the SQL plan-limits query).

| Stripe status        | Our status    | Grants access? |
|----------------------|---------------|----------------|
| `active`             | `active`      | ✅ Yes         |
| `trialing`           | `trial`       | ✅ Yes         |
| `canceled`           | `cancelled`   | ❌ No          |
| `unpaid`             | `cancelled`   | ❌ No          |
| `past_due`           | `expired`     | ❌ No          |
| `incomplete_expired` | `expired`     | ❌ No          |
| **anything else**    | **`inactive`**| ❌ **No**      |

**Security rule:** unknown or future Stripe statuses **always** map to
`"inactive"` (least privilege). This ensures a new Stripe status introduced in
the future can never accidentally grant access.

---

## Environment Variables

| Variable                  | Where set                      | Notes                             |
|---------------------------|--------------------------------|-----------------------------------|
| `STRIPE_SECRET_KEY`       | Supabase Secrets               | Stripe API key (sk_live_…)        |
| `STRIPE_WEBHOOK_SECRET`   | Supabase Secrets               | Signing secret (whsec_…)          |
| `SUPABASE_URL`            | Auto-injected by Supabase      | Project URL                       |
| `SUPABASE_SERVICE_ROLE_KEY` | Auto-injected by Supabase    | Admin key — never expose to client|

---

## Rollback Procedure

### Rollback webhook code changes

```bash
git revert HEAD          # or target the specific commit hash
git push origin claude/delta-02-stripe-idempotency-Gq7rm
```

Then redeploy the Edge Function:

```bash
npx supabase functions deploy stripe-webhook
```

### Rollback the migration

> ⚠️ Only do this if the table is empty (no production data). Dropping a table
> is irreversible.

```sql
-- Run in Supabase SQL Editor (with service role)
DROP TABLE IF EXISTS public.stripe_events;
```

If the table has rows, leave it in place — it causes no harm and can be
re-used if the feature is re-enabled.

---

## Testing Webhook Locally

```bash
# 1. Start local Supabase
npx supabase start

# 2. Run the function locally
npx supabase functions serve stripe-webhook --env-file .env.local

# 3. Forward Stripe events using Stripe CLI
stripe listen --forward-to http://localhost:54321/functions/v1/stripe-webhook

# 4. Trigger a test event
stripe trigger customer.subscription.created
```

### Verify idempotency manually

```bash
# Trigger the same event twice — second call should log "duplicate event"
stripe trigger customer.subscription.updated
stripe trigger customer.subscription.updated
```

Check Supabase logs for:
```
[stripe-webhook] Duplicate event, skipping: evt_…
```

---

## Monitoring

- **Stripe Dashboard → Developers → Webhooks → <endpoint>**: shows delivery
  history, response codes, and retry attempts.
- **Supabase Dashboard → Edge Functions → Logs**: real-time logs from the
  function.
- **Database query** to check recent events:

```sql
SELECT event_id, processed_at
FROM   public.stripe_events
ORDER  BY processed_at DESC
LIMIT  20;
```

---

## Pruning Old Records

The `stripe_events` table grows over time. Stripe event IDs are unique per
account so there is no risk of collision across years. Prune rows older than
90 days:

```sql
DELETE FROM public.stripe_events
WHERE processed_at < now() - interval '90 days';
```

Schedule this as a Supabase pg_cron job or run it manually quarterly.
