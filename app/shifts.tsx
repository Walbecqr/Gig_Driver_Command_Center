import React, { useState, useEffect } from 'react';
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
import { useShiftStore } from '@/state/shiftStore';
import { startShift, endShift, pauseShift, resumeShift, getAllShifts } from '@/features/shifts';
import type { Shift } from '@/types/entities';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Format an elapsed-milliseconds value as "Xh Ym" or "Ym". */
function formatElapsed(ms: number): string {
  const totalMin = Math.floor(ms / 60_000);
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

/** Format a local time string as "9:02 AM". */
function fmtTime(iso: string): string {
  return new Date(iso).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}

/** Format a local date as "Mon Dec 12". */
function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString([], {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

// ---------------------------------------------------------------------------
// Elapsed timer — re-renders every 30 s while a shift is active
// ---------------------------------------------------------------------------

function useElapsed(startTime: string | undefined): string {
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    if (!startTime) return;
    const id = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(id);
  }, [startTime]);

  if (!startTime) return '—';
  return formatElapsed(now - new Date(startTime).getTime());
}

// ---------------------------------------------------------------------------
// Active shift card
// ---------------------------------------------------------------------------

function ActiveShiftCard({ shift }: { shift: Shift }) {
  const elapsed = useElapsed(shift.startTime);
  const isPaused = shift.status === 'paused';
  const queryClient = useQueryClient();
  const { setActiveShift } = useShiftStore();

  const [endMileage, setEndMileage] = useState('');
  const [showEndForm, setShowEndForm] = useState(false);

  const pauseMutation = useMutation({
    mutationFn: () => pauseShift(shift.id),
    onSuccess: async () => {
      // Refresh from DB so store has current status
      const { getShiftById } = await import('@/features/shifts');
      const updated = await getShiftById(shift.id);
      if (updated) setActiveShift(updated);
      queryClient.invalidateQueries({ queryKey: ['shifts'] });
    },
  });

  const resumeMutation = useMutation({
    mutationFn: () => resumeShift(shift.id),
    onSuccess: async () => {
      const { getShiftById } = await import('@/features/shifts');
      const updated = await getShiftById(shift.id);
      if (updated) setActiveShift(updated);
      queryClient.invalidateQueries({ queryKey: ['shifts'] });
    },
  });

  const endMutation = useMutation({
    mutationFn: (mileage: number) => endShift(shift.id, mileage),
    onSuccess: () => {
      setActiveShift(null);
      queryClient.invalidateQueries({ queryKey: ['shifts'] });
    },
    onError: () => Alert.alert('Error', 'Could not end shift.'),
  });

  const handleEnd = () => {
    const miles = parseFloat(endMileage);
    if (isNaN(miles) || miles < shift.startingMileage) {
      Alert.alert(
        'Invalid mileage',
        `Enter a value ≥ starting odometer (${shift.startingMileage.toLocaleString()}).`,
      );
      return;
    }
    Alert.alert(
      'End shift?',
      `${formatElapsed(Date.now() - new Date(shift.startTime).getTime())} · ` +
        `${(miles - shift.startingMileage).toFixed(1)} mi driven`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'End Shift', style: 'destructive', onPress: () => endMutation.mutate(miles) },
      ],
    );
  };

  const statusColor = isPaused ? colors.warning : colors.success;

  return (
    <View style={[styles.activeCard, { borderColor: statusColor }]}>
      {/* Header row */}
      <View style={styles.activeHeader}>
        <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
        <Text style={[styles.activeStatus, { color: statusColor }]}>
          {isPaused ? 'PAUSED' : 'ACTIVE'}
        </Text>
        <Text style={styles.activeStarted}>started {fmtTime(shift.startTime)}</Text>
      </View>

      {/* Stats */}
      <View style={styles.statsRow}>
        <View style={styles.stat}>
          <Text style={styles.statValue}>{elapsed}</Text>
          <Text style={styles.statLabel}>Elapsed</Text>
        </View>
        <View style={styles.stat}>
          <Text style={styles.statValue}>{shift.startingMileage.toLocaleString()}</Text>
          <Text style={styles.statLabel}>Start odometer</Text>
        </View>
      </View>

      {/* Pause / Resume */}
      <View style={styles.rowBtns}>
        {isPaused ? (
          <TouchableOpacity
            style={[styles.btn, styles.btnSuccess, resumeMutation.isPending && styles.disabled]}
            disabled={resumeMutation.isPending}
            onPress={() => resumeMutation.mutate()}
          >
            {resumeMutation.isPending ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text style={styles.btnText}>Resume</Text>
            )}
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[styles.btn, styles.btnWarning, pauseMutation.isPending && styles.disabled]}
            disabled={pauseMutation.isPending}
            onPress={() => pauseMutation.mutate()}
          >
            {pauseMutation.isPending ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text style={styles.btnText}>Pause</Text>
            )}
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={[styles.btn, styles.btnGhost]}
          onPress={() => setShowEndForm((v) => !v)}
        >
          <Text style={[styles.btnText, { color: colors.error }]}>
            {showEndForm ? 'Cancel End' : 'End Shift'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* End-shift form */}
      {showEndForm && (
        <View style={styles.endForm}>
          <Text style={styles.endFormLabel}>Ending odometer reading</Text>
          <TextInput
            style={styles.input}
            placeholder={`≥ ${shift.startingMileage.toLocaleString()}`}
            value={endMileage}
            onChangeText={setEndMileage}
            keyboardType="decimal-pad"
            returnKeyType="done"
          />
          <TouchableOpacity
            style={[styles.btn, styles.btnError, endMutation.isPending && styles.disabled]}
            disabled={endMutation.isPending}
            onPress={handleEnd}
          >
            {endMutation.isPending ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text style={styles.btnText}>Confirm End Shift</Text>
            )}
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

// ---------------------------------------------------------------------------
// Start-shift form
// ---------------------------------------------------------------------------

function StartShiftForm() {
  const [mileage, setMileage] = useState('');
  const queryClient = useQueryClient();
  const { setActiveShift } = useShiftStore();

  const mutation = useMutation({
    mutationFn: (miles: number) =>
      // userId 'local' until Supabase auth is wired to the store
      startShift('local', miles),
    onSuccess: (shift) => {
      setActiveShift(shift);
      queryClient.invalidateQueries({ queryKey: ['shifts'] });
      setMileage('');
    },
    onError: () => Alert.alert('Error', 'Could not start shift.'),
  });

  const handleStart = () => {
    const miles = parseFloat(mileage);
    if (isNaN(miles) || miles < 0) {
      Alert.alert('Invalid mileage', 'Enter your current odometer reading.');
      return;
    }
    mutation.mutate(miles);
  };

  return (
    <View style={styles.startForm}>
      <Text style={styles.startFormTitle}>Ready to drive?</Text>
      <Text style={styles.startFormSub}>Enter your odometer before you start.</Text>

      <TextInput
        style={styles.input}
        placeholder="Current odometer (miles)"
        value={mileage}
        onChangeText={setMileage}
        keyboardType="decimal-pad"
        returnKeyType="done"
      />

      <TouchableOpacity
        style={[
          styles.btn,
          styles.btnPrimary,
          { marginTop: spacing.xs },
          mutation.isPending && styles.disabled,
        ]}
        disabled={mutation.isPending}
        onPress={handleStart}
      >
        {mutation.isPending ? (
          <ActivityIndicator color="#fff" size="small" />
        ) : (
          <Text style={styles.btnText}>Start Shift</Text>
        )}
      </TouchableOpacity>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Shift history row
// ---------------------------------------------------------------------------

function ShiftRow({ shift }: { shift: Shift }) {
  const startMs = new Date(shift.startTime).getTime();
  const endMs = shift.endTime ? new Date(shift.endTime).getTime() : null;
  const duration = endMs ? formatElapsed(endMs - startMs) : 'in progress';
  const miles =
    shift.endingMileage != null
      ? (shift.endingMileage - shift.startingMileage).toFixed(1) + ' mi'
      : '—';

  return (
    <View style={styles.historyRow}>
      <View style={{ flex: 1 }}>
        <Text style={styles.historyDate}>{fmtDate(shift.startTime)}</Text>
        <Text style={styles.historyMeta}>
          {fmtTime(shift.startTime)}
          {shift.endTime ? ` – ${fmtTime(shift.endTime)}` : ''}
        </Text>
      </View>
      <View style={styles.historyRight}>
        <Text style={styles.historyDuration}>{duration}</Text>
        <Text style={styles.historyMiles}>{miles}</Text>
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Screen
// ---------------------------------------------------------------------------

export default function ShiftsScreen() {
  const { activeShift } = useShiftStore();

  const { data: allShifts = [], isLoading } = useQuery({
    queryKey: ['shifts'],
    queryFn: getAllShifts,
  });

  const history = allShifts.filter(
    (s) => s.status === 'completed' || (activeShift && s.id !== activeShift.id),
  );

  return (
    <ScreenShell title="Shift Tracker" subtitle="Track start/end time and mileage">
      {/* Active shift card OR start form */}
      {activeShift ? <ActiveShiftCard shift={activeShift} /> : <StartShiftForm />}

      {/* Shift history */}
      {isLoading ? (
        <ActivityIndicator color={colors.primary} style={{ marginTop: spacing.lg }} />
      ) : history.length > 0 ? (
        <>
          <Text style={styles.sectionTitle}>Recent Shifts</Text>
          <FlatList
            data={history}
            keyExtractor={(s) => s.id}
            renderItem={({ item }) => <ShiftRow shift={item} />}
            scrollEnabled={false}
          />
        </>
      ) : !activeShift ? (
        <Text style={styles.emptyText}>No shifts recorded yet.</Text>
      ) : null}
    </ScreenShell>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  // Active shift card
  activeCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 2,
    marginBottom: spacing.md,
  },
  activeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  activeStatus: {
    fontSize: typography.fontSizeSm,
    fontWeight: typography.fontWeightBold,
    letterSpacing: 0.5,
  },
  activeStarted: {
    fontSize: typography.fontSizeSm,
    color: colors.textSecondary,
    marginLeft: 'auto',
  },

  // Stats
  statsRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  stat: {
    flex: 1,
    backgroundColor: colors.background,
    borderRadius: radius.md,
    padding: spacing.sm,
    alignItems: 'center',
  },
  statValue: {
    fontSize: typography.fontSizeLg,
    fontWeight: typography.fontWeightBold,
    color: colors.textPrimary,
  },
  statLabel: {
    fontSize: typography.fontSizeXs,
    color: colors.textSecondary,
    marginTop: 2,
  },

  // Buttons
  rowBtns: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  btn: {
    flex: 1,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnPrimary: { backgroundColor: colors.primary },
  btnSuccess: { backgroundColor: colors.success },
  btnWarning: { backgroundColor: colors.warning },
  btnError: { backgroundColor: colors.error },
  btnGhost: {
    borderWidth: 1,
    borderColor: colors.error,
    backgroundColor: 'transparent',
  },
  disabled: { opacity: 0.5 },
  btnText: {
    color: '#fff',
    fontWeight: typography.fontWeightSemibold,
    fontSize: typography.fontSizeSm,
  },

  // End-shift form
  endForm: {
    marginTop: spacing.md,
    gap: spacing.sm,
  },
  endFormLabel: {
    fontSize: typography.fontSizeSm,
    color: colors.textSecondary,
  },

  // Start-shift form
  startForm: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  startFormTitle: {
    fontSize: typography.fontSizeXl,
    fontWeight: typography.fontWeightBold,
    color: colors.textPrimary,
  },
  startFormSub: {
    fontSize: typography.fontSizeSm,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },

  // Input
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: typography.fontSizeMd,
    color: colors.textPrimary,
    backgroundColor: colors.background,
  },

  // History
  sectionTitle: {
    fontSize: typography.fontSizeMd,
    fontWeight: typography.fontWeightSemibold,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
    marginTop: spacing.xs,
  },
  historyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.xs,
    borderWidth: 1,
    borderColor: colors.border,
  },
  historyDate: {
    fontSize: typography.fontSizeMd,
    fontWeight: typography.fontWeightMedium,
    color: colors.textPrimary,
  },
  historyMeta: {
    fontSize: typography.fontSizeSm,
    color: colors.textSecondary,
    marginTop: 2,
  },
  historyRight: {
    alignItems: 'flex-end',
  },
  historyDuration: {
    fontSize: typography.fontSizeMd,
    fontWeight: typography.fontWeightSemibold,
    color: colors.textPrimary,
  },
  historyMiles: {
    fontSize: typography.fontSizeSm,
    color: colors.textSecondary,
    marginTop: 2,
  },

  emptyText: {
    color: colors.textSecondary,
    fontSize: typography.fontSizeMd,
    textAlign: 'center',
    marginTop: spacing.xl,
  },
});
