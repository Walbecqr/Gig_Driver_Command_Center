# Uber Import Schema Migrations

Ordered migration set for Postgres/Supabase.

> [!WARNING]
> Deprecated prototype only. These files are retained for historical context,
> but they are superseded by `supabase/migrations/20260329000001_csv_import_schema.sql`
> (the tracked migration used by the project). Do not apply this folder directly
> in new environments unless you are intentionally reproducing prototype history.

## Execution order

1. `001_extensions.sql`
2. `002_enums.sql`
3. `003_core_tables.sql`
4. `004_indexes.sql`
5. `005_triggers.sql`
6. `006_views.sql`
7. `007_rls.sql`

## Notes

- Assumes PostgreSQL 15+.
- Assumes `auth.uid()` is available if using Supabase RLS.
- Assumes app auth user IDs map directly to `public.users.user_id`.
- If you use a separate profile mapping table, adjust `007_rls.sql`.
- `idx_trips_unique_platform_trip_per_account` was intentionally not added as a hard uniqueness constraint because real-world source data may require fuzzier reconciliation first.
