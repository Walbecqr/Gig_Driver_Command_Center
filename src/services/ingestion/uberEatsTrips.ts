/**
 * Uber Eats Driver Dataset ingestion service (Kaggle).
 *
 * Maps parsed UberEatsTripRow objects into the canonical pipeline:
 *   import_batches → raw_import_records → trips + trip_financials + trip_metrics
 *
 * platform            = 'uber_eats'
 * service_type        = 'delivery'
 * fin_source_type     = 'derived'   (Kaggle data, not an official statement)
 * completion_confidence = 0.75      (third-party source)
 */

import { supabaseClient as supabase } from '@/services/supabase/client';
import type { Json } from '@/types/supabase.generated';
import {
  type ImportBatchInput,
  createImportBatch,
  linkTripToImportBatch,
  simpleHash,
  submitImportBatchForReview,
} from './ingestionUtils';
import type { UberEatsTripRow } from './uberEatsTripsParser';

export type { ImportBatchInput };

/**
 * Ingest a parsed Uber Eats Kaggle trip CSV into Supabase.
 * @returns The created import_batch_id.
 */
export async function ingestUberEatsTrips(
  batch: ImportBatchInput,
  rows: UberEatsTripRow[],
): Promise<string> {
  const importBatchId = await createImportBatch(batch, 'uber_eats', 'kaggle_csv', rows.length);
  let parsedCount = 0;

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i]!;
    const rawPayload = row as unknown as Record<string, unknown>;
    const rowHash = simpleHash(JSON.stringify(rawPayload));

    const { data: rawRecord, error: rawError } = await supabase
      .from('raw_import_records')
      .insert({
        import_batch_id: importBatchId,
        source_row_index: i,
        source_record_type: 'uber_eats_trip_row',
        source_payload_json: rawPayload as Json,
        row_hash: rowHash,
        parse_status: 'parsed',
      })
      .select('raw_record_id')
      .single();

    if (rawError || !rawRecord) continue;

    const { data: trip, error: tripError } = await supabase
      .from('trips')
      .insert({
        user_id: batch.userId,
        platform_account_id: batch.platformAccountId,
        trip_date_local: row.dateLocal,
        trip_start_ts_local: row.startTs ?? undefined,
        trip_end_ts_local: row.endTs ?? undefined,
        platform: 'uber_eats',
        service_type: 'delivery',
        platform_trip_id: row.platformTripId ?? undefined,
        trip_status: 'completed',
        completion_confidence: 0.75,
        raw_trip_ref: rawRecord.raw_record_id,
      })
      .select('trip_id')
      .single();

    if (tripError || !trip) continue;
    await linkTripToImportBatch({
      tripId: trip.trip_id,
      importBatchId,
      sourceType: 'kaggle_csv',
      rawRecordId: rawRecord.raw_record_id,
    });

    await supabase.from('trip_financials').insert({
      trip_id: trip.trip_id,
      gross_amount: row.grossAmount,
      tip_amount: row.tipAmount,
      fin_source_type: 'derived',
    });

    await supabase.from('trip_metrics').insert({
      trip_id: trip.trip_id,
      distance_miles: row.distanceMiles,
      duration_minutes: row.durationMinutes ?? undefined,
      distance_source: 'derived',
      duration_source: 'derived',
      metric_confidence: 0.75,
    });

    parsedCount++;
  }

  await submitImportBatchForReview(importBatchId, rows.length, parsedCount);
  return importBatchId;
}
