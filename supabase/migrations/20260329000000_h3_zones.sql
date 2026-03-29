-- ============================================================
-- Migration: H3 zone integration (core + analytics layer only)
-- ============================================================
-- Extends tables that already exist on remote.
--
-- public.trips / public.stops do NOT exist yet — their H3 columns
-- are added inside 20260329000001_csv_import_schema.sql, which
-- creates those tables and includes the columns from the start.
-- ============================================================

-- ------------------------------------------------------------
-- 1. Extend core.zone with H3 fields
--    (core.zone exists from 20260328010236_remote_schema.sql)
-- ------------------------------------------------------------

ALTER TABLE core.zone
  ADD COLUMN IF NOT EXISTS h3_index      text,
  ADD COLUMN IF NOT EXISTS h3_resolution integer DEFAULT 9;

CREATE UNIQUE INDEX IF NOT EXISTS idx_zone_h3_index
  ON core.zone (h3_index)
  WHERE h3_index IS NOT NULL;

COMMENT ON COLUMN core.zone.h3_index IS
  'H3 cell index string (e.g. 892a1072447ffff) at h3_resolution. '
  'NULL for zones not yet assigned an H3 cell (polygon-only zones).';

COMMENT ON COLUMN core.zone.h3_resolution IS
  'H3 resolution (0–15) for h3_index. Default 9 ≈ 0.73 km cell edge.';


-- ------------------------------------------------------------
-- 2. Create analytics.zone_time_series
--    (analytics schema exists; zone_time_series does not)
-- ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS analytics.zone_time_series (
  zone_id               text          NOT NULL,
  bucket_start_local    timestamptz   NOT NULL,
  bucket_grain          text          NOT NULL DEFAULT 'hour',
  offers_seen_count     integer       NOT NULL DEFAULT 0,
  offers_accepted_count integer       NOT NULL DEFAULT 0,
  trips_completed_count integer       NOT NULL DEFAULT 0,
  gross_amount_sum      numeric(14,2) NOT NULL DEFAULT 0,
  avg_wait_minutes      numeric(8,2),
  computed_at           timestamptz   NOT NULL DEFAULT now(),

  CONSTRAINT zone_time_series_pkey
    PRIMARY KEY (zone_id, bucket_start_local),

  CONSTRAINT zone_time_series_grain_check
    CHECK (bucket_grain IN ('hour', 'day', 'week')),

  CONSTRAINT zone_time_series_offers_seen_nonneg
    CHECK (offers_seen_count >= 0),

  CONSTRAINT zone_time_series_offers_accepted_nonneg
    CHECK (offers_accepted_count >= 0),

  CONSTRAINT zone_time_series_trips_completed_nonneg
    CHECK (trips_completed_count >= 0),

  CONSTRAINT zone_time_series_gross_nonneg
    CHECK (gross_amount_sum >= 0)
);

COMMENT ON TABLE analytics.zone_time_series IS
  'Pre-aggregated offer and trip metrics per H3 zone_id + time bucket. '
  'zone_id is the raw H3 index string (not a FK) to support cells '
  'not yet registered in core.zone.';

CREATE INDEX IF NOT EXISTS idx_zone_ts_zone_bucket
  ON analytics.zone_time_series (zone_id, bucket_start_local DESC);

CREATE INDEX IF NOT EXISTS idx_zone_ts_bucket_zone
  ON analytics.zone_time_series (bucket_start_local, zone_id);

ALTER TABLE analytics.zone_time_series ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS zone_time_series_select ON analytics.zone_time_series;
CREATE POLICY zone_time_series_select
  ON analytics.zone_time_series
  FOR SELECT
  TO authenticated
  USING (true);
