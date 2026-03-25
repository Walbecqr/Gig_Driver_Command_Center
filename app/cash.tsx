import { Text } from 'react-native';
import ScreenShell from '@/components/ScreenShell';

export default function CashScreen() {
  return (
    <ScreenShell title="Cash On Hand" subtitle="Track deposits, withdrawals, and ledger balance">
      <Text>Cash tracking module is in src/features/cash/.</Text>
    </ScreenShell>
  );
}
