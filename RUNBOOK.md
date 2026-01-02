# Majster.AI - Operations Runbook

## Table of Contents
- [Scheduler System](#scheduler-system)
- [Deployment](#deployment)
- [Monitoring](#monitoring)
- [Troubleshooting](#troubleshooting)

---

## Scheduler System

### Overview

The Scheduler System (Sprint 0.7) enables scheduling offer emails for future delivery. It consists of three main components:

1. **Database Schema** - Scheduling fields in `offer_sends` table
2. **Schedule Endpoint** - API for scheduling offers (`schedule-offer`)
3. **Scheduler Worker** - Cron job that processes scheduled offers (`scheduler-worker`)

### Architecture

```
┌─────────────┐     Schedule     ┌──────────────────┐
│   Client    │ ───────────────> │ schedule-offer   │
│  (Frontend) │                  │  Edge Function   │
└─────────────┘                  └────────┬─────────┘
                                          │
                                          │ Updates
                                          ▼
                                  ┌──────────────────┐
                                  │  offer_sends     │
                                  │  (Database)      │
                                  │  status='scheduled'
                                  └────────┬─────────┘
                                          │
                                          │ Fetches due offers
                                          ▼
                                  ┌──────────────────┐
                                  │ scheduler-worker │
                                  │  (Cron Job)      │
                                  └────────┬─────────┘
                                          │
                                          │ Calls
                                          ▼
                                  ┌──────────────────┐
                                  │ send-offer-email │
                                  │  Edge Function   │
                                  └──────────────────┘
```

### Database Schema

**Table:** `offer_sends`

New columns added for scheduling:

| Column | Type | Description |
|--------|------|-------------|
| `scheduled_for` | TIMESTAMP WITH TIME ZONE | When to send (NULL = immediate) |
| `retry_count` | INTEGER | Number of retry attempts |
| `max_retries` | INTEGER | Maximum retries allowed (default: 3) |
| `last_retry_at` | TIMESTAMP WITH TIME ZONE | Last retry timestamp |
| `processed_at` | TIMESTAMP WITH TIME ZONE | When successfully processed |

**Status Values:**
- `pending` - Not yet sent (immediate send)
- `scheduled` - Scheduled for future delivery
- `sent` - Successfully sent
- `failed` - Failed after max retries

**Indexes:**
- `idx_offer_sends_scheduled_for` - Optimizes scheduler queries
- `idx_offer_sends_retry` - Optimizes retry logic

### How It Works

#### 1. Scheduling an Offer

**Endpoint:** `POST /schedule-offer`

**Request:**
```json
{
  "offerSendId": "uuid-of-offer-send-record",
  "scheduledFor": "2026-01-03T10:00:00.000Z"
}
```

**Response:**
```json
{
  "success": true,
  "offerSend": { ... },
  "message": "Offer scheduled for 2026-01-03T10:00:00.000Z"
}
```

**Authentication:** Requires user auth header

**Validation:**
- User must own the offer_send record
- scheduledFor must be in the future (timezone-aware UTC)
- Only `pending` or `scheduled` offers can be (re)scheduled

#### 2. Processing Scheduled Offers

**Endpoint:** `POST /scheduler-worker` (called by cron)

**How it works:**

1. **Fetch Due Offers**
   ```sql
   SELECT * FROM offer_sends
   WHERE status = 'scheduled'
     AND scheduled_for IS NOT NULL
     AND scheduled_for <= NOW()
   ORDER BY scheduled_for ASC
   LIMIT 50;
   ```

2. **Acquire Lock** (in-memory, single instance)
   - Prevents duplicate processing
   - 60-second TTL
   - For multi-instance: use Redis

3. **Send Email**
   - Calls `send-offer-email` Edge Function
   - Updates status to `sent` on success
   - Schedules retry on failure

4. **Retry Logic**
   - Exponential backoff: 60s, 120s, 240s, 480s, ...
   - Max delay: 3600s (1 hour)
   - After max retries: status = `failed`

**Cron Schedule:** Every 5 minutes (recommended)

```bash
# Supabase cron config (pg_cron)
SELECT cron.schedule(
  'process-scheduled-offers',
  '*/5 * * * *',  -- Every 5 minutes
  $$
  SELECT net.http_post(
    url := 'https://YOUR-PROJECT.supabase.co/functions/v1/scheduler-worker',
    headers := '{"X-Cron-Secret": "YOUR-SECRET"}'::jsonb
  );
  $$
);
```

### Timezone Handling (CRITICAL)

**Problem:** JavaScript/TypeScript can mix timezone-naive and timezone-aware datetimes, causing runtime errors:
```
TypeError: can't compare offset-naive and offset-aware datetimes
```

**Solution:** All datetime operations use timezone-aware UTC via `datetime-utils.ts`

**Key Functions:**

- `utcNow()` - Get current UTC time (always use this, not `new Date()`)
- `ensureAwareUTC(dt)` - Normalize any date to UTC ISO string
- `isDue(scheduled, now)` - Safe comparison for due dates
- `addSeconds(date, seconds)` - Add time to a date
- `exponentialBackoff(retryCount)` - Calculate retry delay

**Rules:**

1. ✅ **DO:** Use `utcNow()` for current time
2. ✅ **DO:** Store dates as `TIMESTAMP WITH TIME ZONE` in database
3. ✅ **DO:** Use ISO 8601 strings with 'Z' suffix (e.g., `2026-01-02T10:00:00.000Z`)
4. ❌ **DON'T:** Mix naive (`new Date()`) and aware datetimes
5. ❌ **DON'T:** Use `datetime.utcnow()` in Python (if adding Python services)
6. ❌ **DON'T:** Compare dates without normalizing first

### Deployment

#### 1. Deploy Migration

```bash
# Local development
npx supabase db reset

# Production
npx supabase db push
```

#### 2. Deploy Edge Functions

```bash
# Deploy all functions
npx supabase functions deploy

# Or deploy individually
npx supabase functions deploy schedule-offer
npx supabase functions deploy scheduler-worker
```

#### 3. Set Environment Variables

**Required for scheduler-worker:**

```bash
# In Supabase Dashboard → Edge Functions → Secrets
SUPABASE_URL=https://YOUR-PROJECT.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
CRON_SECRET=random-secret-string  # For authenticating cron calls
```

#### 4. Set Up Cron Job

**Option A: Supabase pg_cron (recommended)**

Run in SQL Editor:
```sql
SELECT cron.schedule(
  'process-scheduled-offers',
  '*/5 * * * *',
  $$
  SELECT net.http_post(
    url := 'https://YOUR-PROJECT.supabase.co/functions/v1/scheduler-worker',
    headers := jsonb_build_object(
      'X-Cron-Secret', 'YOUR-CRON-SECRET'
    )
  );
  $$
);
```

**Option B: External cron service** (GitHub Actions, Vercel Cron, etc.)

```yaml
# .github/workflows/scheduler.yml
name: Scheduler
on:
  schedule:
    - cron: '*/5 * * * *'  # Every 5 minutes
jobs:
  run-scheduler:
    runs-on: ubuntu-latest
    steps:
      - name: Trigger scheduler
        run: |
          curl -X POST \
            -H "X-Cron-Secret: ${{ secrets.CRON_SECRET }}" \
            https://YOUR-PROJECT.supabase.co/functions/v1/scheduler-worker
```

### Monitoring

#### Key Metrics

1. **Scheduled Offers Count**
   ```sql
   SELECT COUNT(*) FROM offer_sends WHERE status = 'scheduled';
   ```

2. **Overdue Offers** (should be near zero)
   ```sql
   SELECT COUNT(*) FROM offer_sends
   WHERE status = 'scheduled'
     AND scheduled_for < NOW();
   ```

3. **Failed Offers**
   ```sql
   SELECT COUNT(*) FROM offer_sends WHERE status = 'failed';
   ```

4. **Retry Rate**
   ```sql
   SELECT AVG(retry_count) FROM offer_sends WHERE status = 'sent';
   ```

#### Logging

All Edge Functions log to Supabase Edge Functions logs:

```bash
# View scheduler-worker logs
npx supabase functions logs scheduler-worker

# Tail logs in real-time
npx supabase functions logs scheduler-worker --tail
```

**Log Patterns:**

- `[scheduler-worker] Running scheduler tick at ...` - Worker started
- `[scheduler-worker] Found X offers due for processing` - Offers fetched
- `[scheduler-worker] Successfully processed offer ...` - Success
- `[scheduler-worker] Scheduled retry X/3 for offer ...` - Retry scheduled
- `[scheduler-worker] Offer ... marked as failed after X retries` - Max retries

### Troubleshooting

#### Issue: Offers Not Being Processed

**Symptoms:** Scheduled offers remain in `scheduled` status past their `scheduled_for` time

**Diagnosis:**

1. Check cron job is running:
   ```sql
   SELECT * FROM cron.job WHERE jobname = 'process-scheduled-offers';
   ```

2. Check scheduler-worker logs for errors:
   ```bash
   npx supabase functions logs scheduler-worker --tail
   ```

3. Manually trigger worker:
   ```bash
   curl -X POST \
     -H "X-Cron-Secret: YOUR-SECRET" \
     https://YOUR-PROJECT.supabase.co/functions/v1/scheduler-worker
   ```

**Solutions:**

- Ensure `CRON_SECRET` matches between cron job and worker
- Verify `SUPABASE_SERVICE_ROLE_KEY` is set
- Check database connectivity

#### Issue: Timezone Errors

**Symptoms:** Error logs show `TypeError: can't compare offset-naive and offset-aware datetimes`

**Diagnosis:**

Check if any code is using naive datetimes:
```typescript
// ❌ BAD: naive datetime
const now = new Date().toISOString();  // Could be naive in some contexts

// ✅ GOOD: always timezone-aware
import { utcNow } from '../_shared/datetime-utils.ts';
const now = utcNow();
```

**Solution:**

- Use `datetime-utils.ts` functions everywhere
- Ensure database columns are `TIMESTAMP WITH TIME ZONE`
- Run datetime utils tests: `deno test supabase/functions/_shared/datetime-utils.test.ts`

#### Issue: Duplicate Sends

**Symptoms:** Same offer sent multiple times

**Diagnosis:**

- Check if multiple scheduler instances are running
- Check lock mechanism logs

**Solution:**

- Implement Redis-based distributed locking for multi-instance deployments
- Increase lock TTL if workers are slow
- Add idempotency keys to email sends

#### Issue: High Retry Rate

**Symptoms:** Many offers requiring 2+ retries

**Diagnosis:**

Check error messages:
```sql
SELECT error_message, COUNT(*)
FROM offer_sends
WHERE retry_count > 0
GROUP BY error_message;
```

**Common Causes:**

- Email service rate limiting → Increase retry delay
- Network timeouts → Increase timeout in `send-offer-email`
- Invalid email addresses → Add validation before scheduling

---

## Related Documentation

- [Database Structure](./DATABASE_STRUCTURE.md)
- [AI Providers Reference](./docs/AI_PROVIDERS_REFERENCE.md)
- [Migration Guide](./docs/MIGRATION_GUIDE.md)

---

**Last Updated:** 2026-01-02
**Maintainer:** Development Team
**Version:** Sprint 0.7
