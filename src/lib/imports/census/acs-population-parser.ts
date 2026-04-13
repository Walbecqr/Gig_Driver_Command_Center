import { CENSUS_METRIC_KEYS } from '@/lib/zone-metrics/census-metric-keys';
import type { ZoneDemographicInsert } from '@/lib/zone-metrics/types';
import { buildZoneDemographicInsert, normalizeGeoId, parseNumber } from './shared';

export interface CensusPopulationRow {
  GEO_ID?: string;
  NAME?: string;
  B01003_001E?: string;
}

export interface CensusPopulationParserContext {
  referenceDatasetId: string;
  sourceVintage: string;
  boundaryType: 'tract' | 'block_group';
  h3Resolution: 7;
  geoidToH3Cells: Record<string, { h3Cell: string; areaWeight?: number }[]>;
}

export function parseAcsPopulationRows(rows: CensusPopulationRow[], ctx: CensusPopulationParserContext): ZoneDemographicInsert[] {
  const inserts: ZoneDemographicInsert[] = [];

  for (const row of rows) {
    const geoid = normalizeGeoId(row.GEO_ID);
    if (!geoid) continue;

    const population = parseNumber(row.B01003_001E);
    if (population === null) continue;

    for (const target of ctx.geoidToH3Cells[geoid] ?? []) {
      const weightedPopulation = target.areaWeight != null ? population * target.areaWeight : population;

      inserts.push(
        buildZoneDemographicInsert({
          referenceDatasetId: ctx.referenceDatasetId,
          boundaryType: ctx.boundaryType,
          boundaryExternalId: geoid,
          h3Resolution: ctx.h3Resolution,
          h3Cell: target.h3Cell,
          metricKey: CENSUS_METRIC_KEYS.POPULATION_COUNT,
          metricValueNumeric: weightedPopulation,
          sourceVintage: ctx.sourceVintage,
          areaWeight: target.areaWeight ?? null,
          sourceConfidence: target.areaWeight != null ? 0.95 : 0.7,
          propertiesJson: { source_name: row.NAME ?? null, raw_population: population },
        }),
      );
    }
  }

  return inserts;
}
