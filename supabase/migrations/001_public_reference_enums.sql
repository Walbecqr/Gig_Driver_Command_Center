-- ============================================================
-- Migration: data.gov reference overlay tables + enum extensions
-- ============================================================
-- Extends existing enum types with the values consumed by the
-- datagov ingestion services (nwsIngestion, censusAcsIngestion,
-- geojsonIngestion) and creates the eight domain overlay tables
-- that those services write to:
--
--   zone_risk_layers         — FEMA flood zones, NHTSA crash data
--   zone_transport_layers    — FHWA travel-time, road friction
--   zone_reference_layers    — TIGER boundaries, zip codes
--   zone_demand_drivers      — venues, airports, events
--   poi_reference            — transit hubs, hospitals, stadiums
--   zone_land_use_layers     — zoning / land-cover mix
--   infrastructure_reference — EV charging, fuel, rest stops
--   zone_demographics        — Census ACS metrics per boundary
--
-- All tables are shared reference data (not per-user) so RLS
-- allows any authenticated user to SELECT; authenticated users
-- running the ingestion flow may INSERT.
--
-- Prerequisites (already exist from prior migrations):
--   public.reference_features        (20260328010236_remote_schema.sql)
--   public.reference_datasets        (20260328010236_remote_schema.sql)
--   public.reference_ingest_batches  (20260328010236_remote_schema.sql)
--   public.refresh_cadence_enum      (20260328010236_remote_schema.sql)
--   public.reference_source_type_enum  (20260328010236_remote_schema.sql)
--   public.reference_layer_category_enum (20260328010236_remote_schema.sql)
-- ============================================================


-- ------------------------------------------------------------
-- 1. Extend reference_source_type_enum
--    Values consumed by the datagov ingestion layer.
-- ------------------------------------------------------------

ALTER TYPE public.reference_source_type_enum ADD VALUE IF NOT EXISTS 'nws';
ALTER TYPE public.reference_source_type_enum ADD VALUE IF NOT EXISTS 'census_acs';
ALTER TYPE public.reference_source_type_enum ADD VALUE IF NOT EXISTS 'geojson_file';
ALTER TYPE public.reference_source_type_enum ADD VALUE IF NOT EXISTS 'data_gov_api';
ALTER TYPE public.reference_source_type_enum ADD VALUE IF NOT EXISTS 'manual';


-- ------------------------------------------------------------
-- 2. Extend reference_layer_category_enum
--    One value per domain overlay table / semantic category.
-- ------------------------------------------------------------

ALTER TYPE public.reference_layer_category_enum ADD VALUE IF NOT EXISTS 'external_conditions';
ALTER TYPE public.reference_layer_category_enum ADD VALUE IF NOT EXISTS 'external_alerts';
ALTER TYPE public.reference_layer_category_enum ADD VALUE IF NOT EXISTS 'demographics';
ALTER TYPE public.reference_layer_category_enum ADD VALUE IF NOT EXISTS 'risk';
ALTER TYPE public.reference_layer_category_enum ADD VALUE IF NOT EXISTS 'transport';
ALTER TYPE public.reference_layer_category_enum ADD VALUE IF NOT EXISTS 'reference';
ALTER TYPE public.reference_layer_category_enum ADD VALUE IF NOT EXISTS 'demand';
ALTER TYPE public.reference_layer_category_enum ADD VALUE IF NOT EXISTS 'poi';
ALTER TYPE public.reference_layer_category_enum ADD VALUE IF NOT EXISTS 'land_use';
ALTER TYPE public.reference_layer_category_enum ADD VALUE IF NOT EXISTS 'infrastructure';


-- ------------------------------------------------------------
-- 3. Extend refresh_cadence_enum
--    Census ACS data is released on an annual cadence.
-- ------------------------------------------------------------

ALTER TYPE public.refresh_cadence_enum ADD VALUE IF NOT EXISTS 'annually';


-- ============================================================
-- Domain overlay tables
--
-- Convention for every table:
--   • UUID primary key  (gen_random_uuid())
--   • reference_feature_id FK → reference_features (CASCADE DELETE)
--   • reference_dataset_id  FK → reference_datasets (CASCADE DELETE)
--   • h3_resolution / h3_cell carry the H3 index at res 9 (default)
--   • source_confidence numeric(4,3)  — 0.000 … 1.000
--   • properties_json jsonb           — raw props for debugging
--   • created_at timestamptz
-- ============================================================


-- ------------------------------------------------------------
-- zone_risk_layers
-- Stores risk metrics from FEMA flood zones, NHTSA crash data,
-- and similar hazard datasets. One row per risk_type per H3 cell.
-- ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.zone_risk_layers (
  zone_risk_layer_id   uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
  reference_feature_id uuid          NOT NULL
    REFERENCES public.reference_features(reference_feature_id) ON DELETE CASCADE,
  reference_dataset_id uuid          NOT NULL
    REFERENCES public.reference_datasets(reference_dataset_id) ON DELETE CASCADE,
  h3_resolution        integer       NOT NULL DEFAULT 9,
  h3_cell              text          NOT NULL,
  risk_type            text          NOT NULL,
  risk_value_numeric   numeric(14,6),
  risk_value_text      text,
  units                text,
  source_confidence    numeric(4,3)  NOT NULL DEFAULT 0.9,
  properties_json      jsonb,
  created_at           timestamptz   NOT NULL DEFAULT now(),

  CONSTRAINT zone_risk_layers_h3_cell_not_blank
    CHECK (length(trim(h3_cell)) > 0),
  CONSTRAINT zone_risk_layers_risk_type_not_blank
    CHECK (length(trim(risk_type)) > 0),
  CONSTRAINT zone_risk_layers_confidence_range
    CHECK (source_confidence >= 0 AND source_confidence <= 1)
);

CREATE INDEX IF NOT EXISTS idx_zone_risk_layers_h3_cell
  ON public.zone_risk_layers (h3_cell, risk_type);

CREATE INDEX IF NOT EXISTS idx_zone_risk_layers_dataset
  ON public.zone_risk_layers (reference_dataset_id);

CREATE INDEX IF NOT EXISTS idx_zone_risk_layers_properties_gin
  ON public.zone_risk_layers USING gin (properties_json)
  WHERE properties_json IS NOT NULL;


-- ------------------------------------------------------------
-- zone_transport_layers
-- Stores travel-time, road friction, and corridor metrics from
-- FHWA and similar transport datasets.
-- ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.zone_transport_layers (
  zone_transport_layer_id uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
  reference_feature_id    uuid          NOT NULL
    REFERENCES public.reference_features(reference_feature_id) ON DELETE CASCADE,
  reference_dataset_id    uuid          NOT NULL
    REFERENCES public.reference_datasets(reference_dataset_id) ON DELETE CASCADE,
  h3_resolution           integer       NOT NULL DEFAULT 9,
  h3_cell                 text          NOT NULL,
  metric_key              text          NOT NULL,
  metric_value_numeric    numeric(14,6),
  metric_value_text       text,
  units                   text,
  source_confidence       numeric(4,3)  NOT NULL DEFAULT 0.9,
  properties_json         jsonb,
  created_at              timestamptz   NOT NULL DEFAULT now(),

  CONSTRAINT zone_transport_layers_h3_cell_not_blank
    CHECK (length(trim(h3_cell)) > 0),
  CONSTRAINT zone_transport_layers_metric_key_not_blank
    CHECK (length(trim(metric_key)) > 0),
  CONSTRAINT zone_transport_layers_confidence_range
    CHECK (source_confidence >= 0 AND source_confidence <= 1)
);

CREATE INDEX IF NOT EXISTS idx_zone_transport_layers_h3_cell
  ON public.zone_transport_layers (h3_cell, metric_key);

CREATE INDEX IF NOT EXISTS idx_zone_transport_layers_dataset
  ON public.zone_transport_layers (reference_dataset_id);


-- ------------------------------------------------------------
-- zone_reference_layers
-- Stores administrative boundary overlays: TIGER zip codes,
-- census tracts, city limits, counties.
-- ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.zone_reference_layers (
  zone_reference_layer_id uuid         PRIMARY KEY DEFAULT gen_random_uuid(),
  reference_feature_id    uuid         NOT NULL
    REFERENCES public.reference_features(reference_feature_id) ON DELETE CASCADE,
  reference_dataset_id    uuid         NOT NULL
    REFERENCES public.reference_datasets(reference_dataset_id) ON DELETE CASCADE,
  h3_resolution           integer      NOT NULL DEFAULT 9,
  h3_cell                 text         NOT NULL,
  boundary_type           text         NOT NULL,
  boundary_external_id    text,
  boundary_name           text,
  properties_json         jsonb,
  created_at              timestamptz  NOT NULL DEFAULT now(),

  CONSTRAINT zone_reference_layers_h3_cell_not_blank
    CHECK (length(trim(h3_cell)) > 0),
  CONSTRAINT zone_reference_layers_boundary_type_not_blank
    CHECK (length(trim(boundary_type)) > 0)
);

CREATE INDEX IF NOT EXISTS idx_zone_reference_layers_h3_cell
  ON public.zone_reference_layers (h3_cell, boundary_type);

CREATE INDEX IF NOT EXISTS idx_zone_reference_layers_boundary_external_id
  ON public.zone_reference_layers (boundary_external_id)
  WHERE boundary_external_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_zone_reference_layers_dataset
  ON public.zone_reference_layers (reference_dataset_id);


-- ------------------------------------------------------------
-- zone_demand_drivers
-- Stores demand-driver points: airports, stadiums, convention
-- centres, large employers, with an optional numeric weight.
-- ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.zone_demand_drivers (
  zone_demand_driver_id uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
  reference_feature_id  uuid          NOT NULL
    REFERENCES public.reference_features(reference_feature_id) ON DELETE CASCADE,
  reference_dataset_id  uuid          NOT NULL
    REFERENCES public.reference_datasets(reference_dataset_id) ON DELETE CASCADE,
  h3_resolution         integer       NOT NULL DEFAULT 9,
  h3_cell               text          NOT NULL,
  driver_type           text          NOT NULL,
  driver_name           text,
  driver_weight         numeric(12,4),
  capacity_value        numeric(12,4),
  units                 text,
  source_confidence     numeric(4,3)  NOT NULL DEFAULT 0.9,
  properties_json       jsonb,
  created_at            timestamptz   NOT NULL DEFAULT now(),

  CONSTRAINT zone_demand_drivers_h3_cell_not_blank
    CHECK (length(trim(h3_cell)) > 0),
  CONSTRAINT zone_demand_drivers_driver_type_not_blank
    CHECK (length(trim(driver_type)) > 0),
  CONSTRAINT zone_demand_drivers_confidence_range
    CHECK (source_confidence >= 0 AND source_confidence <= 1)
);

CREATE INDEX IF NOT EXISTS idx_zone_demand_drivers_h3_cell
  ON public.zone_demand_drivers (h3_cell, driver_type);

CREATE INDEX IF NOT EXISTS idx_zone_demand_drivers_dataset
  ON public.zone_demand_drivers (reference_dataset_id);


-- ------------------------------------------------------------
-- poi_reference
-- Stores point-of-interest reference rows: transit hubs,
-- hospitals, universities, large retail. Carries lat/lng in
-- addition to H3 for precise map rendering.
-- ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.poi_reference (
  poi_reference_id     uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
  reference_feature_id uuid          NOT NULL
    REFERENCES public.reference_features(reference_feature_id) ON DELETE CASCADE,
  reference_dataset_id uuid          NOT NULL
    REFERENCES public.reference_datasets(reference_dataset_id) ON DELETE CASCADE,
  h3_resolution        integer       NOT NULL DEFAULT 9,
  h3_cell              text          NOT NULL,
  poi_type             text          NOT NULL,
  poi_name             text,
  latitude             numeric(9,6),
  longitude            numeric(9,6),
  source_confidence    numeric(4,3)  NOT NULL DEFAULT 0.9,
  properties_json      jsonb,
  created_at           timestamptz   NOT NULL DEFAULT now(),

  CONSTRAINT poi_reference_h3_cell_not_blank
    CHECK (length(trim(h3_cell)) > 0),
  CONSTRAINT poi_reference_poi_type_not_blank
    CHECK (length(trim(poi_type)) > 0),
  CONSTRAINT poi_reference_confidence_range
    CHECK (source_confidence >= 0 AND source_confidence <= 1),
  CONSTRAINT poi_reference_latitude_range
    CHECK (latitude IS NULL OR (latitude >= -90 AND latitude <= 90)),
  CONSTRAINT poi_reference_longitude_range
    CHECK (longitude IS NULL OR (longitude >= -180 AND longitude <= 180))
);

CREATE INDEX IF NOT EXISTS idx_poi_reference_h3_cell
  ON public.poi_reference (h3_cell, poi_type);

CREATE INDEX IF NOT EXISTS idx_poi_reference_dataset
  ON public.poi_reference (reference_dataset_id);


-- ------------------------------------------------------------
-- zone_land_use_layers
-- Stores land-use / zoning classification overlays (NLCD, local
-- zoning GIS exports). coverage_fraction 0–1 is the share of
-- the H3 cell covered by this land-use type.
-- ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.zone_land_use_layers (
  zone_land_use_layer_id uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
  reference_feature_id   uuid          NOT NULL
    REFERENCES public.reference_features(reference_feature_id) ON DELETE CASCADE,
  reference_dataset_id   uuid          NOT NULL
    REFERENCES public.reference_datasets(reference_dataset_id) ON DELETE CASCADE,
  h3_resolution          integer       NOT NULL DEFAULT 9,
  h3_cell                text          NOT NULL,
  land_use_type          text          NOT NULL,
  coverage_fraction      numeric(6,4),
  intensity_score        numeric(10,4),
  source_confidence      numeric(4,3)  NOT NULL DEFAULT 0.9,
  properties_json        jsonb,
  created_at             timestamptz   NOT NULL DEFAULT now(),

  CONSTRAINT zone_land_use_layers_h3_cell_not_blank
    CHECK (length(trim(h3_cell)) > 0),
  CONSTRAINT zone_land_use_layers_land_use_type_not_blank
    CHECK (length(trim(land_use_type)) > 0),
  CONSTRAINT zone_land_use_layers_confidence_range
    CHECK (source_confidence >= 0 AND source_confidence <= 1),
  CONSTRAINT zone_land_use_layers_coverage_fraction_range
    CHECK (coverage_fraction IS NULL OR (coverage_fraction >= 0 AND coverage_fraction <= 1))
);

CREATE INDEX IF NOT EXISTS idx_zone_land_use_layers_h3_cell
  ON public.zone_land_use_layers (h3_cell, land_use_type);

CREATE INDEX IF NOT EXISTS idx_zone_land_use_layers_dataset
  ON public.zone_land_use_layers (reference_dataset_id);


-- ------------------------------------------------------------
-- infrastructure_reference
-- Stores infrastructure point rows: EV charging stations,
-- fuel stops, rest areas. Carries lat/lng for map rendering.
-- ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.infrastructure_reference (
  infrastructure_reference_id uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
  reference_feature_id        uuid          NOT NULL
    REFERENCES public.reference_features(reference_feature_id) ON DELETE CASCADE,
  reference_dataset_id        uuid          NOT NULL
    REFERENCES public.reference_datasets(reference_dataset_id) ON DELETE CASCADE,
  h3_resolution               integer       NOT NULL DEFAULT 9,
  h3_cell                     text          NOT NULL,
  infrastructure_type         text          NOT NULL,
  infrastructure_name         text,
  latitude                    numeric(9,6),
  longitude                   numeric(9,6),
  source_confidence           numeric(4,3)  NOT NULL DEFAULT 0.9,
  properties_json             jsonb,
  created_at                  timestamptz   NOT NULL DEFAULT now(),

  CONSTRAINT infrastructure_reference_h3_cell_not_blank
    CHECK (length(trim(h3_cell)) > 0),
  CONSTRAINT infrastructure_reference_type_not_blank
    CHECK (length(trim(infrastructure_type)) > 0),
  CONSTRAINT infrastructure_reference_confidence_range
    CHECK (source_confidence >= 0 AND source_confidence <= 1),
  CONSTRAINT infrastructure_reference_latitude_range
    CHECK (latitude IS NULL OR (latitude >= -90 AND latitude <= 90)),
  CONSTRAINT infrastructure_reference_longitude_range
    CHECK (longitude IS NULL OR (longitude >= -180 AND longitude <= 180))
);

CREATE INDEX IF NOT EXISTS idx_infrastructure_reference_h3_cell
  ON public.infrastructure_reference (h3_cell, infrastructure_type);

CREATE INDEX IF NOT EXISTS idx_infrastructure_reference_dataset
  ON public.infrastructure_reference (reference_dataset_id);


-- ------------------------------------------------------------
-- zone_demographics
-- Stores Census ACS metric rows — one row per (boundary, metric)
-- pair. boundary_external_id carries the census GEOID when
-- h3_cell is '' (county-level data without centroid coords).
-- Application layer must filter h3_cell <> '' for zone-scoring.
-- ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.zone_demographics (
  zone_demographic_id  uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
  reference_feature_id uuid          NOT NULL
    REFERENCES public.reference_features(reference_feature_id) ON DELETE CASCADE,
  reference_dataset_id uuid          NOT NULL
    REFERENCES public.reference_datasets(reference_dataset_id) ON DELETE CASCADE,
  boundary_type        text          NOT NULL DEFAULT 'census_geoid',
  boundary_external_id text,
  h3_resolution        integer       NOT NULL DEFAULT 9,
  -- Empty string when no centroid is available for this boundary.
  h3_cell              text          NOT NULL DEFAULT '',
  metric_key           text          NOT NULL,
  metric_value_numeric numeric(18,4),
  metric_value_text    text,
  units                text,
  source_vintage       text,
  source_confidence    numeric(4,3)  NOT NULL DEFAULT 0.95,
  created_at           timestamptz   NOT NULL DEFAULT now(),

  CONSTRAINT zone_demographics_boundary_type_not_blank
    CHECK (length(trim(boundary_type)) > 0),
  CONSTRAINT zone_demographics_metric_key_not_blank
    CHECK (length(trim(metric_key)) > 0),
  CONSTRAINT zone_demographics_confidence_range
    CHECK (source_confidence >= 0 AND source_confidence <= 1)
);

-- Primary analytics pattern: give me metric X for all H3 cells in zone Y
CREATE INDEX IF NOT EXISTS idx_zone_demographics_h3_cell_metric
  ON public.zone_demographics (h3_cell, metric_key)
  WHERE h3_cell <> '';

-- GEOID lookup for manual tessellation flows
CREATE INDEX IF NOT EXISTS idx_zone_demographics_boundary_external_id
  ON public.zone_demographics (boundary_external_id)
  WHERE boundary_external_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_zone_demographics_dataset_metric
  ON public.zone_demographics (reference_dataset_id, metric_key);


-- ============================================================
-- Row-Level Security
-- All tables are shared reference data. Any authenticated user
-- can SELECT; ingestion writes use the caller's auth session.
-- ============================================================

ALTER TABLE public.zone_risk_layers         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.zone_transport_layers     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.zone_reference_layers     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.zone_demand_drivers       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.poi_reference             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.zone_land_use_layers      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.infrastructure_reference  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.zone_demographics         ENABLE ROW LEVEL SECURITY;

CREATE POLICY zone_risk_layers_select ON public.zone_risk_layers
  FOR SELECT TO authenticated USING (true);
CREATE POLICY zone_risk_layers_insert ON public.zone_risk_layers
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY zone_transport_layers_select ON public.zone_transport_layers
  FOR SELECT TO authenticated USING (true);
CREATE POLICY zone_transport_layers_insert ON public.zone_transport_layers
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY zone_reference_layers_select ON public.zone_reference_layers
  FOR SELECT TO authenticated USING (true);
CREATE POLICY zone_reference_layers_insert ON public.zone_reference_layers
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY zone_demand_drivers_select ON public.zone_demand_drivers
  FOR SELECT TO authenticated USING (true);
CREATE POLICY zone_demand_drivers_insert ON public.zone_demand_drivers
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY poi_reference_select ON public.poi_reference
  FOR SELECT TO authenticated USING (true);
CREATE POLICY poi_reference_insert ON public.poi_reference
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY zone_land_use_layers_select ON public.zone_land_use_layers
  FOR SELECT TO authenticated USING (true);
CREATE POLICY zone_land_use_layers_insert ON public.zone_land_use_layers
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY infrastructure_reference_select ON public.infrastructure_reference
  FOR SELECT TO authenticated USING (true);
CREATE POLICY infrastructure_reference_insert ON public.infrastructure_reference
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY zone_demographics_select ON public.zone_demographics
  FOR SELECT TO authenticated USING (true);
CREATE POLICY zone_demographics_insert ON public.zone_demographics
  FOR INSERT TO authenticated WITH CHECK (true);
