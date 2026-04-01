import { useEffect } from 'react';
import { initLocalDatabase } from '@/db';
import { supabaseClient, isSupabaseConfigured } from '@/services/supabase/client';
import { useAppStore } from '@/state/appStore';
import { captureException } from '@/services/crash';

export function useInitApp() {
  const setDbReady = useAppStore((s) => s.setDbReady);
  const setUserId = useAppStore((s) => s.setUserId);

  useEffect(() => {
    initLocalDatabase()
      .then(() => setDbReady(true))
      .catch((error) => {
        captureException(error, { context: 'useInitApp/initLocalDatabase' });
      });

    if (isSupabaseConfigured && supabaseClient) {
      supabaseClient.auth
        .getSession()
        .then(({ data: { session } }) => {
          setUserId(session?.user?.id ?? null);
        })
        .catch((error) => {
          captureException(error, { context: 'useInitApp/getSession' });
        });
    }
  }, [setDbReady, setUserId]);
}
