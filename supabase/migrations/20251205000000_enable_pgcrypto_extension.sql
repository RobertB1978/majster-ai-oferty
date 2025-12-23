-- Enable pgcrypto extension for gen_random_uuid() and gen_random_bytes()
-- This migration MUST run before any migrations that use gen_random_uuid() or gen_random_bytes()
-- Timestamp: 20251205000000 (earliest migration to ensure it runs first)

-- Enable pgcrypto extension (idempotent - safe to run multiple times)
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Verify extension is enabled
DO $$
BEGIN
  -- Test gen_random_uuid() function
  PERFORM gen_random_uuid();
  RAISE NOTICE 'pgcrypto extension enabled successfully - gen_random_uuid() is available';
EXCEPTION
  WHEN undefined_function THEN
    RAISE EXCEPTION 'pgcrypto extension failed to enable - gen_random_uuid() not available';
END
$$;
