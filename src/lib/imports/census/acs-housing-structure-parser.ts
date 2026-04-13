import { CENSUS_METRIC_KEYS } from '@/lib/zone-metrics/census-metric-keys';
import type { ZoneDemographicInsert } from '@/lib/zone-metrics/types';
import { buildZoneDemographicInsert, normalizeGeoId, parseNumber } from './shared';

export interface CensusHousingStructureRow {
  GEO_ID?: string;
  NAME?: string;
  B25024_002E?: string;
  B25024_003E?: string;
  B25024_004E?: string;
  B25024_005E?: string;
  B25024_006E?: string;
  B25024_007E?: string;
  B25024_008E?: string;
  B25024_009E?: string;
}

export interface CensusHousingStructureParserContext {
  referenceDatasetId: string;
  sourceVintage: string;
  boundaryType: 'tract' | 'block_group';
  h3Resolution: 7;
  geoidToH3Cells: Record<string, { h3Cell: string; areaWeight?: number }[]>;
}

export function parseAcsHousingStructureRows(rows: CensusHousingStructureRow[], ctx: CensusHousingStructureParserContext): ZoneDemographicInsert[] {
  const inserts: ZoneDemographicInsert[] = [];

  for (const row of rows) {
    const geoid = normalizeGeoId(row.GEO_ID);
    if (!geoid) continue;

    const detached = parseNumber(row.B25024_002E) ?? 0;
    const attached = parseNumber(row.B25024_003E) ?? 0;
    const twoUnits = parseNumber(row.B25024_004E) ?? 0;
    const threeOrFour = parseNumber(row.B25024_005E) ?? 0;
    const fiveToNine = parseNumber(row.B25024_006E) ?? 0;
    const tenToNineteen = parseNumber(row.B25024_007E) ?? 0;
    const twentyToFortyNine = parseNumber(row.B25024_008E) ?? 0;
    const fiftyPlus = parseNumber(row.B25024_009E) ?? 0;
    const smallMultifamily = twoUnits + threeOrFour;
    const multifamily5Plus = fiveToNine + tenToNineteen + twentyToFortyNine + fiftyPlus;

    for (const target of ctx.geoidToH3Cells[geoid] ?? []) {
      const weight = target.areaWeight ?? 1;
      inserts.push(
        buildZoneDemographicInsert({ referenceDatasetId: ctx.referenceDatasetId, boundaryType: ctx.boundaryType, boundaryExternalId: geoid, h3Resolution: ctx.h3Resolution, h3Cell: target.h3Cell, metricKey: CENSUS_METRIC_KEYS.SINGLE_UNIT_DETACHED_COUNT, metricValueNumeric: detached * weight, sourceVintage: ctx.sourceVintage, areaWeight: target.areaWeight ?? null, propertiesJson: { source_name: row.NAME ?? null } }),
        buildZoneDemographicInsert({ referenceDatasetId: ctx.referenceDatasetId, boundaryType: ctx.boundaryType, boundaryExternalId: geoid, h3Resolution: ctx.h3Resolution, h3Cell: target.h3Cell, metricKey: CENSUS_METRIC_KEYS.SINGLE_UNIT_ATTACHED_COUNT, metricValueNumeric: attached * weight, sourceVintage: ctx.sourceVintage, areaWeight: target.areaWeight ?? null }),
        buildZoneDemographicInsert({ referenceDatasetId: ctx.referenceDatasetId, boundaryType: ctx.boundaryType, boundaryExternalId: geoid, h3Resolution: ctx.h3Resolution, h3Cell: target.h3Cell, metricKey: CENSUS_METRIC_KEYS.SMALL_MULTIFAMILY_COUNT, metricValueNumeric: smallMultifamily * weight, sourceVintage: ctx.sourceVintage, areaWeight: target.areaWeight ?? null }),
        buildZoneDemographicInsert({ referenceDatasetId: ctx.referenceDatasetId, boundaryType: ctx.boundaryType, boundaryExternalId: geoid, h3Resolution: ctx.h3Resolution, h3Cell: target.h3Cell, metricKey: CENSUS_METRIC_KEYS.MULTIFAMILY_5PLUS_COUNT, metricValueNumeric: multifamily5Plus * weight, sourceVintage: ctx.sourceVintage, areaWeight: target.areaWeight ?? null }),
      );
    }
  }

  return inserts;
}
