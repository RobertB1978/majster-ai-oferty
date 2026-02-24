-- ============================================================
-- Plan Requests table
-- Stores in-app plan upgrade requests submitted when Stripe
-- is not yet configured (VITE_STRIPE_ENABLED=false).
-- ============================================================

CREATE TABLE IF NOT EXISTS plan_requests (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at  timestamptz NOT NULL    DEFAULT now(),
  user_id     uuid        NOT NULL    REFERENCES auth.users(id) ON DELETE CASCADE,
  email       text        NOT NULL,
  phone       text,
  plan_slug   text        NOT NULL,
  locale      text        NOT NULL    DEFAULT 'pl',
  message     text,
  status      text        NOT NULL    DEFAULT 'new'
                          CHECK (status IN ('new', 'contacted', 'converted', 'rejected'))
);

-- Index for admin queries
CREATE INDEX IF NOT EXISTS plan_requests_user_id_idx  ON plan_requests(user_id);
CREATE INDEX IF NOT EXISTS plan_requests_status_idx   ON plan_requests(status);
CREATE INDEX IF NOT EXISTS plan_requests_created_at_idx ON plan_requests(created_at DESC);

-- ── RLS ─────────────────────────────────────────────────────
ALTER TABLE plan_requests ENABLE ROW LEVEL SECURITY;

-- Authenticated users can insert their own requests
CREATE POLICY plan_requests_insert_own
  ON plan_requests
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Users can read their own requests
CREATE POLICY plan_requests_select_own
  ON plan_requests
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Admins can read all requests (reuses existing is_admin() helper if available,
-- falls back to checking app_metadata role claim)
CREATE POLICY plan_requests_select_admin
  ON plan_requests
  FOR SELECT
  TO authenticated
  USING (
    (auth.jwt() ->> 'role') = 'service_role'
    OR (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  );

-- Admins can update status on any request
CREATE POLICY plan_requests_update_admin
  ON plan_requests
  FOR UPDATE
  TO authenticated
  USING (
    (auth.jwt() ->> 'role') = 'service_role'
    OR (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  )
  WITH CHECK (
    (auth.jwt() ->> 'role') = 'service_role'
    OR (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  );
