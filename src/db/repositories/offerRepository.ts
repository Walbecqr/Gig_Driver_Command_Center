import { querySql, runSql } from '../index';
import type { Offer } from '@/types/entities';

// Column aliases bridge SQLite snake_case → TypeScript camelCase
const SELECT_COLS = `
  id,
  shift_id              AS shiftId,
  platform_account_id   AS platformAccountId,
  created_at            AS createdAt,
  status,
  pickup_zip            AS pickupZip,
  dropoff_zip           AS dropoffZip,
  estimated_payout      AS estimatedPayout,
  estimated_distance    AS estimatedDistanceMiles,
  estimated_time        AS estimatedTimeMinutes,
  metadata,
  pickup_zone_id        AS pickupZoneId,
  dropoff_zone_id       AS dropoffZoneId
`;

export async function getOffersForShift(shiftId: string): Promise<Offer[]> {
  return querySql<Offer>(
    `SELECT ${SELECT_COLS} FROM offers WHERE shift_id = ? ORDER BY created_at DESC;`,
    [shiftId],
  );
}

export async function getOfferById(id: string): Promise<Offer | null> {
  const rows = await querySql<Offer>(`SELECT ${SELECT_COLS} FROM offers WHERE id = ?;`, [id]);
  return rows[0] ?? null;
}

export async function upsertOffer(offer: Offer): Promise<void> {
  const metadata = offer.metadata != null ? JSON.stringify(offer.metadata) : null;

  await runSql(
    `INSERT OR REPLACE INTO offers
       (id, shift_id, platform_account_id, created_at, status,
        pickup_zip, dropoff_zip, estimated_payout, estimated_distance,
        estimated_time, metadata, pickup_zone_id, dropoff_zone_id,
        updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'));`,
    [
      offer.id,
      offer.shiftId ?? null,
      offer.platformAccountId ?? null,
      offer.createdAt,
      offer.status,
      offer.pickupZip,
      offer.dropoffZip,
      offer.estimatedPayout,
      offer.estimatedDistanceMiles,
      offer.estimatedTimeMinutes,
      metadata,
      offer.pickupZoneId ?? null,
      offer.dropoffZoneId ?? null,
    ],
  );
}

export async function updateOfferStatus(id: string, status: Offer['status']): Promise<void> {
  await runSql(`UPDATE offers SET status = ?, updated_at = datetime('now') WHERE id = ?;`, [
    status,
    id,
  ]);
}
