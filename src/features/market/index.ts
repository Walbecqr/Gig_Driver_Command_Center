/**
 * Market feature — zone intelligence business logic.
 *
 * Queries the local zone_time_series SQLite table to produce ranked lists
 * of H3 zones by various driver-relevant metrics. Called by app/market.tsx.
 *
 * Data is populated by aggregateZoneMetrics() at the end of each shift.
 */

import { querySql } from '@/db';
import { getNeighborZones } from '@/utils/h3';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ZoneInsight {
  zoneId: string;
  totalOffers: number;
  totalTrips: number;
  totalGross: number;
  /** Average earnings per completed trip. Null if no trips. */
  avgEarningsPerTrip: number | null;
  /** Acceptance rate 0–100. Null if no offers. */
  acceptanceRate: number | null;
  /** Average wait time in minutes. Null if not recorded. */
  avgWaitMinutes: number | null;
}

export interface MarketSummary {
  topEarning: ZoneInsight[];
  highAcceptance: ZoneInsight[];
  fastPickup: ZoneInsight[];
  windowStart: string | null;
  totalZones: number;
}

interface ZoneAggregateRow {
  zone_id: string;
  total_offers: number | string | null;
  total_accepted: number | string | null;
  total_trips: number | string | null;
  total_gross: number | string | null;
  avg_wait: number | string | null;
  window_start?: string;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Load zone intelligence for a rolling time window from local SQLite.
 *
 * @param hoursBack  Hours of history to include. Default 168 (7 days).
 * @param topN       Zones to return per category. Default 5.
 */
export async function getMarketSummary(hoursBack = 168, topN = 5): Promise<MarketSummary> {
  const cutoff = new Date(Date.now() - hoursBack * 60 * 60_000).toISOString();

  const rows = await querySql<ZoneAggregateRow>(
    `SELECT
       zone_id,
       SUM(offers_seen_count)      AS total_offers,
       SUM(offers_accepted_count)  AS total_accepted,
       SUM(trips_completed_count)  AS total_trips,
       SUM(gross_amount_sum)       AS total_gross,
       AVG(avg_wait_minutes)       AS avg_wait,
       MIN(bucket_start_local)     AS window_start
     FROM zone_time_series
     WHERE bucket_start_local >= ?
     GROUP BY zone_id
     HAVING SUM(offers_seen_count) > 0 OR SUM(trips_completed_count) > 0`,
    [cutoff],
  );

  if (rows.length === 0) {
    return { topEarning: [], highAcceptance: [], fastPickup: [], windowStart: null, totalZones: 0 };
  }

  const insights: ZoneInsight[] = rows.map((r) => {
    const totalOffers = toFiniteNumber(r.total_offers) ?? 0;
    const totalAccepted = toFiniteNumber(r.total_accepted) ?? 0;
    const totalTrips = toFiniteNumber(r.total_trips) ?? 0;
    const totalGross = toFiniteNumber(r.total_gross) ?? 0;
    const avgWait = toFiniteNumber(r.avg_wait);

    return {
      zoneId: r.zone_id,
      totalOffers,
      totalTrips,
      totalGross,
      avgEarningsPerTrip:
        totalTrips > 0 ? Math.round((totalGross / totalTrips) * 100) / 100 : null,
      acceptanceRate:
        totalOffers > 0 ? Math.round((totalAccepted / totalOffers) * 100) : null,
      avgWaitMinutes: avgWait != null ? Math.round(avgWait * 10) / 10 : null,
    };
  });

  return {
    windowStart: rows[0]?.window_start ?? null,
    totalZones: insights.length,
    topEarning: [...insights].sort((a, b) => b.totalGross - a.totalGross).slice(0, topN),
    highAcceptance: [...insights]
      .filter((z) => z.totalOffers >= 5 && z.acceptanceRate != null)
      .sort((a, b) => (b.acceptanceRate ?? 0) - (a.acceptanceRate ?? 0))
      .slice(0, topN),
    fastPickup: [...insights]
      .filter((z) => z.totalTrips >= 3 && z.avgWaitMinutes != null)
      .sort((a, b) => (a.avgWaitMinutes ?? 999) - (b.avgWaitMinutes ?? 999))
      .slice(0, topN),
  };
}

/**
 * Zone insights for a specific H3 cell and its k-ring neighbours.
 * Used for "what's hot near me" when the driver's GPS location is known.
 */
export async function getNearbyZoneInsights(
  zoneId: string,
  k = 1,
  hoursBack = 48,
): Promise<ZoneInsight[]> {
  const nearby = getNeighborZones(zoneId, k);
  if (nearby.length === 0) return [];

  const cutoff = new Date(Date.now() - hoursBack * 60 * 60_000).toISOString();
  const placeholders = nearby.map(() => '?').join(', ');

  const rows = await querySql<ZoneAggregateRow>(
    `SELECT
       zone_id,
       SUM(offers_seen_count)      AS total_offers,
       SUM(offers_accepted_count)  AS total_accepted,
       SUM(trips_completed_count)  AS total_trips,
       SUM(gross_amount_sum)       AS total_gross,
       AVG(avg_wait_minutes)       AS avg_wait
     FROM zone_time_series
     WHERE zone_id IN (${placeholders})
       AND bucket_start_local >= ?
     GROUP BY zone_id`,
    [...nearby, cutoff],
  );

  return rows.map((r) => {
    const totalOffers = toFiniteNumber(r.total_offers) ?? 0;
    const totalAccepted = toFiniteNumber(r.total_accepted) ?? 0;
    const totalTrips = toFiniteNumber(r.total_trips) ?? 0;
    const totalGross = toFiniteNumber(r.total_gross) ?? 0;
    const avgWait = toFiniteNumber(r.avg_wait);

    return {
      zoneId: r.zone_id,
      totalOffers,
      totalTrips,
      totalGross,
      avgEarningsPerTrip:
        totalTrips > 0 ? Math.round((totalGross / totalTrips) * 100) / 100 : null,
      acceptanceRate:
        totalOffers > 0 ? Math.round((totalAccepted / totalOffers) * 100) : null,
      avgWaitMinutes: avgWait != null ? Math.round(avgWait * 10) / 10 : null,
    };
  });
}

function toFiniteNumber(value: number | string | null | undefined): number | null {
  if (typeof value === 'number') return Number.isFinite(value) ? value : null;
  if (typeof value === 'string') {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

export * from './referenceContext';
