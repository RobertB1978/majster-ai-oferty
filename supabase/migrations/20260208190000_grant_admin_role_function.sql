-- Migration: Create a SECURITY DEFINER function to grant admin role by email.
-- This function can ONLY be called from the Supabase SQL Editor or via service_role key.
-- It cannot be called from the frontend (anon key) because the RLS policy on
-- user_roles requires the caller to already be an admin.
--
-- Usage (run in Supabase SQL Editor → SQL tab):
--   SELECT public.grant_admin_role('projektybiznes1978@gmail.com');
--
-- To revoke:
--   SELECT public.revoke_admin_role('projektybiznes1978@gmail.com');

-- Grant admin role by email
CREATE OR REPLACE FUNCTION public.grant_admin_role(_email text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _user_id uuid;
BEGIN
  -- Look up user by email in auth.users
  SELECT id INTO _user_id
  FROM auth.users
  WHERE email = lower(trim(_email));

  IF _user_id IS NULL THEN
    RETURN 'ERROR: No user found with email ' || _email;
  END IF;

  -- Insert admin role (ignore if already exists)
  INSERT INTO public.user_roles (user_id, role)
  VALUES (_user_id, 'admin')
  ON CONFLICT (user_id, role) DO NOTHING;

  RETURN 'OK: Admin role granted to ' || _email || ' (user_id: ' || _user_id || ')';
END;
$$;

-- Revoke admin role by email
CREATE OR REPLACE FUNCTION public.revoke_admin_role(_email text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _user_id uuid;
  _deleted integer;
BEGIN
  SELECT id INTO _user_id
  FROM auth.users
  WHERE email = lower(trim(_email));

  IF _user_id IS NULL THEN
    RETURN 'ERROR: No user found with email ' || _email;
  END IF;

  DELETE FROM public.user_roles
  WHERE user_id = _user_id AND role = 'admin';

  GET DIAGNOSTICS _deleted = ROW_COUNT;

  IF _deleted = 0 THEN
    RETURN 'WARNING: User ' || _email || ' did not have admin role';
  END IF;

  RETURN 'OK: Admin role revoked from ' || _email;
END;
$$;

-- Restrict execution to service_role only (prevents anon/authenticated from calling)
REVOKE EXECUTE ON FUNCTION public.grant_admin_role(text) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.revoke_admin_role(text) FROM anon, authenticated;
