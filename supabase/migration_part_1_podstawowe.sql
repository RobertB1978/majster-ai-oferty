-- ============================================
-- CZĘŚĆ 1: Czyszczenie i podstawowe tabele
-- ============================================
-- Skopiuj i uruchom TĘ część najpierw

-- Usuń stare tabele
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

-- Włącz rozszerzenie
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Tabela: clients
CREATE TABLE IF NOT EXISTS public.clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  phone TEXT DEFAULT '',
  email TEXT DEFAULT '',
  address TEXT DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own clients" ON public.clients;
CREATE POLICY "Users can view their own clients" ON public.clients FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create their own clients" ON public.clients;
CREATE POLICY "Users can create their own clients" ON public.clients FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own clients" ON public.clients;
CREATE POLICY "Users can update their own clients" ON public.clients FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own clients" ON public.clients;
CREATE POLICY "Users can delete their own clients" ON public.clients FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_clients_user_id ON public.clients(user_id);

-- Tabela: projects
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

ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own projects" ON public.projects;
CREATE POLICY "Users can view their own projects" ON public.projects FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create their own projects" ON public.projects;
CREATE POLICY "Users can create their own projects" ON public.projects FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own projects" ON public.projects;
CREATE POLICY "Users can update their own projects" ON public.projects FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own projects" ON public.projects;
CREATE POLICY "Users can delete their own projects" ON public.projects FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_projects_user_id ON public.projects(user_id);
CREATE INDEX IF NOT EXISTS idx_projects_client_id ON public.projects(client_id);

-- Tabela: quotes
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

ALTER TABLE public.quotes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own quotes" ON public.quotes;
CREATE POLICY "Users can view their own quotes" ON public.quotes FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create their own quotes" ON public.quotes;
CREATE POLICY "Users can create their own quotes" ON public.quotes FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own quotes" ON public.quotes;
CREATE POLICY "Users can update their own quotes" ON public.quotes FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own quotes" ON public.quotes;
CREATE POLICY "Users can delete their own quotes" ON public.quotes FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_quotes_project_id ON public.quotes(project_id);

-- Tabela: pdf_data
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

ALTER TABLE public.pdf_data ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own pdf_data" ON public.pdf_data;
CREATE POLICY "Users can view their own pdf_data" ON public.pdf_data FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create their own pdf_data" ON public.pdf_data;
CREATE POLICY "Users can create their own pdf_data" ON public.pdf_data FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own pdf_data" ON public.pdf_data;
CREATE POLICY "Users can update their own pdf_data" ON public.pdf_data FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own pdf_data" ON public.pdf_data;
CREATE POLICY "Users can delete their own pdf_data" ON public.pdf_data FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_pdf_data_project_id ON public.pdf_data(project_id);

-- Komunikat
DO $$ BEGIN
  RAISE NOTICE '✅ CZĘŚĆ 1 ZAKOŃCZONA! Utworzono: clients, projects, quotes, pdf_data';
  RAISE NOTICE 'Teraz uruchom CZĘŚĆ 2';
END $$;
