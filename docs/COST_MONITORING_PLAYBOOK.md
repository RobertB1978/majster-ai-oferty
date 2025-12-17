# Cost Monitoring & Alerts Playbook

**TIER 2.1 - Prevent Surprise Bills**

**Manifest compliance:**
- ✅ Fail fast (alerts before disaster)
- ✅ Automate what repeats (monitoring)
- ✅ Playbook = komenda + expected output

---

## Why Cost Monitoring Matters

**Business Risk Without Monitoring:**
- Surprise $1000+ bills (API abuse, database runaway)
- No budget predictability
- Unprofitable scaling

**Current Stack Costs (Estimated):**

### Free Tier / Development
```
Vercel:         $0 (Hobby plan)
Supabase:       $0 (Free tier, 500MB DB, 2GB bandwidth/month)
Resend:         $0 (100 emails/day free)
Stripe:         $0 (no monthly fee, 2.9% + $0.30 per transaction)
OpenAI:         Pay-per-use (~$0.002 per request)
Total:          ~$0-10/month (development)
```

### Production (Estimate at 1000 users)
```
Vercel Pro:     $20/month (100GB bandwidth, analytics)
Supabase Pro:   $25/month (8GB DB, 50GB bandwidth, backups)
Resend:         $20/month (50k emails)
Stripe:         Transaction fees only (2.9% + $0.30)
OpenAI/AI:      $50-200/month (usage-based)
PostHog:        $0-50/month (1M events free)
Sentry:         $0 (developer plan, 5k errors/month)
──────────────────────────────────────────
Total:          $115-315/month
Revenue/user:   $10-20/month (subscription)
──────────────────────────────────────────
Break-even:     ~10-30 paying users
Profitable at:  100+ users
```

**Alert Thresholds:**
- ⚠️ Warning: > $200/month
- 🚨 Critical: > $500/month
- 🔥 Emergency: > $1000/month

---

## Service-Specific Monitoring

### 1. Vercel (Frontend Hosting)

**What to Monitor:**
- Bandwidth usage (GB/month)
- Build minutes
- Serverless function invocations
- Edge Middleware requests

**Setup Monitoring:**

**Via Vercel Dashboard:**
1. Go to https://vercel.com/dashboard
2. Select project → Usage tab
3. View current month usage

**Expected Values (Hobby/Free):**
```
Bandwidth:      < 100 GB/month
Builds:         < 100/month
Functions:      N/A (no serverless on Hobby)
```

**Alerts (Manual):**
- Add to calendar: Check Vercel usage weekly
- If > 80GB bandwidth → Upgrade to Pro ($20/month)

**Automated Alert (via Vercel API):**
```bash
#!/bin/bash
# save as: scripts/check-vercel-usage.sh

VERCEL_TOKEN="your_vercel_token"
TEAM_ID="your_team_id"

usage=$(curl -s -H "Authorization: Bearer $VERCEL_TOKEN" \
  "https://api.vercel.com/v1/teams/$TEAM_ID/usage")

bandwidth=$(echo $usage | jq '.bandwidth.total')
bandwidth_gb=$((bandwidth / 1024 / 1024 / 1024))

if [ $bandwidth_gb -gt 80 ]; then
  echo "⚠️ WARNING: Vercel bandwidth at ${bandwidth_gb}GB (limit: 100GB)"
  # Send alert (email, Slack, etc.)
fi
```

**Run weekly via cron:**
```bash
# Add to crontab: crontab -e
0 9 * * 1 /path/to/scripts/check-vercel-usage.sh
```

---

### 2. Supabase (Backend/Database)

**What to Monitor:**
- Database size (GB)
- Bandwidth (GB/month)
- Storage (GB)
- Edge Function invocations
- Realtime connections

**Setup Monitoring:**

**Via Supabase Dashboard:**
1. Go to https://supabase.com/dashboard/project/YOUR_PROJECT/settings/billing
2. View "Current Usage"

**Expected Values (Free Tier):**
```
Database:       < 500 MB
Bandwidth:      < 2 GB/month
Storage:        < 1 GB
Auth Users:     < 50,000
Realtime:       < 200 concurrent
```

**Alert Thresholds:**
```
Database:       > 400 MB (80% of 500MB) → WARNING
Bandwidth:      > 1.6 GB (80% of 2GB) → WARNING
```

**Automated Alert (via Supabase API):**
```bash
#!/bin/bash
# save as: scripts/check-supabase-usage.sh

SUPABASE_URL="https://api.supabase.com/v1"
SUPABASE_ACCESS_TOKEN="your_access_token"
PROJECT_REF="your_project_ref"

usage=$(curl -s -H "Authorization: Bearer $SUPABASE_ACCESS_TOKEN" \
  "$SUPABASE_URL/projects/$PROJECT_REF/usage")

db_size=$(echo $usage | jq '.database.size')
db_size_mb=$((db_size / 1024 / 1024))

if [ $db_size_mb -gt 400 ]; then
  echo "⚠️ WARNING: Database at ${db_size_mb}MB (limit: 500MB)"
  echo "Action: Upgrade to Pro ($25/month) or clean old data"
fi
```

**SQL Query for Database Size:**
```sql
-- Run in Supabase SQL Editor
SELECT
  pg_size_pretty(pg_database_size('postgres')) as total_size,
  (
    SELECT pg_size_pretty(SUM(pg_total_relation_size(quote_ident(schemaname) || '.' || quote_ident(tablename)))::bigint)
    FROM pg_tables
    WHERE schemaname = 'public'
  ) as public_schema_size;
```

Expected:
```
total_size      | public_schema_size
145 MB          | 120 MB
```

---

### 3. OpenAI / AI Provider

**What to Monitor:**
- API requests/month
- Token usage (input + output)
- Cost per request
- Failed requests (waste of money)

**Setup Monitoring:**

**Via OpenAI Dashboard:**
1. Go to https://platform.openai.com/usage
2. View current month usage

**Expected Values (1000 users, moderate AI use):**
```
Requests:       ~10,000/month (10 per user)
Tokens:         ~5M tokens/month
Cost:           $50-200/month
  GPT-4:        $0.03/1k input + $0.06/1k output
  GPT-3.5:      $0.0015/1k input + $0.002/1k output
```

**Alert Thresholds:**
```
Cost/day:       > $10 → WARNING
Cost/month:     > $300 → CRITICAL
```

**Automated Monitoring (Edge Function):**

Create: `supabase/functions/monitor-ai-costs/index.ts`
```typescript
import { createClient } from '@supabase/supabase-js';

Deno.serve(async (req) => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

  // Get AI usage from logs (last 24h)
  const { data: logs } = await supabase
    .from('edge_function_logs')
    .select('*')
    .gte('timestamp', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
    .like('function_name', '%ai-%');

  const requestCount = logs?.length || 0;
  const estimatedCost = requestCount * 0.02; // ~$0.02 per AI request

  if (estimatedCost > 10) {
    console.warn(`⚠️ AI costs: $${estimatedCost.toFixed(2)}/day`);
    // Send alert
  }

  return new Response(JSON.stringify({ requestCount, estimatedCost }));
});
```

**Deploy and schedule:**
```bash
supabase functions deploy monitor-ai-costs

# Add to pg_cron (daily at 9 AM)
SELECT cron.schedule(
  'daily-ai-cost-check',
  '0 9 * * *',
  $$SELECT net.http_post('https://YOUR_PROJECT.supabase.co/functions/v1/monitor-ai-costs')$$
);
```

---

### 4. Stripe (Payment Processing)

**What to Monitor:**
- Transaction fees (2.9% + $0.30)
- Failed payments (lost revenue)
- Chargebacks (cost + penalty)
- Refunds (revenue loss)

**Setup Monitoring:**

**Via Stripe Dashboard:**
1. Go to https://dashboard.stripe.com/
2. Click "Reports" → "Balance"
3. View fees, refunds, disputes

**Expected Values (100 paying users @ $10/month):**
```
Gross Revenue:  $1000/month
Stripe Fees:    ~$59/month (2.9% + $0.30 per transaction)
Net Revenue:    ~$941/month
```

**Alerts:**
- High chargeback rate > 1% → Risk of Stripe account suspension
- Failed payments > 10% → Payment method issues

**Webhook for Monitoring:**

Already have `stripe-webhook` function. Add monitoring:

```typescript
// In stripe-webhook/index.ts, add logging
case 'charge.failed':
  const failedCharge = event.data.object as Stripe.Charge;
  console.error(`Payment failed: ${failedCharge.id}, reason: ${failedCharge.failure_message}`);

  // Track failed payments
  await supabase.from('payment_failures').insert({
    stripe_charge_id: failedCharge.id,
    customer_id: failedCharge.customer,
    amount: failedCharge.amount,
    failure_reason: failedCharge.failure_message,
  });
  break;
```

---

### 5. Resend (Email Sending)

**What to Monitor:**
- Emails sent/month
- Bounce rate
- Spam complaints
- API errors

**Setup Monitoring:**

**Via Resend Dashboard:**
1. Go to https://resend.com/emails
2. View delivery stats

**Expected Values:**
```
Free Tier:      100 emails/day
Paid ($20):     50,000 emails/month
Bounce Rate:    < 2%
Spam Rate:      < 0.1%
```

**Alert Thresholds:**
```
Emails/day:     > 80 (80% of free limit) → WARNING
Bounce Rate:    > 5% → Deliverability issue
```

**Automated Monitoring:**
```bash
#!/bin/bash
# save as: scripts/check-resend-usage.sh

RESEND_API_KEY="your_resend_api_key"

usage=$(curl -s -H "Authorization: Bearer $RESEND_API_KEY" \
  "https://api.resend.com/emails/stats")

sent_today=$(echo $usage | jq '.sent_today')

if [ $sent_today -gt 80 ]; then
  echo "⚠️ WARNING: Sent ${sent_today} emails today (limit: 100)"
  echo "Action: Upgrade to paid plan ($20/month)"
fi
```

---

## Consolidated Monitoring Dashboard

### Option 1: Simple Spreadsheet (Manual, 5 min/week)

**Google Sheets Template:**
```
Date       | Vercel | Supabase | OpenAI | Stripe | Resend | Total
2025-12-17 | $0     | $0       | $12    | $5     | $0     | $17
2025-12-24 | $0     | $0       | $23    | $12    | $0     | $35
```

**Action:** Update weekly, set budget alerts

---

### Option 2: Automated Dashboard (Supabase + Edge Function)

**Database Table:**
```sql
CREATE TABLE service_costs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL,
  service TEXT NOT NULL,
  cost NUMERIC(10,2) NOT NULL,
  usage_details JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX idx_service_costs_date ON service_costs(date DESC);
```

**Edge Function: `collect-costs/index.ts`**
```typescript
Deno.serve(async (req) => {
  const costs = [];

  // Fetch Vercel usage
  const vercelUsage = await fetchVercelUsage();
  costs.push({ service: 'vercel', cost: vercelUsage.cost, usage_details: vercelUsage });

  // Fetch Supabase usage
  const supabaseUsage = await fetchSupabaseUsage();
  costs.push({ service: 'supabase', cost: supabaseUsage.cost, usage_details: supabaseUsage });

  // Fetch OpenAI usage
  const openaiUsage = await fetchOpenAIUsage();
  costs.push({ service: 'openai', cost: openaiUsage.cost, usage_details: openaiUsage });

  // Save to database
  const supabase = createClient(...);
  await supabase.from('service_costs').insert(
    costs.map(c => ({ ...c, date: new Date().toISOString().split('T')[0] }))
  );

  const totalCost = costs.reduce((sum, c) => sum + c.cost, 0);

  // Alert if over threshold
  if (totalCost > 200) {
    console.warn(`⚠️ Monthly costs: $${totalCost.toFixed(2)}`);
    // Send email/Slack alert
  }

  return new Response(JSON.stringify({ costs, totalCost }));
});
```

**Schedule daily:**
```sql
SELECT cron.schedule(
  'daily-cost-collection',
  '0 0 * * *',
  $$SELECT net.http_post('https://YOUR_PROJECT.supabase.co/functions/v1/collect-costs')$$
);
```

---

## Alert Channels

### Email Alerts (via Resend)

```typescript
// In any monitoring script
async function sendCostAlert(service: string, cost: number, threshold: number) {
  await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: 'alerts@yourdomain.com',
      to: 'owner@yourdomain.com',
      subject: `🚨 Cost Alert: ${service} at $${cost}`,
      html: `
        <h2>Cost Alert</h2>
        <p><strong>${service}</strong> has reached <strong>$${cost}</strong></p>
        <p>Threshold: $${threshold}</p>
        <p>Action: Review usage and consider optimization</p>
      `,
    }),
  });
}
```

### Slack Alerts (Optional)

```typescript
async function sendSlackAlert(message: string) {
  await fetch(SLACK_WEBHOOK_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text: message }),
  });
}
```

---

## Cost Optimization Strategies

### When Costs Exceed Budget

**Database (Supabase) > $25/month:**
1. Archive old data (older than 1 year)
2. Compress large text fields
3. Remove unused indexes
4. Optimize queries (use EXPLAIN ANALYZE)

**AI (OpenAI) > $200/month:**
1. Cache common responses
2. Use GPT-3.5 instead of GPT-4 where possible
3. Reduce max_tokens in requests
4. Implement request throttling per user

**Bandwidth (Vercel) > 100GB:**
1. Optimize images (WebP, lazy loading)
2. Enable CDN caching headers
3. Reduce bundle size further
4. Use external image hosting (Cloudinary, imgix)

**Email (Resend) > 100/day:**
1. Batch notifications (daily digest instead of per-event)
2. Use in-app notifications instead of email
3. Implement user preferences (opt-out)

---

## Monthly Cost Review Checklist

**First Monday of Each Month:**
- [ ] Review Vercel usage (bandwidth, builds)
- [ ] Review Supabase usage (DB size, bandwidth)
- [ ] Review OpenAI usage (requests, tokens, cost)
- [ ] Review Stripe revenue vs fees
- [ ] Review Resend email deliverability
- [ ] Calculate total cost vs revenue
- [ ] Update cost forecast
- [ ] Identify optimization opportunities

**Metrics to Track:**
| Metric | Target | Current |
|--------|--------|---------|
| Total Monthly Cost | < $200 | ? |
| Cost per User | < $2 | ? |
| Revenue per User | > $10 | ? |
| Profit Margin | > 70% | ? |
| Runway (months) | > 6 | ? |

---

## Emergency Response: Runaway Costs

**If you see $500+ bill unexpected:**

### Step 1: Identify Source (5 min)
```bash
# Check all dashboards
- Vercel: https://vercel.com/dashboard/usage
- Supabase: https://supabase.com/dashboard/project/YOUR_PROJECT/settings/billing
- OpenAI: https://platform.openai.com/usage
- Stripe: https://dashboard.stripe.com/reports
```

### Step 2: Stop the Bleeding (10 min)
```bash
# Disable offending service
- Vercel: Pause deployments
- Supabase: Disable Edge Functions (if they're the culprit)
- OpenAI: Set spending limit in dashboard
- Resend: Pause sending if spam loop
```

### Step 3: Root Cause Analysis (30 min)
- Check logs for anomalies
- Look for retry loops
- Check for abuse (DDoS, spam)
- Review recent code changes

### Step 4: Fix & Resume (varies)
- Fix the bug/loop/abuse
- Deploy fix
- Re-enable services gradually
- Monitor closely for 24h

---

## Success Criteria

**TIER 2.1 Complete When:**
- ✅ Cost monitoring set up for all services
- ✅ Alert thresholds configured
- ✅ Monthly review process established
- ✅ Team knows how to respond to alerts
- ✅ Actual costs tracked for 1 month

---

**Last Updated:** 2025-12-17
**Owned By:** Platform Owner / Finance
**Review Frequency:** Monthly
