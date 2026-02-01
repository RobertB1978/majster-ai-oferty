-- PR#3: Add offer view tracking
-- Records when a client opens the public offer link

ALTER TABLE public.offer_approvals
ADD COLUMN IF NOT EXISTS viewed_at TIMESTAMPTZ DEFAULT NULL;

-- SECURITY DEFINER function to record view from public page (bypasses RLS)
-- Only updates pending offers, only sets viewed_at once (idempotent)
CREATE OR REPLACE FUNCTION public.record_offer_view(p_token UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE offer_approvals
  SET viewed_at = NOW()
  WHERE public_token = p_token
    AND status = 'pending'
    AND viewed_at IS NULL;
END;
$$;

GRANT EXECUTE ON FUNCTION public.record_offer_view(UUID) TO anon;
GRANT EXECUTE ON FUNCTION public.record_offer_view(UUID) TO authenticated;
