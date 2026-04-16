-- ==============================================================
-- Majster.AI — Migration: Restore user_roles security model
-- Filename: 20260416120000_fix_user_roles_schema_rls.sql
-- Date:     2026-04-16
-- Branch:   claude/verify-user-roles-rls-QgWEQ
-- ==============================================================
-- CONTEXT:
--   user_roles was created manually via Supabase Table Editor.
--   Schema drift found during PROD VERIFY 01 (2026-04-16):
--     - id:   bigint  (expected uuid — kept as bigint, safe)
--     - role: text    (expected app_role enum — fixed here)
--     - app_role enum:    MISSING in production
--     - has_role() fn:    MISSING in production
--     - grant/revoke fns: MISSING in production
--     - RLS policies:     0 in production (expected 2)
--   Table confirmed EMPTY (0 rows) — safe for type migration.
--
-- IDEMPOTENT: all statements safe to run multiple times.
-- NO DATA LOSS: table is empty; type cast is guarded.
-- ==============================================================

-- ============================================================
-- PART 1: app_role enum
-- ============================================================
DO $$ BEGIN
  CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ============================================================
-- PART 2: Migrate role column: text → app_role
-- Guard: only runs if column is still text type
-- ============================================================
DO $$ BEGIN
  IF (
    SELECT data_type
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name   = 'user_roles'
      AND column_name  = 'role'
  ) = 'text' THEN
    -- Remove text default before type change
    ALTER TABLE public.user_roles ALTER COLUMN role DROP DEFAULT;
    -- Change type (USING cast: safe because table is empty)
    ALTER TABLE public.user_roles
      ALTER COLUMN role TYPE public.app_role
      USING role::public.app_role;
    -- Set correct enum default
    ALTER TABLE public.user_roles
      ALTER COLUMN role SET DEFAULT 'user'::public.app_role;
    -- Enforce NOT NULL
    ALTER TABLE public.user_roles ALTER COLUMN role SET NOT NULL;
  END IF;
END $$;

-- ============================================================
-- PART 3: Ensure user_id NOT NULL
-- ============================================================
ALTER TABLE public.user_roles ALTER COLUMN user_id SET NOT NULL;

-- ============================================================
-- PART 4: Add UNIQUE(user_id, role) constraint
-- ============================================================
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'user_roles_user_id_role_key'
      AND table_name = 'user_roles'
      AND table_schema = 'public'
  ) THEN
    ALTER TABLE public.user_roles
      ADD CONSTRAINT user_roles_user_id_role_key UNIQUE (user_id, role);
  END IF;
END $$;

-- ============================================================
-- PART 5: has_role() — security definer helper
-- Used in RLS USING clauses to check admin access.
-- SECURITY DEFINER: bypasses RLS to read user_roles directly.
-- ============================================================
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id
      AND role    = _role
  )
$$;

-- ============================================================
-- PART 6: Bootstrap helpers — grant/revoke admin by email
-- Can ONLY be called from SQL Editor or via service_role key.
-- Frontend (anon/authenticated) cannot call these directly.
-- Usage:  SELECT public.grant_admin_role('user@example.com');
-- ============================================================
CREATE OR REPLACE FUNCTION public.grant_admin_role(_email text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _user_id uuid;
BEGIN
  SELECT id INTO _user_id
  FROM auth.users
  WHERE email = lower(trim(_email));

  IF _user_id IS NULL THEN
    RETURN 'ERROR: No user found with email ' || _email;
  END IF;

  INSERT INTO public.user_roles (user_id, role)
  VALUES (_user_id, 'admin')
  ON CONFLICT (user_id, role) DO NOTHING;

  RETURN 'OK: Admin role granted to ' || _email || ' (id: ' || _user_id || ')';
END;
$$;

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

-- Restrict bootstrap functions to service_role / SQL Editor only
REVOKE EXECUTE ON FUNCTION public.grant_admin_role(text) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.revoke_admin_role(text) FROM anon, authenticated;

-- ============================================================
-- PART 7: RLS — enable + policies
-- ============================================================
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Policy 1: authenticated users can read their own role entries
DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;
CREATE POLICY "Users can view their own roles"
  ON public.user_roles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Policy 2: only platform admins can manage all role entries
DROP POLICY IF EXISTS "Admins can manage all roles" ON public.user_roles;
CREATE POLICY "Admins can manage all roles"
  ON public.user_roles
  FOR ALL
  TO authenticated
  USING  (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- ==============================================================
-- POST-MIGRATION VERIFICATION (run in SQL Editor after applying)
-- ==============================================================
-- 1. Enum exists:
--    SELECT typname FROM pg_type WHERE typname = 'app_role';
--    → expected: 1 row
--
-- 2. Function exists:
--    SELECT routine_name FROM information_schema.routines
--    WHERE routine_schema='public' AND routine_name='has_role';
--    → expected: 1 row
--
-- 3. Policies exist:
--    SELECT policyname, cmd, roles FROM pg_policies
--    WHERE tablename='user_roles' ORDER BY cmd;
--    → expected: 2 rows
--
-- 4. Column type changed:
--    SELECT data_type, udt_name FROM information_schema.columns
--    WHERE table_name='user_roles' AND column_name='role';
--    → expected: data_type='USER-DEFINED', udt_name='app_role'
--
-- 5. RLS enabled:
--    SELECT relrowsecurity FROM pg_class c
--    JOIN pg_namespace n ON n.oid=c.relnamespace
--    WHERE c.relname='user_roles' AND n.nspname='public';
--    → expected: true
--
-- ==============================================================
-- ROLLBACK (if migration must be reverted — only safe if 0 rows)
-- ==============================================================
-- DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;
-- DROP POLICY IF EXISTS "Admins can manage all roles"    ON public.user_roles;
-- DROP FUNCTION IF EXISTS public.has_role(uuid, public.app_role);
-- DROP FUNCTION IF EXISTS public.grant_admin_role(text);
-- DROP FUNCTION IF EXISTS public.revoke_admin_role(text);
-- ALTER TABLE public.user_roles ALTER COLUMN role DROP DEFAULT;
-- ALTER TABLE public.user_roles ALTER COLUMN role TYPE text USING role::text;
-- ALTER TABLE public.user_roles ALTER COLUMN role SET DEFAULT 'user';
-- ALTER TABLE public.user_roles DROP CONSTRAINT IF EXISTS user_roles_user_id_role_key;
-- DROP TYPE IF EXISTS public.app_role;
-- ==============================================================
