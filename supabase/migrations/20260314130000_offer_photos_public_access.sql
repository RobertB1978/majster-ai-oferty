-- ============================================================
-- offer_photos public access — PR: improve-pdf-offer-ux-hRoPO
--
-- Enables unauthenticated (anon) clients to:
--   1. Read storage objects from 'project-photos' bucket
--      for photos where show_in_public = true (to generate
--      signed URLs via the anon key).
--   2. Call get_public_offer_photos(token) to retrieve the
--      list of public photo paths for a valid acceptance link.
--
-- Security model:
--   - Storage policy is scoped to show_in_public = true only
--   - DB function validates the acceptance token before returning
--   - SECURITY DEFINER function bypasses RLS safely (read-only)
--   - Expired/invalid tokens return empty array
-- ============================================================

-- ── 1. Storage RLS policy: allow anon to SELECT show_in_public photos ─────────
-- Required so that createSignedUrl() with the anon key succeeds for these objects.

CREATE POLICY "project_photos_public_offer_anon_read"
  ON storage.objects FOR SELECT
  TO anon
  USING (
    bucket_id = 'project-photos'
    AND EXISTS (
      SELECT 1
      FROM public.offer_photos op
      WHERE op.storage_path = name
        AND op.show_in_public = true
    )
  );

-- ── 2. SECURITY DEFINER function: return public photo paths for a valid token ──

CREATE OR REPLACE FUNCTION public.get_public_offer_photos(p_token uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_offer_id uuid;
  v_result   jsonb;
BEGIN
  -- Validate token — must exist and not be expired
  SELECT offer_id INTO v_offer_id
  FROM public.acceptance_links
  WHERE token     = p_token
    AND expires_at > now();

  IF v_offer_id IS NULL THEN
    RETURN '[]'::jsonb;
  END IF;

  -- Return public photos for this offer (storage_path + caption only)
  SELECT COALESCE(
    jsonb_agg(
      jsonb_build_object(
        'id',           id,
        'storage_path', storage_path,
        'caption',      caption,
        'sort_order',   sort_order
      ) ORDER BY sort_order
    ),
    '[]'::jsonb
  )
  INTO v_result
  FROM public.offer_photos
  WHERE offer_id      = v_offer_id
    AND show_in_public = true;

  RETURN v_result;
END;
$$;

COMMENT ON FUNCTION public.get_public_offer_photos(uuid)
  IS 'Returns storage paths for show_in_public=true photos of an offer identified by acceptance token. SECURITY DEFINER. PR improve-pdf-offer-ux-hRoPO.';

-- Grant anon execution right
GRANT EXECUTE ON FUNCTION public.get_public_offer_photos(uuid) TO anon;
