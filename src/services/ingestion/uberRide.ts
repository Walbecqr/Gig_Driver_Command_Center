/**
 * Uber Ride Analytics Dataset ingestion service (Kaggle).
 *
 * Maps parsed UberRideRow objects into:
 *   import_batches → raw_import_records → trips + trip_financials + trip_metrics
 *
 * platform            = 'uber_driver'
 * service_type        = 'rideshare'
 * fin_source_type     = 'derived'
 * completion_confidence = 0.75
 *
 * Raises a reconciliation_issue (suspected_duplicate) when a row references
 * a platform_trip_id already present in the database for this user.
 */

import { supabaseClient as supabase } from '@/services/supabase/client';
import type { Json } from '@/types/supabase.generated';
import {
  type ImportBatchInput,
  createImportBatch,
  finaliseImportBatch,
  simpleHash,
} from './ingestionUtils';
import type { UberRideRow } from './uberRideParser';

export type { ImportBatchInput };

/**
 * Ingest a parsed Uber Ride Analytics Kaggle CSV into Supabase.
 * @returns The created import_batch_id.
 */
export async function ingestUberRides(
  batch: ImportBatchInput,
  rows: UberRideRow[],
): Promise<string> {
  const importBatchId = await createImportBatch(batch, 'uber_driver', 'kaggle_csv', rows.length);
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
        source_record_type: 'uber_ride_row',
        source_payload_json: rawPayload as Json,
        row_hash: rowHash,
        parse_status: 'parsed',
      })
      .select('raw_record_id')
      .single();

    if (rawError || !rawRecord) continue;

    // Flag suspected duplicates before inserting
    if (row.platformTripId) {
      const { data: existing } = await supabase
        .from('trips')
        .select('trip_id')
        .eq('user_id', batch.userId)
        .eq('platform', 'uber_driver')
        .eq('platform_trip_id', row.platformTripId)
        .maybeSingle();

      if (existing) {
        await supabase.from('reconciliation_issues').insert({
          user_id: batch.userId,
          platform_account_id: batch.platformAccountId,
          import_batch_id: importBatchId,
          trip_id: existing.trip_id,
          issue_type: 'suspected_duplicate',
          severity: 'medium',
          issue_summary: `Uber ride ${row.platformTripId} already exists from a previous import`,
          source_a: 'existing_trip',
          source_b: `kaggle_row_${i}`,
        });
        continue;
      }
    }

    const { data: trip, error: tripError } = await supabase
      .from('trips')
      .insert({
        user_id: batch.userId,
        platform_account_id: batch.platformAccountId,
        trip_date_local: row.dateLocal,
        platform: 'uber_driver',
        service_type: 'rideshare',
        platform_trip_id: row.platformTripId ?? undefined,
        trip_status: row.tripStatus,
        completion_confidence: 0.75,
        raw_trip_ref: rawRecord.raw_record_id,
      })
      .select('trip_id')
      .single();

    if (tripError || !trip) continue;

    // Derive surge_amount from gross × (surge - 1) when multiplier is available
    const surgeAmount =
      row.surgeMultiplier != null && row.surgeMultiplier > 1
        ? parseFloat((row.grossAmount * (row.surgeMultiplier - 1)).toFixed(2))
        : null;

    await supabase.from('trip_financials').insert({
      trip_id: trip.trip_id,
      gross_amount: row.grossAmount,
      surge_amount: surgeAmount ?? undefined,
      cancellation_pay: row.cancellationPay ?? undefined,
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

  await finaliseImportBatch(importBatchId, rows.length, parsedCount);
  return importBatchId;
}
