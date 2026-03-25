import { create } from 'zustand';
import type { Shift } from '@/types/entities';

interface ShiftState {
  activeShift: Shift | null;
  setActiveShift: (shift: Shift | null) => void;
  clearActiveShift: () => void;
}

export const useShiftStore = create<ShiftState>((set) => ({
  activeShift: null,
  setActiveShift: (shift) => set({ activeShift: shift }),
  clearActiveShift: () => set({ activeShift: null }),
}));
