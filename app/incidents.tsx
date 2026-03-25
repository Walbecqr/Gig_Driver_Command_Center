import { Text } from 'react-native';
import ScreenShell from '@/components/ScreenShell';

export default function IncidentsScreen() {
  return (
    <ScreenShell title="Incidents" subtitle="Log problems, evidence and support cases">
      <Text>Incident logging module is in src/features/incidents/.</Text>
    </ScreenShell>
  );
}
