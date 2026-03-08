'use client';
import { MobileAppLayout } from '@/components/layout/MobileAppLayout';
import { useAuthStore } from '@/store/auth.store';
import { useStaffStore } from '@/store/staff.store';
import { ROLE_META, ALL_ROLES, type Permission, getPermissions } from '@/lib/rbac';
import { getEffectivePermissions } from '@/hooks/use-permission';
import { cn } from '@/lib/utils';
import { CheckCircle2, XCircle, Plus, Minus } from 'lucide-react';

// Permission display map
const PERM_GROUPS: { group: string; perms: { key: Permission; label: string }[] }[] = [
  {
    group: 'Bàn & Đặt bàn',
    perms: [
      { key: 'tables:view',          label: 'Xem danh sách bàn' },
      { key: 'tables:change_status', label: 'Đổi trạng thái bàn' },
    ],
  },
  {
    group: 'Gọi món & Order',
    perms: [
      { key: 'orders:view',        label: 'Xem đơn hàng' },
      { key: 'orders:create',      label: 'Gọi thêm món' },
      { key: 'orders:mark_served', label: 'Đánh dấu đã phục vụ' },
      { key: 'checkout:confirm',   label: 'Xác nhận thanh toán' },
    ],
  },
  {
    group: 'Bếp (KDS)',
    perms: [
      { key: 'kds:view',          label: 'Xem màn hình bếp' },
      { key: 'kds:update_status', label: 'Cập nhật trạng thái món' },
    ],
  },
  {
    group: 'Thực đơn',
    perms: [
      { key: 'menu:view',    label: 'Xem thực đơn' },
      { key: 'menu:toggle86', label: 'Bật/tắt hết hàng (86)' },
      { key: 'menu:edit',    label: 'Chỉnh sửa món' },
      { key: 'menu:create',  label: 'Tạo món mới' },
    ],
  },
  {
    group: 'Nhà hàng & Nhân viên',
    perms: [
      { key: 'restaurant:view',  label: 'Xem thông tin nhà hàng' },
      { key: 'restaurant:edit',  label: 'Chỉnh sửa nhà hàng' },
      { key: 'staff:view',       label: 'Xem danh sách nhân viên' },
      { key: 'staff:create',     label: 'Tạo tài khoản nhân viên' },
      { key: 'staff:edit_role',  label: 'Phân quyền nhân viên' },
      { key: 'staff:delete',     label: 'Xoá tài khoản nhân viên' },
    ],
  },
  {
    group: 'Hệ thống',
    perms: [
      { key: 'audit:view',  label: 'Xem Audit Log' },
      { key: 'audit:clear', label: 'Xoá Audit Log' },
    ],
  },
];

export default function RbacInfoPage() {
  const user    = useAuthStore((s) => s.user);
  const role    = user?.role;
  const member  = useStaffStore((s) => s.members.find((m) => m.id === user?.id));
  const grants  = member?.permissionGrants  ?? [];
  const revokes = member?.permissionRevokes ?? [];
  const myPerms = role
    ? getEffectivePermissions(role, grants, revokes)
    : new Set<Permission>();
  const roleDefaults = role ? getPermissions(role) : new Set<Permission>();
  const meta    = role ? ROLE_META[role] : null;
  const hasOverrides = grants.length > 0 || revokes.length > 0;

  return (
    <MobileAppLayout title="Quyền của tôi">
      <div className="px-4 pt-4 pb-32 space-y-6">

        {/* Role badge */}
        {meta && (
          <div className={cn(
            'flex items-center gap-3 rounded-2xl p-4',
            meta.bg,
          )}>
            <div className={cn(
              'flex h-12 w-12 shrink-0 items-center justify-center rounded-full',
              'bg-black/20 text-lg font-bold',
              meta.color,
            )}>
              {user?.name?.charAt(0)?.toUpperCase() ?? 'S'}
            </div>
            <div className="flex-1">
              <p className={cn('text-sm font-semibold', meta.color)}>{meta.label}</p>
              <p className="text-xs text-muted-foreground">{meta.description}</p>
            </div>
          </div>
        )}

        {/* Override summary */}
        {hasOverrides && (
          <div className="bg-card rounded-2xl ring-1 ring-pos-border overflow-hidden">
            <div className="px-4 py-3 border-b border-pos-border">
              <p className="text-xs font-semibold text-foreground">Quyền tùy chỉnh đang áp dụng</p>
            </div>
            {grants.map((p) => (
              <div key={p} className="flex items-center gap-3 px-4 py-2.5 border-b border-pos-border last:border-0">
                <Plus className="h-3.5 w-3.5 text-primary shrink-0" />
                <span className="text-xs text-primary">Được cấp thêm: {p}</span>
              </div>
            ))}
            {revokes.map((p) => (
              <div key={p} className="flex items-center gap-3 px-4 py-2.5 border-b border-pos-border last:border-0">
                <Minus className="h-3.5 w-3.5 text-destructive shrink-0" />
                <span className="text-xs text-destructive">Bị thu hồi: {p}</span>
              </div>
            ))}
          </div>
        )}

        {/* Permission groups */}
        {PERM_GROUPS.map(({ group, perms }) => (
          <div key={group}>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 px-1">
              {group}
            </p>
            <div className="bg-card rounded-2xl overflow-hidden ring-1 ring-pos-border">
              {perms.map(({ key, label }, i) => {
                  const allowed   = myPerms.has(key);
                  const isGranted = grants.includes(key);
                  const isRevoked = revokes.includes(key);
                  return (
                    <div
                      key={key}
                      className={cn(
                        'flex items-center gap-3 px-4 py-3',
                        'border-b border-pos-border last:border-0',
                        !allowed && 'opacity-40',
                      )}
                    >
                      {allowed
                        ? <CheckCircle2 className="h-4 w-4 shrink-0 text-pos-green" />
                        : <XCircle className="h-4 w-4 shrink-0 text-muted-foreground" />
                      }
                      <span className="text-sm text-foreground flex-1">{label}</span>
                      {isGranted && (
                        <span className="text-[9px] font-bold bg-primary/20 text-primary px-1.5 py-0.5 rounded-full">+Cấp thêm</span>
                      )}
                      {isRevoked && (
                        <span className="text-[9px] font-bold bg-destructive/20 text-destructive px-1.5 py-0.5 rounded-full">−Thu hồi</span>
                      )}
                    </div>
                  );
                })}
            </div>
          </div>
        ))}

        {/* All roles comparison */}
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 px-1">
            So sánh các role
          </p>
          <div className="bg-card rounded-2xl overflow-hidden ring-1 ring-pos-border">
            {ALL_ROLES.map((r) => {
              const m = ROLE_META[r];
              return (
                <div
                  key={r}
                  className={cn(
                    'flex items-center gap-3 px-4 py-3',
                    'border-b border-pos-border last:border-0',
                    r === role && 'ring-inset ring-1 ring-primary/30 bg-primary/5',
                  )}
                >
                  <div className={cn('w-2 h-2 rounded-full shrink-0', m.bg.replace('/15', ''))}>
                    <div className={cn('w-2 h-2 rounded-full', m.color.replace('text-', 'bg-'))} />
                  </div>
                  <div className="flex-1">
                    <p className={cn('text-sm font-medium', m.color)}>{m.label}</p>
                    <p className="text-xs text-muted-foreground">{m.description}</p>
                  </div>
                  {r === role && (
                    <span className="text-[10px] font-semibold text-primary bg-primary/15 px-1.5 py-0.5 rounded-full">
                      Vai trò của bạn
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </MobileAppLayout>
  );
}
