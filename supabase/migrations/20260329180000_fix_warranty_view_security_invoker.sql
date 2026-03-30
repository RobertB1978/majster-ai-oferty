-- ============================================================
-- Fix: project_warranties_with_end view — add SECURITY INVOKER
-- Branch: claude/fix-warranty-save-QtL19
-- Date: 2026-03-29
-- ============================================================
--
-- Problem: the view was created without WITH (security_invoker = on).
-- In Supabase / PostgreSQL 15+ a view without this flag runs as its
-- OWNER (postgres superuser), which bypasses RLS on the underlying
-- project_warranties table.  All warranties from all tenants become
-- visible to any authenticated user who queries the view.
--
-- This migration recreates the view with security_invoker = on so that
-- the caller's identity is used when evaluating RLS policies.
--
-- NOTE: This migration is safe only after
--   20260302200000_pr18_warranties.sql has been applied.
--   That earlier migration creates the project_warranties table.
--   If the table does not yet exist in production, this migration
--   will fail with "relation project_warranties does not exist" — which
--   is intentional: it signals that the prerequisite migration is missing.
-- ============================================================

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
