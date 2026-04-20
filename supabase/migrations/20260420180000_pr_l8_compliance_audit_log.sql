-- ============================================================
-- PR-L8: Hard Compliance Audit Log Foundation
-- ============================================================
-- Problem: audit events in useAuditLog.ts were stored in the
-- `notifications` table, which has user-deletable RLS.
-- Users could delete their own notifications (and thus their
-- audit trail), making it legally worthless as evidence.
--
-- Solution: dedicated append-only compliance_audit_log table:
--   - No UPDATE policy for any role → immutable after insert
--   - No DELETE policy for any role → non-destructible by users
--   - service_role bypasses RLS (Supabase default) — used by
--     edge functions and operator/admin queries
--
-- This is the evidence foundation for:
--   PR-L3: DSAR inbox (reads events actor_user_id = user)
--   PR-L7: Breach register (source = 'edge_function', event_type like 'breach.*')
--   PR-L4: Retention automation (event_type = 'user.data_delete_request')
-- ============================================================

CREATE TABLE IF NOT EXISTS public.compliance_audit_log (
  id             uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type     text        NOT NULL,
  actor_user_id  uuid        NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  target_user_id uuid        NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  entity_type    text        NULL,
  entity_id      text        NULL,
  metadata       jsonb       NOT NULL DEFAULT '{}'::jsonb,
  source         text        NOT NULL,
  created_at     timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT compliance_audit_log_source_check
    CHECK (source IN ('frontend', 'edge_function', 'migration', 'admin'))
);

-- Indexes for DSAR queries (by actor), event monitoring (by type), time range
CREATE INDEX IF NOT EXISTS compliance_audit_log_actor_created_idx
  ON public.compliance_audit_log (actor_user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS compliance_audit_log_event_type_created_idx
  ON public.compliance_audit_log (event_type, created_at DESC);

CREATE INDEX IF NOT EXISTS compliance_audit_log_created_at_idx
  ON public.compliance_audit_log (created_at DESC);

-- ----------------------------------------------------------------
-- RLS — append-only posture
-- ----------------------------------------------------------------
ALTER TABLE public.compliance_audit_log ENABLE ROW LEVEL SECURITY;

-- Users may insert events where they are the actor
CREATE POLICY "compliance_audit_log_insert_own"
ON public.compliance_audit_log
FOR INSERT
TO authenticated
WITH CHECK (actor_user_id = auth.uid());

-- Users may read their own audit events (DSAR transparency)
CREATE POLICY "compliance_audit_log_select_own"
ON public.compliance_audit_log
FOR SELECT
TO authenticated
USING (actor_user_id = auth.uid());

-- NO UPDATE policy → immutable for all user roles
-- NO DELETE policy → non-destructible for all user roles
-- service_role bypasses RLS by default (used by edge functions and admin)
