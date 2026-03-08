'use client';
import { useState } from 'react';
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetClose,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { CreditCard, Banknote, QrCode, CheckCircle2 } from 'lucide-react';
import { cn, formatVND } from '@/lib/utils';
import { useTableOrders, useConfirmPayment } from '@/hooks/use-tables';
import { useToast } from '@/components/shared/Toast';
import type { MockTable, MockOrder } from '@/mock/seed';

type PaymentMethod = 'cash' | 'card' | 'qr';

const PAYMENT_METHODS: { id: PaymentMethod; label: string; icon: React.ElementType }[] = [
  { id: 'cash', label: 'Tiền mặt', icon: Banknote  },
  { id: 'card', label: 'Thẻ',      icon: CreditCard },
  { id: 'qr',   label: 'QR Code',  icon: QrCode     },
];

interface CheckoutSheetProps {
  table:   MockTable | null;
  open:    boolean;
  onClose: () => void;
}

export function CheckoutSheet({ table, open, onClose }: CheckoutSheetProps) {
  const { toast }                    = useToast();
  const { data: orders = [] }        = useTableOrders(table?.id ?? null);
  const confirmPayment               = useConfirmPayment();
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [success, setSuccess]        = useState(false);

  const TAX_RATE = 0.08;
  const subtotal = (orders as MockOrder[]).reduce((s, o) => s + o.totalSatang, 0);
  const tax      = Math.round(subtotal * TAX_RATE);
  const total    = subtotal + tax;

  async function handleConfirm() {
    if (!table) return;
    try {
      await confirmPayment.mutateAsync(table.id);
      setSuccess(true);
      toast(`Bàn ${table.number} đã thanh toán thành công! Bàn được giải phóng.`, 'success');
      // Auto-close after 1.5 s
      setTimeout(() => {
        setSuccess(false);
        onClose();
      }, 1500);
    } catch {
      toast('Thanh toán thất bại. Thử lại.', 'error');
    }
  }

  if (!table) return null;

  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent>
        {success ? (
          /* ── Success state ──────────────────────────────────────────────── */
          <div className="flex flex-1 flex-col items-center justify-center gap-4 py-16">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-pos-green/15">
              <CheckCircle2 className="h-10 w-10 text-pos-green" />
            </div>
            <div className="text-center space-y-1">
              <p className="text-xl font-bold text-foreground">Thanh toán thành công!</p>
              <p className="text-sm text-muted-foreground">
                Bàn {table.number} đã được giải phóng
              </p>
              <p className="text-2xl font-extrabold text-primary mt-2">
                {formatVND(total)}
              </p>
            </div>
          </div>
        ) : (
          <>
            {/* ── Header ──────────────────────────────────────────────────── */}
            <SheetHeader className="border-b border-pos-border pb-4">
              <SheetTitle>Thanh toán — Bàn {table.number}</SheetTitle>
              <SheetDescription>{table.currentBooking?.guestName ?? 'Khách vãng lai'}</SheetDescription>
            </SheetHeader>

            {/* ── Bill detail (scrollable) ─────────────────────────────────── */}
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
              {/* Line items */}
              <div className="space-y-1">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                  Chi tiết hoá đơn
                </p>
                {(orders as MockOrder[]).flatMap((o) => o.items).map((item) => (
                  <div key={item.id} className="flex items-center justify-between gap-2 py-1">
                    <span className="text-sm text-foreground flex-1 truncate">
                      {item.quantity}× {item.name}
                    </span>
                    <span className="text-sm text-muted-foreground shrink-0">
                      {formatVND(item.unitSatang * item.quantity)}
                    </span>
                  </div>
                ))}
              </div>

              {/* Totals */}
              <div className="rounded-xl border border-pos-border bg-background p-4 space-y-2 text-sm">
                <div className="flex justify-between text-muted-foreground">
                  <span>Tạm tính</span>
                  <span>{formatVND(subtotal)}</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>VAT (8%)</span>
                  <span>{formatVND(tax)}</span>
                </div>
                <div className="flex justify-between font-bold text-foreground text-base border-t border-pos-border pt-2 mt-1">
                  <span>Tổng cộng</span>
                  <span className="text-primary text-lg">{formatVND(total)}</span>
                </div>
              </div>

              {/* Payment method selector */}
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Phương thức thanh toán
                </p>
                <div className="grid grid-cols-3 gap-2">
                  {PAYMENT_METHODS.map((m) => {
                    const Icon      = m.icon;
                    const isSelected = paymentMethod === m.id;
                    return (
                      <button
                        key={m.id}
                        onClick={() => setPaymentMethod(m.id)}
                        className={cn(
                          'flex flex-col items-center justify-center gap-2',
                          'rounded-xl border p-3 tap-scale',
                          'transition-all duration-150',
                          isSelected
                            ? 'border-primary bg-primary/10 text-primary'
                            : 'border-pos-border bg-background text-muted-foreground',
                        )}
                      >
                        <Icon className="h-5 w-5" />
                        <span className="text-xs font-medium">{m.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* ── Fixed CTA ────────────────────────────────────────────────── */}
            <div className="shrink-0 border-t border-pos-border px-5 py-4 pb-safe space-y-2.5">
              <Button
                size="lg"
                className="w-full gap-2 bg-pos-green hover:bg-pos-green/90 text-white text-base"
                disabled={confirmPayment.isPending}
                onClick={handleConfirm}
              >
                {confirmPayment.isPending ? (
                  <span className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                ) : (
                  <CreditCard className="h-5 w-5" />
                )}
                Xác nhận thanh toán · {formatVND(total)}
              </Button>

              <SheetClose asChild>
                <Button variant="ghost" size="lg" className="w-full text-muted-foreground">
                  Huỷ
                </Button>
              </SheetClose>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
