import { CENSUS_METRIC_KEYS } from '@/lib/zone-metrics/census-metric-keys';
import type { ZoneDemographicInsert } from '@/lib/zone-metrics/types';
import { buildZoneDemographicInsert, normalizeGeoId, parseNumber } from './shared';

export interface CensusCommuteRow {
  GEO_ID?: string;
  NAME?: string;
  B08303_001E?: string;
  B08134_001E?: string;
}

export interface CensusCommuteParserContext {
  referenceDatasetId: string;
  sourceVintage: string;
  boundaryType: 'tract';
  h3Resolution: 7;
  geoidToH3Cells: Record<string, { h3Cell: string; areaWeight?: number }[]>;
}

export function parseAcsCommuteRows(rows: CensusCommuteRow[], ctx: CensusCommuteParserContext): ZoneDemographicInsert[] {
  const inserts: ZoneDemographicInsert[] = [];

  for (const row of rows) {
    const geoid = normalizeGeoId(row.GEO_ID);
    if (!geoid) continue;

    const workerCount = parseNumber(row.B08303_001E);
    const meanCommuteMinutes = parseNumber(row.B08134_001E);

    for (const target of ctx.geoidToH3Cells[geoid] ?? []) {
      if (workerCount !== null) {
        inserts.push(
          buildZoneDemographicInsert({ referenceDatasetId: ctx.referenceDatasetId, boundaryType: ctx.boundaryType, boundaryExternalId: geoid, h3Resolution: ctx.h3Resolution, h3Cell: target.h3Cell, metricKey: CENSUS_METRIC_KEYS.WORKER_COUNT, metricValueNumeric: workerCount * (target.areaWeight ?? 1), sourceVintage: ctx.sourceVintage, areaWeight: target.areaWeight ?? null, propertiesJson: { source_name: row.NAME ?? null } }),
        );
      }

      if (meanCommuteMinutes !== null) {
        inserts.push(
          buildZoneDemographicInsert({ referenceDatasetId: ctx.referenceDatasetId, boundaryType: ctx.boundaryType, boundaryExternalId: geoid, h3Resolution: ctx.h3Resolution, h3Cell: target.h3Cell, metricKey: CENSUS_METRIC_KEYS.MEAN_COMMUTE_MINUTES, metricValueNumeric: meanCommuteMinutes, sourceVintage: ctx.sourceVintage, areaWeight: target.areaWeight ?? null }),
        );
      }
    }
  }

  return inserts;
}
