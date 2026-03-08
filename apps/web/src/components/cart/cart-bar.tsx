'use client';
import { useState } from 'react';
import { ShoppingBag, Trash2 } from 'lucide-react';
import { useCartStore } from '@/store/cart.store';
import { usePlaceOrder } from '@/hooks/use-queries';
import { formatVND, cn } from '@/lib/utils';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface Props { totalItems: number; totalSatang: number }

export function CartBar({ totalItems, totalSatang }: Props) {
  const [sheetOpen,   setSheetOpen]   = useState(false);
  const [successOpen, setSuccessOpen] = useState(false);
  const { items, tableId, bookingId, clearCart, updateQuantity, removeItem } = useCartStore();
  const { mutateAsync: placeOrder, isPending } = usePlaceOrder();

  async function handlePlaceOrder() {
    if (!tableId) return;
    await placeOrder({
      tableId,
      bookingId: bookingId ?? undefined,
      items: items.map((i) => ({ menuItemId: i.menuItemId, quantity: i.quantity, notes: i.notes })),
    });
    clearCart();
    setSheetOpen(false);
    setSuccessOpen(true);
  }

  return (
    <>
      {/* ── Sticky bottom bar ─────────────────────────── */}
      <div className="fixed bottom-0 inset-x-0 z-30 mx-auto max-w-md px-3 pb-safe">
        <button
          onClick={() => setSheetOpen(true)}
          className="flex w-full items-center gap-3 rounded-2xl bg-[#1B6FEB] px-5 py-[18px] shadow-xl shadow-blue-400/30 tap-scale mb-2"
        >
          {/* Badge */}
          <div className="relative shrink-0">
            <ShoppingBag className="h-6 w-6 text-white" />
            <span className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-extrabold text-white leading-none">
              {totalItems}
            </span>
          </div>
          <span className="flex-1 text-left text-base font-bold text-white">
            {formatVND(totalSatang)}
          </span>
          <span className="text-sm font-semibold text-white/90">Gọi món →</span>
        </button>
      </div>

      {/* ── Cart review sheet ─────────────────────────── */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent side="bottom">
          <SheetHeader>
            <SheetTitle>Xác nhận gọi món</SheetTitle>
          </SheetHeader>

          <div className="px-5 pt-2 pb-2 max-h-[55dvh] overflow-y-auto no-scrollbar">
            {items.map((item) => (
              <div key={item.menuItemId} className="flex items-center gap-3 border-b border-border/60 py-3">
                {/* Name + variant */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground line-clamp-1">{item.name}</p>
                  {item.variantLabel && (
                    <p className="text-xs text-muted-foreground">{item.variantLabel}</p>
                  )}
                  {item.notes && (
                    <p className="text-xs text-muted-foreground italic">{item.notes}</p>
                  )}
                  <p className="mt-0.5 text-sm font-bold text-[#1B6FEB]">
                    {formatVND(item.priceSatang * item.quantity)}
                  </p>
                </div>
                {/* Qty stepper */}
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    onClick={() => updateQuantity(item.menuItemId, item.quantity - 1)}
                    className="flex h-8 w-8 items-center justify-center rounded-full border border-border tap-scale text-foreground"
                  >
                    <span className="text-base leading-none">−</span>
                  </button>
                  <span className="w-5 text-center text-sm font-bold tabular-nums">
                    {item.quantity}
                  </span>
                  <button
                    onClick={() => updateQuantity(item.menuItemId, item.quantity + 1)}
                    className="flex h-8 w-8 items-center justify-center rounded-full bg-[#1B6FEB] text-white tap-scale"
                  >
                    <span className="text-base leading-none">+</span>
                  </button>
                </div>
                {/* Remove */}
                <button
                  onClick={() => removeItem(item.menuItemId)}
                  className="ml-1 flex h-8 w-8 items-center justify-center rounded-full bg-red-50 text-red-400 tap-scale shrink-0"
                  aria-label="Xoá món"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>

          {/* Total + CTA */}
          <div className="px-5 pt-3">
            <div className="flex justify-between text-sm font-bold mb-4">
              <span className="text-muted-foreground">Tổng tạm tính</span>
              <span className="text-foreground text-base">{formatVND(totalSatang)}</span>
            </div>
            <Button
              size="lg"
              className="w-full bg-[#1B6FEB] text-[15px] font-bold shadow-md shadow-blue-300/30 tap-scale"
              onClick={handlePlaceOrder}
              disabled={isPending}
            >
              {isPending ? 'Đang gửi đơn...' : `Gọi món • ${formatVND(totalSatang)}`}
            </Button>
          </div>
        </SheetContent>
      </Sheet>

      {/* ── Success dialog ────────────────────────────── */}
      <Dialog open={successOpen} onOpenChange={setSuccessOpen}>
        <DialogContent>
          <DialogHeader>
            <div className="mx-auto mb-2 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500 text-3xl text-white shadow-lg">
              ✓
            </div>
            <DialogTitle>Yêu cầu gọi món thành công</DialogTitle>
            <DialogDescription className="mt-1 text-center leading-relaxed">
              Yêu cầu của bạn đã được gửi tới nhà hàng, nhân viên sẽ xác nhận đơn hàng trong ít phút.
              <br />
              <span className="mt-2 block text-xs">
                Lưu ý: Nếu đợi quá lâu hoặc có thay đổi đơn hàng, vui lòng sử dụng chức năng{' '}
                <strong>&quot;Gọi nhân viên&quot;</strong> ở trang chủ.
              </span>
            </DialogDescription>
          </DialogHeader>
          <Button
            size="lg"
            className="mt-4 w-full"
            onClick={() => setSuccessOpen(false)}
          >
            Xác nhận
          </Button>
        </DialogContent>
      </Dialog>
    </>
  );
}
