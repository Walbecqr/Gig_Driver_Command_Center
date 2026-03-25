import * as SQLite from 'expo-sqlite';
import { executeSql } from './sqlite';

const DB_NAME = 'gigdcs.db';

export type Migration = { version: string; sql: string };

const migrations: Migration[] = [
  {
    version: '001',
    sql: `
      CREATE TABLE IF NOT EXISTS migrations (version TEXT PRIMARY KEY, applied_at TEXT NOT NULL);

      CREATE TABLE IF NOT EXISTS shifts (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        platform_account_id TEXT,
        start_time TEXT NOT NULL,
        end_time TEXT,
        starting_mileage REAL NOT NULL DEFAULT 0,
        ending_mileage REAL,
        status TEXT NOT NULL,
        notes TEXT,
        updated_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS offers (
        id TEXT PRIMARY KEY,
        shift_id TEXT,
        platform_account_id TEXT,
        created_at TEXT NOT NULL,
        status TEXT NOT NULL,
        pickup_zip TEXT,
        dropoff_zip TEXT,
        estimated_payout REAL,
        estimated_distance REAL,
        estimated_time INTEGER,
        metadata TEXT,
        updated_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS trips (
        id TEXT PRIMARY KEY,
        shift_id TEXT NOT NULL,
        start_time TEXT NOT NULL,
        end_time TEXT,
        route_json TEXT,
        updated_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS deliveries (
        id TEXT PRIMARY KEY,
        trip_id TEXT NOT NULL,
        offer_id TEXT,
        status TEXT NOT NULL,
        items INTEGER NOT NULL DEFAULT 0,
        net_profit REAL,
        updated_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS stops (
        id TEXT PRIMARY KEY,
        trip_id TEXT NOT NULL,
        stop_type TEXT NOT NULL,
        address TEXT NOT NULL,
        sequence INTEGER NOT NULL,
        updated_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS expenses (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        linked_shift_id TEXT,
        category TEXT NOT NULL,
        amount REAL NOT NULL,
        occurred_at TEXT NOT NULL,
        notes TEXT,
        updated_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS cash_ledger_entries (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        amount REAL NOT NULL,
        entry_type TEXT NOT NULL,
        created_at TEXT NOT NULL,
        note TEXT,
        updated_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS incidents (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        created_at TEXT NOT NULL,
        incident_type TEXT NOT NULL,
        description TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS sync_queue (
        id TEXT PRIMARY KEY,
        table_name TEXT NOT NULL,
        row_id TEXT NOT NULL,
        action TEXT NOT NULL,
        payload TEXT NOT NULL,
        created_at TEXT NOT NULL,
        processed_at TEXT
      );
    `
  }
];

export const db = SQLite.openDatabase(DB_NAME);

export async function initLocalDatabase(): Promise<void> {
  try {
    await executeSql(db, 'PRAGMA journal_mode=WAL;');
    await executeSql(db, 'PRAGMA foreign_keys=ON;');

    const migration = migrations[0];

    await executeSql(db, migration.sql);
    await executeSql(
      db,
      `INSERT OR IGNORE INTO migrations (version, applied_at) VALUES (?, datetime('now'));`,
      [migration.version],
    );
  } catch (error) {
    console.error('[db] initialization error', error);
    throw error;
  }
}
