-- =============================================================================
-- Migration: PR-11 — Update quota function to include offers table
-- Date:      2026-03-01
-- Purpose:   Extend count_monthly_finalized_offers() to also count offers
--            from the new `offers` table (PR-09+) that have been sent/finalized.
--            Backward-compatible: still counts offer_approvals for the old flow.
--
-- Quota rule (ADR-0004, unchanged):
--   - FREE_TIER_OFFER_LIMIT = 3 per calendar month (UTC)
--   - Counted: SENT | ACCEPTED | REJECTED statuses
--   - Drafts (DRAFT) do NOT count
--   - For offers table: counted by sent_at (month of actual send, not creation)
--   - For offer_approvals: counted by created_at (legacy, backward compat)
--
-- Idempotency (PR-11 requirement):
--   - Re-sending an already-SENT offer does NOT change sent_at → no double-count
-- =============================================================================

BEGIN;

-- ============================================================================
-- 1. INDEX — fast monthly query on offers table (status + sent_at)
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_offers_user_status_sent_at
  ON public.offers (user_id, status, sent_at);

COMMENT ON INDEX public.idx_offers_user_status_sent_at IS
  'Supports PR-11 monthly quota count: WHERE user_id=? AND status IN (SENT,...) AND sent_at >= month_start';

-- ============================================================================
-- 2. UPDATE FUNCTION — add offers table to quota count
--
--    Returns: sum of:
--      a) offer_approvals with status 'sent'/'accepted'/'rejected' (created this month)  — old flow
--      b) offers with status 'SENT'/'ACCEPTED'/'REJECTED' sent this month               — new flow (PR-11+)
--
--    The two flows use different tables, so there is no double-counting.
-- ============================================================================

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
    AND    status     IN ('sent', 'accepted', 'rejected')
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
  'PR-11 (updated): Returns the number of finalized offers for a user in the '
  'current UTC calendar month. Counts from both offer_approvals (legacy) and '
  'offers table (new wizard flow). Counted by sent_at for new flow. '
  'Idempotent: re-sending same offer does not move sent_at.';

-- GRANT unchanged (was already granted to authenticated in PR-06)

COMMIT;
