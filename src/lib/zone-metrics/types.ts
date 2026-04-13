export type ZoneMetricValueType = 'count' | 'ratio' | 'currency' | 'index' | 'text';

export type ZoneMetricCategory =
  | 'demand'
  | 'demand_quality'
  | 'housing'
  | 'friction'
  | 'mobility'
  | 'demographic_profile'
  | 'confidence';

export type ZoneMetricFamily =
  | 'population'
  | 'households'
  | 'income'
  | 'tenure'
  | 'structure'
  | 'access'
  | 'commuting'
  | 'age'
  | 'education'
  | 'vehicle_availability'
  | 'digital_access';

export type ZoneMetricSourceScope = 'census_acs' | 'derived';

export interface ZoneMetricDefinition {
  metricKey: string;
  metricLabel: string;
  metricCategory: ZoneMetricCategory;
  metricFamily: ZoneMetricFamily;
  valueType: ZoneMetricValueType;
  units: string | null;
  sourceScope: ZoneMetricSourceScope;
  defaultH3Resolution: 6 | 7 | 8 | 9 | null;
  preferredBoundaryType: 'tract' | 'block_group' | 'county' | 'place' | null;
  isDerived: boolean;
  isActive: boolean;
  sourcePriority: number;
  description: string;
}

export interface ZoneDemographicInsert {
  reference_feature_id?: string | null;
  reference_dataset_id: string;
  boundary_type?: string | null;
  boundary_external_id?: string | null;
  h3_resolution: 6 | 7 | 8 | 9;
  h3_cell: string;
  metric_key: string;
  metric_value_numeric?: number | null;
  metric_value_text?: string | null;
  units?: string | null;
  source_vintage?: string | null;
  area_weight?: number | null;
  source_confidence?: number | null;
  properties_json?: Record<string, unknown> | null;
}
