import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/supabase.generated';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '';

/**
 * True when both required Supabase env vars are present.
 * Gate all Supabase operations on this flag to avoid silent runtime failures
 * caused by the client being initialised with empty-string credentials.
 */
export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

if (!isSupabaseConfigured) {
  console.warn(
    '[supabase] EXPO_PUBLIC_SUPABASE_URL or EXPO_PUBLIC_SUPABASE_ANON_KEY is not configured. ' +
      'Supabase API calls will not work until provided.',
  );
}

export const supabaseClient = isSupabaseConfigured
  ? createClient<Database>(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    })
  : null;

/**
 * Supabase client scoped to the `reference` schema.
 *
 * Use for all queries against the 15 reference/overlay tables that were moved
 * from `public` to `reference` in migration 20260421000000_reference_schema.
 *
 * Requires the `reference` schema to be added to PostgREST's exposed schemas
 * list in the Supabase Dashboard (Settings → API → Exposed schemas).
 */
export const referenceClient = supabaseClient?.schema('reference') ?? null;
