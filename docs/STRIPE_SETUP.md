# Stripe Integration Setup Guide

**Status:** ✅ Code Ready - Configuration Required
**Estimated Setup Time:** 30-45 minutes
**Complexity:** Medium

---

## OVERVIEW

This guide walks you through setting up Stripe payments for Majster.AI subscription billing.

**What's Already Done:**
- ✅ Database schema (`user_subscriptions`, `subscription_events`)
- ✅ Edge Functions (`create-checkout-session`, `stripe-webhook`)
- ✅ Frontend hooks (`useStripe`, `useSubscription`)
- ✅ Security (RLS policies, webhook verification)

**What You Need to Do:**
1. Create Stripe account
2. Configure Stripe products & prices
3. Set environment variables
4. Deploy Edge Functions
5. Configure webhook endpoint
6. Test payment flow

---

## PREREQUISITES

- Stripe account (sign up at https://stripe.com)
- Supabase project configured
- Access to Supabase Dashboard
- Access to Vercel/production environment

---

## STEP 1: CREATE STRIPE ACCOUNT

1. **Sign up for Stripe**
   - Go to https://dashboard.stripe.com/register
   - Complete registration
   - Activate your account

2. **Enable Test Mode**
   - Toggle "Test mode" in Stripe Dashboard (top right)
   - Use test mode for development

3. **Get API Keys**
   - Go to Developers → API keys
   - Copy **Publishable key** (starts with `pk_test_`)
   - Copy **Secret key** (starts with `sk_test_`)
   - **IMPORTANT:** Never commit these keys to git!

---

## STEP 2: CREATE PRODUCTS & PRICES

### Option A: Using Stripe Dashboard (Recommended)

1. **Create Products**
   - Go to Products → Add product
   - Create 4 products:
     - **Pro** - Professional plan
     - **Starter** - Basic plan with essentials
     - **Business** - Advanced features + AI
     - **Enterprise** - Full features + API

2. **Add Pricing for Each Product**

   For each product, add TWO prices:
   - **Monthly recurring** (e.g., 49 PLN/month)
   - **Yearly recurring** (e.g., 490 PLN/year - 2 months free)

3. **Configure Price Details**
   - Billing period: Monthly OR Yearly
   - Currency: PLN (Polish Złoty)
   - Trial period: 14 days (optional but recommended)

4. **Copy Price IDs**
   - After creating prices, copy each Price ID (starts with `price_`)
   - You'll need these for environment variables

### Option B: Using Stripe CLI (Advanced)

```bash
# Install Stripe CLI
brew install stripe/stripe-cli/stripe # macOS
# OR download from https://stripe.com/docs/stripe-cli

# Login
stripe login

# Create products and prices
stripe products create --name="Pro" --description="Professional plan"
stripe prices create --product=prod_xxx --currency=pln --unit-amount=4900 --recurring[interval]=month

# Repeat for all plans
```

---

## STEP 3: CONFIGURE ENVIRONMENT VARIABLES

### A. Supabase Edge Functions (Backend)

Go to Supabase Dashboard → Edge Functions → Secrets

Add these secrets:

```bash
# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_xxxxxxxxxxxxx  # Your Stripe Secret Key
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxx # Will get this in Step 5

# Frontend URL (for redirect after payment)
FRONTEND_URL=https://your-app.vercel.app  # Your production URL
```

**Important:**
- Use `sk_test_` keys for development/staging
- Use `sk_live_` keys for production
- Never use live keys in test mode!

### B. Frontend Environment Variables (Vercel/Local)

Add to Vercel Environment Variables OR `.env` file:

```bash
# Stripe Publishable Key (safe to expose)
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_xxxxxxxxxxxxx

# Price IDs (replace with your actual Price IDs from Step 2)
VITE_STRIPE_PRICE_PRO_MONTHLY=price_xxxxxxxxxxxxx
VITE_STRIPE_PRICE_PRO_YEARLY=price_xxxxxxxxxxxxx
VITE_STRIPE_PRICE_STARTER_MONTHLY=price_xxxxxxxxxxxxx
VITE_STRIPE_PRICE_STARTER_YEARLY=price_xxxxxxxxxxxxx
VITE_STRIPE_PRICE_BUSINESS_MONTHLY=price_xxxxxxxxxxxxx
VITE_STRIPE_PRICE_BUSINESS_YEARLY=price_xxxxxxxxxxxxx
VITE_STRIPE_PRICE_ENTERPRISE_MONTHLY=price_xxxxxxxxxxxxx
VITE_STRIPE_PRICE_ENTERPRISE_YEARLY=price_xxxxxxxxxxxxx
```

**Note:** These price IDs are also hardcoded as fallbacks in `src/hooks/useStripe.ts`

---

## STEP 4: UPDATE PRICE MAPPING

Update Edge Functions with your actual Price IDs:

**File:** `supabase/functions/stripe-webhook/index.ts`

```typescript
// Replace with your actual Stripe Price IDs
const PRICE_TO_PLAN_MAP: Record<string, string> = {
  "price_1ABC123": "pro",           // Your Pro Monthly Price ID
  "price_1ABC124": "pro",           // Your Pro Yearly Price ID
  "price_1ABC125": "starter",       // Your Starter Monthly Price ID
  "price_1ABC126": "starter",       // Your Starter Yearly Price ID
  "price_1ABC127": "business",      // Your Business Monthly Price ID
  "price_1ABC128": "business",      // Your Business Yearly Price ID
  "price_1ABC129": "enterprise",    // Your Enterprise Monthly Price ID
  "price_1ABC130": "enterprise",    // Your Enterprise Yearly Price ID
};
```

**File:** `supabase/functions/create-checkout-session/index.ts`

```typescript
// Optional: Add price validation
const VALID_PRICE_IDS = [
  "price_1ABC123", // Pro Monthly
  "price_1ABC124", // Pro Yearly
  // ... add all your price IDs
];
```

---

## STEP 5: DEPLOY EDGE FUNCTIONS

### Deploy to Supabase

```bash
# Navigate to project
cd /path/to/majster-ai-oferty

# Login to Supabase (if not already)
npx supabase login

# Link to your project
npx supabase link --project-ref your-project-ref

# Deploy Edge Functions
npx supabase functions deploy create-checkout-session
npx supabase functions deploy stripe-webhook

# Verify deployment
npx supabase functions list
```

Expected output:
```
┌─────────────────────────────┬─────────┬─────────┐
│ NAME                        │ VERSION │ STATUS  │
├─────────────────────────────┼─────────┼─────────┤
│ create-checkout-session     │ 1       │ ACTIVE  │
│ stripe-webhook              │ 1       │ ACTIVE  │
└─────────────────────────────┴─────────┴─────────┘
```

---

## STEP 6: CONFIGURE STRIPE WEBHOOK

### Get Webhook URL

Your webhook URL format:
```
https://[PROJECT_REF].supabase.co/functions/v1/stripe-webhook
```

Example:
```
https://abcdefghijklmnop.supabase.co/functions/v1/stripe-webhook
```

### Add Webhook in Stripe Dashboard

1. Go to Stripe Dashboard → Developers → Webhooks
2. Click "Add endpoint"
3. Enter your webhook URL (from above)
4. Select events to listen to:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`

5. Click "Add endpoint"

### Get Webhook Secret

1. After creating endpoint, click on it
2. Click "Reveal" under "Signing secret"
3. Copy the secret (starts with `whsec_`)
4. Add to Supabase Secrets:
   ```bash
   STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxx
   ```

5. **Redeploy stripe-webhook function** to pick up new secret:
   ```bash
   npx supabase functions deploy stripe-webhook
   ```

---

## STEP 7: APPLY DATABASE MIGRATION

```bash
# Navigate to project
cd /path/to/majster-ai-oferty

# Apply migration locally (for testing)
npx supabase db reset

# OR apply to production
npx supabase db push
```

Verify tables created:
```sql
-- In Supabase SQL Editor
SELECT * FROM user_subscriptions LIMIT 1;
SELECT * FROM subscription_events LIMIT 1;
```

---

## STEP 8: TEST PAYMENT FLOW

### Test in Development

1. **Update Billing Page**

   Example implementation for `src/pages/Billing.tsx`:
   ```typescript
   import { useCreateCheckoutSession, getStripePriceId } from '@/hooks/useStripe';

   function BillingPage() {
     const { mutate: createCheckout, isLoading } = useCreateCheckoutSession();

     const handleUpgrade = (plan: 'pro' | 'starter' | 'business', period: 'monthly' | 'yearly') => {
       const priceId = getStripePriceId(plan, period);
       createCheckout({
         priceId,
         successUrl: `${window.location.origin}/billing?success=true`,
         cancelUrl: `${window.location.origin}/billing?canceled=true`,
       });
     };

     return (
       <button onClick={() => handleUpgrade('business', 'monthly')}>
         Upgrade to Business
       </button>
     );
   }
   ```

2. **Run Application**
   ```bash
   npm run dev
   ```

3. **Test Checkout Flow**
   - Navigate to Billing page
   - Click upgrade button
   - Should redirect to Stripe Checkout
   - Use test card: `4242 4242 4242 4242`
   - Expiry: Any future date
   - CVC: Any 3 digits
   - Complete payment

4. **Verify Webhook**
   - Check Supabase logs: `npx supabase functions logs stripe-webhook`
   - Check `subscription_events` table for logged events
   - Check `user_subscriptions` table for updated subscription

### Test Cards

| Card Number         | Description          |
|---------------------|----------------------|
| 4242 4242 4242 4242 | Successful payment   |
| 4000 0000 0000 0002 | Declined payment     |
| 4000 0000 0000 9995 | Insufficient funds   |

More test cards: https://stripe.com/docs/testing

---

## STEP 9: VERIFY INTEGRATION

### Checklist

- [ ] Stripe account created and activated
- [ ] Products created in Stripe
- [ ] Prices created (monthly + yearly for each plan)
- [ ] Environment variables set (both Supabase and Vercel)
- [ ] Edge Functions deployed successfully
- [ ] Webhook endpoint configured in Stripe
- [ ] Webhook secret added to Supabase
- [ ] Database migration applied
- [ ] Test payment completed successfully
- [ ] Webhook events logged in database
- [ ] User subscription updated in database

### Verify in Database

```sql
-- Check subscription was created
SELECT * FROM user_subscriptions WHERE user_id = 'your-user-id';

-- Check webhook events
SELECT
  event_type,
  processed,
  created_at
FROM subscription_events
ORDER BY created_at DESC
LIMIT 10;
```

---

## STEP 10: GO TO PRODUCTION

### Before Going Live

1. **Switch to Live Mode**
   - Toggle "View test data" OFF in Stripe Dashboard
   - Create products & prices in LIVE mode (repeat Step 2)
   - Get LIVE API keys

2. **Update Environment Variables**
   ```bash
   # Supabase Secrets (LIVE keys)
   STRIPE_SECRET_KEY=sk_live_xxxxxxxxxxxxx
   STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxx  # From LIVE webhook

   # Vercel (LIVE keys)
   VITE_STRIPE_PUBLISHABLE_KEY=pk_live_xxxxxxxxxxxxx
   # Update all VITE_STRIPE_PRICE_* with LIVE Price IDs
   ```

3. **Create Production Webhook**
   - Add new webhook endpoint for PRODUCTION URL
   - Use same events as test mode
   - Save new webhook secret to Supabase

4. **Deploy**
   ```bash
   # Redeploy Edge Functions with live keys
   npx supabase functions deploy create-checkout-session
   npx supabase functions deploy stripe-webhook

   # Deploy frontend to Vercel
   git push origin main  # If auto-deploy enabled
   ```

5. **Test with Real Card**
   - Use a real card (will be charged!)
   - Complete full payment flow
   - Verify subscription in database
   - Verify webhook events
   - Test cancellation flow

---

## TROUBLESHOOTING

### Issue: "Missing STRIPE_SECRET_KEY"

**Solution:**
- Verify environment variable is set in Supabase Dashboard → Edge Functions → Secrets
- Redeploy Edge Function after adding secret
- Check logs: `npx supabase functions logs create-checkout-session`

---

### Issue: "Webhook signature verification failed"

**Solution:**
- Verify `STRIPE_WEBHOOK_SECRET` is correct
- Make sure you copied secret from the CORRECT webhook (test vs live)
- Redeploy `stripe-webhook` function
- Check Stripe Dashboard → Webhooks → Your endpoint → Event logs

---

### Issue: "No checkout URL returned"

**Solution:**
- Check Supabase function logs for errors
- Verify user is authenticated (check Authorization header)
- Verify Price ID is valid in Stripe Dashboard
- Check STRIPE_SECRET_KEY is correct

---

### Issue: "Subscription not updating after payment"

**Solution:**
- Check webhook is receiving events (Stripe Dashboard → Webhooks)
- Check `subscription_events` table for logged events
- Verify `PRICE_TO_PLAN_MAP` includes your Price IDs
- Check `processed` column - if false, check `error` column
- Review function logs: `npx supabase functions logs stripe-webhook`

---

### Issue: "User subscription shows 'free' after payment"

**Solution:**
- Webhook probably not configured correctly
- Check webhook events in Stripe Dashboard
- Verify webhook secret is correct
- Ensure webhook is sending `customer.subscription.updated` event
- Check function logs for errors

---

## MONITORING

### Check Webhook Health

```bash
# View recent webhook logs
npx supabase functions logs stripe-webhook --tail

# Check for errors
SELECT * FROM subscription_events
WHERE processed = false
ORDER BY created_at DESC;
```

### Check Subscription Status

```bash
# In Supabase SQL Editor
SELECT
  u.email,
  s.plan_id,
  s.status,
  s.current_period_end,
  s.stripe_subscription_id
FROM user_subscriptions s
JOIN auth.users u ON u.id = s.user_id
WHERE s.status = 'active'
ORDER BY s.created_at DESC;
```

---

## SECURITY NOTES

### ⚠️ NEVER DO THIS:

- ❌ Commit API keys to git
- ❌ Use live keys in test mode
- ❌ Use test keys in production
- ❌ Disable webhook signature verification
- ❌ Expose service role key to frontend

### ✅ ALWAYS DO THIS:

- ✅ Use environment variables for keys
- ✅ Verify webhook signatures
- ✅ Use RLS policies for database access
- ✅ Log webhook events for debugging
- ✅ Monitor failed webhooks
- ✅ Test thoroughly before going live

---

## PRICING RECOMMENDATIONS

Based on construction industry in Poland:

| Plan       | Monthly | Yearly  | Features                          | Target Users                |
|------------|---------|---------|-----------------------------------|-----------------------------|
| Starter    | 49 PLN  | 490 PLN | Basic features, 15 projects       | Solo contractors            |
| Business   | 99 PLN  | 990 PLN | AI features, unlimited projects   | Small construction business |
| Enterprise | 199 PLN | 1990 PLN| Full features + API + team mgmt   | Medium construction company |

**Trial Period:** 14 days recommended
**Yearly Discount:** ~17% (2 months free)

---

## NEXT STEPS

After successful Stripe integration:

1. **Add Subscription Management**
   - Cancel subscription
   - Change plan
   - Update payment method
   - View invoices

2. **Add Email Notifications**
   - Payment successful
   - Payment failed
   - Subscription canceled
   - Trial ending

3. **Add Analytics**
   - Track conversion rate
   - Monitor MRR (Monthly Recurring Revenue)
   - Track churn rate

4. **Add Customer Portal**
   - Use Stripe Customer Portal for self-service
   - Let users manage subscriptions

---

## ADDITIONAL RESOURCES

- [Stripe Documentation](https://stripe.com/docs)
- [Supabase Edge Functions](https://supabase.com/docs/guides/functions)
- [Stripe Webhooks Guide](https://stripe.com/docs/webhooks)
- [Stripe Testing](https://stripe.com/docs/testing)
- [Stripe Dashboard](https://dashboard.stripe.com)

---

## SUPPORT

If you encounter issues:

1. Check this guide's Troubleshooting section
2. Review Stripe Dashboard → Webhooks → Event logs
3. Check Supabase function logs
4. Review `subscription_events` table for errors
5. Contact Stripe Support (they're very helpful!)

---

**End of Setup Guide**

*Once configured, Stripe will handle all payment processing, subscription management, and billing automatically. Your app will receive webhook events and update the database accordingly.*

**Estimated Revenue Potential:**
- 100 users @ 99 PLN/month = 9,900 PLN/month (~$2,500)
- Stripe fees (2.9% + 0.30): ~290 PLN/month
- Net revenue: ~9,610 PLN/month (~$2,430)

Good luck with your launch! 🚀
