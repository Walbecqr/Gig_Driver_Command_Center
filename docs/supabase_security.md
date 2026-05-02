# Supabase Security Guide

Gig Driver Command Center backend security model, patterns, and operational runbook.

---

## 1. Environment Variable Rules

| Variable | Prefix | Where it goes | Notes |
|---|---|---|---|
| `EXPO_PUBLIC_SUPABASE_URL` | `EXPO_PUBLIC_` | Client bundle | Safe — public URL |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | `EXPO_PUBLIC_` | Client bundle | Safe — RLS-gated anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | _(none)_ | Edge Functions only | **NEVER** in client bundle |
| `SUPABASE_DB_PASSWORD` | _(none)_ | Local CLI only | Never commit with real value |

**Hard rule**: If a variable starts with `EXPO_PUBLIC_`, it is bundled into every mobile/web build and is readable by anyone who decompiles the app. The service role key bypasses RLS completely — putting it in `EXPO_PUBLIC_` would give any user admin database access.

Run `npm run db:audit:security` to scan for accidental exposure.

---

## 2. Connection String Rules

| Use case | Port | Mode | Variable |
|---|---|---|---|
| Edge Functions / serverless | **6543** | Transaction (Supavisor pooler) | `DATABASE_URL` |
| Supabase CLI migrations | **5432** | Session (direct) | `DIRECT_URL` |

Never use the direct connection (port 5432) inside Edge Functions or any serverless context — connections are not recycled and will exhaust the Postgres connection pool under load.

---

## 3. Row Level Security Policy Model

All user-data tables have RLS enabled. The base pattern:

```sql
-- Direct ownership
USING (user_id = auth.uid())

-- Transitive ownership (child table → parent)
USING (trip_id IN (
  SELECT trip_id FROM public.trips WHERE user_id = auth.uid()
))
```

**Reference tables** (`delivery_platforms`, `offer_feedback_tags`, `zone_performance_snapshot`) are globally readable by authenticated users but writable only via `service_role`. They have `SELECT USING (true) TO authenticated` and no write policies.

**UPDATE policies** always include both `USING` and `WITH CHECK`. Omitting `WITH CHECK` on an UPDATE lets authenticated users move rows into states they cannot then read back (silent zero-row result).

RLS is enabled on all 30 tables in the `pitfall_corrections` migration. Run `npm run db:audit:rls` to verify.

---

## 4. Index Strategy

Every foreign key column has a corresponding index. Composite indexes are added for the most common dashboard query patterns:

| Index | Table | Purpose |
|---|---|---|
| `idx_shifts_user_started_at` | `shifts` | Dashboard: recent shifts by user |
| `idx_offers_user_created_at` | `offers` | Offer history feed |
| `idx_trips_user_started_at` | `trips` | Trip list sorted by date |
| `idx_cash_ledger_user_occurred_at` | `cash_ledger_entries` | Cash flow timeline |
| `idx_zone_perf_snapshot_zone_date` | `zone_performance_snapshot` | Zone analytics queries |
| `idx_merchant_perf_snapshot_date` | `merchant_performance_snapshot` | Merchant timeline |

Run `npm run db:audit:index` to find any FK columns still missing indexes.

---

## 5. Singleton Client Pattern

The Supabase client lives at `src/services/supabase/client.ts` and is created once at module load time. If either required env var is missing, the module throws immediately so misconfigured builds fail fast at startup rather than producing silent API failures.

```typescript
import { supabaseClient } from '@/services/supabase/client';
// supabaseClient is always non-null — the module throws at startup otherwise
```

A helper for services that want an explicit throw with a context message:

```typescript
import { getSupabaseClientOrThrow } from '@/services/supabase/utils';
const supabase = getSupabaseClientOrThrow('[myService] Supabase not configured');
```

Never call `createClient()` outside `src/services/supabase/client.ts`.

---

## 6. Generated Types Workflow

The file `src/types/supabase.generated.ts` is auto-generated from the live schema. **Do not edit it manually.**

After any schema change (migration applied):

```bash
# Against local Supabase instance (supabase start must be running):
npm run db:types:local

# Against the linked remote project:
npm run db:types:linked
```

Commit the regenerated file alongside the migration.

---

## 7. PR Checklist

Before merging any PR that touches Supabase schema, client code, or env vars:

- [ ] No `SERVICE_ROLE` key in any `EXPO_PUBLIC_` variable — run `npm run db:audit:security`
- [ ] No `raw_user_meta_data` used in RLS policies (use `auth.uid()` or `app_metadata`)
- [ ] Every new table has RLS enabled — run `npm run db:audit:rls`
- [ ] Every new table has scoped policies (no `USING (true)` on write policies for user data)
- [ ] Every UPDATE policy includes both `USING` and `WITH CHECK`
- [ ] Every new FK column has an index — run `npm run db:audit:index`
- [ ] Supabase client not instantiated outside `src/services/supabase/client.ts`
- [ ] No `select('*')` — list only columns actually used
- [ ] Lookup queries use `.maybeSingle()`, not `.single()`, unless the row is guaranteed to exist
- [ ] INSERT/upsert mutations that return the created row use `.select(...).single()`
- [ ] Edge Functions use `DATABASE_URL` (port 6543), not `DIRECT_URL` (port 5432)
- [ ] `src/types/supabase.generated.ts` regenerated and committed after schema changes

---

## 8. Running the Audit Scripts

```bash
# Check for tables missing RLS + overly permissive policies
npm run db:audit:rls

# Check for FK columns missing indexes
npm run db:audit:index

# Check for service_role key exposure in client-bundled code
npm run db:audit:security

# Or run the SQL files directly in Supabase SQL Editor:
# scripts/audit_rls.sql
# scripts/audit_fk_indexes.sql
```

All three scripts expect zero rows / zero matches as the healthy output.
