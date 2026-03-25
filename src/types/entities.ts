export type UUID = string;

export interface User {
  id: UUID;
  name: string;
  email: string;
  preferredCurrency: string;
  createdAt: string;
}

export interface DeliveryPlatformAccount {
  id: UUID;
  userId: UUID;
  platform: 'doordash' | 'ubereats' | 'grubhub' | 'other';
  accountName: string;
  manualMode: boolean;
  createdAt: string;
}

export interface Shift {
  id: UUID;
  userId: UUID;
  platformAccountId?: UUID;
  startTime: string;
  endTime?: string;
  startingMileage: number;
  endingMileage?: number;
  status: 'active' | 'paused' | 'completed';
  notes?: string;
}

export interface Offer {
  id: UUID;
  shiftId?: UUID;
  platformAccountId?: UUID;
  createdAt: string;
  status: 'pending' | 'accepted' | 'declined' | 'ignored';
  pickupZip: string;
  dropoffZip: string;
  estimatedPayout: number;
  estimatedDistanceMiles: number;
  estimatedTimeMinutes: number;
  metadata?: Record<string, unknown>;
}

export interface Trip {
  id: UUID;
  shiftId: UUID;
  startTime: string;
  endTime?: string;
  routeJson?: string;
}

export interface Delivery {
  id: UUID;
  tripId: UUID;
  offerId?: UUID;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  items: number;
  netProfit?: number;
}

export interface Stop {
  id: UUID;
  tripId: UUID;
  type: 'pickup' | 'dropoff' | 'waypoint';
  address: string;
  sequence: number;
}

export interface Expense {
  id: UUID;
  userId: UUID;
  linkedShiftId?: UUID;
  category: 'fuel' | 'taxi' | 'parking' | 'food' | 'vehicle' | 'other';
  amount: number;
  occurredAt: string;
  notes?: string;
}

export interface CashLedgerEntry {
  id: UUID;
  userId: UUID;
  amount: number;
  type: 'deposit' | 'withdrawal' | 'adjustment';
  createdAt: string;
  note?: string;
}

export interface Incident {
  id: UUID;
  userId: UUID;
  createdAt: string;
  type: 'accident' | 'customer_issue' | 'platform_issue' | 'other';
  description: string;
}

export interface SyncQueueItem {
  id: UUID;
  tableName: string;
  rowId: UUID;
  action: 'insert' | 'update' | 'delete';
  payload: Record<string, unknown>;
  createdAt: string;
}
