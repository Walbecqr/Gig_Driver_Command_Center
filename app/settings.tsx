import { Text } from 'react-native';
import ScreenShell from '@/components/ScreenShell';

export default function SettingsScreen() {
  return (
    <ScreenShell title="Settings" subtitle="App settings, sync, and privacy controls">
      <Text>Settings module is in src/features/settings/.</Text>
    </ScreenShell>
  );
}
