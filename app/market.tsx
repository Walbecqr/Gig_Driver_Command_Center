import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { useQuery } from '@tanstack/react-query';

import ScreenShell from '@/components/ScreenShell';
import { colors, spacing, typography, radius } from '@/lib/tokens';
import {
  getMarketSummary,
  getReferenceContextSummary,
  type ReferenceContextSummary,
  type ZoneInsight,
} from '@/features/market';

// ---------------------------------------------------------------------------
// Types for tab selection
// ---------------------------------------------------------------------------

type Tab = 'earning' | 'acceptance' | 'wait';

const TABS: { id: Tab; label: string }[] = [
  { id: 'earning', label: 'Top Earning' },
  { id: 'acceptance', label: 'Best Accept' },
  { id: 'wait', label: 'Fast Pickup' },
];

const WINDOWS = [
  { label: '24h', hours: 24 },
  { label: '7d', hours: 168 },
  { label: '30d', hours: 720 },
];

// ---------------------------------------------------------------------------
// Zone insight card
// ---------------------------------------------------------------------------

function ZoneCard({ insight, rank, tab }: { insight: ZoneInsight; rank: number; tab: Tab }) {
  const primary =
    tab === 'earning'
      ? {
          label: 'Avg/trip',
          value:
            insight.avgEarningsPerTrip != null ? `$${insight.avgEarningsPerTrip.toFixed(2)}` : '—',
        }
      : tab === 'acceptance'
        ? {
            label: 'Accept rate',
            value: insight.acceptanceRate != null ? `${insight.acceptanceRate}%` : '—',
          }
        : {
            label: 'Avg wait',
            value: insight.avgWaitMinutes != null ? `${insight.avgWaitMinutes} min` : '—',
          };

  // Short human-readable zone label from H3 index
  const zoneLabel = insight.zoneId.slice(0, 12);

  const rankColor =
    rank === 1 ? '#F59E0B' : rank === 2 ? '#9CA3AF' : rank === 3 ? '#B45309' : colors.textMuted;

  return (
    <View style={styles.card}>
      {/* Rank badge */}
      <View style={[styles.rankBadge, { backgroundColor: rank <= 3 ? rankColor : colors.border }]}>
        <Text style={styles.rankText}>#{rank}</Text>
      </View>

      <View style={{ flex: 1 }}>
        {/* Zone ID */}
        <Text style={styles.zoneId}>{zoneLabel}</Text>

        {/* Primary metric — large */}
        <View style={styles.primaryRow}>
          <Text style={styles.primaryValue}>{primary.value}</Text>
          <Text style={styles.primaryLabel}>{primary.label}</Text>
        </View>

        {/* Secondary metrics */}
        <View style={styles.secondaryRow}>
          <View style={styles.secondaryStat}>
            <Text style={styles.secondaryValue}>{insight.totalTrips}</Text>
            <Text style={styles.secondaryLabel}>trips</Text>
          </View>
          <View style={styles.secondaryStat}>
            <Text style={styles.secondaryValue}>{insight.totalOffers}</Text>
            <Text style={styles.secondaryLabel}>offers</Text>
          </View>
          <View style={styles.secondaryStat}>
            <Text style={styles.secondaryValue}>${insight.totalGross.toFixed(0)}</Text>
            <Text style={styles.secondaryLabel}>gross</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Empty state
// ---------------------------------------------------------------------------

function EmptyState({ tab }: { tab: Tab }) {
  const hint =
    tab === 'acceptance'
      ? 'Need at least 5 offers per zone to appear here.'
      : tab === 'wait'
        ? 'Need at least 3 completed trips per zone to appear here.'
        : 'Complete a shift to generate zone data.';

  return (
    <View style={styles.emptyWrap}>
      <Text style={styles.emptyTitle}>No zone data yet</Text>
      <Text style={styles.emptyHint}>{hint}</Text>
      <Text style={styles.emptyHint}>Data is generated automatically when you end a shift.</Text>
    </View>
  );
}

function ContextCards({
  context,
  zoneCount,
}: {
  context: ReferenceContextSummary | undefined;
  zoneCount: number;
}) {
  const weather = context?.weather;
  const merchant = context?.merchantDensity;
  const external = context?.externalZone;

  return (
    <View style={styles.contextSection}>
      <Text style={styles.contextTitle}>Reference context</Text>
      <Text style={styles.contextSubtitle}>
        Snapshot from {zoneCount} top zone{zoneCount === 1 ? '' : 's'}.
      </Text>

      <View style={styles.contextCard}>
        <Text style={styles.contextCardTitle}>Weather context</Text>
        {weather ? (
          <Text style={styles.contextBody}>
            {weather.weatherCondition ?? 'Condition unavailable'}
            {weather.temperatureF != null ? ` • ${weather.temperatureF.toFixed(1)}°F` : ''}
            {weather.windSpeedMph != null ? ` • ${weather.windSpeedMph.toFixed(1)} mph wind` : ''}
            {` • ${weather.activeAlerts} active alert${weather.activeAlerts === 1 ? '' : 's'}`}
          </Text>
        ) : (
          <Text style={styles.contextBodyMuted}>
            No weather reference data for these zones yet.
          </Text>
        )}
      </View>

      <View style={styles.contextCard}>
        <Text style={styles.contextCardTitle}>Merchant density</Text>
        {merchant ? (
          <Text style={styles.contextBody}>
            {merchant.merchantCount} merchant{merchant.merchantCount === 1 ? '' : 's'}
            {merchant.avgRating != null ? ` • avg rating ${merchant.avgRating.toFixed(2)}` : ''}
            {merchant.dominantPlatform ? ` • mostly ${merchant.dominantPlatform}` : ''}
          </Text>
        ) : (
          <Text style={styles.contextBodyMuted}>
            Merchant reference data is unavailable in this environment.
          </Text>
        )}
      </View>

      <View style={styles.contextCard}>
        <Text style={styles.contextCardTitle}>External zone context</Text>
        {external ? (
          <Text style={styles.contextBody}>
            {external.referenceBoundaryCount} boundary overlays
            {external.topBoundaryType ? ` • top type ${external.topBoundaryType}` : ''}
            {` • ${external.demandDriverCount} demand drivers`}
            {external.topDemandDriverType ? ` • top driver ${external.topDemandDriverType}` : ''}
          </Text>
        ) : (
          <Text style={styles.contextBodyMuted}>
            No external zone overlays found for top zones.
          </Text>
        )}
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Screen
// ---------------------------------------------------------------------------

export default function MarketScreen() {
  const [tab, setTab] = useState<Tab>('earning');
  const [windowIdx, setWin] = useState(1); // default 7d

  const hours = WINDOWS[windowIdx]!.hours;

  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['market-summary', hours],
    queryFn: () => getMarketSummary(hours, 10),
    staleTime: 1000 * 60 * 5, // 5 min — data only changes after a shift ends
  });

  const zones: ZoneInsight[] =
    tab === 'earning'
      ? (data?.topEarning ?? [])
      : tab === 'acceptance'
        ? (data?.highAcceptance ?? [])
        : (data?.fastPickup ?? []);

  const windowStart = data?.windowStart
    ? new Date(data.windowStart).toLocaleDateString([], { month: 'short', day: 'numeric' })
    : null;
  const contextZoneIds = data
    ? Array.from(
        new Set(
          [...data.topEarning, ...data.highAcceptance, ...data.fastPickup]
            .map((zone) => zone.zoneId)
            .filter(Boolean),
        ),
      ).slice(0, 5)
    : [];

  const { data: context } = useQuery({
    queryKey: ['market-reference-context', contextZoneIds],
    queryFn: () => getReferenceContextSummary(contextZoneIds),
    enabled: contextZoneIds.length > 0,
    staleTime: 1000 * 60 * 10,
  });

  return (
    <ScreenShell title="Market Intel" subtitle="Zone performance from your driving history">
      {/* Window selector */}
      <View style={styles.windowRow}>
        {WINDOWS.map((w, i) => (
          <TouchableOpacity
            key={w.label}
            style={[styles.windowBtn, i === windowIdx && styles.windowBtnActive]}
            onPress={() => setWin(i)}
          >
            <Text style={[styles.windowBtnText, i === windowIdx && styles.windowBtnTextActive]}>
              {w.label}
            </Text>
          </TouchableOpacity>
        ))}

        <TouchableOpacity
          style={styles.refreshBtn}
          onPress={() => refetch()}
          disabled={isRefetching}
        >
          {isRefetching ? (
            <ActivityIndicator size="small" color={colors.primary} />
          ) : (
            <Text style={styles.refreshText}>↻</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Summary line */}
      {data && data.totalZones > 0 && (
        <Text style={styles.summaryLine}>
          {data.totalZones} zone{data.totalZones !== 1 ? 's' : ''} with data
          {windowStart ? ` since ${windowStart}` : ''}
        </Text>
      )}

      {data && data.totalZones > 0 && (
        <ContextCards context={context} zoneCount={contextZoneIds.length} />
      )}

      {/* Tab bar */}
      <View style={styles.tabBar}>
        {TABS.map((t) => (
          <TouchableOpacity
            key={t.id}
            style={[styles.tab, tab === t.id && styles.tabActive]}
            onPress={() => setTab(t.id)}
          >
            <Text style={[styles.tabText, tab === t.id && styles.tabTextActive]}>{t.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Content */}
      {isLoading ? (
        <ActivityIndicator color={colors.primary} style={{ marginTop: spacing.xl }} />
      ) : zones.length === 0 ? (
        <EmptyState tab={tab} />
      ) : (
        <FlatList
          data={zones}
          keyExtractor={(z) => z.zoneId}
          renderItem={({ item, index }) => <ZoneCard insight={item} rank={index + 1} tab={tab} />}
          scrollEnabled={false}
          ItemSeparatorComponent={() => <View style={{ height: spacing.xs }} />}
        />
      )}
    </ScreenShell>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  // Window selector
  windowRow: {
    flexDirection: 'row',
    gap: spacing.xs,
    marginBottom: spacing.sm,
    alignItems: 'center',
  },
  windowBtn: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  windowBtnActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  windowBtnText: {
    fontSize: typography.fontSizeSm,
    color: colors.textSecondary,
    fontWeight: typography.fontWeightMedium,
  },
  windowBtnTextActive: { color: '#fff' },
  refreshBtn: {
    marginLeft: 'auto',
    padding: spacing.xs,
    width: 36,
    alignItems: 'center',
  },
  refreshText: {
    fontSize: typography.fontSizeLg,
    color: colors.primary,
  },

  // Summary line
  summaryLine: {
    fontSize: typography.fontSizeXs,
    color: colors.textMuted,
    marginBottom: spacing.sm,
  },
  contextSection: {
    marginBottom: spacing.md,
    gap: spacing.xs,
  },
  contextTitle: {
    fontSize: typography.fontSizeSm,
    fontWeight: typography.fontWeightSemibold,
    color: colors.textPrimary,
  },
  contextSubtitle: {
    fontSize: typography.fontSizeXs,
    color: colors.textMuted,
  },
  contextCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    gap: spacing.xs,
  },
  contextCardTitle: {
    fontSize: typography.fontSizeSm,
    color: colors.textSecondary,
    fontWeight: typography.fontWeightSemibold,
  },
  contextBody: {
    fontSize: typography.fontSizeSm,
    color: colors.textPrimary,
    lineHeight: 20,
  },
  contextBodyMuted: {
    fontSize: typography.fontSizeSm,
    color: colors.textMuted,
    lineHeight: 20,
  },

  // Tab bar
  tabBar: {
    flexDirection: 'row',
    backgroundColor: colors.background,
    borderRadius: radius.lg,
    padding: 3,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  tab: {
    flex: 1,
    paddingVertical: spacing.xs,
    borderRadius: radius.md,
    alignItems: 'center',
  },
  tabActive: {
    backgroundColor: colors.surface,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
    elevation: 2,
  },
  tabText: {
    fontSize: typography.fontSizeSm,
    color: colors.textSecondary,
    fontWeight: typography.fontWeightMedium,
  },
  tabTextActive: {
    color: colors.textPrimary,
    fontWeight: typography.fontWeightSemibold,
  },

  // Zone card
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  rankBadge: {
    width: 32,
    height: 32,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  rankText: {
    fontSize: typography.fontSizeXs,
    fontWeight: typography.fontWeightBold,
    color: '#fff',
  },
  zoneId: {
    fontSize: typography.fontSizeXs,
    color: colors.textMuted,
    fontFamily: 'monospace',
    marginBottom: spacing.xs,
  },
  primaryRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: spacing.xs,
    marginBottom: spacing.sm,
  },
  primaryValue: {
    fontSize: typography.fontSizeXl,
    fontWeight: typography.fontWeightBold,
    color: colors.textPrimary,
  },
  primaryLabel: {
    fontSize: typography.fontSizeSm,
    color: colors.textSecondary,
  },
  secondaryRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  secondaryStat: { alignItems: 'center' },
  secondaryValue: {
    fontSize: typography.fontSizeSm,
    fontWeight: typography.fontWeightSemibold,
    color: colors.textPrimary,
  },
  secondaryLabel: {
    fontSize: typography.fontSizeXs,
    color: colors.textMuted,
  },

  // Empty state
  emptyWrap: {
    alignItems: 'center',
    paddingVertical: spacing.xxl,
    gap: spacing.sm,
  },
  emptyTitle: {
    fontSize: typography.fontSizeLg,
    fontWeight: typography.fontWeightSemibold,
    color: colors.textSecondary,
  },
  emptyHint: {
    fontSize: typography.fontSizeSm,
    color: colors.textMuted,
    textAlign: 'center',
    paddingHorizontal: spacing.lg,
  },
});
