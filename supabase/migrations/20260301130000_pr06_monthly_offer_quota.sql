-- =============================================================================
-- Migration: Monthly offer quota tracking for free plan (PR-06)
-- Date:      2026-03-01
-- Purpose:   Add a helper function to count finalized offers per user per
--            calendar month (UTC). Used by the frontend quota hook.
--
-- Rules (ADR-0004):
--   - Counted statuses: 'sent' | 'accepted' | 'rejected'
--   - Drafts ('draft', 'pending', 'viewed', 'expired', 'withdrawn') do NOT count
--   - Calendar month boundary: UTC midnight on the 1st
--   - FREE_TIER_OFFER_LIMIT = 3  (enforced client-side; DB trigger enforces all-time limit)
--
-- This migration does NOT touch existing triggers or plan_limits.
-- =============================================================================

BEGIN;

-- ============================================================================
-- 1. INDEX — fast monthly query on offer_approvals
--    Covers (user_id, status, created_at) for calendar-month count queries.
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_offer_approvals_user_status_created
  ON public.offer_approvals (user_id, status, created_at);

COMMENT ON INDEX public.idx_offer_approvals_user_status_created IS
  'Supports PR-06 monthly quota count: WHERE user_id = ? AND status IN (...) AND created_at >= month_start';

-- ============================================================================
-- 2. FUNCTION — count finalized offers for a user in the current calendar month
--
--    Returns: integer count of offers with status 'sent' | 'accepted' | 'rejected'
--    created in the current UTC calendar month.
--
--    SECURITY DEFINER so it can be called by the authenticated anon key
--    without granting broad SELECT on offer_approvals to anon role.
-- ============================================================================

CREATE OR REPLACE FUNCTION public.count_monthly_finalized_offers(p_user_id UUID)
RETURNS INTEGER
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COUNT(*)::INTEGER
  FROM   public.offer_approvals
  WHERE  user_id    = p_user_id
  AND    status     IN ('sent', 'accepted', 'rejected')
  AND    created_at >= date_trunc('month', NOW() AT TIME ZONE 'UTC');
$$;

COMMENT ON FUNCTION public.count_monthly_finalized_offers(UUID) IS
  'PR-06: Returns the number of finalized (sent|accepted|rejected) offers for a user '
  'in the current UTC calendar month. Used by useFreeTierOfferQuota hook for '
  'free-plan paywall enforcement. Drafts do not count.';

-- Grant EXECUTE to authenticated users so the hook can call it via RPC
GRANT EXECUTE ON FUNCTION public.count_monthly_finalized_offers(UUID)
  TO authenticated;

COMMIT;
