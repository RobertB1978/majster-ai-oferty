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