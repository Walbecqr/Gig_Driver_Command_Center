import { db } from '../index';
import { executeSql } from '../sqlite';
import { Shift } from '@/types/entities';

export async function getAllShifts(): Promise<Shift[]> {
  const result = await executeSql(db, 'SELECT * FROM shifts ORDER BY start_time DESC;');
  const rows = result.rows;
  const items: Shift[] = [];
  for (let i = 0; i < rows.length; i += 1) {
    items.push(rows.item(i));
  }
  return items;
}

export async function upsertShift(shift: Shift): Promise<void> {
  await executeSql(
    db,
    `INSERT OR REPLACE INTO shifts (id, user_id, platform_account_id, start_time, end_time, starting_mileage, ending_mileage, status, notes, updated_at)
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
      shift.notes ?? null
    ]
  );
}
