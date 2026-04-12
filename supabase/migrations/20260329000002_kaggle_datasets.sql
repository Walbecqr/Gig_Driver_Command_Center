-- ============================================================
-- Migration: Kaggle dataset tables + enum extensions
-- ============================================================
-- Adds:
--   • 'kaggle_csv' and 'simulation' values to source_type_enum
--   • 'synthetic' value to platform_enum
--   • public.merchant_locations  — platform restaurant/merchant data
--   • public.external_conditions — weather + surge context data
--
-- These tables are shared reference data (not per-user), so RLS
-- allows any authenticated user to read/write rather than
-- filtering by user_id.
-- ============================================================

-- ------------------------------------------------------------
-- Extend existing enums
-- ALTER TYPE … ADD VALUE cannot run inside a BEGIN/EXCEPTION
-- block, but IF NOT EXISTS makes it safe to re-run.
-- ------------------------------------------------------------

ALTER TYPE public.source_type_enum ADD VALUE IF NOT EXISTS 'kaggle_csv';
ALTER TYPE public.source_type_enum ADD VALUE IF NOT EXISTS 'simulation';
ALTER TYPE public.platform_enum    ADD VALUE IF NOT EXISTS 'synthetic';

-- ------------------------------------------------------------
-- merchant_locations
-- Stores restaurant / merchant intelligence sourced from Uber
-- Eats and DoorDash restaurant Kaggle datasets.
-- Feeds zone scoring, stackability models, and relocation logic.
-- ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.merchant_locations (
  merchant_id                      uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
  platform                         platform_enum NOT NULL,
  name                             text          NOT NULL,
  latitude                         numeric(9,6),
  longitude                        numeric(9,6),
  -- H3 zone (computed at import time from lat/lng)
  zone_id                          text,
  address_line_1                   text,
  city                             text,
  state                            text,
  postal_code                      text,
  rating                           numeric(3,2),
  price_level                      integer,
  delivery_fee                     numeric(10,2),
  estimated_delivery_time_minutes  integer,
  cuisine_type                     text,
  -- Source traceability
  source_type                      text          NOT NULL DEFAULT 'kaggle_csv',
  import_batch_id                  uuid          REFERENCES public.import_batches(import_batch_id) ON DELETE SET NULL,
  created_at                       timestamptz   NOT NULL DEFAULT now(),
  updated_at                       timestamptz   NOT NULL DEFAULT now(),

  CONSTRAINT merchant_locations_name_not_blank
    CHECK (length(trim(name)) > 0),
  CONSTRAINT merchant_locations_latitude_range
    CHECK (latitude IS NULL OR (latitude >= -90  AND latitude <= 90)),
  CONSTRAINT merchant_locations_longitude_range
    CHECK (longitude IS NULL OR (longitude >= -180 AND longitude <= 180)),
  CONSTRAINT merchant_locations_rating_range
    CHECK (rating IS NULL OR (rating >= 0 AND rating <= 5)),
  CONSTRAINT merchant_locations_price_level_range
    CHECK (price_level IS NULL OR (price_level >= 1 AND price_level <= 4)),
  CONSTRAINT merchant_locations_delivery_fee_nonneg
    CHECK (delivery_fee IS NULL OR delivery_fee >= 0),
  CONSTRAINT merchant_locations_delivery_time_nonneg
    CHECK (estimated_delivery_time_minutes IS NULL OR estimated_delivery_time_minutes >= 0)
);

-- Dedup: same platform + name + coordinates → same merchant
CREATE UNIQUE INDEX IF NOT EXISTS idx_merchant_locations_platform_name_coords
  ON public.merchant_locations (platform, name, latitude, longitude)
  WHERE latitude IS NOT NULL AND longitude IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_merchant_locations_zone_id
  ON public.merchant_locations (zone_id)
  WHERE zone_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_merchant_locations_platform
  ON public.merchant_locations (platform);

CREATE INDEX IF NOT EXISTS idx_merchant_locations_city_state
  ON public.merchant_locations (city, state)
  WHERE city IS NOT NULL;

-- Reuse the set_updated_at() function from migration 001
CREATE OR REPLACE TRIGGER trg_merchant_locations_set_updated_at
  BEFORE UPDATE ON public.merchant_locations
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ------------------------------------------------------------
-- external_conditions
-- Stores weather + surge context data sourced from the
-- Uber / Lyft + Weather Kaggle dataset.
-- Feeds demand prediction, zone scoring, and relocation logic.
-- ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.external_conditions (
  condition_id       uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  recorded_at        timestamptz NOT NULL,
  latitude           numeric(9,6),
  longitude          numeric(9,6),
  -- H3 zone (computed at import time from lat/lng)
  zone_id            text,
  weather_condition  text,
  temperature_f      numeric(6,2),
  humidity_pct       numeric(5,2),
  wind_speed_mph     numeric(6,2),
  visibility_miles   numeric(6,2),
  surge_multiplier   numeric(6,3),
  -- 'kaggle_csv' | 'simulation' | 'api'
  source_type        text        NOT NULL DEFAULT 'kaggle_csv',
  import_batch_id    uuid        REFERENCES public.import_batches(import_batch_id) ON DELETE SET NULL,
  created_at         timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT external_conditions_latitude_range
    CHECK (latitude IS NULL OR (latitude >= -90  AND latitude <= 90)),
  CONSTRAINT external_conditions_longitude_range
    CHECK (longitude IS NULL OR (longitude >= -180 AND longitude <= 180)),
  CONSTRAINT external_conditions_surge_nonneg
    CHECK (surge_multiplier IS NULL OR surge_multiplier >= 0),
  CONSTRAINT external_conditions_humidity_range
    CHECK (humidity_pct IS NULL OR (humidity_pct >= 0 AND humidity_pct <= 100))
);

CREATE INDEX IF NOT EXISTS idx_external_conditions_recorded_at
  ON public.external_conditions (recorded_at DESC);

CREATE INDEX IF NOT EXISTS idx_external_conditions_zone_id
  ON public.external_conditions (zone_id)
  WHERE zone_id IS NOT NULL;

-- Composite index for the primary analytics query pattern:
--   "give me conditions for zone X over the past N hours"
CREATE INDEX IF NOT EXISTS idx_external_conditions_zone_time
  ON public.external_conditions (zone_id, recorded_at DESC)
  WHERE zone_id IS NOT NULL;

-- ------------------------------------------------------------
-- Row-Level Security
-- merchant_locations and external_conditions are shared
-- reference data — any authenticated user can read or write.
-- ------------------------------------------------------------

ALTER TABLE public.merchant_locations  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.external_conditions ENABLE ROW LEVEL SECURITY;

CREATE POLICY merchant_locations_authenticated_read ON public.merchant_locations
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY merchant_locations_authenticated_write ON public.merchant_locations
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY merchant_locations_authenticated_update ON public.merchant_locations
  FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY external_conditions_authenticated_read ON public.external_conditions
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY external_conditions_authenticated_write ON public.external_conditions
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY external_conditions_authenticated_update ON public.external_conditions
  FOR UPDATE USING (auth.role() = 'authenticated');
