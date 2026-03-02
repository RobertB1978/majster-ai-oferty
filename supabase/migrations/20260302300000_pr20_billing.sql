-- =============================================================================
-- Migration: PR-20 — Stripe Billing: entitlement fixes + server-side enforcement
-- Date:      2026-03-02
-- Purpose:
--   1. Fix user_subscriptions RLS — authenticated users must NOT self-upgrade.
--      Only service_role (webhook handler) may write subscription rows.
--   2. Fix subscription_events.subscription_id — make nullable so catch-all
--      audit inserts without subscription_id do not fail.
--   3. Add server-side offer send limit enforcement on the `offers` table.
--      Fires BEFORE UPDATE when status transitions to 'SENT'; checks
--      count_monthly_finalized_offers() against the free tier limit (3/month).
--      Pro+ plans are allowed unlimited sends.
--
-- Security contract:
--   - PLAN_LIMIT_REACHED exception message is the client-detectable signal.
--   - Unknown Stripe statuses already map to "inactive" (least privilege) via
--     stripe-utils.ts → mapSubscriptionStatus().
--   - This trigger is the final guard; client-side checks in
--     useFreeTierOfferQuota are UI-only hints.
--
-- Rollback:
--   DROP TRIGGER IF EXISTS trg_enforce_monthly_offer_send_limit ON public.offers;
--   DROP FUNCTION IF EXISTS public.enforce_monthly_offer_send_limit();
--   ALTER TABLE public.subscription_events ALTER COLUMN subscription_id SET NOT NULL;
--   (Re-add user INSERT/UPDATE policies on user_subscriptions if needed for rollback only)
-- =============================================================================

BEGIN;

-- ============================================================================
-- 1. SECURITY FIX — user_subscriptions: remove user-writable INSERT/UPDATE
--    policies.  Authenticated users should only SELECT their own row.
--    All writes happen via service_role in Edge Functions (webhook + checkout).
-- ============================================================================

DROP POLICY IF EXISTS "Users can insert their own subscription" ON public.user_subscriptions;
DROP POLICY IF EXISTS "Users can update their own subscription" ON public.user_subscriptions;

-- Retain SELECT-only access for authenticated users
DROP POLICY IF EXISTS "Users can view their own subscription" ON public.user_subscriptions;
CREATE POLICY "user_subscriptions_select_own"
  ON public.user_subscriptions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

COMMENT ON TABLE public.user_subscriptions IS
  'User subscription rows. Readable by owner (authenticated). '
  'Written ONLY by service_role via stripe-webhook and create-checkout-session EFs. '
  'Direct client writes are blocked to prevent self-upgrade.';

-- ============================================================================
-- 2. BUG FIX — subscription_events.subscription_id: make nullable
--    The catch-all audit INSERT in stripe-webhook does not always have a
--    subscription_id (e.g. for unhandled event types).  Making it nullable
--    prevents silent webhook failures.
-- ============================================================================

ALTER TABLE public.subscription_events
  ALTER COLUMN subscription_id DROP NOT NULL;

COMMENT ON COLUMN public.subscription_events.subscription_id IS
  'Stripe subscription ID (sub_…). Nullable: some audit entries are for '
  'non-subscription events (e.g. unhandled event types).';

-- ============================================================================
-- 3. SERVER-SIDE OFFER SEND LIMIT — BEFORE UPDATE trigger on public.offers
--
--    Enforcement rule (ADR-0004, unchanged):
--      Free plan: max 3 sent offers per calendar month (UTC).
--      Pro+ plans: unlimited.
--
--    Trigger fires only on transitions from a non-SENT status to SENT.
--    count_monthly_finalized_offers() is STABLE + SECURITY DEFINER and counts
--    from both offer_approvals (legacy) and offers (new wizard flow).
--    At trigger time the current row is not yet committed as SENT, so the
--    count does NOT include the pending offer — correct behaviour.
--
--    Error contract (matches client handler in useSendOffer):
--      EXCEPTION MESSAGE = 'PLAN_LIMIT_REACHED'
-- ============================================================================

CREATE OR REPLACE FUNCTION public.enforce_monthly_offer_send_limit()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_plan_id       TEXT;
  v_monthly_count INTEGER;
BEGIN
  -- Only enforce when transitioning to SENT from a non-SENT status
  IF NEW.status != 'SENT' OR OLD.status = 'SENT' THEN
    RETURN NEW;
  END IF;

  -- Resolve the user's active plan (fall back to 'free' when no subscription)
  SELECT COALESCE(us.plan_id, 'free') INTO v_plan_id
  FROM   public.user_subscriptions us
  WHERE  us.user_id = NEW.user_id
  AND    us.status  IN ('active', 'trial')
  LIMIT 1;

  IF v_plan_id IS NULL THEN
    v_plan_id := 'free';
  END IF;

  -- Pro / Starter / Business / Enterprise → unlimited, skip check
  IF v_plan_id != 'free' THEN
    RETURN NEW;
  END IF;

  -- Free plan: count finalized offers this calendar month
  SELECT public.count_monthly_finalized_offers(NEW.user_id) INTO v_monthly_count;

  IF v_monthly_count >= 3 THEN  -- FREE_TIER_OFFER_LIMIT constant
    RAISE EXCEPTION 'PLAN_LIMIT_REACHED'
      USING
        DETAIL = format(
          'Monthly offer limit reached. Free plan allows 3 sent offers per '
          'calendar month (UTC). Current count: %s. '
          'Upgrade to Pro to send unlimited offers.',
          v_monthly_count
        ),
        HINT = 'Upgrade your subscription to remove the monthly offer limit.';
  END IF;

  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.enforce_monthly_offer_send_limit() IS
  'PR-20: BEFORE UPDATE trigger on public.offers. '
  'Raises PLAN_LIMIT_REACHED when a free-plan user tries to transition an offer '
  'to SENT status after exhausting their 3/month quota. '
  'Pro+ plans bypass this check. SECURITY DEFINER — read-only, scoped to user_id.';

DROP TRIGGER IF EXISTS trg_enforce_monthly_offer_send_limit ON public.offers;
CREATE TRIGGER trg_enforce_monthly_offer_send_limit
  BEFORE UPDATE ON public.offers
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_monthly_offer_send_limit();

COMMIT;
