-- ============================================================
-- PR-COMM-04: commercial fields for offers table
-- Branch: claude/add-offer-commercial-fields-cbLnQ
-- Date: 2026-04-19
-- ============================================================
--
-- Additive migration: adds editable commercial text fields and
-- a user-controlled validity date to the offers table.
--
-- Fields:
--   offer_text    — introductory commercial text shown at top of PDF
--   terms         — payment / general terms shown at bottom of PDF
--   deadline_text — execution deadline (free text, e.g. "4 tygodnie")
--   valid_until   — offer validity date (nullable; app falls back to issued_at + 30d when NULL)
--
-- Backward compatible: all columns are nullable with no defaults,
-- so existing offers are unaffected and render safely via fallbacks.
-- ============================================================

ALTER TABLE public.offers
  ADD COLUMN IF NOT EXISTS offer_text    text        NULL,
  ADD COLUMN IF NOT EXISTS terms         text        NULL,
  ADD COLUMN IF NOT EXISTS deadline_text text        NULL,
  ADD COLUMN IF NOT EXISTS valid_until   timestamptz NULL;

COMMENT ON COLUMN public.offers.offer_text    IS 'Introductory commercial text shown at the top of the PDF. PR-COMM-04.';
COMMENT ON COLUMN public.offers.terms         IS 'Payment / general terms shown at the bottom of the PDF. PR-COMM-04.';
COMMENT ON COLUMN public.offers.deadline_text IS 'Execution deadline as free text (e.g. "4 tygodnie"). PR-COMM-04.';
COMMENT ON COLUMN public.offers.valid_until   IS 'Offer validity date. NULL = app defaults to issued_at + 30 days. PR-COMM-04.';
