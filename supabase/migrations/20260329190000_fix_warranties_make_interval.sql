-- ============================================================
-- Fix: project_warranties index + view — use make_interval()
-- Branch: claude/add-warranties-schema-VGbPg
-- Date: 2026-03-29
-- ============================================================
--
-- Problem: the original migration (20260302200000_pr18_warranties.sql)
-- and the security_invoker fix (20260329180000) both use
--   (warranty_months || ' months')::interval
-- which casts an integer to text and then to interval.
-- This is fragile and can cause issues with query planning.
--
-- Fix: use make_interval(months => warranty_months) which is the
-- proper PostgreSQL function for building intervals from integers.
--
-- Changes:
--   1. Drop and recreate idx_project_warranties_end_date with make_interval
--   2. Recreate project_warranties_with_end view with make_interval + security_invoker
-- ============================================================

-- 1. Fix the partial index on computed end_date
DROP INDEX IF EXISTS public.idx_project_warranties_end_date;

CREATE INDEX idx_project_warranties_end_date
  ON public.project_warranties (
    ((start_date + make_interval(months => warranty_months))::date)
  )
  WHERE reminder_30_sent_at IS NULL OR reminder_7_sent_at IS NULL;

-- 2. Recreate view with make_interval + security_invoker
CREATE OR REPLACE VIEW public.project_warranties_with_end
  WITH (security_invoker = on)
AS
SELECT
  id,
  user_id,
  project_id,
  client_email,
  client_name,
  contact_phone,
  warranty_months,
  start_date,
  ((start_date + make_interval(months => warranty_months))::date) AS end_date,
  scope_of_work,
  exclusions,
  pdf_storage_path,
  reminder_30_sent_at,
  reminder_7_sent_at,
  created_at,
  updated_at
FROM public.project_warranties;
