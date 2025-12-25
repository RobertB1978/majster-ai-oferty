-- Enable pgcrypto extension for gen_random_uuid() and gen_random_bytes()
-- This MUST run before any migration that uses these functions
-- Idempotent: safe to run multiple times

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Verify extension is enabled
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_extension WHERE extname = 'pgcrypto'
  ) THEN
    RAISE EXCEPTION 'pgcrypto extension failed to install';
  END IF;
END $$;
