-- =============================================================================
-- Migration: Fix server-side offer send enforcement for INSERT path (P0)
-- Date:      2026-04-09
-- Purpose:
--   Close bypass where a client could insert an `offers` row directly with
--   status='SENT' and skip the UPDATE-only trigger from PR-20.
--
-- Security contract:
--   - PLAN_LIMIT_REACHED remains the client-detectable error message.
--   - Applies to BOTH:
--       1) INSERT with NEW.status='SENT'
--       2) UPDATE transition non-SENT -> SENT
--
-- Rollback:
--   - Recreate trigger as BEFORE UPDATE only (old behavior).
-- =============================================================================

BEGIN;

CREATE OR REPLACE FUNCTION public.enforce_monthly_offer_send_limit()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_plan_id       TEXT;
  v_monthly_count INTEGER;
  v_is_send_event BOOLEAN;
BEGIN
  -- INSERT path: enforce only when row is created already as SENT.
  -- UPDATE path: enforce only on non-SENT -> SENT transition.
  IF TG_OP = 'INSERT' THEN
    v_is_send_event := (NEW.status = 'SENT');
  ELSE
    v_is_send_event := (NEW.status = 'SENT' AND OLD.status <> 'SENT');
  END IF;

  IF NOT v_is_send_event THEN
    RETURN NEW;
  END IF;

  -- Resolve the user's active plan (fall back to 'free' when no subscription).
  SELECT COALESCE(us.plan_id, 'free') INTO v_plan_id
  FROM   public.user_subscriptions us
  WHERE  us.user_id = NEW.user_id
  AND    us.status  IN ('active', 'trial')
  LIMIT 1;

  IF v_plan_id IS NULL THEN
    v_plan_id := 'free';
  END IF;

  -- Paid plans bypass free-tier monthly send limit.
  IF v_plan_id <> 'free' THEN
    RETURN NEW;
  END IF;

  -- Free plan: count finalized offers this UTC calendar month.
  SELECT public.count_monthly_finalized_offers(NEW.user_id) INTO v_monthly_count;

  IF v_monthly_count >= 3 THEN
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

DROP TRIGGER IF EXISTS trg_enforce_monthly_offer_send_limit ON public.offers;
CREATE TRIGGER trg_enforce_monthly_offer_send_limit
  BEFORE INSERT OR UPDATE ON public.offers
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_monthly_offer_send_limit();

COMMIT;
