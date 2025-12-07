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