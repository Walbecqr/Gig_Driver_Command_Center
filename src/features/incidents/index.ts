/**
 * Incidents feature — business logic layer.
 *
 * Logs driver incidents (accidents, customer disputes, platform issues)
 * with a timestamp and description for later review or support cases.
 *
 * Screen: app/incidents.tsx
 * Repository: src/db/repositories/incidentRepository.ts
 */

import {
  getIncidentsForUser,
  insertIncident,
  deleteIncident,
} from '@/db/repositories/incidentRepository';
import { generateId } from '@/utils/id';
import type { Incident } from '@/types/entities';

export { getIncidentsForUser, deleteIncident };

// ---------------------------------------------------------------------------
// Input types
// ---------------------------------------------------------------------------

export interface LogIncidentInput {
  userId: string;
  type: Incident['type'];
  description: string;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/** Create and persist a new incident record. */
export async function logIncident(input: LogIncidentInput): Promise<Incident> {
  const incident: Incident = {
    id: generateId(),
    userId: input.userId,
    createdAt: new Date().toISOString(),
    type: input.type,
    description: input.description,
  };
  await insertIncident(incident);
  return incident;
}
