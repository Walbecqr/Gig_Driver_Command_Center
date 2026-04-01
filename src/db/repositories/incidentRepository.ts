import { querySql, runSql } from '../index';
import type { Incident } from '@/types/entities';

const SELECT_COLS = `
  id,
  user_id       AS userId,
  created_at    AS createdAt,
  incident_type AS type,
  description
`;

export async function getIncidentsForUser(userId: string): Promise<Incident[]> {
  return querySql<Incident>(
    `SELECT ${SELECT_COLS} FROM incidents WHERE user_id = ? ORDER BY created_at DESC;`,
    [userId],
  );
}

export async function insertIncident(incident: Incident): Promise<void> {
  await runSql(
    `INSERT INTO incidents
       (id, user_id, created_at, incident_type, description, updated_at)
     VALUES (?, ?, ?, ?, ?, datetime('now'));`,
    [
      incident.id,
      incident.userId,
      incident.createdAt,
      incident.type,
      incident.description,
    ],
  );
}

export async function deleteIncident(id: string): Promise<void> {
  await runSql('DELETE FROM incidents WHERE id = ?;', [id]);
}
