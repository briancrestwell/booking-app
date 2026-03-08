'use client';
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription,
} from '@/components/ui/sheet';
import { useKdsStore } from '@/store/kds.store';
import { usePermission } from '@/hooks/use-permission';
import { ROLE_META } from '@/lib/rbac';
import {
  Volume2, VolumeX, Vibrate, Bell, BellOff,
  ChefHat, UtensilsCrossed, CreditCard, ShieldAlert,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface Props { open: boolean; onClose: () => void }

export function NotificationsSheet({ open, onClose }: Props) {
  // ── Store state ────────────────────────────────────────────────────────────
  const soundEnabled          = useKdsStore((s) => s.soundEnabled);
  const vibrateEnabled        = useKdsStore((s) => s.vibrateEnabled);
  const bannerEnabled         = useKdsStore((s) => s.bannerEnabled);
  const notifyOrderNew        = useKdsStore((s) => s.notifyOrderNew);
  const notifyOrderReady      = useKdsStore((s) => s.notifyOrderReady);
  const notifyCheckout        = useKdsStore((s) => s.notifyCheckout);
  const notifySystemAlert     = useKdsStore((s) => s.notifySystemAlert);

  const toggleSound               = useKdsStore((s) => s.toggleSound);
  const toggleVibrate             = useKdsStore((s) => s.toggleVibrate);
  const toggleBanner              = useKdsStore((s) => s.toggleBanner);
  const toggleNotifyOrderNew      = useKdsStore((s) => s.toggleNotifyOrderNew);
  const toggleNotifyOrderReady    = useKdsStore((s) => s.toggleNotifyOrderReady);
  const toggleNotifyCheckout      = useKdsStore((s) => s.toggleNotifyCheckout);
  const toggleNotifySystemAlert   = useKdsStore((s) => s.toggleNotifySystemAlert);

  // ── RBAC ───────────────────────────────────────────────────────────────────
  const { can, role } = usePermission();
  const meta = role ? ROLE_META[role] : null;

  // Which event sections this user should see
  const showKds      = can('kds:view');          // Bếp + roles có kds:view
  const showOrders   = can('orders:view');       // Phục vụ, Thu ngân, Quản lý, SA
  const showCheckout = can('checkout:confirm');  // Thu ngân, Quản lý, SA
  const showAudit    = can('audit:view');        // Quản lý, SA

  // "Đơn mới vào bếp" — chỉ hiện khi có kds:view
  // "Đơn hàng mới" — chỉ hiện khi có orders:view nhưng KHÔNG có kds:view (waiter/cashier)
  // "Món sẵn sàng" — hiện khi kds:view hoặc orders:view
  // "Yêu cầu thanh toán" — chỉ checkout:confirm
  // "Cảnh báo hệ thống" — chỉ audit:view
  const hasAnyEvent = showKds || showOrders || showCheckout || showAudit;

  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent className="flex flex-col">
        <SheetHeader className="px-5 pb-3">
          <SheetTitle className="text-white text-lg font-semibold">Thông báo</SheetTitle>
          <SheetDescription className="sr-only">Tuỳ chỉnh âm thanh và thông báo</SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-5 pb-12 space-y-6">

          {/* ── Role badge ─────────────────────────────────────────────────── */}
          {meta && (
            <div className={cn('flex items-center gap-2 rounded-xl px-3 py-2.5 text-xs', meta.bg)}>
              <span className={cn('font-semibold', meta.color)}>{meta.label}</span>
              <span className="text-muted-foreground">— thông báo được lọc theo quyền của bạn</span>
            </div>
          )}

          {/* ── Hardware — luôn hiển thị cho mọi role ─────────────────────── */}
          <Section title="Thiết bị">
            <ToggleRow
              icon={soundEnabled ? Volume2 : VolumeX}
              label="Âm thanh"
              sublabel="Phát tiếng khi có sự kiện quan trọng"
              checked={soundEnabled}
              onToggle={toggleSound}
            />
            <ToggleRow
              icon={Vibrate}
              label="Rung"
              sublabel="Rung thiết bị khi có thông báo"
              checked={vibrateEnabled}
              onToggle={() => {
                toggleVibrate();
                if (!vibrateEnabled && typeof navigator !== 'undefined' && navigator.vibrate) {
                  navigator.vibrate(200);
                }
              }}
            />
            <ToggleRow
              icon={bannerEnabled ? Bell : BellOff}
              label="Hiển thị banner"
              sublabel="Thông báo nổi ở đầu màn hình"
              checked={bannerEnabled}
              onToggle={toggleBanner}
            />
          </Section>

          {/* ── Event types — lọc theo quyền ──────────────────────────────── */}
          {hasAnyEvent ? (
            <Section title="Loại sự kiện">

              {/* Đơn mới vào bếp — chỉ Bếp / roles có kds:view */}
              {showKds && (
                <ToggleRow
                  icon={ChefHat}
                  label="Đơn mới vào bếp"
                  sublabel="Bếp nhận đơn mới / bắt đầu chế biến"
                  checked={notifyOrderNew}
                  onToggle={toggleNotifyOrderNew}
                  roleColor={ROLE_META['KITCHEN'].color}
                />
              )}

              {/* Đơn hàng mới — Phục vụ / Thu ngân không có kds:view */}
              {showOrders && !showKds && (
                <ToggleRow
                  icon={Bell}
                  label="Đơn hàng mới"
                  sublabel="Có đơn mới được tạo cho bàn"
                  checked={notifyOrderNew}
                  onToggle={toggleNotifyOrderNew}
                  roleColor={ROLE_META['WAITER'].color}
                />
              )}

              {/* Món sẵn sàng phục vụ — Bếp + Phục vụ + Quản lý */}
              {(showKds || showOrders) && (
                <ToggleRow
                  icon={UtensilsCrossed}
                  label="Món sẵn sàng phục vụ"
                  sublabel="Bếp báo Ready — nhắc phục vụ mang ra bàn"
                  checked={notifyOrderReady}
                  onToggle={toggleNotifyOrderReady}
                  roleColor={ROLE_META['WAITER'].color}
                />
              )}

              {/* Yêu cầu thanh toán — Thu ngân, Quản lý, SA */}
              {showCheckout && (
                <ToggleRow
                  icon={CreditCard}
                  label="Yêu cầu thanh toán"
                  sublabel="Khách yêu cầu tính tiền / bàn chờ checkout"
                  checked={notifyCheckout}
                  onToggle={toggleNotifyCheckout}
                  roleColor={ROLE_META['CASHIER'].color}
                />
              )}

              {/* Cảnh báo hệ thống — Quản lý, SA */}
              {showAudit && (
                <ToggleRow
                  icon={ShieldAlert}
                  label="Cảnh báo hệ thống"
                  sublabel="Hoạt động bất thường hoặc lỗi nghiêm trọng"
                  checked={notifySystemAlert}
                  onToggle={toggleNotifySystemAlert}
                  roleColor={ROLE_META['MANAGER'].color}
                />
              )}
            </Section>
          ) : (
            <div className="rounded-xl bg-white/5 px-4 py-4 text-center">
              <p className="text-xs text-white/40">
                Role của bạn không có sự kiện cần theo dõi.
              </p>
            </div>
          )}

          <p className="text-xs text-white/25 text-center pb-2">
            Cài đặt được lưu tự động và giữ giữa các phiên.
          </p>
        </div>
      </SheetContent>
    </Sheet>
  );
}

// ── Internal helpers ──────────────────────────────────────────────────────────
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="mb-2 text-xs font-bold uppercase tracking-wider text-pos-brand">{title}</p>
      <div className="rounded-2xl bg-pos-surface overflow-hidden divide-y divide-white/5">
        {children}
      </div>
    </div>
  );
}

function ToggleRow({
  icon: Icon,
  label,
  sublabel,
  checked,
  onToggle,
  roleColor,
}: {
  icon:       React.ElementType;
  label:      string;
  sublabel:   string;
  checked:    boolean;
  onToggle:   () => void;
  roleColor?: string;
}) {
  return (
    <div className="flex items-center gap-3 px-4 py-3.5">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/10">
        <Icon className={cn('h-4 w-4', checked ? (roleColor ?? 'text-pos-brand') : 'text-white/40')} />
      </div>
      <div className="flex-1 min-w-0">
        <p className={cn('text-sm font-medium', checked ? 'text-white' : 'text-white/50')}>{label}</p>
        <p className="text-xs text-white/40 mt-0.5 leading-snug">{sublabel}</p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        onClick={onToggle}
        className={cn(
          'relative inline-flex h-6 w-11 shrink-0 rounded-full p-[2px]',
          'transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pos-brand',
          checked ? 'bg-[#22C55E]' : 'bg-white/20',
        )}
      >
        <span className={cn(
          'inline-block h-5 w-5 rounded-full bg-white shadow',
          'transition-transform duration-200',
          checked ? 'translate-x-5' : 'translate-x-0',
        )} />
      </button>
    </div>
  );
}
