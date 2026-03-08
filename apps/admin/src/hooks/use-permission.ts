'use client';
import { useCallback } from 'react';
import { useAuthStore } from '@/store/auth.store';
import { useStaffStore } from '@/store/staff.store';
import {
  hasPermission, hasAnyPermission, getPermissions,
  type Permission, type StaffRole,
} from '@/lib/rbac';

export { type Permission, type StaffRole };

/**
 * usePermission — resolves the CURRENT USER's effective permissions.
 *
 * Effective permissions = (role defaults ∪ permissionGrants) ∖ permissionRevokes
 *
 * Super Admin can grant/revoke individual permissions per staff member via
 * the Staff management page. This hook always reflects the latest overrides.
 */
export function usePermission() {
  const user    = useAuthStore((s) => s.user);
  const role    = user?.role as StaffRole | undefined;

  // Look up this user's overrides from the staff store
  const member  = useStaffStore((s) => s.members.find((m) => m.id === user?.id));
  const grants  = member?.permissionGrants  ?? [];
  const revokes = member?.permissionRevokes ?? [];

  // Build effective permission set
  const effectivePerms = useCallback((): Set<Permission> => {
    if (!role) return new Set();
    const base = getPermissions(role);
    grants.forEach((p) => base.add(p));
    revokes.forEach((p) => base.delete(p));
    return base;
  }, [role, grants, revokes]);

  const can = useCallback(
    (perm: Permission): boolean => {
      if (!role) return false;
      const perms = effectivePerms();
      return perms.has(perm);
    },
    [role, effectivePerms],
  );

  const canAny = useCallback(
    (perms: Permission[]): boolean => perms.some((p) => can(p)),
    [can],
  );

  return { can, canAny, role: role ?? null, effectivePerms };
}

/**
 * getEffectivePermissions — pure helper (no hooks) used in non-component contexts.
 * Used in staff page to preview what a member's permissions look like.
 */
export function getEffectivePermissions(
  role: StaffRole,
  grants: Permission[],
  revokes: Permission[],
): Set<Permission> {
  const base = getPermissions(role);
  grants.forEach((p) => base.add(p));
  revokes.forEach((p) => base.delete(p));
  return base;
}
