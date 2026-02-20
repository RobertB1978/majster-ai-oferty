-- ============================================
-- CRITICAL FIX: Security Audit - Dec 2025
-- Fixes: CRITICAL-02 from AUDIT_REPORT_2025-12-16.md
-- ============================================
--
-- Issue: Storage bucket 'logos' is PUBLIC
-- Risk: Anyone can view all company logos without authorization
-- Impact: Data leak, privacy violation
--
-- Fix: Change bucket to private, serve via signed URLs
-- ============================================

-- FIX-01: Change 'logos' bucket from public to private
UPDATE storage.buckets
SET public = false
WHERE id = 'logos'
  AND public = true;

-- Verify the change
DO $$
DECLARE
  bucket_public boolean;
BEGIN
  SELECT public INTO bucket_public
  FROM storage.buckets
  WHERE id = 'logos';

  IF bucket_public = true THEN
    RAISE EXCEPTION 'CRITICAL: logos bucket is still public after update!';
  END IF;

  RAISE NOTICE 'SUCCESS: logos bucket is now private';
END $$;

-- ============================================
-- Migration Notes:
-- ============================================
--
-- BREAKING CHANGE: After this migration, logos will NOT be publicly accessible
-- via direct URLs like: https://project.supabase.co/storage/v1/object/public/logos/...
--
-- Frontend changes required:
-- 1. Update logo fetching to use signed URLs:
--    const { data } = await supabase.storage
--      .from('logos')
--      .createSignedUrl('path/to/logo.png', 3600)
--
-- 2. Or create Edge Function to serve logos with RLS check:
--    GET /functions/v1/get-logo/{user_id}
--
-- Alternative approach (if logos need to be public):
-- - Keep bucket public but use UUID filenames (harder to enumerate)
-- - Add CDN in front with access control
--
-- Decision: Keeping private for maximum security (follows audit recommendation)
-- ============================================
