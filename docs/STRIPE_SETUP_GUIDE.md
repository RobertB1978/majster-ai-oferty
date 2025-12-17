# Stripe Payment Integration - Setup Guide

**Created:** 2025-12-17
**Integration Type:** Subscription billing via Stripe Checkout
**Status:** ✅ Complete - Ready for implementation

---

## 🎯 Overview

This guide walks you through setting up Stripe payment integration for subscription billing in Majster.AI.

**What you'll get:**
- Subscription payments via Stripe Checkout
- Automatic subscription management (upgrades, downgrades, cancellations)
- Customer portal for users to manage billing
- Webhook integration for real-time status updates

**Time to complete:** ~30 minutes

---

## 📋 Prerequisites

Before starting, ensure you have:

- [ ] Stripe account (create at [stripe.com](https://stripe.com))
- [ ] Supabase project set up
- [ ] Vercel deployment (or staging environment)
- [ ] Database migration applied (`20251217131754_stripe_integration.sql`)

---

## Step 1: Create Stripe Account & Get API Keys

### 1.1 Create Stripe Account

1. Go to [stripe.com](https://stripe.com)
2. Click "Sign up" and complete registration
3. Verify your email address

### 1.2 Get API Keys

1. Go to [Stripe Dashboard](https://dashboard.stripe.com)
2. Click **Developers → API keys**
3. Copy the following keys:

   **For testing (development):**
   - **Publishable key**: `pk_test_...` (safe for frontend)
   - **Secret key**: `sk_test_...` (NEVER expose to frontend!)

   **For production:**
   - **Publishable key**: `pk_live_...`
   - **Secret key**: `sk_live_...`

4. Store these keys securely (use password manager)

---

## Step 2: Create Products & Prices in Stripe

### 2.1 Create Products

1. In Stripe Dashboard, go to **Products → Add product**
2. Create your subscription tiers:

**Example: Basic Plan**
- Product name: `Majster.AI - Plan Podstawowy`
- Description: `Do 10 projektów miesięcznie`
- Recurring: **Monthly**
- Price: `49.00 PLN`
- Click **Add product**

**Example: Pro Plan**
- Product name: `Majster.AI - Plan Pro`
- Description: `Do 50 projektów miesięcznie`
- Recurring: **Monthly**
- Price: `99.00 PLN`

**Example: Premium Plan**
- Product name: `Majster.AI - Plan Premium`
- Description: `Nieograniczona liczba projektów`
- Recurring: **Monthly**
- Price: `199.00 PLN`

### 2.2 Copy Price IDs

After creating products, copy the **Price ID** for each plan (format: `price_...`).

You'll need these IDs in your frontend code.

---

## Step 3: Set Up Environment Variables

### 3.1 Frontend (Vercel)

Add to Vercel Environment Variables:

```
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_your_key_here
```

**Where:** Vercel Dashboard → Your Project → Settings → Environment Variables

**Apply to:** Production, Preview, Development

### 3.2 Backend (Supabase Edge Functions)

Set Supabase secrets:

```bash
supabase secrets set STRIPE_SECRET_KEY=sk_test_your_key_here
supabase secrets set FRONTEND_URL=https://your-app.vercel.app
```

**Or via Supabase Dashboard:**
1. Go to **Edge Functions → Settings → Secrets**
2. Add:
   - `STRIPE_SECRET_KEY` = `sk_test_...`
   - `FRONTEND_URL` = `https://your-app.vercel.app`

---

## Step 4: Configure Stripe Webhooks

Webhooks allow Stripe to notify your app about subscription events (payment succeeded, subscription canceled, etc.).

### 4.1 Get Webhook Endpoint URL

Your webhook URL will be:
```
https://[your-supabase-project].supabase.co/functions/v1/stripe-webhook
```

Example:
```
https://abcdefghijklmn.supabase.co/functions/v1/stripe-webhook
```

### 4.2 Create Webhook in Stripe

1. Go to [Stripe Dashboard → Webhooks](https://dashboard.stripe.com/webhooks)
2. Click **Add endpoint**
3. **Endpoint URL**: `https://[your-supabase-project].supabase.co/functions/v1/stripe-webhook`
4. **Description**: `Majster.AI Subscription Webhooks`
5. **Events to send**: Select the following events:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
6. Click **Add endpoint**

### 4.3 Get Webhook Secret

After creating the webhook:

1. Click on the webhook endpoint you just created
2. Click **Reveal** next to **Signing secret**
3. Copy the webhook secret (format: `whsec_...`)

### 4.4 Add Webhook Secret to Supabase

```bash
supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_your_secret_here
```

**Or via Supabase Dashboard:**
- Add secret: `STRIPE_WEBHOOK_SECRET` = `whsec_...`

---

## Step 5: Deploy Edge Functions

### 5.1 Deploy Functions

```bash
# Deploy create-checkout-session function
supabase functions deploy create-checkout-session

# Deploy stripe-webhook function
supabase functions deploy stripe-webhook
```

### 5.2 Verify Deployment

Check that functions are running:

```bash
supabase functions list
```

You should see:
- ✅ `create-checkout-session`
- ✅ `stripe-webhook`

---

## Step 6: Add Frontend Dependencies

### 6.1 Install Stripe Packages

```bash
npm install @stripe/stripe-js @stripe/react-stripe-js
```

### 6.2 Verify Installation

Check `package.json`:

```json
{
  "dependencies": {
    "@stripe/stripe-js": "^2.4.0",
    "@stripe/react-stripe-js": "^2.4.0"
  }
}
```

---

## Step 7: Test Payment Flow

### 7.1 Test in Development

1. **Use Stripe test mode** (test API keys)
2. **Test card numbers** (from [Stripe Testing](https://stripe.com/docs/testing)):
   - **Success**: `4242 4242 4242 4242`
   - **Decline**: `4000 0000 0000 0002`
   - **Requires authentication**: `4000 0025 0000 3155`

   Use any future expiration date (e.g., `12/34`) and any 3-digit CVC (e.g., `123`).

### 7.2 Test Flow

1. **Navigate to billing page** in your app
2. **Click on a subscription plan** (e.g., "Plan Pro")
3. **Verify redirect to Stripe Checkout**
4. **Fill in test card details**:
   - Card: `4242 4242 4242 4242`
   - Expiry: `12/34`
   - CVC: `123`
   - Name: `Test User`
   - Email: `test@example.com`
5. **Complete payment**
6. **Verify redirect back to success page**
7. **Check database** - subscription should be created in `subscriptions` table

### 7.3 Verify Webhook Delivery

1. Go to [Stripe Dashboard → Webhooks](https://dashboard.stripe.com/webhooks)
2. Click on your webhook endpoint
3. Check **Recent deliveries** tab
4. You should see events delivered with **200 OK** response

---

## Step 8: Production Checklist

Before going live with real payments:

### 8.1 Switch to Live Mode

1. In Stripe Dashboard, toggle from **Test mode** to **Live mode**
2. Activate your account (complete Stripe verification)
3. Get live API keys (`pk_live_...` and `sk_live_...`)
4. Update environment variables with live keys

### 8.2 Update Environment Variables

**Vercel:**
```
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_your_key_here
```

**Supabase:**
```bash
supabase secrets set STRIPE_SECRET_KEY=sk_live_your_key_here
supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_live_your_secret_here
```

### 8.3 Create Live Webhook

1. In **Live mode**, go to Webhooks
2. Create new webhook with same events
3. Update webhook secret in Supabase

### 8.4 Test Live Payment (Small Amount)

Before announcing to users:

1. Test with real card (use your own)
2. Subscribe to cheapest plan
3. Verify payment flow works end-to-end
4. Cancel test subscription
5. Verify cancellation works

---

## 🔍 Troubleshooting

### Issue: Checkout session creation fails

**Error:** `"Missing authorization header"`

**Fix:** Ensure user is logged in before clicking checkout button

---

### Issue: Webhook returns 400 error

**Error:** `"Webhook signature verification failed"`

**Fix:**
1. Check webhook secret is correct in Supabase
2. Verify webhook URL is correct
3. Ensure `verify_jwt = false` in `stripe-webhook/config.toml`

---

### Issue: Subscription not appearing in database

**Possible causes:**

1. **Webhook not delivered**
   - Check Stripe Dashboard → Webhooks → Recent deliveries
   - Verify endpoint URL is correct

2. **RLS policy blocking insert**
   - Check `subscriptions` table has policy: `Service can insert subscriptions`

3. **Database error**
   - Check Supabase logs (Dashboard → Logs)
   - Look for errors in `stripe-webhook` function

---

### Issue: "Invalid API key provided"

**Fix:**
1. Verify API keys are correct (no extra spaces)
2. Ensure using test keys in test mode, live keys in live mode
3. Check keys haven't been deleted or revoked in Stripe Dashboard

---

## 📚 Additional Resources

**Stripe Documentation:**
- [Stripe Checkout](https://stripe.com/docs/payments/checkout)
- [Webhooks](https://stripe.com/docs/webhooks)
- [Testing Cards](https://stripe.com/docs/testing)
- [Subscriptions](https://stripe.com/docs/billing/subscriptions/overview)

**Supabase Documentation:**
- [Edge Functions](https://supabase.com/docs/guides/functions)
- [Stripe Webhooks Example](https://supabase.com/docs/guides/functions/examples/stripe-webhooks)

**Code References:**
- Migration: `supabase/migrations/20251217131754_stripe_integration.sql`
- Edge Functions: `supabase/functions/create-checkout-session/`, `stripe-webhook/`
- React Hooks: `src/hooks/useStripeSubscription.ts`
- UI Component: `src/components/billing/StripeCheckoutButton.tsx`

---

## ✅ Success Checklist

After setup, you should be able to:

- [ ] Users can click "Subscribe" button
- [ ] Users are redirected to Stripe Checkout
- [ ] Users can complete payment
- [ ] Users are redirected back to app after payment
- [ ] Subscription appears in database (`subscriptions` table)
- [ ] Subscription status updates when canceled
- [ ] Webhooks deliver successfully (check Stripe Dashboard)
- [ ] Test payments work (test mode)
- [ ] Live payments work (live mode - test with own card)

---

**Setup complete!** 🎉

You now have a fully functional Stripe subscription integration.

For ongoing management, see [Managing Subscriptions](#managing-subscriptions) below.

---

## 🔧 Managing Subscriptions

### Customer Portal

Stripe provides a pre-built customer portal where users can:
- View invoices
- Update payment method
- Cancel subscription

**To enable:**
1. Go to [Stripe Settings → Customer Portal](https://dashboard.stripe.com/settings/billing/portal)
2. Configure settings
3. Link to portal in your app

### Viewing Customers

View all customers in [Stripe Dashboard → Customers](https://dashboard.stripe.com/customers)

### Viewing Subscriptions

View all subscriptions in [Stripe Dashboard → Subscriptions](https://dashboard.stripe.com/subscriptions)

### Refunds

Issue refunds in [Stripe Dashboard → Payments](https://dashboard.stripe.com/payments)

---

**Questions?** Check troubleshooting section or Stripe documentation above.
