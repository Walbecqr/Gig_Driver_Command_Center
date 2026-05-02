-- Run in Supabase SQL Editor to find FK columns still missing indexes.
-- Expected result: 0 rows after the pitfall corrections migration is applied.
SELECT
  tc.table_name,
  kcu.column_name,
  'CREATE INDEX IF NOT EXISTS idx_' || tc.table_name || '_' || kcu.column_name
    || ' ON public.' || tc.table_name || '(' || kcu.column_name || ');' AS suggested_fix
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
LEFT JOIN pg_indexes pi
  ON pi.tablename = tc.table_name
  AND pi.schemaname = 'public'
  AND pi.indexdef LIKE '%(' || kcu.column_name || ')%'
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_schema = 'public'
  AND pi.indexname IS NULL
ORDER BY tc.table_name, kcu.column_name;
