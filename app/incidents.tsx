import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import ScreenShell from '@/components/ScreenShell';
import { colors, spacing, typography, radius } from '@/lib/tokens';
import { useAppStore } from '@/state/appStore';
import {
  getIncidentsForUser,
  logIncident,
  deleteIncident,
  type LogIncidentInput,
} from '@/features/incidents';
import type { Incident } from '@/types/entities';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const INCIDENT_TYPES: Incident['type'][] = [
  'accident',
  'customer_issue',
  'platform_issue',
  'other',
];

const TYPE_LABELS: Record<Incident['type'], string> = {
  accident: 'Accident',
  customer_issue: 'Customer Issue',
  platform_issue: 'Platform Issue',
  other: 'Other',
};

const TYPE_COLORS: Record<Incident['type'], string> = {
  accident: colors.error,
  customer_issue: colors.warning,
  platform_issue: colors.info,
  other: colors.textMuted,
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function fmtDateTime(iso: string): string {
  return new Date(iso).toLocaleString([], {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

// ---------------------------------------------------------------------------
// Log incident form
// ---------------------------------------------------------------------------

function LogIncidentForm({ userId, onSaved }: { userId: string; onSaved: () => void }) {
  const [visible, setVisible] = useState(false);
  const [type, setType] = useState<Incident['type']>('other');
  const [description, setDescription] = useState('');

  const queryClient = useQueryClient();
  const { mutate, isPending } = useMutation({
    mutationFn: (input: LogIncidentInput) => logIncident(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['incidents', userId] });
      setDescription('');
      setType('other');
      setVisible(false);
      onSaved();
    },
    onError: () => Alert.alert('Error', 'Could not log incident.'),
  });

  if (!visible) {
    return (
      <TouchableOpacity style={styles.addBtn} onPress={() => setVisible(true)}>
        <Text style={styles.addBtnText}>+ Log Incident</Text>
      </TouchableOpacity>
    );
  }

  const handleSave = () => {
    if (!description.trim()) {
      Alert.alert('Description required', 'Describe what happened.');
      return;
    }
    mutate({ userId, type, description: description.trim() });
  };

  return (
    <View style={styles.form}>
      <Text style={styles.formTitle}>Log Incident</Text>

      <Text style={styles.label}>Type</Text>
      <View style={styles.chips}>
        {INCIDENT_TYPES.map((t) => (
          <TouchableOpacity
            key={t}
            style={[styles.chip, type === t && { backgroundColor: TYPE_COLORS[t] }]}
            onPress={() => setType(t)}
          >
            <Text style={[styles.chipText, type === t && styles.chipTextActive]}>
              {TYPE_LABELS[t]}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.label}>Description</Text>
      <TextInput
        style={[styles.input, styles.textArea]}
        placeholder="Describe what happened…"
        value={description}
        onChangeText={setDescription}
        multiline
        numberOfLines={4}
        returnKeyType="default"
      />

      <View style={styles.formActions}>
        <TouchableOpacity
          style={[styles.btn, styles.btnGhost]}
          onPress={() => setVisible(false)}
        >
          <Text style={[styles.btnText, { color: colors.textSecondary }]}>Cancel</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.btn, styles.btnPrimary, isPending && styles.disabled]}
          disabled={isPending}
          onPress={handleSave}
        >
          {isPending
            ? <ActivityIndicator color="#fff" size="small" />
            : <Text style={styles.btnText}>Save</Text>}
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Incident card
// ---------------------------------------------------------------------------

function IncidentCard({
  incident,
  onDelete,
}: {
  incident: Incident;
  onDelete: (id: string) => void;
}) {
  const color = TYPE_COLORS[incident.type];

  const handleDelete = () => {
    Alert.alert(
      'Delete incident?',
      TYPE_LABELS[incident.type],
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => onDelete(incident.id) },
      ],
    );
  };

  return (
    <View style={[styles.card, { borderLeftColor: color }]}>
      <View style={styles.cardHeader}>
        <View style={[styles.typeBadge, { backgroundColor: color }]}>
          <Text style={styles.typeBadgeText}>{TYPE_LABELS[incident.type]}</Text>
        </View>
        <Text style={styles.cardDate}>{fmtDateTime(incident.createdAt)}</Text>
        <TouchableOpacity onPress={handleDelete} style={styles.deleteBtn}>
          <Text style={styles.deleteBtnText}>×</Text>
        </TouchableOpacity>
      </View>
      <Text style={styles.cardDescription}>{incident.description}</Text>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Screen
// ---------------------------------------------------------------------------

export default function IncidentsScreen() {
  const userId = useAppStore((s) => s.userId) ?? 'local';
  const queryClient = useQueryClient();

  const { data: incidents = [], isLoading } = useQuery({
    queryKey: ['incidents', userId],
    queryFn: () => getIncidentsForUser(userId),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteIncident(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['incidents', userId] }),
    onError: () => Alert.alert('Error', 'Could not delete incident.'),
  });

  return (
    <ScreenShell title="Incidents" subtitle="Log problems, evidence and support cases">

      <LogIncidentForm userId={userId} onSaved={() => {}} />

      {isLoading ? (
        <ActivityIndicator color={colors.primary} style={{ marginTop: spacing.lg }} />
      ) : incidents.length === 0 ? (
        <Text style={styles.empty}>No incidents logged. Hope it stays that way!</Text>
      ) : (
        <FlatList
          data={incidents}
          keyExtractor={(i) => i.id}
          renderItem={({ item }) => (
            <IncidentCard incident={item} onDelete={(id) => deleteMutation.mutate(id)} />
          )}
          scrollEnabled={false}
        />
      )}

    </ScreenShell>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  addBtn: {
    backgroundColor: colors.error,
    borderRadius: radius.md,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  addBtnText: {
    color: '#fff',
    fontWeight: typography.fontWeightSemibold,
    fontSize: typography.fontSizeMd,
  },
  form: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.md,
    gap: spacing.xs,
  },
  formTitle: {
    fontSize: typography.fontSizeLg,
    fontWeight: typography.fontWeightBold,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  label: {
    fontSize: typography.fontSizeSm,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
  chip: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.full,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipText: {
    fontSize: typography.fontSizeXs,
    color: colors.textSecondary,
    fontWeight: typography.fontWeightMedium,
  },
  chipTextActive: {
    color: '#fff',
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: typography.fontSizeMd,
    color: colors.textPrimary,
    backgroundColor: colors.background,
    marginTop: spacing.xs,
  },
  textArea: {
    minHeight: 90,
    textAlignVertical: 'top',
  },
  formActions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  btn: {
    flex: 1,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    alignItems: 'center',
  },
  btnPrimary: { backgroundColor: colors.primary },
  btnGhost: { borderWidth: 1, borderColor: colors.border },
  disabled: { opacity: 0.5 },
  btnText: {
    color: '#fff',
    fontWeight: typography.fontWeightSemibold,
    fontSize: typography.fontSizeSm,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    borderLeftWidth: 4,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  typeBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.full,
  },
  typeBadgeText: {
    color: '#fff',
    fontSize: typography.fontSizeXs,
    fontWeight: typography.fontWeightSemibold,
  },
  cardDate: {
    flex: 1,
    fontSize: typography.fontSizeSm,
    color: colors.textSecondary,
  },
  deleteBtn: {
    padding: 2,
  },
  deleteBtnText: {
    fontSize: 18,
    color: colors.textMuted,
    lineHeight: 18,
  },
  cardDescription: {
    fontSize: typography.fontSizeMd,
    color: colors.textPrimary,
    lineHeight: 22,
  },
  empty: {
    color: colors.textSecondary,
    fontSize: typography.fontSizeMd,
    textAlign: 'center',
    marginTop: spacing.xl,
  },
});
