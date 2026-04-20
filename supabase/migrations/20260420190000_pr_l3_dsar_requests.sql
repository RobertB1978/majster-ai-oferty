-- PR-L3: DSAR Inbox — real rights-request workflow
-- Replaces the fake notification-based privacy flow with a proper dsar_requests table.
-- Audit trail goes to compliance_audit_log (established by PR-L8).

-- ============================================================
-- TABLE: dsar_requests
-- ============================================================
CREATE TABLE public.dsar_requests (
  id                uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_user_id uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  request_type      text        NOT NULL,
  status            text        NOT NULL DEFAULT 'open',
  description       text        NULL,
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now(),
  due_at            timestamptz NOT NULL DEFAULT (now() + INTERVAL '30 days'),
  assigned_to       uuid        NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  resolved_at       timestamptz NULL,
  resolution_note   text        NULL,

  CONSTRAINT dsar_request_type_check CHECK (
    request_type IN ('access','deletion','rectification','portability','restriction','objection','other')
  ),
  CONSTRAINT dsar_status_check CHECK (
    status IN ('open','in_progress','waiting_for_user','resolved','rejected')
  )
);

-- ============================================================
-- INDEXES
-- ============================================================
CREATE INDEX dsar_requests_requester_idx   ON public.dsar_requests (requester_user_id, created_at DESC);
CREATE INDEX dsar_requests_status_idx      ON public.dsar_requests (status, due_at ASC);
CREATE INDEX dsar_requests_due_at_idx      ON public.dsar_requests (due_at ASC);

-- ============================================================
-- updated_at trigger
-- ============================================================
CREATE OR REPLACE FUNCTION public.dsar_requests_set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER dsar_requests_updated_at
  BEFORE UPDATE ON public.dsar_requests
  FOR EACH ROW EXECUTE FUNCTION public.dsar_requests_set_updated_at();

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
ALTER TABLE public.dsar_requests ENABLE ROW LEVEL SECURITY;

-- User: can create own requests
CREATE POLICY "dsar_requests_insert_own"
  ON public.dsar_requests
  FOR INSERT
  TO authenticated
  WITH CHECK (requester_user_id = auth.uid());

-- User: can read own requests
CREATE POLICY "dsar_requests_select_own"
  ON public.dsar_requests
  FOR SELECT
  TO authenticated
  USING (requester_user_id = auth.uid());

-- Admin: can read all requests (via user_roles table)
CREATE POLICY "dsar_requests_select_admin"
  ON public.dsar_requests
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
        AND role = 'admin'
    )
  );

-- Admin: can update any request (change status, assign, resolve)
CREATE POLICY "dsar_requests_update_admin"
  ON public.dsar_requests
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

-- No DELETE allowed for anyone (soft-close via status='resolved'/'rejected')
