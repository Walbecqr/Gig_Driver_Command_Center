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
  getOffersForShift,
  recordOffer,
  respondToOffer,
  getAcceptanceRate,
  type RecordOfferInput,
} from '@/features/offers';
import type { Offer } from '@/types/entities';

// ---------------------------------------------------------------------------
// Offer card
// ---------------------------------------------------------------------------

function OfferCard({
  offer,
  onRespond,
}: {
  offer: Offer;
  onRespond: (id: string, response: 'accepted' | 'declined') => void;
}) {
  const isPending = offer.status === 'pending';

  const statusColor: Record<Offer['status'], string> = {
    pending: colors.warning,
    accepted: colors.success,
    declined: colors.error,
    ignored: colors.textMuted,
  };

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardPayout}>${offer.estimatedPayout.toFixed(2)}</Text>
        <View style={[styles.statusBadge, { backgroundColor: statusColor[offer.status] }]}>
          <Text style={styles.statusText}>{offer.status.toUpperCase()}</Text>
        </View>
      </View>

      <View style={styles.cardRow}>
        <Text style={styles.cardLabel}>Pickup</Text>
        <Text style={styles.cardValue}>{offer.pickupZip}</Text>
        {offer.pickupZoneId ? (
          <Text style={styles.zoneTag}>{offer.pickupZoneId.slice(0, 10)}</Text>
        ) : null}
      </View>

      <View style={styles.cardRow}>
        <Text style={styles.cardLabel}>Dropoff</Text>
        <Text style={styles.cardValue}>{offer.dropoffZip}</Text>
      </View>

      <View style={styles.cardRow}>
        <Text style={styles.cardLabel}>Distance</Text>
        <Text style={styles.cardValue}>{offer.estimatedDistanceMiles.toFixed(1)} mi</Text>
        <Text style={styles.cardLabel}> · </Text>
        <Text style={styles.cardValue}>{offer.estimatedTimeMinutes} min</Text>
      </View>

      {isPending && (
        <View style={styles.cardActions}>
          <TouchableOpacity
            style={[styles.actionBtn, styles.acceptBtn]}
            onPress={() => onRespond(offer.id, 'accepted')}
          >
            <Text style={styles.actionBtnText}>Accept</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionBtn, styles.declineBtn]}
            onPress={() => onRespond(offer.id, 'declined')}
          >
            <Text style={styles.actionBtnText}>Decline</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

// ---------------------------------------------------------------------------
// Log-offer form (collapsed by default)
// ---------------------------------------------------------------------------

function LogOfferForm({ shiftId, onSaved }: { shiftId: string; onSaved: () => void }) {
  const [visible, setVisible] = useState(false);
  const [payout, setPayout] = useState('');
  const [dist, setDist] = useState('');
  const [time, setTime] = useState('');
  const [pickupZip, setPickupZip] = useState('');
  const [dropoffZip, setDropoffZip] = useState('');

  const queryClient = useQueryClient();
  const { mutate, isPending } = useMutation({
    mutationFn: (input: RecordOfferInput) => recordOffer(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['offers', shiftId] });
      setPayout('');
      setDist('');
      setTime('');
      setPickupZip('');
      setDropoffZip('');
      setVisible(false);
      onSaved();
    },
    onError: () => Alert.alert('Error', 'Could not save offer.'),
  });

  if (!visible) {
    return (
      <TouchableOpacity style={styles.logBtn} onPress={() => setVisible(true)}>
        <Text style={styles.logBtnText}>+ Log Incoming Offer</Text>
      </TouchableOpacity>
    );
  }

  return (
    <View style={styles.form}>
      <Text style={styles.formTitle}>Log Offer</Text>

      <View style={styles.formRow}>
        <TextInput
          style={[styles.input, styles.inputHalf]}
          placeholder="Pickup ZIP"
          value={pickupZip}
          onChangeText={setPickupZip}
          keyboardType="numeric"
          maxLength={5}
        />
        <TextInput
          style={[styles.input, styles.inputHalf]}
          placeholder="Dropoff ZIP"
          value={dropoffZip}
          onChangeText={setDropoffZip}
          keyboardType="numeric"
          maxLength={5}
        />
      </View>

      <View style={styles.formRow}>
        <TextInput
          style={[styles.input, styles.inputThird]}
          placeholder="Payout $"
          value={payout}
          onChangeText={setPayout}
          keyboardType="decimal-pad"
        />
        <TextInput
          style={[styles.input, styles.inputThird]}
          placeholder="Miles"
          value={dist}
          onChangeText={setDist}
          keyboardType="decimal-pad"
        />
        <TextInput
          style={[styles.input, styles.inputThird]}
          placeholder="Min"
          value={time}
          onChangeText={setTime}
          keyboardType="numeric"
        />
      </View>

      <View style={styles.formActions}>
        <TouchableOpacity
          style={[styles.actionBtn, styles.acceptBtn, isPending && styles.disabled]}
          disabled={isPending}
          onPress={() => {
            if (!pickupZip || !dropoffZip || !payout) {
              Alert.alert('Missing fields', 'ZIP codes and payout are required.');
              return;
            }
            mutate({
              shiftId,
              pickupZip,
              dropoffZip,
              estimatedPayout: parseFloat(payout) || 0,
              estimatedDistanceMiles: parseFloat(dist) || 0,
              estimatedTimeMinutes: parseInt(time, 10) || 0,
            });
          }}
        >
          {isPending ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text style={styles.actionBtnText}>Save</Text>
          )}
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionBtn, styles.declineBtn]}
          onPress={() => setVisible(false)}
        >
          <Text style={styles.actionBtnText}>Cancel</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Screen
// ---------------------------------------------------------------------------

export default function OffersScreen() {
  const activeShift = useShiftStore((s) => s.activeShift);
  const queryClient = useQueryClient();

  const shiftId = activeShift?.id ?? null;

  const { data: offers = [], isLoading } = useQuery({
    queryKey: ['offers', shiftId],
    queryFn: () => getOffersForShift(shiftId!),
    enabled: shiftId != null,
  });

  const { data: acceptanceRate } = useQuery({
    queryKey: ['offers-rate', shiftId],
    queryFn: () => getAcceptanceRate(shiftId!),
    enabled: shiftId != null,
  });

  const respondMutation = useMutation({
    mutationFn: ({ id, response }: { id: string; response: 'accepted' | 'declined' }) =>
      respondToOffer(id, response),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['offers', shiftId] });
      queryClient.invalidateQueries({ queryKey: ['offers-rate', shiftId] });
    },
    onError: () => Alert.alert('Error', 'Could not update offer.'),
  });

  if (!activeShift) {
    return (
      <ScreenShell title="Offers" subtitle="View and evaluate delivery offers">
        <Text style={styles.emptyText}>Start a shift to log offers.</Text>
      </ScreenShell>
    );
  }

  return (
    <ScreenShell title="Offers" subtitle="View and evaluate delivery offers">
      {/* Stats row */}
      <View style={styles.statsRow}>
        <View style={styles.stat}>
          <Text style={styles.statValue}>{offers.length}</Text>
          <Text style={styles.statLabel}>Total</Text>
        </View>
        <View style={styles.stat}>
          <Text style={styles.statValue}>
            {offers.filter((o) => o.status === 'accepted').length}
          </Text>
          <Text style={styles.statLabel}>Accepted</Text>
        </View>
        <View style={styles.stat}>
          <Text style={styles.statValue}>
            {acceptanceRate != null ? `${acceptanceRate}%` : '—'}
          </Text>
          <Text style={styles.statLabel}>Rate</Text>
        </View>
      </View>

      <LogOfferForm shiftId={activeShift.id} onSaved={() => {}} />

      {isLoading ? (
        <ActivityIndicator style={{ marginTop: spacing.lg }} color={colors.primary} />
      ) : offers.length === 0 ? (
        <Text style={styles.emptyText}>No offers logged yet this shift.</Text>
      ) : (
        <FlatList
          data={offers}
          keyExtractor={(o) => o.id}
          renderItem={({ item }) => (
            <OfferCard
              offer={item}
              onRespond={(id, response) => respondMutation.mutate({ id, response })}
            />
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
  statsRow: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    gap: spacing.md,
  },
  stat: { flex: 1, alignItems: 'center' },
  statValue: {
    fontSize: typography.fontSizeXl,
    fontWeight: typography.fontWeightBold,
    color: colors.textPrimary,
  },
  statLabel: {
    fontSize: typography.fontSizeSm,
    color: colors.textSecondary,
    marginTop: 2,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  cardPayout: {
    fontSize: typography.fontSizeLg,
    fontWeight: typography.fontWeightBold,
    color: colors.textPrimary,
  },
  statusBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.full,
  },
  statusText: {
    fontSize: typography.fontSizeXs,
    fontWeight: typography.fontWeightBold,
    color: '#fff',
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    gap: spacing.xs,
  },
  cardLabel: {
    fontSize: typography.fontSizeSm,
    color: colors.textSecondary,
    width: 56,
  },
  cardValue: {
    fontSize: typography.fontSizeSm,
    color: colors.textPrimary,
    fontWeight: typography.fontWeightMedium,
  },
  zoneTag: {
    fontSize: typography.fontSizeXs,
    color: colors.primary,
    backgroundColor: '#EFF6FF',
    paddingHorizontal: spacing.xs,
    paddingVertical: 1,
    borderRadius: radius.sm,
    fontFamily: 'monospace',
  },
  cardActions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  actionBtn: {
    flex: 1,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    alignItems: 'center',
  },
  acceptBtn: { backgroundColor: colors.success },
  declineBtn: { backgroundColor: colors.error },
  disabled: { opacity: 0.5 },
  actionBtnText: {
    color: '#fff',
    fontWeight: typography.fontWeightSemibold,
    fontSize: typography.fontSizeSm,
  },
  logBtn: {
    backgroundColor: colors.primary,
    borderRadius: radius.lg,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  logBtnText: {
    color: '#fff',
    fontWeight: typography.fontWeightSemibold,
    fontSize: typography.fontSizeMd,
  },
  form: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  formTitle: {
    fontSize: typography.fontSizeMd,
    fontWeight: typography.fontWeightSemibold,
    marginBottom: spacing.sm,
    color: colors.textPrimary,
  },
  formRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    fontSize: typography.fontSizeSm,
    color: colors.textPrimary,
    backgroundColor: colors.background,
  },
  inputHalf: { flex: 1 },
  inputThird: { flex: 1 },
  formActions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  emptyText: {
    color: colors.textSecondary,
    fontSize: typography.fontSizeMd,
    textAlign: 'center',
    marginTop: spacing.xl,
  },
});
