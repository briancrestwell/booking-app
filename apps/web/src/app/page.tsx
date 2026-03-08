'use client';
import { useState, useEffect } from 'react';
import { Clock, UtensilsCrossed, Users, Pencil, MessageSquare, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { useSocket } from '@/hooks/use-socket';
import { useCartStore } from '@/store/cart.store';
import { useRestaurantInfo } from '@/hooks/use-restaurant-info';

import { MOCK_BRANCH_ID, MOCK_TABLE_ID } from '@/mock/seed';
import { IS_MOCK } from '@/api/client';

const BRANCH_ID = IS_MOCK ? MOCK_BRANCH_ID : (process.env.NEXT_PUBLIC_DEMO_BRANCH_ID ?? 'demo-branch');
const TABLE_NO = 4;
const SECTION = 'TRONG NHÀ';
const CALL_REASONS = ['Thiếu đồ bàn tớ', 'Cho tớ gọi thêm món nhé!'];

export default function HomePage() {
  useSocket(BRANCH_ID);
  const setContext = useCartStore((s) => s.setContext);
  useEffect(() => { setContext(IS_MOCK ? MOCK_TABLE_ID : 'demo-table-id'); }, [setContext]);

  const restaurant = useRestaurantInfo();

  const [staffOpen, setStaffOpen]     = useState(false);
  const [payOpen, setPayOpen]         = useState(false);
  const [hoursOpen, setHoursOpen]     = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [staffReason, setStaffReason] = useState('');
  const [payMethod, setPayMethod]     = useState<'cash' | 'online' | 'transfer'>('cash');
  const [guestName, setGuestName]     = useState('Quân');

  const today = new Date().getDay(); // 0=Sun … 6=Sat

  return (
    <div
      className="relative flex min-h-screen-safe flex-col bg-[#f2f3f7] select-none"
      style={{ '--brand-color': restaurant.brandColor || '#1B6FEB' } as React.CSSProperties}
    >

      {/* ── Hero ─────────────────────────────────────────── */}
      <div className={cn(
        'relative h-52 w-full overflow-hidden',
        `bg-gradient-to-br ${restaurant.heroGradient}`,
      )}>
        {restaurant.coverUrl && (
          <img
            src={restaurant.coverUrl}
            alt={restaurant.name}
            className="absolute inset-0 h-full w-full object-cover"
            onError={(e) => { (e.currentTarget as HTMLImageElement).hidden = true; }}
          />
        )}
        {/* Texture overlay */}
        <div className="absolute inset-0 opacity-20"
          style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23ffffff\' fill-opacity=\'0.4\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")' }}
        />
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-1">
          <span className="text-3xl font-extrabold tracking-widest text-white drop-shadow-lg text-center px-4">
            {restaurant.name}
          </span>
          <span className="text-xs font-medium tracking-[0.2em] text-amber-200 uppercase">
            {restaurant.subtitle}
          </span>
        </div>
      </div>

      {/* ── Info card ────────────────────────────────────── */}
      <div className="mx-3 -mt-5 rounded-[1.25rem] bg-white px-5 pt-5 pb-5 shadow-xl ring-1 ring-black/5">
        <h1 className="text-[17px] font-bold leading-snug text-foreground">
          {restaurant.name}{restaurant.subtitle ? ` - ${restaurant.subtitle.split('—')[0].trim()}` : ''}
        </h1>

        {/* Meta rows */}
        <div className="mt-3 space-y-2.5">
          {/* Opening hours */}
          <button
            onClick={() => setHoursOpen(true)}
            className="flex w-full items-center gap-2.5 tap-opacity"
          >
            <Clock className="h-[18px] w-[18px] shrink-0 text-brand" />
            <span className="flex-1 text-left text-sm text-muted-foreground">
              Giờ mở cửa: {restaurant.hours.every((h) => !h.closed) ? 'Cả tuần' : 'Xem lịch'}
            </span>
            <ChevronRight className="h-4 w-4 text-muted-foreground/60" />
          </button>

          {/* Table */}
          <div className="flex items-center gap-2.5">
            <UtensilsCrossed className="h-[18px] w-[18px] shrink-0 text-brand" />
            <span className="text-sm text-muted-foreground">{TABLE_NO} - {SECTION}</span>
          </div>

          {/* Guest */}
          <div className="flex items-center gap-2.5">
            <Users className="h-[18px] w-[18px] shrink-0 text-brand" />
            <span className="text-sm text-muted-foreground">{guestName}</span>
            <button
              onClick={() => setProfileOpen(true)}
              className="ml-0.5 flex h-7 w-7 items-center justify-center rounded-full bg-muted tap-scale"
              aria-label="Sửa thông tin"
            >
              <Pencil className="h-3.5 w-3.5 text-brand" />
            </button>
          </div>
        </div>

        {/* ── CTA section ── */}
        <p className="mt-5 text-center text-sm font-semibold text-foreground/70">
          Bạn đang cần hỗ trợ gì?
        </p>

        {/* Action grid */}
        <div className="mt-3 grid grid-cols-2 gap-3">
          <ActionCard
            emoji="👨‍💼"
            label="Gọi nhân viên"
            bg="bg-emerald-50"
            iconBg="bg-emerald-500"
            onClick={() => setStaffOpen(true)}
          />
          <ActionCard
            emoji="💰"
            label="Gọi thanh toán"
            bg="bg-amber-50"
            iconBg="bg-amber-400"
            onClick={() => setPayOpen(true)}
          />
        </div>

        {/* Menu CTA */}
        <Link href="/menu" className="mt-3 block">
          <button className="flex w-full items-center justify-center gap-2.5 rounded-2xl bg-[#1B6FEB] py-[18px] text-white font-bold text-[15px] tap-scale shadow-md shadow-brand/30">
            <span className="text-[22px] leading-none">🛍️</span>
            Thực đơn &amp; gọi món
          </button>
        </Link>
      </div>

      {/* ── Chat FAB ─────────────────────────────────────── */}
      <Link
        href="/feedback"
        aria-label="Phản hồi nhà hàng"
        className={cn(
          'fixed bottom-6 right-4 z-40',
          'flex h-14 w-14 items-center justify-center',
          'rounded-full bg-[#1B6FEB] shadow-lg shadow-brand/40',
          'tap-scale',
        )}
      >
        <MessageSquare className="h-6 w-6 text-white" />
      </Link>

      {/* ── Opening hours dialog ── */}
      <Dialog open={hoursOpen} onOpenChange={setHoursOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Thời gian mở cửa</DialogTitle>
          </DialogHeader>
          <div className="mt-3 divide-y divide-border/60">
            {restaurant.hours.map((h, i) => {
              // hours array: index 0 = Thứ 2 (Mon) … index 5 = Thứ 7 (Sat) … index 6 = Chủ nhật (Sun)
              const jsDay = i === 6 ? 0 : i + 1;
              const isToday = today === jsDay;
              return (
                <div key={h.day} className={cn(
                  'flex justify-between py-3.5 text-sm',
                  isToday ? 'font-bold text-[#1B6FEB]' : 'text-foreground',
                )}>
                  <span>{h.day}</span>
                  <span>{h.closed ? 'Đóng cửa' : `${h.open} – ${h.close}`}</span>
                </div>
              );
            })}
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Profile sheet ── */}
      <Sheet open={profileOpen} onOpenChange={setProfileOpen}>
        <SheetContent side="bottom">
          <SheetHeader><SheetTitle>Sửa thông tin của bạn</SheetTitle></SheetHeader>
          <div className="px-5 pt-4 space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-muted-foreground">Tên của bạn</label>
              <Input value={guestName} onChange={(e) => setGuestName(e.target.value)} placeholder="Tên của bạn" />
            </div>
            <div>
              <Input placeholder="Số điện thoại" type="tel" inputMode="tel" />
              <p className="mt-1.5 text-xs text-muted-foreground leading-relaxed">
                Nhập số điện thoại để được tích điểm và nhận các ưu đãi dành cho khách hàng.
              </p>
            </div>
            <Button size="lg" className="w-full" onClick={() => setProfileOpen(false)}>Lưu</Button>
          </div>
        </SheetContent>
      </Sheet>

      {/* ── Call staff sheet ── */}
      <Sheet open={staffOpen} onOpenChange={setStaffOpen}>
        <SheetContent side="bottom">
          <SheetHeader><SheetTitle>Gọi nhân viên</SheetTitle></SheetHeader>
          <div className="px-5 pt-4 space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-muted-foreground">Lý do gọi nhân viên</label>
              <Input
                value={staffReason}
                onChange={(e) => setStaffReason(e.target.value)}
                placeholder="Ví dụ: Lấy thêm bát đũa, dọn bàn,..."
              />
            </div>
            <div>
              <p className="mb-2.5 text-sm font-medium text-muted-foreground">Chọn nhanh lý do</p>
              <div className="flex flex-wrap gap-2">
                {CALL_REASONS.map((r) => (
                  <button
                    key={r}
                    onClick={() => setStaffReason(r)}
                    className={cn(
                      'rounded-full border px-4 py-2 text-sm font-medium tap-scale',
                      staffReason === r
                        ? 'border-[#1B6FEB] bg-[#1B6FEB]/10 text-[#1B6FEB]'
                        : 'border-border text-muted-foreground',
                    )}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>
            <Button size="lg" className="w-full" onClick={() => setStaffOpen(false)}>
              Gửi yêu cầu
            </Button>
          </div>
        </SheetContent>
      </Sheet>

      {/* ── Payment sheet ── */}
      <Sheet open={payOpen} onOpenChange={setPayOpen}>
        <SheetContent side="bottom">
          <SheetHeader><SheetTitle>Gọi thanh toán</SheetTitle></SheetHeader>
          <div className="px-5 pt-3 space-y-2.5">
            <p className="text-sm text-muted-foreground">Chọn phương thức thanh toán</p>
            {([
              { id: 'cash',     label: 'Tiền mặt',                  icon: '💵' },
              { id: 'online',   label: 'Bán online (chuyển khoản)', icon: '💳' },
              { id: 'transfer', label: 'Chuyển khoản',              icon: '🏦' },
            ] as const).map((m) => (
              <button
                key={m.id}
                onClick={() => setPayMethod(m.id)}
                className={cn(
                  'flex w-full items-center gap-3 rounded-2xl border p-4 tap-scale transition-colors',
                  payMethod === m.id ? 'border-[#1B6FEB] bg-[#1B6FEB]/5' : 'border-border bg-white',
                )}
              >
                <span className="text-2xl">{m.icon}</span>
                <span className="flex-1 text-left text-sm font-semibold">{m.label}</span>
                <span className={cn(
                  'h-5 w-5 rounded-full border-2 flex items-center justify-center shrink-0',
                  payMethod === m.id ? 'border-[#1B6FEB]' : 'border-muted-foreground/40',
                )}>
                  {payMethod === m.id && <span className="h-2.5 w-2.5 rounded-full bg-[#1B6FEB]" />}
                </span>
              </button>
            ))}
            <div className="pt-1">
              <Button size="lg" className="w-full" onClick={() => setPayOpen(false)}>
                Gửi yêu cầu
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}

/* ── Action card helper ─────────────────────────────── */
function ActionCard({
  emoji, label, bg, iconBg, onClick,
}: { emoji: string; label: string; bg: string; iconBg: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'flex flex-col items-center justify-center gap-2.5 rounded-2xl py-5 tap-scale',
        bg,
      )}
    >
      <span className={cn(
        'flex h-12 w-12 items-center justify-center rounded-full text-2xl',
        iconBg, 'text-white',
      )}>
        {emoji}
      </span>
      <span className="text-[13px] font-semibold text-foreground">{label}</span>
    </button>
  );
}
