# 🔒 SUPABASE SECURITY AUDIT - FINAL VERIFICATION

**Project:** majster-ai-prod (`xwvxqhhnozfrjcjmcltv`)
**Date:** 2025-12-27
**Status:** AWAITING EVIDENCE

---

## QUERIES DO URUCHOMIENIA (Skopiuj i wklej w SQL Editor)

```sql
-- [1] TABLES COUNT + LIST
SELECT
  COUNT(*) OVER() as total_tables,
  tablename,
  CASE WHEN rowsecurity THEN 'RLS:ON' ELSE 'RLS:OFF' END as rls_status
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;

-- [2] TABLES WITHOUT RLS
SELECT tablename, 'NO RLS!' as issue
FROM pg_tables
WHERE schemaname = 'public' AND rowsecurity = false
ORDER BY tablename;

-- [3] POLICIES COUNT + POLICIES PER TABLE
SELECT
  tablename,
  COUNT(*) as policy_count,
  string_agg(policyname, ', ') as policies
FROM pg_policies
WHERE schemaname = 'public'
GROUP BY tablename
ORDER BY tablename;

-- [4] ANON VISIBILITY TEST
SET ROLE anon;
SELECT 'clients' as table_name, COUNT(*) as visible_rows FROM public.clients
UNION ALL
SELECT 'projects', COUNT(*) FROM public.projects
UNION ALL
SELECT 'quotes', COUNT(*) FROM public.quotes
UNION ALL
SELECT 'profiles', COUNT(*) FROM public.profiles
UNION ALL
SELECT 'item_templates', COUNT(*) FROM public.item_templates;
RESET ROLE;

-- [5] GRANTS CHECK (opcjonalne)
SELECT
  table_name,
  grantee,
  string_agg(privilege_type, ', ') as privileges
FROM information_schema.table_privileges
WHERE table_schema = 'public'
  AND grantee IN ('anon', 'public', 'authenticated')
GROUP BY table_name, grantee
ORDER BY table_name, grantee;
```

---

## WKLEJ TUTAJ WYNIKI:

### [1] TABLES COUNT + LIST
```
<WKLEJ WYNIK QUERY 1>
```

### [2] TABLES WITHOUT RLS
```
<WKLEJ WYNIK QUERY 2>
```

### [3] POLICIES COUNT + POLICIES PER TABLE
```
<WKLEJ WYNIK QUERY 3>
```

### [4] ANON VISIBILITY TEST
```
<WKLEJ WYNIK QUERY 4>
```

### [5] GRANTS CHECK (opcjonalne)
```
<WKLEJ WYNIK QUERY 5>
```

---

## A) EXECUTIVE VERDICT

**Status:** [ AWAITING EVIDENCE ]

**Reasoning:**
- [ ] TBD based on evidence
- [ ] TBD based on evidence
- [ ] TBD based on evidence

---

## B) EVIDENCE LOG

| Symptom | Evidence | Conclusion | Fix |
|---------|----------|------------|-----|
| TBD | TBD | TBD | TBD |

---

## C) BLOCKERS (if any)

### P0 Blockers:
None yet (awaiting evidence)

### P1 Issues:
None yet (awaiting evidence)

---

## D) 5-MINUTE SMOKE TEST CHECKLIST

**After SQL verification passes:**

1. [ ] Supabase Dashboard → Database → Tables: Verify 33 tables visible
2. [ ] Click on `clients` table → Check RLS badge is GREEN
3. [ ] Click on `clients` table → Policies tab: Verify 4 policies exist
4. [ ] Supabase Dashboard → Authentication → Users: Create test user
5. [ ] Local app → Register with test email
6. [ ] Check if profile was auto-created (profiles table should have 1 row with new user_id)
7. [ ] Create a test client in app
8. [ ] Check clients table - verify only authenticated user sees their client
9. [ ] Try to read clients table as anon (SQL Editor, set role anon) → expect 0 rows
10. [ ] Delete test user → verify CASCADE deleted all related data

---

**NEXT: Run queries above and paste results here.**
