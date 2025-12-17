-- Stripe Integration Migration
-- Adds subscription_events table for Stripe webhook logging
-- Updates user_subscriptions to support 'pro' plan

-- 1. Update user_subscriptions plan_id constraint to include 'pro'
ALTER TABLE public.user_subscriptions
DROP CONSTRAINT IF EXISTS user_subscriptions_plan_id_check;

ALTER TABLE public.user_subscriptions
ADD CONSTRAINT user_subscriptions_plan_id_check
CHECK (plan_id IN ('free', 'pro', 'starter', 'business', 'enterprise'));

-- 2. Add cancel_at_period_end column for graceful cancellation
ALTER TABLE public.user_subscriptions
ADD COLUMN IF NOT EXISTS cancel_at_period_end BOOLEAN DEFAULT false;

-- 3. Add trial_end column
ALTER TABLE public.user_subscriptions
ADD COLUMN IF NOT EXISTS trial_end TIMESTAMP WITH TIME ZONE;

-- 4. Create subscription_events table for Stripe webhook logging
CREATE TABLE IF NOT EXISTS public.subscription_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  subscription_id TEXT NOT NULL, -- stripe_subscription_id
  event_type TEXT NOT NULL, -- Stripe event type (customer.subscription.created, etc.)
  event_data JSONB NOT NULL, -- Full Stripe event payload
  processed BOOLEAN DEFAULT false,
  processed_at TIMESTAMP WITH TIME ZONE,
  error TEXT, -- Error message if processing failed
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add index for faster queries
CREATE INDEX IF NOT EXISTS idx_subscription_events_user_id
ON public.subscription_events(user_id);

CREATE INDEX IF NOT EXISTS idx_subscription_events_subscription_id
ON public.subscription_events(subscription_id);

CREATE INDEX IF NOT EXISTS idx_subscription_events_event_type
ON public.subscription_events(event_type);

CREATE INDEX IF NOT EXISTS idx_subscription_events_processed
ON public.subscription_events(processed, created_at);

-- Enable RLS
ALTER TABLE public.subscription_events ENABLE ROW LEVEL SECURITY;

-- RLS policies for subscription_events
CREATE POLICY "Users can view their own subscription events"
ON public.subscription_events FOR SELECT
USING (auth.uid() = user_id);

-- Service role can insert/update events (for webhook processing)
CREATE POLICY "Service role can manage subscription events"
ON public.subscription_events FOR ALL
USING (auth.jwt() ->> 'role' = 'service_role');

-- 5. Create function to sync subscription from Stripe webhook
CREATE OR REPLACE FUNCTION public.sync_subscription_from_stripe(
  p_user_id UUID,
  p_stripe_customer_id TEXT,
  p_stripe_subscription_id TEXT,
  p_plan_id TEXT,
  p_status TEXT,
  p_current_period_start TIMESTAMP WITH TIME ZONE,
  p_current_period_end TIMESTAMP WITH TIME ZONE,
  p_cancel_at_period_end BOOLEAN,
  p_trial_end TIMESTAMP WITH TIME ZONE
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Upsert subscription
  INSERT INTO public.user_subscriptions (
    user_id,
    stripe_customer_id,
    stripe_subscription_id,
    plan_id,
    status,
    current_period_start,
    current_period_end,
    cancel_at_period_end,
    trial_end,
    updated_at
  ) VALUES (
    p_user_id,
    p_stripe_customer_id,
    p_stripe_subscription_id,
    p_plan_id,
    p_status,
    p_current_period_start,
    p_current_period_end,
    p_cancel_at_period_end,
    p_trial_end,
    now()
  )
  ON CONFLICT (user_id) DO UPDATE SET
    stripe_customer_id = EXCLUDED.stripe_customer_id,
    stripe_subscription_id = EXCLUDED.stripe_subscription_id,
    plan_id = EXCLUDED.plan_id,
    status = EXCLUDED.status,
    current_period_start = EXCLUDED.current_period_start,
    current_period_end = EXCLUDED.current_period_end,
    cancel_at_period_end = EXCLUDED.cancel_at_period_end,
    trial_end = EXCLUDED.trial_end,
    updated_at = now();
END;
$$;

-- Grant execute permission to service role
GRANT EXECUTE ON FUNCTION public.sync_subscription_from_stripe TO service_role;

-- Add comment for documentation
COMMENT ON TABLE public.subscription_events IS 'Logs all Stripe webhook events for subscriptions';
COMMENT ON FUNCTION public.sync_subscription_from_stripe IS 'Syncs user subscription from Stripe webhook data';
