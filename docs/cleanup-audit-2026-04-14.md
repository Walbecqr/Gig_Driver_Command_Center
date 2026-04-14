# Cleanup Audit Notes (2026-04-14)

Safe cleanup pass findings for known drift candidates.

## 1) Prototype migrations: `supabase/migrations/uber_weekly _statement_csv_import/`

- **Status:** Obsolete for active deployment flow.
- **Why:** The folder is explicitly promoted/superseded by
  `supabase/migrations/20260329000001_csv_import_schema.sql`, which is the tracked
  migration in normal Supabase migration order.
- **Action now:** Keep files, but mark as deprecated (history/reference only).
- **Removal risk:** Medium. Deleting could break historical references in docs or
  onboarding discussions.

## 2) `datgov_reference/001_public_reference_enums.sql` placeholder

- **Status:** Not present under this repository path.
- **Nearest match:** `supabase/migrations/001_public_reference_enums.sql` exists and
  is a non-placeholder, active migration file.
- **Action now:** No deletion required.

## 3) Duplicate tokenizer/coercion logic in `doordashParser.ts`

- **Status:** Real duplication.
- **Why:** `src/services/ingestion/csvUtils.ts` already provides the same tokenizer,
  column-map, and coercion primitives used by other ingestion parsers.
- **Action now:** Consolidate immediately by importing shared utilities from
  `csvUtils.ts` and removing the private duplicate helpers.
- **Risk:** Low; behavior is aligned or broadened (date parsing and numeric cleanup).

## 4) Parallel account-model drift

Observed parallel models:

- `public.delivery_platform_accounts` (legacy baseline schema)
- `public.platform_accounts` (csv import schema path)
- `core.platform_account` (newer core schema namespace)

### Risk assessment

- **Risk to remove now:** High.
- **Why:** All three appear in migrations and generated types, indicating ongoing
  transition rather than dead code. Direct table removal would be a destructive
  schema change and may break live ingestion or app reads.

### Safe interim cleanup

- Treat this as a migration-plan/documentation task, not a deletion task.
- Keep canonical direction explicit in future migration docs:
  - define source-of-truth model,
  - add compatibility views or backfill plan,
  - then deprecate/drop superseded tables in a later controlled migration.

## Follow-up cleanup (defer)

1. Produce a formal schema unification ADR/migration plan for account entities.
2. Add database-level deprecation comments (`COMMENT ON TABLE ...`) for legacy tables
   once canonical model is agreed.
3. Add a targeted data migration with validation queries before any table drops.
