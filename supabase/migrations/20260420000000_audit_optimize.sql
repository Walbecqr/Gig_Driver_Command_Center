-- ============================================================
-- Migration: 20260420000000_audit_optimize
-- ============================================================
-- Audit and optimization pass. Addresses:
--   1.  VALIDATE the NOT VALID FK on zone_demographics.metric_key
--   2.  Unique constraint on raw_import_records(import_batch_id, source_row_index)
--   3.  Fix zone_demographics.zone_id empty-string default → nullable NULL
--   4.  Missing performance indexes
--   5.  Temporal CHECK constraints on core.delivery_order
--   6.  Missing updated_at column + trigger on reference_ingest_batches
-- ============================================================
-- Safety: each section is guarded by existence checks so the
-- migration is safe to re-run (idempotent).
-- ============================================================


-- ──────────────────────────────────────────────────────────────────────────────
-- Section 1: VALIDATE the NOT VALID FK on zone_demographics.metric_key
-- ──────────────────────────────────────────────────────────────────────────────
-- Pre-flight (run manually before deploying if unsure about orphan rows):
--   SELECT zd.zone_demographic_id, zd.metric_key
--   FROM public.zone_demographics zd
--   WHERE NOT EXISTS (
--     SELECT 1 FROM public.zone_metric_registry zmr
--     WHERE zmr.metric_key = zd.metric_key
--   );

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'fk_zone_demographics_metric_key_registry'
      AND conrelid = 'public.zone_demographics'::regclass
      AND NOT convalidated
  ) THEN
    ALTER TABLE public.zone_demographics
      VALIDATE CONSTRAINT fk_zone_demographics_metric_key_registry;
    RAISE NOTICE 'Validated fk_zone_demographics_metric_key_registry';
  ELSE
    RAISE NOTICE 'fk_zone_demographics_metric_key_registry already validated or absent — skipping';
  END IF;
END
$$;


-- ──────────────────────────────────────────────────────────────────────────────
-- Section 2: Unique constraint on raw_import_records(import_batch_id, source_row_index)
-- ──────────────────────────────────────────────────────────────────────────────
-- Pre-flight (run manually to detect duplicates before adding constraint):
--   SELECT import_batch_id, source_row_index, count(*)
--   FROM public.raw_import_records
--   GROUP BY import_batch_id, source_row_index
--   HAVING count(*) > 1;

DO $$
BEGIN
  -- Drop the existing non-unique index if it exists and is not already unique,
  -- because CREATE UNIQUE INDEX ... will conflict with a plain index of the same name.
  IF EXISTS (
    SELECT 1 FROM pg_indexes
    WHERE schemaname = 'public'
      AND tablename  = 'raw_import_records'
      AND indexname  = 'idx_raw_import_records_batch_row'
  ) AND NOT EXISTS (
    SELECT 1 FROM pg_indexes
    WHERE schemaname = 'public'
      AND tablename  = 'raw_import_records'
      AND indexname  = 'idx_raw_import_records_batch_row'
      AND indexdef   LIKE '%UNIQUE%'
  ) THEN
    DROP INDEX public.idx_raw_import_records_batch_row;
    RAISE NOTICE 'Dropped non-unique idx_raw_import_records_batch_row';
  END IF;
END
$$;

CREATE UNIQUE INDEX IF NOT EXISTS uq_raw_import_records_batch_row_idx
  ON public.raw_import_records (import_batch_id, source_row_index);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname    = 'raw_import_records_batch_row_unique'
      AND conrelid   = 'public.raw_import_records'::regclass
  ) THEN
    ALTER TABLE public.raw_import_records
      ADD CONSTRAINT raw_import_records_batch_row_unique
      UNIQUE USING INDEX uq_raw_import_records_batch_row_idx;
    RAISE NOTICE 'Added raw_import_records_batch_row_unique constraint';
  END IF;
END
$$;


-- ──────────────────────────────────────────────────────────────────────────────
-- Section 3: Fix zone_demographics.zone_id empty-string default → nullable NULL
-- ──────────────────────────────────────────────────────────────────────────────
-- The column used NOT NULL DEFAULT '' to signal "no zone computed".
-- Changing to nullable + NULL default makes semantics unambiguous and aligns
-- with the IS NOT NULL partial index pattern used everywhere else.

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema  = 'public'
      AND table_name    = 'zone_demographics'
      AND column_name   = 'zone_id'
      AND is_nullable   = 'NO'
  ) THEN
    ALTER TABLE public.zone_demographics
      ALTER COLUMN zone_id DROP NOT NULL,
      ALTER COLUMN zone_id SET DEFAULT NULL;

    -- Migrate existing empty-string sentinels to NULL
    UPDATE public.zone_demographics
      SET zone_id = NULL
      WHERE zone_id = '';

    RAISE NOTICE 'Fixed zone_demographics.zone_id default and nullability';
  ELSE
    RAISE NOTICE 'zone_demographics.zone_id already nullable — skipping';
  END IF;
END
$$;

-- Replace the partial index (zone_id <> '') with IS NOT NULL semantics
DROP INDEX IF EXISTS public.idx_zone_demographics_zone_id;

CREATE INDEX IF NOT EXISTS idx_zone_demographics_zone_id
  ON public.zone_demographics (zone_id)
  WHERE zone_id IS NOT NULL;

-- Compound zone + metric lookup index for efficient zone-scoped metric queries
CREATE INDEX IF NOT EXISTS idx_zone_demographics_zone_metric
  ON public.zone_demographics (zone_id, metric_key)
  WHERE zone_id IS NOT NULL;


-- ──────────────────────────────────────────────────────────────────────────────
-- Section 4: Missing performance indexes
-- ──────────────────────────────────────────────────────────────────────────────
-- Note: analytics.zone_time_series(zone_id, bucket_start_local DESC) already
-- exists as idx_zone_ts_zone_bucket (migration 20260329000000).
-- Note: public.trips.shift_id already has idx_trips_shift_id (migration 20260329000001).

-- 4a. core.delivery_order.merchant_id
--     High-cardinality FK used in offer evaluation joins; no index existed.
CREATE INDEX IF NOT EXISTS idx_delivery_order_merchant_id
  ON core.delivery_order (merchant_id)
  WHERE merchant_id IS NOT NULL;

-- 4b. core.capture_event.processing_status
--     Status filtering (pending / parsed / failed) used in worker loops.
CREATE INDEX IF NOT EXISTS idx_capture_event_processing_status
  ON core.capture_event (processing_status);

-- 4c. public.external_conditions — compound zone + time lookup
--     Used by referenceContext.ts to fetch latest weather per zone.
CREATE INDEX IF NOT EXISTS idx_external_conditions_zone_recorded
  ON public.external_conditions (zone_id, recorded_at DESC);

-- 4d. public.raw_import_records — batch + parse_status lookups
--     Used when aggregating parse status counts for import review.
CREATE INDEX IF NOT EXISTS idx_raw_import_records_batch_parse
  ON public.raw_import_records (import_batch_id, parse_status);

-- 4e. public.merchant_locations — zone_id lookup
--     Used by referenceContext.ts merchant density queries.
CREATE INDEX IF NOT EXISTS idx_merchant_locations_zone_id
  ON public.merchant_locations (zone_id);

-- 4f. public.zone_reference_layers and zone_demand_drivers — zone_id lookups
CREATE INDEX IF NOT EXISTS idx_zone_reference_layers_zone_id
  ON public.zone_reference_layers (zone_id);

CREATE INDEX IF NOT EXISTS idx_zone_demand_drivers_zone_id
  ON public.zone_demand_drivers (zone_id);

-- 4g. public.trip_source_links — import_batch_id lookup for import tracing
CREATE INDEX IF NOT EXISTS idx_trip_source_links_batch_id
  ON public.trip_source_links (import_batch_id);


-- ──────────────────────────────────────────────────────────────────────────────
-- Section 5: Temporal CHECK constraints on core.delivery_order
-- ──────────────────────────────────────────────────────────────────────────────
-- core.work_session already has chk_session_time.
-- core.mileage_log already has chk_mileage_time.
-- public.trips already has trips_time_order_valid.
-- Remaining gap: delivery_order timestamp ordering.

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname  = 'chk_delivery_order_pickup_time'
      AND conrelid = 'core.delivery_order'::regclass
  ) THEN
    ALTER TABLE core.delivery_order
      ADD CONSTRAINT chk_delivery_order_pickup_time
      CHECK (pickup_arrived_at IS NULL OR pickup_arrived_at >= accepted_at)
      NOT VALID;
    ALTER TABLE core.delivery_order
      VALIDATE CONSTRAINT chk_delivery_order_pickup_time;
    RAISE NOTICE 'Added and validated chk_delivery_order_pickup_time';
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname  = 'chk_delivery_order_delivery_time'
      AND conrelid = 'core.delivery_order'::regclass
  ) THEN
    ALTER TABLE core.delivery_order
      ADD CONSTRAINT chk_delivery_order_delivery_time
      CHECK (
        delivered_at IS NULL
        OR dropoff_arrived_at IS NULL
        OR delivered_at >= dropoff_arrived_at
      )
      NOT VALID;
    ALTER TABLE core.delivery_order
      VALIDATE CONSTRAINT chk_delivery_order_delivery_time;
    RAISE NOTICE 'Added and validated chk_delivery_order_delivery_time';
  END IF;
END
$$;


-- ──────────────────────────────────────────────────────────────────────────────
-- Section 6: Missing updated_at column + trigger on reference_ingest_batches
-- ──────────────────────────────────────────────────────────────────────────────
-- reference_ingest_batches has no updated_at column despite being mutable
-- (ingest_status and parsed_record_count change during ingestion runs).

ALTER TABLE public.reference_ingest_batches
  ADD COLUMN IF NOT EXISTS updated_at
    timestamp with time zone NOT NULL DEFAULT now();

-- Backfill: set updated_at = ingested_at for rows predating this migration
UPDATE public.reference_ingest_batches
  SET updated_at = ingested_at
  WHERE updated_at > ingested_at;

DROP TRIGGER IF EXISTS trg_reference_ingest_batches_set_updated_at
  ON public.reference_ingest_batches;

CREATE TRIGGER trg_reference_ingest_batches_set_updated_at
  BEFORE UPDATE ON public.reference_ingest_batches
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


RAISE NOTICE 'Migration 20260420000000_audit_optimize complete';
