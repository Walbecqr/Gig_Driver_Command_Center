# Gig Driver Command Center

Production-grade local app scaffold for a mobile-first gig driver command center.

## Prerequisites

- Windows 10+ (or macOS for iOS builds).
- Node.js LTS >=18 (npm provided) [Required]
- Expo CLI (`npm install -g expo-cli`) or `npx expo` [Required]
- Git [Installed]
- Android Studio + emulator [For Android builds]
- Xcode + Simulator [For iOS, macOS only]
- Java JDK 11+ [For Android builds]

## 1) Install and setup

1. Clone project:

```bash
git clone https://github.com/Walbecqr/Gig_Driver_Command_Center.git
cd Gig_Driver_Command_Center
```

1. Install dependencies (preferred pnpm if available):

```sh
npm install
# or if pnpm is installed:
pnpm install
```

1. Create env file:

```bash
copy .env.example .env
```

1. Set Supabase values in `.env`:

```ini
EXPO_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
```

## 2) Run commands

```sh
npm run lint
npm run typecheck
npm run test
npm run start
```

## Run on devices

- Android emulator: `npm run android`
- iOS simulator (macOS): `npm run ios`
- Web: `npm run web`

## 3) Supabase placeholders

Supabase integration lives in `src/services/supabase/client.ts`.

- `supabase/migrations/001_init.sql` is starter server-side schema.
- Local-first entities managed in SQLite in `src/db`.
- RLS notes in `docs/supabase-rls.md`.

## 4) Architecture notes

See `docs/architecture.md`, `docs/project-structure.md`, `docs/setup-checklist.md`.

## 5) What is implemented

- Expo + TypeScript project structure.
- Expo Router routes for all required screens.
- SQLite init + core tables + repository sample.
- Supabase client module with env-safety warning.
- Service adapters for analytics, crash, billing, notifications, navigation, voice.
- ESLint + Prettier + TypeScript strict config.

## 6) Blockers in current environment

- Node.js/npm not installed in build environment (winget attempted and failed with elevation). Install Node manually with admin privileges.
- Cannot run `npm install` / `expo start` until Node is available.

## 7) Next recommended milestones

1. Add actual feature implementations under `src/features/*` and flow navigation.
2. Implement background tracking, location permission flows, and offline sync logic.
3. Add authentication with Supabase and RBAC policies.
4. Add unit tests for DB repository and service adapters.
5. Implement CI pipeline for lint/typecheck/test and Expo build.
