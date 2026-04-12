/**
 * Weather + surge context ingestion service (Kaggle).
 *
 * Inserts parsed WeatherConditionRow objects into public.external_conditions.
 * H3 zone_id is computed at ingest time from lat/lng.
 *
 * external_conditions is shared reference data (not per-user), so a single
 * import_batch is created per file for traceability; the platform is set to
 * 'unknown' since the dataset spans both Uber and Lyft.
 */

import { supabaseClient as supabase } from '@/services/supabase/client';
import { getZoneId } from '@/utils/h3';
import type { Json } from '@/types/supabase.generated';
import {
  type ImportBatchInput,
  createImportBatch,
  finaliseImportBatch,
  simpleHash,
} from './ingestionUtils';
import type { WeatherConditionRow } from './weatherConditionsParser';

export type { ImportBatchInput };

/**
 * Ingest a parsed Uber/Lyft + Weather Kaggle CSV into public.external_conditions.
 * @returns The created import_batch_id.
 */
export async function ingestWeatherConditions(
  batch: ImportBatchInput,
  rows: WeatherConditionRow[],
): Promise<string> {
  // platform = 'unknown' — dataset spans multiple platforms
  const importBatchId = await createImportBatch(batch, 'unknown', 'kaggle_csv', rows.length);
  let parsedCount = 0;

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i]!;
    const rawPayload = row as unknown as Record<string, unknown>;
    const rowHash = simpleHash(JSON.stringify(rawPayload));

    // Raw record for traceability
    const { error: rawError } = await supabase
      .from('raw_import_records')
      .insert({
        import_batch_id: importBatchId,
        source_row_index: i,
        source_record_type: 'weather_condition_row',
        source_payload_json: rawPayload as Json,
        row_hash: rowHash,
        parse_status: 'parsed',
      });

    if (rawError) continue;

    const zoneId =
      row.latitude != null && row.longitude != null
        ? getZoneId(row.latitude, row.longitude)
        : null;

    const { error: insertError } = await supabase
      .from('external_conditions')
      .insert({
        recorded_at: row.recordedAt,
        latitude: row.latitude,
        longitude: row.longitude,
        zone_id: zoneId,
        weather_condition: row.weatherCondition,
        temperature_f: row.temperatureF,
        humidity_pct: row.humidityPct,
        wind_speed_mph: row.windSpeedMph,
        visibility_miles: row.visibilityMiles,
        surge_multiplier: row.surgeMultiplier,
        source_type: 'kaggle_csv',
        import_batch_id: importBatchId,
      });

    if (!insertError) parsedCount++;
  }

  await finaliseImportBatch(importBatchId, rows.length, parsedCount);
  return importBatchId;
}
