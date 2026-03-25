import { Text } from 'react-native';
import ScreenShell from '@/components/ScreenShell';

export default function DashboardScreen() {
  return (
    <ScreenShell title="Dashboard" subtitle="Current insights and action cards">
      <Text>Dashboard metrics are in development under src/features/dashboard.</Text>
    </ScreenShell>
  );
}
