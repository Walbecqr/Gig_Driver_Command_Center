/**
 * Shared Supabase ingestion helpers.
 *
 * Provides import_batch lifecycle management (create → finalise) and the
 * simpleHash dedup utility used by all Kaggle ingestion services.
 */

import { getSupabaseClientOrThrow } from '@/services/supabase/utils';
import type { Database } from '@/types/supabase.generated';

type PlatformEnum = Database['public']['Enums']['platform_enum'];
type SourceTypeEnum = Database['public']['Enums']['source_type_enum'];

export interface ImportBatchInput {
  userId: string;
  platformAccountId: string;
  sourceFileName: string;
  sourceFileHash: string;
  /** ISO date string (YYYY-MM-DD) of the earliest record in the file. */
  statementStartDate: string;
  /** ISO date string (YYYY-MM-DD) of the latest record in the file. */
  statementEndDate: string;
  parserVersion: string;
}

/**
 * Insert an import_batches row and return its generated UUID.
 * Throws if the insert fails (e.g. duplicate file hash for the same account).
 */
export async function createImportBatch(
  batch: ImportBatchInput,
  platform: PlatformEnum,
  sourceType: SourceTypeEnum,
  rowCountRaw: number,
): Promise<string> {
  const supabase = getSupabaseClientOrThrow('[ingestionUtils] Supabase client is not configured');
  const { data, error } = await supabase
    .from('import_batches')
    .insert({
      user_id: batch.userId,
      platform_account_id: batch.platformAccountId,
      source_platform: platform,
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

/**
 * Set an import batch's status and parsed row count based on the number of parsed rows.
 *
 * Updates the `import_batches` row identified by `importBatchId` with `row_count_parsed`
 * and an `import_status` determined as: `failed` when `parsed` is 0, `partial` when
 * `parsed` is less than `total`, and `completed` otherwise.
 *
 * @param importBatchId - The `import_batch_id` of the batch to update
 * @param total - The expected total number of rows in the import
 * @param parsed - The number of rows that were successfully parsed
 */
export async function finaliseImportBatch(
  importBatchId: string,
  total: number,
  parsed: number,
): Promise<void> {
  const supabase = getSupabaseClientOrThrow('[ingestionUtils] Supabase client is not configured');
  const status = parsed === 0 ? 'failed' : parsed < total ? 'partial' : 'completed';
  await supabase
    .from('import_batches')
    .update({ import_status: status, row_count_parsed: parsed })
    .eq('import_batch_id', importBatchId);
}

/** Cheap non-cryptographic hash for the row_hash dedup column. */
export function simpleHash(str: string): string {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = (Math.imul(31, h) + str.charCodeAt(i)) | 0;
  }
  return (h >>> 0).toString(16).padStart(8, '0');
}
