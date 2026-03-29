import { querySql, runSql } from '@/db';
import type { ZoneTimeSeries } from '@/types/entities';

export function logEvent(eventName: string, payload?: Record<string, unknown>): void {
  console.debug('[analytics] event:', eventName, payload);
  // TODO: wire to a real provider (e.g., Segment, Firebase, Amplitude)
}

/**
 * Aggregate offer and trip data from local SQLite into the zone_time_series
 * table for the given time window.
 *
 * Groups by H3 zone_id + truncated bucket_start_local (default grain: 'hour').
 * Upserts rows so repeated calls over the same window are idempotent.
 *
 * @param startTime  ISO-8601 local datetime string, inclusive
 * @param endTime    ISO-8601 local datetime string, exclusive
 * @param grain      Aggregation grain — 'hour' | 'day' | 'week' (default 'hour')
 */
export async function aggregateZoneMetrics(
  startTime: string,
  endTime: string,
  grain: ZoneTimeSeries['bucketGrain'] = 'hour',
): Promise<void> {
  // --- 1. Aggregate offer counts by zone ---
  const offerRows = await querySql<{
    zone_id: string;
    bucket: string;
    seen: number;
    accepted: number;
  }>(
    `
    SELECT
      pickup_zone_id          AS zone_id,
      strftime(?, created_at) AS bucket,
      COUNT(*)                AS seen,
      SUM(CASE WHEN status = 'accepted' THEN 1 ELSE 0 END) AS accepted
    FROM offers
    WHERE pickup_zone_id IS NOT NULL
      AND created_at >= ?
      AND created_at <  ?
    GROUP BY pickup_zone_id, bucket
    `,
    [grainFormat(grain), startTime, endTime],
  );

  // --- 2. Aggregate trip counts + gross earnings by primary pickup zone ---
  const tripRows = await querySql<{
    zone_id: string;
    bucket: string;
    completed: number;
    gross_sum: number;
  }>(
    `
    SELECT
      primary_pickup_zone_id  AS zone_id,
      strftime(?, start_time) AS bucket,
      COUNT(*)                AS completed,
      COALESCE(SUM(d.net_profit), 0) AS gross_sum
    FROM trips t
    LEFT JOIN deliveries d ON d.trip_id = t.id
    WHERE t.primary_pickup_zone_id IS NOT NULL
      AND t.start_time >= ?
      AND t.start_time <  ?
    GROUP BY t.primary_pickup_zone_id, bucket
    `,
    [grainFormat(grain), startTime, endTime],
  );

  // --- 3. Build a merged map keyed by (zone_id, bucket) ---
  type BucketKey = string;
  const merged = new Map<
    BucketKey,
    {
      zone_id: string;
      bucket: string;
      offers_seen: number;
      offers_accepted: number;
      trips_completed: number;
      gross_sum: number;
    }
  >();

  for (const row of offerRows) {
    const key = `${row.zone_id}|${row.bucket}`;
    merged.set(key, {
      zone_id: row.zone_id,
      bucket: row.bucket,
      offers_seen: row.seen,
      offers_accepted: row.accepted,
      trips_completed: 0,
      gross_sum: 0,
    });
  }

  for (const row of tripRows) {
    const key = `${row.zone_id}|${row.bucket}`;
    const existing = merged.get(key);
    if (existing) {
      existing.trips_completed = row.completed;
      existing.gross_sum = row.gross_sum;
    } else {
      merged.set(key, {
        zone_id: row.zone_id,
        bucket: row.bucket,
        offers_seen: 0,
        offers_accepted: 0,
        trips_completed: row.completed,
        gross_sum: row.gross_sum,
      });
    }
  }

  // --- 4. Upsert each aggregated row into zone_time_series ---
  const now = new Date().toISOString();
  for (const entry of merged.values()) {
    await runSql(
      `
      INSERT INTO zone_time_series
        (zone_id, bucket_start_local, bucket_grain,
         offers_seen_count, offers_accepted_count,
         trips_completed_count, gross_amount_sum, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT (zone_id, bucket_start_local) DO UPDATE SET
        bucket_grain           = excluded.bucket_grain,
        offers_seen_count      = excluded.offers_seen_count,
        offers_accepted_count  = excluded.offers_accepted_count,
        trips_completed_count  = excluded.trips_completed_count,
        gross_amount_sum       = excluded.gross_amount_sum,
        updated_at             = excluded.updated_at
      `,
      [
        entry.zone_id,
        entry.bucket,
        grain,
        entry.offers_seen,
        entry.offers_accepted,
        entry.trips_completed,
        entry.gross_sum,
        now,
      ],
    );
  }
}

/** Map grain label to SQLite strftime format string. */
function grainFormat(grain: ZoneTimeSeries['bucketGrain']): string {
  switch (grain) {
    case 'hour':
      return '%Y-%m-%dT%H:00:00';
    case 'day':
      return '%Y-%m-%dT00:00:00';
    case 'week':
      // SQLite week: truncate to Monday via 'weekday 1' isn't available in
      // strftime directly — use day grain as fallback and let callers group.
      return '%Y-%m-%dT00:00:00';
  }
}
