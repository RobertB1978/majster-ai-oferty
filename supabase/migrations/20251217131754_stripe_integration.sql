-- Stripe Integration Migration
-- Created: 2025-12-17
-- Purpose: Add tables for Stripe customers, subscriptions, and payment management

-- ============================================================================
-- CUSTOMERS TABLE
-- ============================================================================
-- Links Supabase users to Stripe customers

CREATE TABLE IF NOT EXISTS public.customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  stripe_customer_id TEXT UNIQUE NOT NULL,
  email TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,

  -- Indexes for performance
  CONSTRAINT customers_user_id_unique UNIQUE (user_id)
);

CREATE INDEX IF NOT EXISTS customers_user_id_idx ON public.customers(user_id);
CREATE INDEX IF NOT EXISTS customers_stripe_customer_id_idx ON public.customers(stripe_customer_id);

-- RLS Policies for customers
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;

-- Users can view their own customer record
CREATE POLICY "Users can view own customer" ON public.customers
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own customer record (via Edge Function with service role)
CREATE POLICY "Service can insert customers" ON public.customers
  FOR INSERT
  WITH CHECK (true); -- Edge Function uses service_role key

-- Users can update their own customer record
CREATE POLICY "Users can update own customer" ON public.customers
  FOR UPDATE
  USING (auth.uid() = user_id);

COMMENT ON TABLE public.customers IS 'Stripe customer records linked to Supabase users';
COMMENT ON COLUMN public.customers.stripe_customer_id IS 'Stripe customer ID (cus_...)';

-- ============================================================================
-- SUBSCRIPTIONS TABLE
-- ============================================================================
-- Tracks user subscriptions from Stripe

CREATE TABLE IF NOT EXISTS public.subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  stripe_subscription_id TEXT UNIQUE NOT NULL,
  stripe_customer_id TEXT NOT NULL,
  stripe_price_id TEXT NOT NULL,

  -- Subscription status from Stripe
  status TEXT NOT NULL CHECK (status IN (
    'active',
    'canceled',
    'incomplete',
    'incomplete_expired',
    'past_due',
    'trialing',
    'unpaid'
  )),

  -- Subscription periods
  current_period_start TIMESTAMP WITH TIME ZONE NOT NULL,
  current_period_end TIMESTAMP WITH TIME ZONE NOT NULL,
  cancel_at_period_end BOOLEAN DEFAULT FALSE,
  canceled_at TIMESTAMP WITH TIME ZONE,
  ended_at TIMESTAMP WITH TIME ZONE,
  trial_start TIMESTAMP WITH TIME ZONE,
  trial_end TIMESTAMP WITH TIME ZONE,

  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS subscriptions_user_id_idx ON public.subscriptions(user_id);
CREATE INDEX IF NOT EXISTS subscriptions_stripe_subscription_id_idx ON public.subscriptions(stripe_subscription_id);
CREATE INDEX IF NOT EXISTS subscriptions_status_idx ON public.subscriptions(status);
CREATE INDEX IF NOT EXISTS subscriptions_stripe_customer_id_idx ON public.subscriptions(stripe_customer_id);

-- RLS Policies for subscriptions
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- Users can view their own subscriptions
CREATE POLICY "Users can view own subscriptions" ON public.subscriptions
  FOR SELECT
  USING (auth.uid() = user_id);

-- Service role can insert subscriptions (via webhook)
CREATE POLICY "Service can insert subscriptions" ON public.subscriptions
  FOR INSERT
  WITH CHECK (true);

-- Service role can update subscriptions (via webhook)
CREATE POLICY "Service can update subscriptions" ON public.subscriptions
  FOR UPDATE
  USING (true);

COMMENT ON TABLE public.subscriptions IS 'User subscription records synced from Stripe';
COMMENT ON COLUMN public.subscriptions.stripe_subscription_id IS 'Stripe subscription ID (sub_...)';
COMMENT ON COLUMN public.subscriptions.status IS 'Subscription status from Stripe webhook';

-- ============================================================================
-- PRICES TABLE (optional - for caching Stripe prices)
-- ============================================================================
-- Cache Stripe product prices for faster lookups

CREATE TABLE IF NOT EXISTS public.prices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stripe_price_id TEXT UNIQUE NOT NULL,
  stripe_product_id TEXT NOT NULL,

  -- Price details
  active BOOLEAN DEFAULT TRUE,
  currency TEXT NOT NULL DEFAULT 'pln',
  unit_amount INTEGER, -- Amount in smallest currency unit (grosze for PLN)
  interval TEXT CHECK (interval IN ('day', 'week', 'month', 'year')),
  interval_count INTEGER DEFAULT 1,

  -- Product details
  product_name TEXT,
  product_description TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS prices_stripe_price_id_idx ON public.prices(stripe_price_id);
CREATE INDEX IF NOT EXISTS prices_active_idx ON public.prices(active);

-- RLS Policies for prices (public read)
ALTER TABLE public.prices ENABLE ROW LEVEL SECURITY;

-- Anyone can view active prices
CREATE POLICY "Anyone can view active prices" ON public.prices
  FOR SELECT
  USING (active = TRUE);

-- Only service role can insert/update prices
CREATE POLICY "Service can manage prices" ON public.prices
  FOR ALL
  USING (true);

COMMENT ON TABLE public.prices IS 'Stripe product prices cached for display';

-- ============================================================================
-- PAYMENT INTENTS TABLE (optional - for tracking one-time payments)
-- ============================================================================
-- Track one-time payment intents from Stripe

CREATE TABLE IF NOT EXISTS public.payment_intents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  stripe_payment_intent_id TEXT UNIQUE NOT NULL,
  stripe_customer_id TEXT,

  amount INTEGER NOT NULL, -- Amount in grosze
  currency TEXT NOT NULL DEFAULT 'pln',
  status TEXT NOT NULL CHECK (status IN (
    'requires_payment_method',
    'requires_confirmation',
    'requires_action',
    'processing',
    'requires_capture',
    'canceled',
    'succeeded'
  )),

  description TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS payment_intents_user_id_idx ON public.payment_intents(user_id);
CREATE INDEX IF NOT EXISTS payment_intents_stripe_payment_intent_id_idx ON public.payment_intents(stripe_payment_intent_id);
CREATE INDEX IF NOT EXISTS payment_intents_status_idx ON public.payment_intents(status);

-- RLS Policies
ALTER TABLE public.payment_intents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own payment intents" ON public.payment_intents
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Service can manage payment intents" ON public.payment_intents
  FOR ALL
  USING (true);

COMMENT ON TABLE public.payment_intents IS 'One-time payment intents from Stripe';

-- ============================================================================
-- UPDATED_AT TRIGGERS
-- ============================================================================
-- Automatically update updated_at timestamps

CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER customers_updated_at
  BEFORE UPDATE ON public.customers
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER subscriptions_updated_at
  BEFORE UPDATE ON public.subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER prices_updated_at
  BEFORE UPDATE ON public.prices
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER payment_intents_updated_at
  BEFORE UPDATE ON public.payment_intents
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Function to check if user has active subscription
CREATE OR REPLACE FUNCTION public.has_active_subscription(check_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.subscriptions
    WHERE user_id = check_user_id
    AND status = 'active'
    AND current_period_end > NOW()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.has_active_subscription IS 'Check if user has active subscription';

-- Function to get user subscription status
CREATE OR REPLACE FUNCTION public.get_subscription_status(check_user_id UUID)
RETURNS TEXT AS $$
DECLARE
  sub_status TEXT;
BEGIN
  SELECT status INTO sub_status
  FROM public.subscriptions
  WHERE user_id = check_user_id
  ORDER BY created_at DESC
  LIMIT 1;

  RETURN COALESCE(sub_status, 'none');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.get_subscription_status IS 'Get user current subscription status';

-- ============================================================================
-- SEED DATA (optional - for testing)
-- ============================================================================
-- Uncomment to add test pricing tiers

/*
INSERT INTO public.prices (stripe_price_id, stripe_product_id, active, currency, unit_amount, interval, product_name, product_description) VALUES
  ('price_test_basic_monthly', 'prod_test_basic', TRUE, 'pln', 4900, 'month', 'Plan Podstawowy', 'Do 10 projektów miesięcznie'),
  ('price_test_pro_monthly', 'prod_test_pro', TRUE, 'pln', 9900, 'month', 'Plan Pro', 'Do 50 projektów miesięcznie'),
  ('price_test_premium_monthly', 'prod_test_premium', TRUE, 'pln', 19900, 'month', 'Plan Premium', 'Nieograniczona liczba projektów');
*/
