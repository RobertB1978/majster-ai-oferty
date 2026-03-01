-- ============================================
-- PR-10: offer_items table + offers extensions
-- Branch: claude/offer-wizard-draft-mUypo
-- Date: 2026-03-01
-- ============================================
--
-- 1. Creates `offer_items` table with full RLS
-- 2. Adds FK: offers.client_id → clients.id
-- 3. Adds total_vat column to offers
-- ============================================

-- ── 1. offer_items table ─────────────────────

CREATE TABLE IF NOT EXISTS public.offer_items (
  id               uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  offer_id         uuid        NOT NULL REFERENCES public.offers(id) ON DELETE CASCADE,
  item_type        text        NOT NULL DEFAULT 'labor'
                               CHECK (item_type IN ('labor', 'material', 'service', 'travel', 'lump_sum')),
  name             text        NOT NULL,
  unit             text        NULL,
  qty              numeric     NOT NULL DEFAULT 1,
  unit_price_net   numeric     NOT NULL DEFAULT 0,
  vat_rate         numeric     NULL,
  line_total_net   numeric     NOT NULL DEFAULT 0,
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now()
);

-- ── Indexes ───────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_offer_items_offer_id
  ON public.offer_items (offer_id);

CREATE INDEX IF NOT EXISTS idx_offer_items_user_id
  ON public.offer_items (user_id);

-- ── Auto-update updated_at ───────────────────
CREATE OR REPLACE FUNCTION public.offer_items_set_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER offer_items_updated_at
  BEFORE UPDATE ON public.offer_items
  FOR EACH ROW EXECUTE FUNCTION public.offer_items_set_updated_at();

-- ── Row Level Security ────────────────────────
ALTER TABLE public.offer_items ENABLE ROW LEVEL SECURITY;

-- SELECT: user sees only their own items
CREATE POLICY "offer_items_select_own"
  ON public.offer_items FOR SELECT
  USING (auth.uid() = user_id);

-- INSERT: user_id must match authenticated user
CREATE POLICY "offer_items_insert_own"
  ON public.offer_items FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- UPDATE: user can only update their own items
CREATE POLICY "offer_items_update_own"
  ON public.offer_items FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- DELETE: user can only delete their own items
CREATE POLICY "offer_items_delete_own"
  ON public.offer_items FOR DELETE
  USING (auth.uid() = user_id);

COMMENT ON TABLE public.offer_items IS 'Line items for offers. Each item belongs to one offer. PR-10.';
COMMENT ON COLUMN public.offer_items.line_total_net IS 'Computed: qty * unit_price_net. Stored for DB query performance.';

-- ── 2. FK: offers.client_id → clients.id ─────
-- NOTE: constraint is SET NULL on delete so orphaned offers stay intact

ALTER TABLE public.offers
  ADD CONSTRAINT IF NOT EXISTS offers_client_id_fkey
  FOREIGN KEY (client_id)
  REFERENCES public.clients(id)
  ON DELETE SET NULL;

-- ── 3. total_vat column in offers ────────────
ALTER TABLE public.offers
  ADD COLUMN IF NOT EXISTS total_vat numeric(14, 2) NULL;

COMMENT ON COLUMN public.offers.total_vat IS 'Sum of VAT across all line items. Computed and stored on save. PR-10.';
