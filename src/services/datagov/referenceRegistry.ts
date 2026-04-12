/**
 * Reference dataset registry helpers (data.gov / public reference layer).
 *
 * Provides three lifecycle helpers for the reference backbone:
 *   ensureReferenceDataset  — idempotent upsert to reference_datasets (by slug)
 *   createReferenceIngestBatch — insert a reference_ingest_batches row
 *   finaliseReferenceIngestBatch — mark the batch completed / partial / failed
 *
 * All three are thin wrappers around Supabase table operations. Callers supply
 * strongly-typed params; the functions return the generated UUIDs that
 * downstream ingestion services need for FK columns.
 */

import { supabaseClient as supabase } from '@/services/supabase/client';
import type { Database } from '@/types/supabase.generated';

type ReferenceSourceTypeEnum  = Database['public']['Enums']['reference_source_type_enum'];
type ReferenceLayerCategoryEnum = Database['public']['Enums']['reference_layer_category_enum'];
type RefreshCadenceEnum       = Database['public']['Enums']['refresh_cadence_enum'];

// ----------------------------------------------------------------
// Public types
// ----------------------------------------------------------------

export interface ReferenceDatasetParams {
  /** Short unique identifier used for conflict-free upserts, e.g. 'nws_observations'. */
  slug: string;
  sourceType: ReferenceSourceTypeEnum;
  layerCategory: ReferenceLayerCategoryEnum;
  datasetName: string;
  sourceUrl?: string;
  sourceAgency?: string;
  description?: string;
  refreshCadence?: RefreshCadenceEnum;
  sourceVintage?: string;
  parserVersion?: string;
  notes?: string;
}

export interface ReferenceIngestBatchParams {
  referenceDatasetId: string;
  /** Link to an import_batches row when the source is a CSV file. */
  importBatchId?: string;
  sourceFileName?: string;
  sourceFileHash?: string;
  sourceRecordCount?: number;
  ingestNotes?: string;
}

// ----------------------------------------------------------------
// ensureReferenceDataset
// ----------------------------------------------------------------

/**
 * Ensure a reference dataset row exists or is updated and return its UUID.
 *
 * Performs an idempotent upsert into the `reference_datasets` table using the
 * dataset slug as the conflict target; absent optional fields are written as
 * `null`.
 *
 * @returns The UUID of the upserted reference dataset.
 * @throws If the database upsert fails or no row is returned.
 */
export async function ensureReferenceDataset(
  params: ReferenceDatasetParams,
): Promise<string> {
  const { data, error } = await supabase
    .from('reference_datasets')
    .upsert(
      {
        dataset_slug:     params.slug,
        source_type:      params.sourceType,
        layer_category:   params.layerCategory,
        dataset_name:     params.datasetName,
        source_url:       params.sourceUrl ?? null,
        source_agency:    params.sourceAgency ?? null,
        description:      params.description ?? null,
        refresh_cadence:  params.refreshCadence ?? 'monthly',
        source_vintage:   params.sourceVintage ?? null,
        parser_version:   params.parserVersion ?? null,
        notes:            params.notes ?? null,
        is_active:        true,
      },
      { onConflict: 'dataset_slug' },
    )
    .select('reference_dataset_id')
    .single();

  if (error || !data) {
    throw new Error(`ensureReferenceDataset failed: ${error?.message}`);
  }
  return data.reference_dataset_id;
}

// ----------------------------------------------------------------
// createReferenceIngestBatch
// ----------------------------------------------------------------

/**
 * Insert a row into `reference_ingest_batches` and return its UUID.
 *
 * The batch is created with `ingest_status` set to `'processing'`.
 *
 * @returns The UUID of the newly created reference ingest batch.
 * @throws If the insert fails.
 */
export async function createReferenceIngestBatch(
  params: ReferenceIngestBatchParams,
): Promise<string> {
  const { data, error } = await supabase
    .from('reference_ingest_batches')
    .insert({
      reference_dataset_id: params.referenceDatasetId,
      import_batch_id:      params.importBatchId ?? null,
      source_file_name:     params.sourceFileName ?? null,
      source_file_hash:     params.sourceFileHash ?? null,
      source_record_count:  params.sourceRecordCount ?? 0,
      parsed_record_count:  0,
      ingest_status:        'processing',
      ingest_notes:         params.ingestNotes ?? null,
    })
    .select('reference_ingest_batch_id')
    .single();

  if (error || !data) {
    throw new Error(`createReferenceIngestBatch failed: ${error?.message}`);
  }
  return data.reference_ingest_batch_id;
}

// ----------------------------------------------------------------
// finaliseReferenceIngestBatch
// ----------------------------------------------------------------

/**
 * Finalizes an ingest batch by updating its parsed count and overall ingest status.
 *
 * The ingest status is set based on `parsed` versus `total`: `parsed === 0` → `failed`, `parsed < total` → `partial`, otherwise `completed`.
 *
 * @param referenceIngestBatchId - UUID of the `reference_ingest_batches` row to update
 * @param total - Total number of source records expected
 * @param parsed - Number of records successfully parsed
 * @param notes - Optional notes to store on the ingest batch; when omitted no notes field is modified
 */
export async function finaliseReferenceIngestBatch(
  referenceIngestBatchId: string,
  total: number,
  parsed: number,
  notes?: string,
): Promise<void> {
  const status =
    parsed === 0 ? 'failed' : parsed < total ? 'partial' : 'completed';

  await supabase
    .from('reference_ingest_batches')
    .update({
      ingest_status:       status,
      parsed_record_count: parsed,
      ...(notes != null ? { ingest_notes: notes } : {}),
    })
    .eq('reference_ingest_batch_id', referenceIngestBatchId);
}
