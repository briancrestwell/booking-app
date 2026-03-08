/**
 * staff.store.ts
 *
 * Permission model:
 *   effectivePerms(member) = (roleDefaults ∪ permissionGrants) ∖ permissionRevokes
 *
 * Super Admin can:
 *   - Grant extra permissions not in the role default → permissionGrants[]
 *   - Revoke permissions that are in the role default → permissionRevokes[]
 */
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { type StaffRole, type Permission } from '@/lib/rbac';
import { getMockMode } from '@booking/shared';

export interface StaffMember {
  id:                string;
  name:              string;
  email:             string;
  role:              StaffRole;
  pin:               string;
  active:            boolean;
  createdAt:         string;
  branchId:          string;
  /** Extra permissions granted beyond the role default */
  permissionGrants:  Permission[];
  /** Permissions revoked from the role default */
  permissionRevokes: Permission[];
}

interface StaffStore {
  members:      StaffMember[];
  addMember:    (input: Omit<StaffMember, 'id' | 'createdAt'>) => StaffMember;
  updateRole:   (id: string, role: StaffRole) => void;
  toggleActive: (id: string) => void;
  deleteMember: (id: string) => void;
  updateMember: (id: string, data: Partial<Pick<StaffMember, 'name' | 'email' | 'pin'>>) => void;
  setPermissionOverrides: (
    id: string,
    grants: Permission[],
    revokes: Permission[],
  ) => void;
}

const MOCK_BRANCH = 'mock-branch-001';

function seed(
  id: string, name: string, email: string, role: StaffRole, pin: string, createdAt: string,
): StaffMember {
  return {
    id, name, email, role, pin, active: true, createdAt,
    branchId: MOCK_BRANCH, permissionGrants: [], permissionRevokes: [],
  };
}

const SEED_STAFF: StaffMember[] = [
  seed('staff-001', 'Nguyễn Văn A',  'admin@restaurant.vn',   'SUPER_ADMIN', '123456', '2025-01-01T08:00:00.000Z'),
  seed('staff-002', 'Trần Thị Bình', 'manager@restaurant.vn', 'MANAGER',     '111111', '2025-02-15T08:00:00.000Z'),
  seed('staff-003', 'Lê Văn Cường',  'kitchen@restaurant.vn', 'KITCHEN',     '222222', '2025-03-01T08:00:00.000Z'),
  seed('staff-004', 'Phạm Thị Dung', 'cashier@restaurant.vn', 'CASHIER',     '333333', '2025-03-10T08:00:00.000Z'),
  seed('staff-005', 'Hoàng Văn Em',  'waiter@restaurant.vn',  'WAITER',      '444444', '2025-04-01T08:00:00.000Z'),
];

function makeId() {
  return `staff-${Date.now().toString(36)}`;
}

export const useStaffStore = create<StaffStore>()(
  persist(
    (set) => ({
      // In Live mode start with empty list; seed data only for Demo/Mock mode.
      members: getMockMode() ? SEED_STAFF : [],

      addMember: (input) => {
        const member: StaffMember = {
          ...input,
          id:        makeId(),
          createdAt: new Date().toISOString(),
          permissionGrants:  input.permissionGrants  ?? [],
          permissionRevokes: input.permissionRevokes ?? [],
        };
        set((s) => ({ members: [...s.members, member] }));
        return member;
      },

      updateRole: (id, role) =>
        set((s) => ({
          // When role changes, clear overrides — they may no longer make sense
          members: s.members.map((m) =>
            m.id === id ? { ...m, role, permissionGrants: [], permissionRevokes: [] } : m,
          ),
        })),

      toggleActive: (id) =>
        set((s) => ({
          members: s.members.map((m) => m.id === id ? { ...m, active: !m.active } : m),
        })),

      deleteMember: (id) =>
        set((s) => ({ members: s.members.filter((m) => m.id !== id) })),

      updateMember: (id, data) =>
        set((s) => ({
          members: s.members.map((m) => m.id === id ? { ...m, ...data } : m),
        })),

      setPermissionOverrides: (id, grants, revokes) =>
        set((s) => ({
          members: s.members.map((m) =>
            m.id === id
              ? { ...m, permissionGrants: grants, permissionRevokes: revokes }
              : m,
          ),
        })),
    }),
    {
      name: 'admin-staff-v2',
      storage: createJSONStorage(() => localStorage),
      // When rehydrating: if we're in Live mode but the stored data contains
      // mock seed accounts (identifiable by MOCK_BRANCH branchId), clear them.
      onRehydrateStorage: () => (state) => {
        if (!state) return;
        if (!getMockMode()) {
          const hasMockData = state.members.some((m) => m.branchId === MOCK_BRANCH);
          if (hasMockData) {
            state.members = [];
          }
        }
      },
    },
  ),
);
