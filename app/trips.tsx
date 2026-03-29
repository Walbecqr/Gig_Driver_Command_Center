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
import { useShiftStore } from '@/state/shiftStore';
import {
  startTrip,
  completeTrip,
  addStop,
  getActiveTrip,
  getTripsForShift,
  getStopsForTrip,
  type AddStopInput,
} from '@/features/trips';
import type { Trip, Stop } from '@/types/entities';

// ---------------------------------------------------------------------------
// Stop row
// ---------------------------------------------------------------------------

function StopRow({ stop }: { stop: Stop }) {
  const typeColor: Record<Stop['type'], string> = {
    pickup:  colors.doordash,
    dropoff: colors.success,
    waypoint: colors.info,
  };

  return (
    <View style={styles.stopRow}>
      <View style={[styles.stopDot, { backgroundColor: typeColor[stop.type] }]} />
      <View style={{ flex: 1 }}>
        <Text style={styles.stopType}>{stop.type.toUpperCase()} #{stop.sequence}</Text>
        <Text style={styles.stopAddress}>{stop.address}</Text>
        {stop.zoneId ? (
          <Text style={styles.zoneTag}>{stop.zoneId.slice(0, 10)}…</Text>
        ) : null}
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Active trip panel
// ---------------------------------------------------------------------------

function ActiveTripPanel({
  trip,
  shiftId,
  onComplete,
}: {
  trip: Trip;
  shiftId: string;
  onComplete: () => void;
}) {
  const [addingStop, setAddingStop] = useState(false);
  const [stopType, setStopType]     = useState<Stop['type']>('pickup');
  const [address, setAddress]       = useState('');
  const [lat, setLat]               = useState('');
  const [lng, setLng]               = useState('');

  const queryClient = useQueryClient();

  const { data: stops = [] } = useQuery({
    queryKey: ['stops', trip.id],
    queryFn: () => getStopsForTrip(trip.id),
  });

  const addStopMutation = useMutation({
    mutationFn: (input: AddStopInput) => addStop(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stops', trip.id] });
      setAddress(''); setLat(''); setLng('');
      setAddingStop(false);
    },
    onError: () => Alert.alert('Error', 'Could not add stop.'),
  });

  const completeMutation = useMutation({
    mutationFn: () => completeTrip(trip.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['active-trip', shiftId] });
      queryClient.invalidateQueries({ queryKey: ['trips', shiftId] });
      onComplete();
    },
    onError: () => Alert.alert('Error', 'Could not complete trip.'),
  });

  const handleAddStop = () => {
    if (!address.trim()) {
      Alert.alert('Missing address', 'Enter the stop address.');
      return;
    }
    const parsedLat = lat ? parseFloat(lat) : undefined;
    const parsedLng = lng ? parseFloat(lng) : undefined;
    addStopMutation.mutate({
      tripId: trip.id,
      type: stopType,
      address: address.trim(),
      sequence: stops.length + 1,
      lat: parsedLat,
      lng: parsedLng,
    });
  };

  return (
    <View style={styles.activeTripCard}>
      <View style={styles.activeTripHeader}>
        <View style={styles.activeDot} />
        <Text style={styles.activeTripTitle}>Trip in Progress</Text>
      </View>

      <Text style={styles.tripMeta}>
        Started {new Date(trip.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        {' · '}
        {stops.length} stop{stops.length !== 1 ? 's' : ''}
      </Text>

      {/* Stop list */}
      {stops.length > 0 && (
        <View style={styles.stopList}>
          {stops.map((s) => <StopRow key={s.id} stop={s} />)}
        </View>
      )}

      {/* Add stop form */}
      {addingStop ? (
        <View style={styles.stopForm}>
          {/* Stop type selector */}
          <View style={styles.typeSelector}>
            {(['pickup', 'dropoff', 'waypoint'] as Stop['type'][]).map((t) => (
              <TouchableOpacity
                key={t}
                style={[styles.typeBtn, stopType === t && styles.typeBtnActive]}
                onPress={() => setStopType(t)}
              >
                <Text style={[styles.typeBtnText, stopType === t && styles.typeBtnTextActive]}>
                  {t}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <TextInput
            style={styles.input}
            placeholder="Address or location name"
            value={address}
            onChangeText={setAddress}
          />

          <View style={styles.formRow}>
            <TextInput
              style={[styles.input, { flex: 1 }]}
              placeholder="Latitude (optional)"
              value={lat}
              onChangeText={setLat}
              keyboardType="decimal-pad"
            />
            <TextInput
              style={[styles.input, { flex: 1 }]}
              placeholder="Longitude (optional)"
              value={lng}
              onChangeText={setLng}
              keyboardType="decimal-pad"
            />
          </View>

          <View style={styles.formRow}>
            <TouchableOpacity
              style={[styles.actionBtn, styles.primaryBtn,
                      addStopMutation.isPending && styles.disabled]}
              disabled={addStopMutation.isPending}
              onPress={handleAddStop}
            >
              {addStopMutation.isPending ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={styles.actionBtnText}>Add Stop</Text>
              )}
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionBtn, styles.ghostBtn]}
              onPress={() => setAddingStop(false)}
            >
              <Text style={[styles.actionBtnText, { color: colors.textSecondary }]}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <TouchableOpacity
          style={[styles.actionBtn, styles.ghostBtn, { marginBottom: spacing.sm }]}
          onPress={() => setAddingStop(true)}
        >
          <Text style={[styles.actionBtnText, { color: colors.primary }]}>+ Add Stop</Text>
        </TouchableOpacity>
      )}

      {/* Complete trip */}
      <TouchableOpacity
        style={[styles.actionBtn, styles.completeBtn,
                completeMutation.isPending && styles.disabled]}
        disabled={completeMutation.isPending}
        onPress={() =>
          Alert.alert('Complete trip?', 'This will end the current trip.', [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Complete', style: 'default', onPress: () => completeMutation.mutate() },
          ])
        }
      >
        {completeMutation.isPending ? (
          <ActivityIndicator color="#fff" size="small" />
        ) : (
          <Text style={styles.actionBtnText}>Complete Trip</Text>
        )}
      </TouchableOpacity>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Completed trip row
// ---------------------------------------------------------------------------

function CompletedTripRow({ trip }: { trip: Trip }) {
  const start = new Date(trip.startTime);
  const end   = trip.endTime ? new Date(trip.endTime) : null;
  const durationMin = end
    ? Math.round((end.getTime() - start.getTime()) / 60_000)
    : null;

  return (
    <View style={styles.completedRow}>
      <Text style={styles.completedTime}>
        {start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        {end ? ` → ${end.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : ''}
      </Text>
      {durationMin != null && (
        <Text style={styles.completedDuration}>{durationMin} min</Text>
      )}
      {trip.primaryPickupZoneId && (
        <Text style={styles.zoneTag}>{trip.primaryPickupZoneId.slice(0, 10)}…</Text>
      )}
    </View>
  );
}

// ---------------------------------------------------------------------------
// Screen
// ---------------------------------------------------------------------------

export default function TripsScreen() {
  const activeShift = useShiftStore((s) => s.activeShift);
  const queryClient = useQueryClient();

  const shiftId = activeShift?.id ?? null;

  const { data: activeTrip, isLoading: loadingActive } = useQuery({
    queryKey: ['active-trip', shiftId],
    queryFn: () => getActiveTrip(shiftId!),
    enabled: shiftId != null,
    refetchInterval: 5000,
  });

  const { data: allTrips = [] } = useQuery({
    queryKey: ['trips', shiftId],
    queryFn: () => getTripsForShift(shiftId!),
    enabled: shiftId != null,
  });

  const startMutation = useMutation({
    mutationFn: () => startTrip(shiftId!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['active-trip', shiftId] });
      queryClient.invalidateQueries({ queryKey: ['trips', shiftId] });
    },
    onError: () => Alert.alert('Error', 'Could not start trip.'),
  });

  const completedTrips = allTrips.filter((t) => t.endTime != null);

  if (!activeShift) {
    return (
      <ScreenShell title="Trip Execution" subtitle="Capture route, stops, and delivery events">
        <Text style={styles.emptyText}>Start a shift to begin a trip.</Text>
      </ScreenShell>
    );
  }

  return (
    <ScreenShell title="Trip Execution" subtitle="Capture route, stops, and delivery events">
      {/* Active trip or start button */}
      {loadingActive ? (
        <ActivityIndicator color={colors.primary} style={{ marginVertical: spacing.lg }} />
      ) : activeTrip ? (
        <ActiveTripPanel
          trip={activeTrip}
          shiftId={activeShift.id}
          onComplete={() => {}}
        />
      ) : (
        <TouchableOpacity
          style={[styles.actionBtn, styles.primaryBtn, { marginBottom: spacing.md },
                  startMutation.isPending && styles.disabled]}
          disabled={startMutation.isPending}
          onPress={() => startMutation.mutate()}
        >
          {startMutation.isPending ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text style={styles.actionBtnText}>Start New Trip</Text>
          )}
        </TouchableOpacity>
      )}

      {/* Completed trips this shift */}
      {completedTrips.length > 0 && (
        <>
          <Text style={styles.sectionTitle}>Completed This Shift ({completedTrips.length})</Text>
          <FlatList
            data={completedTrips}
            keyExtractor={(t) => t.id}
            renderItem={({ item }) => <CompletedTripRow trip={item} />}
            scrollEnabled={false}
          />
        </>
      )}

      {!activeTrip && completedTrips.length === 0 && (
        <Text style={styles.emptyText}>No trips yet this shift.</Text>
      )}
    </ScreenShell>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  activeTripCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 2,
    borderColor: colors.success,
  },
  activeTripHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
    gap: spacing.sm,
  },
  activeDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.success,
  },
  activeTripTitle: {
    fontSize: typography.fontSizeLg,
    fontWeight: typography.fontWeightBold,
    color: colors.textPrimary,
  },
  tripMeta: {
    fontSize: typography.fontSizeSm,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  stopList: {
    marginBottom: spacing.sm,
    gap: spacing.xs,
  },
  stopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    paddingVertical: spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  stopDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginTop: 4,
  },
  stopType: {
    fontSize: typography.fontSizeXs,
    fontWeight: typography.fontWeightBold,
    color: colors.textSecondary,
  },
  stopAddress: {
    fontSize: typography.fontSizeSm,
    color: colors.textPrimary,
  },
  zoneTag: {
    fontSize: typography.fontSizeXs,
    color: colors.primary,
    backgroundColor: '#EFF6FF',
    paddingHorizontal: spacing.xs,
    paddingVertical: 1,
    borderRadius: radius.sm,
    fontFamily: 'monospace',
    alignSelf: 'flex-start',
    marginTop: 2,
  },
  stopForm: {
    backgroundColor: colors.background,
    borderRadius: radius.md,
    padding: spacing.sm,
    marginBottom: spacing.sm,
    gap: spacing.sm,
  },
  typeSelector: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  typeBtn: {
    flex: 1,
    paddingVertical: spacing.xs,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  typeBtnActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  typeBtnText: {
    fontSize: typography.fontSizeXs,
    color: colors.textSecondary,
    fontWeight: typography.fontWeightMedium,
  },
  typeBtnTextActive: { color: '#fff' },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    fontSize: typography.fontSizeSm,
    color: colors.textPrimary,
    backgroundColor: colors.surface,
  },
  formRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  actionBtn: {
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    alignItems: 'center',
    flex: 1,
  },
  primaryBtn:  { backgroundColor: colors.primary },
  completeBtn: { backgroundColor: colors.success },
  ghostBtn: {
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  disabled: { opacity: 0.5 },
  actionBtnText: {
    color: '#fff',
    fontWeight: typography.fontWeightSemibold,
    fontSize: typography.fontSizeSm,
  },
  sectionTitle: {
    fontSize: typography.fontSizeMd,
    fontWeight: typography.fontWeightSemibold,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
    marginTop: spacing.xs,
  },
  completedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.sm,
    marginBottom: spacing.xs,
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  completedTime: {
    flex: 1,
    fontSize: typography.fontSizeSm,
    color: colors.textPrimary,
  },
  completedDuration: {
    fontSize: typography.fontSizeSm,
    color: colors.textSecondary,
  },
  emptyText: {
    color: colors.textSecondary,
    fontSize: typography.fontSizeMd,
    textAlign: 'center',
    marginTop: spacing.xl,
  },
});
