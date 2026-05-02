import type { SupabaseClient } from '@supabase/supabase-js';

import { isSupabaseConfigured, referenceClient, supabaseClient } from '@/services/supabase/client';
import type { Database } from '@/types/supabase.generated';

/**
 * Get the configured Supabase client, throwing an error if the client is not available.
 *
 * @param errorMessage - Error message to use when the Supabase client is not configured (defaults to 'Supabase client is not configured')
 * @returns The configured `SupabaseClient<Database>` instance
 * @throws Error if Supabase is not configured or the client is not present; the thrown error's message is `errorMessage`
 */
export function getSupabaseClientOrThrow(
  errorMessage = 'Supabase client is not configured',
): SupabaseClient<Database> {
  if (!isSupabaseConfigured || !supabaseClient) {
    throw new Error(errorMessage);
  }
  return supabaseClient;
}

/**
 * Get the Supabase client scoped to the `reference` schema, throwing if unavailable.
 *
 * Use for all queries against reference/overlay tables
 * (reference_datasets, reference_features, zone_demographics, external_conditions, etc.)
 * that live in the `reference` schema after migration 20260421000000_reference_schema.
 */
export function getSupabaseReferenceClientOrThrow(
  errorMessage = 'Supabase reference client is not configured',
): NonNullable<typeof referenceClient> {
  if (!isSupabaseConfigured || !referenceClient) {
    throw new Error(errorMessage);
  }
  return referenceClient;
}
