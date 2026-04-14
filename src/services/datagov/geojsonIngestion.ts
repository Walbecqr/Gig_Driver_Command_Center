/**
 * Generic GeoJSON ingestion service — routes parsed features to domain tables.
 *
 * Reads the profile.targetTable field on each ParsedGeoJsonFeature and
 * writes to the appropriate overlay table:
 *
 *   zone_risk_layers      — FEMA flood zones, NHTSA crash data
 *   zone_transport_layers — FHWA travel-time, road friction
 *   zone_reference_layers — TIGER boundaries, zip codes
 *   zone_demand_drivers   — venues, airports, events
 *   poi_reference         — transit hubs, hospitals, stadiums
 *   zone_land_use_layers  — zoning / land-cover mix
 *   infrastructure_reference — EV charging, fuel, rest stops
 *
 * Pattern for each feature:
 *   1. Insert reference_features row (geometry + raw / normalized properties).
 *   2. Insert the domain overlay row with FK to reference_features.
 *
 * H3 resolutions:
 *   - reference_features: h3_res6, h3_res7, h3_res8 (all three stored).
 *   - domain tables: zone_id at res 9 (default H3 resolution).
 *   - When centroid is null, zone_id is stored as '' — callers can filter or
 *     handle via a separate tessellation pass.
 */

import { getSupabaseClientOrThrow } from '../supabase/utils';
import { getZoneId } from '@/utils/h3';
import type { Json } from '@/types/supabase.generated';
import {
  ensureReferenceDataset,
  createReferenceIngestBatch,
  finaliseReferenceIngestBatch,
  type ReferenceDatasetParams,
} from './referenceRegistry';
import type { ParsedGeoJsonFeature } from './geojsonParser';

const H3_RESOLUTION = 9;

// ----------------------------------------------------------------
// Main ingestion entry point
// ----------------------------------------------------------------

/**
 * Ingest a batch of parsed GeoJSON features.
 *
 * All features in the batch must share the same target table (enforced by
 * the caller: run separate ingestion calls per dataset / profile).
 *
 * @param features       Output from parseGeoJsonFeatureCollection().
 * @param datasetParams  reference_datasets descriptor for this file.
 * @returns              reference_ingest_batch_id for this run.
 */
export async function ingestGeoJsonFeatures(
  features: ParsedGeoJsonFeature[],
  datasetParams: ReferenceDatasetParams,
): Promise<string> {
  const supabase = getSupabaseClientOrThrow('[geojsonIngestion] Supabase client is not configured');
  const referenceDatasetId = await ensureReferenceDataset(datasetParams);
  const batchId = await createReferenceIngestBatch({
    referenceDatasetId,
    sourceRecordCount: features.length,
  });

  let parsedCount = 0;

  for (const feat of features) {
    // 1. Insert reference_feature
    const { data: refFeat, error: refError } = await supabase
      .from('reference_features')
      .insert({
        reference_dataset_id: referenceDatasetId,
        reference_ingest_batch_id: batchId,
        feature_external_id: feat.featureExternalId,
        feature_name: feat.featureName,
        feature_subtype: feat.featureSubtype,
        geometry_type: feat.geometryType,
        geometry_json: (feat.geometryJson as Json) ?? null,
        centroid_lat: feat.centroidLat,
        centroid_lng: feat.centroidLng,
        h3_res6:
          feat.centroidLat != null && feat.centroidLng != null
            ? getZoneId(feat.centroidLat, feat.centroidLng, 6)
            : null,
        h3_res7:
          feat.centroidLat != null && feat.centroidLng != null
            ? getZoneId(feat.centroidLat, feat.centroidLng, 7)
            : null,
        h3_res8:
          feat.centroidLat != null && feat.centroidLng != null
            ? getZoneId(feat.centroidLat, feat.centroidLng, 8)
            : null,
        raw_properties_json: feat.rawProperties as Json,
        normalized_properties_json: (feat.normalizedProperties as Json) ?? null,
        source_confidence: feat.profile.sourceConfidence ?? 0.9,
      })
      .select('reference_feature_id')
      .single();

    if (refError || !refFeat) continue;

    const zoneId =
      feat.centroidLat != null && feat.centroidLng != null
        ? getZoneId(feat.centroidLat, feat.centroidLng, H3_RESOLUTION)
        : '';

    // 2. Route to the appropriate domain table
    const didInsert = await insertDomainRow(
      feat,
      refFeat.reference_feature_id,
      referenceDatasetId,
      zoneId,
      supabase,
    );

    if (didInsert) parsedCount++;
  }

  await finaliseReferenceIngestBatch(batchId, features.length, parsedCount);
  return batchId;
}

// ----------------------------------------------------------------
// Domain table router
/**
 * Route a parsed GeoJSON feature into its configured domain overlay table and insert the corresponding row.
 *
 * Inserts a single domain-specific overlay record that references `referenceFeatureId` and `referenceDatasetId`,
 * includes the provided `h3Cell`/resolution and stores raw feature properties. The exact target table and
 * inserted columns are determined by the feature's `profile.targetTable`.
 *
 * @param feat - The parsed GeoJSON feature and its ingestion profile used to determine target table and values
 * @param referenceFeatureId - The `reference_features` row id to use as a foreign key
 * @param referenceDatasetId - The reference dataset id to use as a foreign key
 * @param h3Cell - H3 cell id at the configured resolution (empty string if unavailable)
 * @returns `true` if a domain-row insert was performed without error; `false` if the insert failed or the target table is unrecognized.
 */

async function insertDomainRow(
  feat: ParsedGeoJsonFeature,
  referenceFeatureId: string,
  referenceDatasetId: string,
  zoneId: string,
  supabase: ReturnType<typeof getSupabaseClientOrThrow>,
): Promise<boolean> {
  const profile = feat.profile;

  switch (profile.targetTable) {
    // ── zone_risk_layers ─────────────────────────────────────────
    case 'zone_risk_layers': {
      const { error } = await supabase.from('zone_risk_layers').insert({
        reference_feature_id: referenceFeatureId,
        reference_dataset_id: referenceDatasetId,
        zone_id: zoneId,
        risk_type: profile.primaryMetricKey ?? 'unknown',
        risk_value_numeric: feat.metricValueNumeric,
        risk_value_text: feat.metricValueText,
        units: profile.units ?? null,
        source_confidence: profile.sourceConfidence ?? 0.9,
        properties_json: feat.rawProperties as Json,
      });
      return !error;
    }

    // ── zone_transport_layers ────────────────────────────────────
    case 'zone_transport_layers': {
      const { error } = await supabase.from('zone_transport_layers').insert({
        reference_feature_id: referenceFeatureId,
        reference_dataset_id: referenceDatasetId,
        zone_id: zoneId,
        metric_key: profile.primaryMetricKey ?? 'unknown',
        metric_value_numeric: feat.metricValueNumeric,
        metric_value_text: feat.metricValueText,
        units: profile.units ?? null,
        source_confidence: profile.sourceConfidence ?? 0.9,
        properties_json: feat.rawProperties as Json,
      });
      return !error;
    }

    // ── zone_reference_layers ────────────────────────────────────
    case 'zone_reference_layers': {
      const { error } = await supabase.from('zone_reference_layers').insert({
        reference_feature_id: referenceFeatureId,
        reference_dataset_id: referenceDatasetId,
        zone_id: zoneId,
        boundary_type: profile.primaryMetricKey ?? 'boundary',
        boundary_external_id: feat.featureExternalId,
        boundary_name: feat.featureName,
        properties_json: feat.rawProperties as Json,
      });
      return !error;
    }

    // ── zone_demand_drivers ──────────────────────────────────────
    case 'zone_demand_drivers': {
      const { error } = await supabase.from('zone_demand_drivers').insert({
        reference_feature_id: referenceFeatureId,
        reference_dataset_id: referenceDatasetId,
        zone_id: zoneId,
        driver_type: profile.primaryMetricKey ?? feat.featureSubtype ?? 'unknown',
        driver_name: feat.featureName,
        driver_weight: feat.metricValueNumeric,
        capacity_value: feat.metricValueText ? Number(feat.metricValueText) : null,
        units: profile.units ?? null,
        source_confidence: profile.sourceConfidence ?? 0.9,
        properties_json: feat.rawProperties as Json,
      });
      return !error;
    }

    // ── poi_reference ────────────────────────────────────────────
    case 'poi_reference': {
      const { error } = await supabase.from('poi_reference').insert({
        reference_feature_id: referenceFeatureId,
        reference_dataset_id: referenceDatasetId,
        zone_id: zoneId,
        poi_type: feat.featureSubtype ?? profile.primaryMetricKey ?? 'unknown',
        poi_name: feat.featureName,
        latitude: feat.centroidLat,
        longitude: feat.centroidLng,
        source_confidence: profile.sourceConfidence ?? 0.9,
        properties_json: feat.rawProperties as Json,
      });
      return !error;
    }

    // ── zone_land_use_layers ─────────────────────────────────────
    case 'zone_land_use_layers': {
      const { error } = await supabase.from('zone_land_use_layers').insert({
        reference_feature_id: referenceFeatureId,
        reference_dataset_id: referenceDatasetId,
        zone_id: zoneId,
        land_use_type: profile.primaryMetricKey ?? feat.featureSubtype ?? 'unknown',
        coverage_fraction: feat.metricValueNumeric,
        intensity_score: feat.metricValueText ? Number(feat.metricValueText) : null,
        source_confidence: profile.sourceConfidence ?? 0.9,
        properties_json: feat.rawProperties as Json,
      });
      return !error;
    }

    // ── infrastructure_reference ─────────────────────────────────
    case 'infrastructure_reference': {
      const { error } = await supabase.from('infrastructure_reference').insert({
        reference_feature_id: referenceFeatureId,
        reference_dataset_id: referenceDatasetId,
        zone_id: zoneId,
        infrastructure_type: feat.featureSubtype ?? profile.primaryMetricKey ?? 'unknown',
        infrastructure_name: feat.featureName,
        latitude: feat.centroidLat,
        longitude: feat.centroidLng,
        source_confidence: profile.sourceConfidence ?? 0.9,
        properties_json: feat.rawProperties as Json,
      });
      return !error;
    }

    default:
      return false;
  }
}
