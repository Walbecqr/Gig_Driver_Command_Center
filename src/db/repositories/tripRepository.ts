import { querySql, runSql } from '../index';
import type { Trip, Stop } from '@/types/entities';

// ---------------------------------------------------------------------------
// Trips
// ---------------------------------------------------------------------------

const TRIP_COLS = `
  id,
  shift_id                  AS shiftId,
  start_time                AS startTime,
  end_time                  AS endTime,
  route_json                AS routeJson,
  primary_pickup_zone_id    AS primaryPickupZoneId,
  primary_dropoff_zone_id   AS primaryDropoffZoneId
`;

export async function getTripsForShift(shiftId: string): Promise<Trip[]> {
  return querySql<Trip>(
    `SELECT ${TRIP_COLS} FROM trips WHERE shift_id = ? ORDER BY start_time DESC;`,
    [shiftId],
  );
}

export async function getTripById(id: string): Promise<Trip | null> {
  const rows = await querySql<Trip>(
    `SELECT ${TRIP_COLS} FROM trips WHERE id = ?;`,
    [id],
  );
  return rows[0] ?? null;
}

export async function insertTrip(trip: Trip): Promise<void> {
  await runSql(
    `INSERT INTO trips
       (id, shift_id, start_time, end_time, route_json,
        primary_pickup_zone_id, primary_dropoff_zone_id, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'));`,
    [
      trip.id,
      trip.shiftId,
      trip.startTime,
      trip.endTime ?? null,
      trip.routeJson ?? null,
      trip.primaryPickupZoneId ?? null,
      trip.primaryDropoffZoneId ?? null,
    ],
  );
}

export async function updateTrip(
  id: string,
  patch: Partial<Pick<Trip, 'endTime' | 'routeJson' | 'primaryPickupZoneId' | 'primaryDropoffZoneId'>>,
): Promise<void> {
  const sets: string[] = [];
  const params: (string | null)[] = [];

  if (patch.endTime !== undefined) {
    sets.push('end_time = ?');
    params.push(patch.endTime ?? null);
  }
  if (patch.routeJson !== undefined) {
    sets.push('route_json = ?');
    params.push(patch.routeJson ?? null);
  }
  if (patch.primaryPickupZoneId !== undefined) {
    sets.push('primary_pickup_zone_id = ?');
    params.push(patch.primaryPickupZoneId ?? null);
  }
  if (patch.primaryDropoffZoneId !== undefined) {
    sets.push('primary_dropoff_zone_id = ?');
    params.push(patch.primaryDropoffZoneId ?? null);
  }

  if (sets.length === 0) return;

  sets.push("updated_at = datetime('now')");
  params.push(id);

  await runSql(
    `UPDATE trips SET ${sets.join(', ')} WHERE id = ?;`,
    params,
  );
}

// ---------------------------------------------------------------------------
// Stops
// ---------------------------------------------------------------------------

const STOP_COLS = `
  id,
  trip_id   AS tripId,
  stop_type AS type,
  address,
  sequence,
  zone_id   AS zoneId
`;

export async function getStopsForTrip(tripId: string): Promise<Stop[]> {
  return querySql<Stop>(
    `SELECT ${STOP_COLS} FROM stops WHERE trip_id = ? ORDER BY sequence ASC;`,
    [tripId],
  );
}

export async function insertStop(stop: Stop): Promise<void> {
  await runSql(
    `INSERT INTO stops (id, trip_id, stop_type, address, sequence, zone_id, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, datetime('now'));`,
    [
      stop.id,
      stop.tripId,
      stop.type,
      stop.address,
      stop.sequence,
      stop.zoneId ?? null,
    ],
  );
}
