import { CENSUS_METRIC_KEYS } from '@/lib/zone-metrics/census-metric-keys';
import type { ZoneDemographicInsert } from '@/lib/zone-metrics/types';
import { buildZoneDemographicInsert, normalizeGeoId, parseNumber } from './shared';

export interface CensusTenureRow {
  GEO_ID?: string;
  NAME?: string;
  B25003_002E?: string;
  B25003_003E?: string;
}

export interface CensusTenureParserContext {
  referenceDatasetId: string;
  sourceVintage: string;
  boundaryType: 'tract' | 'block_group';
  h3Resolution: 7;
  geoidToH3Cells: Record<string, { h3Cell: string; areaWeight?: number }[]>;
}

export function parseAcsTenureRows(rows: CensusTenureRow[], ctx: CensusTenureParserContext): ZoneDemographicInsert[] {
  const inserts: ZoneDemographicInsert[] = [];
  for (const row of rows) {
    const geoid = normalizeGeoId(row.GEO_ID);
    if (!geoid) continue;

    const ownerCount = parseNumber(row.B25003_002E) ?? 0;
    const renterCount = parseNumber(row.B25003_003E) ?? 0;

    for (const target of ctx.geoidToH3Cells[geoid] ?? []) {
      const weight = target.areaWeight ?? 1;
      inserts.push(
        buildZoneDemographicInsert({ referenceDatasetId: ctx.referenceDatasetId, boundaryType: ctx.boundaryType, boundaryExternalId: geoid, h3Resolution: ctx.h3Resolution, h3Cell: target.h3Cell, metricKey: CENSUS_METRIC_KEYS.OWNER_HOUSEHOLD_COUNT, metricValueNumeric: ownerCount * weight, sourceVintage: ctx.sourceVintage, areaWeight: target.areaWeight ?? null, propertiesJson: { source_name: row.NAME ?? null } }),
        buildZoneDemographicInsert({ referenceDatasetId: ctx.referenceDatasetId, boundaryType: ctx.boundaryType, boundaryExternalId: geoid, h3Resolution: ctx.h3Resolution, h3Cell: target.h3Cell, metricKey: CENSUS_METRIC_KEYS.RENTER_HOUSEHOLD_COUNT, metricValueNumeric: renterCount * weight, sourceVintage: ctx.sourceVintage, areaWeight: target.areaWeight ?? null }),
      );
    }
  }

  return inserts;
}
