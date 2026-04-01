import { create } from 'zustand';
import type { PlanTier } from '@/services/billing';

interface AppState {
  isOnboarded: boolean;
  plan: PlanTier;
  dbReady: boolean;
  /** Authenticated Supabase user ID, or null when unauthenticated. */
  userId: string | null;
  setOnboarded: (value: boolean) => void;
  setPlan: (plan: PlanTier) => void;
  setDbReady: (ready: boolean) => void;
  setUserId: (id: string | null) => void;
}

export const useAppStore = create<AppState>((set) => ({
  isOnboarded: false,
  plan: 'free',
  dbReady: false,
  userId: null,
  setOnboarded: (value) => set({ isOnboarded: value }),
  setPlan: (plan) => set({ plan }),
  setDbReady: (ready) => set({ dbReady: ready }),
  setUserId: (id) => set({ userId: id }),
}));
