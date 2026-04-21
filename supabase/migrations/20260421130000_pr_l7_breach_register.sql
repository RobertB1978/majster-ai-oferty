-- ============================================================
-- PR-L7: Breach Register Foundation
-- ============================================================
-- Creates data_breaches table for tracking personal-data
-- security incidents. Admin-only visibility via RLS.
-- 72h reporting deadline is stored as report_deadline_at,
-- defaulting to detected_at + 72 hours.
-- No UPDATE/DELETE for non-admins — breach records are
-- operationally immutable once created.
-- ============================================================

CREATE TABLE IF NOT EXISTS public.data_breaches (
  id                   uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  title                text        NOT NULL,
  description          text        NOT NULL,
  severity             text        NOT NULL,
  status               text        NOT NULL DEFAULT 'open',
  detected_at          timestamptz NOT NULL,
  report_deadline_at   timestamptz NOT NULL,
  reported_to_authority boolean    NULL,
  reported_at          timestamptz NULL,
  authority_name       text        NULL,
  impact_summary       text        NULL,
  containment_actions  text        NULL,
  created_by           uuid        NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  assigned_to          uuid        NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at           timestamptz NOT NULL DEFAULT now(),
  updated_at           timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT data_breaches_severity_check
    CHECK (severity IN ('low', 'medium', 'high', 'critical')),

  CONSTRAINT data_breaches_status_check
    CHECK (status IN ('open', 'assessment', 'contained', 'reported', 'closed', 'false_positive'))
);

-- Auto-update updated_at trigger
CREATE OR REPLACE FUNCTION public.set_data_breaches_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER data_breaches_updated_at
  BEFORE UPDATE ON public.data_breaches
  FOR EACH ROW EXECUTE FUNCTION public.set_data_breaches_updated_at();

-- Indexes for common admin queries
CREATE INDEX IF NOT EXISTS data_breaches_status_detected_idx
  ON public.data_breaches (status, detected_at DESC);

CREATE INDEX IF NOT EXISTS data_breaches_severity_idx
  ON public.data_breaches (severity, created_at DESC);

CREATE INDEX IF NOT EXISTS data_breaches_deadline_idx
  ON public.data_breaches (report_deadline_at)
  WHERE status NOT IN ('closed', 'false_positive');

-- ----------------------------------------------------------------
-- RLS — admin-only access
-- ----------------------------------------------------------------
ALTER TABLE public.data_breaches ENABLE ROW LEVEL SECURITY;

-- Admin: can read all breach records
CREATE POLICY "data_breaches_select_admin"
  ON public.data_breaches
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
        AND role = 'admin'
    )
  );

-- Admin: can create breach records
CREATE POLICY "data_breaches_insert_admin"
  ON public.data_breaches
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
        AND role = 'admin'
    )
  );

-- Admin: can update breach records (status, reporting fields, containment)
CREATE POLICY "data_breaches_update_admin"
  ON public.data_breaches
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

-- No DELETE policy — breach records must be preserved for legal evidence
-- Hard close = status = 'closed' | 'false_positive'
