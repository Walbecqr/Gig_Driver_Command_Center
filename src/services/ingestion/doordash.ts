/**
 * DoorDash CSV ingestion service.
 *
 * Mirrors the pattern established by the Uber weekly statement CSV import
 * pipeline (supabase/migrations/uber_weekly_statement_csv_import/).
 *
 * DoorDash exports two file types this service handles:
 *   1. "Earnings" CSV  — one row per completed delivery with payout breakdown
 *   2. "Orders" CSV    — one row per order with store, address, and timing data
 *
 * Both share the same import_batches / raw_import_records / trips /
 * trip_financials / trip_metrics / stops tables in Supabase.  The
 * `platform` column on those tables is set to 'doordash' — already supported
 * by the existing `platform_enum`.
 *
 * H3 zone IDs are computed at ingest time from stop lat/lng before the rows
 * are written to Supabase, so downstream aggregations can group by zone_id
 * without a second pass.
 */

import { getZoneId } from '@/utils/h3';
import { getSupabaseClientOrThrow } from '@/services/supabase/utils';
import type { Json, Database } from '@/types/supabase.generated';

type SourceTypeEnum = Database['public']['Enums']['source_type_enum'];

/**
 * Obtain the configured Supabase client for DoorDash ingestion or throw an error.
 *
 * @returns The typed Supabase client.
 * @throws If Supabase is not configured.
 */
function requireSupabase() {
  return getSupabaseClientOrThrow(
    '[doordash] Supabase is not configured. Cannot perform ingestion.',
  );
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** One parsed row from a DoorDash Earnings CSV export. */
export interface DoorDashEarningsRow {
  /** e.g. "2024-11-05" */
  date: string;
  /** DoorDash internal delivery ID */
  deliveryId: string;
  /** Display name of the store */
  storeName: string;
  totalPay: number;
  basePay: number;
  tip: number;
  peakPay: number;
  /** Distance in miles reported by DoorDash */
  distanceMiles: number;
}

/** One parsed row from a DoorDash Orders CSV export. */
export interface DoorDashOrderRow {
  orderId: string;
  date: string;
  /** Store / pickup address */
  pickupAddress: string;
  pickupLat: number | null;
  pickupLng: number | null;
  /** Customer / dropoff address */
  dropoffAddress: string;
  dropoffLat: number | null;
  dropoffLng: number | null;
  /** Total active time in minutes */
  durationMinutes: number | null;
}

export interface ImportBatchInput {
  userId: string;
  platformAccountId: string;
  sourceFileName: string;
  sourceFileHash: string;
  /** ISO date string of the earliest record in the file */
  statementStartDate: string;
  /** ISO date string of the latest record in the file */
  statementEndDate: string;
  parserVersion: string;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Ingests DoorDash earnings rows into the system by recording raw rows and creating corresponding trips with their financials and metrics.
 *
 * @returns The created import_batch_id.
 */
export async function ingestDoorDashEarnings(
  batch: ImportBatchInput,
  rows: DoorDashEarningsRow[],
): Promise<string> {
  const supabase = requireSupabase();
  const importBatchId = await createImportBatch(batch, 'weekly_statement_csv', rows.length);

  let parsedCount = 0;

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];

    const rawPayload = row as unknown as Record<string, unknown>;
    const rowHash = simpleHash(JSON.stringify(rawPayload));

    // Write raw record for traceability
    const { data: rawRecord, error: rawError } = await supabase
      .from('raw_import_records')
      .insert({
        import_batch_id: importBatchId,
        source_row_index: i,
        source_record_type: 'doordash_earnings_row',
        source_payload_json: rawPayload as Json,
        row_hash: rowHash,
        parse_status: 'parsed',
      })
      .select('raw_record_id')
      .single();

    if (rawError || !rawRecord) continue;

    // Map to canonical trip
    const { data: trip, error: tripError } = await supabase
      .from('trips')
      .insert({
        user_id: batch.userId,
        platform_account_id: batch.platformAccountId,
        trip_date_local: row.date,
        platform: 'doordash',
        service_type: 'delivery',
        platform_order_id: row.deliveryId,
        trip_status: 'completed',
        raw_trip_ref: rawRecord.raw_record_id,
      })
      .select('trip_id')
      .single();

    if (tripError || !trip) continue;

    // Financial record
    const { error: finError } = await supabase.from('trip_financials').insert({
      trip_id: trip.trip_id,
      gross_amount: row.totalPay,
      base_fare: row.basePay,
      tip_amount: row.tip,
      bonus_amount: row.peakPay,
      fin_source_type: 'statement_csv',
    });

    if (finError) {
      console.warn('[doordash] trip_financials insert failed:', finError.message, {
        tripId: trip.trip_id,
      });
      continue;
    }

    // Metrics record
    const { error: metricsError } = await supabase.from('trip_metrics').insert({
      trip_id: trip.trip_id,
      distance_miles: row.distanceMiles,
      distance_source: 'statement',
      duration_source: 'statement',
    });

    if (metricsError) {
      console.warn('[doordash] trip_metrics insert failed:', metricsError.message, {
        tripId: trip.trip_id,
      });
      continue;
    }

    parsedCount++;
  }

  await finaliseImportBatch(importBatchId, rows.length, parsedCount);
  return importBatchId;
}

/**
 * Ingest parsed DoorDash Orders CSV rows into Supabase, creating an import batch and creating or enriching trips with stops, optional duration metrics, and zone backfills.
 *
 * @returns The `import_batch_id` of the created import batch.
 */
export async function ingestDoorDashOrders(
  batch: ImportBatchInput,
  rows: DoorDashOrderRow[],
): Promise<string> {
  const supabase = requireSupabase();
  const importBatchId = await createImportBatch(batch, 'manual_csv', rows.length);

  let parsedCount = 0;

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];

    const rawPayload = row as unknown as Record<string, unknown>;
    const rowHash = simpleHash(JSON.stringify(rawPayload));

    const { data: rawRecord, error: rawError } = await supabase
      .from('raw_import_records')
      .insert({
        import_batch_id: importBatchId,
        source_row_index: i,
        source_record_type: 'doordash_order_row',
        source_payload_json: rawPayload as Json,
        row_hash: rowHash,
        parse_status: 'parsed',
      })
      .select('raw_record_id')
      .single();

    if (rawError || !rawRecord) continue;

    // Look up existing trip by platform_order_id to attach stops to it,
    // otherwise create a minimal trip shell.
    let tripId: string;

    const { data: existingTrip } = await supabase
      .from('trips')
      .select('trip_id')
      .eq('user_id', batch.userId)
      .eq('platform_order_id', row.orderId)
      .eq('platform', 'doordash')
      .maybeSingle();

    if (existingTrip) {
      tripId = existingTrip.trip_id;
    } else {
      const { data: newTrip, error: tripError } = await supabase
        .from('trips')
        .insert({
          user_id: batch.userId,
          platform_account_id: batch.platformAccountId,
          trip_date_local: row.date,
          platform: 'doordash',
          service_type: 'delivery',
          platform_order_id: row.orderId,
          trip_status: 'completed',
          raw_trip_ref: rawRecord.raw_record_id,
        })
        .select('trip_id')
        .single();

      if (tripError || !newTrip) continue;
      tripId = newTrip.trip_id;
    }

    // Update metrics with duration if available
    if (row.durationMinutes != null) {
      const { error: metricsError } = await supabase
        .from('trip_metrics')
        .upsert(
          {
            trip_id: tripId,
            duration_minutes: row.durationMinutes,
            distance_source: 'derived',
            duration_source: 'statement',
          },
          { onConflict: 'trip_id' },
        );

      if (metricsError) {
        console.warn('[doordash] trip_metrics upsert failed:', metricsError.message, { tripId });
      }
    }

    // --- Pickup stop ---
    const pickupZoneId =
      row.pickupLat != null && row.pickupLng != null
        ? getZoneId(row.pickupLat, row.pickupLng)
        : null;

    const { error: pickupError } = await supabase.from('stops').insert({
      trip_id: tripId,
      stop_sequence: 1,
      stop_type: 'pickup',
      stop_status: 'unknown',
      address_line_1: row.pickupAddress,
      latitude: row.pickupLat,
      longitude: row.pickupLng,
      zone_id: pickupZoneId,
    });

    if (pickupError) {
      console.warn('[doordash] pickup stop insert failed:', pickupError.message, { tripId });
      continue;
    }

    // --- Dropoff stop ---
    const dropoffZoneId =
      row.dropoffLat != null && row.dropoffLng != null
        ? getZoneId(row.dropoffLat, row.dropoffLng)
        : null;

    const { error: dropoffError } = await supabase.from('stops').insert({
      trip_id: tripId,
      stop_sequence: 2,
      stop_type: 'dropoff',
      stop_status: 'unknown',
      address_line_1: row.dropoffAddress,
      latitude: row.dropoffLat,
      longitude: row.dropoffLng,
      zone_id: dropoffZoneId,
    });

    if (dropoffError) {
      console.warn('[doordash] dropoff stop insert failed:', dropoffError.message, { tripId });
      continue;
    }

    // Backfill zone_ids onto the trip row itself for fast query without JOIN
    if (pickupZoneId || dropoffZoneId) {
      const { error: zoneBackfillError } = await supabase
        .from('trips')
        .update({
          pickup_zone_id: pickupZoneId ?? undefined,
          dropoff_zone_id: dropoffZoneId ?? undefined,
        })
        .eq('trip_id', tripId);

      if (zoneBackfillError) {
        console.warn('[doordash] zone backfill failed:', zoneBackfillError.message, { tripId });
      }
    }

    parsedCount++;
  }

  await finaliseImportBatch(importBatchId, rows.length, parsedCount);
  return importBatchId;
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

async function createImportBatch(
  batch: ImportBatchInput,
  sourceType: SourceTypeEnum,
  rowCountRaw: number,
): Promise<string> {
  const supabase = requireSupabase();
  const { data, error } = await supabase
    .from('import_batches')
    .insert({
      user_id: batch.userId,
      platform_account_id: batch.platformAccountId,
      source_platform: 'doordash',
      source_type: sourceType,
      source_file_name: batch.sourceFileName,
      source_file_hash: batch.sourceFileHash,
      source_statement_start_date: batch.statementStartDate,
      source_statement_end_date: batch.statementEndDate,
      parser_version: batch.parserVersion,
      row_count_raw: rowCountRaw,
      import_status: 'processing',
    })
    .select('import_batch_id')
    .single();

  if (error || !data) throw new Error(`Failed to create import_batch: ${error?.message}`);
  return data.import_batch_id;
}

async function finaliseImportBatch(
  importBatchId: string,
  total: number,
  parsed: number,
): Promise<void> {
  const supabase = requireSupabase();
  const status = parsed === 0 ? 'failed' : parsed < total ? 'partial' : 'completed';
  await supabase
    .from('import_batches')
    .update({ import_status: status, row_count_parsed: parsed })
    .eq('import_batch_id', importBatchId);
}

/** Cheap non-cryptographic hash for dedup row_hash column. */
function simpleHash(str: string): string {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = (Math.imul(31, h) + str.charCodeAt(i)) | 0;
  }
  return (h >>> 0).toString(16).padStart(8, '0');
}
