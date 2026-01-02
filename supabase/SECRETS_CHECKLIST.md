# 🔐 Supabase Edge Functions Secrets Configuration

**Project:** Majster.AI
**Supabase Ref:** `xwvxqhhnozfrjcjmcltv`
**Configure at:** [Dashboard → Edge Functions → Secrets](https://supabase.com/dashboard/project/xwvxqhhnozfrjcjmcltv/settings/functions)

---

## ✅ Required Secrets Checklist

### 1. Supabase Configuration (Auto-configured)

These are usually auto-injected by Supabase, but verify they exist:

- [ ] `SUPABASE_URL`
  - **Value:** `https://xwvxqhhnozfrjcjmcltv.supabase.co`
  - **Where to get:** Supabase Dashboard → Settings → API
  - **Used by:** All Edge Functions

- [ ] `SUPABASE_SERVICE_ROLE_KEY`
  - **Value:** `eyJhbGci...` (long JWT token)
  - **Where to get:** Supabase Dashboard → Settings → API → service_role key
  - **⚠️ CRITICAL:** Never expose this key in frontend!
  - **Used by:** All Edge Functions for database access

---

### 2. Frontend Configuration (REQUIRED)

- [ ] `FRONTEND_URL`
  - **Value:** `https://your-app.vercel.app` (or your custom domain)
  - **Where to get:** Your Vercel deployment URL
  - **Used by:**
    - `send-offer-email` - for email links
    - `approve-offer` - for redirect after approval
  - **Example:** `https://majster-ai.vercel.app`

---

### 3. Email Service (REQUIRED for email features)

- [ ] `RESEND_API_KEY`
  - **Value:** `re_...` (starts with `re_`)
  - **Where to get:** [resend.com](https://resend.com) → API Keys
  - **Used by:**
    - `send-offer-email` - send quotes via email
    - `send-expiring-offer-reminders` - automated reminders
  - **Cost:** Free tier: 100 emails/day, 3,000/month
  - **Setup:**
    1. Create account at resend.com
    2. Add verified domain (or use resend test domain)
    3. Create API key

---

### 4. AI Provider (Choose ONE)

You must configure **at least one** AI provider:

#### Option A: OpenAI (Recommended for production)

- [ ] `OPENAI_API_KEY`
  - **Value:** `sk-...` (starts with `sk-`)
  - **Where to get:** [platform.openai.com/api-keys](https://platform.openai.com/api-keys)
  - **Used by:**
    - `ai-quote-suggestions` - quote generation
    - `ai-chat-agent` - AI assistant
    - `finance-ai-analysis` - financial analysis
    - `voice-quote-processor` - voice to text
  - **Cost:** Pay-as-you-go, ~$0.002 per request (GPT-4o-mini)
  - **Models used:** `gpt-4o-mini`, `gpt-4o`

#### Option B: Anthropic Claude (Alternative)

- [ ] `ANTHROPIC_API_KEY`
  - **Value:** `sk-ant-...` (starts with `sk-ant-`)
  - **Where to get:** [console.anthropic.com](https://console.anthropic.com)
  - **Used by:** Same functions as OpenAI
  - **Cost:** Pay-as-you-go, ~$0.003 per request (Claude 3.5 Sonnet)
  - **Models used:** `claude-3-5-sonnet-latest`, `claude-3-5-haiku-latest`

#### Option C: Google Gemini (Free tier available)

- [ ] `GEMINI_API_KEY`
  - **Value:** `AIza...` (starts with `AIza`)
  - **Where to get:** [makersuite.google.com/app/apikey](https://makersuite.google.com/app/apikey)
  - **Used by:** Same functions as OpenAI
  - **Cost:** **FREE** up to 15 requests/minute
  - **Models used:** `gemini-1.5-flash`, `gemini-1.5-pro`
  - **⭐ Best for:** Testing and low-volume production

---

### 5. Payment Processing (REQUIRED for subscriptions)

- [ ] `STRIPE_SECRET_KEY`
  - **Value:** `sk_test_...` (test) or `sk_live_...` (production)
  - **Where to get:** [dashboard.stripe.com/apikeys](https://dashboard.stripe.com/apikeys)
  - **Used by:**
    - `create-checkout-session` - subscription checkout
    - `stripe-webhook` - payment status updates
  - **Setup:**
    1. Create Stripe account
    2. Create products (Starter, Pro, Enterprise)
    3. Copy secret key

- [ ] `STRIPE_WEBHOOK_SECRET`
  - **Value:** `whsec_...` (starts with `whsec_`)
  - **Where to get:** Stripe Dashboard → Developers → Webhooks
  - **Used by:** `stripe-webhook` - verify webhook authenticity
  - **Setup:**
    1. Go to Stripe Dashboard → Webhooks
    2. Add endpoint: `https://xwvxqhhnozfrjcjmcltv.supabase.co/functions/v1/stripe-webhook`
    3. Select events: `checkout.session.completed`, `customer.subscription.*`
    4. Copy webhook signing secret

---

## 🔧 How to Configure Secrets

### Method 1: Supabase Dashboard (Recommended)

1. Go to: https://supabase.com/dashboard/project/xwvxqhhnozfrjcjmcltv/settings/functions
2. Click "Edge Function Secrets"
3. Click "New Secret"
4. Enter name (e.g., `OPENAI_API_KEY`) and value
5. Click "Add Secret"
6. Repeat for all secrets

### Method 2: Supabase CLI

```bash
# Set a single secret
supabase secrets set OPENAI_API_KEY=sk-...

# Set multiple secrets from .env file
supabase secrets set --env-file .env.production

# List all secrets (values hidden)
supabase secrets list

# Unset a secret
supabase secrets unset OPENAI_API_KEY
```

---

## 📝 Example .env.production File

Create this file locally (DON'T commit to git):

```env
# Supabase (auto-configured, but can override)
SUPABASE_URL=https://xwvxqhhnozfrjcjmcltv.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGci...

# Frontend
FRONTEND_URL=https://majster-ai.vercel.app

# Email
RESEND_API_KEY=re_...

# AI Provider (choose one)
OPENAI_API_KEY=sk-...
# OR
# ANTHROPIC_API_KEY=sk-ant-...
# OR
# GEMINI_API_KEY=AIza...

# Stripe
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

Then deploy:
```bash
supabase secrets set --env-file .env.production
```

---

## ✅ Verification

After configuring secrets, test each integration:

### Test Healthcheck:
```bash
curl https://xwvxqhhnozfrjcjmcltv.supabase.co/functions/v1/healthcheck
# Expected: {"status":"ok"}
```

### Test AI Integration:
```bash
# Should return quote suggestions (requires auth)
curl -X POST https://xwvxqhhnozfrjcjmcltv.supabase.co/functions/v1/ai-quote-suggestions \
  -H "Authorization: Bearer YOUR_USER_JWT" \
  -H "Content-Type: application/json" \
  -d '{"description":"Remont łazienki 10m2"}'
```

### Test Email Sending:
- Create quote in app
- Click "Send Email"
- Check Resend dashboard for delivery status

### Test Stripe:
- Click "Upgrade to Pro" in app
- Complete checkout (use test card: 4242 4242 4242 4242)
- Verify subscription in database

---

## 🚨 Security Reminders

- ✅ **DO** use `service_role` key in Edge Functions
- ✅ **DO** configure secrets in Supabase Dashboard/CLI
- ✅ **DO** use different keys for test/production
- ❌ **NEVER** commit secrets to git
- ❌ **NEVER** use `service_role` key in frontend
- ❌ **NEVER** expose secrets in client-side code

---

## 📊 Cost Estimation (Monthly)

**Free Tier Setup (Testing):**
- Supabase: Free (500MB database, 2GB bandwidth)
- Resend: Free (3,000 emails/month)
- Gemini AI: Free (15 req/min)
- Stripe: Free (no monthly fee, 2.9% + $0.30 per transaction)
- **Total: $0/month** (excluding transaction fees)

**Production Setup (100 active users):**
- Supabase Pro: $25/month
- Resend Pro: $20/month (50,000 emails)
- OpenAI: ~$30/month (1,000 AI requests)
- Stripe: Free + transaction fees
- **Total: ~$75/month** + transaction fees

---

## 🎯 Minimum Configuration for Launch

**Absolute minimum to get started:**
1. ✅ `FRONTEND_URL` - for email links
2. ✅ `RESEND_API_KEY` - for sending emails
3. ✅ `GEMINI_API_KEY` - for AI features (FREE!)
4. ⏭️ Stripe keys - can add later when monetizing

**This allows:**
- ✅ User authentication
- ✅ Project management
- ✅ Quote creation
- ✅ Email delivery
- ✅ AI-powered suggestions
- ⏭️ Subscriptions (add Stripe keys later)

---

## 📚 Additional Resources

- [Supabase Edge Functions Docs](https://supabase.com/docs/guides/functions)
- [Resend Documentation](https://resend.com/docs)
- [OpenAI API Reference](https://platform.openai.com/docs/api-reference)
- [Anthropic API Docs](https://docs.anthropic.com/claude/reference/getting-started-with-the-api)
- [Gemini API Docs](https://ai.google.dev/docs)
- [Stripe Webhooks Guide](https://stripe.com/docs/webhooks)

---

**Last Updated:** 2025-12-28
**Status:** Ready for configuration
