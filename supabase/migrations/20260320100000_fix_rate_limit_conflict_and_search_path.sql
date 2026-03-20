-- =============================================================================
-- Migration: Fix rate limit ON CONFLICT mismatch + add SET search_path
-- Date:      2026-03-20
-- Purpose:
--   1. Add a UNIQUE INDEX on (identifier, endpoint) for api_rate_limits so the
--      ON CONFLICT (identifier, endpoint) clause in check_and_increment_rate_limit
--      works correctly. The existing constraint is on 3 columns
--      (identifier, endpoint, window_start) which doesn't match.
--
--   2. Add SET search_path = public to SECURITY DEFINER functions that were
--      missing it, to prevent search_path hijacking attacks:
--      - check_and_increment_rate_limit (from 20260320000001)
--      - save_offer_items (from 20260320000002)
--
-- Note: resolve_offer_token, resolve_accept_token, and check_monthly_offer_quota
--       were not found in the codebase. count_monthly_finalized_offers already
--       has SET search_path = public set correctly.
-- =============================================================================

BEGIN;

-- ============================================================================
-- 1. UNIQUE INDEX on (identifier, endpoint) for ON CONFLICT support
--    The function check_and_increment_rate_limit uses ON CONFLICT (identifier, endpoint)
--    but only a 3-column UNIQUE constraint existed: (identifier, endpoint, window_start).
--    This index enables the 2-column ON CONFLICT clause.
-- ============================================================================

CREATE UNIQUE INDEX IF NOT EXISTS idx_api_rate_limits_identifier_endpoint
  ON public.api_rate_limits (identifier, endpoint);

COMMENT ON INDEX public.idx_api_rate_limits_identifier_endpoint IS
  'Supports ON CONFLICT (identifier, endpoint) in check_and_increment_rate_limit function';

-- ============================================================================
-- 2. ALTER check_and_increment_rate_limit to SET search_path = public
--    Recreate the function with the same body but adding search_path security.
-- ============================================================================

CREATE OR REPLACE FUNCTION check_and_increment_rate_limit(
  p_identifier text,
  p_endpoint text,
  p_max_requests int,
  p_window_ms bigint
) RETURNS TABLE(allowed boolean, current_count int, reset_at timestamptz)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_window_start timestamptz;
  v_count int;
  v_reset_at timestamptz;
BEGIN
  v_window_start := NOW() - (p_window_ms || ' milliseconds')::interval;

  -- Clean stale entries (older than window)
  DELETE FROM api_rate_limits
  WHERE window_start < v_window_start;

  -- Atomic increment-or-insert using advisory lock on identifier hash
  -- This ensures no race condition between check and increment
  INSERT INTO api_rate_limits (identifier, endpoint, request_count, window_start)
  VALUES (p_identifier, p_endpoint, 1, NOW())
  ON CONFLICT (identifier, endpoint)
  DO UPDATE SET
    request_count = CASE
      WHEN api_rate_limits.window_start < v_window_start
      THEN 1  -- Reset window
      ELSE api_rate_limits.request_count + 1
    END,
    window_start = CASE
      WHEN api_rate_limits.window_start < v_window_start
      THEN NOW()
      ELSE api_rate_limits.window_start
    END
  RETURNING request_count, window_start INTO v_count, v_reset_at;

  v_reset_at := v_reset_at + (p_window_ms || ' milliseconds')::interval;

  RETURN QUERY SELECT
    (v_count <= p_max_requests) AS allowed,
    v_count AS current_count,
    v_reset_at AS reset_at;
END;
$$;

-- ============================================================================
-- 3. ALTER save_offer_items to SET search_path = public
--    Recreate the function with the same body but adding search_path security.
-- ============================================================================

CREATE OR REPLACE FUNCTION save_offer_items(
  p_offer_id uuid,
  p_user_id uuid,
  p_variants jsonb,
  p_items   jsonb
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_variant jsonb;
  v_item    jsonb;
  v_variant_id uuid;
BEGIN
  -- Verify ownership (RLS bypass mitigation: explicit check)
  IF NOT EXISTS (
    SELECT 1 FROM offers WHERE id = p_offer_id AND user_id = p_user_id
  ) THEN
    RAISE EXCEPTION 'Unauthorized: offer not found or not owned by user';
  END IF;

  -- Delete all existing variants (cascades to their items via FK ON DELETE CASCADE)
  DELETE FROM offer_variants WHERE offer_id = p_offer_id;

  -- Delete remaining no-variant items
  DELETE FROM offer_items WHERE offer_id = p_offer_id;

  -- Insert variants mode
  IF jsonb_array_length(p_variants) > 0 THEN
    FOR v_variant IN SELECT * FROM jsonb_array_elements(p_variants) LOOP
      -- Insert variant
      INSERT INTO offer_variants (offer_id, user_id, label, sort_order)
      VALUES (
        p_offer_id,
        p_user_id,
        v_variant->>'label',
        (v_variant->>'sort_order')::int
      )
      RETURNING id INTO v_variant_id;

      -- Insert items for this variant
      FOR v_item IN SELECT * FROM jsonb_array_elements(v_variant->'items') LOOP
        INSERT INTO offer_items (
          user_id, offer_id, item_type, name, unit, qty,
          unit_price_net, vat_rate, line_total_net, variant_id
        ) VALUES (
          p_user_id,
          p_offer_id,
          v_item->>'item_type',
          v_item->>'name',
          NULLIF(v_item->>'unit', ''),
          (v_item->>'qty')::numeric,
          (v_item->>'unit_price_net')::numeric,
          CASE WHEN v_item->>'vat_rate' IS NULL THEN NULL ELSE (v_item->>'vat_rate')::numeric END,
          ROUND((v_item->>'qty')::numeric * (v_item->>'unit_price_net')::numeric, 2),
          v_variant_id
        );
      END LOOP;
    END LOOP;

  -- Insert no-variant mode items
  ELSIF jsonb_array_length(p_items) > 0 THEN
    FOR v_item IN SELECT * FROM jsonb_array_elements(p_items) LOOP
      INSERT INTO offer_items (
        user_id, offer_id, item_type, name, unit, qty,
        unit_price_net, vat_rate, line_total_net, variant_id
      ) VALUES (
        p_user_id,
        p_offer_id,
        v_item->>'item_type',
        v_item->>'name',
        NULLIF(v_item->>'unit', ''),
        (v_item->>'qty')::numeric,
        (v_item->>'unit_price_net')::numeric,
        CASE WHEN v_item->>'vat_rate' IS NULL THEN NULL ELSE (v_item->>'vat_rate')::numeric END,
        ROUND((v_item->>'qty')::numeric * (v_item->>'unit_price_net')::numeric, 2),
        NULL
      );
    END LOOP;
  END IF;
END;
$$;

COMMIT;
