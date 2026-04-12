/**
 * Census ACS ingestion service — writes parsed ACS rows to Supabase.
 *
 * Each CensusAcsRow becomes:
 *   1. One reference_features row (centroid geometry + raw properties).
 *   2. N zone_demographics rows — one per metric in the row.
 *
 * H3 cells at resolutions 6, 7, 8 are computed from the centroid and stored
 * on the reference_feature; resolution 9 is used for the zone_demographics
 * h3_cell column so it aligns with the rest of the zone-scoring pipeline.
 *
 * When the row has no centroid coordinates (common for county-level data),
 * h3_cell is null and the boundary_type / boundary_external_id fields on
 * zone_demographics carry the GEOID for manual H3 tessellation later.
 */

import { supabaseClient as supabase } from '@/services/supabase/client';
import { getZoneId } from '@/utils/h3';
import type { Json } from '@/types/supabase.generated';
import {
  ensureReferenceDataset,
  createReferenceIngestBatch,
  finaliseReferenceIngestBatch,
  type ReferenceDatasetParams,
} from './referenceRegistry';
import type { CensusAcsRow } from './censusAcsParser';

// Default dataset descriptor — callers can override individual fields.
const DEFAULT_ACS_DATASET: ReferenceDatasetParams = {
  slug:          'census_acs_5yr',
  sourceType:    'census_acs',
  layerCategory: 'demographics',
  datasetName:   'Census ACS 5-Year Estimates',
  sourceUrl:     'https://data.census.gov',
  sourceAgency:  'U.S. Census Bureau',
  description:   'American Community Survey 5-year demographic estimates',
  refreshCadence: 'annually',
};

const H3_RESOLUTION = 9;

// ----------------------------------------------------------------
// ingestCensusAcs
// ----------------------------------------------------------------

/**
 * Ingest parsed Census ACS rows into Supabase.
 *
 * @param rows           Parsed CensusAcsRow array from censusAcsParser.
 * @param datasetParams  Optional overrides for the reference_datasets row.
 * @returns              The reference_ingest_batch_id for this run.
 */
export async function ingestCensusAcs(
  rows: CensusAcsRow[],
  datasetParams?: Partial<ReferenceDatasetParams>,
): Promise<string> {
  const params = { ...DEFAULT_ACS_DATASET, ...datasetParams };

  // Pass vintage from first row if available and not already in params
  const firstVintage = rows[0]?.vintage ?? null;
  if (firstVintage && !datasetParams?.sourceVintage) {
    params.sourceVintage = firstVintage;
  }

  const referenceDatasetId = await ensureReferenceDataset(params);
  const batchId = await createReferenceIngestBatch({
    referenceDatasetId,
    sourceRecordCount: rows.length,
  });

  let parsedCount = 0;

  for (const row of rows) {
    // 1. Insert reference_feature
    const { data: feature, error: featureError } = await supabase
      .from('reference_features')
      .insert({
        reference_dataset_id:      referenceDatasetId,
        reference_ingest_batch_id: batchId,
        feature_external_id:       row.geoid,
        feature_name:              row.name,
        geometry_type:             row.centroidLat != null ? 'point' : 'unknown',
        centroid_lat:              row.centroidLat,
        centroid_lng:              row.centroidLng,
        h3_res6:
          row.centroidLat != null && row.centroidLng != null
            ? getZoneId(row.centroidLat, row.centroidLng, 6)
            : null,
        h3_res7:
          row.centroidLat != null && row.centroidLng != null
            ? getZoneId(row.centroidLat, row.centroidLng, 7)
            : null,
        h3_res8:
          row.centroidLat != null && row.centroidLng != null
            ? getZoneId(row.centroidLat, row.centroidLng, 8)
            : null,
        raw_properties_json: row.rawRecord as Json,
      })
      .select('reference_feature_id')
      .single();

    if (featureError || !feature) continue;

    // Compute H3 cell at res 9 (may be null for county-level without centroid)
    const h3Cell =
      row.centroidLat != null && row.centroidLng != null
        ? getZoneId(row.centroidLat, row.centroidLng, H3_RESOLUTION)
        : null;

    // 2. Insert zone_demographics — one row per metric
    let metricCount = 0;
    for (const metric of row.metrics) {
      if (metric.metricValueNumeric == null && metric.metricValueText == null) {
        continue;
      }

      const { error: demoError } = await supabase
        .from('zone_demographics')
        .insert({
          reference_feature_id: feature.reference_feature_id,
          reference_dataset_id: referenceDatasetId,
          boundary_type:        'census_geoid',
          boundary_external_id: row.geoid,
          h3_resolution:        H3_RESOLUTION,
          h3_cell:              h3Cell ?? '',   // empty string when no centroid — filtered by app layer
          metric_key:           metric.metricKey,
          metric_value_numeric: metric.metricValueNumeric,
          metric_value_text:    metric.metricValueText,
          units:                metric.units,
          source_vintage:       row.vintage,
          source_confidence:    0.95,
        });

      if (!demoError) metricCount++;
    }

    if (metricCount > 0) parsedCount++;
  }

  await finaliseReferenceIngestBatch(batchId, rows.length, parsedCount);
  return batchId;
}
