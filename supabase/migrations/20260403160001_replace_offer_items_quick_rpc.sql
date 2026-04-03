-- ============================================================
-- Atomowe zastąpienie offer_items dla quick estimate (eliminacja race condition)
-- Branch: claude/fix-race-conditions-audit-Dl0Qk
-- Date: 2026-04-03
-- ============================================================
--
-- Problem: useQuickEstimateDraft.ts wykonywał DELETE + INSERT jako dwie
-- osobne operacje. Jeśli INSERT się nie powiódł po DELETE, oferta
-- zostawała bez pozycji (utrata danych).
--
-- Różnica vs save_offer_items: ta funkcja obsługuje kolumnę `metadata`
-- (JSONB z priceMode, laborCost, materialCost itp.) używaną wyłącznie
-- przez Quick Estimate. save_offer_items obsługuje warianty ofert.
--
-- Rollback:
--   DROP FUNCTION IF EXISTS replace_offer_items_quick;
-- ============================================================

CREATE OR REPLACE FUNCTION public.replace_offer_items_quick(
  p_offer_id UUID,
  p_user_id  UUID,
  p_items    JSONB  -- array of {name, unit, qty, item_type, unit_price_net, line_total_net, vat_rate, metadata}
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Verify ownership (RLS bypass mitigation: explicit check)
  IF NOT EXISTS (
    SELECT 1 FROM offers WHERE id = p_offer_id AND user_id = p_user_id
  ) THEN
    RAISE EXCEPTION 'Unauthorized: offer not found or not owned by user';
  END IF;

  -- Delete all existing items for this offer
  DELETE FROM offer_items WHERE offer_id = p_offer_id;

  -- Insert new items (skip if empty array)
  IF jsonb_array_length(p_items) > 0 THEN
    INSERT INTO offer_items (
      user_id, offer_id, name, unit, qty, item_type,
      unit_price_net, line_total_net, vat_rate, metadata
    )
    SELECT
      p_user_id,
      p_offer_id,
      (item->>'name')::TEXT,
      NULLIF(item->>'unit', ''),
      (item->>'qty')::NUMERIC,
      COALESCE(item->>'item_type', 'service'),
      (item->>'unit_price_net')::NUMERIC,
      (item->>'line_total_net')::NUMERIC,
      CASE WHEN item->>'vat_rate' IS NULL THEN NULL
           ELSE (item->>'vat_rate')::NUMERIC END,
      CASE WHEN item->'metadata' IS NULL THEN NULL
           ELSE (item->'metadata')::JSONB END
    FROM jsonb_array_elements(p_items) AS item;
  END IF;
END;
$$;

-- Only authenticated users can call this function
GRANT EXECUTE ON FUNCTION public.replace_offer_items_quick TO authenticated;

COMMENT ON FUNCTION public.replace_offer_items_quick IS
  'Atomowe zastąpienie pozycji oferty (quick estimate). DELETE+INSERT w jednej transakcji. Obsługuje metadata JSONB.';
