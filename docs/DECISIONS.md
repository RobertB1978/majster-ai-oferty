# Architecture Decision Log

| Date | Decision | Context |
|------|----------|---------|
| 2026-04-13 | Register `customer-portal` and `request-plan` in `supabase/config.toml` (PR#02) | Both functions existed in `supabase/functions/` but were missing from config — made registration explicit for deployment consistency |
