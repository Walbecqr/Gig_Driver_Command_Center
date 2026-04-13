import type { SupabaseClient } from '@supabase/supabase-js';

import { isSupabaseConfigured, supabaseClient } from '@/services/supabase/client';
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
