# CLAUDE.md — Gig Driver Command Center

AI assistant guide for understanding, navigating, and contributing to this codebase.

---

## What This App Does

**Gig Driver Command Center** is a cross-platform mobile/web app for food delivery gig drivers (DoorDash, Uber Eats, Grubhub, etc.). It helps them track shifts, log delivery offers, record trips, manage expenses, handle cash flow, monitor incidents, and analyze market-level zone intelligence using geospatial data.

Key differentiators:
- **Offline-first**: SQLite is the canonical local data store; Supabase syncs in the background
- **H3 geospatial zones**: Every offer/trip/stop is tagged with an H3 hexagon index for zone-level analytics
- **DoorDash CSV ingestion**: Drivers can import DoorDash earnings/orders exports for historical analysis

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Expo 55 + React Native 0.84 |
| Language | TypeScript 5.5 (strict mode, zero implicit any) |
| Routing | Expo Router (file-based, under `app/`) |
| State | Zustand 4.4 (local) + TanStack React Query 5.4 (server) |
| Local DB | expo-sqlite (SQLite 3, promise-based async) |
| Backend | Supabase (PostgreSQL + Auth) |
| Validation | Zod 3.23 |
| Geospatial | h3-js 4.4 (H3 hexagonal indexing) |
| Testing | Vitest 4 + @testing-library/react-native |
| Linting | ESLint 8 + TypeScript ESLint + Prettier 3 |
| Build | Docker (multi-stage: dev/prod) |

Package manager: **npm** (package-lock.json is committed; do not use pnpm or yarn).

Node requirement: `>=18.0.0`

---

## Directory Structure

```
/
├── app/                        # Expo Router file-based routes (screens)
│   ├── _layout.tsx             # Root layout: providers (QueryClient, SafeArea, Stack)
│   ├── index.tsx               # Welcome/home screen
│   ├── dashboard.tsx
│   ├── shifts.tsx
│   ├── offers.tsx
│   ├── trips.tsx
│   ├── earnings.tsx
│   ├── expenses.tsx
│   ├── cash.tsx
│   ├── market.tsx
│   ├── incidents.tsx
│   ├── settings.tsx
│   └── onboarding.tsx
│
├── src/
│   ├── components/             # Shared UI components
│   ├── features/               # Domain feature modules (business logic)
│   │   ├── shifts/             # Start/end/pause/resume shifts, zone aggregation
│   │   ├── offers/             # Record offers, calculate acceptance rate
│   │   ├── trips/              # Start/stop trips, manage stops, derive zones
│   │   ├── market/             # Zone intelligence queries (hot zones, fast pickup)
│   │   ├── earnings/           # (Scaffolded)
│   │   ├── expenses/           # (Scaffolded)
│   │   ├── cash/               # (Scaffolded)
│   │   ├── incidents/          # (Scaffolded)
│   │   └── settings/           # (Scaffolded)
│   │
│   ├── services/               # External integrations
│   │   ├── supabase/           # Supabase client, schema types, Zod validation
│   │   ├── analytics/          # Event logging + zone_time_series aggregation
│   │   ├── crash/              # Error capture (TODO: Sentry/Bugsnag)
│   │   ├── notifications/      # Push notifications (TODO: Expo Notifications)
│   │   ├── billing/            # Plan tiers (TODO: Stripe/in-app purchase)
│   │   ├── voice/              # Hands-free voice (TODO: Expo Speech)
│   │   ├── navigation/         # External map deep-links (Google Maps)
│   │   └── ingestion/          # DoorDash CSV ingestion (earnings + orders)
│   │
│   ├── db/
│   │   ├── index.ts            # DB init with versioned migration runner
│   │   ├── sqlite.ts           # Promise-based SQLite helpers (execSql, querySql, etc.)
│   │   ├── migrations/         # SQL migration files (001_init.sql, etc.)
│   │   └── repositories/       # Data access layer (shiftRepository, offerRepository, tripRepository)
│   │
│   ├── state/
│   │   ├── appStore.ts         # isOnboarded, plan, dbReady
│   │   └── shiftStore.ts       # activeShift
│   │
│   ├── hooks/
│   │   └── useInitApp.ts       # App lifecycle init: DB setup, auth session check
│   │
│   ├── lib/
│   │   └── queryClient.ts      # TanStack React Query client (1min stale, 5min GC, 1 retry)
│   │
│   ├── types/
│   │   ├── entities.ts         # Core TypeScript interfaces (User, Shift, Offer, Trip, etc.)
│   │   └── supabase.generated.ts  # Auto-generated Supabase types (do not edit manually)
│   │
│   └── utils/
│       ├── h3.ts               # H3 geospatial helpers (getZoneId, getNeighborZones, etc.)
│       └── id.ts               # UUID generation (crypto.randomUUID with fallback)
│
├── supabase/
│   └── migrations/             # PostgreSQL migration files for Supabase backend
│
├── docs/                       # Architecture and setup documentation
│   ├── architecture.md         # Layered architecture, offline sync strategy
│   ├── project-structure.md    # Directory organization
│   ├── setup-checklist.md      # Setup prerequisites
│   └── supabase-rls.md         # Row-level security notes
│
├── tests/                      # Vitest test suite
├── android/                    # Android build configuration
├── assets/                     # Icons, splash screens
├── scripts/                    # Build/utility scripts
├── Dockerfile                  # Multi-stage: dependencies → dev → builder → prod
└── docker-compose.yml          # dev (HMR) and prod (static) targets
```

---

## Development Commands

```bash
# Install dependencies
npm install

# Quality checks (run all before committing)
npm run typecheck       # tsc --noEmit (strict)
npm run lint            # ESLint, zero warnings allowed
npm run format          # Prettier auto-format

# Testing
npm run test            # Vitest (one-shot)
npm run test:watch      # Vitest (watch mode)

# Run the app
npm run start           # Expo Metro bundler
npm run android         # Android emulator
npm run ios             # iOS simulator (macOS only)
npm run web             # Browser (Expo web)

# Docker development
docker compose up app-dev            # Dev server at http://localhost:19006
docker compose --profile prod up app-prod  # Production static at http://localhost:3000
```

**Pre-commit checklist**: `typecheck` + `lint` + `test` must all pass. ESLint enforces `--max-warnings 0`.

---

## Git & Branch Conventions

- Default development branch for AI/automated work: `claude/add-claude-documentation-8VPrz`
- Commit messages: present-tense imperative ("Add shift repository", "Fix zone aggregation logic")
- Always push with `-u`: `git push -u origin <branch-name>`
- Do not push to `main` without explicit approval

---

## Environment Variables

Create a `.env` file at the repo root:

```env
EXPO_PUBLIC_SUPABASE_URL=https://<project>.supabase.co
EXPO_PUBLIC_SUPABASE_KEY=<anon-key>
EXPO_PUBLIC_MAPS_API_KEY=        # Optional: Google Maps
EXPO_PUBLIC_CRASH_REPORTING_KEY= # Optional: Sentry/Bugsnag
```

All variables prefixed with `EXPO_PUBLIC_` are bundled into the client. Never put secrets without that prefix in `.env` expecting them to stay server-side in Expo.

---

## Database Architecture

### Local SQLite (offline-first, canonical working data)

Database name: `gigdcs.db`. Initialized via `src/db/index.ts` with versioned migrations.

**Tables:**

| Table | Purpose |
|---|---|
| `shifts` | Driver work sessions (active/paused/completed) |
| `offers` | Incoming delivery offers per shift |
| `trips` | Delivery trip execution records |
| `deliveries` | Individual orders within a trip |
| `stops` | Waypoints (pickup, dropoff) with H3 zone IDs |
| `expenses` | Driver expenses by category |
| `cash_ledger_entries` | Cash-on-hand tracking |
| `incidents` | Driver incidents by type |
| `zone_time_series` | Aggregated H3 zone analytics (hourly/daily/weekly) |
| `sync_queue` | Offline-first sync queue for Supabase |
| `migrations` | Migration version tracking |

**Repository pattern**: All DB access goes through `src/db/repositories/`. Direct SQL elsewhere is a code smell.

**SQLite helpers** (`src/db/sqlite.ts`):
- `execSql(db, sql)` — DDL, no return value
- `runSql(db, sql, params)` — INSERT/UPDATE/DELETE
- `querySql<T>(db, sql, params)` — SELECT, returns `T[]`
- `queryOneSql<T>(db, sql, params)` — SELECT, returns `T | null`

### Supabase (backend sync, auth, analytics)

Schema lives in `supabase/migrations/`. Key tables: `users`, `delivery_platform_accounts`, `shifts`, `trips`, `stops`, `trip_financials`, `trip_metrics`, `import_batches`, `raw_import_records`.

RLS is **required** on all user-data tables. Policy pattern: `user_id = auth.uid()`. See `docs/supabase-rls.md`.

Never store plaintext platform credentials (DoorDash passwords, etc.) in Supabase.

---

## State Management

### Zustand stores (`src/state/`)

| Store | State | Actions |
|---|---|---|
| `appStore` | `isOnboarded`, `plan`, `dbReady` | `setOnboarded`, `setPlan`, `setDbReady` |
| `shiftStore` | `activeShift` | `setActiveShift`, `clearActiveShift` |

### React Query (`src/lib/queryClient.ts`)

Used for server state (Supabase queries). Config:
- `staleTime`: 60,000ms (1 min)
- `gcTime`: 300,000ms (5 min)
- `retry`: 1

---

## TypeScript Conventions

- **Strict mode**: all strict flags enabled. No `any`, no non-null assertions without good reason.
- **Path alias**: `@/*` maps to `./src/*`. Always use `@/` imports for `src/` files.
- **Entity types**: defined in `src/types/entities.ts`. Add new entities there.
- **Supabase types**: `src/types/supabase.generated.ts` is auto-generated — regenerate with the Supabase CLI, do not edit manually.
- **Zod schemas**: defined in `src/services/supabase/schema.ts` for runtime validation at system boundaries.

---

## Geospatial (H3) Conventions

Default resolution: **9** (≈ 0.73 km cell edge, block-level precision).

All spatial helpers live in `src/utils/h3.ts`:

```typescript
getZoneId(lat, lng, resolution?)  // WGS-84 → H3 cell index string
getNeighborZones(zoneId, k?)      // H3 cell + k-ring neighbors
getZoneCenter(zoneId)             // H3 cell centroid { lat, lng }
getZoneResolution(zoneId)         // Resolution integer from index
```

**When to compute zone IDs**:
- Offers: compute `pickupZoneId` and `dropoffZoneId` at offer recording time
- Stops: compute `zoneId` from stop coordinates at stop insertion time
- Trips: derive `primaryPickupZoneId` / `primaryDropoffZoneId` from stop zones at completion

**Analytics aggregation**: `src/services/analytics/index.ts` → `aggregateZoneMetrics()` writes into `zone_time_series`. Called at shift-end.

---

## Feature Module Conventions

Feature modules in `src/features/<feature>/index.ts` contain **domain business logic** only — no UI, no direct SQLite, no raw Supabase calls. They orchestrate repositories and services.

Currently implemented: `shifts`, `offers`, `trips`, `market`.
Scaffolded (placeholder): `earnings`, `expenses`, `cash`, `incidents`, `settings`, `onboarding`.

When implementing a scaffolded feature:
1. Write business logic in `src/features/<feature>/index.ts`
2. Add/extend repositories in `src/db/repositories/`
3. Wire up React Query hooks in the screen under `app/`
4. Export from the feature module, not from the repository directly

---

## Service Adapters

Services in `src/services/` integrate external systems. Most are placeholder-implemented and marked `TODO`. When implementing:

| Service | TODO note |
|---|---|
| `crash/` | Integrate Sentry or Bugsnag |
| `notifications/` | Integrate Expo Notifications |
| `billing/` | Integrate Stripe or RevenueCat (in-app purchase) |
| `voice/` | Integrate Expo Speech |
| `navigation/` | Platform deep-linking for Google Maps / Waze |

`src/services/ingestion/` contains the DoorDash CSV parser — fully implemented for earnings and orders CSV exports.

---

## Routing (Expo Router)

All screens live under `app/`. File name = route name.

- `app/_layout.tsx`: Wraps the entire app in providers and configures the `Stack` navigator
- `app/index.tsx`: Root route (`/`)
- Add new screens by creating `app/<screen>.tsx`
- `useInitApp` hook (called in layout) handles database init and auth check before rendering screens

---

## Offline Sync Strategy

1. All writes go to **local SQLite first**
2. A `sync_queue` record is created for each write (table, row ID, action, payload)
3. A background process (to be implemented) drains the queue to Supabase
4. Supabase is the system-of-record for multi-device and server-side analytics

When implementing sync logic, consume from `sync_queue` in FIFO order and mark `processed_at` on success.

---

## Code Quality Requirements

- ESLint: **zero warnings** (`--max-warnings 0`). Fix all warnings before committing.
- Prettier: 2 spaces, single quotes, trailing commas, 100-char line width. Run `npm run format`.
- TypeScript: no type errors. Run `npm run typecheck`.
- Tests: all must pass. Run `npm run test`.

ESLint config: `.eslintrc.js` (React + React Hooks + TypeScript ESLint + Prettier)
Prettier config: `prettier.config.js`
EditorConfig: `.editorconfig` (UTF-8, LF line endings, 2-space indent)

---

## Testing

Tests live in `tests/`. Framework: Vitest 4 with @testing-library/react-native.

Current coverage is minimal — scaffolded with a sanity check. When adding features:
- Unit test feature module functions and repository functions
- Integration tests can use an in-memory SQLite or Supabase test project
- Test files: `tests/<module>.test.ts`

---

## Docker

**Development** (hot reload):
```bash
docker compose up app-dev
# Metro bundler: port 8081
# Expo web: port 19006
```
Volume mounts `src/`, `app/`, `assets/` for live reload.

**Production** (static web export):
```bash
docker compose --profile prod up app-prod
# Static server: port 3000
```
Build pipeline: `expo export --platform web` → `serve` static files.

**One-off commands** (lint, typecheck, test):
```bash
docker compose run shell npm run lint
docker compose run shell npm run typecheck
docker compose run shell npm run test
```

---

## Key Files Quick Reference

| File | Purpose |
|---|---|
| `app/_layout.tsx` | Root layout, provider setup |
| `src/hooks/useInitApp.ts` | App init (DB + auth) |
| `src/db/index.ts` | SQLite init + migration runner |
| `src/db/sqlite.ts` | SQLite promise helpers |
| `src/db/repositories/` | All DB access layer |
| `src/types/entities.ts` | Core entity interfaces |
| `src/utils/h3.ts` | H3 geospatial utilities |
| `src/utils/id.ts` | UUID generation |
| `src/state/appStore.ts` | App-wide Zustand store |
| `src/state/shiftStore.ts` | Active shift state |
| `src/lib/queryClient.ts` | React Query client config |
| `src/services/supabase/client.ts` | Supabase JS client |
| `src/services/analytics/index.ts` | Zone metric aggregation |
| `src/services/ingestion/doordash.ts` | DoorDash CSV ingestion |
| `supabase/migrations/` | PostgreSQL schema |
| `docs/architecture.md` | Architecture overview |
| `docs/supabase-rls.md` | RLS policy patterns |
