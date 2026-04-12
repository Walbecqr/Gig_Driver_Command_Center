# Gig Driver Command Center

Production-grade mobile-first gig driver command center built with Expo, React Native, TypeScript, and Supabase.

## Prerequisites

- Windows 10+ (or macOS for iOS builds)
- Node.js LTS >=18.0.0 with npm
- Git
- Android Studio + emulator (for Android builds)
- Xcode + Simulator (for iOS, macOS only)
- Java JDK 11+ (for Android builds)

## 1) Install and setup

1. Clone project:

```bash
git clone https://github.com/Walbecqr/Gig_Driver_Command_Center.git
cd Gig_Driver_Command_Center
```

1. Install dependencies:

```sh
npm install
```

> `package-lock.json` is committed — use npm, not pnpm or yarn.

1. Create env file:

```bash
cp .env .env.local
```

1. Set Supabase values in `.env`:

```ini
EXPO_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
```

1. Apply database migrations (requires Supabase CLI):

```bash
supabase db push
```

## 2) Run commands

```sh
npm run typecheck   # TypeScript strict check
npm run lint        # ESLint (zero warnings enforced)
npm run format      # Prettier formatting
npm run test        # Vitest unit tests
npm run test:watch  # Vitest in watch mode
npm run start       # Start Expo Metro bundler
```

## Run on devices

- Android emulator: `npm run android`
- iOS simulator (macOS): `npm run ios`
- Web browser: `npm run web`

## 3) Supabase integration

Supabase client lives in [src/services/supabase/client.ts](src/services/supabase/client.ts).

- `src/db/migrations/001_init.sql` — SQLite local schema (users, shifts, delivery_platform_accounts)
- Local-first data managed via expo-sqlite in `src/db/`
- RLS policy notes in `docs/supabase-rls.md`

## 4) Architecture notes

See [docs/architecture.md](docs/architecture.md), [docs/project-structure.md](docs/project-structure.md), [docs/setup-checklist.md](docs/setup-checklist.md).

## 5) Tech stack

| Layer        | Library                                    |
| ------------ | ------------------------------------------ |
| Framework    | Expo 55 + React Native 0.84                |
| Language     | TypeScript 5.5 (strict mode)               |
| Routing      | Expo Router                                |
| State        | Zustand 4.4                                |
| Server state | TanStack React Query 5.4                   |
| Local DB     | expo-sqlite                                |
| Backend      | Supabase (auth + Postgres)                 |
| Validation   | Zod 3.23                                   |
| Testing      | Vitest 4 + @testing-library/react-native   |
| Linting      | ESLint 8 + @typescript-eslint + Prettier 3 |

## 6) What is implemented

- Expo + TypeScript project with strict mode and path aliases (`@/*`)
- Expo Router file-based routes for all required screens
- Feature modules scaffolded under `src/features/` (onboarding, shifts, offers, earnings, trips, cash, expenses, market, incidents, settings)
- SQLite init + core tables + shift repository sample
- Zustand stores for app and shift state (`src/state/`)
- TanStack React Query client configured (`src/lib/queryClient.ts`)
- Supabase client with env-safety warning and generated types
- Service adapters for analytics, crash reporting, billing, notifications, navigation, voice
- ESLint + Prettier + TypeScript strict config
- Vitest test runner configured with @testing-library/react-native

## 7) Next recommended milestones

1. Implement feature logic under `src/features/*` (currently scaffolded screens only)
2. Add background location tracking, permission flows, and offline sync
3. Wire up Supabase authentication and RBAC policies
4. Expand unit tests for DB repositories and service adapters
5. Set up CI pipeline (GitHub Actions) for lint / typecheck / test / Expo build
