/**
 * NWS ingestion service — writes parsed NWS data to Supabase.
 *
 * Observations  → reference_features + external_conditions (one row per condition type)
 * Alerts        → reference_features + external_condition_alerts
 *
 * Each call creates one reference_ingest_batches row for traceability.
 * reference_features rows capture the raw geometry and properties; the
 * domain overlay rows carry FK references back to them.
 *
 * H3 resolution 9 is used for point geometries (≈ 0.73 km cells).
 */

import { getSupabaseClientOrThrow } from '@/services/supabase/utils';
import { getZoneId } from '@/utils/h3';
import type { Json } from '@/types/supabase.generated';
import {
  ensureReferenceDataset,
  createReferenceIngestBatch,
  finaliseReferenceIngestBatch,
  type ReferenceDatasetParams,
} from './referenceRegistry';
import type { NwsObservationRow, NwsAlertRow } from './nwsParser';

// Default dataset descriptors (callers can override by passing params).

const DEFAULT_OBSERVATIONS_DATASET: ReferenceDatasetParams = {
  slug: 'nws_observations',
  sourceType: 'nws',
  layerCategory: 'external_conditions',
  datasetName: 'NWS Station Observations',
  sourceUrl: 'https://api.weather.gov/observations',
  sourceAgency: 'National Weather Service (NOAA)',
  description: 'Hourly surface observations from NWS ASOS/AWOS stations',
  refreshCadence: 'daily',
};

const DEFAULT_ALERTS_DATASET: ReferenceDatasetParams = {
  slug: 'nws_alerts',
  sourceType: 'nws',
  layerCategory: 'external_alerts',
  datasetName: 'NWS Active Alerts',
  sourceUrl: 'https://api.weather.gov/alerts/active',
  sourceAgency: 'National Weather Service (NOAA)',
  description: 'Active NWS weather watches, warnings, and advisories',
  refreshCadence: 'on_demand',
};

const H3_RESOLUTION = 9;

// ----------------------------------------------------------------
// ingestNwsObservations
// ----------------------------------------------------------------

/**
 * Ingest parsed NWS observation rows into Supabase.
 *
 * For each observation:
 *   1. Upsert a reference_features row (geometry + raw properties).
 *   2. Insert one external_conditions row per condition type (EAV).
 *
 * @returns The reference_ingest_batch_id created for this run.
 */
export async function ingestNwsObservations(
  rows: NwsObservationRow[],
  datasetParams?: Partial<ReferenceDatasetParams>,
): Promise<string> {
  const supabase = getSupabaseClientOrThrow('[nwsIngestion] Supabase client is not configured');
  const params = { ...DEFAULT_OBSERVATIONS_DATASET, ...datasetParams };
  const referenceDatasetId = await ensureReferenceDataset(params);
  const batchId = await createReferenceIngestBatch({
    referenceDatasetId,
    sourceRecordCount: rows.length,
  });

  let parsedCount = 0;

  for (const row of rows) {
    // 1. Insert reference_feature (geometry + raw props)
    const { data: feature, error: featureError } = await supabase
      .from('reference_features')
      .insert({
        reference_dataset_id: referenceDatasetId,
        reference_ingest_batch_id: batchId,
        feature_external_id: row.featureId,
        feature_name: row.stationName,
        feature_subtype: row.stationId,
        geometry_type: 'point',
        centroid_lat: row.centroidLat,
        centroid_lng: row.centroidLng,
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
        effective_start_ts: row.observedTs,
        raw_properties_json: row.rawProperties as Json,
      })
      .select('reference_feature_id')
      .single();

    if (featureError || !feature) continue;

    // H3 cell at res 9 for condition rows
    const h3Cell =
      row.centroidLat != null && row.centroidLng != null
        ? getZoneId(row.centroidLat, row.centroidLng, H3_RESOLUTION)
        : null;

    if (!h3Cell) continue;

    if (!row.observedTs) continue;

    // 2. Insert aggregated external_conditions row for the station snapshot
    const conditionMap = new Map(row.conditions.map((cond) => [cond.conditionType, cond]));
    const getNumeric = (key: string): number | null =>
      conditionMap.get(key)?.conditionValueNumeric ?? null;
    const getText = (key: string): string | null =>
      conditionMap.get(key)?.conditionValueText ?? null;

    const { error: conditionError } = await supabase.from('external_conditions').insert({
      recorded_at: row.observedTs,
      latitude: row.centroidLat,
      longitude: row.centroidLng,
      zone_id: h3Cell,
      weather_condition: getText('weather_description'),
      temperature_f: getNumeric('temperature_f'),
      humidity_pct: getNumeric('humidity_pct'),
      wind_speed_mph: getNumeric('wind_speed_mph'),
      visibility_miles: getNumeric('visibility_miles'),
      source_type: 'nws',
    });

    if (!conditionError) parsedCount++;
  }

  await finaliseReferenceIngestBatch(batchId, rows.length, parsedCount);
  return batchId;
}

// ----------------------------------------------------------------
// ingestNwsAlerts
// ----------------------------------------------------------------

/**
 * Ingest parsed NWS alert rows into Supabase.
 *
 * For each alert:
 *   1. Insert a reference_features row (geometry + raw properties).
 *   2. Insert one external_condition_alerts row.
 *
 * @returns The reference_ingest_batch_id created for this run.
 */
export async function ingestNwsAlerts(
  rows: NwsAlertRow[],
  datasetParams?: Partial<ReferenceDatasetParams>,
): Promise<string> {
  const supabase = getSupabaseClientOrThrow('[nwsIngestion] Supabase client is not configured');
  const params = { ...DEFAULT_ALERTS_DATASET, ...datasetParams };
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
        reference_dataset_id: referenceDatasetId,
        reference_ingest_batch_id: batchId,
        feature_external_id: row.featureId,
        feature_name: row.eventType,
        geometry_type: 'point',
        centroid_lat: row.centroidLat,
        centroid_lng: row.centroidLng,
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
        effective_start_ts: row.onsetTs,
        effective_end_ts: row.expiresTs,
        raw_properties_json: row.rawProperties as Json,
      })
      .select('reference_feature_id')
      .single();

    if (featureError || !feature) continue;

    // H3 cell at res 9
    const h3Cell =
      row.centroidLat != null && row.centroidLng != null
        ? getZoneId(row.centroidLat, row.centroidLng, H3_RESOLUTION)
        : null;

    if (!h3Cell) continue;

    // 2. Insert external_condition_alert row
    const { error: alertError } = await supabase.from('external_condition_alerts').insert({
      reference_feature_id: feature.reference_feature_id,
      reference_dataset_id: referenceDatasetId,
      alert_external_id: row.alertExternalId,
      event_type: row.eventType,
      severity: row.severity,
      certainty: row.certainty,
      urgency: row.urgency,
      h3_resolution: H3_RESOLUTION,
      h3_cell: h3Cell,
      onset_ts: row.onsetTs,
      expires_ts: row.expiresTs,
      headline: row.headline,
      description: row.description,
      properties_json: row.rawProperties as Json,
    });

    if (!alertError) parsedCount++;
  }

  await finaliseReferenceIngestBatch(batchId, rows.length, parsedCount);
  return batchId;
}
