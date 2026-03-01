-- PR-05: Company Profile additions
-- Adds missing columns to profiles table (which serves as company_profiles storage)
-- Design decision: profiles table IS the company profile storage (no rename per CLAUDE.md rules)
-- New fields required by PR-05 spec: address_line2, country, website

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS address_line2 TEXT,
  ADD COLUMN IF NOT EXISTS country TEXT DEFAULT 'PL',
  ADD COLUMN IF NOT EXISTS website TEXT;

COMMENT ON COLUMN public.profiles.address_line2 IS 'Second address line (optional, e.g., apartment/suite number)';
COMMENT ON COLUMN public.profiles.country IS 'Country code (default: PL for Poland)';
COMMENT ON COLUMN public.profiles.website IS 'Company website URL (optional, used in PDF issuer data)';

-- Ensure DELETE policy exists (was missing in original migration)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'profiles'
    AND policyname = 'profiles_delete_own'
  ) THEN
    EXECUTE 'CREATE POLICY profiles_delete_own ON public.profiles FOR DELETE USING (auth.uid() = user_id)';
  END IF;
END
$$;

-- RLS verification: confirm RLS is still enabled
-- SELECT relrowsecurity FROM pg_class WHERE relname = 'profiles'; -- should return true
