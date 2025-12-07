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