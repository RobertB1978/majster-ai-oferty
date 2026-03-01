-- PR-08: CRM + Price Library (Clients + Line Items) - CRUD foundation
-- Date: 2026-03-01
-- Description:
--   1. Extend existing `clients` table with CRM fields (type, company_name, nip, notes, updated_at)
--   2. Create new `line_items` table (price library / catalog) with full RLS

-- ============================================================
-- PART A: Extend `clients` table
-- (existing table has: id, user_id, name, phone, email, address, created_at)
-- ============================================================

ALTER TABLE public.clients
  ADD COLUMN IF NOT EXISTS type        TEXT NOT NULL DEFAULT 'person'
    CHECK (type IN ('person', 'company')),
  ADD COLUMN IF NOT EXISTS company_name TEXT,
  ADD COLUMN IF NOT EXISTS nip          TEXT,
  ADD COLUMN IF NOT EXISTS notes        TEXT,
  ADD COLUMN IF NOT EXISTS updated_at   TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now();

-- Auto-update updated_at on row change
CREATE OR REPLACE FUNCTION public.clients_set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS clients_updated_at ON public.clients;
CREATE TRIGGER clients_updated_at
  BEFORE UPDATE ON public.clients
  FOR EACH ROW EXECUTE FUNCTION public.clients_set_updated_at();

-- ============================================================
-- PART B: Create `line_items` table (price library)
-- ============================================================

CREATE TABLE IF NOT EXISTS public.line_items (
  id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category       TEXT,
  name           TEXT        NOT NULL,
  description    TEXT,
  unit           TEXT        NOT NULL DEFAULT 'szt.',
  unit_price_net NUMERIC(12, 2) NOT NULL DEFAULT 0,
  vat_rate       NUMERIC(5, 2),
  item_type      TEXT        NOT NULL DEFAULT 'material'
    CHECK (item_type IN ('labor', 'material', 'service', 'travel', 'lump_sum')),
  favorite       BOOLEAN     NOT NULL DEFAULT false,
  last_used_at   TIMESTAMP WITH TIME ZONE,
  created_at     TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at     TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Auto-update updated_at on row change
CREATE OR REPLACE FUNCTION public.line_items_set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER line_items_updated_at
  BEFORE UPDATE ON public.line_items
  FOR EACH ROW EXECUTE FUNCTION public.line_items_set_updated_at();

-- ============================================================
-- RLS: Enable and set policies for line_items
-- ============================================================

ALTER TABLE public.line_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "line_items_select_own"
  ON public.line_items FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "line_items_insert_own"
  ON public.line_items FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "line_items_update_own"
  ON public.line_items FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "line_items_delete_own"
  ON public.line_items FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================
-- Performance indexes
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_line_items_user_id    ON public.line_items(user_id);
CREATE INDEX IF NOT EXISTS idx_line_items_item_type  ON public.line_items(user_id, item_type);
CREATE INDEX IF NOT EXISTS idx_line_items_favorite   ON public.line_items(user_id, favorite) WHERE favorite = true;
CREATE INDEX IF NOT EXISTS idx_clients_user_updated  ON public.clients(user_id, updated_at DESC);
