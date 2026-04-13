# Architecture Decision Log

| Date | Decision | Context |
|------|----------|---------|
| 2026-04-13 | Register `customer-portal` and `request-plan` in `supabase/config.toml` (PR#02) | Both functions existed in `supabase/functions/` but were missing from config — made registration explicit for deployment consistency |
| 2026-04-13 | SEC-01: public offer approval access via SECURITY DEFINER RPC (Option B) — `get_offer_approval_by_token()` — not RLS anon policy | Broken USING clause on anon policy passed row's own `public_token` to `validate_offer_token()`, always returning TRUE → full enumeration of all pending offers. RLS cannot safely read the caller's filter predicate. SECURITY DEFINER function performs exact token match server-side, returns minimal fields only, revokes anon access to raw table. |
