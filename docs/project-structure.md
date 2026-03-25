# Project Structure

- `app/` - Expo Router routes and overall navigation screen graph.
- `src/components/` - shared UI primitives and shells.
- `src/features/` - feature-specific business logic modules.
- `src/services/` - platform/integration adapters (Supabase, analytics, crash, maps, voice).
- `src/db/` - local SQLite schema/migration + repository abstraction.
- `src/hooks/` - reusable app hooks for init, permissions, and lifecycle.
- `src/lib/` - utility libs (e.g., react-query client, error boundary).
- `src/state/` - Zustand or other client state stores.
- `src/types/` - core domain typing.
- `docs/` - architecture and setup documentation.
- `.env.example` - environment variable template.
- `README.md` - high-level setup and run instructions.
