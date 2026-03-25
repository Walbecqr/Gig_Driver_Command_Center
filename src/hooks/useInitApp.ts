import { useEffect } from 'react';
import { initLocalDatabase } from '@/db';
import { supabaseClient } from '@/services/supabase/client';

export function useInitApp() {
  useEffect(() => {
    initLocalDatabase().catch((error) => {
      console.error('[useInitApp] failed to initialize local db', error);
    });

    // bare initialization for Supabase or auth existing session checks
    if (supabaseClient) {
      // no-op in shell
    }
  }, []);
}
