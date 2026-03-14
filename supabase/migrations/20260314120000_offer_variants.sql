-- ============================================================
-- Offer Variants — Sprint: offer-versioning-7RcU5
-- Date: 2026-03-14
-- ============================================================
--
-- Creates:
--   1. offer_variants — per-offer variant labels (up to 3)
--   2. variant_id column on offer_items — nullable FK
--   3. offer_photos — lightweight photo attachment with visibility flags
--   4. Updated resolve_offer_acceptance_link — includes variant data
--
-- Design:
--   - variant_id = NULL means the item belongs to the base (no-variant) offer
--   - When an offer has variants, ALL its items have a non-null variant_id
--   - Maximum 3 variants per offer (enforced in application layer, not DB)
--   - Photos reuse the existing project-photos storage bucket
-- ============================================================

-- ── 1. offer_variants ──────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.offer_variants (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  offer_id   uuid        NOT NULL REFERENCES public.offers(id) ON DELETE CASCADE,
  user_id    uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  label      text        NOT NULL CHECK (char_length(label) BETWEEN 1 AND 100),
  sort_order int         NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_offer_variants_offer_id
  ON public.offer_variants (offer_id);

CREATE INDEX IF NOT EXISTS idx_offer_variants_user_id
  ON public.offer_variants (user_id);

ALTER TABLE public.offer_variants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "offer_variants_select_own"
  ON public.offer_variants FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "offer_variants_insert_own"
  ON public.offer_variants FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "offer_variants_update_own"
  ON public.offer_variants FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "offer_variants_delete_own"
  ON public.offer_variants FOR DELETE
  USING (auth.uid() = user_id);

COMMENT ON TABLE public.offer_variants IS 'Named variants (e.g. Basic/Standard/Premium) for a single offer. Sprint offer-versioning-7RcU5.';
COMMENT ON COLUMN public.offer_variants.sort_order IS 'Display order of variant; 0 = first/default.';

-- ── 2. variant_id on offer_items ──────────────────────────────────────────────

ALTER TABLE public.offer_items
  ADD COLUMN IF NOT EXISTS variant_id uuid
    REFERENCES public.offer_variants(id) ON DELETE CASCADE;

COMMENT ON COLUMN public.offer_items.variant_id IS
  'NULL = no-variant mode (base offer). Non-null = item belongs to a specific variant. Sprint offer-versioning-7RcU5.';

CREATE INDEX IF NOT EXISTS idx_offer_items_variant_id
  ON public.offer_items (variant_id);

-- ── 3. offer_photos ───────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.offer_photos (
  id             uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  offer_id       uuid        NOT NULL REFERENCES public.offers(id) ON DELETE CASCADE,
  user_id        uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  storage_path   text        NOT NULL,
  show_in_pdf    boolean     NOT NULL DEFAULT false,
  show_in_public boolean     NOT NULL DEFAULT false,
  caption        text        CHECK (char_length(caption) <= 200),
  sort_order     int         NOT NULL DEFAULT 0,
  created_at     timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_offer_photos_offer_id
  ON public.offer_photos (offer_id);

CREATE INDEX IF NOT EXISTS idx_offer_photos_user_id
  ON public.offer_photos (user_id);

ALTER TABLE public.offer_photos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "offer_photos_select_own"
  ON public.offer_photos FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "offer_photos_insert_own"
  ON public.offer_photos FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "offer_photos_update_own"
  ON public.offer_photos FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "offer_photos_delete_own"
  ON public.offer_photos FOR DELETE
  USING (auth.uid() = user_id);

COMMENT ON TABLE public.offer_photos IS 'Photos attached to offers. Visibility controlled per photo. Sprint offer-versioning-7RcU5.';
COMMENT ON COLUMN public.offer_photos.show_in_pdf IS 'When true, photo is embedded in the generated PDF.';
COMMENT ON COLUMN public.offer_photos.show_in_public IS 'When true, photo is visible on the public client-facing offer page.';
COMMENT ON COLUMN public.offer_photos.storage_path IS 'Path in project-photos bucket: {userId}/offers/{offerId}/{uuid}.{ext}';

-- ── 4. Storage bucket policies for offer photos ───────────────────────────────
-- Offers use the existing project-photos bucket under a new sub-path.
-- No new bucket needed; path-based isolation is sufficient.

-- Allow authenticated users to insert offer photos in their own folder
INSERT INTO storage.policies (name, bucket_id, definition, operation, roles)
VALUES (
  'offer_photos_insert_own',
  'project-photos',
  $policy$(storage.foldername(name))[1] = auth.uid()::text AND (storage.foldername(name))[2] = 'offers'$policy$,
  'INSERT',
  '{authenticated}'
)
ON CONFLICT (name, bucket_id, operation) DO NOTHING;

-- ── 5. Updated resolve_offer_acceptance_link — adds variants & variant_id ─────
-- Non-breaking: adds 'variants' key and 'variant_id' to each item.
-- Clients that don't read these fields are unaffected.

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
  -- 1. Find link
  SELECT * INTO v_link FROM acceptance_links WHERE token = p_token;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'not_found');
  END IF;

  -- 2. Expiry check (server-side)
  IF v_link.expires_at < now() THEN
    RETURN jsonb_build_object('error', 'expired');
  END IF;

  -- 3. Get offer
  SELECT * INTO v_offer FROM offers WHERE id = v_link.offer_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'offer_not_found');
  END IF;

  -- 4. Only SENT/ACCEPTED/REJECTED offers are visible via token
  IF v_offer.status NOT IN ('SENT', 'ACCEPTED', 'REJECTED') THEN
    RETURN jsonb_build_object('error', 'not_available');
  END IF;

  -- 5. Client data (nullable)
  IF v_offer.client_id IS NOT NULL THEN
    SELECT name, email, phone, address INTO v_client
      FROM clients WHERE id = v_offer.client_id LIMIT 1;
  END IF;

  -- 6. Company profile (nullable)
  SELECT company_name, nip, street, postal_code, city, phone,
         email_for_offers, logo_url INTO v_company
    FROM profiles WHERE user_id = v_offer.user_id LIMIT 1;

  -- 7. Items — now includes variant_id
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
        'company_name',     v_company.company_name,
        'nip',              v_company.nip,
        'street',           v_company.street,
        'postal_code',      v_company.postal_code,
        'city',             v_company.city,
        'phone',            v_company.phone,
        'email_for_offers', v_company.email_for_offers,
        'logo_url',         v_company.logo_url
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
  IS 'Public (anon key) read of offer data via acceptance token. SECURITY DEFINER. Updated in offer-versioning-7RcU5 to include variants.';
