# Eksport Majster.AI do własnego Supabase

**Dla:** banaszek.robert@gmail.com  
**Data:** 2025-12-10

## 1. Utwórz nowy projekt Supabase

1. Idź na https://supabase.com i zaloguj się (lub załóż konto)
2. Kliknij "New Project"
3. Wybierz organizację i nazwę projektu (np. "majster-ai")
4. Zapisz hasło do bazy danych!
5. Wybierz region (najlepiej Frankfurt dla Polski)

## 2. Skopiuj dane projektu

Po utworzeniu projektu, w **Settings → API** znajdziesz:
- **Project URL**: `https://[twoj-id].supabase.co`
- **anon/public key**: klucz do frontendu
- **service_role key**: klucz do backendu (trzymaj w tajemnicy!)

## 3. Uruchom migrację SQL

W Supabase Dashboard → **SQL Editor** wklej i uruchom poniższy skrypt:

```sql
-- =====================================================
-- MAJSTER.AI - PEŁNA MIGRACJA BAZY DANYCH
-- =====================================================

-- 1. ENUM TYPES
CREATE TYPE app_role AS ENUM ('admin', 'moderator', 'user');

-- 2. TABELE

-- Profiles (dane firmy)
CREATE TABLE public.profiles (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL UNIQUE,
  company_name text NOT NULL DEFAULT '',
  owner_name text DEFAULT '',
  nip text DEFAULT '',
  street text DEFAULT '',
  postal_code text DEFAULT '',
  city text DEFAULT '',
  phone text DEFAULT '',
  bank_account text DEFAULT '',
  logo_url text DEFAULT '',
  email_for_offers text DEFAULT '',
  email_greeting text DEFAULT 'Szanowny Kliencie,',
  email_signature text DEFAULT 'Z poważaniem',
  email_subject_template text DEFAULT 'Oferta od {company_name}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Clients (klienci)
CREATE TABLE public.clients (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  name text NOT NULL,
  email text DEFAULT '',
  phone text DEFAULT '',
  address text DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Projects (projekty)
CREATE TABLE public.projects (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  client_id uuid NOT NULL REFERENCES public.clients(id),
  project_name text NOT NULL,
  status text NOT NULL DEFAULT 'Nowy',
  priority text DEFAULT 'normal',
  start_date date,
  end_date date,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Quotes (wyceny)
CREATE TABLE public.quotes (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  project_id uuid NOT NULL UNIQUE REFERENCES public.projects(id),
  positions jsonb NOT NULL DEFAULT '[]',
  summary_materials numeric NOT NULL DEFAULT 0,
  summary_labor numeric NOT NULL DEFAULT 0,
  margin_percent numeric NOT NULL DEFAULT 0,
  total numeric NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Quote Versions (historia wersji wycen)
CREATE TABLE public.quote_versions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  project_id uuid NOT NULL,
  version_name text NOT NULL DEFAULT 'V1',
  quote_snapshot jsonb NOT NULL DEFAULT '{}',
  is_active boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Item Templates (szablony pozycji)
CREATE TABLE public.item_templates (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  name text NOT NULL,
  description text DEFAULT '',
  category text NOT NULL DEFAULT 'Materiał',
  unit text NOT NULL DEFAULT 'szt.',
  default_qty numeric NOT NULL DEFAULT 1,
  default_price numeric NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- PDF Data (dane ofert PDF)
CREATE TABLE public.pdf_data (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  project_id uuid NOT NULL UNIQUE REFERENCES public.projects(id),
  title text NOT NULL DEFAULT '',
  offer_text text DEFAULT '',
  deadline_text text DEFAULT '',
  terms text DEFAULT '',
  version text NOT NULL DEFAULT 'standard',
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Offer Sends (historia wysyłek)
CREATE TABLE public.offer_sends (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  project_id uuid NOT NULL,
  client_email text NOT NULL,
  subject text NOT NULL,
  message text DEFAULT '',
  status text NOT NULL DEFAULT 'pending',
  error_message text,
  sent_at timestamptz NOT NULL DEFAULT now()
);

-- Offer Approvals (akceptacje ofert)
CREATE TABLE public.offer_approvals (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  project_id uuid NOT NULL REFERENCES public.projects(id),
  public_token uuid NOT NULL DEFAULT gen_random_uuid(),
  status text NOT NULL DEFAULT 'pending',
  client_name text,
  client_email text,
  client_comment text,
  signature_data text,
  approved_at timestamptz,
  expires_at timestamptz DEFAULT (now() + interval '30 days'),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Calendar Events (kalendarz)
CREATE TABLE public.calendar_events (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  project_id uuid REFERENCES public.projects(id),
  title text NOT NULL,
  description text DEFAULT '',
  event_date date NOT NULL,
  event_time time,
  event_type text NOT NULL DEFAULT 'deadline',
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Work Tasks (zadania)
CREATE TABLE public.work_tasks (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  project_id uuid NOT NULL REFERENCES public.projects(id),
  assigned_team_member_id uuid,
  title text NOT NULL,
  description text,
  start_date timestamptz NOT NULL,
  end_date timestamptz NOT NULL,
  status text NOT NULL DEFAULT 'planned',
  task_type text DEFAULT 'work',
  color text DEFAULT '#3b82f6',
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Team Members (członkowie zespołu)
CREATE TABLE public.team_members (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  owner_user_id uuid NOT NULL,
  name text NOT NULL,
  email text,
  phone text,
  role text DEFAULT 'worker',
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Team Locations (lokalizacje zespołu)
CREATE TABLE public.team_locations (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  team_member_id uuid NOT NULL REFERENCES public.team_members(id),
  project_id uuid REFERENCES public.projects(id),
  latitude numeric NOT NULL,
  longitude numeric NOT NULL,
  status text NOT NULL DEFAULT 'idle',
  recorded_at timestamptz NOT NULL DEFAULT now()
);

-- Purchase Costs (koszty zakupów)
CREATE TABLE public.purchase_costs (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  project_id uuid NOT NULL REFERENCES public.projects(id),
  supplier_name text,
  invoice_number text,
  invoice_date date,
  net_amount numeric NOT NULL DEFAULT 0,
  vat_amount numeric NOT NULL DEFAULT 0,
  gross_amount numeric NOT NULL DEFAULT 0,
  items jsonb NOT NULL DEFAULT '[]',
  document_url text,
  ocr_status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Project Photos (zdjęcia projektów)
CREATE TABLE public.project_photos (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  project_id uuid NOT NULL REFERENCES public.projects(id),
  photo_url text NOT NULL,
  file_name text NOT NULL,
  analysis_status text NOT NULL DEFAULT 'pending',
  analysis_result jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Financial Reports (raporty finansowe)
CREATE TABLE public.financial_reports (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  report_month date NOT NULL,
  total_revenue numeric DEFAULT 0,
  total_costs numeric DEFAULT 0,
  gross_margin numeric DEFAULT 0,
  project_count integer DEFAULT 0,
  report_data jsonb DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Organizations (organizacje)
CREATE TABLE public.organizations (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_user_id uuid NOT NULL,
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  logo_url text,
  plan_id text DEFAULT 'free',
  settings jsonb DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Organization Members (członkowie organizacji)
CREATE TABLE public.organization_members (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id uuid NOT NULL REFERENCES public.organizations(id),
  user_id uuid NOT NULL,
  role text NOT NULL DEFAULT 'member',
  invited_by uuid,
  invited_at timestamptz DEFAULT now(),
  accepted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- User Roles (role użytkowników)
CREATE TABLE public.user_roles (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  role app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- User Subscriptions (subskrypcje)
CREATE TABLE public.user_subscriptions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL UNIQUE,
  plan_id text NOT NULL DEFAULT 'free',
  status text NOT NULL DEFAULT 'active',
  stripe_customer_id text,
  stripe_subscription_id text,
  current_period_start timestamptz,
  current_period_end timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Notifications (powiadomienia)
CREATE TABLE public.notifications (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  title text NOT NULL,
  message text NOT NULL,
  type text NOT NULL DEFAULT 'info',
  is_read boolean NOT NULL DEFAULT false,
  action_url text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- AI Chat History (historia czatu AI)
CREATE TABLE public.ai_chat_history (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  session_id uuid NOT NULL DEFAULT gen_random_uuid(),
  role text NOT NULL,
  content text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- API Keys (klucze API)
CREATE TABLE public.api_keys (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  key_name text NOT NULL,
  api_key text NOT NULL DEFAULT encode(gen_random_bytes(32), 'hex'),
  is_active boolean NOT NULL DEFAULT true,
  permissions jsonb DEFAULT '["read"]',
  last_used_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- API Rate Limits
CREATE TABLE public.api_rate_limits (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  identifier text NOT NULL,
  endpoint text NOT NULL,
  request_count integer NOT NULL DEFAULT 1,
  window_start timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Biometric Credentials
CREATE TABLE public.biometric_credentials (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  credential_id text NOT NULL,
  public_key text NOT NULL,
  counter integer NOT NULL DEFAULT 0,
  device_name text,
  last_used_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Company Documents
CREATE TABLE public.company_documents (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  name text NOT NULL,
  description text,
  document_type text NOT NULL,
  file_name text NOT NULL,
  file_url text NOT NULL,
  file_size integer,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Onboarding Progress
CREATE TABLE public.onboarding_progress (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL UNIQUE,
  current_step integer NOT NULL DEFAULT 1,
  completed_steps integer[] DEFAULT '{}',
  is_completed boolean NOT NULL DEFAULT false,
  skipped_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Push Tokens
CREATE TABLE public.push_tokens (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  token text NOT NULL,
  platform text NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Subcontractors
CREATE TABLE public.subcontractors (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  company_name text NOT NULL,
  contact_name text,
  email text,
  phone text,
  description text,
  location_city text,
  location_lat numeric,
  location_lng numeric,
  hourly_rate numeric,
  rating numeric DEFAULT 0,
  review_count integer DEFAULT 0,
  avatar_url text,
  portfolio_images jsonb DEFAULT '[]',
  is_public boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Subcontractor Services
CREATE TABLE public.subcontractor_services (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  subcontractor_id uuid NOT NULL REFERENCES public.subcontractors(id),
  service_name text NOT NULL,
  price_per_unit numeric,
  unit text DEFAULT 'godz.',
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Subcontractor Reviews
CREATE TABLE public.subcontractor_reviews (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  subcontractor_id uuid NOT NULL REFERENCES public.subcontractors(id),
  reviewer_user_id uuid NOT NULL,
  rating integer NOT NULL,
  comment text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- User Consents (GDPR)
CREATE TABLE public.user_consents (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid,
  consent_type text NOT NULL,
  granted boolean NOT NULL DEFAULT false,
  granted_at timestamptz,
  revoked_at timestamptz,
  ip_address text,
  user_agent text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 3. FUNKCJE POMOCNICZE

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

CREATE OR REPLACE FUNCTION public.validate_offer_token(_token uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.offer_approvals
    WHERE public_token = _token
      AND status = 'pending'
      AND (expires_at IS NULL OR expires_at > now())
  )
$$;

CREATE OR REPLACE FUNCTION public.is_org_member(_user_id uuid, _org_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.organization_members
    WHERE user_id = _user_id AND organization_id = _org_id
  )
$$;

CREATE OR REPLACE FUNCTION public.is_org_admin(_user_id uuid, _org_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.organization_members
    WHERE user_id = _user_id
      AND organization_id = _org_id
      AND role IN ('owner', 'admin')
  )
$$;

CREATE OR REPLACE FUNCTION public.get_user_org_ids(_user_id uuid)
RETURNS SETOF uuid
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT organization_id FROM public.organization_members WHERE user_id = _user_id
$$;

CREATE OR REPLACE FUNCTION public.is_subcontractor_owner(_user_id uuid, _subcontractor_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.subcontractors
    WHERE id = _subcontractor_id AND user_id = _user_id
  )
$$;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = 'public'
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, company_name)
  VALUES (NEW.id, '');
  RETURN NEW;
END;
$$;

-- 4. TRIGGERY

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_organizations_updated_at
  BEFORE UPDATE ON public.organizations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_subscriptions_updated_at
  BEFORE UPDATE ON public.user_subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_onboarding_updated_at
  BEFORE UPDATE ON public.onboarding_progress
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger dla nowych użytkowników
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 5. ROW LEVEL SECURITY (RLS)

-- Włącz RLS na wszystkich tabelach
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quote_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.item_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pdf_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.offer_sends ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.offer_approvals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.calendar_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.work_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchase_costs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.financial_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_chat_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.api_rate_limits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.biometric_credentials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.onboarding_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.push_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subcontractors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subcontractor_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subcontractor_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_consents ENABLE ROW LEVEL SECURITY;

-- POLITYKI RLS

-- Profiles
CREATE POLICY "Users can view their own profile" ON public.profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);

-- Clients
CREATE POLICY "Users can view their own clients" ON public.clients FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own clients" ON public.clients FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own clients" ON public.clients FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own clients" ON public.clients FOR DELETE USING (auth.uid() = user_id);

-- Projects
CREATE POLICY "Users can view their own projects" ON public.projects FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own projects" ON public.projects FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own projects" ON public.projects FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own projects" ON public.projects FOR DELETE USING (auth.uid() = user_id);

-- Quotes
CREATE POLICY "Users can view their own quotes" ON public.quotes FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own quotes" ON public.quotes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own quotes" ON public.quotes FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own quotes" ON public.quotes FOR DELETE USING (auth.uid() = user_id);

-- Quote Versions
CREATE POLICY "Users can view their own quote versions" ON public.quote_versions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own quote versions" ON public.quote_versions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own quote versions" ON public.quote_versions FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own quote versions" ON public.quote_versions FOR DELETE USING (auth.uid() = user_id);

-- Item Templates
CREATE POLICY "Users can view their own templates" ON public.item_templates FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own templates" ON public.item_templates FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own templates" ON public.item_templates FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own templates" ON public.item_templates FOR DELETE USING (auth.uid() = user_id);

-- PDF Data
CREATE POLICY "Users can view their own pdf_data" ON public.pdf_data FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own pdf_data" ON public.pdf_data FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own pdf_data" ON public.pdf_data FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own pdf_data" ON public.pdf_data FOR DELETE USING (auth.uid() = user_id);

-- Offer Sends
CREATE POLICY "Users can view their own offer sends" ON public.offer_sends FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own offer sends" ON public.offer_sends FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own offer sends" ON public.offer_sends FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own offer sends" ON public.offer_sends FOR DELETE USING (auth.uid() = user_id);

-- Offer Approvals
CREATE POLICY "Users can view their own offer approvals" ON public.offer_approvals FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own offer approvals" ON public.offer_approvals FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own offer approvals" ON public.offer_approvals FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own offer approvals" ON public.offer_approvals FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "Public can view pending offers by valid token" ON public.offer_approvals FOR SELECT USING (status = 'pending' AND public_token IS NOT NULL AND validate_offer_token(public_token));
CREATE POLICY "Public can update pending offers with valid token" ON public.offer_approvals FOR UPDATE USING (status = 'pending' AND public_token IS NOT NULL AND validate_offer_token(public_token)) WITH CHECK (status IN ('approved', 'rejected') AND public_token IS NOT NULL);

-- Calendar Events
CREATE POLICY "Users can view their own events" ON public.calendar_events FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own events" ON public.calendar_events FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own events" ON public.calendar_events FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own events" ON public.calendar_events FOR DELETE USING (auth.uid() = user_id);

-- Work Tasks
CREATE POLICY "Users can manage their work tasks" ON public.work_tasks FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Team Members
CREATE POLICY "Users can manage their team members" ON public.team_members FOR ALL USING (auth.uid() = owner_user_id) WITH CHECK (auth.uid() = owner_user_id);

-- Team Locations
CREATE POLICY "Users can view their team locations" ON public.team_locations FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create team locations" ON public.team_locations FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update team locations" ON public.team_locations FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete team locations" ON public.team_locations FOR DELETE USING (auth.uid() = user_id);

-- Purchase Costs
CREATE POLICY "Users can view their own purchase costs" ON public.purchase_costs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own purchase costs" ON public.purchase_costs FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own purchase costs" ON public.purchase_costs FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own purchase costs" ON public.purchase_costs FOR DELETE USING (auth.uid() = user_id);

-- Project Photos
CREATE POLICY "Users can view their own project photos" ON public.project_photos FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own project photos" ON public.project_photos FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own project photos" ON public.project_photos FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own project photos" ON public.project_photos FOR DELETE USING (auth.uid() = user_id);

-- Financial Reports
CREATE POLICY "Users can manage their financial reports" ON public.financial_reports FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Organizations
CREATE POLICY "Members can view their orgs" ON public.organizations FOR SELECT USING (auth.uid() = owner_user_id OR is_org_member(auth.uid(), id));
CREATE POLICY "Users can create organizations" ON public.organizations FOR INSERT WITH CHECK (auth.uid() = owner_user_id);
CREATE POLICY "Organization owners can update" ON public.organizations FOR UPDATE USING (auth.uid() = owner_user_id);
CREATE POLICY "Organization owners can delete" ON public.organizations FOR DELETE USING (auth.uid() = owner_user_id);

-- Organization Members
CREATE POLICY "Members can view their org members" ON public.organization_members FOR SELECT USING (user_id = auth.uid() OR is_org_member(auth.uid(), organization_id));
CREATE POLICY "Org admins can add members" ON public.organization_members FOR INSERT WITH CHECK (is_org_admin(auth.uid(), organization_id));
CREATE POLICY "Org admins can update members" ON public.organization_members FOR UPDATE USING (is_org_admin(auth.uid(), organization_id));
CREATE POLICY "Org admins can remove members" ON public.organization_members FOR DELETE USING (is_org_admin(auth.uid(), organization_id));

-- User Roles
CREATE POLICY "Users can view their own roles" ON public.user_roles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can manage all roles" ON public.user_roles FOR ALL USING (has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'admin'));

-- User Subscriptions
CREATE POLICY "Users can view their own subscription" ON public.user_subscriptions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own subscription" ON public.user_subscriptions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own subscription" ON public.user_subscriptions FOR UPDATE USING (auth.uid() = user_id);

-- Notifications
CREATE POLICY "Users can view their own notifications" ON public.notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own notifications" ON public.notifications FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own notifications" ON public.notifications FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own notifications" ON public.notifications FOR DELETE USING (auth.uid() = user_id);

-- AI Chat History
CREATE POLICY "Users can view their own chat history" ON public.ai_chat_history FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own chat messages" ON public.ai_chat_history FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own chat messages" ON public.ai_chat_history FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own chat history" ON public.ai_chat_history FOR DELETE USING (auth.uid() = user_id);

-- API Keys
CREATE POLICY "Users can manage their API keys" ON public.api_keys FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- API Rate Limits
CREATE POLICY "Service role can manage rate limits" ON public.api_rate_limits FOR ALL USING (true) WITH CHECK (true);

-- Biometric Credentials
CREATE POLICY "Users can manage their biometric credentials" ON public.biometric_credentials FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Company Documents
CREATE POLICY "Users can view their own documents" ON public.company_documents FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own documents" ON public.company_documents FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own documents" ON public.company_documents FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own documents" ON public.company_documents FOR DELETE USING (auth.uid() = user_id);

-- Onboarding Progress
CREATE POLICY "Users can view their own onboarding progress" ON public.onboarding_progress FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own onboarding progress" ON public.onboarding_progress FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own onboarding progress" ON public.onboarding_progress FOR UPDATE USING (auth.uid() = user_id);

-- Push Tokens
CREATE POLICY "Users can manage their own push tokens" ON public.push_tokens FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Subcontractors
CREATE POLICY "Anyone can view public subcontractors" ON public.subcontractors FOR SELECT USING (is_public = true);
CREATE POLICY "Users can manage their subcontractors" ON public.subcontractors FOR ALL USING (auth.uid() = user_id);

-- Subcontractor Services
CREATE POLICY "Public can view services" ON public.subcontractor_services FOR SELECT USING (true);
CREATE POLICY "Subcontractor owners can insert services" ON public.subcontractor_services FOR INSERT WITH CHECK (is_subcontractor_owner(auth.uid(), subcontractor_id));
CREATE POLICY "Subcontractor owners can update services" ON public.subcontractor_services FOR UPDATE USING (is_subcontractor_owner(auth.uid(), subcontractor_id));
CREATE POLICY "Subcontractor owners can delete services" ON public.subcontractor_services FOR DELETE USING (is_subcontractor_owner(auth.uid(), subcontractor_id));

-- Subcontractor Reviews
CREATE POLICY "Anyone can view reviews" ON public.subcontractor_reviews FOR SELECT USING (true);
CREATE POLICY "Users can create reviews" ON public.subcontractor_reviews FOR INSERT WITH CHECK (auth.uid() = reviewer_user_id);
CREATE POLICY "Review authors can update their reviews" ON public.subcontractor_reviews FOR UPDATE USING (auth.uid() = reviewer_user_id);
CREATE POLICY "Review authors can delete their reviews" ON public.subcontractor_reviews FOR DELETE USING (auth.uid() = reviewer_user_id);

-- User Consents
CREATE POLICY "Users view own consents" ON public.user_consents FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Authenticated users can insert consents" ON public.user_consents FOR INSERT WITH CHECK (auth.uid() IS NOT NULL AND (user_id IS NULL OR user_id = auth.uid()));
CREATE POLICY "Users update own consents" ON public.user_consents FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "Users delete own consents" ON public.user_consents FOR DELETE USING (user_id = auth.uid());

-- 6. STORAGE BUCKETS

INSERT INTO storage.buckets (id, name, public) VALUES ('logos', 'logos', true);
INSERT INTO storage.buckets (id, name, public) VALUES ('company-documents', 'company-documents', false);
INSERT INTO storage.buckets (id, name, public) VALUES ('project-photos', 'project-photos', false);

-- Storage Policies
CREATE POLICY "Public logos access" ON storage.objects FOR SELECT USING (bucket_id = 'logos');
CREATE POLICY "Users can upload logos" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'logos' AND auth.uid() IS NOT NULL);
CREATE POLICY "Users can update their logos" ON storage.objects FOR UPDATE USING (bucket_id = 'logos' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users can delete their logos" ON storage.objects FOR DELETE USING (bucket_id = 'logos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can view their documents" ON storage.objects FOR SELECT USING (bucket_id = 'company-documents' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users can upload documents" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'company-documents' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users can delete their documents" ON storage.objects FOR DELETE USING (bucket_id = 'company-documents' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can view their photos" ON storage.objects FOR SELECT USING (bucket_id = 'project-photos' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users can upload photos" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'project-photos' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users can delete their photos" ON storage.objects FOR DELETE USING (bucket_id = 'project-photos' AND auth.uid()::text = (storage.foldername(name))[1]);
```

## 4. Konfiguracja Edge Functions

Skopiuj folder `supabase/functions/` z projektu i wdróż funkcje:

```bash
# Zainstaluj Supabase CLI
npm install -g supabase

# Zaloguj się
supabase login

# Połącz z projektem
supabase link --project-ref [twoj-project-id]

# Wdróż wszystkie funkcje
supabase functions deploy
```

## 5. Skonfiguruj sekrety

W **Settings → Edge Functions → Secrets** dodaj:

```
RESEND_API_KEY=twoj_klucz_resend (dla wysyłki emaili)
```

## 6. Zaktualizuj zmienne środowiskowe w aplikacji

Utwórz plik `.env.local` w projekcie:

```env
VITE_SUPABASE_URL=https://[twoj-project-id].supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=[twoj-anon-key]
VITE_SUPABASE_PROJECT_ID=[twoj-project-id]
```

## 7. Zaktualizuj klienta Supabase

Zmień plik `src/integrations/supabase/client.ts`:

```typescript
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY);
```

## 8. Włącz Auth

W **Authentication → Providers**:
1. Włącz Email provider
2. W **Authentication → Settings** zaznacz "Enable email confirmations" = OFF (dla szybkich testów)

## 9. Test

1. Uruchom aplikację lokalnie: `npm run dev`
2. Zarejestruj nowe konto
3. Sprawdź czy wszystko działa

---

## Wsparcie

Jeśli masz problemy z migracją, napisz na: banaszek.robert@gmail.com

**Projekt:** Majster.AI  
**Licencja:** MIT
