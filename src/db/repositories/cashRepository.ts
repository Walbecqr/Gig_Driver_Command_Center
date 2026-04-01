import { querySql, runSql } from '../index';
import type { CashLedgerEntry } from '@/types/entities';

const SELECT_COLS = `
  id,
  user_id    AS userId,
  amount,
  entry_type AS type,
  created_at AS createdAt,
  note
`;

export async function getLedgerForUser(userId: string): Promise<CashLedgerEntry[]> {
  return querySql<CashLedgerEntry>(
    `SELECT ${SELECT_COLS} FROM cash_ledger_entries WHERE user_id = ? ORDER BY created_at DESC;`,
    [userId],
  );
}

export async function insertLedgerEntry(entry: CashLedgerEntry): Promise<void> {
  await runSql(
    `INSERT INTO cash_ledger_entries
       (id, user_id, amount, entry_type, created_at, note, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, datetime('now'));`,
    [
      entry.id,
      entry.userId,
      entry.amount,
      entry.type,
      entry.createdAt,
      entry.note ?? null,
    ],
  );
}

export async function deleteLedgerEntry(id: string): Promise<void> {
  await runSql('DELETE FROM cash_ledger_entries WHERE id = ?;', [id]);
}
