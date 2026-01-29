-- Admin Control Plane Migration
-- Tables: admin_system_settings, admin_theme_config, admin_audit_log
-- Date: 2026-01-26
-- Purpose: Move admin settings from localStorage to database with RLS and audit trail

-- ============================================
-- TABLE 1: admin_system_settings
-- ============================================
CREATE TABLE IF NOT EXISTS admin_system_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  -- Email Configuration
  email_enabled boolean DEFAULT true,
  smtp_host text,
  smtp_port integer,
  email_from_name text,
  email_from_address text,

  -- Feature Toggles
  registration_enabled boolean DEFAULT true,
  maintenance_mode boolean DEFAULT false,
  api_enabled boolean DEFAULT true,
  ai_enabled boolean DEFAULT true,
  voice_enabled boolean DEFAULT true,
  ocr_enabled boolean DEFAULT true,

  -- Limits
  max_clients_per_user integer DEFAULT 1000,
  max_projects_per_user integer DEFAULT 500,
  max_storage_per_user integer DEFAULT 10737418240, -- 10GB

  -- Security
  session_timeout_minutes integer DEFAULT 30,
  require_email_verification boolean DEFAULT true,
  two_factor_enabled boolean DEFAULT false,

  -- Rate Limiting
  rate_limit_requests integer DEFAULT 100,
  rate_limit_window_seconds integer DEFAULT 60,

  -- Metadata
  created_by uuid NOT NULL REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  updated_by uuid NOT NULL REFERENCES auth.users(id),
  updated_at timestamptz DEFAULT now(),

  CONSTRAINT valid_organization CHECK (organization_id IS NOT NULL)
);

-- Enable RLS
ALTER TABLE admin_system_settings ENABLE ROW LEVEL SECURITY;

-- Policy: Only admins can read their org's settings
CREATE POLICY admin_system_settings_select_own ON admin_system_settings
  FOR SELECT USING (
    organization_id IN (
      SELECT org_id FROM team_members
      WHERE user_id = auth.uid()
      AND role IN ('admin', 'owner')
    )
  );

-- Policy: Only admins can update
CREATE POLICY admin_system_settings_update_own ON admin_system_settings
  FOR UPDATE USING (
    organization_id IN (
      SELECT org_id FROM team_members
      WHERE user_id = auth.uid()
      AND role = 'admin'
    )
  ) WITH CHECK (
    updated_by = auth.uid()
  );

-- Policy: Only admins can insert
CREATE POLICY admin_system_settings_insert_own ON admin_system_settings
  FOR INSERT WITH CHECK (
    organization_id IN (
      SELECT org_id FROM team_members
      WHERE user_id = auth.uid()
      AND role = 'admin'
    )
    AND created_by = auth.uid()
  );

-- ============================================
-- TABLE 2: admin_audit_log
-- ============================================
CREATE TABLE IF NOT EXISTS admin_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  -- Action details
  action_type text NOT NULL, -- 'update_settings', 'update_theme', 'update_content'
  entity_type text NOT NULL, -- 'system_settings', 'theme_config', 'content_config'
  entity_id uuid,

  -- Change tracking
  old_value jsonb,
  new_value jsonb,
  changed_fields text[], -- ['email_enabled', 'maintenance_mode']

  -- Context
  user_id uuid NOT NULL REFERENCES auth.users(id),
  ip_address inet,
  user_agent text,

  -- Timestamps
  created_at timestamptz DEFAULT now(),

  CONSTRAINT valid_action CHECK (action_type IS NOT NULL),
  CONSTRAINT valid_entity CHECK (entity_type IS NOT NULL)
);

-- Enable RLS
ALTER TABLE admin_audit_log ENABLE ROW LEVEL SECURITY;

-- Policy: Admins can read their org's audit log
CREATE POLICY admin_audit_log_select ON admin_audit_log
  FOR SELECT USING (
    organization_id IN (
      SELECT org_id FROM team_members
      WHERE user_id = auth.uid()
      AND role IN ('admin', 'owner')
    )
  );

-- Policy: Service role can insert audit logs
CREATE POLICY admin_audit_log_insert ON admin_audit_log
  FOR INSERT WITH CHECK (true);

-- Index for audit log queries
CREATE INDEX idx_admin_audit_log_org_id ON admin_audit_log(organization_id);
CREATE INDEX idx_admin_audit_log_created_at ON admin_audit_log(created_at DESC);

-- ============================================
-- TABLE 3: admin_theme_config
-- ============================================
CREATE TABLE IF NOT EXISTS admin_theme_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  -- Theme properties
  primary_hue integer DEFAULT 210, -- 0-360
  primary_saturation integer DEFAULT 100, -- 0-100
  primary_lightness integer DEFAULT 50, -- 0-100
  accent_hue integer DEFAULT 265,
  border_radius integer DEFAULT 8, -- 0-24
  font_size integer DEFAULT 14, -- 12-20
  font_family text DEFAULT 'Inter',
  spacing integer DEFAULT 4, -- 2-8

  -- Versioning
  version integer DEFAULT 1,
  created_by uuid NOT NULL REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  updated_by uuid NOT NULL REFERENCES auth.users(id),
  updated_at timestamptz DEFAULT now(),

  CONSTRAINT valid_organization CHECK (organization_id IS NOT NULL)
);

-- Enable RLS
ALTER TABLE admin_theme_config ENABLE ROW LEVEL SECURITY;

-- Policy: All users can read (theme is public UI)
CREATE POLICY admin_theme_config_select ON admin_theme_config
  FOR SELECT USING (
    organization_id IN (
      SELECT org_id FROM team_members
      WHERE user_id = auth.uid()
    )
  );

-- Policy: Only admins can update
CREATE POLICY admin_theme_config_update ON admin_theme_config
  FOR UPDATE USING (
    organization_id IN (
      SELECT org_id FROM team_members
      WHERE user_id = auth.uid()
      AND role IN ('admin', 'owner')
    )
  ) WITH CHECK (
    updated_by = auth.uid()
  );

-- Index for theme lookups
CREATE INDEX idx_admin_theme_config_org_id ON admin_theme_config(organization_id);

-- ============================================
-- Audit log trigger function
-- ============================================
CREATE OR REPLACE FUNCTION log_admin_settings_change()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO admin_audit_log (
    organization_id,
    action_type,
    entity_type,
    entity_id,
    old_value,
    new_value,
    user_id,
    ip_address,
    user_agent
  ) VALUES (
    NEW.organization_id,
    'update_settings',
    'system_settings',
    NEW.id,
    to_jsonb(OLD),
    to_jsonb(NEW),
    auth.uid(),
    inet_client_addr(),
    current_setting('app.user_agent', true)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for audit logging
CREATE TRIGGER admin_settings_audit_trigger
  AFTER UPDATE ON admin_system_settings
  FOR EACH ROW
  EXECUTE FUNCTION log_admin_settings_change();
