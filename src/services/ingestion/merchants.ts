/**
 * Merchant location ingestion service (Kaggle).
 *
 * Upserts parsed MerchantRow objects into public.merchant_locations.
 * Handles both the Uber Eats and DoorDash restaurant datasets — pass the
 * appropriate `platform` value ('uber_eats' | 'doordash') per file.
 *
 * Dedup key: (platform, name, latitude, longitude) — enforced by the unique
 * index added in migration 20260329000002_kaggle_datasets.sql. When a row
 * conflicts, ignoreDuplicates:true causes it to be skipped silently.
 *
 * H3 zone_id is computed at ingest time from lat/lng so downstream
 * zone-scoring queries can group by zone_id without a second pass.
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
import type { MerchantRow } from './merchantParser';

export type { ImportBatchInput };

/**
 * Ingest a parsed restaurant Kaggle CSV into public.merchant_locations.
 *
 * @param platform  'uber_eats' for the Uber Eats dataset, 'doordash' for DoorDash.
 * @returns The created import_batch_id.
 */
export async function ingestMerchants(
  batch: ImportBatchInput,
  rows: MerchantRow[],
  platform: 'uber_eats' | 'doordash',
): Promise<string> {
  const importBatchId = await createImportBatch(batch, platform, 'kaggle_csv', rows.length);
  let parsedCount = 0;

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i]!;
    const rawPayload = row as unknown as Record<string, unknown>;
    const rowHash = simpleHash(JSON.stringify(rawPayload));

    // Raw record for traceability (note: merchant ingestion has no trip_id FK)
    const { error: rawError } = await supabase
      .from('raw_import_records')
      .insert({
        import_batch_id: importBatchId,
        source_row_index: i,
        source_record_type: 'merchant_row',
        source_payload_json: rawPayload as Json,
        row_hash: rowHash,
        parse_status: 'parsed',
      });

    if (rawError) continue;

    const zoneId =
      row.latitude != null && row.longitude != null
        ? getZoneId(row.latitude, row.longitude)
        : null;

    // Upsert: conflict on (platform, name, latitude, longitude) → skip duplicate
    const { error: upsertError } = await supabase
      .from('merchant_locations')
      .upsert(
        {
          platform,
          name: row.name,
          latitude: row.latitude,
          longitude: row.longitude,
          zone_id: zoneId,
          address_line_1: row.addressLine1,
          city: row.city,
          state: row.state,
          postal_code: row.postalCode,
          rating: row.rating,
          price_level: row.priceLevel,
          delivery_fee: row.deliveryFee,
          estimated_delivery_time_minutes: row.estimatedDeliveryTimeMinutes,
          cuisine_type: row.cuisineType,
          source_type: 'kaggle_csv',
          import_batch_id: importBatchId,
        },
        { onConflict: 'platform,name,latitude,longitude', ignoreDuplicates: true },
      );

    if (!upsertError) parsedCount++;
  }

  await finaliseImportBatch(importBatchId, rows.length, parsedCount);
  return importBatchId;
}
