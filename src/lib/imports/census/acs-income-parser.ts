import { CENSUS_METRIC_KEYS } from '@/lib/zone-metrics/census-metric-keys';
import type { ZoneDemographicInsert } from '@/lib/zone-metrics/types';
import { buildZoneDemographicInsert, normalizeGeoId, parseNumber } from './shared';

export interface CensusIncomeRow {
  GEO_ID?: string;
  NAME?: string;
  B19013_001E?: string;
}

export interface CensusIncomeParserContext {
  referenceDatasetId: string;
  sourceVintage: string;
  boundaryType: 'tract' | 'block_group';
  h3Resolution: 7;
  geoidToH3Cells: Record<string, { h3Cell: string; areaWeight?: number }[]>;
}

export function parseAcsIncomeRows(rows: CensusIncomeRow[], ctx: CensusIncomeParserContext): ZoneDemographicInsert[] {
  const inserts: ZoneDemographicInsert[] = [];

  for (const row of rows) {
    const geoid = normalizeGeoId(row.GEO_ID);
    if (!geoid) continue;

    const income = parseNumber(row.B19013_001E);
    if (income === null) continue;

    for (const target of ctx.geoidToH3Cells[geoid] ?? []) {
      inserts.push(
        buildZoneDemographicInsert({
          referenceDatasetId: ctx.referenceDatasetId,
          boundaryType: ctx.boundaryType,
          boundaryExternalId: geoid,
          h3Resolution: ctx.h3Resolution,
          h3Cell: target.h3Cell,
          metricKey: CENSUS_METRIC_KEYS.MEDIAN_HOUSEHOLD_INCOME,
          metricValueNumeric: income,
          sourceVintage: ctx.sourceVintage,
          areaWeight: target.areaWeight ?? null,
          sourceConfidence: target.areaWeight != null ? 0.9 : 0.65,
          propertiesJson: { source_name: row.NAME ?? null },
        }),
      );
    }
  }

  return inserts;
}
