-- ============================================================
-- PR-FIN-10: offer-level margin (narzut) for the new wizard
-- Branch: claude/restore-offer-margin-vvTgv
-- Date: 2026-04-20
-- ============================================================
--
-- Reintroduces a minimal, contractor-friendly margin/narzut model
-- at the OFFER level (not per-item). Stored as percentage 0..100.
--
-- Semantics (apply transparently and predictably):
--   final_net   = sum(line_total_net) * (1 + margin_percent / 100)
--   final_vat   = sum(line_vat)       * (1 + margin_percent / 100)
--   final_gross = final_net + final_vat
--
-- offer_items.line_total_net stays raw (cost basis); the offer's
-- stored total_net / total_vat / total_gross reflect post-margin
-- amounts. This keeps the contractor mental model simple ("dodaj X%
-- narzutu na koszty") and avoids any per-item discount engine.
--
-- Backward compatible: column is NOT NULL with DEFAULT 0, so all
-- existing offers behave exactly as before (margin_percent = 0
-- means totals = sum of line totals, unchanged).
-- ============================================================

ALTER TABLE public.offers
  ADD COLUMN IF NOT EXISTS margin_percent NUMERIC(5, 2) NOT NULL DEFAULT 0
    CHECK (margin_percent >= 0 AND margin_percent <= 100);

COMMENT ON COLUMN public.offers.margin_percent IS
  'Offer-level markup (narzut) in percent, 0..100. Applied to net/VAT to produce stored totals. PR-FIN-10.';
