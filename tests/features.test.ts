import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Offer, CashLedgerEntry, Expense } from '@/types/entities';

// ---------------------------------------------------------------------------
// Mock repositories so feature modules don't need a live SQLite database.
// ---------------------------------------------------------------------------

vi.mock('@/db/repositories/offerRepository', () => ({
  getOffersForShift: vi.fn(),
  getOfferById: vi.fn(),
  upsertOffer: vi.fn(),
  updateOfferStatus: vi.fn(),
}));

vi.mock('@/db/repositories/cashRepository', () => ({
  getLedgerForUser: vi.fn(),
  insertLedgerEntry: vi.fn(),
  deleteLedgerEntry: vi.fn(),
}));

vi.mock('@/db/repositories/expenseRepository', () => ({
  getExpensesForUser: vi.fn(),
  getExpensesForShift: vi.fn(),
  insertExpense: vi.fn(),
  deleteExpense: vi.fn(),
}));

vi.mock('@/db/repositories/incidentRepository', () => ({
  getIncidentsForUser: vi.fn(),
  insertIncident: vi.fn(),
  deleteIncident: vi.fn(),
}));

vi.mock('@/db/repositories/shiftRepository', () => ({
  getAllShifts: vi.fn(),
  getShiftById: vi.fn(),
  upsertShift: vi.fn(),
  deleteShift: vi.fn(),
}));

// Mock analytics so endShift doesn't blow up in tests
vi.mock('@/services/analytics', () => ({
  aggregateZoneMetrics: vi.fn().mockResolvedValue(undefined),
  logEvent: vi.fn(),
}));

// Mock crash service
vi.mock('@/services/crash', () => ({
  captureException: vi.fn(),
}));

import * as offerRepo from '@/db/repositories/offerRepository';
import * as expenseRepo from '@/db/repositories/expenseRepository';
import { getAcceptanceRate } from '@/features/offers';
import { computeBalance, addLedgerEntry } from '@/features/cash';
import { getExpenseSummary } from '@/features/expenses';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeOffer(overrides: Partial<Offer> = {}): Offer {
  return {
    id: 'o1',
    shiftId: 'shift-1',
    createdAt: new Date().toISOString(),
    status: 'pending',
    pickupZip: '90001',
    dropoffZip: '90002',
    estimatedPayout: 8.5,
    estimatedDistanceMiles: 3.2,
    estimatedTimeMinutes: 15,
    ...overrides,
  };
}

function makeLedgerEntry(
  type: CashLedgerEntry['type'],
  amount: number,
  overrides: Partial<CashLedgerEntry> = {},
): CashLedgerEntry {
  return {
    id: `entry-${Math.random()}`,
    userId: 'user-1',
    type,
    amount,
    createdAt: new Date().toISOString(),
    ...overrides,
  };
}

function makeExpense(
  category: Expense['category'],
  amount: number,
  overrides: Partial<Expense> = {},
): Expense {
  return {
    id: `exp-${Math.random()}`,
    userId: 'user-1',
    category,
    amount,
    occurredAt: new Date().toISOString(),
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// offers / getAcceptanceRate
// ---------------------------------------------------------------------------

describe('getAcceptanceRate', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns null when shift has no offers', async () => {
    vi.mocked(offerRepo.getOffersForShift).mockResolvedValue([]);
    expect(await getAcceptanceRate('shift-1')).toBeNull();
  });

  it('returns null when all offers are still pending', async () => {
    vi.mocked(offerRepo.getOffersForShift).mockResolvedValue([
      makeOffer({ status: 'pending' }),
      makeOffer({ id: 'o2', status: 'pending' }),
    ]);
    expect(await getAcceptanceRate('shift-1')).toBeNull();
  });

  it('calculates 100% when all responded offers are accepted', async () => {
    vi.mocked(offerRepo.getOffersForShift).mockResolvedValue([
      makeOffer({ status: 'accepted' }),
      makeOffer({ id: 'o2', status: 'accepted' }),
    ]);
    expect(await getAcceptanceRate('shift-1')).toBe(100);
  });

  it('calculates 50% when half of responded offers are accepted', async () => {
    vi.mocked(offerRepo.getOffersForShift).mockResolvedValue([
      makeOffer({ status: 'accepted' }),
      makeOffer({ id: 'o2', status: 'declined' }),
    ]);
    expect(await getAcceptanceRate('shift-1')).toBe(50);
  });

  it('ignores still-pending offers in the denominator', async () => {
    vi.mocked(offerRepo.getOffersForShift).mockResolvedValue([
      makeOffer({ status: 'accepted' }),
      makeOffer({ id: 'o2', status: 'declined' }),
      makeOffer({ id: 'o3', status: 'pending' }),
    ]);
    // 1 accepted / 2 responded = 50%
    expect(await getAcceptanceRate('shift-1')).toBe(50);
  });

  it('rounds to nearest integer', async () => {
    vi.mocked(offerRepo.getOffersForShift).mockResolvedValue([
      makeOffer({ status: 'accepted' }),
      makeOffer({ id: 'o2', status: 'declined' }),
      makeOffer({ id: 'o3', status: 'declined' }),
    ]);
    // 1/3 = 33.33… → rounds to 33
    expect(await getAcceptanceRate('shift-1')).toBe(33);
  });
});

// ---------------------------------------------------------------------------
// cash / computeBalance
// ---------------------------------------------------------------------------

describe('computeBalance', () => {
  it('returns 0 for empty ledger', () => {
    expect(computeBalance([])).toBe(0);
  });

  it('adds deposits', () => {
    expect(computeBalance([makeLedgerEntry('deposit', 50)])).toBe(50);
  });

  it('subtracts withdrawals', () => {
    expect(computeBalance([makeLedgerEntry('withdrawal', 20)])).toBe(-20);
  });

  it('adds adjustment values (can be negative)', () => {
    expect(computeBalance([makeLedgerEntry('adjustment', 5)])).toBe(5);
  });

  it('computes net balance across mixed entries', () => {
    const entries = [
      makeLedgerEntry('deposit', 100),
      makeLedgerEntry('withdrawal', 30),
      makeLedgerEntry('deposit', 50),
      makeLedgerEntry('adjustment', -10),
    ];
    // 100 - 30 + 50 - 10 = 110
    expect(computeBalance(entries)).toBe(110);
  });

  it('handles withdrawal larger than deposits (negative balance)', () => {
    const entries = [
      makeLedgerEntry('deposit', 20),
      makeLedgerEntry('withdrawal', 50),
    ];
    expect(computeBalance(entries)).toBe(-30);
  });
});

// ---------------------------------------------------------------------------
// cash / addLedgerEntry
// ---------------------------------------------------------------------------

describe('addLedgerEntry', () => {
  beforeEach(() => vi.clearAllMocks());

  it('normalises deposit/withdrawal amounts to positive', async () => {
    const { insertLedgerEntry } = await import('@/db/repositories/cashRepository');
    vi.mocked(insertLedgerEntry).mockResolvedValue(undefined);

    const result = await addLedgerEntry({ userId: 'u1', type: 'withdrawal', amount: -25 });

    expect(result.amount).toBe(25);
    expect(result.type).toBe('withdrawal');
    expect(result.userId).toBe('u1');
  });

  it('preserves negative sign for adjustment entries', async () => {
    const { insertLedgerEntry } = await import('@/db/repositories/cashRepository');
    vi.mocked(insertLedgerEntry).mockResolvedValue(undefined);

    const result = await addLedgerEntry({ userId: 'u1', type: 'adjustment', amount: -10 });

    expect(result.amount).toBe(-10);
  });

  it('preserves positive sign for adjustment entries', async () => {
    const { insertLedgerEntry } = await import('@/db/repositories/cashRepository');
    vi.mocked(insertLedgerEntry).mockResolvedValue(undefined);

    const result = await addLedgerEntry({ userId: 'u1', type: 'adjustment', amount: 15 });

    expect(result.amount).toBe(15);
  });
});

// ---------------------------------------------------------------------------
// expenses / getExpenseSummary
// ---------------------------------------------------------------------------

describe('getExpenseSummary', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns empty summary for user with no expenses', async () => {
    vi.mocked(expenseRepo.getExpensesForUser).mockResolvedValue([]);
    const summary = await getExpenseSummary('user-1');
    expect(Object.keys(summary)).toHaveLength(0);
  });

  it('totals amounts by category', async () => {
    vi.mocked(expenseRepo.getExpensesForUser).mockResolvedValue([
      makeExpense('fuel', 40),
      makeExpense('fuel', 30),
      makeExpense('parking', 10),
    ]);
    const summary = await getExpenseSummary('user-1');
    expect(summary.fuel).toBe(70);
    expect(summary.parking).toBe(10);
  });

  it('handles a single category with a single entry', async () => {
    vi.mocked(expenseRepo.getExpensesForUser).mockResolvedValue([
      makeExpense('vehicle', 150),
    ]);
    const summary = await getExpenseSummary('user-1');
    expect(summary.vehicle).toBe(150);
  });
});
