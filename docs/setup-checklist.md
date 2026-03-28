# Setup Checklist

## Prerequisites

1. Install **Node.js LTS** (>=18.0.0) — verify with `node -v`.
2. Install **Docker Desktop** (Windows) if you plan to use the containerized dev workflow.
3. Install **Android Studio** (Android targets) or **Xcode** (iOS targets, macOS only).

## VS Code

1. Open the repo in VS Code and accept the **recommended extensions** prompt (configured in [.vscode/extensions.json](.vscode/extensions.json)):
   - ESLint, Prettier, Expo Tools, TypeScript Nightly, Path Intellisense, DotENV, Auto Rename Tag.

## Project Setup

1. Clone the repo, then install dependencies:

   ```bash
   npm install
   ```

   > `package-lock.json` is committed — use `npm`, not `pnpm` or `yarn`.

2. Populate `.env` with your Supabase credentials (file exists in repo root — fill in any missing values):

   ```env
   EXPO_PUBLIC_SUPABASE_URL=...
   EXPO_PUBLIC_SUPABASE_ANON_KEY=...
   ```

3. Apply Supabase DB migrations if running a local Supabase instance:

   ```bash
   supabase db push   # or supabase migration up
   ```

## Verify

1. Run typecheck: `npm run typecheck`
2. Run lint: `npm run lint`
3. Run formatter: `npm run format`
4. Run tests (Vitest): `npm run test`

## Run the App

### Option A — Local (native)

1. Start Metro bundler: `npm run start`
2. Run on Android emulator: `npm run android` (requires Android Studio + emulator running)
3. Run on iOS simulator: `npm run ios` (macOS + Xcode only)
4. Run in browser: `npm run web`

### Option B — Docker (recommended on Windows)

1. Start the Expo web dev server in Docker:

   ```bash
   docker compose up app-dev
   ```

   - Metro bundler: <http://localhost:8081>
   - Expo web: <http://localhost:19006>

2. For one-off commands (lint, typecheck, test) inside the container:

   ```bash
   docker compose run --rm shell
   # then: npm run typecheck | npm run lint | npm run test
   ```

## Final Check

1. Verify the initial screens render correctly in your emulator, device, or browser.
