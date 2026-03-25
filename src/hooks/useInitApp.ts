import { useEffect } from 'react';
import { initLocalDatabase } from '@/db';
import { supabaseClient } from '@/services/supabase/client';
import { useAppStore } from '@/state/appStore';
import { captureException } from '@/services/crash';

export function useInitApp() {
  const setDbReady = useAppStore((s) => s.setDbReady);

  useEffect(() => {
    initLocalDatabase()
      .then(() => setDbReady(true))
      .catch((error) => {
        captureException(error, { context: 'useInitApp/initLocalDatabase' });
      });

    if (supabaseClient) {
      supabaseClient.auth.getSession().catch(() => null);
    }
  }, [setDbReady]);
}
