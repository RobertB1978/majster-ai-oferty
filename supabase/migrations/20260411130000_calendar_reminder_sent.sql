-- calendar_reminder_sent: de-duplication table for the send-calendar-reminders Edge Function.
-- Prevents sending duplicate reminder notifications/emails for the same event on the same day.

CREATE TABLE IF NOT EXISTS public.calendar_reminder_sent (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id      UUID        NOT NULL REFERENCES public.calendar_events(id) ON DELETE CASCADE,
  user_id       UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  sent_date     DATE        NOT NULL DEFAULT CURRENT_DATE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- One row per event per day (idempotency)
  CONSTRAINT calendar_reminder_sent_event_date_unique UNIQUE (event_id, sent_date)
);

-- Index for the de-duplication look-up in the Edge Function
CREATE INDEX IF NOT EXISTS idx_calendar_reminder_sent_event_date
  ON public.calendar_reminder_sent (event_id, sent_date);

-- RLS: only the owning user can see their own rows; service role bypasses RLS
ALTER TABLE public.calendar_reminder_sent ENABLE ROW LEVEL SECURITY;

CREATE POLICY calendar_reminder_sent_select_own
  ON public.calendar_reminder_sent FOR SELECT
  USING (auth.uid() = user_id);

-- Cleanup: automatically delete rows older than 7 days to keep the table small
-- (handled by the existing cleanup-expired-data Edge Function or a pg_cron job)
COMMENT ON TABLE public.calendar_reminder_sent IS
  'De-duplication log for send-calendar-reminders Edge Function. Rows older than 7 days can be safely purged.';
