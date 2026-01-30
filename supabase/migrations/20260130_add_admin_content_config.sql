-- Admin Content Configuration Table
-- Stores landing page, features, footer, and contact content
-- Date: 2026-01-30
-- Purpose: Move AdminContentEditor from localStorage to database with RLS

-- ============================================
-- TABLE: admin_content_config
-- ============================================
CREATE TABLE IF NOT EXISTS admin_content_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  -- Hero Section
  hero_title text DEFAULT 'Majster.AI - Profesjonalne wyceny dla fachowców',
  hero_subtitle text DEFAULT 'Twórz wyceny szybko i profesjonalnie. Generuj PDF, zarządzaj klientami i projektami.',
  hero_cta_text text DEFAULT 'Rozpocznij za darmo',
  hero_cta_link text DEFAULT '/register',

  -- Features Section
  feature1_title text DEFAULT 'Szybkie wyceny',
  feature1_desc text DEFAULT 'Twórz profesjonalne wyceny w kilka minut dzięki szablonom i AI.',
  feature2_title text DEFAULT 'PDF Premium',
  feature2_desc text DEFAULT 'Generuj eleganckie dokumenty PDF z logo firmy i pełnymi danymi.',
  feature3_title text DEFAULT 'Zarządzanie projektami',
  feature3_desc text DEFAULT 'Śledź postęp, zarządzaj klientami i kontroluj koszty.',

  -- Footer Section
  footer_company_name text DEFAULT 'Majster.AI',
  footer_copyright text DEFAULT '© 2024 Majster.AI. Wszelkie prawa zastrzeżone.',
  footer_description text DEFAULT 'Profesjonalna platforma do tworzenia wycen dla fachowców.',

  -- Contact Information
  support_email text,
  phone_number text,
  address text,

  -- SEO Metadata
  meta_title text,
  meta_description text,
  og_image text,

  -- Metadata
  created_by uuid NOT NULL REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  updated_by uuid NOT NULL REFERENCES auth.users(id),
  updated_at timestamptz DEFAULT now(),

  CONSTRAINT valid_organization CHECK (organization_id IS NOT NULL)
);

-- Enable RLS
ALTER TABLE admin_content_config ENABLE ROW LEVEL SECURITY;

-- Policy: Only admins can read
CREATE POLICY admin_content_config_select ON admin_content_config
  FOR SELECT USING (
    organization_id IN (
      SELECT org_id FROM team_members
      WHERE user_id = auth.uid()
      AND role IN ('admin', 'owner')
    )
  );

-- Policy: Only admins can insert
CREATE POLICY admin_content_config_insert ON admin_content_config
  FOR INSERT WITH CHECK (
    organization_id IN (
      SELECT org_id FROM team_members
      WHERE user_id = auth.uid()
      AND role IN ('admin', 'owner')
    )
    AND created_by = auth.uid()
  );

-- Policy: Only admins can update
CREATE POLICY admin_content_config_update ON admin_content_config
  FOR UPDATE USING (
    organization_id IN (
      SELECT org_id FROM team_members
      WHERE user_id = auth.uid()
      AND role IN ('admin', 'owner')
    )
  ) WITH CHECK (
    updated_by = auth.uid()
  );

-- Index for lookups
CREATE INDEX idx_admin_content_config_org_id ON admin_content_config(organization_id);

-- ============================================
-- Audit log trigger for content changes
-- ============================================
CREATE OR REPLACE FUNCTION log_admin_content_change()
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
    'update_content',
    'content_config',
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
CREATE TRIGGER admin_content_audit_trigger
  AFTER UPDATE ON admin_content_config
  FOR EACH ROW
  EXECUTE FUNCTION log_admin_content_change();
