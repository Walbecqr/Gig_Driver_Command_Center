import type { SupabaseClient } from '@supabase/supabase-js';

import { isSupabaseConfigured, supabaseClient } from '@/services/supabase/client';
import type { Database } from '@/types/supabase.generated';

/**
 * Returns the configured Supabase client or throws with the provided context message.
 */
export function getSupabaseClientOrThrow(
  errorMessage = 'Supabase client is not configured',
): SupabaseClient<Database> {
  if (!isSupabaseConfigured || !supabaseClient) {
    throw new Error(errorMessage);
  }
  return supabaseClient;
}
