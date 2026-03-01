-- ============================================================
-- PR-12: Acceptance Links + Offer Public Actions
-- Branch: claude/pr-12-acceptance-links-zAx3e
-- Date: 2026-03-01
-- ============================================================
--
-- Creates:
--   1. acceptance_links — tokenized public URLs (UUID, 30-day TTL)
--   2. offer_public_actions — audit log of client ACCEPT/REJECT
--   3. resolve_offer_acceptance_link(token) — SECURITY DEFINER for public read
--   4. process_offer_acceptance_action(token, action, comment) — SECURITY DEFINER for public write
--
-- Security notes:
--   - Tokens are UUID v4 (gen_random_uuid()) — unguessable, 122-bit entropy
--   - Expiry enforced server-side in DB function (not just client)
--   - Cross-tenant access impossible: token -> single offer (FK)
--   - Rate limiting: documented in SECURITY_BASELINE.md (apply at Edge/CDN layer)
--   - RLS: owners CRUD own links; public writes go through SECURITY DEFINER function only
-- ============================================================

-- ── 1. acceptance_links ───────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.acceptance_links (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  offer_id   uuid        NOT NULL REFERENCES public.offers(id) ON DELETE CASCADE,
  token      uuid        NOT NULL DEFAULT gen_random_uuid(),
  expires_at timestamptz NOT NULL DEFAULT (now() + INTERVAL '30 days'),
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT acceptance_links_token_unique UNIQUE (token),
  CONSTRAINT acceptance_links_offer_unique UNIQUE (offer_id)  -- one link per offer
);

CREATE INDEX IF NOT EXISTS idx_acceptance_links_offer_id
  ON public.acceptance_links (offer_id);

CREATE INDEX IF NOT EXISTS idx_acceptance_links_token
  ON public.acceptance_links (token);

CREATE INDEX IF NOT EXISTS idx_acceptance_links_user_id
  ON public.acceptance_links (user_id);

ALTER TABLE public.acceptance_links ENABLE ROW LEVEL SECURITY;

-- Owner can manage own links
CREATE POLICY "acceptance_links_select_own"
  ON public.acceptance_links FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "acceptance_links_insert_own"
  ON public.acceptance_links FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "acceptance_links_update_own"
  ON public.acceptance_links FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "acceptance_links_delete_own"
  ON public.acceptance_links FOR DELETE
  USING (auth.uid() = user_id);

COMMENT ON TABLE public.acceptance_links IS 'Tokenized public acceptance URLs for offers. PR-12.';
COMMENT ON COLUMN public.acceptance_links.token IS 'UUID v4 — unguessable token used in public URL.';
COMMENT ON COLUMN public.acceptance_links.expires_at IS 'After this timestamp the link is invalid (enforced server-side).';

-- ── 2. offer_public_actions ───────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.offer_public_actions (
  id       uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  offer_id uuid        NOT NULL REFERENCES public.offers(id) ON DELETE CASCADE,
  token    uuid        NOT NULL,
  action   text        NOT NULL CHECK (action IN ('ACCEPT', 'REJECT')),
  comment  text,
  acted_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_offer_public_actions_offer_id
  ON public.offer_public_actions (offer_id);

ALTER TABLE public.offer_public_actions ENABLE ROW LEVEL SECURITY;

-- Owner can read actions on their own offers
CREATE POLICY "offer_public_actions_select_own"
  ON public.offer_public_actions FOR SELECT
  USING (
    offer_id IN (SELECT id FROM public.offers WHERE user_id = auth.uid())
  );

-- Public insert via SECURITY DEFINER function only (no direct INSERT policy for anon)
COMMENT ON TABLE public.offer_public_actions IS 'Audit log: client ACCEPT/REJECT actions via public link. PR-12.';

-- ── 3. resolve_offer_acceptance_link ─────────────────────────────────────────
-- Returns offer data (safe subset) when token is valid.
-- Called from the browser with the anon key — SECURITY DEFINER bypasses RLS.

CREATE OR REPLACE FUNCTION public.resolve_offer_acceptance_link(p_token uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_link    acceptance_links%ROWTYPE;
  v_offer   offers%ROWTYPE;
  v_client  record;
  v_company record;
  v_items   jsonb;
BEGIN
  -- 1. Find link
  SELECT * INTO v_link FROM acceptance_links WHERE token = p_token;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'not_found');
  END IF;

  -- 2. Expiry check (server-side)
  IF v_link.expires_at < now() THEN
    RETURN jsonb_build_object('error', 'expired');
  END IF;

  -- 3. Get offer
  SELECT * INTO v_offer FROM offers WHERE id = v_link.offer_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'offer_not_found');
  END IF;

  -- 4. Only SENT/ACCEPTED/REJECTED offers are visible via token
  IF v_offer.status NOT IN ('SENT', 'ACCEPTED', 'REJECTED') THEN
    RETURN jsonb_build_object('error', 'not_available');
  END IF;

  -- 5. Client data (nullable)
  IF v_offer.client_id IS NOT NULL THEN
    SELECT name, email, phone, address INTO v_client
      FROM clients WHERE id = v_offer.client_id LIMIT 1;
  END IF;

  -- 6. Company profile (nullable)
  SELECT company_name, nip, street, postal_code, city, phone,
         email_for_offers, logo_url INTO v_company
    FROM profiles WHERE user_id = v_offer.user_id LIMIT 1;

  -- 7. Items
  SELECT jsonb_agg(
    jsonb_build_object(
      'id',             id,
      'name',           name,
      'unit',           unit,
      'qty',            qty,
      'unit_price_net', unit_price_net,
      'vat_rate',       vat_rate,
      'line_total_net', line_total_net
    ) ORDER BY created_at
  ) INTO v_items
  FROM offer_items WHERE offer_id = v_offer.id;

  RETURN jsonb_build_object(
    'offer', jsonb_build_object(
      'id',          v_offer.id,
      'title',       v_offer.title,
      'status',      v_offer.status,
      'currency',    v_offer.currency,
      'total_net',   v_offer.total_net,
      'total_vat',   v_offer.total_vat,
      'total_gross', v_offer.total_gross,
      'created_at',  v_offer.created_at,
      'accepted_at', v_offer.accepted_at,
      'rejected_at', v_offer.rejected_at
    ),
    'client', CASE
      WHEN v_client.name IS NOT NULL THEN jsonb_build_object(
        'name',    v_client.name,
        'email',   v_client.email,
        'phone',   v_client.phone,
        'address', v_client.address
      )
      ELSE NULL
    END,
    'company', CASE
      WHEN v_company.company_name IS NOT NULL THEN jsonb_build_object(
        'company_name',    v_company.company_name,
        'nip',             v_company.nip,
        'street',          v_company.street,
        'postal_code',     v_company.postal_code,
        'city',            v_company.city,
        'phone',           v_company.phone,
        'email_for_offers',v_company.email_for_offers,
        'logo_url',        v_company.logo_url
      )
      ELSE NULL
    END,
    'items',      COALESCE(v_items, '[]'::jsonb),
    'expires_at', v_link.expires_at
  );
END;
$$;

COMMENT ON FUNCTION public.resolve_offer_acceptance_link(uuid)
  IS 'Public (anon key) read of offer data via acceptance token. SECURITY DEFINER. PR-12.';

-- ── 4. process_offer_acceptance_action ───────────────────────────────────────
-- Updates offer status and records the action.
-- Called from the browser with the anon key — SECURITY DEFINER bypasses RLS.

CREATE OR REPLACE FUNCTION public.process_offer_acceptance_action(
  p_token   uuid,
  p_action  text,
  p_comment text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_link  acceptance_links%ROWTYPE;
  v_offer offers%ROWTYPE;
BEGIN
  -- Validate action
  IF p_action NOT IN ('ACCEPT', 'REJECT') THEN
    RETURN jsonb_build_object('error', 'invalid_action');
  END IF;

  -- Sanitize comment length
  IF p_comment IS NOT NULL THEN
    p_comment := left(p_comment, 1000);
  END IF;

  -- Find link
  SELECT * INTO v_link FROM acceptance_links WHERE token = p_token;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'not_found');
  END IF;

  -- Expiry check
  IF v_link.expires_at < now() THEN
    RETURN jsonb_build_object('error', 'expired');
  END IF;

  -- Get offer
  SELECT * INTO v_offer FROM offers WHERE id = v_link.offer_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'offer_not_found');
  END IF;

  -- Idempotency: already decided
  IF v_offer.status IN ('ACCEPTED', 'REJECTED') THEN
    RETURN jsonb_build_object(
      'success',    true,
      'idempotent', true,
      'status',     v_offer.status
    );
  END IF;

  -- Only SENT offers can be decided
  IF v_offer.status <> 'SENT' THEN
    RETURN jsonb_build_object('error', 'not_actionable');
  END IF;

  -- Update offer status
  IF p_action = 'ACCEPT' THEN
    UPDATE offers
      SET status = 'ACCEPTED', accepted_at = now()
      WHERE id = v_offer.id;
  ELSE
    UPDATE offers
      SET status = 'REJECTED', rejected_at = now()
      WHERE id = v_offer.id;
  END IF;

  -- Record action (audit)
  INSERT INTO offer_public_actions (offer_id, token, action, comment)
    VALUES (v_offer.id, p_token, p_action, p_comment);

  RETURN jsonb_build_object(
    'success', true,
    'status',  CASE WHEN p_action = 'ACCEPT' THEN 'ACCEPTED' ELSE 'REJECTED' END
  );
END;
$$;

COMMENT ON FUNCTION public.process_offer_acceptance_action(uuid, text, text)
  IS 'Public (anon key) ACCEPT/REJECT action via acceptance token. SECURITY DEFINER. PR-12.';
