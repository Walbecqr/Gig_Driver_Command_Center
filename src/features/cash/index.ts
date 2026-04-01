/**
 * Cash feature — business logic layer.
 *
 * Tracks the driver's cash-on-hand balance via a simple ledger.
 * Deposits add to the balance, withdrawals subtract, adjustments
 * carry their own sign.
 *
 * Screen: app/cash.tsx
 * Repository: src/db/repositories/cashRepository.ts
 */

import {
  getLedgerForUser,
  insertLedgerEntry,
  deleteLedgerEntry,
} from '@/db/repositories/cashRepository';
import { generateId } from '@/utils/id';
import type { CashLedgerEntry } from '@/types/entities';

export { getLedgerForUser, deleteLedgerEntry };

// ---------------------------------------------------------------------------
// Input types
// ---------------------------------------------------------------------------

export interface AddLedgerEntryInput {
  userId: string;
  type: CashLedgerEntry['type'];
  /** Always a positive value; type determines whether it adds or subtracts. */
  amount: number;
  note?: string;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/** Append a new entry to the cash ledger. */
export async function addLedgerEntry(input: AddLedgerEntryInput): Promise<CashLedgerEntry> {
  const entry: CashLedgerEntry = {
    id: generateId(),
    userId: input.userId,
    type: input.type,
    amount: Math.abs(input.amount),
    createdAt: new Date().toISOString(),
    note: input.note,
  };
  await insertLedgerEntry(entry);
  return entry;
}

/**
 * Current cash-on-hand balance for a user.
 */
export async function getBalance(userId: string): Promise<number> {
  const entries = await getLedgerForUser(userId);
  return computeBalance(entries);
}

/**
 * Pure balance computation — exported for unit testing.
 */
export function computeBalance(entries: CashLedgerEntry[]): number {
  return entries.reduce((acc, e) => {
    if (e.type === 'deposit') return acc + e.amount;
    if (e.type === 'withdrawal') return acc - e.amount;
    return acc + e.amount; // adjustment: stored value may be negative
  }, 0);
}
