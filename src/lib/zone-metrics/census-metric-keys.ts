export const CENSUS_METRIC_KEYS = {
  POPULATION_COUNT: 'population_count',
  HOUSEHOLD_COUNT: 'household_count',
  POPULATION_DENSITY: 'population_density',
  HOUSEHOLD_DENSITY: 'household_density',

  MEDIAN_HOUSEHOLD_INCOME: 'median_household_income',

  OWNER_HOUSEHOLD_COUNT: 'owner_household_count',
  RENTER_HOUSEHOLD_COUNT: 'renter_household_count',
  OWNER_SHARE: 'owner_share',
  RENTER_SHARE: 'renter_share',

  SINGLE_UNIT_DETACHED_COUNT: 'single_unit_detached_count',
  SINGLE_UNIT_ATTACHED_COUNT: 'single_unit_attached_count',
  SMALL_MULTIFAMILY_COUNT: 'small_multifamily_count',
  MULTIFAMILY_5PLUS_COUNT: 'multifamily_5plus_count',
  LARGE_STRUCTURE_COUNT: 'large_structure_count',
  MULTIFAMILY_SHARE: 'multifamily_share',
  LARGE_STRUCTURE_SHARE: 'large_structure_share',
  HIGH_RISE_PROXY: 'high_rise_proxy',

  WORKER_COUNT: 'worker_count',
  MEAN_COMMUTE_MINUTES: 'mean_commute_minutes',
  DRIVE_ALONE_SHARE: 'drive_alone_share',
  PUBLIC_TRANSIT_SHARE: 'public_transit_share',
  WORK_FROM_HOME_SHARE: 'work_from_home_share',

  AGE_18_24_SHARE: 'age_18_24_share',
  AGE_25_44_SHARE: 'age_25_44_share',
  AGE_65_PLUS_SHARE: 'age_65_plus_share',

  STUDENT_SHARE: 'student_share',
  ZERO_VEHICLE_HOUSEHOLD_SHARE: 'zero_vehicle_household_share',
  BROADBAND_ACCESS_SHARE: 'broadband_access_share',
} as const;

export type CensusMetricKey = (typeof CENSUS_METRIC_KEYS)[keyof typeof CENSUS_METRIC_KEYS];
