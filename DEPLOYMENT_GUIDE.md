# 🚀 Majster.AI - Complete Deployment Guide

**Status:** ✅ Ready for Production
**Estimated Time:** 60 minutes
**Last Updated:** 2025-12-28

---

## 📋 Overview

This guide will walk you through deploying Majster.AI to production in 5 steps:

1. **Database** (Supabase) - 10 minutes
2. **Edge Functions** (Supabase) - 30 minutes
3. **Secrets Configuration** (Supabase) - 10 minutes
4. **Frontend** (Vercel) - 5 minutes
5. **Verification** (Testing) - 5 minutes

**Total:** ~60 minutes

---

## ✅ Prerequisites

Before starting, ensure you have:

- [ ] Supabase account (free tier OK)
- [ ] Supabase project created: `xwvxqhhnozfrjcjmcltv`
- [ ] Vercel account (free tier OK)
- [ ] GitHub repository connected to Vercel
- [ ] Node.js 18+ installed locally
- [ ] npm or yarn installed

**Optional but recommended:**
- [ ] Resend account for emails (free: 3,000/month)
- [ ] Google Gemini API key (FREE - recommended for testing)
- [ ] Stripe account (for subscriptions - can add later)

---

## 🎯 Step 1: Deploy Database (10 minutes)

### 1.1 Open Supabase SQL Editor

Go to: https://supabase.com/dashboard/project/xwvxqhhnozfrjcjmcltv/sql

### 1.2 Copy Migration File

```bash
# On your local machine
cat supabase/DEPLOYMENT_READY_MIGRATION.sql
```

Or view on GitHub:
https://github.com/RobertB1978/majster-ai-oferty/blob/main/supabase/DEPLOYMENT_READY_MIGRATION.sql

### 1.3 Run Migration

1. Copy entire contents of `DEPLOYMENT_READY_MIGRATION.sql`
2. Paste into Supabase SQL Editor
3. Click **"Run"** button
4. Wait ~30 seconds for completion
5. Should see: **"Success. No rows returned"**

### 1.4 Verify Database

Run this verification query:
```sql
SELECT 'Tables' as check, COUNT(*)::text as result
FROM information_schema.tables
WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
UNION ALL
SELECT 'RLS Enabled', COUNT(*)::text
FROM pg_tables
WHERE schemaname = 'public' AND rowsecurity = true
UNION ALL
SELECT 'Policies', COUNT(*)::text
FROM pg_policies
WHERE schemaname = 'public';
```

**Expected Result:**
```
check        | result
-------------|-------
Tables       | 33
RLS Enabled  | 33
Policies     | 218
```

✅ If you see these numbers → Database deployed successfully!

---

## 🎯 Step 2: Deploy Edge Functions (30 minutes)

### 2.1 Install Supabase CLI

```bash
npm install -g supabase
```

### 2.2 Login to Supabase

```bash
supabase login
```

This will open a browser for authentication.

### 2.3 Run Deployment Script

```bash
cd /path/to/majster-ai-oferty
chmod +x supabase/DEPLOY_EDGE_FUNCTIONS.sh
./supabase/DEPLOY_EDGE_FUNCTIONS.sh
```

**Or deploy manually:**
```bash
# Link project
supabase link --project-ref xwvxqhhnozfrjcjmcltv

# Deploy all functions
cd supabase/functions

for func in ai-chat-agent ai-quote-suggestions analyze-photo approve-offer cleanup-expired-data create-checkout-session csp-report delete-user-account finance-ai-analysis healthcheck ocr-invoice public-api send-expiring-offer-reminders send-offer-email stripe-webhook voice-quote-processor; do
  supabase functions deploy $func --no-verify-jwt
  echo "✅ Deployed $func"
done
```

### 2.4 Verify Deployment

```bash
curl https://xwvxqhhnozfrjcjmcltv.supabase.co/functions/v1/healthcheck
```

**Expected:** `{"status":"ok"}` (if secrets configured)

**Or:** Error message (normal if secrets not configured yet)

---

## 🎯 Step 3: Configure Secrets (10 minutes)

### 3.1 Open Secrets Configuration

Go to: https://supabase.com/dashboard/project/xwvxqhhnozfrjcjmcltv/settings/functions

Click **"Edge Function Secrets"**

### 3.2 Add Required Secrets

See detailed guide: `supabase/SECRETS_CHECKLIST.md`

**Minimum configuration:**

| Secret Name | Example Value | Where to Get |
|-------------|---------------|--------------|
| `FRONTEND_URL` | `https://your-app.vercel.app` | Your Vercel URL (add in Step 4) |
| `RESEND_API_KEY` | `re_abc123...` | [resend.com](https://resend.com) → API Keys |
| `GEMINI_API_KEY` | `AIzaXXX...` | [Google AI Studio](https://makersuite.google.com/app/apikey) (FREE!) |

**For production, also add:**

| Secret Name | Example Value | Where to Get |
|-------------|---------------|--------------|
| `STRIPE_SECRET_KEY` | `sk_live_...` | [stripe.com](https://dashboard.stripe.com/apikeys) |
| `STRIPE_WEBHOOK_SECRET` | `whsec_...` | Stripe → Webhooks |

### 3.3 Quick Setup (via CLI)

Create `.env.production` locally (DON'T commit!):
```env
FRONTEND_URL=https://majster-ai.vercel.app
RESEND_API_KEY=re_your_key_here
GEMINI_API_KEY=AIza_your_key_here
```

Then:
```bash
supabase secrets set --env-file .env.production
```

---

## 🎯 Step 4: Deploy Frontend (5 minutes)

### 4.1 Open Vercel Dashboard

Go to: https://vercel.com/dashboard

### 4.2 Configure Environment Variables

See detailed guide: `VERCEL_ENV_CHECKLIST.md`

**Required variables:**

| Key | Value | Where to Get |
|-----|-------|--------------|
| `VITE_SUPABASE_URL` | `https://xwvxqhhnozfrjcjmcltv.supabase.co` | Supabase → Settings → API |
| `VITE_SUPABASE_ANON_KEY` | `eyJhbGci...` | Supabase → Settings → API → anon public |

**How to add:**
1. Select your project
2. Settings → Environment Variables
3. Click "Add"
4. Enter key and value
5. Check all environments (Production, Preview, Development)
6. Click "Save"

### 4.3 Deploy

**Option A: Via Git (Recommended)**
```bash
git add .
git commit -m "feat: production deployment"
git push origin main
```

Vercel will auto-deploy on push to main.

**Option B: Via CLI**
```bash
npm install -g vercel
vercel login
vercel --prod
```

### 4.4 Get Your Deployment URL

After deployment completes:
```
✅ Production: https://majster-ai-xyz123.vercel.app
```

**IMPORTANT:** Copy this URL!

### 4.5 Update FRONTEND_URL Secret

Go back to Supabase Edge Function Secrets:
```bash
supabase secrets set FRONTEND_URL=https://majster-ai-xyz123.vercel.app
```

Or update in Supabase Dashboard manually.

---

## 🎯 Step 5: Verification & Testing (5 minutes)

### 5.1 Test Database

In Supabase SQL Editor:
```sql
SELECT COUNT(*) FROM information_schema.tables
WHERE table_schema = 'public' AND table_type = 'BASE TABLE';
-- Expected: 33
```

### 5.2 Test Edge Functions

```bash
curl https://xwvxqhhnozfrjcjmcltv.supabase.co/functions/v1/healthcheck
# Expected: {"status":"ok"}
```

### 5.3 Test Frontend

1. Open: `https://your-app.vercel.app`
2. Click **"Register"**
3. Create account with email/password
4. ✅ Should redirect to dashboard

### 5.4 Test Full Flow

1. **Create Client:**
   - Dashboard → Clients → Add Client
   - Fill name, phone, email
   - Click Save
   - ✅ Should appear in list

2. **Create Project:**
   - Dashboard → Projects → New Project
   - Select client
   - Add description
   - Click Save
   - ✅ Should appear in list

3. **Create Quote:**
   - Open project → Quotes tab
   - Click "New Quote"
   - Add items (description, quantity, price)
   - Click Save
   - ✅ Quote should save

4. **Send Email (if Resend configured):**
   - Open quote → Click "Send Email"
   - Enter client email
   - Click Send
   - ✅ Email should be received
   - Check: Supabase → Database → offer_sends (should have log)

5. **Test AI (if Gemini configured):**
   - Quotes → Click "AI Suggestions"
   - Enter: "Remont łazienki 10m2"
   - ✅ Should return quote items

### 5.5 Verify Data Isolation (RLS Test)

1. Create client as User A
2. Logout
3. Register as User B
4. Check Clients list
5. ✅ Should NOT see User A's client (RLS working!)

---

## ✅ Post-Deployment Checklist

### Database
- [ ] 33 tables created
- [ ] RLS enabled on all tables
- [ ] 218 policies deployed
- [ ] Test query returns expected counts

### Edge Functions
- [ ] 16 functions deployed
- [ ] Healthcheck returns 200 OK
- [ ] Secrets configured (minimum: FRONTEND_URL, RESEND_API_KEY, GEMINI_API_KEY)

### Frontend
- [ ] Deployed to Vercel
- [ ] Environment variables set (VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY)
- [ ] Can register new user
- [ ] Can create client/project/quote
- [ ] No errors in browser console

### Integrations
- [ ] Email sending works (if Resend configured)
- [ ] AI suggestions work (if Gemini/OpenAI configured)
- [ ] RLS isolates user data
- [ ] File upload works (company logo)

---

## 🎉 Success! What's Next?

Your Majster.AI production environment is live! 🚀

### Immediate Actions:
1. **Test thoroughly** with real data
2. **Invite beta users** for feedback
3. **Monitor errors** in Supabase logs
4. **Set up custom domain** (optional)

### Optional Enhancements:
- [ ] Configure Sentry for error tracking
- [ ] Set up Stripe for subscriptions
- [ ] Add custom domain
- [ ] Configure email templates in Resend
- [ ] Enable database backups (Supabase Pro)

### Monitoring:
- **Supabase Dashboard:** Database usage, API requests
- **Vercel Dashboard:** Deployment status, bandwidth
- **Resend Dashboard:** Email delivery status
- **Stripe Dashboard:** Subscription metrics (if configured)

---

## 🚨 Troubleshooting

### Issue: Migration fails with syntax error

**Fix:** Make sure you're using `DEPLOYMENT_READY_MIGRATION.sql`, NOT any other migration file.

### Issue: Frontend shows "Invalid API key"

**Fix:**
1. Verify `VITE_SUPABASE_ANON_KEY` in Vercel (NOT service_role!)
2. Redeploy frontend after adding env vars
3. Clear browser cache

### Issue: Can't send emails

**Fix:**
1. Verify `RESEND_API_KEY` in Supabase secrets
2. Check Resend dashboard for error logs
3. Verify domain is verified in Resend (or use test domain)

### Issue: AI features don't work

**Fix:**
1. Verify one of: `OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, or `GEMINI_API_KEY` is set
2. Check API key is valid and has credits
3. Check Edge Function logs for errors

### Issue: Users can see each other's data

**Fix:**
1. RLS might not be enabled. Run:
```sql
SELECT tablename FROM pg_tables
WHERE schemaname = 'public' AND rowsecurity = false;
-- Should return 0 rows
```
2. If tables appear, re-run migration

---

## 📚 Documentation

- **Complete Audit:** `PRODUCTION_DEPLOYMENT_AUDIT.md`
- **Database Migration:** `supabase/DEPLOYMENT_READY_MIGRATION.sql`
- **Edge Functions Deployment:** `supabase/DEPLOY_EDGE_FUNCTIONS.sh`
- **Secrets Guide:** `supabase/SECRETS_CHECKLIST.md`
- **Vercel Environment Variables:** `VERCEL_ENV_CHECKLIST.md`
- **AI Providers Reference:** `docs/AI_PROVIDERS_REFERENCE.md`

---

## 🆘 Need Help?

- **Supabase Issues:** https://supabase.com/docs
- **Vercel Issues:** https://vercel.com/docs
- **Project Issues:** Open issue on GitHub

---

**Deployed by:** Claude Code AI
**Date:** 2025-12-28
**Version:** Production 1.0
**Status:** ✅ READY
