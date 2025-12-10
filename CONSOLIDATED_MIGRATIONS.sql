-- ============================================
-- MAJSTER.AI - CONSOLIDATED SCHEMA MIGRATION
-- Compiled from all supabase/migrations/ files
-- Organized in logical order for clean execution
-- ============================================

-- ============================================
-- SECTION 1: TYPES & ENUMS
-- ============================================

CREATE TYPE IF NOT EXISTS public.app_role AS ENUM ('admin', 'moderator', 'user');

-- ============================================
-- SECTION 2: CREATE ALL TABLES
-- ============================================

-- 2.1: Core Business Tables
CREATE TABLE IF NOT EXISTS public.clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  phone TEXT DEFAULT '',
  email TEXT DEFAULT '',
  address TEXT DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  company_name TEXT NOT NULL DEFAULT '',
  owner_name TEXT DEFAULT '',
  nip TEXT DEFAULT '',
  street TEXT DEFAULT '',
  city TEXT DEFAULT '',
  postal_code TEXT DEFAULT '',
  phone TEXT DEFAULT '',
  email_for_offers TEXT DEFAULT '',
  bank_account TEXT DEFAULT '',
  logo_url TEXT DEFAULT '',
  email_subject_template TEXT DEFAULT 'Oferta od {company_name}',
  email_greeting TEXT DEFAULT 'Szanowny Kliencie,',
  email_signature TEXT DEFAULT 'Z poważaniem',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  project_name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'Nowy' CHECK (status IN ('Nowy', 'Wycena w toku', 'Oferta wysłana', 'Zaakceptowany')),
  start_date DATE,
  end_date DATE,
  priority TEXT DEFAULT 'normal',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.quotes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  positions JSONB NOT NULL DEFAULT '[]'::jsonb,
  summary_materials NUMERIC(12, 2) NOT NULL DEFAULT 0,
  summary_labor NUMERIC(12, 2) NOT NULL DEFAULT 0,
  margin_percent NUMERIC(5, 2) NOT NULL DEFAULT 0,
  total NUMERIC(12, 2) NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(project_id)
);

CREATE TABLE IF NOT EXISTS public.pdf_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  version TEXT NOT NULL DEFAULT 'standard' CHECK (version IN ('standard', 'premium')),
  title TEXT NOT NULL DEFAULT '',
  offer_text TEXT DEFAULT '',
  terms TEXT DEFAULT '',
  deadline_text TEXT DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(project_id)
);

-- 2.2: Template & Version Tables
CREATE TABLE IF NOT EXISTS public.item_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  unit TEXT NOT NULL DEFAULT 'szt.',
  default_qty NUMERIC NOT NULL DEFAULT 1,
  default_price NUMERIC NOT NULL DEFAULT 0,
  category TEXT NOT NULL DEFAULT 'Materiał',
  description TEXT DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.quote_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  version_name TEXT NOT NULL DEFAULT 'V1',
  quote_snapshot JSONB NOT NULL DEFAULT '{}'::jsonb,
  is_active BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 2.3: Offer & Approval Tables
CREATE TABLE IF NOT EXISTS public.offer_sends (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  client_email TEXT NOT NULL,
  subject TEXT NOT NULL,
  message TEXT DEFAULT '',
  status TEXT NOT NULL DEFAULT 'pending',
  error_message TEXT,
  pdf_url TEXT,
  pdf_generated_at TIMESTAMPTZ,
  tracking_status TEXT NOT NULL DEFAULT 'sent',
  sent_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.offer_approvals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  public_token UUID NOT NULL DEFAULT gen_random_uuid() UNIQUE,
  client_name TEXT,
  client_email TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  signature_data TEXT,
  client_comment TEXT,
  approved_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (now() + interval '30 days'),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 2.4: Calendar & Events
CREATE TABLE IF NOT EXISTS public.calendar_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  event_date DATE NOT NULL,
  event_time TIME,
  event_type TEXT NOT NULL DEFAULT 'deadline',
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 2.5: Onboarding & Notifications
CREATE TABLE IF NOT EXISTS public.onboarding_progress (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  current_step INTEGER NOT NULL DEFAULT 1,
  completed_steps INTEGER[] DEFAULT '{}',
  is_completed BOOLEAN NOT NULL DEFAULT false,
  skipped_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'info',
  is_read BOOLEAN NOT NULL DEFAULT false,
  action_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 2.6: Photos & Documents
CREATE TABLE IF NOT EXISTS public.project_photos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  photo_url TEXT NOT NULL,
  file_name TEXT NOT NULL,
  analysis_status TEXT NOT NULL DEFAULT 'pending' CHECK (analysis_status IN ('pending', 'analyzing', 'completed', 'failed')),
  analysis_result JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.company_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  document_type TEXT NOT NULL CHECK (document_type IN ('uprawnienia', 'referencje', 'certyfikat', 'polisa', 'inne')),
  name TEXT NOT NULL,
  description TEXT,
  file_url TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_size INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 2.7: Finance & Costs
CREATE TABLE IF NOT EXISTS public.purchase_costs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  supplier_name TEXT,
  invoice_number TEXT,
  invoice_date DATE,
  items JSONB NOT NULL DEFAULT '[]',
  net_amount NUMERIC NOT NULL DEFAULT 0,
  vat_amount NUMERIC NOT NULL DEFAULT 0,
  gross_amount NUMERIC NOT NULL DEFAULT 0,
  document_url TEXT,
  ocr_status TEXT NOT NULL DEFAULT 'pending' CHECK (ocr_status IN ('pending', 'processing', 'completed', 'failed')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.financial_reports (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  report_month DATE NOT NULL,
  total_revenue NUMERIC DEFAULT 0,
  total_costs NUMERIC DEFAULT 0,
  gross_margin NUMERIC DEFAULT 0,
  project_count INTEGER DEFAULT 0,
  report_data JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, report_month)
);

-- 2.8: Team Management
CREATE TABLE IF NOT EXISTS public.team_members (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  owner_user_id UUID NOT NULL,
  name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  role TEXT DEFAULT 'worker',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.team_locations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  team_member_id UUID NOT NULL REFERENCES public.team_members(id) ON DELETE CASCADE,
  project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
  user_id UUID NOT NULL,
  latitude NUMERIC NOT NULL,
  longitude NUMERIC NOT NULL,
  status TEXT NOT NULL DEFAULT 'idle' CHECK (status IN ('idle', 'traveling', 'working', 'break')),
  recorded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.work_tasks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  assigned_team_member_id UUID REFERENCES public.team_members(id) ON DELETE SET NULL,
  task_type TEXT DEFAULT 'work',
  status TEXT NOT NULL DEFAULT 'planned' CHECK (status IN ('planned', 'in_progress', 'completed', 'cancelled')),
  start_date TIMESTAMP WITH TIME ZONE NOT NULL,
  end_date TIMESTAMP WITH TIME ZONE NOT NULL,
  color TEXT DEFAULT '#3b82f6',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 2.9: Marketplace/Subcontractors
CREATE TABLE IF NOT EXISTS public.subcontractors (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  company_name TEXT NOT NULL,
  contact_name TEXT,
  phone TEXT,
  email TEXT,
  description TEXT,
  location_city TEXT,
  location_lat NUMERIC,
  location_lng NUMERIC,
  hourly_rate NUMERIC,
  is_public BOOLEAN NOT NULL DEFAULT false,
  avatar_url TEXT,
  portfolio_images JSONB DEFAULT '[]',
  rating NUMERIC DEFAULT 0,
  review_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.subcontractor_services (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  subcontractor_id UUID NOT NULL REFERENCES public.subcontractors(id) ON DELETE CASCADE,
  service_name TEXT NOT NULL,
  price_per_unit NUMERIC,
  unit TEXT DEFAULT 'godz.',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.subcontractor_reviews (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  subcontractor_id UUID NOT NULL REFERENCES public.subcontractors(id) ON DELETE CASCADE,
  reviewer_user_id UUID NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 2.10: AI & Chat
CREATE TABLE IF NOT EXISTS public.ai_chat_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  session_id UUID NOT NULL DEFAULT gen_random_uuid(),
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 2.11: Authentication & Authorization
CREATE TABLE IF NOT EXISTS public.user_roles (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    UNIQUE (user_id, role)
);

CREATE TABLE IF NOT EXISTS public.user_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  plan_id TEXT NOT NULL DEFAULT 'free' CHECK (plan_id IN ('free', 'starter', 'business', 'enterprise')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'cancelled', 'expired', 'trial')),
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  current_period_start TIMESTAMP WITH TIME ZONE,
  current_period_end TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.user_consents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  consent_type TEXT NOT NULL CHECK (consent_type IN ('cookies_essential', 'cookies_analytics', 'cookies_marketing', 'privacy_policy', 'terms_of_service', 'newsletter')),
  granted BOOLEAN NOT NULL DEFAULT false,
  ip_address TEXT,
  user_agent TEXT,
  granted_at TIMESTAMP WITH TIME ZONE,
  revoked_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 2.12: API & Security
CREATE TABLE IF NOT EXISTS public.api_keys (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  key_name TEXT NOT NULL,
  api_key TEXT NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(32), 'hex'),
  permissions JSONB DEFAULT '["read"]',
  is_active BOOLEAN NOT NULL DEFAULT true,
  last_used_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.api_rate_limits (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    identifier text NOT NULL,
    endpoint text NOT NULL,
    request_count integer NOT NULL DEFAULT 1,
    window_start timestamp with time zone NOT NULL DEFAULT now(),
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    UNIQUE (identifier, endpoint, window_start)
);

CREATE TABLE IF NOT EXISTS public.push_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  token TEXT NOT NULL,
  platform TEXT NOT NULL CHECK (platform IN ('web', 'ios', 'android')),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, token)
);

-- 2.13: Multi-Tenant Organization Tables
CREATE TABLE IF NOT EXISTS public.organizations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  logo_url TEXT,
  owner_user_id UUID NOT NULL,
  settings JSONB DEFAULT '{}'::jsonb,
  plan_id TEXT DEFAULT 'free',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.organization_members (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'manager', 'member')),
  invited_by UUID,
  invited_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  accepted_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(organization_id, user_id)
);

CREATE TABLE IF NOT EXISTS public.biometric_credentials (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  credential_id TEXT NOT NULL UNIQUE,
  public_key TEXT NOT NULL,
  counter INTEGER NOT NULL DEFAULT 0,
  device_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  last_used_at TIMESTAMP WITH TIME ZONE
);

-- ============================================
-- SECTION 3: CREATE FUNCTIONS & HELPERS
-- ============================================

-- 3.1: Timestamp update functions
CREATE OR REPLACE FUNCTION public.update_profiles_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- 3.2: User profile creation trigger function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, company_name)
  VALUES (NEW.id, '');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 3.3: Authorization helper functions
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

CREATE OR REPLACE FUNCTION public.is_org_member(_user_id uuid, _org_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.organization_members
    WHERE user_id = _user_id
      AND organization_id = _org_id
  )
$$;

CREATE OR REPLACE FUNCTION public.is_org_admin(_user_id uuid, _org_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.organization_members
    WHERE user_id = _user_id
      AND organization_id = _org_id
      AND role IN ('owner', 'admin')
  )
$$;

CREATE OR REPLACE FUNCTION public.get_user_org_ids(_user_id uuid)
RETURNS SETOF uuid
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT organization_id
  FROM public.organization_members
  WHERE user_id = _user_id
$$;

CREATE OR REPLACE FUNCTION public.is_subcontractor_owner(_user_id uuid, _subcontractor_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.subcontractors
    WHERE id = _subcontractor_id
      AND user_id = _user_id
  )
$$;

-- 3.4: Offer token validation function
CREATE OR REPLACE FUNCTION public.validate_offer_token(_token uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.offer_approvals
    WHERE public_token = _token
      AND status = 'pending'
      AND (expires_at IS NULL OR expires_at > now())
  )
$$;

-- ============================================
-- SECTION 4: CREATE TRIGGERS
-- ============================================

CREATE TRIGGER update_profiles_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.update_profiles_updated_at();

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_user();

CREATE TRIGGER update_onboarding_progress_updated_at
BEFORE UPDATE ON public.onboarding_progress
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_organizations_updated_at
BEFORE UPDATE ON public.organizations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================
-- SECTION 5: ENABLE ROW LEVEL SECURITY
-- ============================================

ALTER TABLE IF EXISTS public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.pdf_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.item_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.quote_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.offer_sends ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.offer_approvals ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.calendar_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.onboarding_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.project_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.company_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.purchase_costs ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.financial_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.team_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.work_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.subcontractors ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.subcontractor_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.subcontractor_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.ai_chat_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.user_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.user_consents ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.api_rate_limits ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.push_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.organization_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.biometric_credentials ENABLE ROW LEVEL SECURITY;

-- ============================================
-- SECTION 6: CREATE ROW LEVEL SECURITY POLICIES
-- ============================================

-- 6.1: PROFILES - User can only manage own profile
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can create their own profile" ON public.profiles;

CREATE POLICY "Users can view their own profile"
ON public.profiles FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile"
ON public.profiles FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own profile"
ON public.profiles FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- 6.2: CLIENTS - User can manage own clients
DROP POLICY IF EXISTS "Users can view their own clients" ON public.clients;
DROP POLICY IF EXISTS "Users can create their own clients" ON public.clients;
DROP POLICY IF EXISTS "Users can update their own clients" ON public.clients;
DROP POLICY IF EXISTS "Users can delete their own clients" ON public.clients;

CREATE POLICY "Users can view their own clients"
ON public.clients FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own clients"
ON public.clients FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own clients"
ON public.clients FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own clients"
ON public.clients FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- 6.3: PROJECTS - User can manage own projects
DROP POLICY IF EXISTS "Users can view their own projects" ON public.projects;
DROP POLICY IF EXISTS "Users can create their own projects" ON public.projects;
DROP POLICY IF EXISTS "Users can update their own projects" ON public.projects;
DROP POLICY IF EXISTS "Users can delete their own projects" ON public.projects;

CREATE POLICY "Users can view their own projects"
ON public.projects FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own projects"
ON public.projects FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own projects"
ON public.projects FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own projects"
ON public.projects FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- 6.4: QUOTES - User can manage own quotes
DROP POLICY IF EXISTS "Users can view their own quotes" ON public.quotes;
DROP POLICY IF EXISTS "Users can create their own quotes" ON public.quotes;
DROP POLICY IF EXISTS "Users can update their own quotes" ON public.quotes;
DROP POLICY IF EXISTS "Users can delete their own quotes" ON public.quotes;

CREATE POLICY "Users can view their own quotes"
ON public.quotes FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own quotes"
ON public.quotes FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own quotes"
ON public.quotes FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own quotes"
ON public.quotes FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- 6.5: PDF_DATA - User can manage own PDF data
DROP POLICY IF EXISTS "Users can view their own pdf_data" ON public.pdf_data;
DROP POLICY IF EXISTS "Users can create their own pdf_data" ON public.pdf_data;
DROP POLICY IF EXISTS "Users can update their own pdf_data" ON public.pdf_data;
DROP POLICY IF EXISTS "Users can delete their own pdf_data" ON public.pdf_data;

CREATE POLICY "Users can view their own pdf_data"
ON public.pdf_data FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own pdf_data"
ON public.pdf_data FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own pdf_data"
ON public.pdf_data FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own pdf_data"
ON public.pdf_data FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- 6.6: ITEM_TEMPLATES - User can manage own templates
DROP POLICY IF EXISTS "Users can view their own templates" ON public.item_templates;
DROP POLICY IF EXISTS "Users can create their own templates" ON public.item_templates;
DROP POLICY IF EXISTS "Users can update their own templates" ON public.item_templates;
DROP POLICY IF EXISTS "Users can delete their own templates" ON public.item_templates;

CREATE POLICY "Users can view their own templates"
ON public.item_templates FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own templates"
ON public.item_templates FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own templates"
ON public.item_templates FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own templates"
ON public.item_templates FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- 6.7: QUOTE_VERSIONS - User can manage own quote versions
DROP POLICY IF EXISTS "Users can view their own quote versions" ON public.quote_versions;
DROP POLICY IF EXISTS "Users can create their own quote versions" ON public.quote_versions;
DROP POLICY IF EXISTS "Users can update their own quote versions" ON public.quote_versions;
DROP POLICY IF EXISTS "Users can delete their own quote versions" ON public.quote_versions;

CREATE POLICY "Users can view their own quote versions"
ON public.quote_versions FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own quote versions"
ON public.quote_versions FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own quote versions"
ON public.quote_versions FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own quote versions"
ON public.quote_versions FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- 6.8: OFFER_SENDS - User can manage own offer sends
DROP POLICY IF EXISTS "Users can view their own offer sends" ON public.offer_sends;
DROP POLICY IF EXISTS "Users can create their own offer sends" ON public.offer_sends;
DROP POLICY IF EXISTS "Users can update their own offer sends" ON public.offer_sends;
DROP POLICY IF EXISTS "Users can delete their own offer sends" ON public.offer_sends;

CREATE POLICY "Users can view their own offer sends"
ON public.offer_sends FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own offer sends"
ON public.offer_sends FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own offer sends"
ON public.offer_sends FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own offer sends"
ON public.offer_sends FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- 6.9: OFFER_APPROVALS - User can manage own approvals + public token-based access
DROP POLICY IF EXISTS "Users can view their own offer approvals" ON public.offer_approvals;
DROP POLICY IF EXISTS "Users can create their own offer approvals" ON public.offer_approvals;
DROP POLICY IF EXISTS "Users can update their own offer approvals" ON public.offer_approvals;
DROP POLICY IF EXISTS "Users can delete their own offer approvals" ON public.offer_approvals;
DROP POLICY IF EXISTS "Public can view pending offers by valid token" ON public.offer_approvals;
DROP POLICY IF EXISTS "Public can update pending offers with valid token" ON public.offer_approvals;

CREATE POLICY "Users can view their own offer approvals"
ON public.offer_approvals FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own offer approvals"
ON public.offer_approvals FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own offer approvals"
ON public.offer_approvals FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own offer approvals"
ON public.offer_approvals FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Public can view pending offers by valid token"
ON public.offer_approvals FOR SELECT
TO anon
USING ((status = 'pending') AND (public_token IS NOT NULL) AND public.validate_offer_token(public_token));

CREATE POLICY "Public can update pending offers with valid token"
ON public.offer_approvals FOR UPDATE
TO anon
USING ((status = 'pending') AND (public_token IS NOT NULL) AND public.validate_offer_token(public_token))
WITH CHECK ((status = ANY (ARRAY['approved', 'rejected'])) AND (public_token IS NOT NULL));

-- 6.10: CALENDAR_EVENTS - User can manage own events
DROP POLICY IF EXISTS "Users can view their own events" ON public.calendar_events;
DROP POLICY IF EXISTS "Users can create their own events" ON public.calendar_events;
DROP POLICY IF EXISTS "Users can update their own events" ON public.calendar_events;
DROP POLICY IF EXISTS "Users can delete their own events" ON public.calendar_events;

CREATE POLICY "Users can view their own events"
ON public.calendar_events FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own events"
ON public.calendar_events FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own events"
ON public.calendar_events FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own events"
ON public.calendar_events FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- 6.11: ONBOARDING_PROGRESS - User can manage own progress
DROP POLICY IF EXISTS "Users can view their own onboarding progress" ON public.onboarding_progress;
DROP POLICY IF EXISTS "Users can insert their own onboarding progress" ON public.onboarding_progress;
DROP POLICY IF EXISTS "Users can update their own onboarding progress" ON public.onboarding_progress;

CREATE POLICY "Users can view their own onboarding progress"
ON public.onboarding_progress FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own onboarding progress"
ON public.onboarding_progress FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own onboarding progress"
ON public.onboarding_progress FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

-- 6.12: NOTIFICATIONS - User can manage own notifications
DROP POLICY IF EXISTS "Users can view their own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can insert their own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can update their own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can delete their own notifications" ON public.notifications;

CREATE POLICY "Users can view their own notifications"
ON public.notifications FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own notifications"
ON public.notifications FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications"
ON public.notifications FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own notifications"
ON public.notifications FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- 6.13: PROJECT_PHOTOS - User can manage own photos
DROP POLICY IF EXISTS "Users can view their own project photos" ON public.project_photos;
DROP POLICY IF EXISTS "Users can create their own project photos" ON public.project_photos;
DROP POLICY IF EXISTS "Users can update their own project photos" ON public.project_photos;
DROP POLICY IF EXISTS "Users can delete their own project photos" ON public.project_photos;

CREATE POLICY "Users can view their own project photos"
ON public.project_photos FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own project photos"
ON public.project_photos FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own project photos"
ON public.project_photos FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own project photos"
ON public.project_photos FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- 6.14: COMPANY_DOCUMENTS - User can manage own documents
DROP POLICY IF EXISTS "Users can view their own documents" ON public.company_documents;
DROP POLICY IF EXISTS "Users can create their own documents" ON public.company_documents;
DROP POLICY IF EXISTS "Users can update their own documents" ON public.company_documents;
DROP POLICY IF EXISTS "Users can delete their own documents" ON public.company_documents;

CREATE POLICY "Users can view their own documents"
ON public.company_documents FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own documents"
ON public.company_documents FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own documents"
ON public.company_documents FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own documents"
ON public.company_documents FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- 6.15: PURCHASE_COSTS - User can manage own costs
DROP POLICY IF EXISTS "Users can view their own purchase costs" ON public.purchase_costs;
DROP POLICY IF EXISTS "Users can create their own purchase costs" ON public.purchase_costs;
DROP POLICY IF EXISTS "Users can update their own purchase costs" ON public.purchase_costs;
DROP POLICY IF EXISTS "Users can delete their own purchase costs" ON public.purchase_costs;

CREATE POLICY "Users can view their own purchase costs"
ON public.purchase_costs FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own purchase costs"
ON public.purchase_costs FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own purchase costs"
ON public.purchase_costs FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own purchase costs"
ON public.purchase_costs FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- 6.16: FINANCIAL_REPORTS - User can manage own reports
DROP POLICY IF EXISTS "Users can manage their financial reports" ON public.financial_reports;

CREATE POLICY "Users can manage their financial reports"
ON public.financial_reports FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- 6.17: TEAM_MEMBERS - Owner can manage team
DROP POLICY IF EXISTS "Users can manage their team members" ON public.team_members;

CREATE POLICY "Users can manage their team members"
ON public.team_members FOR ALL
TO authenticated
USING (auth.uid() = owner_user_id)
WITH CHECK (auth.uid() = owner_user_id);

-- 6.18: TEAM_LOCATIONS - User can manage locations
DROP POLICY IF EXISTS "Users can view their team locations" ON public.team_locations;
DROP POLICY IF EXISTS "Users can create team locations" ON public.team_locations;
DROP POLICY IF EXISTS "Users can update team locations" ON public.team_locations;
DROP POLICY IF EXISTS "Users can delete team locations" ON public.team_locations;

CREATE POLICY "Users can view their team locations"
ON public.team_locations FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can create team locations"
ON public.team_locations FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update team locations"
ON public.team_locations FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete team locations"
ON public.team_locations FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- 6.19: WORK_TASKS - User can manage own tasks
DROP POLICY IF EXISTS "Users can manage their work tasks" ON public.work_tasks;

CREATE POLICY "Users can manage their work tasks"
ON public.work_tasks FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- 6.20: SUBCONTRACTORS - User can manage own, public can view public
DROP POLICY IF EXISTS "Users can manage their subcontractors" ON public.subcontractors;
DROP POLICY IF EXISTS "Anyone can view public subcontractors" ON public.subcontractors;

CREATE POLICY "Users can manage their subcontractors"
ON public.subcontractors FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Anyone can view public subcontractors"
ON public.subcontractors FOR SELECT
USING (is_public = true);

-- 6.21: SUBCONTRACTOR_SERVICES - Public can view, owner can modify
DROP POLICY IF EXISTS "Public can view services" ON public.subcontractor_services;
DROP POLICY IF EXISTS "Subcontractor owners can insert services" ON public.subcontractor_services;
DROP POLICY IF EXISTS "Subcontractor owners can update services" ON public.subcontractor_services;
DROP POLICY IF EXISTS "Subcontractor owners can delete services" ON public.subcontractor_services;

CREATE POLICY "Public can view services"
ON public.subcontractor_services FOR SELECT
USING (true);

CREATE POLICY "Subcontractor owners can insert services"
ON public.subcontractor_services FOR INSERT
TO authenticated
WITH CHECK (public.is_subcontractor_owner(auth.uid(), subcontractor_id));

CREATE POLICY "Subcontractor owners can update services"
ON public.subcontractor_services FOR UPDATE
TO authenticated
USING (public.is_subcontractor_owner(auth.uid(), subcontractor_id));

CREATE POLICY "Subcontractor owners can delete services"
ON public.subcontractor_services FOR DELETE
TO authenticated
USING (public.is_subcontractor_owner(auth.uid(), subcontractor_id));

-- 6.22: SUBCONTRACTOR_REVIEWS - Public can view, users can create/edit/delete own
DROP POLICY IF EXISTS "Users can create reviews" ON public.subcontractor_reviews;
DROP POLICY IF EXISTS "Anyone can view reviews" ON public.subcontractor_reviews;
DROP POLICY IF EXISTS "Review authors can update their reviews" ON public.subcontractor_reviews;
DROP POLICY IF EXISTS "Review authors can delete their reviews" ON public.subcontractor_reviews;

CREATE POLICY "Users can create reviews"
ON public.subcontractor_reviews FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = reviewer_user_id);

CREATE POLICY "Anyone can view reviews"
ON public.subcontractor_reviews FOR SELECT
USING (true);

CREATE POLICY "Review authors can update their reviews"
ON public.subcontractor_reviews FOR UPDATE
TO authenticated
USING (auth.uid() = reviewer_user_id);

CREATE POLICY "Review authors can delete their reviews"
ON public.subcontractor_reviews FOR DELETE
TO authenticated
USING (auth.uid() = reviewer_user_id);

-- 6.23: AI_CHAT_HISTORY - User can manage own chat
DROP POLICY IF EXISTS "Users can view their own chat history" ON public.ai_chat_history;
DROP POLICY IF EXISTS "Users can create their own chat messages" ON public.ai_chat_history;
DROP POLICY IF EXISTS "Users can update their own chat messages" ON public.ai_chat_history;
DROP POLICY IF EXISTS "Users can delete their own chat history" ON public.ai_chat_history;

CREATE POLICY "Users can view their own chat history"
ON public.ai_chat_history FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own chat messages"
ON public.ai_chat_history FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own chat messages"
ON public.ai_chat_history FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own chat history"
ON public.ai_chat_history FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- 6.24: USER_ROLES - User can view own, admin can manage all
DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can manage all roles" ON public.user_roles;

CREATE POLICY "Users can view their own roles"
ON public.user_roles FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all roles"
ON public.user_roles FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 6.25: USER_SUBSCRIPTIONS - User can manage own subscription
DROP POLICY IF EXISTS "Users can view their own subscription" ON public.user_subscriptions;
DROP POLICY IF EXISTS "Users can insert their own subscription" ON public.user_subscriptions;
DROP POLICY IF EXISTS "Users can update their own subscription" ON public.user_subscriptions;

CREATE POLICY "Users can view their own subscription"
ON public.user_subscriptions FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own subscription"
ON public.user_subscriptions FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own subscription"
ON public.user_subscriptions FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

-- 6.26: USER_CONSENTS - User can manage own consents
DROP POLICY IF EXISTS "Users view own consents" ON public.user_consents;
DROP POLICY IF EXISTS "Authenticated users can insert consents" ON public.user_consents;
DROP POLICY IF EXISTS "Users update own consents" ON public.user_consents;
DROP POLICY IF EXISTS "Users delete own consents" ON public.user_consents;

CREATE POLICY "Users view own consents"
ON public.user_consents FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Authenticated users can insert consents"
ON public.user_consents FOR INSERT
TO authenticated
WITH CHECK ((auth.uid() IS NOT NULL) AND ((user_id IS NULL) OR (user_id = auth.uid())));

CREATE POLICY "Users update own consents"
ON public.user_consents FOR UPDATE
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Users delete own consents"
ON public.user_consents FOR DELETE
TO authenticated
USING (user_id = auth.uid());

-- 6.27: API_KEYS - User can manage own API keys
DROP POLICY IF EXISTS "Users can manage their API keys" ON public.api_keys;

CREATE POLICY "Users can manage their API keys"
ON public.api_keys FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- 6.28: API_RATE_LIMITS - Service role only
DROP POLICY IF EXISTS "Service role can manage rate limits" ON public.api_rate_limits;

CREATE POLICY "Service role can manage rate limits"
ON public.api_rate_limits FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- 6.29: PUSH_TOKENS - User can manage own tokens
DROP POLICY IF EXISTS "Users can manage their own push tokens" ON public.push_tokens;

CREATE POLICY "Users can manage their own push tokens"
ON public.push_tokens FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- 6.30: ORGANIZATIONS - Owner can manage, members can view
DROP POLICY IF EXISTS "Members can view their orgs" ON public.organizations;
DROP POLICY IF EXISTS "Users can create organizations" ON public.organizations;
DROP POLICY IF EXISTS "Organization owners can update" ON public.organizations;
DROP POLICY IF EXISTS "Organization owners can delete" ON public.organizations;

CREATE POLICY "Users can create organizations"
ON public.organizations FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = owner_user_id);

CREATE POLICY "Organization owners can update"
ON public.organizations FOR UPDATE
TO authenticated
USING (auth.uid() = owner_user_id);

CREATE POLICY "Organization owners can delete"
ON public.organizations FOR DELETE
TO authenticated
USING (auth.uid() = owner_user_id);

CREATE POLICY "Members can view their orgs"
ON public.organizations FOR SELECT
TO authenticated
USING ((auth.uid() = owner_user_id) OR public.is_org_member(auth.uid(), id));

-- 6.31: ORGANIZATION_MEMBERS - Members can view, admins can manage
DROP POLICY IF EXISTS "Members can view their org members" ON public.organization_members;
DROP POLICY IF EXISTS "Org admins can add members" ON public.organization_members;
DROP POLICY IF EXISTS "Org admins can update members" ON public.organization_members;
DROP POLICY IF EXISTS "Org admins can remove members" ON public.organization_members;

CREATE POLICY "Members can view their org members"
ON public.organization_members FOR SELECT
TO authenticated
USING ((user_id = auth.uid()) OR public.is_org_member(auth.uid(), organization_id));

CREATE POLICY "Org admins can add members"
ON public.organization_members FOR INSERT
TO authenticated
WITH CHECK (public.is_org_admin(auth.uid(), organization_id));

CREATE POLICY "Org admins can update members"
ON public.organization_members FOR UPDATE
TO authenticated
USING (public.is_org_admin(auth.uid(), organization_id));

CREATE POLICY "Org admins can remove members"
ON public.organization_members FOR DELETE
TO authenticated
USING (public.is_org_admin(auth.uid(), organization_id));

-- 6.32: BIOMETRIC_CREDENTIALS - User can manage own credentials
DROP POLICY IF EXISTS "Users can manage their biometric credentials" ON public.biometric_credentials;

CREATE POLICY "Users can manage their biometric credentials"
ON public.biometric_credentials FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- ============================================
-- SECTION 7: CREATE STORAGE BUCKETS
-- ============================================

INSERT INTO storage.buckets (id, name, public)
VALUES ('logos', 'logos', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public)
VALUES ('project-photos', 'project-photos', false)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public)
VALUES ('company-documents', 'company-documents', false)
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- SECTION 8: CREATE STORAGE POLICIES
-- ============================================

-- 8.1: LOGOS bucket policies
DROP POLICY IF EXISTS "Logo images are publicly accessible" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload their own logo" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own logo" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own logo" ON storage.objects;

CREATE POLICY "Logo images are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'logos');

CREATE POLICY "Users can upload their own logo"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'logos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their own logo"
ON storage.objects FOR UPDATE
USING (bucket_id = 'logos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own logo"
ON storage.objects FOR DELETE
USING (bucket_id = 'logos' AND auth.uid()::text = (storage.foldername(name))[1]);

-- 8.2: PROJECT-PHOTOS bucket policies
DROP POLICY IF EXISTS "Users can view their own project photos" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload project photos" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload their own project photos" ON storage.objects;
DROP POLICY IF EXISTS "Users can view project photos" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their project photos" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their project photos" ON storage.objects;

CREATE POLICY "Users can view their own project photos"
ON storage.objects FOR SELECT
USING (bucket_id = 'project-photos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can upload their own project photos"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'project-photos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own project photos"
ON storage.objects FOR DELETE
USING (bucket_id = 'project-photos' AND auth.uid()::text = (storage.foldername(name))[1]);

-- 8.3: COMPANY-DOCUMENTS bucket policies
DROP POLICY IF EXISTS "Users can view their own documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload their own documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own documents" ON storage.objects;

CREATE POLICY "Users can view their own documents"
ON storage.objects FOR SELECT
USING (bucket_id = 'company-documents' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can upload their own documents"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'company-documents' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own documents"
ON storage.objects FOR DELETE
USING (bucket_id = 'company-documents' AND auth.uid()::text = (storage.foldername(name))[1]);

-- ============================================
-- SECTION 9: CREATE INDEXES FOR PERFORMANCE
-- ============================================

-- 9.1: Basic user_id indexes for RLS filtering
CREATE INDEX IF NOT EXISTS idx_clients_user_id ON public.clients(user_id);
CREATE INDEX IF NOT EXISTS idx_projects_user_id ON public.projects(user_id);
CREATE INDEX IF NOT EXISTS idx_projects_client_id ON public.projects(client_id);
CREATE INDEX IF NOT EXISTS idx_quotes_project_id ON public.quotes(project_id);
CREATE INDEX IF NOT EXISTS idx_pdf_data_project_id ON public.pdf_data(project_id);

-- 9.2: Calendar and events
CREATE INDEX IF NOT EXISTS idx_calendar_events_user_date ON public.calendar_events(user_id, event_date);
CREATE INDEX IF NOT EXISTS idx_calendar_events_project ON public.calendar_events(project_id);

-- 9.3: Organization indexes
CREATE INDEX IF NOT EXISTS idx_org_members_user ON public.organization_members(user_id);
CREATE INDEX IF NOT EXISTS idx_org_members_org ON public.organization_members(organization_id);
CREATE INDEX IF NOT EXISTS idx_biometric_user ON public.biometric_credentials(user_id);
CREATE INDEX IF NOT EXISTS idx_biometric_credential_id ON public.biometric_credentials(credential_id);

-- 9.4: Notification queries - composite index for user + read + created
CREATE INDEX IF NOT EXISTS idx_notifications_user_read_created
ON public.notifications(user_id, is_read, created_at DESC);

COMMENT ON INDEX idx_notifications_user_read_created IS
'Optimizes notification queries filtered by user and read status, sorted by creation date';

-- 9.5: Offer approval queries - project and expiration tracking
CREATE INDEX IF NOT EXISTS idx_offer_approvals_project_created
ON public.offer_approvals(project_id, created_at DESC);

COMMENT ON INDEX idx_offer_approvals_project_created IS
'Optimizes queries fetching offer approvals for a specific project, sorted by creation date';

CREATE INDEX IF NOT EXISTS idx_offer_approvals_user_status_expires
ON public.offer_approvals(user_id, status, expires_at);

COMMENT ON INDEX idx_offer_approvals_user_status_expires IS
'Optimizes expiration monitor queries filtering by user, pending status, and expiration date range';

CREATE INDEX IF NOT EXISTS idx_offer_approvals_status_expires
ON public.offer_approvals(status, expires_at);

COMMENT ON INDEX idx_offer_approvals_status_expires IS
'Optimizes edge function queries for pending offers filtered by expiration date range';

-- 9.6: Project sorting by creation date
CREATE INDEX IF NOT EXISTS idx_projects_user_created
ON public.projects(user_id, created_at DESC);

COMMENT ON INDEX idx_projects_user_created IS
'Optimizes queries fetching recent projects for a user, sorted by creation date';

-- ============================================
-- SECTION 10: ADD COMMENTS FOR DOCUMENTATION
-- ============================================

COMMENT ON TABLE public.clients IS 'Client information for projects';
COMMENT ON TABLE public.profiles IS 'User company profile and business information';
COMMENT ON TABLE public.projects IS 'Construction projects and quotes';
COMMENT ON TABLE public.quotes IS 'Quote data for projects';
COMMENT ON TABLE public.pdf_data IS 'PDF template configuration for quotes';
COMMENT ON TABLE public.item_templates IS 'User-defined quote item templates';
COMMENT ON TABLE public.quote_versions IS 'Historical versions of quotes';
COMMENT ON TABLE public.offer_sends IS 'Email history of sent offers';
COMMENT ON TABLE public.offer_approvals IS 'Client approval status of offers with e-signature';
COMMENT ON TABLE public.calendar_events IS 'Project-related calendar events and deadlines';
COMMENT ON TABLE public.onboarding_progress IS 'User onboarding completion tracking';
COMMENT ON TABLE public.notifications IS 'User notifications and alerts';
COMMENT ON TABLE public.project_photos IS 'Photos of projects for AI analysis';
COMMENT ON TABLE public.company_documents IS 'Company documents (permits, certifications, etc)';
COMMENT ON TABLE public.purchase_costs IS 'Project purchase invoices with OCR data';
COMMENT ON TABLE public.financial_reports IS 'Cached financial analytics data';
COMMENT ON TABLE public.team_members IS 'Company team members';
COMMENT ON TABLE public.team_locations IS 'GPS location tracking for team';
COMMENT ON TABLE public.work_tasks IS 'Project tasks and work scheduling';
COMMENT ON TABLE public.subcontractors IS 'Marketplace profile for subcontractors';
COMMENT ON TABLE public.subcontractor_services IS 'Services offered by subcontractors';
COMMENT ON TABLE public.subcontractor_reviews IS 'Client reviews of subcontractors';
COMMENT ON TABLE public.ai_chat_history IS 'AI assistant chat history for users';
COMMENT ON TABLE public.user_roles IS 'User role assignments for authorization';
COMMENT ON TABLE public.user_subscriptions IS 'Subscription plan and billing information';
COMMENT ON TABLE public.user_consents IS 'GDPR and consent tracking';
COMMENT ON TABLE public.api_keys IS 'API keys for platform integrations';
COMMENT ON TABLE public.api_rate_limits IS 'Rate limiting for API endpoints';
COMMENT ON TABLE public.push_tokens IS 'Device push notification tokens';
COMMENT ON TABLE public.organizations IS 'Multi-tenant organizations';
COMMENT ON TABLE public.organization_members IS 'Organization membership';
COMMENT ON TABLE public.biometric_credentials IS 'Biometric authentication credentials';

COMMENT ON COLUMN public.offer_sends.pdf_url IS 'Public URL of generated PDF offer stored in Supabase Storage (company-documents bucket)';
COMMENT ON COLUMN public.offer_sends.pdf_generated_at IS 'Timestamp when PDF was generated and uploaded to storage';
COMMENT ON COLUMN public.offer_sends.tracking_status IS 'Business tracking status of the offer: sent (default), opened, pdf_viewed, accepted, rejected. NOT NULL with default ''sent''.';
COMMENT ON COLUMN public.offer_approvals.expires_at IS 'Token expiration date for offer approval links (default 30 days from creation)';

-- ============================================
-- END OF CONSOLIDATED MIGRATION
-- ============================================
-- Total tables: 32
-- Total functions: 8
-- Total triggers: 4
-- All RLS enabled and secured
-- All indexes created for performance
-- ============================================
