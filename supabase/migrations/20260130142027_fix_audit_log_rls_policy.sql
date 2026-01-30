-- Fix admin_audit_log INSERT policy with proper RLS validation
-- This migration replaces the overly permissive INSERT policy with proper organization validation

-- Drop the old overly permissive INSERT policy
DROP POLICY IF EXISTS admin_audit_log_insert ON admin_audit_log;

-- Create new INSERT policy that validates organization context
-- Only service role can insert, and only for organizations the user is an admin of
CREATE POLICY admin_audit_log_insert ON admin_audit_log
  FOR INSERT WITH CHECK (
    -- Only allow insert if organization_id is valid
    organization_id IS NOT NULL
    AND
    -- Verify user is an admin of this organization
    (auth.role() = 'service_role' OR
     organization_id IN (
       SELECT org_id FROM team_members
       WHERE user_id = auth.uid()
       AND role IN ('admin', 'owner')
     )
    )
  );

-- Add comment explaining the policy
COMMENT ON POLICY admin_audit_log_insert ON admin_audit_log IS
  'Service role (via Edge Functions) or organization admins can insert audit logs.
   This ensures only authorized operations are logged while allowing the trigger
   function to automatically create logs for admin setting changes.';
