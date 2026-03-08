'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  LogOut, Bell, Info, ChevronRight, ShieldAlert,
  Store, Users, Shield,
} from 'lucide-react';
import { MobileAppLayout } from '@/components/layout/MobileAppLayout';
import { useAuthStore } from '@/store/auth.store';
import { useAuditLog } from '@/hooks/use-audit-log';
import { usePermission } from '@/hooks/use-permission';
import { useKdsStore } from '@/store/kds.store';
import { ROLE_META } from '@/lib/rbac';
import { cn } from '@/lib/utils';
import { ProfileSheet } from '@/components/settings/ProfileSheet';
import { NotificationsSheet } from '@/components/settings/NotificationsSheet';

// ── Reusable row ──────────────────────────────────────────────────────────────
function SettingsRow({
  icon: Icon,
  label,
  sublabel,
  onClick,
  destructive = false,
  rightEl,
}: {
  icon:         React.ElementType;
  label:        string;
  sublabel?:    string;
  onClick?:     () => void;
  destructive?: boolean;
  rightEl?:     React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex w-full items-center gap-4 px-4 py-4 tap-scale',
        'border-b border-pos-border last:border-0',
        destructive ? 'text-destructive' : 'text-foreground',
      )}
    >
      <div className={cn(
        'flex h-9 w-9 shrink-0 items-center justify-center rounded-xl',
        destructive ? 'bg-destructive/10' : 'bg-secondary',
      )}>
        <Icon className="h-[18px] w-[18px]" />
      </div>
      <div className="flex-1 text-left">
        <p className="text-sm font-medium">{label}</p>
        {sublabel && <p className="text-xs text-muted-foreground mt-0.5">{sublabel}</p>}
      </div>
      {rightEl ?? (
        !destructive && <ChevronRight className="h-4 w-4 text-muted-foreground/50 shrink-0" />
      )}
    </button>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function SettingsPage() {
  const router      = useRouter();
  const user        = useAuthStore((s) => s.user);
  const logout      = useAuthStore((s) => s.logout);
  const soundEnabled = useKdsStore((s) => s.soundEnabled);
  const { log }     = useAuditLog();
  const { can }     = usePermission();

  const [profileOpen, setProfileOpen] = useState(false);
  const [notifOpen,   setNotifOpen]   = useState(false);

  function handleLogout() {
    log({
      category: 'AUTH', action: 'LOGOUT',
      label:    `Đăng xuất: ${user?.name ?? ''}`,
      outcome:  'SUCCESS', targetType: 'Session',
    });
    logout();
    document.cookie = 'admin_token=; path=/; max-age=0';
    router.replace('/login');
  }

  const roleMeta = user?.role ? ROLE_META[user.role] : null;

  return (
    <MobileAppLayout title="Cài đặt">
      <div className="px-0 pt-4 space-y-5 pb-32">

        {/* ── User profile card ────────────────────────────────────────────── */}
        <button
          type="button"
          onClick={() => setProfileOpen(true)}
          className="mx-4 flex w-[calc(100%-2rem)] items-center gap-4 rounded-2xl bg-secondary px-4 py-4 tap-scale text-left"
        >
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary/20 text-primary text-lg font-bold">
            {user?.name?.charAt(0)?.toUpperCase() ?? 'S'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-foreground truncate">
              {user?.name ?? 'Nhân viên'}
            </p>
            <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
            {roleMeta && (
              <span className={cn(
                'mt-0.5 inline-block text-[10px] font-semibold px-1.5 py-0.5 rounded-full',
                roleMeta.bg, roleMeta.color,
              )}>
                {roleMeta.label}
              </span>
            )}
          </div>
          <ChevronRight className="h-4 w-4 text-muted-foreground/40 shrink-0" />
        </button>

        {/* ── Preferences ──────────────────────────────────────────────────── */}
        <div className="bg-card rounded-2xl mx-4 overflow-hidden ring-1 ring-pos-border">
          <SettingsRow
            icon={Bell}
            label="Thông báo"
            sublabel={soundEnabled ? 'Âm thanh, rung, banner' : 'Đã tắt tiếng'}
            onClick={() => setNotifOpen(true)}
            rightEl={
              <span className={cn(
                'text-xs font-medium px-2 py-0.5 rounded-full',
                soundEnabled
                  ? 'bg-pos-green/15 text-pos-green'
                  : 'bg-white/10 text-white/40',
              )}>
                {soundEnabled ? 'Bật' : 'Tắt'}
              </span>
            }
          />
        </div>

        {/* ── Admin section (Manager+) ──────────────────────────────────────── */}
        {can('restaurant:view') && (
          <div className="bg-card rounded-2xl mx-4 overflow-hidden ring-1 ring-pos-border">
            <Link href="/restaurant" className="block">
              <SettingsRow
                icon={Store}
                label="Nhà hàng"
                sublabel="Tên, logo, giờ mở cửa, màu thương hiệu"
              />
            </Link>

            {can('staff:view') && (
              <Link href="/staff" className="block">
                <SettingsRow
                  icon={Users}
                  label="Quản lý nhân viên"
                  sublabel="Tài khoản, phân quyền, PIN"
                />
              </Link>
            )}
          </div>
        )}

        {/* ── System ───────────────────────────────────────────────────────── */}
        <div className="bg-card rounded-2xl mx-4 overflow-hidden ring-1 ring-pos-border">
          <SettingsRow
            icon={Info}
            label="Phiên bản"
            sublabel="POS Admin v1.0.0"
            rightEl={<span className="text-xs text-muted-foreground/50">v1.0.0</span>}
          />
          {can('audit:view') && (
            <Link href="/audit" className="block">
              <SettingsRow
                icon={ShieldAlert}
                label="Audit Log"
                sublabel="Lịch sử hoạt động nhân viên"
              />
            </Link>
          )}
          <Link href="/rbac-info" className="block">
            <SettingsRow
              icon={Shield}
              label="Quyền của tôi"
              sublabel={roleMeta?.description ?? 'Xem quyền được cấp'}
            />
          </Link>
        </div>

        {/* ── Danger zone ──────────────────────────────────────────────────── */}
        <div className="bg-card rounded-2xl mx-4 overflow-hidden ring-1 ring-pos-border">
          <SettingsRow
            icon={LogOut}
            label="Đăng xuất"
            destructive
            onClick={handleLogout}
          />
        </div>
      </div>

      {/* ── Sheets ───────────────────────────────────────────────────────── */}
      <ProfileSheet       open={profileOpen} onClose={() => setProfileOpen(false)} />
      <NotificationsSheet open={notifOpen}   onClose={() => setNotifOpen(false)}   />
    </MobileAppLayout>
  );
}
