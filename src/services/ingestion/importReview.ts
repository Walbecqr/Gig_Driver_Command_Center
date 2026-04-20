import { getSupabaseClientOrThrow } from '@/services/supabase/utils';
import type { Database } from '@/types/supabase.generated';

export interface ImportBatchReviewSummary {
  importBatchId: string;
  importStatus: Database['public']['Enums']['import_status_enum'];
  rowCountRaw: number;
  rowCountParsed: number;
  parseStatusCounts: Partial<Record<Database['public']['Enums']['parse_status_enum'], number>>;
  reconciliationIssueCount: number;
  tripCount: number;
}

export interface ImportBatchReviewTrip {
  tripId: string;
  platform: Database['public']['Enums']['platform_enum'] | null;
  tripDateLocal: string | null;
  platformTripId: string | null;
  platformOrderId: string | null;
  grossAmount: number | null;
  tipAmount: number | null;
  distanceMiles: number | null;
  durationMinutes: number | null;
}

export interface ImportBatchReviewResult {
  summary: ImportBatchReviewSummary;
  trips: ImportBatchReviewTrip[];
}

/**
 * Build a review payload for a staged import batch.
 *
 * Reuses canonical write tables plus v_trip_import_review for display-ready data.
 */
export async function getImportBatchReview(importBatchId: string): Promise<ImportBatchReviewResult> {
  const supabase = getSupabaseClientOrThrow('[importReview] Supabase client is not configured');

  const { data: batch, error: batchError } = await supabase
    .from('import_batches')
    .select('import_batch_id, import_status, row_count_raw, row_count_parsed')
    .eq('import_batch_id', importBatchId)
    .single();

  if (batchError || !batch) {
    throw new Error(`Failed to load import batch review summary: ${batchError?.message}`);
  }

  const parseStatuses = ['parsed', 'warning', 'failed', 'skipped'] as const satisfies readonly Database['public']['Enums']['parse_status_enum'][];

  const parseStatusCountResults = await Promise.all(
    parseStatuses.map((status) =>
      supabase
        .from('raw_import_records')
        .select('*', { count: 'exact', head: true })
        .eq('import_batch_id', importBatchId)
        .eq('parse_status', status),
    ),
  );

  const parseStatusCounts: ImportBatchReviewSummary['parseStatusCounts'] = {};
  for (let i = 0; i < parseStatuses.length; i++) {
    const count = parseStatusCountResults[i].count;
    if (count !== null && count > 0) {
      parseStatusCounts[parseStatuses[i]] = count;
    }
  }

  const { count: reconciliationIssueCount } = await supabase
    .from('reconciliation_issues')
    .select('*', { count: 'exact', head: true })
    .eq('import_batch_id', importBatchId);

  const { data: links } = await supabase
    .from('trip_source_links')
    .select('trip_id')
    .eq('import_batch_id', importBatchId);

  const tripIds = Array.from(new Set((links ?? []).map((x) => x.trip_id)));

  let trips: ImportBatchReviewTrip[] = [];
  if (tripIds.length > 0) {
    const { data: reviewRows } = await supabase
      .from('v_trip_import_review')
      .select(
        'trip_id, platform, trip_date_local, platform_trip_id, platform_order_id, gross_amount, tip_amount, distance_miles, duration_minutes',
      )
      .in('trip_id', tripIds)
      .order('trip_date_local', { ascending: true });

    trips = (reviewRows ?? []).map((row) => ({
      tripId: row.trip_id ?? '',
      platform: row.platform,
      tripDateLocal: row.trip_date_local,
      platformTripId: row.platform_trip_id,
      platformOrderId: row.platform_order_id,
      grossAmount: row.gross_amount,
      tipAmount: row.tip_amount,
      distanceMiles: row.distance_miles,
      durationMinutes: row.duration_minutes,
    }));
  }

  return {
    summary: {
      importBatchId: batch.import_batch_id,
      importStatus: batch.import_status,
      rowCountRaw: batch.row_count_raw,
      rowCountParsed: batch.row_count_parsed,
      parseStatusCounts,
      reconciliationIssueCount: reconciliationIssueCount ?? 0,
      tripCount: tripIds.length,
    },
    trips,
  };
}
