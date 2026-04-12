/**
 * Delivery Orders simulation dataset ingestion service (Kaggle).
 *
 * Maps parsed DeliveryOrderRow objects into:
 *   import_batches → raw_import_records
 *     → trips + trip_financials + trip_metrics + stops (when lat/lng present)
 *
 * platform              = 'synthetic'   (enum value added in migration 002)
 * source_type           = 'simulation'  (enum value added in migration 002)
 * completion_confidence = 0.5           (simulation data, lower fidelity)
 *
 * H3 zone_ids computed at ingest time and backfilled onto the trip row for
 * fast zone-grouping queries without a JOIN.
 *
 * Note: 'synthetic' is not yet in the auto-generated Supabase types. The cast
 * on `trips.platform` below can be removed after regenerating types.
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
import type { DeliveryOrderRow } from './deliveryOrdersParser';

export type { ImportBatchInput };

/**
 * Ingest a parsed Delivery Orders simulation CSV into Supabase.
 * @returns The created import_batch_id.
 */
export async function ingestDeliveryOrders(
  batch: ImportBatchInput,
  rows: DeliveryOrderRow[],
): Promise<string> {
  const importBatchId = await createImportBatch(batch, 'synthetic', 'simulation', rows.length);
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
        source_record_type: 'delivery_order_row',
        source_payload_json: rawPayload as Json,
        row_hash: rowHash,
        parse_status: 'parsed',
      })
      .select('raw_record_id')
      .single();

    if (rawError || !rawRecord) continue;

    const pickupZoneId =
      row.pickupLat != null && row.pickupLng != null
        ? getZoneId(row.pickupLat, row.pickupLng)
        : null;
    const dropoffZoneId =
      row.dropoffLat != null && row.dropoffLng != null
        ? getZoneId(row.dropoffLat, row.dropoffLng)
        : null;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: trip, error: tripError } = await (supabase as any)
      .from('trips')
      .insert({
        user_id: batch.userId,
        platform_account_id: batch.platformAccountId,
        trip_date_local: row.dateLocal,
        platform: 'synthetic',
        service_type: 'delivery',
        platform_order_id: row.orderId ?? undefined,
        trip_status: 'completed',
        completion_confidence: 0.5,
        raw_trip_ref: rawRecord.raw_record_id,
        pickup_zone_id: pickupZoneId,
        dropoff_zone_id: dropoffZoneId,
      })
      .select('trip_id')
      .single();

    if (tripError || !trip) continue;

    await supabase.from('trip_financials').insert({
      trip_id: (trip as { trip_id: string }).trip_id,
      gross_amount: row.grossAmount,
      fin_source_type: 'derived',
    });

    await supabase.from('trip_metrics').insert({
      trip_id: (trip as { trip_id: string }).trip_id,
      distance_miles: row.distanceMiles,
      duration_minutes: row.durationMinutes ?? undefined,
      distance_source: 'derived',
      duration_source: 'derived',
      metric_confidence: 0.5,
    });

    const tripId = (trip as { trip_id: string }).trip_id;

    if (row.pickupLat != null && row.pickupLng != null) {
      await supabase.from('stops').insert({
        trip_id: tripId,
        stop_sequence: 1,
        stop_type: 'pickup',
        stop_status: 'completed',
        latitude: row.pickupLat,
        longitude: row.pickupLng,
        zone_id: pickupZoneId,
      });
    }

    if (row.dropoffLat != null && row.dropoffLng != null) {
      await supabase.from('stops').insert({
        trip_id: tripId,
        stop_sequence: 2,
        stop_type: 'dropoff',
        stop_status: 'completed',
        latitude: row.dropoffLat,
        longitude: row.dropoffLng,
        zone_id: dropoffZoneId,
      });
    }

    parsedCount++;
  }

  await finaliseImportBatch(importBatchId, rows.length, parsedCount);
  return importBatchId;
}
