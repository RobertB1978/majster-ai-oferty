-- Add end_time and recurrence support to calendar_events
-- end_time: allows events to span a time range (e.g. 09:00–10:30)
-- recurrence_rule: 'none' | 'daily' | 'weekly' | 'monthly' | 'yearly'
-- recurrence_end_date: last date on which the recurrence applies

ALTER TABLE public.calendar_events
  ADD COLUMN IF NOT EXISTS end_time TIME,
  ADD COLUMN IF NOT EXISTS recurrence_rule TEXT NOT NULL DEFAULT 'none',
  ADD COLUMN IF NOT EXISTS recurrence_end_date DATE;

-- Ensure recurrence_rule only accepts known values
ALTER TABLE public.calendar_events
  ADD CONSTRAINT calendar_events_recurrence_rule_check
  CHECK (recurrence_rule IN ('none', 'daily', 'weekly', 'monthly', 'yearly'));
