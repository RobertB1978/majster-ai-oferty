-- PR-05: Company Profile table for PDF issuer data
-- Osobna tabela dla danych wydawcy PDF (NIP, adres, konto bankowe, logo)
-- Oddzielona od tabeli profiles (auth/email settings) dla czystości warstwy danych.

CREATE TABLE public.company_profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  company_name TEXT NOT NULL DEFAULT '',
  nip TEXT DEFAULT NULL,
  address_line1 TEXT DEFAULT NULL,
  address_line2 TEXT DEFAULT NULL,
  postal_code TEXT DEFAULT NULL,
  city TEXT DEFAULT NULL,
  country TEXT NOT NULL DEFAULT 'PL',
  email TEXT DEFAULT NULL,
  phone TEXT DEFAULT NULL,
  website TEXT DEFAULT NULL,
  bank_account TEXT DEFAULT NULL,
  logo_url TEXT DEFAULT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- RLS: każdy user widzi TYLKO swoje dane (tenant isolation)
ALTER TABLE public.company_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "company_profiles_select_own"
ON public.company_profiles
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "company_profiles_insert_own"
ON public.company_profiles
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "company_profiles_update_own"
ON public.company_profiles
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "company_profiles_delete_own"
ON public.company_profiles
FOR DELETE
USING (auth.uid() = user_id);

-- Trigger: auto-aktualizacja updated_at
CREATE OR REPLACE FUNCTION public.update_company_profiles_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_company_profiles_updated_at
BEFORE UPDATE ON public.company_profiles
FOR EACH ROW
EXECUTE FUNCTION public.update_company_profiles_updated_at();

-- Trigger: auto-tworzenie rekordu company_profile przy rejestracji użytkownika
-- (razem z istniejącym handle_new_user dla tabeli profiles)
CREATE OR REPLACE FUNCTION public.handle_new_user_company_profile()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.company_profiles (user_id, company_name)
  VALUES (NEW.id, '')
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created_company_profile
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_user_company_profile();

-- Test RLS: weryfikacja polityk
-- Aby przetestować IDOR, wykonaj jako użytkownik A (w Supabase Studio / psql):
--   SELECT * FROM company_profiles; -- widzi tylko własny rekord
--   UPDATE company_profiles SET company_name = 'HACKED' WHERE user_id = '<user_B_id>'; -- 0 rows updated
-- Pełna procedura IDOR w docs/SECURITY_BASELINE.md Sekcja 3
