-- ==============================================================
-- RLS Policy Template — Majster.AI Reference
-- ==============================================================
-- UWAGA: Ten plik jest REFERENCJĄ, nie migruje automatycznie.
--        Kopiuj fragmenty do nowych plików w supabase/migrations/.
--        Patrz: docs/SECURITY_BASELINE.md Sekcja 2.
--
-- Konwencja nazewnictwa polityk: <tabela>_<akcja>_<zakres>
-- Przykłady: clients_select_own, projects_insert_own
-- ==============================================================


-- ==============================================================
-- WZORZEC A: Tabela prywatna użytkownika (user_id isolation)
-- Stosuj dla: klientów, ofert, projektów, wycen, dokumentów
-- ==============================================================

CREATE TABLE public.<tabela> (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  -- ... kolumny specyficzne dla tabeli ...
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Krok obowiązkowy: włącz RLS
ALTER TABLE public.<tabela> ENABLE ROW LEVEL SECURITY;

-- SELECT: użytkownik widzi tylko swoje wiersze
CREATE POLICY "<tabela>_select_own"
  ON public.<tabela>
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- INSERT: użytkownik może tworzyć tylko pod własnym user_id
CREATE POLICY "<tabela>_insert_own"
  ON public.<tabela>
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- UPDATE: użytkownik może edytować tylko swoje wiersze
CREATE POLICY "<tabela>_update_own"
  ON public.<tabela>
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- DELETE: użytkownik może usuwać tylko swoje wiersze
CREATE POLICY "<tabela>_delete_own"
  ON public.<tabela>
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Indeks wydajnościowy (wymagany przy RLS scan)
CREATE INDEX idx_<tabela>_user_id ON public.<tabela>(user_id);


-- ==============================================================
-- WZORZEC B: Tabela organizacyjna (organization_id isolation)
-- Stosuj dla: ustawień org, motywów, logów, konfiguracji admina
-- Wymaga funkcji: public.is_org_member() i public.current_user_is_org_admin()
-- ==============================================================

CREATE TABLE public.<tabela_org> (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  created_by      UUID NOT NULL REFERENCES auth.users(id),
  updated_by      UUID REFERENCES auth.users(id),
  -- ... kolumny specyficzne ...
  created_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.<tabela_org> ENABLE ROW LEVEL SECURITY;

-- SELECT: wszyscy członkowie org mogą czytać
CREATE POLICY "<tabela_org>_select_org_member"
  ON public.<tabela_org>
  FOR SELECT
  TO authenticated
  USING (public.is_org_member(auth.uid(), organization_id));

-- INSERT: tylko admini/ownerzy org mogą tworzyć
CREATE POLICY "<tabela_org>_insert_org_admin"
  ON public.<tabela_org>
  FOR INSERT
  TO authenticated
  WITH CHECK (
    public.current_user_is_org_admin(organization_id)
    AND created_by = auth.uid()
  );

-- UPDATE: tylko admini/ownerzy org mogą edytować
CREATE POLICY "<tabela_org>_update_org_admin"
  ON public.<tabela_org>
  FOR UPDATE
  TO authenticated
  USING (public.current_user_is_org_admin(organization_id))
  WITH CHECK (updated_by = auth.uid());

-- DELETE: tylko admini/ownerzy org mogą usuwać
CREATE POLICY "<tabela_org>_delete_org_admin"
  ON public.<tabela_org>
  FOR DELETE
  TO authenticated
  USING (public.current_user_is_org_admin(organization_id));

CREATE INDEX idx_<tabela_org>_organization_id
  ON public.<tabela_org>(organization_id);


-- ==============================================================
-- WZORZEC C: Tabela publiczna z tokenem (token-based access)
-- Stosuj dla: publicznych linków akceptacji ofert, QR statusów
-- Wzorzec: token losowy (UUID/crypto), brak auth.uid() w USING
-- ==============================================================

-- Przykład: offer_approval_tokens
CREATE TABLE public.offer_approval_tokens (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  offer_id   UUID NOT NULL REFERENCES public.offers(id) ON DELETE CASCADE,
  token      UUID NOT NULL DEFAULT gen_random_uuid() UNIQUE,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  used_at    TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.offer_approval_tokens ENABLE ROW LEVEL SECURITY;

-- SELECT: publiczny dostęp tylko przez ważny token
-- Uwaga: anon role może czytać, ale tylko po walidacji tokenu
CREATE POLICY "offer_approval_tokens_select_by_token"
  ON public.offer_approval_tokens
  FOR SELECT
  TO anon, authenticated
  USING (
    token = current_setting('request.jwt.claims', true)::json->>'token'
    -- Alternatywa: walidacja w Edge Function (preferowane dla złożonej logiki)
  );

-- INSERT/UPDATE: tylko Edge Function z service_role
-- (Brak polityki dla anon/authenticated = brak dostępu)

CREATE INDEX idx_offer_approval_tokens_token
  ON public.offer_approval_tokens(token);
CREATE INDEX idx_offer_approval_tokens_offer_id
  ON public.offer_approval_tokens(offer_id);


-- ==============================================================
-- WZORZEC D: Tabela systemowa (service_role only)
-- Stosuj dla: logów systemowych, eventów Stripe, danych cron
-- ==============================================================

CREATE TABLE public.<tabela_system> (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  -- ... kolumny systemowe ...
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- RLS włączone — brak polityk dla authenticated/anon = brak dostępu frontendu
ALTER TABLE public.<tabela_system> ENABLE ROW LEVEL SECURITY;

-- Tylko service_role (Edge Functions) może pisać
CREATE POLICY "<tabela_system>_insert_service"
  ON public.<tabela_system>
  FOR INSERT
  TO service_role
  WITH CHECK (true);

-- Tylko service_role może czytać
CREATE POLICY "<tabela_system>_select_service"
  ON public.<tabela_system>
  FOR SELECT
  TO service_role
  USING (true);


-- ==============================================================
-- HELPER: Weryfikacja RLS po migracji
-- Uruchom ręcznie w Supabase SQL Editor lub lokalnie
-- ==============================================================

-- Sprawdź które tabele mają włączone RLS
SELECT
  schemaname,
  tablename,
  rowsecurity AS rls_enabled,
  CASE WHEN rowsecurity THEN '✅ OK' ELSE '❌ BRAK RLS' END AS status
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;

-- Sprawdź polityki dla konkretnej tabeli
SELECT
  policyname,
  cmd AS operation,
  roles,
  qual AS using_expression,
  with_check
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename = '<tabela>'
ORDER BY cmd;
