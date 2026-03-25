import * as SQLite from 'expo-sqlite';

export function executeSql(
  db: SQLite.WebSQLDatabase,
  sql: string,
  args: (string | number)[] = [],
): Promise<SQLite.SQLResultSet> {
  return new Promise((resolve, reject) => {
    db.transaction(
      (tx: {
        executeSql: (
          arg0: string,
          arg1: (string | number)[],
          arg2: (_: any, result: any) => void,
          arg3: (_: any, error: any) => boolean,
        ) => void;
      }) => {
        tx.executeSql(
          sql,
          args,
          (_: any, result: any) => {
            resolve(result);
          },
          (_: any, error: any) => {
            reject(error);
            return false;
          },
        );
      },
      (error: any) => reject(error),
    );
  });
}
