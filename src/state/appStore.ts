import { create } from 'zustand';
import type { PlanTier } from '@/services/billing';

interface AppState {
  isOnboarded: boolean;
  plan: PlanTier;
  dbReady: boolean;
  setOnboarded: (value: boolean) => void;
  setPlan: (plan: PlanTier) => void;
  setDbReady: (ready: boolean) => void;
}

export const useAppStore = create<AppState>((set) => ({
  isOnboarded: false,
  plan: 'free',
  dbReady: false,
  setOnboarded: (value) => set({ isOnboarded: value }),
  setPlan: (plan) => set({ plan }),
  setDbReady: (ready) => set({ dbReady: ready }),
}));
