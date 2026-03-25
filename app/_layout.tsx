import { SplashScreen, Stack } from 'expo-router';
import { useEffect } from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { queryClient } from '@/lib/queryClient';
import { useInitApp } from '@/hooks/useInitApp';

export default function Layout() {
  useInitApp();

  useEffect(() => {
    SplashScreen.hideAsync().catch(() => null);
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <SafeAreaProvider>
        <Stack>
          <Stack.Screen name="index" options={{ headerShown: false }} />
          <Stack.Screen name="onboarding" options={{ title: 'Onboarding', headerShown: false }} />
          <Stack.Screen name="dashboard" options={{ title: 'Dashboard' }} />
          <Stack.Screen name="shifts" options={{ title: 'Shift Tracker' }} />
          <Stack.Screen name="offers" options={{ title: 'Offers' }} />
          <Stack.Screen name="trips" options={{ title: 'Trip Execution' }} />
          <Stack.Screen name="earnings" options={{ title: 'Earnings' }} />
          <Stack.Screen name="expenses" options={{ title: 'Expenses' }} />
          <Stack.Screen name="cash" options={{ title: 'Cash On Hand' }} />
          <Stack.Screen name="market" options={{ title: 'Market Intel' }} />
          <Stack.Screen name="incidents" options={{ title: 'Incidents' }} />
          <Stack.Screen name="settings" options={{ title: 'Settings' }} />
        </Stack>
      </SafeAreaProvider>
    </QueryClientProvider>
  );
}
