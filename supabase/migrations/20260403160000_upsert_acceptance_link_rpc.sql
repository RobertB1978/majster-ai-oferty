-- ============================================================
-- Atomowy UPSERT dla acceptance_links (eliminacja race condition)
-- Branch: claude/fix-race-conditions-audit-Dl0Qk
-- Date: 2026-04-03
-- ============================================================
--
-- Problem: useAcceptanceLink.ts wykonywał DELETE + INSERT jako dwie
-- osobne operacje. Jeśli INSERT się nie powiódł po DELETE, oferta
-- zostawała bez linku akceptacji.
--
-- Rozwiązanie: Pojedyncza operacja UPSERT wykorzystująca istniejący
-- UNIQUE constraint na offer_id (acceptance_links_offer_unique).
--
-- Rollback:
--   DROP FUNCTION IF EXISTS upsert_acceptance_link;
-- ============================================================

CREATE OR REPLACE FUNCTION public.upsert_acceptance_link(
  p_offer_id   UUID,
  p_user_id    UUID,
  p_token      UUID DEFAULT gen_random_uuid(),
  p_expires_at TIMESTAMPTZ DEFAULT now() + INTERVAL '30 days'
)
RETURNS acceptance_links
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  INSERT INTO acceptance_links (offer_id, user_id, token, expires_at)
  VALUES (p_offer_id, p_user_id, p_token, p_expires_at)
  ON CONFLICT (offer_id)
  DO UPDATE SET
    token      = EXCLUDED.token,
    expires_at = EXCLUDED.expires_at,
    updated_at = now()
  RETURNING *;
$$;

-- Only authenticated users can call this function
GRANT EXECUTE ON FUNCTION public.upsert_acceptance_link TO authenticated;

COMMENT ON FUNCTION public.upsert_acceptance_link IS
  'Atomowy UPSERT linku akceptacji. Eliminuje race condition z DELETE+INSERT. Wykorzystuje UNIQUE(offer_id).';
