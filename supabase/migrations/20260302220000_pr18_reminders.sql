-- ============================================================
-- PR-18: Project Reminders — in-app reminders for warranties and inspections
-- Branch: claude/enterprise-compliance-features-48LQF
-- Date: 2026-03-02
-- ============================================================
--
-- Creates:
--   1. project_reminders — reminder records linked to WARRANTY or INSPECTION
--
-- Design:
--   - Reminders are created when warranty/inspection is saved (T-30, T-7, T+30)
--   - status: PENDING → shown in app; DISMISSED → hidden
--   - channel: IN_APP (always) | NOTIFICATION (if browser/native supports it)
--   - No heavy scheduler needed: on app open, evaluate and surface PENDING reminders
--
-- Security:
--   - RLS enabled (user_id = auth.uid())
-- ============================================================

-- ── 1. project_reminders ──────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.project_reminders (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  entity_type     text        NOT NULL
    CHECK (entity_type IN ('WARRANTY', 'INSPECTION')),
  entity_id       uuid        NOT NULL,
  remind_at       timestamptz NOT NULL,
  channel         text        NOT NULL DEFAULT 'IN_APP'
    CHECK (channel IN ('IN_APP', 'NOTIFICATION')),
  status          text        NOT NULL DEFAULT 'PENDING'
    CHECK (status IN ('PENDING', 'SENT', 'DISMISSED')),
  label           text        NULL,    -- human-readable label e.g. "Gwarancja wygasa za 30 dni"
  created_at      timestamptz NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_project_reminders_user_id_status
  ON public.project_reminders (user_id, status)
  WHERE status = 'PENDING';

CREATE INDEX IF NOT EXISTS idx_project_reminders_entity
  ON public.project_reminders (entity_type, entity_id);

CREATE INDEX IF NOT EXISTS idx_project_reminders_remind_at
  ON public.project_reminders (remind_at)
  WHERE status = 'PENDING';

-- Unique constraint: one reminder per entity + remind_at timestamp
-- Prevents duplicate reminders on re-save
CREATE UNIQUE INDEX IF NOT EXISTS idx_project_reminders_unique_per_entity
  ON public.project_reminders (entity_id, remind_at);

-- RLS
ALTER TABLE public.project_reminders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "reminders_select_own"
  ON public.project_reminders FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "reminders_insert_own"
  ON public.project_reminders FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "reminders_update_own"
  ON public.project_reminders FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "reminders_delete_own"
  ON public.project_reminders FOR DELETE
  USING (auth.uid() = user_id);
