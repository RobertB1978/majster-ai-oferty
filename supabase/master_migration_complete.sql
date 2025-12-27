-- ============================================
-- MAJSTER.AI - MASTER MIGRATION
-- ============================================
-- Ten skrypt tworzy WSZYSTKIE 33 tabele bazy danych
-- 
-- INSTRUKCJA:
-- 1. Otwórz Supabase Dashboard → SQL Editor
-- 2. Skopiuj CAŁĄ zawartość tego pliku
-- 3. Wklej do SQL Editor
-- 4. Kliknij "Run"
-- 5. Poczekaj ~30 sekund aż się wykona
--
-- Projekt: majster-ai-prod (xwvxqhhnozfrjcjmcltv)
-- Data: 2025-12-27
-- ============================================

-- ============================================
-- KROK 1: Czyszczenie starych tabel (polskie nazwy)
-- ============================================

-- Usuń stare polskie tabele jeśli istnieją
DROP TABLE IF EXISTS public.cytaty CASCADE;
DROP TABLE IF EXISTS public.klienci CASCADE;
DROP TABLE IF EXISTS public.projektowanie CASCADE;
DROP TABLE IF EXISTS public.wydarzenia_kalendarzowe CASCADE;
DROP TABLE IF EXISTS public.powiadomienia CASCADE;
DROP TABLE IF EXISTS public.oferty_wysłane CASCADE;
DROP TABLE IF EXISTS public.postęp_wdrażania CASCADE;
DROP TABLE IF EXISTS public.dane_pdf CASCADE;
DROP TABLE IF EXISTS public.profile CASCADE;
DROP TABLE IF EXISTS public.wersje_cytatów CASCADE;
DROP TABLE IF EXISTS public.szablony_elementów CASCADE;

RAISE NOTICE 'Stare tabele zostały usunięte';

-- ============================================
-- KROK 2: Włącz rozszerzenie pgcrypto
-- ============================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Create clients table
CREATE TABLE public.clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  phone TEXT DEFAULT '',
  email TEXT DEFAULT '',
  address TEXT DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create projects table
CREATE TABLE public.projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  project_name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'Nowy' CHECK (status IN ('Nowy', 'Wycena w toku', 'Oferta wysłana', 'Zaakceptowany')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create quotes table
CREATE TABLE public.quotes (
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

-- Create pdf_data table
CREATE TABLE public.pdf_data (
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

-- Enable RLS on all tables
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pdf_data ENABLE ROW LEVEL SECURITY;

-- RLS policies for clients
CREATE POLICY "Users can view their own clients"
  ON public.clients FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own clients"
  ON public.clients FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own clients"
  ON public.clients FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own clients"
  ON public.clients FOR DELETE
  USING (auth.uid() = user_id);

-- RLS policies for projects
CREATE POLICY "Users can view their own projects"
  ON public.projects FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own projects"
  ON public.projects FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own projects"
  ON public.projects FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own projects"
  ON public.projects FOR DELETE
  USING (auth.uid() = user_id);

-- RLS policies for quotes
CREATE POLICY "Users can view their own quotes"
  ON public.quotes FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own quotes"
  ON public.quotes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own quotes"
  ON public.quotes FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own quotes"
  ON public.quotes FOR DELETE
  USING (auth.uid() = user_id);

-- RLS policies for pdf_data
CREATE POLICY "Users can view their own pdf_data"
  ON public.pdf_data FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own pdf_data"
  ON public.pdf_data FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own pdf_data"
  ON public.pdf_data FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own pdf_data"
  ON public.pdf_data FOR DELETE
  USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX idx_clients_user_id ON public.clients(user_id);
CREATE INDEX idx_projects_user_id ON public.projects(user_id);
CREATE INDEX idx_projects_client_id ON public.projects(client_id);
CREATE INDEX idx_quotes_project_id ON public.quotes(project_id);
CREATE INDEX idx_pdf_data_project_id ON public.pdf_data(project_id);
-- ============================================
-- Profiles, Storage, Functions
-- ============================================

-- Create profiles table for company data
CREATE TABLE public.profiles (
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
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own profile" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own profile" 
ON public.profiles 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile" 
ON public.profiles 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Create trigger for automatic timestamp updates
CREATE OR REPLACE FUNCTION public.update_profiles_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_profiles_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.update_profiles_updated_at();

-- Create function to auto-create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, company_name)
  VALUES (NEW.id, '');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger to create profile when user signs up
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_user();

-- Create storage bucket for company logos
INSERT INTO storage.buckets (id, name, public) 
VALUES ('logos', 'logos', true);

-- Storage policies for logos
CREATE POLICY "Logo images are publicly accessible" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'logos');

CREATE POLICY "Users can upload their own logo" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'logos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their own logo" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'logos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own logo" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'logos' AND auth.uid()::text = (storage.foldername(name))[1]);
-- ============================================
-- Templates, Versions, Offer Sends
-- ============================================

-- SPRINT 5: Tabela szablonów pozycji
CREATE TABLE public.item_templates (
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

ALTER TABLE public.item_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own templates" ON public.item_templates
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own templates" ON public.item_templates
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own templates" ON public.item_templates
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own templates" ON public.item_templates
  FOR DELETE USING (auth.uid() = user_id);

-- SPRINT 6: Tabela wersji wycen
CREATE TABLE public.quote_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  version_name TEXT NOT NULL DEFAULT 'V1',
  quote_snapshot JSONB NOT NULL DEFAULT '{}'::jsonb,
  is_active BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.quote_versions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own quote versions" ON public.quote_versions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own quote versions" ON public.quote_versions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own quote versions" ON public.quote_versions
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own quote versions" ON public.quote_versions
  FOR DELETE USING (auth.uid() = user_id);

-- SPRINT 8: Tabela historii wysyłek ofert
CREATE TABLE public.offer_sends (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  client_email TEXT NOT NULL,
  subject TEXT NOT NULL,
  message TEXT DEFAULT '',
  status TEXT NOT NULL DEFAULT 'pending',
  error_message TEXT,
  sent_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.offer_sends ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own offer sends" ON public.offer_sends
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own offer sends" ON public.offer_sends
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own offer sends" ON public.offer_sends
  FOR UPDATE USING (auth.uid() = user_id);

-- Dodaj kolumny email do profilu dla ustawień wysyłki
ALTER TABLE public.profiles 
  ADD COLUMN IF NOT EXISTS email_subject_template TEXT DEFAULT 'Oferta od {company_name}',
  ADD COLUMN IF NOT EXISTS email_greeting TEXT DEFAULT 'Szanowny Kliencie,',
  ADD COLUMN IF NOT EXISTS email_signature TEXT DEFAULT 'Z poważaniem';
-- ============================================
-- Calendar Events
-- ============================================
-- Table for calendar events/deadlines
CREATE TABLE public.calendar_events (
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

ALTER TABLE public.calendar_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own events" ON public.calendar_events FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own events" ON public.calendar_events FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own events" ON public.calendar_events FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own events" ON public.calendar_events FOR DELETE USING (auth.uid() = user_id);

-- Index for faster queries
CREATE INDEX idx_calendar_events_user_date ON public.calendar_events(user_id, event_date);
CREATE INDEX idx_calendar_events_project ON public.calendar_events(project_id);
-- ============================================
-- Onboarding & Notifications
-- ============================================

-- Create the update_updated_at_column function first
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create onboarding progress table
CREATE TABLE public.onboarding_progress (
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

ALTER TABLE public.onboarding_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own onboarding progress" 
ON public.onboarding_progress FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own onboarding progress" 
ON public.onboarding_progress FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own onboarding progress" 
ON public.onboarding_progress FOR UPDATE USING (auth.uid() = user_id);

CREATE TRIGGER update_onboarding_progress_updated_at
BEFORE UPDATE ON public.onboarding_progress
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create notifications table
CREATE TABLE public.notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'info',
  is_read BOOLEAN NOT NULL DEFAULT false,
  action_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own notifications" 
ON public.notifications FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own notifications" 
ON public.notifications FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications" 
ON public.notifications FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own notifications" 
ON public.notifications FOR DELETE USING (auth.uid() = user_id);

-- Add dates to projects
ALTER TABLE public.projects 
ADD COLUMN IF NOT EXISTS start_date DATE,
ADD COLUMN IF NOT EXISTS end_date DATE,
ADD COLUMN IF NOT EXISTS priority TEXT DEFAULT 'normal';

-- ============================================
-- Migration: 20251205230527_143aedf1-03a7-4204-9a86-f200f74cfa53.sql
-- ============================================

-- Sprint 1: AI Photo Estimation
-- Table for project photos
CREATE TABLE public.project_photos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  photo_url TEXT NOT NULL,
  file_name TEXT NOT NULL,
  analysis_status TEXT NOT NULL DEFAULT 'pending' CHECK (analysis_status IN ('pending', 'analyzing', 'completed', 'failed')),
  analysis_result JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.project_photos ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own project photos"
ON public.project_photos FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own project photos"
ON public.project_photos FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own project photos"
ON public.project_photos FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own project photos"
ON public.project_photos FOR DELETE
USING (auth.uid() = user_id);

-- Sprint 2: OCR Purchase Costs
CREATE TABLE public.purchase_costs (
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

ALTER TABLE public.purchase_costs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own purchase costs"
ON public.purchase_costs FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own purchase costs"
ON public.purchase_costs FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own purchase costs"
ON public.purchase_costs FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own purchase costs"
ON public.purchase_costs FOR DELETE
USING (auth.uid() = user_id);

-- Sprint 3: E-Signature / Offer Approvals
CREATE TABLE public.offer_approvals (
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
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.offer_approvals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own offer approvals"
ON public.offer_approvals FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own offer approvals"
ON public.offer_approvals FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own offer approvals"
ON public.offer_approvals FOR UPDATE
USING (auth.uid() = user_id);

-- Public access for clients to view and sign
CREATE POLICY "Public can view offers by token"
ON public.offer_approvals FOR SELECT
USING (true);

CREATE POLICY "Public can update offers by token"
ON public.offer_approvals FOR UPDATE
USING (true);

-- Sprint 4: Team Locations
CREATE TABLE public.team_members (
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

ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their team members"
ON public.team_members FOR ALL
USING (auth.uid() = owner_user_id);

CREATE TABLE public.team_locations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  team_member_id UUID NOT NULL REFERENCES public.team_members(id) ON DELETE CASCADE,
  project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
  user_id UUID NOT NULL,
  latitude NUMERIC NOT NULL,
  longitude NUMERIC NOT NULL,
  status TEXT NOT NULL DEFAULT 'idle' CHECK (status IN ('idle', 'traveling', 'working', 'break')),
  recorded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.team_locations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their team locations"
ON public.team_locations FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create team locations"
ON public.team_locations FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Sprint 5: Marketplace Subcontractors
CREATE TABLE public.subcontractors (
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

ALTER TABLE public.subcontractors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their subcontractors"
ON public.subcontractors FOR ALL
USING (auth.uid() = user_id);

CREATE POLICY "Anyone can view public subcontractors"
ON public.subcontractors FOR SELECT
USING (is_public = true);

CREATE TABLE public.subcontractor_services (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  subcontractor_id UUID NOT NULL REFERENCES public.subcontractors(id) ON DELETE CASCADE,
  service_name TEXT NOT NULL,
  price_per_unit NUMERIC,
  unit TEXT DEFAULT 'godz.',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.subcontractor_services ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view services"
ON public.subcontractor_services FOR SELECT
USING (true);

CREATE TABLE public.subcontractor_reviews (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  subcontractor_id UUID NOT NULL REFERENCES public.subcontractors(id) ON DELETE CASCADE,
  reviewer_user_id UUID NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.subcontractor_reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can create reviews"
ON public.subcontractor_reviews FOR INSERT
WITH CHECK (auth.uid() = reviewer_user_id);

CREATE POLICY "Anyone can view reviews"
ON public.subcontractor_reviews FOR SELECT
USING (true);

-- Sprint 6: Work Schedule / Resource Calendar
CREATE TABLE public.work_tasks (
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

ALTER TABLE public.work_tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their work tasks"
ON public.work_tasks FOR ALL
USING (auth.uid() = user_id);

-- Sprint 7: Finance - add financial_reports for caching
CREATE TABLE public.financial_reports (
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

ALTER TABLE public.financial_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their financial reports"
ON public.financial_reports FOR ALL
USING (auth.uid() = user_id);

-- Sprint 8: API Keys for Platform Mode
CREATE TABLE public.api_keys (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  key_name TEXT NOT NULL,
  api_key TEXT NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(32), 'hex'),
  permissions JSONB DEFAULT '["read"]',
  is_active BOOLEAN NOT NULL DEFAULT true,
  last_used_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their API keys"
ON public.api_keys FOR ALL
USING (auth.uid() = user_id);

-- Storage bucket for project photos
INSERT INTO storage.buckets (id, name, public) 
VALUES ('project-photos', 'project-photos', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Users can upload project photos"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'project-photos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can view project photos"
ON storage.objects FOR SELECT
USING (bucket_id = 'project-photos');

CREATE POLICY "Users can delete their project photos"
ON storage.objects FOR DELETE
USING (bucket_id = 'project-photos' AND auth.uid()::text = (storage.foldername(name))[1]);
-- ============================================
-- Migration: 20251206073947_dbba8272-c7ab-422b-b702-a7c8498adc54.sql
-- ============================================

-- Create table for AI chat history
CREATE TABLE public.ai_chat_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  session_id UUID NOT NULL DEFAULT gen_random_uuid(),
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.ai_chat_history ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view their own chat history"
ON public.ai_chat_history FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own chat messages"
ON public.ai_chat_history FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own chat history"
ON public.ai_chat_history FOR DELETE
USING (auth.uid() = user_id);

-- Create table for company documents (uprawnienia, referencje, certyfikaty)
CREATE TABLE public.company_documents (
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

-- Enable RLS
ALTER TABLE public.company_documents ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view their own documents"
ON public.company_documents FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own documents"
ON public.company_documents FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own documents"
ON public.company_documents FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own documents"
ON public.company_documents FOR DELETE
USING (auth.uid() = user_id);

-- Create table for user consents (GDPR, cookies, etc.)
CREATE TABLE public.user_consents (
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

-- Enable RLS
ALTER TABLE public.user_consents ENABLE ROW LEVEL SECURITY;

-- RLS policies - allow anyone to insert (for anonymous cookie consent)
CREATE POLICY "Anyone can insert consents"
ON public.user_consents FOR INSERT
WITH CHECK (true);

CREATE POLICY "Users can view their own consents"
ON public.user_consents FOR SELECT
USING (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can update their own consents"
ON public.user_consents FOR UPDATE
USING (auth.uid() = user_id);

-- Create table for user subscriptions/plans
CREATE TABLE public.user_subscriptions (
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

-- Enable RLS
ALTER TABLE public.user_subscriptions ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view their own subscription"
ON public.user_subscriptions FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own subscription"
ON public.user_subscriptions FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own subscription"
ON public.user_subscriptions FOR UPDATE
USING (auth.uid() = user_id);

-- Create storage bucket for company documents
INSERT INTO storage.buckets (id, name, public) VALUES ('company-documents', 'company-documents', false);

-- Storage policies for company documents
CREATE POLICY "Users can view their own documents"
ON storage.objects FOR SELECT
USING (bucket_id = 'company-documents' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can upload their own documents"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'company-documents' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own documents"
ON storage.objects FOR DELETE
USING (bucket_id = 'company-documents' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Create push notification tokens table
CREATE TABLE public.push_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  token TEXT NOT NULL,
  platform TEXT NOT NULL CHECK (platform IN ('web', 'ios', 'android')),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, token)
);

-- Enable RLS
ALTER TABLE public.push_tokens ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can manage their own push tokens"
ON public.push_tokens FOR ALL
USING (auth.uid() = user_id);
-- ============================================
-- Migration: 20251206221151_3de2c381-4106-4dfe-b189-85119bb757df.sql
-- ============================================

-- 1. Create app_role enum for user roles
CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');

-- 2. Create user_roles table
CREATE TABLE public.user_roles (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    UNIQUE (user_id, role)
);

-- 3. Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- 4. Create security definer function to check roles
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

-- 5. Create function to validate offer approval token
CREATE OR REPLACE FUNCTION public.validate_offer_token(_token uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.offer_approvals
    WHERE public_token = _token
      AND status = 'pending'
  )
$$;

-- 6. RLS policies for user_roles
CREATE POLICY "Users can view their own roles"
ON public.user_roles
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all roles"
ON public.user_roles
FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

-- 7. Drop insecure policies from offer_approvals
DROP POLICY IF EXISTS "Public can update offers by token" ON public.offer_approvals;
DROP POLICY IF EXISTS "Public can view offers by token" ON public.offer_approvals;

-- 8. Create secure policies for offer_approvals with token validation
CREATE POLICY "Public can view pending offers by valid token"
ON public.offer_approvals
FOR SELECT
USING (
  status = 'pending' 
  AND public_token IS NOT NULL
);

CREATE POLICY "Public can update pending offers with valid token"
ON public.offer_approvals
FOR UPDATE
USING (
  status = 'pending'
  AND public_token IS NOT NULL
)
WITH CHECK (
  status IN ('approved', 'rejected')
  AND public_token IS NOT NULL
);

-- 9. Add API rate limiting table
CREATE TABLE public.api_rate_limits (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    identifier text NOT NULL,
    endpoint text NOT NULL,
    request_count integer NOT NULL DEFAULT 1,
    window_start timestamp with time zone NOT NULL DEFAULT now(),
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    UNIQUE (identifier, endpoint, window_start)
);

ALTER TABLE public.api_rate_limits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role can manage rate limits"
ON public.api_rate_limits
FOR ALL
USING (true);
-- ============================================
-- Migration: 20251207082500_bedade0c-2e85-41f5-a8a7-3cc2502fa89a.sql
-- ============================================

-- Multi-Tenant Mode: Dodanie tabeli organizacji i powiązań
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

-- Tabela członkostwa w organizacji
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

-- Tabela poświadczeń biometrycznych (server-side)
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

-- RLS dla organizations
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Organization owners can manage" 
ON public.organizations 
FOR ALL 
USING (auth.uid() = owner_user_id);

CREATE POLICY "Members can view their organizations" 
ON public.organizations 
FOR SELECT 
USING (
  id IN (
    SELECT organization_id FROM public.organization_members 
    WHERE user_id = auth.uid()
  )
);

-- RLS dla organization_members
ALTER TABLE public.organization_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view organization members" 
ON public.organization_members 
FOR SELECT 
USING (
  organization_id IN (
    SELECT organization_id FROM public.organization_members 
    WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Org admins can manage members" 
ON public.organization_members 
FOR ALL 
USING (
  organization_id IN (
    SELECT organization_id FROM public.organization_members 
    WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
  )
);

-- RLS dla biometric_credentials
ALTER TABLE public.biometric_credentials ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their biometric credentials" 
ON public.biometric_credentials 
FOR ALL 
USING (auth.uid() = user_id);

-- Indeksy
CREATE INDEX IF NOT EXISTS idx_org_members_user ON public.organization_members(user_id);
CREATE INDEX IF NOT EXISTS idx_org_members_org ON public.organization_members(organization_id);
CREATE INDEX IF NOT EXISTS idx_biometric_user ON public.biometric_credentials(user_id);
CREATE INDEX IF NOT EXISTS idx_biometric_credential_id ON public.biometric_credentials(credential_id);

-- Trigger dla updated_at na organizations
CREATE TRIGGER update_organizations_updated_at
BEFORE UPDATE ON public.organizations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
-- ============================================
-- Migration: 20251207105202_02089cee-a466-4633-8357-f010f4ce35e7.sql
-- ============================================

-- ============================================
-- FIX PACK SECURITY Δ1 - Kompleksowe naprawy RLS
-- ============================================

-- 1. Funkcje pomocnicze SECURITY DEFINER (unikamy rekurencji)
-- ============================================

-- Funkcja sprawdzająca członkostwo w organizacji (bez rekurencji)
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

-- Funkcja sprawdzająca czy użytkownik jest adminem/ownerem organizacji
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

-- Funkcja zwracająca ID organizacji użytkownika
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

-- 2. Napraw polityki RLS dla organization_members (usuń rekurencję)
-- ============================================

-- Usuń stare polityki powodujące rekurencję
DROP POLICY IF EXISTS "Members can view organization members" ON public.organization_members;
DROP POLICY IF EXISTS "Org admins can manage members" ON public.organization_members;

-- Nowa polityka SELECT - użytkownik widzi członków swoich organizacji
CREATE POLICY "Members can view their org members"
ON public.organization_members
FOR SELECT
USING (
  user_id = auth.uid() OR 
  public.is_org_member(auth.uid(), organization_id)
);

-- INSERT - admini/ownerzy mogą dodawać członków
CREATE POLICY "Org admins can add members"
ON public.organization_members
FOR INSERT
WITH CHECK (
  public.is_org_admin(auth.uid(), organization_id)
);

-- UPDATE - admini/ownerzy mogą aktualizować role
CREATE POLICY "Org admins can update members"
ON public.organization_members
FOR UPDATE
USING (
  public.is_org_admin(auth.uid(), organization_id)
);

-- DELETE - admini/ownerzy mogą usuwać członków
CREATE POLICY "Org admins can remove members"
ON public.organization_members
FOR DELETE
USING (
  public.is_org_admin(auth.uid(), organization_id)
);

-- 3. Napraw polityki RLS dla organizations
-- ============================================

-- Dodaj brakujące polityki INSERT i DELETE
DROP POLICY IF EXISTS "Organization owners can manage" ON public.organizations;
DROP POLICY IF EXISTS "Members can view their organizations" ON public.organizations;

CREATE POLICY "Users can create organizations"
ON public.organizations
FOR INSERT
WITH CHECK (auth.uid() = owner_user_id);

CREATE POLICY "Organization owners can update"
ON public.organizations
FOR UPDATE
USING (auth.uid() = owner_user_id);

CREATE POLICY "Organization owners can delete"
ON public.organizations
FOR DELETE
USING (auth.uid() = owner_user_id);

CREATE POLICY "Members can view their orgs"
ON public.organizations
FOR SELECT
USING (
  auth.uid() = owner_user_id OR
  public.is_org_member(auth.uid(), id)
);

-- 4. Napraw user_consents - usuń publiczny dostęp do PII
-- ============================================

DROP POLICY IF EXISTS "Anyone can insert consents" ON public.user_consents;
DROP POLICY IF EXISTS "Users can view their own consents" ON public.user_consents;
DROP POLICY IF EXISTS "Users can update their own consents" ON public.user_consents;

-- Tylko uwierzytelnieni użytkownicy mogą dodawać zgody (z własnym user_id)
CREATE POLICY "Authenticated users can insert consents"
ON public.user_consents
FOR INSERT
WITH CHECK (
  auth.uid() IS NOT NULL AND 
  (user_id IS NULL OR user_id = auth.uid())
);

-- Użytkownik widzi tylko swoje zgody
CREATE POLICY "Users view own consents"
ON public.user_consents
FOR SELECT
USING (user_id = auth.uid());

-- Użytkownik może aktualizować swoje zgody
CREATE POLICY "Users update own consents"
ON public.user_consents
FOR UPDATE
USING (user_id = auth.uid());

-- Użytkownik może usunąć swoje zgody (GDPR prawo do zapomnienia)
CREATE POLICY "Users delete own consents"
ON public.user_consents
FOR DELETE
USING (user_id = auth.uid());

-- 5. Dodaj brakującą politykę UPDATE dla ai_chat_history
-- ============================================

CREATE POLICY "Users can update their own chat messages"
ON public.ai_chat_history
FOR UPDATE
USING (auth.uid() = user_id);

-- 6. Napraw subcontractor_services - tylko właściciel może modyfikować
-- ============================================

-- Najpierw sprawdź właściciela przez subcontractors table
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

-- Dodaj polityki modyfikacji
CREATE POLICY "Subcontractor owners can insert services"
ON public.subcontractor_services
FOR INSERT
WITH CHECK (
  public.is_subcontractor_owner(auth.uid(), subcontractor_id)
);

CREATE POLICY "Subcontractor owners can update services"
ON public.subcontractor_services
FOR UPDATE
USING (
  public.is_subcontractor_owner(auth.uid(), subcontractor_id)
);

CREATE POLICY "Subcontractor owners can delete services"
ON public.subcontractor_services
FOR DELETE
USING (
  public.is_subcontractor_owner(auth.uid(), subcontractor_id)
);

-- 7. Napraw subcontractor_reviews - autor może edytować/usuwać
-- ============================================

CREATE POLICY "Review authors can update their reviews"
ON public.subcontractor_reviews
FOR UPDATE
USING (auth.uid() = reviewer_user_id);

CREATE POLICY "Review authors can delete their reviews"
ON public.subcontractor_reviews
FOR DELETE
USING (auth.uid() = reviewer_user_id);

-- 8. Dodaj brakującą politykę DELETE dla offer_approvals
-- ============================================

CREATE POLICY "Users can delete their own offer approvals"
ON public.offer_approvals
FOR DELETE
USING (auth.uid() = user_id);

-- 9. Dodaj politykę DELETE dla offer_sends
-- ============================================

CREATE POLICY "Users can delete their own offer sends"
ON public.offer_sends
FOR DELETE
USING (auth.uid() = user_id);

-- 10. Zabezpiecz team_locations - dodaj UPDATE/DELETE
-- ============================================

CREATE POLICY "Users can update team locations"
ON public.team_locations
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete team locations"
ON public.team_locations
FOR DELETE
USING (auth.uid() = user_id);
-- ============================================
-- Migration: 20251207110925_fd116312-a252-4680-870a-632e137bf7ef.sql
-- ============================================

-- ============================================
-- FIX PACK SECURITY Δ1 - NAPRAWCZA MIGRACJA RLS
-- Zmiana wszystkich polityk na RESTRICTIVE
-- ============================================

-- 1. PROFILES - Usunięcie istniejącej permissive policy i utworzenie restrictive
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

-- 2. CLIENTS
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

-- 3. PROJECTS
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

-- 4. QUOTES
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

-- 5. API_KEYS
DROP POLICY IF EXISTS "Users can manage their API keys" ON public.api_keys;

CREATE POLICY "Users can manage their API keys" 
ON public.api_keys FOR ALL 
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- 6. TEAM_MEMBERS
DROP POLICY IF EXISTS "Users can manage their team members" ON public.team_members;

CREATE POLICY "Users can manage their team members" 
ON public.team_members FOR ALL 
TO authenticated
USING (auth.uid() = owner_user_id)
WITH CHECK (auth.uid() = owner_user_id);

-- 7. BIOMETRIC_CREDENTIALS
DROP POLICY IF EXISTS "Users can manage their biometric credentials" ON public.biometric_credentials;

CREATE POLICY "Users can manage their biometric credentials" 
ON public.biometric_credentials FOR ALL 
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- 8. FINANCIAL_REPORTS
DROP POLICY IF EXISTS "Users can manage their financial reports" ON public.financial_reports;

CREATE POLICY "Users can manage their financial reports" 
ON public.financial_reports FOR ALL 
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- 9. PURCHASE_COSTS
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

-- 10. AI_CHAT_HISTORY
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

-- 11. COMPANY_DOCUMENTS
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

-- 12. USER_SUBSCRIPTIONS
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

-- 13. NOTIFICATIONS
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

-- 14. CALENDAR_EVENTS
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

-- 15. WORK_TASKS
DROP POLICY IF EXISTS "Users can manage their work tasks" ON public.work_tasks;

CREATE POLICY "Users can manage their work tasks" 
ON public.work_tasks FOR ALL 
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- 16. TEAM_LOCATIONS
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

-- 17. OFFER_SENDS
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

-- 18. PDF_DATA
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

-- 19. ITEM_TEMPLATES
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

-- 20. QUOTE_VERSIONS
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

-- 21. ONBOARDING_PROGRESS
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

-- 22. PUSH_TOKENS
DROP POLICY IF EXISTS "Users can manage their own push tokens" ON public.push_tokens;

CREATE POLICY "Users can manage their own push tokens" 
ON public.push_tokens FOR ALL 
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- 23. USER_CONSENTS
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

-- 24. USER_ROLES
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

-- 25. PROJECT_PHOTOS
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

-- 26. OFFER_APPROVALS - specjalne traktowanie dla publicznych tokenów
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

-- Polityki dla anonimowych użytkowników z tokenem (do zatwierdzania ofert)
CREATE POLICY "Public can view pending offers by valid token" 
ON public.offer_approvals FOR SELECT 
TO anon
USING ((status = 'pending') AND (public_token IS NOT NULL) AND public.validate_offer_token(public_token));

CREATE POLICY "Public can update pending offers with valid token" 
ON public.offer_approvals FOR UPDATE 
TO anon
USING ((status = 'pending') AND (public_token IS NOT NULL) AND public.validate_offer_token(public_token))
WITH CHECK ((status = ANY (ARRAY['approved', 'rejected'])) AND (public_token IS NOT NULL));

-- 27. ORGANIZATIONS
DROP POLICY IF EXISTS "Members can view their orgs" ON public.organizations;
DROP POLICY IF EXISTS "Users can create organizations" ON public.organizations;
DROP POLICY IF EXISTS "Organization owners can update" ON public.organizations;
DROP POLICY IF EXISTS "Organization owners can delete" ON public.organizations;

CREATE POLICY "Members can view their orgs" 
ON public.organizations FOR SELECT 
TO authenticated
USING ((auth.uid() = owner_user_id) OR public.is_org_member(auth.uid(), id));

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

-- 28. ORGANIZATION_MEMBERS
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

-- 29. API_RATE_LIMITS - tylko service role
DROP POLICY IF EXISTS "Service role can manage rate limits" ON public.api_rate_limits;

CREATE POLICY "Service role can manage rate limits" 
ON public.api_rate_limits FOR ALL 
TO service_role
USING (true)
WITH CHECK (true);
-- ============================================
-- Migration: 20251207123630_7642361c-8055-430b-91c9-3c513940c57a.sql
-- ============================================

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
-- ============================================
-- Migration: 20251207123651_686d6de5-61b2-438d-9b7c-d1089353d4a5.sql
-- ============================================

-- Make project-photos bucket private
UPDATE storage.buckets SET public = false WHERE id = 'project-photos';

-- Add RLS policies for project-photos bucket
CREATE POLICY "Users can view their own project photos"
ON storage.objects FOR SELECT
USING (bucket_id = 'project-photos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can upload their own project photos"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'project-photos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own project photos"
ON storage.objects FOR DELETE
USING (bucket_id = 'project-photos' AND auth.uid()::text = (storage.foldername(name))[1]);
-- ============================================
-- Migration: 20251209073921_add_performance_indexes.sql
-- ============================================

-- ============================================
-- Performance Optimization: Add Missing Indexes
-- Issue: B5 - Missing database indexes
--
-- This migration adds performance indexes based on real query analysis
-- from the application codebase. All queries were analyzed from:
-- - src/hooks/useNotifications.ts
-- - src/hooks/useOfferApprovals.ts
-- - src/hooks/useExpirationMonitor.ts
-- - src/hooks/useProjects.ts
-- - supabase/functions/send-expiring-offer-reminders/index.ts
--
-- Impact: Improves query performance on high-traffic tables
-- Risk: Very low - only adding indexes, no schema or data changes
-- ============================================

-- ===========================================
-- NOTIFICATIONS TABLE
-- ===========================================
-- Query pattern: .eq('user_id', X).order('created_at', DESC).limit(50)
-- Also supports: .eq('user_id', X).eq('is_read', false)
-- Source: src/hooks/useNotifications.ts:22-26, 68-69
--
-- This composite index covers:
-- 1. Filtering by user_id (RLS + explicit filter)
-- 2. Filtering by is_read status (for unread notifications)
-- 3. Sorting by created_at DESC (most recent first)
CREATE INDEX IF NOT EXISTS idx_notifications_user_read_created
ON public.notifications(user_id, is_read, created_at DESC);

COMMENT ON INDEX idx_notifications_user_read_created IS
'Optimizes notification queries filtered by user and read status, sorted by creation date';

-- ===========================================
-- OFFER_APPROVALS TABLE
-- ===========================================

-- Index 1: Main query for fetching offer approvals by project
-- Query pattern: .eq('project_id', X).order('created_at', DESC)
-- Source: src/hooks/useOfferApprovals.ts:27-31
CREATE INDEX IF NOT EXISTS idx_offer_approvals_project_created
ON public.offer_approvals(project_id, created_at DESC);

COMMENT ON INDEX idx_offer_approvals_project_created IS
'Optimizes queries fetching offer approvals for a specific project, sorted by creation date';

-- Index 2: Expiration monitor queries
-- Query pattern: .eq('user_id', X).eq('status', 'pending').lte('expires_at', Y).gte('expires_at', Z)
-- Source: src/hooks/useExpirationMonitor.ts:41-45
--
-- This composite index covers:
-- 1. Filtering by user_id (owner of the offer)
-- 2. Filtering by status (pending offers only)
-- 3. Range filtering by expires_at (expiring soon)
CREATE INDEX IF NOT EXISTS idx_offer_approvals_user_status_expires
ON public.offer_approvals(user_id, status, expires_at);

COMMENT ON INDEX idx_offer_approvals_user_status_expires IS
'Optimizes expiration monitor queries filtering by user, pending status, and expiration date range';

-- Index 3: Edge function queries for expiring offers
-- Query pattern: .eq('status', 'pending').gte('expires_at', X).lte('expires_at', Y)
-- Source: supabase/functions/send-expiring-offer-reminders/index.ts:70-72
--
-- This index supports queries without user_id filter (service_role queries)
CREATE INDEX IF NOT EXISTS idx_offer_approvals_status_expires
ON public.offer_approvals(status, expires_at);

COMMENT ON INDEX idx_offer_approvals_status_expires IS
'Optimizes edge function queries for pending offers filtered by expiration date range';

-- ===========================================
-- PROJECTS TABLE
-- ===========================================
-- Query pattern: .order('created_at', DESC) with RLS filtering by user_id
-- Source: src/hooks/useProjects.ts:29-32
--
-- Note: idx_projects_user_id already exists from migration 20251205160746
-- This composite index provides additional optimization for sorted queries
-- combining user_id (from RLS) with created_at DESC ordering
CREATE INDEX IF NOT EXISTS idx_projects_user_created
ON public.projects(user_id, created_at DESC);

COMMENT ON INDEX idx_projects_user_created IS
'Optimizes queries fetching recent projects for a user, sorted by creation date';

-- ============================================
-- END OF MIGRATION
-- ============================================

-- ============================================
-- Migration: 20251209152221_add_pdf_url_to_offer_sends.sql
-- ============================================

-- ============================================
-- PHASE 5C: Add PDF URL fields to offer_sends table
-- ============================================
-- Migration: Add pdf_url and pdf_generated_at columns
-- Purpose: Store PDF offer links in offer send history
-- Author: Claude Code (Phase 5C)
-- Date: 2025-12-09
-- ============================================

-- Add pdf_url column (nullable, backward compatible)
ALTER TABLE public.offer_sends
  ADD COLUMN IF NOT EXISTS pdf_url text;

-- Add pdf_generated_at column (nullable, backward compatible)
ALTER TABLE public.offer_sends
  ADD COLUMN IF NOT EXISTS pdf_generated_at timestamptz;

-- Add comment for documentation
COMMENT ON COLUMN public.offer_sends.pdf_url IS 'Public URL of generated PDF offer stored in Supabase Storage (company-documents bucket)';
COMMENT ON COLUMN public.offer_sends.pdf_generated_at IS 'Timestamp when PDF was generated and uploaded to storage';

-- No indexes needed yet (pdf_url is not used for filtering/sorting in current phase)
-- No RLS policy changes needed (existing policies cover new columns)

-- ============================================
-- Migration: 20251209154608_add_tracking_status_to_offer_sends.sql
-- ============================================

-- ============================================
-- PHASE 6A: Add tracking_status to offer_sends table
-- ============================================
-- Migration: Add tracking_status column for business-level offer tracking
-- Purpose: Track business status of offers (sent/opened/pdf_viewed/accepted/rejected)
--          separately from technical email delivery status (pending/sent/failed)
-- Author: Claude Code (Phase 6A)
-- Date: 2025-12-09
-- ============================================

-- Add tracking_status column (nullable, backward compatible)
-- NULL values will be treated as 'sent' in the UI for existing records
ALTER TABLE public.offer_sends
  ADD COLUMN IF NOT EXISTS tracking_status text;

-- Add comment for documentation
COMMENT ON COLUMN public.offer_sends.tracking_status IS
  'Business tracking status of the offer: sent (default), opened, pdf_viewed, accepted, rejected. NULL = treat as sent.';

-- No default value to maintain backward compatibility
-- Existing records will have NULL, which UI treats as 'sent'
-- New records will explicitly set tracking_status

-- No indexes needed yet (tracking_status not used for filtering/sorting in Phase 6A)
-- No RLS policy changes needed (existing policies cover new column)

-- ============================================
-- Migration: 20251209154800_harden_tracking_status_not_null.sql
-- ============================================

-- ============================================
-- PHASE 7B: Harden tracking_status to NOT NULL
-- ============================================
-- Migration: Make tracking_status NOT NULL with default 'sent'
-- Purpose: Ensure all offer_sends records have a valid tracking_status
--          Prevents NULL values that could break follow-up logic and stats
-- Author: Claude Code (Phase 7B)
-- Date: 2025-12-09
-- ============================================

-- Step 1: Backfill NULL values to 'sent' (safe default for existing records)
-- This ensures backward compatibility - all old records treated as sent
UPDATE public.offer_sends
  SET tracking_status = 'sent'
  WHERE tracking_status IS NULL;

-- Step 2: Add NOT NULL constraint
-- Now safe because all NULL values have been backfilled
ALTER TABLE public.offer_sends
  ALTER COLUMN tracking_status SET NOT NULL;

-- Step 3: Add DEFAULT 'sent' for new inserts
-- Ensures new records always have a value even if not explicitly provided
ALTER TABLE public.offer_sends
  ALTER COLUMN tracking_status SET DEFAULT 'sent';

-- Update comment to reflect NOT NULL constraint
COMMENT ON COLUMN public.offer_sends.tracking_status IS
  'Business tracking status of the offer: sent (default), opened, pdf_viewed, accepted, rejected. NOT NULL with default ''sent''.';

-- No indexes needed (tracking_status not used for filtering/sorting yet)
-- No RLS policy changes needed (existing policies cover the column)

-- ============================================
-- Migration: 20251211212307_ff99280e-5828-4d0a-90eb-e69c98f1eeb6.sql
-- ============================================

-- ============================================
-- Performance Optimization: Additional Composite Indexes
-- Context: SUPER-SPRINT C - TOP 3 Database Optimization
--
-- This migration adds composite indexes based on query analysis from:
-- - SUPER-SPRINT A & B pagination implementations
-- - Analytics and Dashboard optimized hooks
-- - Common filtering patterns in the application
--
-- These indexes complement the existing indexes from 20251209073921
-- and specifically target pagination, search, and filter operations.
--
-- Impact: Improves query performance for paginated lists and searches
-- Risk: Very low - only adding indexes, no schema or data changes
-- ============================================

-- ===========================================
-- PROJECTS TABLE - Additional Indexes
-- ===========================================

-- Index 1: Status filtering for projects
-- Query pattern: .eq('user_id', X).eq('status', Y).order('created_at', DESC)
-- Source: src/hooks/useProjects.ts - useProjectsPaginated with status filter
-- Use case: Dashboard status breakdown, filtered project lists
--
-- This index optimizes:
-- 1. Filtering by user_id (RLS)
-- 2. Filtering by status ('Nowy', 'Wycena w toku', etc.)
-- 3. Sorting by created_at DESC
CREATE INDEX IF NOT EXISTS idx_projects_user_status_created
ON public.projects(user_id, status, created_at DESC);

COMMENT ON INDEX idx_projects_user_status_created IS
'Optimizes project queries filtered by user and status, sorted by creation date. Used in pagination and dashboard stats.';

-- ===========================================
-- CLIENTS TABLE
-- ===========================================

-- Index 1: Client search optimization
-- Query pattern: .eq('user_id', X).ilike('name', '%search%').order('created_at', DESC)
-- Source: src/hooks/useClients.ts - useClientsPaginated with search
-- Use case: Client search in paginated lists
--
-- This index optimizes:
-- 1. Filtering by user_id (RLS)
-- 2. Sorting by created_at DESC (for pagination)
-- 3. Supports pattern matching on name (though ILIKE still needs full scan on name)
CREATE INDEX IF NOT EXISTS idx_clients_user_created
ON public.clients(user_id, created_at DESC);

COMMENT ON INDEX idx_clients_user_created IS
'Optimizes client queries by user, sorted by creation date. Base index for paginated client lists.';

-- Index 2: Client name pattern search (trigram index for ILIKE optimization)
-- Query pattern: .ilike('name', '%search%')
-- Source: src/hooks/useClients.ts - search functionality
--
-- This requires pg_trgm extension for efficient LIKE/ILIKE queries
-- Note: Only create if pg_trgm extension is enabled
CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE INDEX IF NOT EXISTS idx_clients_name_trgm
ON public.clients USING gin(name gin_trgm_ops);

COMMENT ON INDEX idx_clients_name_trgm IS
'Trigram index for efficient client name search with ILIKE. Significantly speeds up search queries.';

-- ===========================================
-- CALENDAR_EVENTS TABLE
-- ===========================================

-- Index 1: Event date range queries
-- Query pattern: .eq('user_id', X).gte('event_date', Y).lte('event_date', Z)
-- Source: src/hooks/useAnalyticsStats.ts - weekly events aggregation
-- Use case: Calendar view, analytics, date range filtering
--
-- This index optimizes:
-- 1. Filtering by user_id (RLS)
-- 2. Range filtering by event_date
-- 3. Sorting by event_date
CREATE INDEX IF NOT EXISTS idx_calendar_events_user_date
ON public.calendar_events(user_id, event_date);

COMMENT ON INDEX idx_calendar_events_user_date IS
'Optimizes calendar queries filtered by user and date range. Used in analytics and calendar views.';

-- Index 2: Event type and status filtering
-- Query pattern: .eq('user_id', X).eq('event_type', Y).eq('status', Z)
-- Source: src/hooks/useAnalyticsStats.ts - event type aggregations
-- Use case: Analytics event breakdown, filtered event lists
CREATE INDEX IF NOT EXISTS idx_calendar_events_user_type_status
ON public.calendar_events(user_id, event_type, status);

COMMENT ON INDEX idx_calendar_events_user_type_status IS
'Optimizes event queries filtered by user, type, and status. Used in analytics aggregations.';

-- ===========================================
-- QUOTES TABLE
-- ===========================================

-- Index 1: Quotes by project (most common query)
-- Query pattern: .eq('project_id', X).order('created_at', DESC)
-- Source: Various hooks fetching quotes for a project
-- Use case: Viewing all quotes for a specific project
CREATE INDEX IF NOT EXISTS idx_quotes_project_created
ON public.quotes(project_id, created_at DESC);

COMMENT ON INDEX idx_quotes_project_created IS
'Optimizes quotes queries by project, sorted by creation date. Primary index for project quote lists.';

-- Index 2: User quotes for analytics
-- Query pattern: .eq('user_id', X).order('created_at', DESC)
-- Source: src/hooks/useAnalyticsStats.ts - quote value aggregations
-- Use case: Analytics total value calculations
CREATE INDEX IF NOT EXISTS idx_quotes_user_created
ON public.quotes(user_id, created_at DESC);

COMMENT ON INDEX idx_quotes_user_created IS
'Optimizes quotes queries by user, sorted by creation date. Used in analytics and user quote lists.';

-- ===========================================
-- ITEM_TEMPLATES TABLE
-- ===========================================

-- Index 1: Template category filtering
-- Query pattern: .eq('user_id', X).eq('category', Y).order('created_at', DESC)
-- Source: src/hooks/useItemTemplates.ts - useItemTemplatesPaginated with category filter
-- Use case: Filtering templates by Materiał/Robocizna
CREATE INDEX IF NOT EXISTS idx_item_templates_user_category_created
ON public.item_templates(user_id, category, created_at DESC);

COMMENT ON INDEX idx_item_templates_user_category_created IS
'Optimizes item template queries filtered by user and category, sorted by creation date. Used in paginated template lists.';

-- Index 2: Template name search (trigram index)
-- Query pattern: .ilike('name', '%search%')
-- Source: src/hooks/useItemTemplates.ts - search functionality
CREATE INDEX IF NOT EXISTS idx_item_templates_name_trgm
ON public.item_templates USING gin(name gin_trgm_ops);

COMMENT ON INDEX idx_item_templates_name_trgm IS
'Trigram index for efficient item template name search with ILIKE. Speeds up template search.';

-- ============================================
-- PERFORMANCE ANALYSIS
-- ============================================
--
-- Expected Impact:
-- 1. Projects pagination: 40-60% faster queries (especially with status filter)
-- 2. Client search: 70-80% faster ILIKE queries (with trigram index)
-- 3. Calendar queries: 50-70% faster date range queries
-- 4. Quote aggregations: 30-50% faster (analytics)
-- 5. Item template search: 60-80% faster ILIKE queries
--
-- Storage Impact:
-- - Each B-tree index: ~10-20% of table size
-- - Trigram indexes: ~30-50% of column size
-- - Estimated total: <100 MB for typical dataset (1000 projects, 500 clients)
--
-- Maintenance:
-- - Indexes automatically maintained by PostgreSQL
-- - VACUUM and ANALYZE run automatically on Supabase
-- - No manual maintenance required
--
-- Monitoring:
-- - Use pg_stat_user_indexes to monitor index usage
-- - Use EXPLAIN ANALYZE to verify query plans use indexes
-- - Drop unused indexes after 30 days if pg_stat shows 0 usage
--
-- ============================================
-- END OF MIGRATION
-- ============================================

-- ============================================
-- Migration: 20251217000000_add_stripe_integration.sql
-- ============================================

-- Stripe Integration Migration
-- Adds subscription_events table for Stripe webhook logging
-- Updates user_subscriptions to support 'pro' plan

-- 1. Update user_subscriptions plan_id constraint to include 'pro'
ALTER TABLE public.user_subscriptions
DROP CONSTRAINT IF EXISTS user_subscriptions_plan_id_check;

ALTER TABLE public.user_subscriptions
ADD CONSTRAINT user_subscriptions_plan_id_check
CHECK (plan_id IN ('free', 'pro', 'starter', 'business', 'enterprise'));

-- 2. Add cancel_at_period_end column for graceful cancellation
ALTER TABLE public.user_subscriptions
ADD COLUMN IF NOT EXISTS cancel_at_period_end BOOLEAN DEFAULT false;

-- 3. Add trial_end column
ALTER TABLE public.user_subscriptions
ADD COLUMN IF NOT EXISTS trial_end TIMESTAMP WITH TIME ZONE;

-- 4. Create subscription_events table for Stripe webhook logging
CREATE TABLE IF NOT EXISTS public.subscription_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  subscription_id TEXT NOT NULL, -- stripe_subscription_id
  event_type TEXT NOT NULL, -- Stripe event type (customer.subscription.created, etc.)
  event_data JSONB NOT NULL, -- Full Stripe event payload
  processed BOOLEAN DEFAULT false,
  processed_at TIMESTAMP WITH TIME ZONE,
  error TEXT, -- Error message if processing failed
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add index for faster queries
CREATE INDEX IF NOT EXISTS idx_subscription_events_user_id
ON public.subscription_events(user_id);

CREATE INDEX IF NOT EXISTS idx_subscription_events_subscription_id
ON public.subscription_events(subscription_id);

CREATE INDEX IF NOT EXISTS idx_subscription_events_event_type
ON public.subscription_events(event_type);

CREATE INDEX IF NOT EXISTS idx_subscription_events_processed
ON public.subscription_events(processed, created_at);

-- Enable RLS
ALTER TABLE public.subscription_events ENABLE ROW LEVEL SECURITY;

-- RLS policies for subscription_events
CREATE POLICY "Users can view their own subscription events"
ON public.subscription_events FOR SELECT
USING (auth.uid() = user_id);

-- Service role can insert/update events (for webhook processing)
CREATE POLICY "Service role can manage subscription events"
ON public.subscription_events FOR ALL
USING (auth.jwt() ->> 'role' = 'service_role');

-- 5. Create function to sync subscription from Stripe webhook
CREATE OR REPLACE FUNCTION public.sync_subscription_from_stripe(
  p_user_id UUID,
  p_stripe_customer_id TEXT,
  p_stripe_subscription_id TEXT,
  p_plan_id TEXT,
  p_status TEXT,
  p_current_period_start TIMESTAMP WITH TIME ZONE,
  p_current_period_end TIMESTAMP WITH TIME ZONE,
  p_cancel_at_period_end BOOLEAN,
  p_trial_end TIMESTAMP WITH TIME ZONE
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Upsert subscription
  INSERT INTO public.user_subscriptions (
    user_id,
    stripe_customer_id,
    stripe_subscription_id,
    plan_id,
    status,
    current_period_start,
    current_period_end,
    cancel_at_period_end,
    trial_end,
    updated_at
  ) VALUES (
    p_user_id,
    p_stripe_customer_id,
    p_stripe_subscription_id,
    p_plan_id,
    p_status,
    p_current_period_start,
    p_current_period_end,
    p_cancel_at_period_end,
    p_trial_end,
    now()
  )
  ON CONFLICT (user_id) DO UPDATE SET
    stripe_customer_id = EXCLUDED.stripe_customer_id,
    stripe_subscription_id = EXCLUDED.stripe_subscription_id,
    plan_id = EXCLUDED.plan_id,
    status = EXCLUDED.status,
    current_period_start = EXCLUDED.current_period_start,
    current_period_end = EXCLUDED.current_period_end,
    cancel_at_period_end = EXCLUDED.cancel_at_period_end,
    trial_end = EXCLUDED.trial_end,
    updated_at = now();
END;
$$;

-- Grant execute permission to service role
GRANT EXECUTE ON FUNCTION public.sync_subscription_from_stripe TO service_role;

-- Add comment for documentation
COMMENT ON TABLE public.subscription_events IS 'Logs all Stripe webhook events for subscriptions';
COMMENT ON FUNCTION public.sync_subscription_from_stripe IS 'Syncs user subscription from Stripe webhook data';

-- ============================================
-- KROK KOŃCOWY: Weryfikacja
-- ============================================

-- Sprawdź ile tabel zostało utworzonych
DO $$
DECLARE
  table_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO table_count
  FROM information_schema.tables
  WHERE table_schema = 'public'
  AND table_type = 'BASE TABLE';
  
  RAISE NOTICE '';
  RAISE NOTICE '╔════════════════════════════════════════════════════════════╗';
  RAISE NOTICE '║  MIGRACJA ZAKOŃCZONA!                                      ║';
  RAISE NOTICE '╚════════════════════════════════════════════════════════════╝';
  RAISE NOTICE '';
  RAISE NOTICE 'Utworzono tabel: %', table_count;
  RAISE NOTICE '';
  
  IF table_count >= 33 THEN
    RAISE NOTICE '✅ SUKCES! Wszystkie tabele zostały utworzone!';
  ELSE
    RAISE NOTICE '⚠️  Utworzono % tabel (oczekiwano 33)', table_count;
  END IF;
  
  RAISE NOTICE '';
  RAISE NOTICE 'Uruchom teraz skrypt weryfikacyjny:';
  RAISE NOTICE 'supabase/verify_database.sql';
  RAISE NOTICE '';
END $$;

