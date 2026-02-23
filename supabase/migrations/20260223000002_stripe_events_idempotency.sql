-- ============================================================================
-- Migration: stripe_events idempotency store
-- Purpose:   Prevent duplicate processing of Stripe webhook events.
--            Each Stripe event_id is stored here on first receipt; duplicate
--            delivery (which Stripe guarantees can happen) is safely ignored.
-- Rollback:  DROP TABLE IF EXISTS public.stripe_events;
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.stripe_events (
  -- Stripe event IDs are globally unique strings (e.g. "evt_1ABC...")
  event_id      TEXT        PRIMARY KEY,
  processed_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  -- Optional: SHA-256 hex of the raw request body for audit / debugging
  payload_hash  TEXT
);

COMMENT ON TABLE  public.stripe_events IS
  'Idempotency store for Stripe webhook events. '
  'Inserting a duplicate event_id violates the PRIMARY KEY and signals the '
  'webhook handler to skip re-processing.';

COMMENT ON COLUMN public.stripe_events.event_id IS
  'Stripe event ID (evt_…). Primary key ensures each event is processed once.';

COMMENT ON COLUMN public.stripe_events.payload_hash IS
  'Optional SHA-256 hex of the raw webhook body for audit / tamper detection.';

-- Index is implicit on PRIMARY KEY; add a time-based one for pruning old rows.
CREATE INDEX IF NOT EXISTS idx_stripe_events_processed_at
  ON public.stripe_events (processed_at);

-- RLS: table is write-only from the service role (Edge Functions).
-- No user should ever SELECT from this table.
ALTER TABLE public.stripe_events ENABLE ROW LEVEL SECURITY;

-- Service role (used by Edge Functions) can do everything.
CREATE POLICY "stripe_events_service_role_all"
  ON public.stripe_events
  FOR ALL
  USING     ((auth.jwt() ->> 'role') = 'service_role')
  WITH CHECK ((auth.jwt() ->> 'role') = 'service_role');
