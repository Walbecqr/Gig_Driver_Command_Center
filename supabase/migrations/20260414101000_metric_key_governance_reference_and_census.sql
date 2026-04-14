-- ============================================================
-- Migration: Controlled metric-key governance for Census + reference overlays
-- ============================================================
-- Adds/ensures:
--   1) zone_metric_registry exists with current reference-overlay schema
--   2) core Census + reference metric seed rows exist
--   3) optional NOT VALID FK from zone_demographics.metric_key -> registry.metric_key
-- ============================================================

CREATE TABLE IF NOT EXISTS public.zone_metric_registry (
  metric_key text PRIMARY KEY,
  display_name text NOT NULL,
  description text,
  units text,
  layer_category public.reference_layer_category_enum NOT NULL,
  source_type public.reference_source_type_enum,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT zone_metric_registry_metric_key_not_blank
    CHECK (length(trim(metric_key)) > 0)
);

INSERT INTO public.zone_metric_registry (
  metric_key,
  display_name,
  description,
  units,
  layer_category,
  source_type,
  is_active
)
VALUES
  ('boundary', 'Administrative Boundary', 'TIGER census boundary polygon and canonical reference boundary marker.', null, 'reference', 'geojson_file', true),
  ('flood_zone', 'Flood Zone', 'FEMA flood hazard zone classification.', 'zone_code', 'risk', 'geojson_file', true),
  ('crash_count', 'Crash Count', 'NHTSA crash/fatality proxy count for roadway safety overlays.', 'fatalities', 'risk', 'datagov_api', true),
  ('travel_time_index', 'Travel Time Index', 'FHWA travel-time reliability congestion index.', 'index', 'transport', 'datagov_api', true),

  ('population_count', 'Population Count', 'ACS total resident population estimate.', 'people', 'demographics', 'census_acs', true),
  ('household_count', 'Household Count', 'ACS total household estimate.', 'households', 'demographics', 'census_acs', true),
  ('population_density', 'Population Density', 'Derived from population and spatial allocation.', 'people_per_sq_mile', 'demographics', 'census_acs', true),
  ('household_density', 'Household Density', 'Derived from households and spatial allocation.', 'households_per_sq_mile', 'demographics', 'census_acs', true),
  ('median_household_income', 'Median Household Income', 'ACS median household income.', 'usd', 'demographics', 'census_acs', true),
  ('owner_household_count', 'Owner Household Count', 'ACS owner-occupied households.', 'households', 'demographics', 'census_acs', true),
  ('renter_household_count', 'Renter Household Count', 'ACS renter-occupied households.', 'households', 'demographics', 'census_acs', true),
  ('owner_share', 'Owner Share', 'Derived share of owner-occupied households.', 'share', 'demographics', 'census_acs', true),
  ('renter_share', 'Renter Share', 'Derived share of renter-occupied households.', 'share', 'demographics', 'census_acs', true),
  ('single_unit_detached_count', 'Single Unit Detached Count', 'ACS detached single-unit housing count.', 'units', 'demographics', 'census_acs', true),
  ('single_unit_attached_count', 'Single Unit Attached Count', 'ACS attached single-unit housing count.', 'units', 'demographics', 'census_acs', true),
  ('small_multifamily_count', 'Small Multifamily Count', 'ACS 2-4 unit structure count.', 'units', 'demographics', 'census_acs', true),
  ('multifamily_5plus_count', 'Multifamily 5+ Count', 'ACS 5+ unit structure count.', 'units', 'demographics', 'census_acs', true),
  ('large_structure_count', 'Large Structure Count', 'Derived larger-structure unit count.', 'units', 'demographics', 'census_acs', true),
  ('multifamily_share', 'Multifamily Share', 'Derived multifamily share.', 'share', 'demographics', 'census_acs', true),
  ('large_structure_share', 'Large Structure Share', 'Derived large-structure share.', 'share', 'demographics', 'census_acs', true),
  ('high_rise_proxy', 'High Rise Proxy', 'Derived proxy for high-rise concentration.', 'index', 'demographics', 'census_acs', true),
  ('worker_count', 'Worker Count', 'ACS worker population.', 'workers', 'demographics', 'census_acs', true),
  ('mean_commute_minutes', 'Mean Commute Minutes', 'ACS mean travel time to work.', 'minutes', 'demographics', 'census_acs', true),
  ('drive_alone_share', 'Drive Alone Share', 'Derived worker mode share.', 'share', 'demographics', 'census_acs', true),
  ('public_transit_share', 'Public Transit Share', 'Derived worker mode share.', 'share', 'demographics', 'census_acs', true),
  ('work_from_home_share', 'Work From Home Share', 'Derived worker mode share.', 'share', 'demographics', 'census_acs', true),
  ('age_18_24_share', 'Age 18-24 Share', 'Derived age profile share.', 'share', 'demographics', 'census_acs', true),
  ('age_25_44_share', 'Age 25-44 Share', 'Derived age profile share.', 'share', 'demographics', 'census_acs', true),
  ('age_65_plus_share', 'Age 65+ Share', 'Derived age profile share.', 'share', 'demographics', 'census_acs', true),
  ('student_share', 'Student Share', 'Derived student concentration proxy.', 'share', 'demographics', 'census_acs', true),
  ('zero_vehicle_household_share', 'Zero Vehicle Household Share', 'Derived no-vehicle household share.', 'share', 'demographics', 'census_acs', true),
  ('broadband_access_share', 'Broadband Access Share', 'Derived broadband access proxy.', 'share', 'demographics', 'census_acs', true)
ON CONFLICT (metric_key) DO UPDATE
SET
  display_name = EXCLUDED.display_name,
  description = EXCLUDED.description,
  units = EXCLUDED.units,
  layer_category = EXCLUDED.layer_category,
  source_type = EXCLUDED.source_type,
  is_active = EXCLUDED.is_active,
  updated_at = now();

DO $$
BEGIN
  IF to_regclass('public.zone_demographics') IS NOT NULL
     AND NOT EXISTS (
       SELECT 1
       FROM pg_constraint
       WHERE conname = 'fk_zone_demographics_metric_key_registry'
         AND conrelid = 'public.zone_demographics'::regclass
     ) THEN
    EXECUTE $stmt$
      ALTER TABLE public.zone_demographics
      ADD CONSTRAINT fk_zone_demographics_metric_key_registry
      FOREIGN KEY (metric_key)
      REFERENCES public.zone_metric_registry(metric_key)
      NOT VALID
    $stmt$;
  END IF;
END
$$;
