-- ============================================================
-- PR-L6: Retention Rules Foundation
-- ============================================================
-- Creates the retention_rules table that:
--   1. Documents what data domains exist and their retention periods
--   2. Records last cleanup run state (last_run_at, last_run_status)
--   3. Is readable only by admin users
--   4. Serves as the source of truth for cleanup-expired-data integration
--
-- Evidence base:
--   - api_keys 90d:         cleanup-expired-data/index.ts line 69
--   - offer_approvals 90d:  cleanup-expired-data/index.ts line 92
--   - push_tokens 180d:     cleanup-expired-data/index.ts line 116
--   - ai_chat_history 180d: cleanup-expired-data/index.ts line 141
--   - All other domains:    UNKNOWN / manual_review (no code evidence)
-- ============================================================

CREATE TABLE IF NOT EXISTS public.retention_rules (
  id                    uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  data_domain           text        NOT NULL,
  rule_name             text        NOT NULL,
  applies_to            text        NOT NULL UNIQUE,
  retention_period_days integer     NULL,
  deletion_strategy     text        NOT NULL,
  legal_basis_note      text        NULL,
  status                text        NOT NULL DEFAULT 'active',
  last_run_at           timestamptz NULL,
  last_run_status       text        NULL,
  created_at            timestamptz NOT NULL DEFAULT now(),
  updated_at            timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT retention_rules_status_check
    CHECK (status IN ('active', 'inactive', 'manual', 'planned')),

  CONSTRAINT retention_rules_deletion_strategy_check
    CHECK (deletion_strategy IN (
      'hard_delete', 'soft_delete', 'archive', 'manual_review', 'unknown'
    ))
);

-- Index for fast lookup by domain
CREATE INDEX IF NOT EXISTS retention_rules_data_domain_idx
  ON public.retention_rules (data_domain);

CREATE INDEX IF NOT EXISTS retention_rules_applies_to_idx
  ON public.retention_rules (applies_to);

-- ── updated_at trigger ────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.retention_rules_set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER retention_rules_updated_at
  BEFORE UPDATE ON public.retention_rules
  FOR EACH ROW EXECUTE FUNCTION public.retention_rules_set_updated_at();

-- ── Row Level Security ────────────────────────────────────────────────────────

ALTER TABLE public.retention_rules ENABLE ROW LEVEL SECURITY;

-- Admin: full read access
CREATE POLICY "retention_rules_select_admin"
  ON public.retention_rules
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
        AND role = 'admin'
    )
  );

-- Admin: can update rules (e.g. to change status or strategy)
CREATE POLICY "retention_rules_update_admin"
  ON public.retention_rules
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
        AND role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
        AND role = 'admin'
    )
  );

-- No INSERT/DELETE for regular users — seeded via migration only
-- service_role bypasses RLS (used by cleanup-expired-data edge function)

-- ── Seed — evidence-based rules only ─────────────────────────────────────────
-- Periods proven by code in supabase/functions/cleanup-expired-data/index.ts
-- UNKNOWN = no code evidence; marked as manual_review to be honest

INSERT INTO public.retention_rules
  (data_domain, rule_name, applies_to, retention_period_days, deletion_strategy, legal_basis_note, status)
VALUES
  -- EVIDENCED: 90 days — cleanup-expired-data/index.ts line 68-88
  (
    'system',
    'Nieużywane klucze API',
    'api_keys',
    90,
    'hard_delete',
    'Klucze nieaktywne od 90 dni, inactive=true. Dowód: cleanup-expired-data/index.ts:68',
    'active'
  ),
  -- EVIDENCED: 90 days — cleanup-expired-data/index.ts line 91-113
  (
    'offers',
    'Stare zatwierdzenia ofert',
    'offer_approvals',
    90,
    'hard_delete',
    'Zatwierdzone/odrzucone zatwierdzenia starsze niż 90 dni. Dowód: cleanup-expired-data/index.ts:91',
    'active'
  ),
  -- EVIDENCED: 180 days — cleanup-expired-data/index.ts line 116-138
  (
    'system',
    'Nieaktywne tokeny push',
    'push_tokens',
    180,
    'hard_delete',
    'Tokeny inactive=true starsze niż 180 dni. Dowód: cleanup-expired-data/index.ts:116',
    'active'
  ),
  -- EVIDENCED: 180 days — cleanup-expired-data/index.ts line 141-162
  (
    'ai',
    'Historia czatu AI',
    'ai_chat_history',
    180,
    'hard_delete',
    'Cała historia czatu starsze niż 180 dni. Dowód: cleanup-expired-data/index.ts:141',
    'active'
  ),
  -- UNKNOWN: no code evidence for retention period
  (
    'compliance',
    'Log audytowy compliance',
    'compliance_audit_log',
    NULL,
    'manual_review',
    'Append-only log — brak zdefiniowanej retencji w repo. Wymaga decyzji prawnej. UNKNOWN.',
    'manual'
  ),
  -- UNKNOWN: dsar_requests — no deletion logic found
  (
    'compliance',
    'Wnioski DSAR',
    'dsar_requests',
    NULL,
    'manual_review',
    'Brak automatycznej retencji w repo. Status closed/resolved — termin UNKNOWN. Wymaga decyzji prawnej.',
    'manual'
  ),
  -- UNKNOWN: terms_acceptances — no deletion logic found
  (
    'legal',
    'Akceptacje regulaminów',
    'terms_acceptances',
    NULL,
    'manual_review',
    'Dowód zgody — retencja prawdopodobnie = czas trwania relacji + 3 lata. Wymaga oceny prawnej. UNKNOWN.',
    'manual'
  ),
  -- UNKNOWN: user profiles / organizations
  (
    'users',
    'Profile użytkowników i organizacje',
    'user_profiles_organizations',
    NULL,
    'manual_review',
    'Dane konta — retencja po zamknięciu konta UNKNOWN. Powiązane z delete-user-account edge function.',
    'manual'
  ),
  -- UNKNOWN: client data (end-clients of contractors)
  (
    'clients',
    'Dane klientów (end-klienci)',
    'clients',
    NULL,
    'manual_review',
    'Dane osobowe klientów fachowców. Majster.AI jako Podmiot Przetwarzający. Retencja UNKNOWN — wymaga DPA z fachowcami.',
    'manual'
  ),
  -- UNKNOWN: offers/projects data
  (
    'offers',
    'Oferty i projekty',
    'offers_projects',
    NULL,
    'manual_review',
    'Dane biznesowe. Retencja po zakończeniu świadczenia usług UNKNOWN. Wymaga analizy przepisów podatkowych (5 lat?).',
    'manual'
  )
ON CONFLICT (applies_to) DO NOTHING;
