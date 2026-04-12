/**
 * Trips feature — business logic layer.
 *
 * Manages the lifecycle of a single delivery trip: start → stops → complete.
 * H3 zone IDs are computed from GPS coordinates when available, then stored
 * both on individual stops and denormalised back onto the trip row for fast
 * zone-based queries.
 *
 * Screen: app/trips.tsx
 * Repositories: src/db/repositories/tripRepository.ts
 */

import {
  getTripsForShift,
  getTripById,
  getStopsForTrip,
  insertTrip,
  updateTrip,
  insertStop,
} from '@/db/repositories/tripRepository';
import { getZoneId } from '@/utils/h3';
import { generateId } from '@/utils/id';
import type { Trip, Stop } from '@/types/entities';

export { getTripsForShift, getTripById, getStopsForTrip };

// ---------------------------------------------------------------------------
// Input types
// ---------------------------------------------------------------------------

export interface AddStopInput {
  tripId: string;
  type: Stop['type'];
  address: string;
  sequence: number;
  /** GPS coordinates for this stop location. Used to compute zone_id. */
  lat?: number;
  lng?: number;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Create a new trip record and associate it with an active shift.
 */
export async function startTrip(shiftId: string): Promise<Trip> {
  const trip: Trip = {
    id: generateId(),
    shiftId,
    startTime: new Date().toISOString(),
  };
  await insertTrip(trip);
  return trip;
}

/**
 * Add a stop to an in-progress trip.
 * Computes zone_id from lat/lng when provided.
 */
export async function addStop(input: AddStopInput): Promise<Stop> {
  const zoneId =
    input.lat != null && input.lng != null ? getZoneId(input.lat, input.lng) : undefined;

  const stop: Stop = {
    id: generateId(),
    tripId: input.tripId,
    type: input.type,
    address: input.address,
    sequence: input.sequence,
    zoneId,
  };

  await insertStop(stop);
  return stop;
}

/**
 * Mark a trip as completed.
 *
 * Derives the trip-level pickup/dropoff zone IDs from its stops (sequence 1
 * = pickup, highest sequence = dropoff) and writes them back onto the trip
 * row for efficient zone-based aggregation without JOINs.
 */
export async function completeTrip(tripId: string): Promise<void> {
  const stops = await getStopsForTrip(tripId);

  const pickupStop = stops.find((s) => s.type === 'pickup') ?? stops[0];
  const dropoffStop = stops.findLast((s) => s.type === 'dropoff') ?? stops[stops.length - 1];

  await updateTrip(tripId, {
    endTime: new Date().toISOString(),
    primaryPickupZoneId: pickupStop?.zoneId,
    primaryDropoffZoneId: dropoffStop?.zoneId,
  });
}

/**
 * Returns the currently active (not yet ended) trip for a shift, or null.
 */
export async function getActiveTrip(shiftId: string): Promise<Trip | null> {
  const trips = await getTripsForShift(shiftId);
  return trips.find((t) => t.endTime == null) ?? null;
}
