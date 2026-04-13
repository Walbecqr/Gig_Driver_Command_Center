import { assertKnownZoneMetricKey, getZoneMetricDefinition } from '@/lib/zone-metrics/registry';
import type { ZoneDemographicInsert } from '@/lib/zone-metrics/types';

export function parseNumber(value: unknown): number | null {
  if (value === null || value === undefined || value === '') return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

export function normalizeGeoId(value?: string): string | null {
  if (!value) return null;
  return value.replace(/^1400000US/, '').replace(/^1500000US/, '');
}

export function buildZoneDemographicInsert(input: {
  referenceDatasetId: string;
  boundaryType: string;
  boundaryExternalId: string;
  h3Resolution: 6 | 7 | 8 | 9;
  h3Cell: string;
  metricKey: string;
  metricValueNumeric?: number | null;
  metricValueText?: string | null;
  sourceVintage?: string | null;
  areaWeight?: number | null;
  sourceConfidence?: number | null;
  propertiesJson?: Record<string, unknown> | null;
}): ZoneDemographicInsert {
  assertKnownZoneMetricKey(input.metricKey);
  const definition = getZoneMetricDefinition(input.metricKey);

  return {
    reference_dataset_id: input.referenceDatasetId,
    boundary_type: input.boundaryType,
    boundary_external_id: input.boundaryExternalId,
    h3_resolution: input.h3Resolution,
    h3_cell: input.h3Cell,
    metric_key: input.metricKey,
    metric_value_numeric: input.metricValueNumeric ?? null,
    metric_value_text: input.metricValueText ?? null,
    units: definition.units,
    source_vintage: input.sourceVintage ?? null,
    area_weight: input.areaWeight ?? null,
    source_confidence: input.sourceConfidence ?? 1,
    properties_json: input.propertiesJson ?? null,
  };
}
