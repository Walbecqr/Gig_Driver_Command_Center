-- Run in Supabase SQL Editor or via: supabase db execute --file scripts/audit_rls.sql
-- Expected result for all queries: 0 rows

-- Tables without RLS enabled
SELECT schemaname, tablename
FROM pg_tables
WHERE schemaname = 'public'
  AND rowsecurity = false
  AND tablename NOT LIKE '\_%';

-- Overly permissive write policies
SELECT tablename, policyname, cmd, qual
FROM pg_policies
WHERE schemaname = 'public'
  AND cmd IN ('INSERT', 'UPDATE', 'DELETE')
  AND (qual = 'true' OR qual = '(auth.uid() IS NOT NULL)');

-- UPDATE policies without a matching SELECT policy (silent zero-row bug)
SELECT DISTINCT p1.tablename
FROM pg_policies p1
WHERE p1.schemaname = 'public'
  AND p1.cmd = 'UPDATE'
  AND NOT EXISTS (
    SELECT 1 FROM pg_policies p2
    WHERE p2.schemaname = 'public'
      AND p2.tablename = p1.tablename
      AND p2.cmd IN ('SELECT', 'ALL')
  );
