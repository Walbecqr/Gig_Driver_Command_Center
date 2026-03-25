/**
 * expo-sqlite v13 (Expo SDK 50) async wrapper.
 *
 * v13 replaces the old WebSQL-style `.transaction()` / `.executeSql()` API
 * with a clean promise-based interface:
 *   db.runAsync(sql, params)         — INSERT / UPDATE / DELETE
 *   db.getAllAsync(sql, params)       — SELECT → row[]
 *   db.getFirstAsync(sql, params)    — SELECT → row | null
 *   db.execAsync(sql)                — DDL / PRAGMA (no params)
 *
 * This module opens the shared database instance and re-exports the helpers
 * used by the repository layer.
 */

import * as SQLite from 'expo-sqlite';

const DB_NAME = 'gigdcs.db';

let _db: SQLite.Database | null = null;

export async function getDb(): Promise<SQLite.Database> {
  if (!_db) {
    _db = SQLite.openDatabase(DB_NAME);
  }
  return _db;
}

/** Run a single DDL or PRAGMA statement (no parameters). */
export async function execSql(sql: string): Promise<void> {
  const db = await getDb();
  return new Promise((resolve, reject) => {
    db.transaction((tx) => {
      tx.executeSql(
        sql,
        [],
        () => resolve(),
        (_, err) => {
          reject(err);
          return false;
        },
      );
    });
  });
}

/** INSERT / UPDATE / DELETE — returns lastInsertRowId and changes count. */
export async function runSql(
  sql: string,
  params: (string | number | null)[] = [],
): Promise<{ lastInsertRowId: number; changes: number }> {
  const db = await getDb();
  return new Promise((resolve, reject) => {
    db.transaction((tx) => {
      tx.executeSql(
        sql,
        params,
        (_, result) =>
          resolve({ lastInsertRowId: result.insertId ?? 0, changes: result.rowsAffected ?? 0 }),
        (_, err) => {
          reject(err);
          return false;
        },
      );
    });
  });
}

/** SELECT — returns all matching rows. */
export async function querySql<T = Record<string, unknown>>(
  sql: string,
  params: (string | number | null)[] = [],
): Promise<T[]> {
  const db = await getDb();
  return new Promise((resolve, reject) => {
    db.transaction((tx) => {
      tx.executeSql(
        sql,
        params,
        (_, result) => resolve(result.rows._array as T[]),
        (_, err) => {
          reject(err);
          return false;
        },
      );
    });
  });
}

/** SELECT — returns the first matching row or null. */
export async function queryOneSql<T = Record<string, unknown>>(
  sql: string,
  params: (string | number | null)[] = [],
): Promise<T | null> {
  const db = await getDb();
  return new Promise((resolve, reject) => {
    db.transaction((tx) => {
      tx.executeSql(
        sql,
        params,
        (_, result) => resolve((result.rows._array[0] as T | null) ?? null),
        (_, err) => {
          reject(err);
          return false;
        },
      );
    });
  });
}
