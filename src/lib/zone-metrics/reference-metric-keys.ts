export const REFERENCE_METRIC_KEYS = {
  BOUNDARY: 'boundary',
  FLOOD_ZONE: 'flood_zone',
  CRASH_COUNT: 'crash_count',
  TRAVEL_TIME_INDEX: 'travel_time_index',
} as const;

export type ReferenceMetricKey = (typeof REFERENCE_METRIC_KEYS)[keyof typeof REFERENCE_METRIC_KEYS];
