/**
 * Settings feature — business logic layer.
 *
 * App-level configuration. Most state lives in appStore (Zustand); this
 * module provides actions that combine store mutations with any side-effects
 * (e.g. clearing local DB on reset).
 *
 * Screen: app/settings.tsx
 */

import { useAppStore } from '@/state/appStore';
import type { PlanTier } from '@/services/billing';

export const PLAN_LABELS: Record<PlanTier, string> = {
  free: 'Free',
  pro: 'Pro',
  enterprise: 'Enterprise',
};

/**
 * Reset onboarding flag so the driver sees the onboarding flow on next launch.
 * Call from the UI (not hooks) — accesses the store directly via getState().
 */
export function resetOnboarding(): void {
  useAppStore.getState().setOnboarded(false);
}

/**
 * Update the active plan tier (e.g. after a billing event).
 */
export function setPlan(plan: PlanTier): void {
  useAppStore.getState().setPlan(plan);
}
