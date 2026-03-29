-- ============================================================
-- Migration: CSV import schema (public schema)
-- ============================================================
-- Promotes the uber_weekly_statement_csv_import/ SQL files into a
-- proper tracked migration.
--
-- Key differences from the original 003_core_tables.sql:
--   • All FKs reference public.users(id) and public.shifts(id) —
--     the PKs that actually exist from the 001_init.sql migration,
--     not user_id / shift_id which are in the undeployed spec.
--   • All CREATE TABLE statements use IF NOT EXISTS for safety.
--   • public.trips and public.stops include H3 zone_id columns
--     directly (no separate ALTER needed).
--   • Enum creation uses exception-handling blocks so re-running
--     is safe if any types were partially created.
-- ============================================================

-- ------------------------------------------------------------
-- Extensions
-- ------------------------------------------------------------

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ------------------------------------------------------------
-- Enums  (idempotent via exception handler)
-- ------------------------------------------------------------

DO $$ BEGIN
  CREATE TYPE platform_enum AS ENUM (
    'uber_driver', 'uber_eats', 'doordash', 'grubhub', 'unknown'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE connection_mode_enum AS ENUM (
    'import_only', 'linked', 'manual'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE connection_status_enum AS ENUM (
    'active', 'disconnected', 'errored', 'unknown'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE source_type_enum AS ENUM (
    'weekly_statement_csv', 'personal_data_export', 'manual_csv',
    'manual_entry', 'app_gps', 'derived', 'other'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE import_status_enum AS ENUM (
    'processing', 'completed', 'partial', 'failed'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE parse_status_enum AS ENUM (
    'parsed', 'warning', 'failed', 'skipped'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE platform_scope_enum AS ENUM (
    'uber_only', 'multi_platform', 'unknown'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE inference_method_enum AS ENUM (
    'gap_clustering', 'manual_merge', 'manual_entry', 'app_tracked'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE service_type_enum AS ENUM (
    'delivery', 'rideshare', 'unknown'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE trip_status_enum AS ENUM (
    'completed', 'cancelled', 'partial', 'unknown'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE financial_source_type_enum AS ENUM (
    'statement_csv', 'personal_data_export', 'derived'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE metric_source_enum AS ENUM (
    'statement', 'personal_export', 'derived', 'app_gps'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE stop_type_enum AS ENUM (
    'pickup', 'dropoff', 'waypoint', 'unknown'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE stop_status_enum AS ENUM (
    'completed', 'skipped', 'unknown'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE issue_type_enum AS ENUM (
    'duplicate', 'missing_trip_id', 'amount_mismatch', 'time_gap',
    'distance_mismatch', 'unmapped_row', 'summary_row_detected',
    'parse_failure', 'suspected_duplicate'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE severity_enum AS ENUM ('low', 'medium', 'high');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE resolution_status_enum AS ENUM ('open', 'resolved', 'ignored');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ------------------------------------------------------------
-- platform_accounts
-- New table — different from the existing delivery_platform_accounts.
-- FK corrected: references public.users(id) — the actual PK from 001_init.sql.
-- ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.platform_accounts (
  platform_account_id    uuid                    PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                uuid                    NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  platform               platform_enum           NOT NULL,
  account_external_id    text,
  account_label          text,
  connection_mode        connection_mode_enum    NOT NULL DEFAULT 'import_only',
  connection_status      connection_status_enum  NOT NULL DEFAULT 'unknown',
  created_at             timestamptz             NOT NULL DEFAULT now(),
  updated_at             timestamptz             NOT NULL DEFAULT now(),

  CONSTRAINT platform_accounts_label_not_blank
    CHECK (account_label IS NULL OR length(trim(account_label)) > 0)
);

-- ------------------------------------------------------------
-- import_batches
-- FK corrected: references public.users(id).
-- ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.import_batches (
  import_batch_id               uuid                  PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                       uuid                  NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  platform_account_id           uuid                  NOT NULL REFERENCES public.platform_accounts(platform_account_id) ON DELETE CASCADE,
  source_platform               platform_enum         NOT NULL,
  source_type                   source_type_enum      NOT NULL,
  source_file_name              text                  NOT NULL,
  source_file_hash              text                  NOT NULL,
  source_statement_start_date   date,
  source_statement_end_date     date,
  parser_version                text                  NOT NULL,
  row_count_raw                 integer               NOT NULL DEFAULT 0,
  row_count_parsed              integer               NOT NULL DEFAULT 0,
  import_status                 import_status_enum    NOT NULL DEFAULT 'processing',
  import_notes                  text,
  imported_at                   timestamptz           NOT NULL DEFAULT now(),

  CONSTRAINT import_batches_row_count_raw_nonneg    CHECK (row_count_raw >= 0),
  CONSTRAINT import_batches_row_count_parsed_nonneg CHECK (row_count_parsed >= 0),
  CONSTRAINT import_batches_statement_dates_valid   CHECK (
    source_statement_start_date IS NULL
    OR source_statement_end_date IS NULL
    OR source_statement_start_date <= source_statement_end_date
  )
);

-- ------------------------------------------------------------
-- raw_import_records
-- ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.raw_import_records (
  raw_record_id        uuid              PRIMARY KEY DEFAULT gen_random_uuid(),
  import_batch_id      uuid              NOT NULL REFERENCES public.import_batches(import_batch_id) ON DELETE CASCADE,
  source_row_index     integer           NOT NULL,
  source_record_type   text              NOT NULL,
  source_payload_json  jsonb             NOT NULL,
  row_hash             text              NOT NULL,
  parse_status         parse_status_enum NOT NULL DEFAULT 'parsed',
  parse_warning        text,
  parse_error          text,
  created_at           timestamptz       NOT NULL DEFAULT now(),

  CONSTRAINT raw_import_records_row_index_nonneg CHECK (source_row_index >= 0),
  CONSTRAINT raw_import_records_record_type_not_blank
    CHECK (length(trim(source_record_type)) > 0)
);

-- ------------------------------------------------------------
-- trips
-- FK corrected: references public.users(id) and public.shifts(id).
-- H3 zone columns included from the start (no separate ALTER needed).
-- ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.trips (
  trip_id                uuid                PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                uuid                NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  platform_account_id    uuid                NOT NULL REFERENCES public.platform_accounts(platform_account_id) ON DELETE CASCADE,
  shift_id               uuid                REFERENCES public.shifts(id) ON DELETE SET NULL,
  trip_date_local        date                NOT NULL,
  trip_start_ts_local    timestamp without time zone,
  trip_end_ts_local      timestamp without time zone,
  trip_timezone          text                NOT NULL DEFAULT 'America/New_York',
  platform               platform_enum       NOT NULL,
  service_type           service_type_enum   NOT NULL DEFAULT 'unknown',
  platform_trip_id       text,
  platform_order_id      text,
  trip_status            trip_status_enum    NOT NULL DEFAULT 'unknown',
  completion_confidence  numeric(4,3)        NOT NULL DEFAULT 1.000,
  source_priority        integer             NOT NULL DEFAULT 1,
  raw_trip_ref           uuid                REFERENCES public.raw_import_records(raw_record_id) ON DELETE SET NULL,
  -- H3 zone fields (computed at import time from stop coordinates)
  pickup_zone_id         text,
  dropoff_zone_id        text,
  created_at             timestamptz         NOT NULL DEFAULT now(),
  updated_at             timestamptz         NOT NULL DEFAULT now(),

  CONSTRAINT trips_time_order_valid CHECK (
    trip_start_ts_local IS NULL
    OR trip_end_ts_local IS NULL
    OR trip_end_ts_local >= trip_start_ts_local
  ),
  CONSTRAINT trips_completion_confidence_range
    CHECK (completion_confidence >= 0 AND completion_confidence <= 1),
  CONSTRAINT trips_source_priority_positive CHECK (source_priority > 0),
  CONSTRAINT trips_timezone_not_blank
    CHECK (length(trim(trip_timezone)) > 0),
  CONSTRAINT trips_has_minimum_identity CHECK (
    platform_trip_id IS NOT NULL
    OR (trip_start_ts_local IS NOT NULL AND trip_end_ts_local IS NOT NULL)
    OR trip_date_local IS NOT NULL
  )
);

-- ------------------------------------------------------------
-- trip_financials
-- ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.trip_financials (
  trip_fin_id           uuid                          PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id               uuid                          NOT NULL UNIQUE REFERENCES public.trips(trip_id) ON DELETE CASCADE,
  currency_code         text                          NOT NULL DEFAULT 'USD',
  gross_amount          numeric(12,2),
  net_payout            numeric(12,2),
  base_fare             numeric(12,2),
  tip_amount            numeric(12,2),
  bonus_amount          numeric(12,2),
  surge_amount          numeric(12,2),
  wait_time_pay         numeric(12,2),
  cancellation_pay      numeric(12,2),
  adjustment_amt        numeric(12,2),
  fee_amount            numeric(12,2),
  payout_conf           numeric(4,3)                  NOT NULL DEFAULT 1.000,
  fin_source_type       financial_source_type_enum    NOT NULL,

  CONSTRAINT trip_financials_currency_not_blank CHECK (length(trim(currency_code)) > 0),
  CONSTRAINT trip_financials_payout_conf_range  CHECK (payout_conf >= 0 AND payout_conf <= 1)
);

-- ------------------------------------------------------------
-- trip_metrics
-- ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.trip_metrics (
  trip_metric_id      uuid                PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id             uuid                NOT NULL UNIQUE REFERENCES public.trips(trip_id) ON DELETE CASCADE,
  distance_miles      numeric(10,3),
  duration_minutes    numeric(10,2),
  active_minutes      numeric(10,2),
  pickup_to_drop_minutes numeric(10,2),
  distance_source     metric_source_enum  NOT NULL,
  duration_source     metric_source_enum  NOT NULL,
  metric_confidence   numeric(4,3)        NOT NULL DEFAULT 1.000,

  CONSTRAINT trip_metrics_distance_nonneg       CHECK (distance_miles IS NULL OR distance_miles >= 0),
  CONSTRAINT trip_metrics_duration_nonneg       CHECK (duration_minutes IS NULL OR duration_minutes >= 0),
  CONSTRAINT trip_metrics_active_minutes_nonneg CHECK (active_minutes IS NULL OR active_minutes >= 0),
  CONSTRAINT trip_metrics_pickup_drop_nonneg    CHECK (pickup_to_drop_minutes IS NULL OR pickup_to_drop_minutes >= 0),
  CONSTRAINT trip_metrics_confidence_range      CHECK (metric_confidence >= 0 AND metric_confidence <= 1)
);

-- ------------------------------------------------------------
-- stops
-- H3 zone_id column included from the start.
-- ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.stops (
  stop_id             uuid              PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id             uuid              NOT NULL REFERENCES public.trips(trip_id) ON DELETE CASCADE,
  stop_sequence       integer           NOT NULL,
  stop_type           stop_type_enum    NOT NULL DEFAULT 'unknown',
  stop_status         stop_status_enum  NOT NULL DEFAULT 'unknown',
  location_name       text,
  address_line_1      text,
  city                text,
  state               text,
  postal_code         text,
  latitude            numeric(9,6),
  longitude           numeric(9,6),
  -- H3 zone field (computed from latitude/longitude at import time)
  zone_id             text,
  arrival_ts_local    timestamp without time zone,
  departure_ts_local  timestamp without time zone,
  created_at          timestamptz       NOT NULL DEFAULT now(),

  CONSTRAINT stops_sequence_positive   CHECK (stop_sequence > 0),
  CONSTRAINT stops_latitude_range      CHECK (latitude IS NULL OR (latitude >= -90 AND latitude <= 90)),
  CONSTRAINT stops_longitude_range     CHECK (longitude IS NULL OR (longitude >= -180 AND longitude <= 180)),
  CONSTRAINT stops_time_order_valid    CHECK (
    arrival_ts_local IS NULL
    OR departure_ts_local IS NULL
    OR departure_ts_local >= arrival_ts_local
  ),
  CONSTRAINT stops_trip_sequence_unique UNIQUE (trip_id, stop_sequence)
);

-- ------------------------------------------------------------
-- trip_source_links
-- ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.trip_source_links (
  trip_source_link_id uuid              PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id             uuid              NOT NULL REFERENCES public.trips(trip_id) ON DELETE CASCADE,
  import_batch_id     uuid              NOT NULL REFERENCES public.import_batches(import_batch_id) ON DELETE CASCADE,
  raw_record_id       uuid              REFERENCES public.raw_import_records(raw_record_id) ON DELETE SET NULL,
  source_type         source_type_enum  NOT NULL,
  source_field_map_json jsonb,
  source_confidence   numeric(4,3)      NOT NULL DEFAULT 1.000,
  created_at          timestamptz       NOT NULL DEFAULT now(),

  CONSTRAINT trip_source_links_confidence_range CHECK (source_confidence >= 0 AND source_confidence <= 1)
);

-- ------------------------------------------------------------
-- shift_source_links
-- FK corrected: references public.shifts(id).
-- ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.shift_source_links (
  shift_source_link_id uuid              PRIMARY KEY DEFAULT gen_random_uuid(),
  shift_id             uuid              NOT NULL REFERENCES public.shifts(id) ON DELETE CASCADE,
  import_batch_id      uuid              NOT NULL REFERENCES public.import_batches(import_batch_id) ON DELETE CASCADE,
  source_type          source_type_enum  NOT NULL,
  inference_notes      text,
  source_confidence    numeric(4,3)      NOT NULL DEFAULT 1.000,
  created_at           timestamptz       NOT NULL DEFAULT now(),

  CONSTRAINT shift_source_links_confidence_range CHECK (source_confidence >= 0 AND source_confidence <= 1)
);

-- ------------------------------------------------------------
-- reconciliation_issues
-- FK corrected: references public.users(id).
-- ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.reconciliation_issues (
  reconciliation_issue_id uuid                      PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                 uuid                      NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  platform_account_id     uuid                      NOT NULL REFERENCES public.platform_accounts(platform_account_id) ON DELETE CASCADE,
  import_batch_id         uuid                      REFERENCES public.import_batches(import_batch_id) ON DELETE SET NULL,
  shift_id                uuid                      REFERENCES public.shifts(id) ON DELETE SET NULL,
  trip_id                 uuid                      REFERENCES public.trips(trip_id) ON DELETE SET NULL,
  issue_type              issue_type_enum           NOT NULL,
  severity                severity_enum             NOT NULL DEFAULT 'medium',
  issue_summary           text                      NOT NULL,
  source_a                text,
  source_b                text,
  resolution_status       resolution_status_enum    NOT NULL DEFAULT 'open',
  resolution_notes        text,
  created_at              timestamptz               NOT NULL DEFAULT now(),
  resolved_at             timestamptz,

  CONSTRAINT reconciliation_issues_summary_not_blank
    CHECK (length(trim(issue_summary)) > 0),
  CONSTRAINT reconciliation_issues_resolved_valid
    CHECK (resolved_at IS NULL OR resolved_at >= created_at)
);

-- ------------------------------------------------------------
-- Indexes
-- ------------------------------------------------------------

CREATE INDEX IF NOT EXISTS idx_platform_accounts_user_platform
  ON public.platform_accounts (user_id, platform);

CREATE INDEX IF NOT EXISTS idx_import_batches_user_platform_imported_at
  ON public.import_batches (user_id, source_platform, imported_at DESC);

CREATE UNIQUE INDEX IF NOT EXISTS idx_import_batches_file_hash_per_account
  ON public.import_batches (platform_account_id, source_file_hash);

CREATE INDEX IF NOT EXISTS idx_raw_import_records_batch_row
  ON public.raw_import_records (import_batch_id, source_row_index);

CREATE INDEX IF NOT EXISTS idx_raw_import_records_row_hash
  ON public.raw_import_records (row_hash);

CREATE INDEX IF NOT EXISTS idx_trips_user_date
  ON public.trips (user_id, trip_date_local);

CREATE INDEX IF NOT EXISTS idx_trips_shift_id
  ON public.trips (shift_id);

CREATE INDEX IF NOT EXISTS idx_trips_start_ts
  ON public.trips (trip_start_ts_local);

CREATE INDEX IF NOT EXISTS idx_trips_platform_trip_id
  ON public.trips (platform_account_id, platform_trip_id)
  WHERE platform_trip_id IS NOT NULL;

-- H3 zone indexes
CREATE INDEX IF NOT EXISTS idx_trips_pickup_zone
  ON public.trips (pickup_zone_id) WHERE pickup_zone_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_trips_dropoff_zone
  ON public.trips (dropoff_zone_id) WHERE dropoff_zone_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_stops_zone
  ON public.stops (zone_id) WHERE zone_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_reconciliation_issues_user_status_severity
  ON public.reconciliation_issues (user_id, resolution_status, severity);

CREATE INDEX IF NOT EXISTS idx_reconciliation_issues_trip_id
  ON public.reconciliation_issues (trip_id);

CREATE INDEX IF NOT EXISTS idx_reconciliation_issues_import_batch_id
  ON public.reconciliation_issues (import_batch_id);

CREATE INDEX IF NOT EXISTS idx_trip_source_links_trip_id
  ON public.trip_source_links (trip_id);

CREATE INDEX IF NOT EXISTS idx_trip_source_links_import_batch_id
  ON public.trip_source_links (import_batch_id);

CREATE INDEX IF NOT EXISTS idx_shift_source_links_shift_id
  ON public.shift_source_links (shift_id);

CREATE INDEX IF NOT EXISTS idx_raw_import_records_payload_gin
  ON public.raw_import_records USING gin (source_payload_json);

CREATE INDEX IF NOT EXISTS idx_trip_source_links_field_map_gin
  ON public.trip_source_links USING gin (source_field_map_json);

-- ------------------------------------------------------------
-- Trigger function + triggers
-- ------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER trg_platform_accounts_set_updated_at
  BEFORE UPDATE ON public.platform_accounts
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE OR REPLACE TRIGGER trg_trips_set_updated_at
  BEFORE UPDATE ON public.trips
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ------------------------------------------------------------
-- Views
-- ------------------------------------------------------------

CREATE OR REPLACE VIEW public.v_trip_import_review AS
SELECT
  t.trip_id,
  t.user_id,
  t.platform_account_id,
  t.shift_id,
  t.platform,
  t.service_type,
  t.platform_trip_id,
  t.platform_order_id,
  t.trip_status,
  t.trip_date_local,
  t.trip_start_ts_local,
  t.trip_end_ts_local,
  t.trip_timezone,
  t.completion_confidence,
  t.pickup_zone_id,
  t.dropoff_zone_id,
  tf.currency_code,
  tf.gross_amount,
  tf.net_payout,
  tf.base_fare,
  tf.tip_amount,
  tf.bonus_amount,
  tf.surge_amount,
  tf.wait_time_pay,
  tf.cancellation_pay,
  tf.adjustment_amt,
  tf.fee_amount,
  tf.payout_conf,
  tf.fin_source_type,
  tm.distance_miles,
  tm.duration_minutes,
  tm.active_minutes,
  tm.pickup_to_drop_minutes,
  tm.distance_source,
  tm.duration_source,
  tm.metric_confidence,
  t.created_at,
  t.updated_at
FROM public.trips t
LEFT JOIN public.trip_financials tf ON tf.trip_id = t.trip_id
LEFT JOIN public.trip_metrics    tm ON tm.trip_id = t.trip_id;

CREATE OR REPLACE VIEW public.v_open_reconciliation_issues AS
SELECT
  ri.reconciliation_issue_id,
  ri.user_id,
  ri.platform_account_id,
  ri.import_batch_id,
  ri.shift_id,
  ri.trip_id,
  ri.issue_type,
  ri.severity,
  ri.issue_summary,
  ri.source_a,
  ri.source_b,
  ri.resolution_status,
  ri.created_at,
  t.platform_trip_id,
  t.trip_date_local,
  t.trip_start_ts_local,
  t.trip_end_ts_local
FROM public.reconciliation_issues ri
LEFT JOIN public.trips t ON t.trip_id = ri.trip_id
WHERE ri.resolution_status = 'open';

-- ------------------------------------------------------------
-- Row-Level Security
-- ------------------------------------------------------------

ALTER TABLE public.platform_accounts      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.import_batches         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.raw_import_records     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trips                  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trip_financials        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trip_metrics           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stops                  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trip_source_links      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shift_source_links     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reconciliation_issues  ENABLE ROW LEVEL SECURITY;

CREATE POLICY platform_accounts_own_all ON public.platform_accounts
  FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE POLICY import_batches_own_all ON public.import_batches
  FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE POLICY raw_import_records_via_batch ON public.raw_import_records
  FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.import_batches ib
    WHERE ib.import_batch_id = raw_import_records.import_batch_id
      AND ib.user_id = auth.uid()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.import_batches ib
    WHERE ib.import_batch_id = raw_import_records.import_batch_id
      AND ib.user_id = auth.uid()
  ));

CREATE POLICY trips_own_all ON public.trips
  FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE POLICY trip_financials_via_trip ON public.trip_financials
  FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.trips t
    WHERE t.trip_id = trip_financials.trip_id AND t.user_id = auth.uid()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.trips t
    WHERE t.trip_id = trip_financials.trip_id AND t.user_id = auth.uid()
  ));

CREATE POLICY trip_metrics_via_trip ON public.trip_metrics
  FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.trips t
    WHERE t.trip_id = trip_metrics.trip_id AND t.user_id = auth.uid()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.trips t
    WHERE t.trip_id = trip_metrics.trip_id AND t.user_id = auth.uid()
  ));

CREATE POLICY stops_via_trip ON public.stops
  FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.trips t
    WHERE t.trip_id = stops.trip_id AND t.user_id = auth.uid()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.trips t
    WHERE t.trip_id = stops.trip_id AND t.user_id = auth.uid()
  ));

CREATE POLICY trip_source_links_via_trip ON public.trip_source_links
  FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.trips t
    WHERE t.trip_id = trip_source_links.trip_id AND t.user_id = auth.uid()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.trips t
    WHERE t.trip_id = trip_source_links.trip_id AND t.user_id = auth.uid()
  ));

CREATE POLICY shift_source_links_via_shift ON public.shift_source_links
  FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.shifts s
    WHERE s.id = shift_source_links.shift_id AND s.user_id = auth.uid()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.shifts s
    WHERE s.id = shift_source_links.shift_id AND s.user_id = auth.uid()
  ));

CREATE POLICY reconciliation_issues_own_all ON public.reconciliation_issues
  FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
