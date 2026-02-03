-- ============================================
-- PR#6: Fix Admin Panel RLS Policies
-- ============================================
-- Problem: admin_control_plane migration uses team_members.org_id which doesn't exist
-- Solution: Use organization_members table and is_org_admin() function
-- Date: 2026-02-03

-- ============================================
-- 1. Helper function for current user org admin check
-- ============================================

-- Function to check if current authenticated user is org admin
-- This simplifies RLS policies by avoiding repeated auth.uid() calls
CREATE OR REPLACE FUNCTION public.current_user_is_org_admin(_org_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.organization_members
    WHERE user_id = auth.uid()
      AND organization_id = _org_id
      AND role IN ('owner', 'admin')
  )
$$;

-- ============================================
-- 2. Fix admin_system_settings RLS policies
-- ============================================

-- Drop broken policies that reference team_members.org_id
DROP POLICY IF EXISTS "admin_system_settings_select_own" ON admin_system_settings;
DROP POLICY IF EXISTS "admin_system_settings_update_own" ON admin_system_settings;
DROP POLICY IF EXISTS "admin_system_settings_insert_own" ON admin_system_settings;

-- Policy: Only org admins/owners can read their org's settings
CREATE POLICY "admin_system_settings_select_org_admin" ON admin_system_settings
  FOR SELECT TO authenticated
  USING (
    public.current_user_is_org_admin(organization_id)
  );

-- Policy: Only org admins can update settings
CREATE POLICY "admin_system_settings_update_org_admin" ON admin_system_settings
  FOR UPDATE TO authenticated
  USING (
    public.current_user_is_org_admin(organization_id)
  )
  WITH CHECK (
    updated_by = auth.uid()
  );

-- Policy: Only org admins can create settings
CREATE POLICY "admin_system_settings_insert_org_admin" ON admin_system_settings
  FOR INSERT TO authenticated
  WITH CHECK (
    public.current_user_is_org_admin(organization_id)
    AND created_by = auth.uid()
  );

-- ============================================
-- 3. Fix admin_audit_log RLS policies
-- ============================================

-- Drop broken policies
DROP POLICY IF EXISTS "admin_audit_log_select" ON admin_audit_log;
DROP POLICY IF EXISTS "admin_audit_log_insert" ON admin_audit_log;

-- Policy: Org admins/owners can read their org's audit log
CREATE POLICY "admin_audit_log_select_org_admin" ON admin_audit_log
  FOR SELECT TO authenticated
  USING (
    public.current_user_is_org_admin(organization_id)
  );

-- Policy: Service role and org admins can insert audit logs
-- Service role is needed for triggers and background tasks
CREATE POLICY "admin_audit_log_insert_service" ON admin_audit_log
  FOR INSERT TO service_role
  WITH CHECK (true);

CREATE POLICY "admin_audit_log_insert_authenticated" ON admin_audit_log
  FOR INSERT TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    AND public.current_user_is_org_admin(organization_id)
  );

-- ============================================
-- 4. Fix admin_theme_config RLS policies
-- ============================================

-- Drop broken policies
DROP POLICY IF EXISTS "admin_theme_config_select" ON admin_theme_config;
DROP POLICY IF EXISTS "admin_theme_config_update" ON admin_theme_config;

-- Policy: All org members can read theme config (theme is UI-level)
CREATE POLICY "admin_theme_config_select_org_member" ON admin_theme_config
  FOR SELECT TO authenticated
  USING (
    public.is_org_member(auth.uid(), organization_id)
  );

-- Policy: Only org admins/owners can update theme
CREATE POLICY "admin_theme_config_update_org_admin" ON admin_theme_config
  FOR UPDATE TO authenticated
  USING (
    public.current_user_is_org_admin(organization_id)
  )
  WITH CHECK (
    updated_by = auth.uid()
  );

-- Policy: Only org admins can create theme config
CREATE POLICY "admin_theme_config_insert_org_admin" ON admin_theme_config
  FOR INSERT TO authenticated
  WITH CHECK (
    public.current_user_is_org_admin(organization_id)
    AND created_by = auth.uid()
  );

-- ============================================
-- 5. Ensure user_roles policies are correct (app-wide admin)
-- ============================================

-- These are already correct from previous migrations, but verify they exist
-- user_roles is for app-wide admins (platform administrators)

-- Verify policy exists: Users can view their own roles
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'user_roles'
    AND policyname = 'Users can view their own roles'
  ) THEN
    CREATE POLICY "Users can view their own roles"
    ON public.user_roles FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);
  END IF;
END $$;

-- Verify policy exists: Admins can manage all roles
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'user_roles'
    AND policyname = 'Admins can manage all roles'
  ) THEN
    CREATE POLICY "Admins can manage all roles"
    ON public.user_roles FOR ALL
    TO authenticated
    USING (public.has_role(auth.uid(), 'admin'))
    WITH CHECK (public.has_role(auth.uid(), 'admin'));
  END IF;
END $$;

-- ============================================
-- 6. Add comment explaining role systems
-- ============================================

COMMENT ON TABLE public.user_roles IS
'App-wide roles for platform administrators (admin/moderator/user).
Use has_role() function to check. These are for system-level access.';

COMMENT ON TABLE public.organization_members IS
'Per-organization roles (owner/admin/manager/member).
Use is_org_admin() or current_user_is_org_admin() to check.
These are for organization-level access to admin panel.';

COMMENT ON FUNCTION public.current_user_is_org_admin IS
'Checks if the currently authenticated user is an admin or owner of the specified organization.
Used in RLS policies for admin panel tables.';
