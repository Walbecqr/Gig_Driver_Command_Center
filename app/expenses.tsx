import { Text } from 'react-native';
import ScreenShell from '@/components/ScreenShell';

export default function ExpensesScreen() {
  return (
    <ScreenShell title="Expenses" subtitle="Log and categorise driver expenses">
      <Text>Expenses module exists under src/features/expenses/.</Text>
    </ScreenShell>
  );
}
