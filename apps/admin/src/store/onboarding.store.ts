/**
 * onboarding.store.ts
 *
 * Tracks whether the restaurant has been set up for the first time.
 * Used to show the onboarding wizard to Super Admin on first login
 * when Live mode is active (no mock data to fall back on).
 *
 * Steps:
 *   1. restaurant  — basic info (name, address, phone, brand color)
 *   2. menu        — at least one category + one item
 *   3. staff       — at least one staff member beyond the initial admin
 *
 * Once completed, `isComplete` = true and the wizard never shows again.
 * Super Admin can re-open it from Settings if needed.
 */
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export interface OnboardingState {
  /** Whether the full setup wizard has been completed */
  isComplete:        boolean;
  /** Individual step completion flags */
  restaurantDone:    boolean;
  menuDone:          boolean;
  staffDone:         boolean;
  /** Mark a step done */
  completeStep:  (step: 'restaurant' | 'menu' | 'staff') => void;
  /** Force-mark everything complete (e.g. importing existing data) */
  markComplete:  () => void;
  /** Reset (for re-running the wizard) */
  reset:         () => void;
}

export const useOnboardingStore = create<OnboardingState>()(
  persist(
    (set) => ({
      isComplete:     false,
      restaurantDone: false,
      menuDone:       false,
      staffDone:      false,

      completeStep: (step) =>
        set((s) => {
          const next = {
            ...s,
            [`${step}Done`]: true,
          };
          // Auto-complete if all steps done
          next.isComplete = next.restaurantDone && next.menuDone && next.staffDone;
          return next;
        }),

      markComplete: () =>
        set({ isComplete: true, restaurantDone: true, menuDone: true, staffDone: true }),

      reset: () =>
        set({ isComplete: false, restaurantDone: false, menuDone: false, staffDone: false }),
    }),
    {
      name:    'admin-onboarding-v1',
      storage: createJSONStorage(() => localStorage),
    },
  ),
);
