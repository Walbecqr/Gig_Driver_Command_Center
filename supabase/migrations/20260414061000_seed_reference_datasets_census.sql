-- ============================================================
-- Migration: Seed Census ACS + TIGER reference_datasets
-- ============================================================
-- Assumes the following already exist:
--   public.reference_source_type_enum
--   public.reference_layer_category_enum
--   public.refresh_cadence_enum
--   public.reference_datasets
--
-- Idempotency:
--   1) Adds unique index on dataset_slug (if missing)
--   2) Seeds/updates rows by dataset_slug via ON CONFLICT
-- ============================================================

create unique index if not exists idx_reference_datasets_dataset_slug
  on public.reference_datasets (dataset_slug);

insert into public.reference_datasets (
  source_type,
  layer_category,
  dataset_name,
  dataset_slug,
  source_url,
  source_agency,
  description,
  refresh_cadence,
  is_active,
  source_vintage,
  parser_version,
  notes
)
values
(
  'census_acs',
  'demographics',
  'ACS 5-Year Total Population',
  'acs_5yr_total_population',
  'https://data.census.gov/',
  'U.S. Census Bureau',
  'ACS 5-year population counts used for zone demand baseline, population density, and market comparison.',
  'annually',
  true,
  null,
  '1.0.0',
  'Primary structural demand input. Recommended geography: tract or block group. Target table: zone_demographics.'
),
(
  'census_acs',
  'demographics',
  'ACS 5-Year Total Households',
  'acs_5yr_total_households',
  'https://data.census.gov/',
  'U.S. Census Bureau',
  'ACS 5-year household counts used for household density, residential demand surface, and zone normalization.',
  'annually',
  true,
  null,
  '1.0.0',
  'Recommended geography: tract or block group. Target table: zone_demographics.'
),
(
  'census_acs',
  'demographics',
  'ACS B19013 Median Household Income',
  'acs_b19013_median_household_income',
  'https://data.census.gov/table/ACSDT5Y2023.B19013',
  'U.S. Census Bureau',
  'Median household income used as a proxy for discretionary spend, order-value quality, and tip headroom.',
  'annually',
  true,
  null,
  '1.0.0',
  'Recommended geography: tract or block group. Target table: zone_demographics. Metric key: median_household_income.'
),
(
  'census_acs',
  'demographics',
  'ACS B25024 Units in Structure',
  'acs_b25024_units_in_structure',
  'https://data.census.gov/table/ACSDT5Y2023.B25024',
  'U.S. Census Bureau',
  'Housing structure distribution used to derive apartment friction, multifamily share, and high-rise/access complexity proxies.',
  'annually',
  true,
  null,
  '1.0.0',
  'Recommended geography: tract or block group. Target table: zone_demographics. Derived metrics include multifamily_share and high_rise_proxy.'
),
(
  'census_acs',
  'demographics',
  'ACS B25003 Tenure',
  'acs_b25003_tenure',
  'https://data.census.gov/table/ACSDT5Y2023.B25003',
  'U.S. Census Bureau',
  'Owner vs renter housing counts used to derive renter share and refine access-friction and urban-density modeling.',
  'annually',
  true,
  null,
  '1.0.0',
  'Recommended geography: tract or block group. Target table: zone_demographics. Optional in phase 1, strong in phase 2.'
),
(
  'census_acs',
  'demographics',
  'ACS Journey to Work / Commuting',
  'acs_journey_to_work_commuting',
  'https://data.census.gov/',
  'U.S. Census Bureau',
  'Commuting and worker-flow tables used for lunch vs dinner timing, commuter-market identification, and shift strategy priors.',
  'annually',
  true,
  null,
  '1.0.0',
  'Recommended geography: tract. Target table: zone_demographics or zone_transport_layers depending on implementation split.'
),
(
  'census_acs',
  'demographics',
  'ACS Age Distribution',
  'acs_age_distribution',
  'https://data.census.gov/',
  'U.S. Census Bureau',
  'Age-bucket distributions used for household-type demand profiling and late-night/student/family zone weighting.',
  'annually',
  false,
  null,
  '1.0.0',
  'Deferred dataset. Useful after phase 1. Target table: zone_demographics.'
),
(
  'census_acs',
  'demographics',
  'ACS Household Composition',
  'acs_household_composition',
  'https://data.census.gov/',
  'U.S. Census Bureau',
  'Household composition used for family-heavy vs solo-renter profiling and dinner vs late-night demand heuristics.',
  'annually',
  false,
  null,
  '1.0.0',
  'Deferred dataset. Target table: zone_demographics.'
),
(
  'census_acs',
  'demographics',
  'ACS Educational Enrollment / College Population',
  'acs_educational_enrollment_college_population',
  'https://data.census.gov/',
  'U.S. Census Bureau',
  'Educational enrollment and student concentration tables used for student-market detection, college housing friction, and late-night demand priors.',
  'annually',
  false,
  null,
  '1.0.0',
  'Deferred dataset. Target table: zone_demographics, optionally zone_demand_drivers for derived demand-driver rows.'
),
(
  'census_acs',
  'demographics',
  'ACS Vehicle Availability',
  'acs_vehicle_availability',
  'https://data.census.gov/',
  'U.S. Census Bureau',
  'Vehicle availability tables used as a proxy for delivery dependence and urban demand intensity.',
  'annually',
  false,
  null,
  '1.0.0',
  'Deferred dataset. Target table: zone_demographics.'
),
(
  'census_acs',
  'demographics',
  'ACS Internet and Computer Access',
  'acs_internet_computer_access',
  'https://data.census.gov/',
  'U.S. Census Bureau',
  'Digital-access proxy used mainly as a confidence modifier for sparse or rural market scoring.',
  'annually',
  false,
  null,
  '1.0.0',
  'Deferred dataset. Use as confidence modifier, not primary score driver. Target table: zone_demographics.'
),
(
  'geojson_file',
  'reference',
  'TIGER/Line Census Tracts',
  'tiger_line_census_tracts',
  'https://www.census.gov/geographies/mapping-files/time-series/geo/tiger-line-file.html',
  'U.S. Census Bureau',
  'Authoritative tract boundary geometry used for H3 interpolation, geography joins, and zone reference mapping.',
  'annually',
  true,
  null,
  '1.0.0',
  'Primary geometry source for tract-level ACS interpolation. Target tables: reference_features and zone_reference_layers.'
),
(
  'geojson_file',
  'reference',
  'TIGER/Line Block Groups',
  'tiger_line_block_groups',
  'https://www.census.gov/geographies/mapping-files/time-series/geo/tiger-line-file.html',
  'U.S. Census Bureau',
  'Authoritative block group boundary geometry used for finer-grain ACS interpolation and residential density mapping.',
  'annually',
  true,
  null,
  '1.0.0',
  'Recommended for finer residential scoring. Target tables: reference_features and zone_reference_layers.'
),
(
  'geojson_file',
  'reference',
  'TIGER/Line Counties',
  'tiger_line_counties',
  'https://www.census.gov/geographies/mapping-files/time-series/geo/tiger-line-file.html',
  'U.S. Census Bureau',
  'County boundary geometry used for market hierarchy, coarse regional overlays, and fallback joins.',
  'annually',
  true,
  null,
  '1.0.0',
  'Useful for market-level and coarse res6 mapping. Target tables: reference_features and zone_reference_layers.'
),
(
  'geojson_file',
  'reference',
  'TIGER/Line Places',
  'tiger_line_places',
  'https://www.census.gov/geographies/mapping-files/time-series/geo/tiger-line-file.html',
  'U.S. Census Bureau',
  'Place boundary geometry used for city/town overlays, market naming, and reference joins.',
  'annually',
  true,
  null,
  '1.0.0',
  'Useful for labeling and geographic hierarchy. Target tables: reference_features and zone_reference_layers.'
)
on conflict (dataset_slug) do update
set
  source_type = excluded.source_type,
  layer_category = excluded.layer_category,
  dataset_name = excluded.dataset_name,
  source_url = excluded.source_url,
  source_agency = excluded.source_agency,
  description = excluded.description,
  refresh_cadence = excluded.refresh_cadence,
  is_active = excluded.is_active,
  source_vintage = excluded.source_vintage,
  parser_version = excluded.parser_version,
  notes = excluded.notes,
  updated_at = now();

-- Follow-up verification query (run manually if desired):
-- select
--   reference_dataset_id,
--   source_type,
--   layer_category,
--   dataset_name,
--   dataset_slug,
--   refresh_cadence,
--   is_active
-- from public.reference_datasets
-- order by
--   is_active desc,
--   layer_category,
--   dataset_name;
