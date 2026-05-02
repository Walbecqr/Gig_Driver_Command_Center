import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/supabase.generated';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    '[supabase] Missing required env vars.\n' +
      'Set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY in .env\n' +
      'Never use SUPABASE_SERVICE_ROLE_KEY here — that key belongs only in Edge Functions.',
  );
}

/**
 * True when both required Supabase env vars are present (always true after startup guard above).
 * Retained for backward compatibility with callers that gate on this flag.
 */
export const isSupabaseConfigured = true;

export const supabaseClient = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: false,
  },
});
