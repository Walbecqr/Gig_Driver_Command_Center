import { querySql, runSql } from '../index';
import type { Expense } from '@/types/entities';

const SELECT_COLS = `
  id,
  user_id         AS userId,
  linked_shift_id AS linkedShiftId,
  category,
  amount,
  occurred_at     AS occurredAt,
  notes
`;

export async function getExpensesForUser(userId: string): Promise<Expense[]> {
  return querySql<Expense>(
    `SELECT ${SELECT_COLS} FROM expenses WHERE user_id = ? ORDER BY occurred_at DESC;`,
    [userId],
  );
}

export async function getExpensesForShift(shiftId: string): Promise<Expense[]> {
  return querySql<Expense>(
    `SELECT ${SELECT_COLS} FROM expenses WHERE linked_shift_id = ? ORDER BY occurred_at DESC;`,
    [shiftId],
  );
}

export async function insertExpense(expense: Expense): Promise<void> {
  await runSql(
    `INSERT INTO expenses
       (id, user_id, linked_shift_id, category, amount, occurred_at, notes, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'));`,
    [
      expense.id,
      expense.userId,
      expense.linkedShiftId ?? null,
      expense.category,
      expense.amount,
      expense.occurredAt,
      expense.notes ?? null,
    ],
  );
}

export async function deleteExpense(id: string): Promise<void> {
  await runSql('DELETE FROM expenses WHERE id = ?;', [id]);
}
