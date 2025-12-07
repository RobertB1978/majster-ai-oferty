-- Add token expiration to offer_approvals
ALTER TABLE public.offer_approvals 
ADD COLUMN IF NOT EXISTS expires_at TIMESTAMP WITH TIME ZONE DEFAULT (now() + interval '30 days');

-- Update existing pending approvals to have expiration
UPDATE public.offer_approvals 
SET expires_at = created_at + interval '30 days'
WHERE expires_at IS NULL;

-- Update validate_offer_token function to check expiration
CREATE OR REPLACE FUNCTION public.validate_offer_token(_token uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.offer_approvals
    WHERE public_token = _token
      AND status = 'pending'
      AND (expires_at IS NULL OR expires_at > now())
  )
$$;