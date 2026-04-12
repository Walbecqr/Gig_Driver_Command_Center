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
 * Upsert a reference_datasets row by slug and return its UUID.
 *
 * If a row with the same slug already exists, its metadata is updated
 * and the existing UUID is returned.  If slug is absent the row is
 * inserted fresh (no conflict resolution — callers should always pass a slug).
 *
 * @throws if the upsert fails.
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
 * Insert a reference_ingest_batches row and return its UUID.
 *
 * The batch starts with ingest_status = 'processing'; call
 * finaliseReferenceIngestBatch() once all rows have been written.
 *
 * @throws if the insert fails.
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
 * Mark a reference_ingest_batches row as completed / partial / failed.
 *
 * Status logic:
 *   parsed === 0          → 'failed'
 *   parsed < total        → 'partial'
 *   parsed === total      → 'completed'
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
