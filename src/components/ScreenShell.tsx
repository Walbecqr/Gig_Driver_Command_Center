import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';

interface ScreenShellProps {
  title: string;
  subtitle?: string;
  children?: React.ReactNode;
}

export default function ScreenShell({ title, subtitle, children }: ScreenShellProps) {
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>{title}</Text>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      <View style={styles.body}>{children}</View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 16,
    backgroundColor: '#f7f7fa'
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 8
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12
  },
  body: {
    flex: 1
  }
});
