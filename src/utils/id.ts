/**
 * Local ID generation for SQLite rows.
 *
 * Uses crypto.randomUUID() when available (React Native ≥ 0.71 / Node ≥ 19),
 * falls back to a timestamp + random suffix that is unique enough for a
 * single-user offline store.
 */
export function generateId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  // Fallback: 8-char timestamp base-36 + 7-char random base-36
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`;
}
