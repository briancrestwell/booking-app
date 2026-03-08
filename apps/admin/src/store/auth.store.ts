'use client';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { decodeJwtPayload, isTokenValid } from '@/lib/utils';
import { type StaffRole, ALL_ROLES } from '@/lib/rbac';

export type { StaffRole };

export interface AdminUser {
  id:       string;
  name:     string;
  email:    string;
  role:     StaffRole;
  branchId: string;
}

interface AuthStore {
  token:    string | null;
  user:     AdminUser | null;
  setToken: (token: string) => void;
  logout:   () => void;
  isAuthenticated: () => boolean;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      token: null,
      user:  null,

      setToken: (token) => {
        const payload = decodeJwtPayload<Record<string, unknown>>(token);
        if (!payload) return;
        // Validate role — reject legacy values like 'STAFF'/'ADMIN' that no longer exist
        const rawRole = payload.role as string;
        const validRole: StaffRole = (ALL_ROLES as string[]).includes(rawRole)
          ? (rawRole as StaffRole)
          : 'WAITER';
        set({
          token,
          user: {
            id:       String(payload.sub ?? payload.id ?? ''),
            name:     String(payload.name ?? ''),
            email:    String(payload.email ?? ''),
            role:     validRole,
            branchId: String(payload.branchId ?? ''),
          },
        });
      },

      logout: () => set({ token: null, user: null }),

      isAuthenticated: () => {
        const { token } = get();
        return !!token && isTokenValid(token);
      },
    }),
    {
      name: 'admin-auth-v2',
      // Only persist the token; user is re-derived on rehydration
      partialize: (state) => ({ token: state.token }),
      onRehydrateStorage: () => (state) => {
        if (state?.token) state.setToken(state.token);
      },
    },
  ),
);
