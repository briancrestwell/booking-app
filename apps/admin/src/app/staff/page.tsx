'use client';
import { useState, useMemo } from 'react';
import {
  Plus, Search, MoreVertical, UserCheck, UserX,
  Trash2, Key, Copy, Check, X, ShieldCheck, ShieldOff,
} from 'lucide-react';
import { MobileAppLayout } from '@/components/layout/MobileAppLayout';
import { useStaffStore, type StaffMember } from '@/store/staff.store';
import { useAuthStore } from '@/store/auth.store';
import { usePermission, getEffectivePermissions } from '@/hooks/use-permission';
import { useAuditLog } from '@/hooks/use-audit-log';
import { ROLE_META, ALL_ROLES, getPermissions, type StaffRole, type Permission } from '@/lib/rbac';
import { cn } from '@/lib/utils';
import {
  Sheet, SheetContent, SheetHeader, SheetTitle,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

// ── Guard ─────────────────────────────────────────────────────────────────────
function AccessDenied() {
  return (
    <MobileAppLayout title="Nhân viên">
      <div className="flex flex-col items-center justify-center h-[60vh] gap-4 text-muted-foreground px-6 text-center">
        <UserX className="h-12 w-12 opacity-30" />
        <p className="text-sm">Bạn không có quyền truy cập trang này.</p>
      </div>
    </MobileAppLayout>
  );
}

// ── Generate a simple random PIN ──────────────────────────────────────────────
function genPin(len = 6) {
  return Array.from({ length: len }, () => Math.floor(Math.random() * 10)).join('');
}

// ── Add / Edit Staff Sheet ─────────────────────────────────────────────────────
interface EditSheetProps {
  member:  StaffMember | null; // null = create new
  onClose: () => void;
}

function EditStaffSheet({ member, onClose }: EditSheetProps) {
  const { addMember, updateMember, updateRole } = useStaffStore();
  const currentUser = useAuthStore((s) => s.user);
  const { log }     = useAuditLog();

  const isNew = !member;
  const [name,  setName]  = useState(member?.name  ?? '');
  const [email, setEmail] = useState(member?.email ?? '');
  const [role,  setRole]  = useState<StaffRole>(member?.role ?? 'WAITER');
  const [pin,   setPin]   = useState(member?.pin ?? genPin());
  const [copied, setCopied] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error,  setError]  = useState('');

  const allMembers = useStaffStore((s) => s.members);

  function copyPin() {
    navigator.clipboard.writeText(pin).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function handleSave() {
    if (!name.trim()) { setError('Vui lòng nhập họ tên'); return; }
    if (!email.trim()) { setError('Vui lòng nhập email'); return; }
    if (isNew && allMembers.some((m) => m.email === email.trim())) {
      setError('Email đã tồn tại trong hệ thống');
      return;
    }
    if (pin.length < 4) { setError('PIN tối thiểu 4 chữ số'); return; }

    setSaving(true);
    setError('');
    await new Promise((r) => setTimeout(r, 400)); // simulate async

    if (isNew) {
      const created = addMember({
        name: name.trim(), email: email.trim(), role, pin,
        active: true, branchId: currentUser?.branchId ?? 'mock-branch-001',
        permissionGrants: [], permissionRevokes: [],
      });
      log({
        category: 'SYSTEM', action: 'STAFF_CREATED',
        label:    `Tạo tài khoản: ${name.trim()} (${ROLE_META[role].label})`,
        outcome:  'SUCCESS', targetId: created.id, targetType: 'Staff',
        meta: { email: email.trim(), role },
      });
    } else {
      updateMember(member.id, { name: name.trim(), email: email.trim(), pin });
      if (role !== member.role) {
        updateRole(member.id, role);
        log({
          category: 'SYSTEM', action: 'STAFF_ROLE_CHANGED',
          label:    `Đổi role ${member.name}: ${ROLE_META[member.role].label} → ${ROLE_META[role].label}`,
          outcome:  'SUCCESS', targetId: member.id, targetType: 'Staff',
          meta: { from: member.role, to: role },
        });
      } else {
        log({
          category: 'SYSTEM', action: 'STAFF_UPDATED',
          label:    `Cập nhật hồ sơ: ${name.trim()}`,
          outcome:  'SUCCESS', targetId: member.id, targetType: 'Staff',
        });
      }
    }
    setSaving(false);
    onClose();
  }

  const open = true;

  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent className="rounded-t-2xl bg-pos-surface px-0 pb-safe max-h-[92dvh] overflow-y-auto">
        <SheetHeader className="px-5 pt-2 pb-4">
          <SheetTitle className="text-base">
            {isNew ? 'Thêm nhân viên mới' : `Chỉnh sửa: ${member.name}`}
          </SheetTitle>
        </SheetHeader>

        <div className="px-5 space-y-4 pb-4">
          {/* Name */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Họ tên <span className="text-destructive">*</span>
            </label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nguyễn Văn A"
              className="bg-secondary border-pos-border"
            />
          </div>

          {/* Email */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Email <span className="text-destructive">*</span>
            </label>
            <Input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="staff@restaurant.vn"
              inputMode="email"
              type="email"
              className="bg-secondary border-pos-border"
              disabled={!isNew}
            />
          </div>

          {/* Role */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Vai trò <span className="text-destructive">*</span>
            </label>
            <div className="grid grid-cols-1 gap-2">
              {ALL_ROLES.map((r) => {
                const m = ROLE_META[r];
                return (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setRole(r)}
                    className={cn(
                      'flex items-center gap-3 px-4 py-3 rounded-xl border text-left transition-all',
                      role === r
                        ? 'border-primary/50 bg-primary/10'
                        : 'border-pos-border bg-secondary/50',
                    )}
                  >
                    <div className={cn('w-2.5 h-2.5 rounded-full shrink-0', m.bg)}>
                      <div className={cn('w-2.5 h-2.5 rounded-full', m.color.replace('text-', 'bg-'))} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={cn('text-sm font-medium', m.color)}>{m.label}</p>
                      <p className="text-xs text-muted-foreground truncate">{m.description}</p>
                    </div>
                    {role === r && <Check className="h-4 w-4 text-primary shrink-0" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* PIN */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Mật khẩu / PIN {isNew && <span className="text-destructive">*</span>}
            </label>
            <div className="flex gap-2">
              <Input
                value={pin}
                onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 8))}
                placeholder="4–8 chữ số"
                inputMode="numeric"
                type="text"
                className="bg-secondary border-pos-border font-mono tracking-widest"
              />
              <Button
                type="button"
                variant="secondary"
                size="icon"
                className="shrink-0"
                onClick={() => setPin(genPin())}
                title="Tạo PIN ngẫu nhiên"
              >
                <Key className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                variant="secondary"
                size="icon"
                className="shrink-0"
                onClick={copyPin}
                title="Sao chép PIN"
              >
                {copied
                  ? <Check className="h-4 w-4 text-pos-green" />
                  : <Copy className="h-4 w-4" />
                }
              </Button>
            </div>
            {isNew && (
              <p className="text-xs text-pos-amber">
                Hiện PIN cho nhân viên ngay bây giờ — sẽ không hiển thị lại sau khi lưu.
              </p>
            )}
          </div>

          {error && (
            <p className="text-sm text-destructive bg-destructive/10 rounded-xl px-3 py-2">
              {error}
            </p>
          )}

          <Button
            className="w-full mt-2"
            onClick={handleSave}
            disabled={saving}
          >
            {saving
              ? <span className="flex items-center gap-2">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Đang lưu…
                </span>
              : isNew ? 'Tạo tài khoản' : 'Lưu thay đổi'
            }
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}

// ── Permission Override Sheet ─────────────────────────────────────────────────
// Groups permissions the same way rbac-info does for consistency
const PERM_GROUPS: { group: string; perms: Permission[] }[] = [
  { group: 'Bàn',           perms: ['tables:view', 'tables:change_status'] },
  { group: 'Gọi món',       perms: ['orders:view', 'orders:create', 'orders:mark_served', 'checkout:confirm'] },
  { group: 'Bếp (KDS)',     perms: ['kds:view', 'kds:update_status'] },
  { group: 'Thực đơn',      perms: ['menu:view', 'menu:toggle86', 'menu:edit', 'menu:create'] },
  { group: 'Nhà hàng',      perms: ['restaurant:view', 'restaurant:edit'] },
  { group: 'Nhân viên',     perms: ['staff:view', 'staff:create', 'staff:edit_role', 'staff:delete'] },
  { group: 'Audit & Hệ thống', perms: ['audit:view', 'audit:clear'] },
  { group: 'Điều hướng',    perms: ['nav:tables', 'nav:kitchen', 'nav:menu', 'nav:restaurant', 'nav:settings', 'nav:audit', 'nav:staff'] },
];

const PERM_LABELS: Partial<Record<Permission, string>> = {
  'tables:view': 'Xem bàn', 'tables:change_status': 'Đổi trạng thái bàn',
  'orders:view': 'Xem order', 'orders:create': 'Gọi thêm món',
  'orders:mark_served': 'Đánh dấu phục vụ', 'checkout:confirm': 'Xác nhận thanh toán',
  'kds:view': 'Xem KDS', 'kds:update_status': 'Cập nhật trạng thái bếp',
  'menu:view': 'Xem thực đơn', 'menu:toggle86': 'Bật/tắt hết hàng',
  'menu:edit': 'Sửa món', 'menu:create': 'Tạo món mới',
  'restaurant:view': 'Xem nhà hàng', 'restaurant:edit': 'Sửa nhà hàng',
  'staff:view': 'Xem nhân viên', 'staff:create': 'Tạo tài khoản',
  'staff:edit_role': 'Phân quyền', 'staff:delete': 'Xoá tài khoản',
  'audit:view': 'Xem Audit Log', 'audit:clear': 'Xoá Audit Log',
  'nav:tables': 'Tab Bàn', 'nav:kitchen': 'Tab Bếp', 'nav:menu': 'Tab Thực đơn',
  'nav:restaurant': 'Tab Nhà hàng', 'nav:settings': 'Tab Cài đặt',
  'nav:audit': 'Tab Audit', 'nav:staff': 'Tab Nhân viên',
};

interface PermOverrideSheetProps {
  member:  StaffMember;
  onClose: () => void;
}

function PermissionOverrideSheet({ member, onClose }: PermOverrideSheetProps) {
  const setPermissionOverrides = useStaffStore((s) => s.setPermissionOverrides);
  const { log } = useAuditLog();

  const roleDefaults = useMemo(() => getPermissions(member.role), [member.role]);

  // Local working copies
  const [grants,  setGrants]  = useState<Set<Permission>>(new Set(member.permissionGrants));
  const [revokes, setRevokes] = useState<Set<Permission>>(new Set(member.permissionRevokes));

  // Effective preview
  const effective = useMemo(
    () => getEffectivePermissions(member.role, [...grants], [...revokes]),
    [member.role, grants, revokes],
  );

  function toggle(perm: Permission) {
    const inDefault  = roleDefaults.has(perm);
    const isGranted  = grants.has(perm);
    const isRevoked  = revokes.has(perm);

    if (inDefault) {
      // Default permission → toggling removes it (revoke) or restores it
      if (isRevoked) {
        setRevokes((s) => { const n = new Set(s); n.delete(perm); return n; });
      } else {
        setRevokes((s) => new Set([...s, perm]));
      }
    } else {
      // Non-default → toggling grants or un-grants it
      if (isGranted) {
        setGrants((s) => { const n = new Set(s); n.delete(perm); return n; });
      } else {
        setGrants((s) => new Set([...s, perm]));
      }
    }
  }

  function handleSave() {
    const g = [...grants];
    const r = [...revokes];
    setPermissionOverrides(member.id, g, r);
    log({
      category:   'SYSTEM',
      action:     'STAFF_PERMS_UPDATED',
      label:      `Cập nhật quyền tùy chỉnh: ${member.name} (+${g.length} / -${r.length})`,
      outcome:    'SUCCESS',
      targetId:   member.id,
      targetType: 'Staff',
      meta:       { grants: g, revokes: r },
    });
    onClose();
  }

  function handleReset() {
    setGrants(new Set());
    setRevokes(new Set());
  }

  const hasChanges = grants.size > 0 || revokes.size > 0;
  const hasOverrides = member.permissionGrants.length > 0 || member.permissionRevokes.length > 0;

  return (
    <Sheet open onOpenChange={(v) => !v && onClose()}>
      <SheetContent className="bg-pos-surface px-0 pb-safe max-h-[96dvh] flex flex-col">
        <SheetHeader className="px-5 pt-2 pb-3 shrink-0">
          <SheetTitle className="text-base">Quyền tùy chỉnh</SheetTitle>
          <p className="text-xs text-muted-foreground">
            {member.name} · <span className={cn('font-medium', ROLE_META[member.role].color)}>{ROLE_META[member.role].label}</span>
          </p>
        </SheetHeader>

        {/* Legend */}
        <div className="px-5 pb-3 shrink-0 flex flex-wrap gap-2 text-[10px]">
          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-pos-green/80 inline-block" />Mặc định (role)</span>
          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-primary inline-block" />Cấp thêm</span>
          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-destructive/70 inline-block" />Bị thu hồi</span>
          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-white/15 inline-block" />Không có</span>
        </div>

        {/* Permission groups — scrollable */}
        <div className="flex-1 overflow-y-auto px-5 space-y-4 pb-4">
          {PERM_GROUPS.map(({ group, perms }) => (
            <div key={group}>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                {group}
              </p>
              <div className="bg-card rounded-xl overflow-hidden ring-1 ring-pos-border">
                {perms.map((perm) => {
                  const inDefault  = roleDefaults.has(perm);
                  const isGranted  = grants.has(perm);
                  const isRevoked  = revokes.has(perm);
                  const isActive   = effective.has(perm);
                  const isCustom   = isGranted || isRevoked;

                  let dotColor = 'bg-white/15';
                  if (isActive && inDefault && !isRevoked) dotColor = 'bg-pos-green/80';
                  if (isActive && isGranted) dotColor = 'bg-primary';
                  if (!isActive && isRevoked) dotColor = 'bg-destructive/70';

                  return (
                    <button
                      key={perm}
                      type="button"
                      onClick={() => toggle(perm)}
                      className={cn(
                        'flex w-full items-center gap-3 px-3 py-3',
                        'border-b border-pos-border last:border-0 text-left',
                        'tap-scale transition-colors',
                        isActive ? 'text-foreground' : 'text-muted-foreground/50',
                      )}
                    >
                      <span className={cn('w-2.5 h-2.5 rounded-full shrink-0 transition-colors', dotColor)} />
                      <span className="flex-1 text-xs">
                        {PERM_LABELS[perm] ?? perm}
                      </span>
                      {isCustom && (
                        <span className={cn(
                          'text-[9px] font-bold px-1.5 py-0.5 rounded-full shrink-0',
                          isGranted ? 'bg-primary/20 text-primary' : 'bg-destructive/20 text-destructive',
                        )}>
                          {isGranted ? '+Cấp thêm' : '−Thu hồi'}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Footer actions */}
        <div className="px-5 pt-3 pb-2 shrink-0 border-t border-pos-border space-y-2">
          {(hasChanges || hasOverrides) && (
            <p className="text-xs text-center text-muted-foreground">
              +{grants.size} cấp thêm · −{revokes.size} thu hồi
            </p>
          )}
          <div className="flex gap-2">
            {(hasChanges || hasOverrides) && (
              <Button variant="secondary" className="flex-1" onClick={handleReset}>
                Về mặc định role
              </Button>
            )}
            <Button className="flex-1" onClick={handleSave}>
              Lưu quyền
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

// ── Staff row ─────────────────────────────────────────────────────────────────
function StaffRow({
  member,
  canEdit,
  onMenu,
}: {
  member:   StaffMember;
  canEdit:  boolean;
  onMenu:   () => void;
}) {
  const meta = ROLE_META[member.role];

  return (
    <div className={cn(
      'flex items-center gap-3 px-4 py-3.5',
      'border-b border-pos-border last:border-0',
      !member.active && 'opacity-50',
    )}>
      {/* Avatar */}
      <div className={cn(
        'flex h-10 w-10 shrink-0 items-center justify-center rounded-full',
        meta.bg, meta.color, 'text-sm font-bold',
      )}>
        {member.name.charAt(0).toUpperCase()}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="text-sm font-medium text-foreground truncate">{member.name}</p>
          {!member.active && (
            <span className="text-[9px] font-semibold bg-white/10 text-muted-foreground px-1.5 py-0.5 rounded-full shrink-0">
              Vô hiệu
            </span>
          )}
          {(member.permissionGrants.length > 0 || member.permissionRevokes.length > 0) && (
            <span className="text-[9px] font-semibold bg-primary/20 text-primary px-1.5 py-0.5 rounded-full shrink-0 flex items-center gap-0.5">
              <ShieldCheck className="h-2.5 w-2.5" /> Tùy chỉnh
            </span>
          )}
        </div>
        <p className="text-xs text-muted-foreground truncate">{member.email}</p>
        <span className={cn(
          'inline-block mt-0.5 text-[10px] font-semibold px-1.5 py-0.5 rounded-full',
          meta.bg, meta.color,
        )}>
          {meta.label}
        </span>
      </div>

      {/* Actions */}
      {canEdit && (
        <button
          type="button"
          onClick={onMenu}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-secondary text-muted-foreground tap-scale"
        >
          <MoreVertical className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}

// ── Staff action sheet ────────────────────────────────────────────────────────
function StaffActionSheet({
  member,
  onClose,
  onEdit,
  onPermissions,
  onToggle,
  onDelete,
}: {
  member:         StaffMember;
  onClose:        () => void;
  onEdit:         () => void;
  onPermissions:  () => void;
  onToggle:       () => void;
  onDelete:       () => void;
}) {
  const hasOverrides = member.permissionGrants.length > 0 || member.permissionRevokes.length > 0;
  return (
    <Sheet open onOpenChange={(v) => !v && onClose()}>
      <SheetContent className="rounded-t-2xl bg-pos-surface px-0 pb-safe">
        <SheetHeader className="px-5 pt-2 pb-4">
          <SheetTitle className="text-sm text-muted-foreground font-normal">
            {member.name} · {ROLE_META[member.role].label}
          </SheetTitle>
        </SheetHeader>
        <div className="divide-y divide-pos-border border-t border-pos-border">
          <button
            type="button"
            onClick={() => { onClose(); onEdit(); }}
            className="flex w-full items-center gap-4 px-5 py-4 text-foreground tap-scale"
          >
            <Key className="h-5 w-5 text-muted-foreground" />
            <span className="text-sm">Chỉnh sửa / Đổi role</span>
          </button>
          <button
            type="button"
            onClick={() => { onClose(); onPermissions(); }}
            className="flex w-full items-center gap-4 px-5 py-4 text-foreground tap-scale"
          >
            <ShieldCheck className="h-5 w-5 text-muted-foreground" />
            <div className="flex-1 text-left">
              <span className="text-sm">Quyền tùy chỉnh</span>
              {hasOverrides && (
                <span className="ml-2 text-[10px] font-semibold bg-primary/20 text-primary px-1.5 py-0.5 rounded-full">
                  +{member.permissionGrants.length} / −{member.permissionRevokes.length}
                </span>
              )}
            </div>
          </button>
          <button
            type="button"
            onClick={() => { onClose(); onToggle(); }}
            className="flex w-full items-center gap-4 px-5 py-4 text-foreground tap-scale"
          >
            {member.active
              ? <UserX className="h-5 w-5 text-muted-foreground" />
              : <UserCheck className="h-5 w-5 text-muted-foreground" />
            }
            <span className="text-sm">{member.active ? 'Vô hiệu hoá tài khoản' : 'Kích hoạt lại'}</span>
          </button>
          <button
            type="button"
            onClick={() => { onClose(); onDelete(); }}
            className="flex w-full items-center gap-4 px-5 py-4 text-destructive tap-scale"
          >
            <Trash2 className="h-5 w-5" />
            <span className="text-sm">Xoá tài khoản</span>
          </button>
          <button
            type="button"
            onClick={onClose}
            className="flex w-full items-center justify-center gap-2 px-5 py-4 text-muted-foreground tap-scale"
          >
            <X className="h-4 w-4" />
            <span className="text-sm">Huỷ</span>
          </button>
        </div>
      </SheetContent>
    </Sheet>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function StaffPage() {
  const { can }       = usePermission();
  const members       = useStaffStore((s) => s.members);
  const toggleActive  = useStaffStore((s) => s.toggleActive);
  const deleteMember  = useStaffStore((s) => s.deleteMember);
  const { log }       = useAuditLog();
  const currentUser   = useAuthStore((s) => s.user);

  const [search, setSearch]       = useState('');
  const [editTarget, setEdit]     = useState<StaffMember | null | undefined>(undefined);
  const [actionTarget, setAction] = useState<StaffMember | null>(null);
  const [permTarget,  setPermTarget] = useState<StaffMember | null>(null);
  const [confirmDelete, setDelConfirm] = useState<StaffMember | null>(null);

  if (!can('staff:view')) return <AccessDenied />;

  const canEdit = can('staff:create') || can('staff:edit_role');

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return members.filter(
      (m) => m.name.toLowerCase().includes(q) || m.email.toLowerCase().includes(q),
    );
  }, [members, search]);

  function handleToggle(member: StaffMember) {
    toggleActive(member.id);
    log({
      category: 'SYSTEM',
      action:   member.active ? 'STAFF_DEACTIVATED' : 'STAFF_ACTIVATED',
      label:    `${member.active ? 'Vô hiệu' : 'Kích hoạt'} tài khoản: ${member.name}`,
      outcome:  'SUCCESS',
      targetId: member.id, targetType: 'Staff',
    });
  }

  function handleDelete(member: StaffMember) {
    deleteMember(member.id);
    log({
      category: 'SYSTEM', action: 'STAFF_DELETED',
      label:    `Xoá tài khoản: ${member.name} (${ROLE_META[member.role].label})`,
      outcome:  'SUCCESS', targetId: member.id, targetType: 'Staff',
    });
    setDelConfirm(null);
  }

  const roleGroups = ALL_ROLES.map((r) => ({
    role: r,
    meta: ROLE_META[r],
    list: filtered.filter((m) => m.role === r),
  })).filter((g) => g.list.length > 0);

  return (
    <MobileAppLayout title="Quản lý nhân viên">
      <div className="px-4 pt-4 pb-32 space-y-4">

        {/* ── Search + Add ─────────────────────────────────────────────────── */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm tên hoặc email…"
              className="pl-9 bg-secondary border-pos-border"
            />
          </div>
          {can('staff:create') && (
            <Button
              size="icon"
              onClick={() => setEdit(null)}
              className="shrink-0 h-10 w-10"
            >
              <Plus className="h-5 w-5" />
            </Button>
          )}
        </div>

        {/* ── Staff list grouped by role ────────────────────────────────────── */}
        {roleGroups.length === 0 && (
          <div className="flex flex-col items-center justify-center gap-3 py-20 text-muted-foreground">
            <UserX className="h-10 w-10 opacity-30" />
            <p className="text-sm">Không tìm thấy nhân viên</p>
          </div>
        )}

        {roleGroups.map(({ role, meta, list }) => (
          <div key={role}>
            <div className="flex items-center gap-2 mb-2 px-1">
              <span className={cn('text-xs font-semibold uppercase tracking-wider', meta.color)}>
                {meta.label}
              </span>
              <span className="text-xs text-muted-foreground">({list.length})</span>
            </div>
            <div className="bg-card rounded-2xl overflow-hidden ring-1 ring-pos-border">
              {list.map((member) => (
                <StaffRow
                  key={member.id}
                  member={member}
                  canEdit={canEdit && member.id !== currentUser?.id}
                  onMenu={() => setAction(member)}
                />
              ))}
            </div>
          </div>
        ))}

        {/* ── Stats footer ─────────────────────────────────────────────────── */}
        <p className="text-xs text-muted-foreground text-center pt-2">
          {members.length} tài khoản • {members.filter((m) => m.active).length} đang hoạt động
        </p>
      </div>

      {/* ── Edit/Create sheet ────────────────────────────────────────────────── */}
      {editTarget !== undefined && (
        <EditStaffSheet
          member={editTarget}
          onClose={() => setEdit(undefined)}
        />
      )}

      {/* ── Action sheet ─────────────────────────────────────────────────────── */}
      {actionTarget && (
        <StaffActionSheet
          member={actionTarget}
          onClose={() => setAction(null)}
          onEdit={() => setEdit(actionTarget)}
          onPermissions={() => setPermTarget(actionTarget)}
          onToggle={() => handleToggle(actionTarget)}
          onDelete={() => setDelConfirm(actionTarget)}
        />
      )}

      {/* ── Permission override sheet ────────────────────────────────────────── */}
      {permTarget && (
        <PermissionOverrideSheet
          member={permTarget}
          onClose={() => setPermTarget(null)}
        />
      )}

      {/* ── Delete confirm sheet ─────────────────────────────────────────────── */}
      {confirmDelete && (
        <Sheet open onOpenChange={(v) => !v && setDelConfirm(null)}>
          <SheetContent className="rounded-t-2xl bg-pos-surface px-5 pb-safe">
            <SheetHeader className="pt-2 pb-4">
              <SheetTitle className="text-base">Xác nhận xoá tài khoản</SheetTitle>
            </SheetHeader>
            <p className="text-sm text-muted-foreground mb-6">
              Bạn có chắc muốn xoá tài khoản{' '}
              <span className="text-foreground font-medium">{confirmDelete.name}</span>?{' '}
              Hành động này không thể hoàn tác.
            </p>
            <div className="flex gap-3">
              <Button variant="secondary" className="flex-1" onClick={() => setDelConfirm(null)}>
                Huỷ
              </Button>
              <Button
                variant="destructive"
                className="flex-1"
                onClick={() => handleDelete(confirmDelete)}
              >
                <Trash2 className="h-4 w-4 mr-2" /> Xoá
              </Button>
            </div>
          </SheetContent>
        </Sheet>
      )}
    </MobileAppLayout>
  );
}
