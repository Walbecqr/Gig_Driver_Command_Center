# Supabase Row Level Security (RLS) — Complete Reference

**Last updated:** 2026-04-20
**Migration baseline:** `20260420000000_audit_optimize`

---

## Schema Overview

The database uses three schemas with distinct access control strategies:

| Schema      | RLS Enabled | Access Model |
|-------------|-------------|--------------|
| `public`    | Yes         | Mix of `auth.uid()` (user-owned) and `auth.role() = 'authenticated'` (shared reference data) |
| `core`      | No          | Service-role only — intentionally no RLS (see Section 4) |
| `analytics` | Partial     | `zone_time_series`: authenticated SELECT; snapshot tables: service-role only |

---

## Section 1: public schema — User-Owned Tables

These tables enforce `user_id = auth.uid()` for all operations. No row belonging to another user is ever visible.

### `public.users`

Managed directly by Supabase Auth. No explicit named RLS policy is needed — Supabase Auth enforces identity at the session level.

### `public.delivery_platform_accounts`

- RLS enabled: `001_init.sql`
- Policy: `FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid())`

### `public.shifts`

- RLS enabled: `001_init.sql`
- Policy: `FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid())`

### `public.platform_accounts`

- RLS enabled: `20260329000001_csv_import_schema.sql`
- Policy `platform_accounts_own_all`: `FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid())`

### `public.import_batches`

- RLS enabled: `20260329000001_csv_import_schema.sql`
- Policy `import_batches_own_all`: `FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid())`

### `public.trips`

- RLS enabled: `20260329000001_csv_import_schema.sql`
- Policy `trips_own_all`: `FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid())`

### `public.reconciliation_issues`

- RLS enabled: `20260329000001_csv_import_schema.sql`
- Policy `reconciliation_issues_own_all`: `FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid())`

### Tables with join-guard policies (no direct `user_id` column)

Ownership is enforced via a parent table with a `user_id` column.

| Table | Parent table | Migration |
|-------|-------------|-----------|
| `raw_import_records` | `import_batches` | `20260329000001_csv_import_schema.sql` |
| `trip_financials` | `trips` | `20260329000001_csv_import_schema.sql` |
| `trip_metrics` | `trips` | `20260329000001_csv_import_schema.sql` |
| `stops` | `trips` | `20260329000001_csv_import_schema.sql` |
| `trip_source_links` | `trips` | `20260329000001_csv_import_schema.sql` |
| `shift_source_links` | `shifts` | `20260329000001_csv_import_schema.sql` |

Example pattern for join-guard policies:

```sql
-- raw_import_records: ownership via import_batches
CREATE POLICY "owner_raw_import_records"
  ON public.raw_import_records
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.import_batches ib
      WHERE ib.import_batch_id = raw_import_records.import_batch_id
        AND ib.user_id = auth.uid()
    )
  );
```

> **Performance note:** Join-guard policies re-evaluate a subquery on every row access. Ensure the parent table's `user_id` column is indexed (all relevant parent tables have this index).

---

## Section 2: public schema — Shared Reference Tables

These tables contain shared, read-mostly data (zone overlays, demographics, weather alerts). Any authenticated user can read and write; deletions require service-role.

### Policy pattern

```sql
-- SELECT / INSERT / UPDATE: any authenticated user
USING (auth.role() = 'authenticated')
WITH CHECK (auth.role() = 'authenticated')

-- DELETE: not granted to authenticated role (service-role only)
```

### Tables using this pattern

| Table | Migration |
|-------|-----------|
| `public.reference_datasets` | `20260414060000_reference_backbone.sql` |
| `public.reference_ingest_batches` | `20260414060000_reference_backbone.sql` |
| `public.reference_features` | `20260414060000_reference_backbone.sql` |
| `public.external_condition_alerts` | `20260414060000_reference_backbone.sql` |
| `public.zone_risk_layers` | `20260414060001_reference_overlay_tables.sql` |
| `public.zone_transport_layers` | `20260414060001_reference_overlay_tables.sql` |
| `public.zone_reference_layers` | `20260414060001_reference_overlay_tables.sql` |
| `public.zone_demand_drivers` | `20260414060001_reference_overlay_tables.sql` |
| `public.poi_reference` | `20260414060001_reference_overlay_tables.sql` |
| `public.zone_land_use_layers` | `20260414060001_reference_overlay_tables.sql` |
| `public.infrastructure_reference` | `20260414060001_reference_overlay_tables.sql` |
| `public.zone_demographics` | `20260414060001_reference_overlay_tables.sql` |
| `public.zone_metric_registry` | `20260414060001_reference_overlay_tables.sql` |
| `public.merchant_locations` | `20260329000002_kaggle_datasets.sql` (recreated in `20260414050534`) |
| `public.external_conditions` | `20260329000002_kaggle_datasets.sql` (recreated in `20260414050534`) |

---

## Section 3: analytics schema — Partial RLS

### `analytics.zone_time_series`

- RLS enabled: `20260329000000_h3_zones.sql`
- Policy `zone_time_series_select`:
  ```sql
  FOR SELECT TO authenticated USING (true)
  ```
  Any authenticated user can read all zone time series data. There is no per-user filter because this is pre-aggregated, non-personal analytics data.
- INSERT / UPDATE / DELETE: service-role only (no policy for authenticated role).

### `analytics.session_metrics`, `analytics.merchant_performance_snapshot`, `analytics.zone_performance_snapshot`

- RLS: **not enabled**
- These tables are written and read exclusively by backend analytics pipelines using the service role. The mobile app does not query them directly via the anon/authenticated key.
- If direct app access is ever needed, enable RLS and add appropriate policies before exposing these tables.

---

## Section 4: core schema — Service-Role Isolation

### Why `core` has no RLS

All `core.*` tables have RLS deliberately disabled. The `core` schema is the canonical operational data store accessed exclusively by the backend service layer using the Supabase **service role key**. The service role bypasses RLS unconditionally.

The mobile app (using the anon or authenticated key) never queries `core.*` directly. Data flows are:

```
App writes   → public.*  (user-owned tables with RLS)
                 ↓
Backend sync → core.*    (service role only, via background service)
                 ↓
App reads    → public.*/analytics.*  (back through RLS-protected tables)
```

### Core schema tables (no RLS — service-role only)

All tables in `core.*` as defined in `20260328010236_remote_schema.sql`:

- `core.driver` — driver profile; synced from `public.users`
- `core.work_session` — operational shift data
- `core.platform_account`, `core.platform`, `core.market`, `core.zone`
- `core.offer`, `core.offer_decision`, `core.offer_dropoff`, `core.offer_merchant`
- `core.delivery_order`, `core.delivery_stop`, `core.delivery_issue`
- `core.earning_event`, `core.expense`, `core.mileage_log`
- `core.vehicle`, `core.location`, `core.merchant`
- `core.capture_event`, `core.asset`
- `core.decision_rule`, `core.rule_execution_log`
- `core.entity_attribute`, `core.session_platform_status`

### Verifying core schema is not accessible via anon/authenticated keys

Run this query to confirm no grants exist:

```sql
SELECT grantee, table_schema, table_name, privilege_type
FROM information_schema.role_table_grants
WHERE table_schema = 'core'
  AND grantee IN ('anon', 'authenticated');
-- Must return zero rows.
```

---

## Section 5: DDL Auto-Enable Trigger

Migration `20260328010236_remote_schema.sql` installs a DDL event trigger (`rls_auto_enable`) that automatically enables RLS on any new table created in the `public` schema. It does **not** enable RLS for `core` or `analytics`, which is intentional.

When adding a new `public.*` table:
1. RLS is enabled automatically by the trigger.
2. You must still add an explicit policy — RLS with no policies denies all access by default.

---

## Section 6: Adding a New User-Scoped Table

```sql
-- 1. Create the table (RLS auto-enabled by trigger)
CREATE TABLE public.my_new_table (
  my_new_table_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  -- ... other columns
  created_at      timestamp with time zone NOT NULL DEFAULT now()
);

-- 2. Add the ownership policy
CREATE POLICY "owner_my_new_table"
  ON public.my_new_table
  FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- 3. Index the user_id column for policy evaluation
CREATE INDEX idx_my_new_table_user_id ON public.my_new_table (user_id);
```

If the new table has no direct `user_id` but is owned via a parent, use the join-guard pattern from Section 1.

---

## Section 7: Security Checklist

- **Never expose the service role key to the mobile app.** Only the anon key (`EXPO_PUBLIC_SUPABASE_ANON_KEY`) is bundled with the app.
- **Never store plaintext platform credentials** (DoorDash passwords, API secrets) in any Supabase table.
- **`auth.uid()` vs `auth.role()`:** User-owned tables use `auth.uid()` (scoped to current user). Reference tables use `auth.role() = 'authenticated'` (any logged-in user). Never use `auth.role()` for user-scoped data.
- **Reference table writes:** The `auth.role() = 'authenticated'` write policy is acceptable for a single-driver app. Revisit if the app becomes multi-tenant.
- **No DELETE policies on reference tables:** DELETE from shared reference tables requires service-role. This prevents accidental purges of shared data by authenticated users.
