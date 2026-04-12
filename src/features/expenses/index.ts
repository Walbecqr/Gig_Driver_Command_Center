/**
 * Expenses feature — business logic layer.
 *
 * Tracks driver out-of-pocket costs (fuel, parking, food, etc.) linked
 * optionally to a specific shift for per-shift profit calculations.
 *
 * Screen: app/expenses.tsx
 * Repository: src/db/repositories/expenseRepository.ts
 */

import {
  getExpensesForUser,
  getExpensesForShift,
  insertExpense,
  deleteExpense,
} from '@/db/repositories/expenseRepository';
import { generateId } from '@/utils/id';
import type { Expense } from '@/types/entities';

export { getExpensesForUser, getExpensesForShift, deleteExpense };

// ---------------------------------------------------------------------------
// Input types
// ---------------------------------------------------------------------------

export interface AddExpenseInput {
  userId: string;
  category: Expense['category'];
  amount: number;
  occurredAt?: string;
  linkedShiftId?: string;
  notes?: string;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/** Create and persist a new expense record. */
export async function addExpense(input: AddExpenseInput): Promise<Expense> {
  const expense: Expense = {
    id: generateId(),
    userId: input.userId,
    category: input.category,
    amount: input.amount,
    occurredAt: input.occurredAt ?? new Date().toISOString(),
    linkedShiftId: input.linkedShiftId,
    notes: input.notes,
  };
  await insertExpense(expense);
  return expense;
}

/**
 * Totals grouped by category for a user.
 * Returns a map of { category → total amount }.
 */
export async function getExpenseSummary(
  userId: string,
): Promise<Record<Expense['category'], number>> {
  const expenses = await getExpensesForUser(userId);
  const summary: Partial<Record<Expense['category'], number>> = {};

  for (const e of expenses) {
    summary[e.category] = (summary[e.category] ?? 0) + e.amount;
  }

  return summary as Record<Expense['category'], number>;
}
