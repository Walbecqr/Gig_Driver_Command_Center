import { Text } from 'react-native';
import { Link } from 'expo-router';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';

export default function Home() {
  return (
    <SafeAreaProvider>
      <SafeAreaView
        style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 16 }}
      >
        <Text style={{ fontSize: 24, marginBottom: 12 }}>Gig Driver Command Center</Text>
        <Text style={{ marginBottom: 8 }}>Welcome to the MVP skeleton.</Text>
        <Link href="/dashboard">Go to dashboard</Link>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}
