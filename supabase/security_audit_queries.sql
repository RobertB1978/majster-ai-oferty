-- ============================================
-- SUPABASE SECURITY AUDIT - QUERIES
-- ============================================
-- Wykonaj te queries w Supabase SQL Editor
-- Kopiuj wyniki i wklej do odpowiedzi

-- ============================================
-- QUERY 1: Migration Status
-- ============================================
SELECT 
  version,
  name,
  'Applied' as status
FROM supabase_migrations.schema_migrations
ORDER BY version DESC
LIMIT 25;

-- ============================================
-- QUERY 2: Extensions Status
-- ============================================
SELECT 
  extname,
  extversion,
  'Installed' as status
FROM pg_extension
WHERE extname IN ('pgcrypto', 'uuid-ossp', 'pg_trgm', 'unaccent');

-- ============================================
-- QUERY 3: ALL Tables with RLS Status
-- ============================================
SELECT
  schemaname,
  tablename,
  rowsecurity as rls_enabled,
  CASE 
    WHEN rowsecurity THEN '✅ ENABLED'
    ELSE '❌ DISABLED'
  END as status
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;

-- ============================================
-- QUERY 4: RLS Policies Count per Table
-- ============================================
SELECT
  schemaname,
  tablename,
  COUNT(*) as policy_count,
  array_agg(policyname) as policy_names
FROM pg_policies
WHERE schemaname = 'public'
GROUP BY schemaname, tablename
ORDER BY tablename;

-- ============================================
-- QUERY 5: Dangerous ANON/PUBLIC Policies
-- ============================================
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE schemaname = 'public'
  AND (
    roles::text ILIKE '%anon%'
    OR roles::text ILIKE '%public%'
  )
ORDER BY tablename, policyname;

-- ============================================
-- QUERY 6: Table Grants for ANON role
-- ============================================
SELECT
  table_schema,
  table_name,
  privilege_type,
  grantee,
  is_grantable
FROM information_schema.table_privileges
WHERE grantee IN ('anon', 'public', 'authenticated')
  AND table_schema = 'public'
ORDER BY table_name, grantee, privilege_type;

-- ============================================
-- QUERY 7: Tables WITHOUT RLS (Critical!)
-- ============================================
SELECT
  tablename,
  '❌ NO RLS - CRITICAL!' as security_issue
FROM pg_tables
WHERE schemaname = 'public'
  AND rowsecurity = false
ORDER BY tablename;

-- ============================================
-- QUERY 8: Foreign Keys Verification
-- ============================================
SELECT
  tc.table_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name,
  rc.delete_rule,
  rc.update_rule
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
JOIN information_schema.referential_constraints AS rc
  ON tc.constraint_name = rc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_schema = 'public'
ORDER BY tc.table_name, kcu.column_name;

-- ============================================
-- QUERY 9: Storage Buckets Status
-- ============================================
SELECT
  id,
  name,
  public,
  CASE
    WHEN public THEN '⚠️  PUBLIC BUCKET'
    ELSE '🔒 Private'
  END as visibility_status,
  created_at
FROM storage.buckets
ORDER BY name;

-- ============================================
-- QUERY 10: Storage RLS Policies
-- ============================================
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies
WHERE schemaname = 'storage'
  AND tablename = 'objects'
ORDER BY policyname;

-- ============================================
-- QUERY 11: Missing Indexes on user_id
-- ============================================
SELECT
  t.tablename,
  c.column_name,
  CASE
    WHEN i.indexname IS NULL THEN '❌ MISSING INDEX on user_id'
    ELSE '✅ Has index: ' || i.indexname
  END as index_status
FROM pg_tables t
JOIN information_schema.columns c
  ON t.tablename = c.table_name
  AND t.schemaname = c.table_schema
LEFT JOIN pg_indexes i
  ON t.tablename = i.tablename
  AND t.schemaname = i.schemaname
  AND i.indexdef ILIKE '%' || c.column_name || '%'
WHERE t.schemaname = 'public'
  AND c.column_name = 'user_id'
ORDER BY t.tablename;

-- ============================================
-- QUERY 12: Auth Configuration
-- ============================================
-- Note: To run this, go to Dashboard → Authentication → Settings
-- and manually verify:
-- - Email confirmation enabled
-- - Password strength requirements
-- - JWT expiry settings
-- - Allowed redirect URLs

-- ============================================
-- QUERY 13: Test RLS as ANON (Security Test)
-- ============================================
-- WARNING: This will attempt to read data as anon role
-- Expected result: 0 rows (if RLS works correctly)

SET ROLE anon;
SELECT COUNT(*) as anon_can_see_clients FROM public.clients;
SELECT COUNT(*) as anon_can_see_projects FROM public.projects;
SELECT COUNT(*) as anon_can_see_quotes FROM public.quotes;
RESET ROLE;

-- ============================================
-- QUERY 14: Performance Issues (pg_stat_user_tables)
-- ============================================
SELECT
  schemaname,
  relname as table_name,
  seq_scan,
  seq_tup_read,
  idx_scan,
  idx_tup_fetch,
  n_tup_ins,
  n_tup_upd,
  n_tup_del,
  CASE
    WHEN seq_scan > idx_scan AND seq_scan > 1000 THEN '⚠️  High sequential scans - needs index'
    ELSE '✅ OK'
  END as performance_status
FROM pg_stat_user_tables
WHERE schemaname = 'public'
ORDER BY seq_scan DESC
LIMIT 20;

