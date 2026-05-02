-- ============================================================
-- Migration: 20260421000000_reference_schema
-- ============================================================
-- Move 15 reference/overlay tables from public → reference schema.
--
-- Why:
--   public schema currently conflates two access patterns:
--     - User-scoped data (trips, shifts, imports) → auth.uid() RLS
--     - Shared reference overlays (demographics, weather, POI) → authenticated
--   Separating them makes the permission model self-documenting and
--   enables schema-level privilege grants instead of per-table RLS.
--
-- Safety:
--   ALTER TABLE SET SCHEMA is transactional and preserves all indexes,
--   constraints (check + FK), triggers, and RLS policies automatically.
--   FKs between tables in this batch continue to work because PostgreSQL
--   tracks foreign keys by table OID, not by schema-qualified name.
--
-- Cross-schema FK that survives intentionally:
--   reference.reference_ingest_batches.import_batch_id
--     → public.import_batches(import_batch_id)   [SET NULL on delete]
--   reference.external_conditions.import_batch_id
--     → public.import_batches(import_batch_id)   [SET NULL on delete]
--   reference.merchant_locations.import_batch_id
--     → public.import_batches(import_batch_id)   [SET NULL on delete]
--   Cross-schema FKs are fully supported in PostgreSQL.
--
-- PostgREST / Supabase Dashboard step (cannot be done via SQL):
--   After applying this migration, add 'reference' to the exposed schemas
--   list in the Supabase Dashboard:
--     Settings → API → Exposed schemas → add "reference"
--   Without this, JS client .schema('reference') calls return 404.
-- ============================================================

-- ── 1. Create schema ──────────────────────────────────────────────────────────

CREATE SCHEMA IF NOT EXISTS reference;

-- ── 2. Grant schema-level access ─────────────────────────────────────────────
-- anon key can use the schema (needed for unauthenticated reads if ever enabled)
-- authenticated and service_role need USAGE to query tables inside

GRANT USAGE ON SCHEMA reference TO anon, authenticated, service_role;

-- ── 3. Move tables ────────────────────────────────────────────────────────────
-- Order: parents before children (for readability; OID-based FKs don't require
-- any specific order, but this mirrors the dependency hierarchy).

-- Root registry — no inbound FKs from within the 15
ALTER TABLE public.zone_metric_registry      SET SCHEMA reference;

-- Backbone — almost everything in the 15 depends on reference_datasets
ALTER TABLE public.reference_datasets        SET SCHEMA reference;

-- reference_features depends on reference_datasets + reference_ingest_batches
ALTER TABLE public.reference_ingest_batches  SET SCHEMA reference;

-- All 10 overlay tables depend on reference_features
ALTER TABLE public.reference_features        SET SCHEMA reference;

-- Overlay tables (leaf nodes — no inbound FKs from within the 15)
ALTER TABLE public.external_condition_alerts SET SCHEMA reference;
ALTER TABLE public.zone_risk_layers          SET SCHEMA reference;
ALTER TABLE public.zone_transport_layers     SET SCHEMA reference;
ALTER TABLE public.zone_reference_layers     SET SCHEMA reference;
ALTER TABLE public.zone_demand_drivers       SET SCHEMA reference;
ALTER TABLE public.poi_reference             SET SCHEMA reference;
ALTER TABLE public.zone_land_use_layers      SET SCHEMA reference;
ALTER TABLE public.infrastructure_reference  SET SCHEMA reference;
ALTER TABLE public.zone_demographics         SET SCHEMA reference;

-- Standalone tables with cross-schema FK to public.import_batches
ALTER TABLE public.external_conditions       SET SCHEMA reference;
ALTER TABLE public.merchant_locations        SET SCHEMA reference;

-- ── 4. Grant table-level privileges ──────────────────────────────────────────
-- Schema USAGE + table-level grants replace the per-table RLS policies that
-- controlled authenticated access in public. The existing RLS policies
-- (auth.role() = 'authenticated') travel with the tables automatically and
-- remain as a defence-in-depth layer; these grants are the primary control.

GRANT SELECT, INSERT, UPDATE ON ALL TABLES IN SCHEMA reference TO authenticated;
GRANT ALL                     ON ALL TABLES IN SCHEMA reference TO service_role;

-- ── 5. Default privileges for future tables added to reference ────────────────

ALTER DEFAULT PRIVILEGES IN SCHEMA reference
  GRANT SELECT, INSERT, UPDATE ON TABLES TO authenticated;

ALTER DEFAULT PRIVILEGES IN SCHEMA reference
  GRANT ALL ON TABLES TO service_role;
