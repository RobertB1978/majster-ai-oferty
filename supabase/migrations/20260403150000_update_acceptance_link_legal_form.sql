-- Migration: Update resolve_offer_acceptance_link to return legal form fields
-- Purpose: Public offer acceptance page needs regon/krs/representative info
-- Note: This replaces the function from PR-14 (20260314120000_offer_variants.sql)

CREATE OR REPLACE FUNCTION public.resolve_offer_acceptance_link(p_token uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_link     acceptance_links%ROWTYPE;
  v_offer    offers%ROWTYPE;
  v_client   record;
  v_company  record;
  v_items    jsonb;
  v_variants jsonb;
BEGIN
  -- 1. Look up the acceptance link row
  SELECT * INTO v_link
    FROM acceptance_links WHERE token = p_token LIMIT 1;

  IF v_link IS NULL THEN
    RETURN jsonb_build_object('error', 'not_found');
  END IF;

  -- 2. Check expiry
  IF v_link.expires_at IS NOT NULL AND v_link.expires_at < now() THEN
    RETURN jsonb_build_object('error', 'expired');
  END IF;

  -- 3. Bump view counter (best-effort)
  UPDATE acceptance_links
    SET views = views + 1, last_viewed_at = now()
    WHERE id = v_link.id;

  -- 4. Load the offer
  SELECT * INTO v_offer FROM offers WHERE id = v_link.offer_id LIMIT 1;
  IF v_offer IS NULL THEN
    RETURN jsonb_build_object('error', 'offer_deleted');
  END IF;

  -- 5. Client data (nullable)
  IF v_offer.client_id IS NOT NULL THEN
    SELECT name, email, phone, address INTO v_client
      FROM clients WHERE id = v_offer.client_id LIMIT 1;
  END IF;

  -- 6. Company profile (nullable) — includes legal form fields
  SELECT company_name, legal_form, nip, regon, krs, owner_name,
         representative_name, representative_role,
         street, postal_code, city, phone,
         email_for_offers, logo_url INTO v_company
    FROM profiles WHERE user_id = v_offer.user_id LIMIT 1;

  -- 7. Items — includes variant_id
  SELECT jsonb_agg(
    jsonb_build_object(
      'id',             id,
      'name',           name,
      'unit',           unit,
      'qty',            qty,
      'unit_price_net', unit_price_net,
      'vat_rate',       vat_rate,
      'line_total_net', line_total_net,
      'variant_id',     variant_id
    ) ORDER BY created_at
  ) INTO v_items
  FROM offer_items WHERE offer_id = v_offer.id;

  -- 8. Variants (sorted)
  SELECT jsonb_agg(
    jsonb_build_object(
      'id',         id,
      'label',      label,
      'sort_order', sort_order
    ) ORDER BY sort_order, created_at
  ) INTO v_variants
  FROM offer_variants WHERE offer_id = v_offer.id;

  RETURN jsonb_build_object(
    'offer', jsonb_build_object(
      'id',          v_offer.id,
      'title',       v_offer.title,
      'status',      v_offer.status,
      'currency',    v_offer.currency,
      'total_net',   v_offer.total_net,
      'total_vat',   v_offer.total_vat,
      'total_gross', v_offer.total_gross,
      'created_at',  v_offer.created_at,
      'accepted_at', v_offer.accepted_at,
      'rejected_at', v_offer.rejected_at
    ),
    'client', CASE
      WHEN v_client.name IS NOT NULL THEN jsonb_build_object(
        'name',    v_client.name,
        'email',   v_client.email,
        'phone',   v_client.phone,
        'address', v_client.address
      )
      ELSE NULL
    END,
    'company', CASE
      WHEN v_company.company_name IS NOT NULL THEN jsonb_build_object(
        'company_name',          v_company.company_name,
        'legal_form',            v_company.legal_form,
        'nip',                   v_company.nip,
        'regon',                 v_company.regon,
        'krs',                   v_company.krs,
        'owner_name',            v_company.owner_name,
        'representative_name',   v_company.representative_name,
        'representative_role',   v_company.representative_role,
        'street',                v_company.street,
        'postal_code',           v_company.postal_code,
        'city',                  v_company.city,
        'phone',                 v_company.phone,
        'email_for_offers',      v_company.email_for_offers,
        'logo_url',              v_company.logo_url
      )
      ELSE NULL
    END,
    'items',      COALESCE(v_items, '[]'::jsonb),
    'variants',   COALESCE(v_variants, '[]'::jsonb),
    'expires_at', v_link.expires_at
  );
END;
$$;

COMMENT ON FUNCTION public.resolve_offer_acceptance_link(uuid)
  IS 'Public (anon key) read of offer data via acceptance token. SECURITY DEFINER. Updated to include legal form, regon, krs, representative fields.';
