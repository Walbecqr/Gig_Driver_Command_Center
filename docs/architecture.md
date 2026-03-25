# Gig Driver Command Center Architecture

## High-level approach

- React Native + Expo + TypeScript
- Expo Router for app navigation flows
- Zustand for local state stores (app workflow, UI details)
- TanStack Query for remote/sync queries
- Local first persistence layer using expo-sqlite
- Supabase for backend sync and user management
- Strict typed API via Zod for contractual boundaries

## Core layers

1. Presentation (app/ routes + src/components)
2. Domain features (src/features/*)
3. State + hooks (src/state, src/hooks)
4. Persistent local DB (src/db)
5. External integrations (src/services)

## Offline-first sync strategy

- Local operations stored in SQLite as canonical working data.
- `sync_queue` table records pending sync actions (insert/update/delete).
- Background sync worker (future) reads `sync_queue` and pushes to server.
- Supabase is secondary / system-of-record when available.

## Security & privacy

- Local no plaintext platform credentials; store via encrypted secure store specialized plugin later.
- environment variables are required for Supabase and API keys; `.env.example` provided.

## Notes on entitlement

- Replace placeholder services at `src/services/analytics`, `src/services/crash`, `src/services/navigation`, `src/services/voice` with vendor providers.
- Supabase hooks are currently minimal; add row level security with strict `policy` in `supabase/schema.sql` and `docs/`.
