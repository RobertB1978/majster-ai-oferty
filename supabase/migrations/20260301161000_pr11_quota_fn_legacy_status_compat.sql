-- =============================================================================
-- Migration: PR-11 follow-up — legacy status compatibility for quota function
-- Date:      2026-03-01
-- Purpose:   Include legacy `approved` offer_approvals rows in monthly finalized
--            quota count while keeping `pending` excluded.
-- =============================================================================

BEGIN;

CREATE OR REPLACE FUNCTION public.count_monthly_finalized_offers(p_user_id UUID)
RETURNS INTEGER
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT (
    -- Legacy flow: offer_approvals (counted by created_at)
    SELECT COUNT(*)::INTEGER
    FROM   public.offer_approvals
    WHERE  user_id    = p_user_id
    AND    status     IN ('approved', 'sent', 'accepted', 'rejected')
    AND    created_at >= date_trunc('month', NOW() AT TIME ZONE 'UTC')
  ) + (
    -- New wizard flow: offers table (counted by sent_at for accurate monthly tracking)
    SELECT COUNT(*)::INTEGER
    FROM   public.offers
    WHERE  user_id  = p_user_id
    AND    status   IN ('SENT', 'ACCEPTED', 'REJECTED')
    AND    sent_at  >= date_trunc('month', NOW() AT TIME ZONE 'UTC')
  );
$$;

COMMENT ON FUNCTION public.count_monthly_finalized_offers(UUID) IS
  'PR-11 (legacy-compat): Returns the number of finalized offers for a user in '
  'the current UTC calendar month. Counts legacy approved/sent/accepted/rejected '
  'from offer_approvals and SENT/ACCEPTED/REJECTED from offers. pending excluded.';

COMMIT;
