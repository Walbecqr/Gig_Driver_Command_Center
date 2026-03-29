/**
 * Local SQLite database — offline-first source of truth for in-progress
 * shift and field-operations data.
 *
 * Uses expo-sqlite v13 async API (Expo SDK 50).
 * Migration versioning is handled via the `migrations` table.
 */

import { execSql, runSql, querySql } from './sqlite';

const MIGRATIONS: Array<{ version: string; sql: string }> = [
  {
    version: '001',
    sql: `
      CREATE TABLE IF NOT EXISTS migrations (
        version TEXT PRIMARY KEY,
        applied_at TEXT NOT NULL
      );

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
    `,
  },
  {
    // H3 zone fields on existing tables + zone_time_series aggregation table.
    // SQLite does not support adding multiple columns in one ALTER TABLE
    // statement, so each column is its own statement.
    version: '002',
    sql: `
      ALTER TABLE offers ADD COLUMN pickup_zone_id TEXT;
      ALTER TABLE offers ADD COLUMN dropoff_zone_id TEXT;

      ALTER TABLE trips ADD COLUMN primary_pickup_zone_id TEXT;
      ALTER TABLE trips ADD COLUMN primary_dropoff_zone_id TEXT;

      ALTER TABLE stops ADD COLUMN zone_id TEXT;

      CREATE TABLE IF NOT EXISTS zone_time_series (
        zone_id            TEXT    NOT NULL,
        bucket_start_local TEXT    NOT NULL,
        bucket_grain       TEXT    NOT NULL DEFAULT 'hour',
        offers_seen_count  INTEGER NOT NULL DEFAULT 0,
        offers_accepted_count INTEGER NOT NULL DEFAULT 0,
        trips_completed_count INTEGER NOT NULL DEFAULT 0,
        gross_amount_sum   REAL    NOT NULL DEFAULT 0,
        avg_wait_minutes   REAL,
        updated_at         TEXT    NOT NULL,
        PRIMARY KEY (zone_id, bucket_start_local)
      );

      CREATE INDEX IF NOT EXISTS idx_zone_ts_bucket
        ON zone_time_series (bucket_start_local, zone_id);
    `,
  },
];

export async function initLocalDatabase(): Promise<void> {
  await execSql('PRAGMA journal_mode = WAL;');
  await execSql('PRAGMA foreign_keys = ON;');

  for (const migration of MIGRATIONS) {
    const existing = await querySql<{ version: string }>(
      'SELECT version FROM migrations WHERE version = ?;',
      [migration.version],
    );
    if (existing.length > 0) continue;

    const statements = migration.sql.split(';').filter((s) => s.trim());
    for (const statement of statements) {
      await execSql(statement + ';');
    }
    await runSql(`INSERT INTO migrations (version, applied_at) VALUES (?, datetime('now'));`, [
      migration.version,
    ]);
  }
}

// Re-export helpers so repositories import from a single place
export { execSql, runSql, querySql, queryOneSql, getDb } from './sqlite';
