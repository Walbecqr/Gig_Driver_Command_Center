/**
 * Offers feature — business logic layer.
 *
 * Records incoming delivery offers (manually logged by the driver in real
 * time) into local SQLite and populates H3 zone IDs when GPS is available.
 *
 * Screen: app/offers.tsx
 * Repository: src/db/repositories/offerRepository.ts
 */

import {
  getOffersForShift,
  getOfferById,
  upsertOffer,
  updateOfferStatus,
} from '@/db/repositories/offerRepository';
import { getZoneId } from '@/utils/h3';
import { generateId } from '@/utils/id';
import type { Offer } from '@/types/entities';

export { getOffersForShift, getOfferById };

// ---------------------------------------------------------------------------
// Input types
// ---------------------------------------------------------------------------

export interface RecordOfferInput {
  shiftId: string;
  platformAccountId?: string;
  pickupZip: string;
  dropoffZip: string;
  estimatedPayout: number;
  estimatedDistanceMiles: number;
  estimatedTimeMinutes: number;
  /**
   * Driver's current GPS coordinates at the moment the offer appeared.
   * Used as a proxy for the pickup zone when the exact pickup lat/lng is
   * not available from the platform UI.
   */
  driverLat?: number;
  driverLng?: number;
  metadata?: Record<string, unknown>;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Save an incoming offer to local SQLite.
 * Computes pickupZoneId from driver GPS if coordinates are provided.
 */
export async function recordOffer(input: RecordOfferInput): Promise<Offer> {
  const pickupZoneId =
    input.driverLat != null && input.driverLng != null
      ? getZoneId(input.driverLat, input.driverLng)
      : undefined;

  const offer: Offer = {
    id: generateId(),
    shiftId: input.shiftId,
    platformAccountId: input.platformAccountId,
    createdAt: new Date().toISOString(),
    status: 'pending',
    pickupZip: input.pickupZip,
    dropoffZip: input.dropoffZip,
    estimatedPayout: input.estimatedPayout,
    estimatedDistanceMiles: input.estimatedDistanceMiles,
    estimatedTimeMinutes: input.estimatedTimeMinutes,
    metadata: input.metadata,
    pickupZoneId,
  };

  await upsertOffer(offer);
  return offer;
}

/**
 * Mark an offer as accepted, declined, or ignored.
 */
export async function respondToOffer(
  offerId: string,
  response: 'accepted' | 'declined' | 'ignored',
): Promise<void> {
  await updateOfferStatus(offerId, response);
}

/**
 * Acceptance rate for a shift: accepted / total non-pending offers.
 */
export async function getAcceptanceRate(shiftId: string): Promise<number | null> {
  const offers = await getOffersForShift(shiftId);
  const responded = offers.filter((o) => o.status !== 'pending');
  if (responded.length === 0) return null;
  const accepted = responded.filter((o) => o.status === 'accepted').length;
  return Math.round((accepted / responded.length) * 100);
}
