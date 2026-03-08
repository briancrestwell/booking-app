/**
 * rbac.ts — Role-Based Access Control definitions.
 *
 * Role hierarchy (highest → lowest):
 *   SUPER_ADMIN  — Chủ quán / Super Admin: toàn quyền
 *   MANAGER      — Quản lý ca: quản lý bàn, menu, staff; xem audit
 *   CASHIER      — Thu ngân: xem bàn, thanh toán, gọi thêm món
 *   KITCHEN      — Bếp: chỉ xem KDS
 *   WAITER       — Phục vụ: xem bàn, gọi thêm món, đánh dấu phục vụ
 *
 * Each role grants a SET of permissions. Higher roles include all lower ones
 * EXCEPT for explicitly restricted capabilities.
 */

export type StaffRole =
  | 'SUPER_ADMIN'
  | 'MANAGER'
  | 'CASHIER'
  | 'KITCHEN'
  | 'WAITER';

// ── All possible permissions ──────────────────────────────────────────────────
export type Permission =
  // Navigation / page access
  | 'nav:tables'
  | 'nav:kitchen'
  | 'nav:menu'
  | 'nav:restaurant'
  | 'nav:settings'
  | 'nav:audit'
  | 'nav:staff'
  // Table actions
  | 'tables:view'
  | 'tables:change_status'
  // Order actions
  | 'orders:view'
  | 'orders:create'
  | 'orders:mark_served'
  // Checkout
  | 'checkout:confirm'
  // KDS
  | 'kds:view'
  | 'kds:update_status'
  // Menu management
  | 'menu:view'
  | 'menu:toggle86'
  | 'menu:edit'
  | 'menu:create'
  // Restaurant info
  | 'restaurant:view'
  | 'restaurant:edit'
  // Staff management
  | 'staff:view'
  | 'staff:create'
  | 'staff:edit_role'
  | 'staff:delete'
  // Audit
  | 'audit:view'
  | 'audit:clear'
  // Settings
  | 'settings:profile'
  | 'settings:notifications';

// ── Role → Permission mapping ─────────────────────────────────────────────────
const ROLE_PERMISSIONS: Record<StaffRole, Permission[]> = {
  SUPER_ADMIN: [
    'nav:tables', 'nav:kitchen', 'nav:menu', 'nav:restaurant',
    'nav:settings', 'nav:audit', 'nav:staff',
    'tables:view', 'tables:change_status',
    'orders:view', 'orders:create', 'orders:mark_served',
    'checkout:confirm',
    'kds:view', 'kds:update_status',
    'menu:view', 'menu:toggle86', 'menu:edit', 'menu:create',
    'restaurant:view', 'restaurant:edit',
    'staff:view', 'staff:create', 'staff:edit_role', 'staff:delete',
    'audit:view', 'audit:clear',
    'settings:profile', 'settings:notifications',
  ],
  MANAGER: [
    'nav:tables', 'nav:kitchen', 'nav:menu', 'nav:restaurant',
    'nav:settings', 'nav:audit',
    'tables:view', 'tables:change_status',
    'orders:view', 'orders:create', 'orders:mark_served',
    'checkout:confirm',
    'kds:view', 'kds:update_status',
    'menu:view', 'menu:toggle86', 'menu:edit', 'menu:create',
    'restaurant:view', 'restaurant:edit',
    'staff:view',
    'audit:view',
    'settings:profile', 'settings:notifications',
  ],
  CASHIER: [
    'nav:tables', 'nav:settings',
    'tables:view',
    'orders:view', 'orders:create',
    'checkout:confirm',
    'menu:view',
    'settings:profile', 'settings:notifications',
  ],
  KITCHEN: [
    'nav:kitchen', 'nav:settings',
    'kds:view', 'kds:update_status',
    'menu:view',
    'settings:profile', 'settings:notifications',
  ],
  WAITER: [
    'nav:tables', 'nav:settings',
    'tables:view', 'tables:change_status',
    'orders:view', 'orders:create', 'orders:mark_served',
    'menu:view',
    'settings:profile', 'settings:notifications',
  ],
};

// ── Public API ────────────────────────────────────────────────────────────────
export function getPermissions(role: StaffRole): Set<Permission> {
  return new Set(ROLE_PERMISSIONS[role] ?? []);
}

export function hasPermission(role: StaffRole, perm: Permission): boolean {
  return (ROLE_PERMISSIONS[role] ?? []).includes(perm);
}

export function hasAnyPermission(role: StaffRole, perms: Permission[]): boolean {
  return perms.some((p) => hasPermission(role, p));
}

// ── Role display metadata ─────────────────────────────────────────────────────
export const ROLE_META: Record<StaffRole, { label: string; color: string; bg: string; description: string }> = {
  SUPER_ADMIN: { label: 'Super Admin', color: 'text-yellow-400',  bg: 'bg-yellow-400/15',  description: 'Chủ quán — toàn quyền hệ thống' },
  MANAGER:     { label: 'Quản lý',     color: 'text-purple-400',  bg: 'bg-purple-400/15',  description: 'Quản lý ca — quản lý nhân sự & menu' },
  CASHIER:     { label: 'Thu ngân',    color: 'text-pos-green',   bg: 'bg-pos-green/15',   description: 'Thu ngân — thanh toán & gọi món' },
  KITCHEN:     { label: 'Bếp',         color: 'text-pos-amber',   bg: 'bg-pos-amber/15',   description: 'Bếp trưởng/phụ — xử lý KDS' },
  WAITER:      { label: 'Phục vụ',     color: 'text-primary',     bg: 'bg-primary/15',     description: 'Nhân viên phục vụ bàn' },
};

export const ALL_ROLES: StaffRole[] = ['SUPER_ADMIN', 'MANAGER', 'CASHIER', 'KITCHEN', 'WAITER'];
