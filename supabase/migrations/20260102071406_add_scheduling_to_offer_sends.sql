-- Sprint 0.7: Add scheduling capability to offer_sends
-- All timestamps use TIMESTAMP WITH TIME ZONE to prevent naive/aware datetime comparison issues

-- Add scheduling fields to offer_sends
ALTER TABLE public.offer_sends
  ADD COLUMN IF NOT EXISTS scheduled_for TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS retry_count INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS max_retries INTEGER NOT NULL DEFAULT 3,
  ADD COLUMN IF NOT EXISTS last_retry_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS processed_at TIMESTAMP WITH TIME ZONE;

-- Update status field to include 'scheduled' and 'failed' states
-- Existing values: 'pending', 'sent'
-- New values: 'scheduled', 'failed'
-- No migration needed for existing data - 'pending' remains valid for immediate sends

-- Add index for efficient scheduler queries
CREATE INDEX IF NOT EXISTS idx_offer_sends_scheduled_for
  ON public.offer_sends (scheduled_for)
  WHERE status = 'scheduled' AND scheduled_for IS NOT NULL;

-- Add index for retry logic
CREATE INDEX IF NOT EXISTS idx_offer_sends_retry
  ON public.offer_sends (status, retry_count, last_retry_at)
  WHERE status IN ('scheduled', 'pending') AND retry_count < max_retries;

-- Comments for documentation
COMMENT ON COLUMN public.offer_sends.scheduled_for IS 'When this offer should be sent (timezone-aware UTC). NULL means send immediately.';
COMMENT ON COLUMN public.offer_sends.retry_count IS 'Number of retry attempts made';
COMMENT ON COLUMN public.offer_sends.max_retries IS 'Maximum number of retry attempts allowed';
COMMENT ON COLUMN public.offer_sends.last_retry_at IS 'Timestamp of last retry attempt (timezone-aware UTC)';
COMMENT ON COLUMN public.offer_sends.processed_at IS 'Timestamp when offer was successfully processed by scheduler (timezone-aware UTC)';
