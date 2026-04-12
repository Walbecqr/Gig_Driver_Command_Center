/**
 * Shifts feature — business logic layer.
 *
 * Wraps the shift repository with higher-level operations. The key addition
 * here is endShift(), which triggers zone metric aggregation for the completed
 * shift window so that zone_time_series is populated before the driver leaves
 * the app.
 *
 * Screen: app/shifts.tsx
 * Repository: src/db/repositories/shiftRepository.ts
 */

import {
  getAllShifts,
  getShiftById,
  upsertShift,
  deleteShift,
} from '@/db/repositories/shiftRepository';
import { aggregateZoneMetrics } from '@/services/analytics';
import { generateId } from '@/utils/id';
import type { Shift } from '@/types/entities';

export { getAllShifts, getShiftById, deleteShift };

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Start a new shift.
 */
export async function startShift(
  userId: string,
  startingMileage: number,
  platformAccountId?: string,
): Promise<Shift> {
  const shift: Shift = {
    id: generateId(),
    userId,
    platformAccountId,
    startTime: new Date().toISOString(),
    startingMileage,
    status: 'active',
  };
  await upsertShift(shift);
  return shift;
}

/**
 * End a shift and trigger zone metric aggregation for the shift window.
 *
 * Aggregation runs in the background (non-blocking) so the UI responds
 * immediately. Failures are logged but do not surface to the user since
 * the data can be re-aggregated later.
 */
export async function endShift(shiftId: string, endingMileage: number): Promise<void> {
  const shift = await getShiftById(shiftId);
  if (!shift) throw new Error(`Shift ${shiftId} not found`);

  const endTime = new Date().toISOString();

  await upsertShift({ ...shift, endTime, endingMileage, status: 'completed' });

  // Aggregate zone metrics for the shift window — fire and forget.
  aggregateZoneMetrics(shift.startTime, endTime).catch((err) => {
    console.warn('[shifts] zone aggregation failed after shift end:', err);
  });
}

/**
 * Pause / resume helpers (thin wrappers that keep status in sync).
 */
export async function pauseShift(shiftId: string): Promise<void> {
  const shift = await getShiftById(shiftId);
  if (!shift) return;
  await upsertShift({ ...shift, status: 'paused' });
}

export async function resumeShift(shiftId: string): Promise<void> {
  const shift = await getShiftById(shiftId);
  if (!shift) return;
  await upsertShift({ ...shift, status: 'active' });
}
