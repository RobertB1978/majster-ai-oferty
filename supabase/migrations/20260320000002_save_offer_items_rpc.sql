-- Transactional offer save function
-- Fixes partial-state corruption when save is interrupted (BUG-02)
-- All operations run in a single transaction: delete old → insert new

CREATE OR REPLACE FUNCTION save_offer_items(
  p_offer_id uuid,
  p_user_id uuid,
  p_variants jsonb,   -- array of {label, sort_order, items: [{item_type, name, unit, qty, unit_price_net, vat_rate}]}
  p_items   jsonb     -- array of items for no-variant mode (empty array when using variants)
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
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

GRANT EXECUTE ON FUNCTION save_offer_items TO authenticated;

COMMENT ON FUNCTION save_offer_items IS
'Atomically replaces all items and variants for an offer. Runs in single transaction to prevent partial state corruption.';
