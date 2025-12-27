-- ============================================
-- MAJSTER.AI - DATABASE VERIFICATION SCRIPT
-- ============================================
-- Run this script in Supabase SQL Editor to verify complete database structure
-- Project: xwvxqhhnozfrjcjmcltv (majster-ai-prod)
--
-- Expected Results:
-- - 33 tables in public schema
-- - All tables have RLS enabled
-- - 3 PostgreSQL functions
-- - 1 storage bucket (logos)
-- - Multiple indexes for performance

-- ============================================
-- 1. LIST ALL TABLES WITH COLUMN COUNT
-- ============================================
SELECT
  table_name,
  (SELECT COUNT(*)
   FROM information_schema.columns
   WHERE table_schema = 'public'
   AND table_name = t.table_name) as column_count
FROM information_schema.tables t
WHERE table_schema = 'public'
  AND table_type = 'BASE TABLE'
ORDER BY table_name;

-- ============================================
-- 2. VERIFY ALL EXPECTED TABLES EXIST
-- ============================================
DO $$
DECLARE
  expected_tables TEXT[] := ARRAY[
    'clients',
    'projects',
    'quotes',
    'pdf_data',
    'profiles',
    'item_templates',
    'quote_versions',
    'offer_sends',
    'calendar_events',
    'onboarding_progress',
    'notifications',
    'project_photos',
    'purchase_costs',
    'offer_approvals',
    'team_members',
    'team_locations',
    'subcontractors',
    'subcontractor_services',
    'subcontractor_reviews',
    'work_tasks',
    'financial_reports',
    'api_keys',
    'ai_chat_history',
    'company_documents',
    'user_consents',
    'user_subscriptions',
    'subscription_events',
    'push_tokens',
    'user_roles',
    'api_rate_limits',
    'organizations',
    'organization_members',
    'biometric_credentials'
  ];
  missing_tables TEXT[];
  tbl TEXT;
  total_expected INTEGER;
  total_found INTEGER;
BEGIN
  total_expected := array_length(expected_tables, 1);
  total_found := 0;

  FOREACH tbl IN ARRAY expected_tables
  LOOP
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_name = tbl
    ) THEN
      missing_tables := array_append(missing_tables, tbl);
    ELSE
      total_found := total_found + 1;
    END IF;
  END LOOP;

  RAISE NOTICE '╔════════════════════════════════════════════════════════════╗';
  RAISE NOTICE '║  TABLE VERIFICATION RESULTS                                ║';
  RAISE NOTICE '╚════════════════════════════════════════════════════════════╝';
  RAISE NOTICE '';
  RAISE NOTICE 'Expected tables: % / %', total_found, total_expected;
  RAISE NOTICE '';

  IF array_length(missing_tables, 1) > 0 THEN
    RAISE NOTICE '❌ MISSING TABLES: %', array_to_string(missing_tables, ', ');
    RAISE NOTICE '';
    RAISE NOTICE '⚠️  ACTION REQUIRED: Run missing migrations!';
  ELSE
    RAISE NOTICE '✅ ALL EXPECTED TABLES EXIST!';
  END IF;
  RAISE NOTICE '';
END $$;

-- ============================================
-- 3. VERIFY RLS IS ENABLED ON ALL TABLES
-- ============================================
SELECT
  '3. RLS Status' as section,
  tablename,
  CASE
    WHEN rowsecurity THEN '✅ Enabled'
    ELSE '❌ DISABLED - FIX IMMEDIATELY!'
  END as rls_status
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;

-- Summary of RLS
SELECT
  '3. RLS Summary' as section,
  COUNT(*) as total_tables,
  SUM(CASE WHEN rowsecurity THEN 1 ELSE 0 END) as rls_enabled,
  SUM(CASE WHEN rowsecurity THEN 0 ELSE 1 END) as rls_disabled
FROM pg_tables
WHERE schemaname = 'public';

-- ============================================
-- 4. COUNT RLS POLICIES PER TABLE
-- ============================================
SELECT
  '4. RLS Policies' as section,
  tablename,
  COUNT(*) as policy_count
FROM pg_policies
WHERE schemaname = 'public'
GROUP BY tablename
ORDER BY tablename;

-- Summary of policies
SELECT
  '4. Policies Summary' as section,
  COUNT(DISTINCT tablename) as tables_with_policies,
  COUNT(*) as total_policies
FROM pg_policies
WHERE schemaname = 'public';

-- ============================================
-- 5. VERIFY STORAGE BUCKETS
-- ============================================
SELECT
  '5. Storage Buckets' as section,
  id,
  name,
  CASE
    WHEN public THEN '✅ Public'
    ELSE '🔒 Private'
  END as visibility
FROM storage.buckets;

-- ============================================
-- 6. VERIFY POSTGRESQL FUNCTIONS
-- ============================================
SELECT
  '6. Functions' as section,
  routine_name,
  routine_type,
  '✅ Exists' as status
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name IN (
    'handle_new_user',
    'update_profiles_updated_at',
    'sync_subscription_from_stripe'
  )
ORDER BY routine_name;

-- Check if all expected functions exist
DO $$
DECLARE
  expected_functions TEXT[] := ARRAY[
    'handle_new_user',
    'update_profiles_updated_at',
    'sync_subscription_from_stripe'
  ];
  missing_functions TEXT[];
  func TEXT;
BEGIN
  FOREACH func IN ARRAY expected_functions
  LOOP
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.routines
      WHERE routine_schema = 'public'
      AND routine_name = func
    ) THEN
      missing_functions := array_append(missing_functions, func);
    END IF;
  END LOOP;

  IF array_length(missing_functions, 1) > 0 THEN
    RAISE NOTICE '❌ Missing functions: %', array_to_string(missing_functions, ', ');
  ELSE
    RAISE NOTICE '✅ All expected functions exist!';
  END IF;
END $$;

-- ============================================
-- 7. VERIFY INDEXES
-- ============================================
SELECT
  '7. Indexes' as section,
  schemaname,
  tablename,
  indexname,
  '✅ Created' as status
FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY tablename, indexname;

-- Count indexes per table
SELECT
  '7. Indexes Summary' as section,
  tablename,
  COUNT(*) as index_count
FROM pg_indexes
WHERE schemaname = 'public'
GROUP BY tablename
ORDER BY index_count DESC, tablename;

-- ============================================
-- 8. CHECK TRIGGERS
-- ============================================
SELECT
  '8. Triggers' as section,
  trigger_name,
  event_object_table as table_name,
  action_timing || ' ' || event_manipulation as trigger_type,
  '✅ Active' as status
FROM information_schema.triggers
WHERE trigger_schema = 'public'
ORDER BY event_object_table, trigger_name;

-- ============================================
-- 9. VERIFY FOREIGN KEY CONSTRAINTS
-- ============================================
SELECT
  '9. Foreign Keys' as section,
  tc.table_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name,
  '✅ Linked' as status
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_schema = 'public'
ORDER BY tc.table_name, kcu.column_name;

-- ============================================
-- 10. CHECK MIGRATION HISTORY
-- ============================================
SELECT
  '10. Migration History' as section,
  version,
  name,
  '✅ Applied' as status
FROM supabase_migrations.schema_migrations
ORDER BY version DESC
LIMIT 20;

-- Count migrations
SELECT
  '10. Migration Summary' as section,
  COUNT(*) as total_migrations_applied
FROM supabase_migrations.schema_migrations;

-- ============================================
-- 11. FINAL SUMMARY
-- ============================================
DO $$
DECLARE
  table_count INTEGER;
  rls_enabled_count INTEGER;
  function_count INTEGER;
  bucket_count INTEGER;
  policy_count INTEGER;
  index_count INTEGER;
  trigger_count INTEGER;
  all_ok BOOLEAN := true;
BEGIN
  -- Count tables
  SELECT COUNT(*) INTO table_count
  FROM information_schema.tables
  WHERE table_schema = 'public' AND table_type = 'BASE TABLE';

  -- Count RLS enabled tables
  SELECT COUNT(*) INTO rls_enabled_count
  FROM pg_tables
  WHERE schemaname = 'public' AND rowsecurity = true;

  -- Count functions
  SELECT COUNT(*) INTO function_count
  FROM information_schema.routines
  WHERE routine_schema = 'public'
  AND routine_name IN ('handle_new_user', 'update_profiles_updated_at', 'sync_subscription_from_stripe');

  -- Count buckets
  SELECT COUNT(*) INTO bucket_count
  FROM storage.buckets;

  -- Count policies
  SELECT COUNT(*) INTO policy_count
  FROM pg_policies
  WHERE schemaname = 'public';

  -- Count indexes
  SELECT COUNT(*) INTO index_count
  FROM pg_indexes
  WHERE schemaname = 'public';

  -- Count triggers
  SELECT COUNT(*) INTO trigger_count
  FROM information_schema.triggers
  WHERE trigger_schema = 'public';

  RAISE NOTICE '╔════════════════════════════════════════════════════════════╗';
  RAISE NOTICE '║  DATABASE VERIFICATION - FINAL SUMMARY                     ║';
  RAISE NOTICE '╚════════════════════════════════════════════════════════════╝';
  RAISE NOTICE '';
  RAISE NOTICE 'Tables:           % / 33 expected', table_count;
  RAISE NOTICE 'RLS Enabled:      % / 33 expected', rls_enabled_count;
  RAISE NOTICE 'Functions:        % / 3 expected', function_count;
  RAISE NOTICE 'Storage Buckets:  % / 1 expected', bucket_count;
  RAISE NOTICE 'RLS Policies:     %', policy_count;
  RAISE NOTICE 'Indexes:          %', index_count;
  RAISE NOTICE 'Triggers:         %', trigger_count;
  RAISE NOTICE '';

  -- Check if everything is OK
  IF table_count < 33 THEN
    RAISE NOTICE '❌ ISSUE: Missing tables (found %, expected 33)', table_count;
    all_ok := false;
  END IF;

  IF rls_enabled_count < 33 THEN
    RAISE NOTICE '❌ ISSUE: Some tables dont have RLS enabled!';
    all_ok := false;
  END IF;

  IF function_count < 3 THEN
    RAISE NOTICE '❌ ISSUE: Missing functions (found %, expected 3)', function_count;
    all_ok := false;
  END IF;

  IF bucket_count < 1 THEN
    RAISE NOTICE '❌ ISSUE: Storage bucket "logos" is missing!';
    all_ok := false;
  END IF;

  IF all_ok THEN
    RAISE NOTICE '╔════════════════════════════════════════════════════════════╗';
    RAISE NOTICE '║  ✅ SUCCESS! DATABASE IS FULLY DEPLOYED                   ║';
    RAISE NOTICE '╚════════════════════════════════════════════════════════════╝';
    RAISE NOTICE '';
    RAISE NOTICE 'All tables, functions, and configurations are in place!';
    RAISE NOTICE 'Your Majster.AI database is ready to use.';
  ELSE
    RAISE NOTICE '╔════════════════════════════════════════════════════════════╗';
    RAISE NOTICE '║  ⚠️  WARNING: DATABASE SETUP INCOMPLETE                   ║';
    RAISE NOTICE '╚════════════════════════════════════════════════════════════╝';
    RAISE NOTICE '';
    RAISE NOTICE 'Please review the issues above and run missing migrations.';
    RAISE NOTICE 'See DEPLOYMENT_INSTRUCTIONS.md for help.';
  END IF;
  RAISE NOTICE '';
END $$;
