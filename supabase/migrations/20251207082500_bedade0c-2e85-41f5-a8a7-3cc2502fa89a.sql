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