-- ============================================================
-- Quick Estimate Draft Persistence
-- Branch: claude/persist-quick-estimate-83YAS
-- Date: 2026-03-11
-- ============================================================
--
-- Adds three nullable columns to support persisting Quick Estimate
-- drafts as real backend records:
--
--  1. offers.source       — identifies draft origin ('quick_estimate')
--  2. offers.vat_enabled  — VAT toggle state for the workspace
--  3. offer_items.metadata — JSONB for extended LineItem fields
--     (priceMode, laborCost, materialCost, marginPct, showMargin, price)
--
-- All columns are nullable and backward-compatible. Existing rows
-- are unaffected. No RLS changes needed (existing offer policies
-- already cover the new rows via user_id = auth.uid()).
-- ============================================================

-- 1. Source tag for offers created via Quick Estimate flow
ALTER TABLE public.offers
  ADD COLUMN IF NOT EXISTS source text NULL;

COMMENT ON COLUMN public.offers.source IS
  'Origin of the offer record. ''quick_estimate'' = created by QuickEstimateWorkspace draft. NULL = regular offer.';

-- 2. VAT toggle persisted per draft
ALTER TABLE public.offers
  ADD COLUMN IF NOT EXISTS vat_enabled boolean NULL;

COMMENT ON COLUMN public.offers.vat_enabled IS
  'VAT 23% toggle for quick estimate workspace. NULL means not set (default true in UI).';

-- 3. Extended line-item metadata (priceMode, costs, margin)
ALTER TABLE public.offer_items
  ADD COLUMN IF NOT EXISTS metadata jsonb NULL;

COMMENT ON COLUMN public.offer_items.metadata IS
  'Quick estimate extended fields: { priceMode, price, laborCost, materialCost, marginPct, showMargin }. NULL for items created outside quick estimate flow.';

-- Index for efficient draft lookup per user
CREATE INDEX IF NOT EXISTS idx_offers_user_source_status
  ON public.offers (user_id, source, status);
