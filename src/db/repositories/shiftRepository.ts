import { querySql, runSql } from '../index';
import type { Shift } from '@/types/entities';

export async function getAllShifts(): Promise<Shift[]> {
  return querySql<Shift>('SELECT * FROM shifts ORDER BY start_time DESC;');
}

export async function getShiftById(id: string): Promise<Shift | null> {
  const rows = await querySql<Shift>('SELECT * FROM shifts WHERE id = ?;', [id]);
  return rows[0] ?? null;
}

export async function upsertShift(shift: Shift): Promise<void> {
  await runSql(
    `INSERT OR REPLACE INTO shifts
       (id, user_id, platform_account_id, start_time, end_time,
        starting_mileage, ending_mileage, status, notes, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'));`,
    [
      shift.id,
      shift.userId,
      shift.platformAccountId ?? null,
      shift.startTime,
      shift.endTime ?? null,
      shift.startingMileage,
      shift.endingMileage ?? null,
      shift.status,
      shift.notes ?? null,
    ],
  );
}

export async function deleteShift(id: string): Promise<void> {
  await runSql('DELETE FROM shifts WHERE id = ?;', [id]);
}
