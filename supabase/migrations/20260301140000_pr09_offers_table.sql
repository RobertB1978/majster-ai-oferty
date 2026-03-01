-- ============================================
-- PR-09: Offers table — list + statuses + RLS
-- Branch: claude/offers-list-pr-09-bppeV
-- Date: 2026-03-01
-- ============================================
--
-- Creates standalone `offers` table with:
--   - Statuses: DRAFT / SENT / ACCEPTED / REJECTED / ARCHIVED
--   - Full RLS: user_id = auth.uid() for all operations
--   - Indexes for common query patterns
-- ============================================

CREATE TABLE IF NOT EXISTS public.offers (
  id               uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  client_id        uuid        NULL,  -- FK to clients added in PR-10 when clients table confirmed
  status           text        NOT NULL DEFAULT 'DRAFT'
                               CHECK (status IN ('DRAFT', 'SENT', 'ACCEPTED', 'REJECTED', 'ARCHIVED')),
  title            text        NULL,
  total_net        numeric(14, 2) NULL,
  total_gross      numeric(14, 2) NULL,
  currency         text        NOT NULL DEFAULT 'PLN',
  sent_at          timestamptz NULL,
  accepted_at      timestamptz NULL,
  rejected_at      timestamptz NULL,
  last_activity_at timestamptz NOT NULL DEFAULT now(),
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now()
);

-- ── Indexes ──────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_offers_user_id
  ON public.offers (user_id);

CREATE INDEX IF NOT EXISTS idx_offers_user_status
  ON public.offers (user_id, status);

CREATE INDEX IF NOT EXISTS idx_offers_last_activity
  ON public.offers (user_id, last_activity_at DESC);

-- ── Auto-update updated_at ────────────────────
CREATE OR REPLACE FUNCTION public.offers_set_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at := now();
  NEW.last_activity_at := now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER offers_updated_at
  BEFORE UPDATE ON public.offers
  FOR EACH ROW EXECUTE FUNCTION public.offers_set_updated_at();

-- ── Row Level Security ────────────────────────
ALTER TABLE public.offers ENABLE ROW LEVEL SECURITY;

-- SELECT: user sees only their own offers
CREATE POLICY "offers_select_own"
  ON public.offers FOR SELECT
  USING (auth.uid() = user_id);

-- INSERT: user_id must match authenticated user
CREATE POLICY "offers_insert_own"
  ON public.offers FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- UPDATE: user can only update their own offers
CREATE POLICY "offers_update_own"
  ON public.offers FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- DELETE: user can only delete their own offers
CREATE POLICY "offers_delete_own"
  ON public.offers FOR DELETE
  USING (auth.uid() = user_id);

COMMENT ON TABLE public.offers IS 'Standalone offers/quotes created by contractors. PR-09.';
COMMENT ON COLUMN public.offers.status IS 'Offer lifecycle: DRAFT → SENT → ACCEPTED | REJECTED | ARCHIVED';
COMMENT ON COLUMN public.offers.sent_at IS 'Timestamp when offer was first sent to client.';
COMMENT ON COLUMN public.offers.last_activity_at IS 'Updated on any status change or edit. Used for "no response X days" badge.';
