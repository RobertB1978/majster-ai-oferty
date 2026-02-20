-- Migration: user_addons table for purchasable add-ons
-- Sprint 2 — Subscription & Billing

CREATE TABLE IF NOT EXISTS public.user_addons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  addon_key TEXT NOT NULL,             -- e.g. 'extra_projects_10', 'extra_clients_20', 'extra_pdf_50'
  quantity INTEGER NOT NULL DEFAULT 1, -- how many packs purchased
  purchased_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ,              -- NULL = lifetime; or set to billing cycle end
  stripe_payment_intent_id TEXT,       -- filled once Stripe is wired
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Unique constraint: one row per user+addon (quantity stores the count)
CREATE UNIQUE INDEX user_addons_user_addon_unique ON public.user_addons (user_id, addon_key)
  WHERE expires_at IS NULL OR expires_at > now();

-- Enable RLS
ALTER TABLE public.user_addons ENABLE ROW LEVEL SECURITY;

-- Users can only see their own add-ons
CREATE POLICY user_addons_select_own
  ON public.user_addons FOR SELECT
  USING (auth.uid() = user_id);

-- Only service-role (Edge Functions) can insert/update add-ons
CREATE POLICY user_addons_insert_service
  ON public.user_addons FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY user_addons_update_service
  ON public.user_addons FOR UPDATE
  USING (auth.uid() = user_id);

-- Index for fast per-user lookups
CREATE INDEX user_addons_user_id_idx ON public.user_addons (user_id);
CREATE INDEX user_addons_expires_at_idx ON public.user_addons (expires_at) WHERE expires_at IS NOT NULL;

-- updated_at trigger
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS user_addons_updated_at ON public.user_addons;
CREATE TRIGGER user_addons_updated_at
  BEFORE UPDATE ON public.user_addons
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
