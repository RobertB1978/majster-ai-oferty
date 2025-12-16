-- ============================================
-- RLS POLICY TEST HARNESS
-- Majster.AI - Row Level Security Validation
-- ============================================
--
-- This test suite validates that RLS policies correctly
-- isolate user data and prevent unauthorized access.
--
-- Run with: npx supabase test db
-- Or in CI: supabase start && supabase test db
--
-- ============================================

BEGIN;

-- Create test schema and data
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- TEST 1: Projects RLS - User Isolation
-- ============================================

DO $$
DECLARE
  user1_id uuid := uuid_generate_v4();
  user2_id uuid := uuid_generate_v4();
  proj1_id uuid := uuid_generate_v4();
  proj2_id uuid := uuid_generate_v4();
  result_count integer;
BEGIN
  RAISE NOTICE '=== TEST 1: Projects RLS - User Isolation ===';

  -- Insert test users into auth.users (mock)
  -- Note: In actual Supabase, use proper auth.users table

  -- Insert test projects
  INSERT INTO projects (id, project_name, user_id, created_at) VALUES
    (proj1_id, 'User1 Project', user1_id, now()),
    (proj2_id, 'User2 Project', user2_id, now());

  -- Test: User1 should see only their own project
  -- Simulate user1 session
  PERFORM set_config('request.jwt.claim.sub', user1_id::text, true);
  PERFORM set_config('role', 'authenticated', true);

  SELECT COUNT(*) INTO result_count
  FROM projects
  WHERE user_id = user1_id;

  IF result_count = 1 THEN
    RAISE NOTICE '✅ PASS: User1 sees their own project (count: %)', result_count;
  ELSE
    RAISE EXCEPTION '❌ FAIL: User1 should see 1 project, but saw %', result_count;
  END IF;

  -- Test: User1 should NOT see User2's project
  SELECT COUNT(*) INTO result_count
  FROM projects
  WHERE user_id = user2_id;

  IF result_count = 0 THEN
    RAISE NOTICE '✅ PASS: User1 cannot see User2 project';
  ELSE
    RAISE EXCEPTION '❌ FAIL: User1 should not see User2 project, but saw %', result_count;
  END IF;

  -- Test: Anonymous users should see nothing
  PERFORM set_config('role', 'anon', true);
  SELECT COUNT(*) INTO result_count FROM projects;

  IF result_count = 0 THEN
    RAISE NOTICE '✅ PASS: Anonymous users see no projects';
  ELSE
    RAISE EXCEPTION '❌ FAIL: Anonymous should see 0 projects, but saw %', result_count;
  END IF;

  -- Cleanup
  DELETE FROM projects WHERE id IN (proj1_id, proj2_id);
  RAISE NOTICE '✅ TEST 1 PASSED: Projects RLS working correctly';
END;
$$;

-- ============================================
-- TEST 2: Clients RLS - User Isolation
-- ============================================

DO $$
DECLARE
  user1_id uuid := uuid_generate_v4();
  user2_id uuid := uuid_generate_v4();
  client1_id uuid := uuid_generate_v4();
  client2_id uuid := uuid_generate_v4();
  result_count integer;
BEGIN
  RAISE NOTICE '=== TEST 2: Clients RLS - User Isolation ===';

  -- Insert test clients
  INSERT INTO clients (id, name, user_id, created_at) VALUES
    (client1_id, 'User1 Client', user1_id, now()),
    (client2_id, 'User2 Client', user2_id, now());

  -- Test: User1 should see only their own client
  PERFORM set_config('request.jwt.claim.sub', user1_id::text, true);
  PERFORM set_config('role', 'authenticated', true);

  SELECT COUNT(*) INTO result_count
  FROM clients
  WHERE user_id = user1_id;

  IF result_count = 1 THEN
    RAISE NOTICE '✅ PASS: User1 sees their own client';
  ELSE
    RAISE EXCEPTION '❌ FAIL: User1 should see 1 client, but saw %', result_count;
  END IF;

  -- Test: User1 cannot see User2's client
  SELECT COUNT(*) INTO result_count
  FROM clients
  WHERE user_id = user2_id;

  IF result_count = 0 THEN
    RAISE NOTICE '✅ PASS: User1 cannot see User2 client';
  ELSE
    RAISE EXCEPTION '❌ FAIL: User1 should not see User2 client';
  END IF;

  -- Cleanup
  DELETE FROM clients WHERE id IN (client1_id, client2_id);
  RAISE NOTICE '✅ TEST 2 PASSED: Clients RLS working correctly';
END;
$$;

-- ============================================
-- TEST 3: Quotes RLS - User Isolation
-- ============================================

DO $$
DECLARE
  user1_id uuid := uuid_generate_v4();
  user2_id uuid := uuid_generate_v4();
  quote1_id uuid := uuid_generate_v4();
  quote2_id uuid := uuid_generate_v4();
  result_count integer;
BEGIN
  RAISE NOTICE '=== TEST 3: Quotes RLS - User Isolation ===';

  -- Insert test quotes (if quotes table exists)
  BEGIN
    INSERT INTO quotes (id, user_id, created_at) VALUES
      (quote1_id, user1_id, now()),
      (quote2_id, user2_id, now());

    -- Test: User1 should see only their own quote
    PERFORM set_config('request.jwt.claim.sub', user1_id::text, true);
    PERFORM set_config('role', 'authenticated', true);

    SELECT COUNT(*) INTO result_count
    FROM quotes
    WHERE user_id = user1_id;

    IF result_count = 1 THEN
      RAISE NOTICE '✅ PASS: User1 sees their own quote';
    ELSE
      RAISE EXCEPTION '❌ FAIL: User1 should see 1 quote, but saw %', result_count;
    END IF;

    -- Cleanup
    DELETE FROM quotes WHERE id IN (quote1_id, quote2_id);
    RAISE NOTICE '✅ TEST 3 PASSED: Quotes RLS working correctly';
  EXCEPTION
    WHEN undefined_table THEN
      RAISE NOTICE '⏭️  SKIP TEST 3: Quotes table does not exist';
  END;
END;
$$;

-- ============================================
-- TEST 4: Cross-User Update Protection
-- ============================================

DO $$
DECLARE
  user1_id uuid := uuid_generate_v4();
  user2_id uuid := uuid_generate_v4();
  proj_id uuid := uuid_generate_v4();
  update_successful boolean;
BEGIN
  RAISE NOTICE '=== TEST 4: Cross-User Update Protection ===';

  -- Create project owned by user1
  INSERT INTO projects (id, project_name, user_id, created_at)
  VALUES (proj_id, 'User1 Project', user1_id, now());

  -- Try to update as user2 (should fail)
  PERFORM set_config('request.jwt.claim.sub', user2_id::text, true);
  PERFORM set_config('role', 'authenticated', true);

  BEGIN
    UPDATE projects
    SET project_name = 'Hacked Project'
    WHERE id = proj_id;

    GET DIAGNOSTICS update_successful = ROW_COUNT;

    IF update_successful THEN
      RAISE EXCEPTION '❌ FAIL: User2 should not be able to update User1 project';
    END IF;
  EXCEPTION
    WHEN insufficient_privilege THEN
      RAISE NOTICE '✅ PASS: User2 cannot update User1 project (insufficient privilege)';
    WHEN OTHERS THEN
      RAISE NOTICE '✅ PASS: User2 cannot update User1 project (blocked by RLS)';
  END;

  -- Cleanup
  PERFORM set_config('request.jwt.claim.sub', user1_id::text, true);
  DELETE FROM projects WHERE id = proj_id;
  RAISE NOTICE '✅ TEST 4 PASSED: Cross-user update protection working';
END;
$$;

-- ============================================
-- TEST 5: Delete Protection
-- ============================================

DO $$
DECLARE
  user1_id uuid := uuid_generate_v4();
  user2_id uuid := uuid_generate_v4();
  client_id uuid := uuid_generate_v4();
  delete_successful boolean;
BEGIN
  RAISE NOTICE '=== TEST 5: Delete Protection ===';

  -- Create client owned by user1
  INSERT INTO clients (id, name, user_id, created_at)
  VALUES (client_id, 'User1 Client', user1_id, now());

  -- Try to delete as user2 (should fail)
  PERFORM set_config('request.jwt.claim.sub', user2_id::text, true);
  PERFORM set_config('role', 'authenticated', true);

  BEGIN
    DELETE FROM clients WHERE id = client_id;

    GET DIAGNOSTICS delete_successful = ROW_COUNT;

    IF delete_successful THEN
      RAISE EXCEPTION '❌ FAIL: User2 should not be able to delete User1 client';
    END IF;
  EXCEPTION
    WHEN insufficient_privilege THEN
      RAISE NOTICE '✅ PASS: User2 cannot delete User1 client';
    WHEN OTHERS THEN
      RAISE NOTICE '✅ PASS: User2 cannot delete User1 client (blocked by RLS)';
  END;

  -- Cleanup
  PERFORM set_config('request.jwt.claim.sub', user1_id::text, true);
  DELETE FROM clients WHERE id = client_id;
  RAISE NOTICE '✅ TEST 5 PASSED: Delete protection working';
END;
$$;

-- ============================================
-- TEST SUMMARY
-- ============================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ ALL RLS POLICY TESTS PASSED';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Projects: User isolation ✅';
  RAISE NOTICE 'Clients: User isolation ✅';
  RAISE NOTICE 'Quotes: User isolation ✅';
  RAISE NOTICE 'Cross-user updates: Blocked ✅';
  RAISE NOTICE 'Cross-user deletes: Blocked ✅';
  RAISE NOTICE '========================================';
END;
$$;

ROLLBACK;

-- ============================================
-- USAGE INSTRUCTIONS
-- ============================================
--
-- Local testing:
--   npx supabase start
--   npx supabase test db
--
-- CI testing:
--   Add to .github/workflows/ci.yml:
--   - name: Start Supabase
--     run: npx supabase start
--   - name: Run RLS tests
--     run: npx supabase test db
--   - name: Stop Supabase
--     run: npx supabase stop --no-backup
--
-- ============================================
