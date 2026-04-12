import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';

import ScreenShell from '@/components/ScreenShell';
import { colors, spacing, typography, radius } from '@/lib/tokens';
import { useAppStore } from '@/state/appStore';
import { PLAN_LABELS, resetOnboarding } from '@/features/settings';

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function SettingsSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.sectionBody}>{children}</View>
    </View>
  );
}

function SettingsRow({
  label,
  value,
  onPress,
  destructive = false,
}: {
  label: string;
  value?: string;
  onPress?: () => void;
  destructive?: boolean;
}) {
  return (
    <TouchableOpacity
      style={styles.row}
      onPress={onPress}
      disabled={!onPress}
      activeOpacity={onPress ? 0.6 : 1}
    >
      <Text style={[styles.rowLabel, destructive && { color: colors.error }]}>{label}</Text>
      {value ? <Text style={styles.rowValue}>{value}</Text> : null}
    </TouchableOpacity>
  );
}

// ---------------------------------------------------------------------------
// Screen
// ---------------------------------------------------------------------------

export default function SettingsScreen() {
  const plan = useAppStore((s) => s.plan);
  const userId = useAppStore((s) => s.userId);
  const isOnboarded = useAppStore((s) => s.isOnboarded);

  const handleResetOnboarding = () => {
    Alert.alert(
      'Reset onboarding?',
      'You will see the setup flow on next app launch.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: () => {
            resetOnboarding();
            Alert.alert('Done', 'Onboarding will show on next launch.');
          },
        },
      ],
    );
  };

  return (
    <ScreenShell title="Settings" subtitle="App settings, sync, and privacy controls">

      <SettingsSection title="Account">
        <SettingsRow label="Plan" value={PLAN_LABELS[plan]} />
        <SettingsRow
          label="User ID"
          value={userId ? `${userId.slice(0, 8)}…` : 'Not signed in'}
        />
        <SettingsRow
          label="Onboarding status"
          value={isOnboarded ? 'Complete' : 'Pending'}
        />
      </SettingsSection>

      <SettingsSection title="Data">
        <SettingsRow
          label="Reset onboarding"
          onPress={handleResetOnboarding}
          destructive
        />
      </SettingsSection>

      <SettingsSection title="About">
        <SettingsRow label="App" value="Gig Driver Command Center" />
        <SettingsRow label="Version" value="0.1.0" />
        <SettingsRow
          label="Local database"
          value="gigdcs.db (SQLite)"
        />
      </SettingsSection>

    </ScreenShell>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  section: {
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    fontSize: typography.fontSizeXs,
    fontWeight: typography.fontWeightSemibold,
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: spacing.xs,
    paddingHorizontal: spacing.xs,
  },
  sectionBody: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  rowLabel: {
    fontSize: typography.fontSizeMd,
    color: colors.textPrimary,
  },
  rowValue: {
    fontSize: typography.fontSizeSm,
    color: colors.textSecondary,
    maxWidth: '55%',
    textAlign: 'right',
  },
});
