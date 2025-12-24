-- ============================================
-- CRITICAL FIX: Add pgcrypto extension
-- Severity: CRITICAL
-- Issue: All migrations use gen_random_uuid() and gen_random_bytes() but pgcrypto extension was never enabled
-- Impact: SQLSTATE 42883 errors in production
-- Evidence: grep 'CREATE EXTENSION.*pgcrypto' supabase/migrations/*.sql → No matches
--          grep 'gen_random_' supabase/migrations/*.sql → 37 occurrences across 11 files
-- ============================================

-- Enable pgcrypto extension for cryptographic functions
-- This extension provides gen_random_uuid() and gen_random_bytes()
-- MUST run BEFORE all other migrations that use these functions
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Verify extension is available
DO $$
BEGIN
  -- Test gen_random_uuid() is available
  PERFORM gen_random_uuid();
  RAISE NOTICE 'pgcrypto extension verified: gen_random_uuid() is available';
EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION 'pgcrypto extension verification failed: %', SQLERRM;
END
$$;
