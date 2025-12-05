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