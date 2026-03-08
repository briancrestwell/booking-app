'use client';
import { useState } from 'react';
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  UtensilsCrossed, CheckCheck, CreditCard, Users, Clock, RefreshCw,
} from 'lucide-react';
import { cn, formatVND, formatTime } from '@/lib/utils';
import { useTableOrders, useMarkTableServed, useUpdateTableStatus } from '@/hooks/use-tables';
import { useToast } from '@/components/shared/Toast';
import { AddOrderSheet } from '@/components/tables/AddOrderSheet';
import type { MockTable, MockOrder } from '@/mock/seed';

// ── Order status badge mapping ─────────────────────────────────────────────────
const ORDER_STATUS: Record<string, { label: string; variant: string; dotColor: string }> = {
  PENDING:    { label: 'Chờ',        variant: 'pending',   dotColor: 'bg-pos-amber' },
  CONFIRMED:  { label: 'Xác nhận',   variant: 'confirmed', dotColor: 'bg-primary' },
  PREPARING:  { label: 'Đang nấu',   variant: 'preparing', dotColor: 'bg-pos-amber animate-pulse-dot' },
  READY:      { label: 'Sẵn sàng',   variant: 'ready',     dotColor: 'bg-pos-green' },
  SERVED:     { label: 'Đã phục vụ', variant: 'served',    dotColor: 'bg-muted-foreground' },
  CANCELLED:  { label: 'Đã huỷ',     variant: 'cancelled', dotColor: 'bg-destructive' },
};

// ── Single order row ──────────────────────────────────────────────────────────
function OrderRow({ order }: { order: MockOrder }) {
  const s = ORDER_STATUS[order.status] ?? ORDER_STATUS.PENDING;
  return (
    <div className="rounded-xl border border-pos-border bg-background p-3.5 space-y-2.5">
      {/* Header row */}
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs text-muted-foreground font-mono">
          #{order.id.slice(-6).toUpperCase()}
        </span>
        <span className="flex items-center gap-1.5">
          <span className={cn('h-2 w-2 rounded-full', s.dotColor)} />
          <Badge variant={s.variant as never} className="text-[10px] px-2 py-0.5">
            {s.label}
          </Badge>
        </span>
      </div>

      {/* Items */}
      <ul className="space-y-1">
        {order.items.map((item) => (
          <li key={item.id} className="flex items-center justify-between gap-2">
            <span className="text-sm text-foreground flex-1 truncate">
              {item.quantity}× {item.name}
            </span>
            <span className="text-sm text-muted-foreground shrink-0">
              {formatVND(item.unitSatang * item.quantity)}
            </span>
          </li>
        ))}
      </ul>

      {/* Order total */}
      <div className="flex items-center justify-between border-t border-pos-border pt-2">
        <span className="text-xs text-muted-foreground">Tổng đơn</span>
        <span className="text-sm font-semibold text-foreground">
          {formatVND(order.totalSatang)}
        </span>
      </div>
    </div>
  );
}

// ── Bill summary ──────────────────────────────────────────────────────────────
function BillSummary({ orders }: { orders: MockOrder[] }) {
  const TAX_RATE  = 0.08;
  const subtotal  = orders.reduce((s, o) => s + o.totalSatang, 0);
  const tax       = Math.round(subtotal * TAX_RATE);
  const total     = subtotal + tax;

  return (
    <div className="rounded-xl border border-primary/30 bg-primary/5 p-4 space-y-2">
      <p className="text-sm font-semibold text-foreground">Tóm tắt hoá đơn</p>
      <div className="space-y-1.5 text-sm">
        <div className="flex justify-between text-muted-foreground">
          <span>Tạm tính</span>
          <span>{formatVND(subtotal)}</span>
        </div>
        <div className="flex justify-between text-muted-foreground">
          <span>VAT (8%)</span>
          <span>{formatVND(tax)}</span>
        </div>
        <div className="flex justify-between font-bold text-foreground text-base border-t border-pos-border pt-2 mt-2">
          <span>Tổng cộng</span>
          <span className="text-primary">{formatVND(total)}</span>
        </div>
      </div>
    </div>
  );
}

// ── Main drawer ───────────────────────────────────────────────────────────────
interface TableDrawerProps {
  table:          MockTable | null;
  open:           boolean;
  onClose:        () => void;
  onCheckout:     (table: MockTable) => void;
}

export function TableDrawer({ table, open, onClose, onCheckout }: TableDrawerProps) {
  const { toast }         = useToast();
  const { data: orders = [], isLoading, refetch } = useTableOrders(table?.id ?? null);
  const markServed        = useMarkTableServed();
  const updateStatus      = useUpdateTableStatus();
  const [refreshing, setRefreshing]     = useState(false);
  const [addOrderOpen, setAddOrderOpen] = useState(false);

  const activeOrders = orders.filter(
    (o: MockOrder) => !['SERVED', 'CANCELLED'].includes(o.status),
  );
  const hasActiveOrders = activeOrders.length > 0;

  async function handleRefresh() {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }

  async function handleMarkServed() {
    if (!table) return;
    try {
      await markServed.mutateAsync(table.id);
      await updateStatus.mutateAsync({ tableId: table.id, status: 'CLEARING' });
      toast('Tất cả món đã được đánh dấu Phục vụ. Bàn đang dọn dẹp.', 'success');
    } catch {
      toast('Không thể cập nhật trạng thái.', 'error');
    }
  }

  function handleCheckout() {
    if (!table) return;
    onCheckout(table);
  }

  if (!table) return null;

  const isOccupied = ['OCCUPIED', 'CLEARING'].includes(table.status);

  return (
    <>
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent>
        {/* Header */}
        <SheetHeader className="border-b border-pos-border pb-4">
          <div className="flex items-start justify-between pr-10">
            <div>
              <SheetTitle>Bàn {table.number}</SheetTitle>
              <SheetDescription>{table.section}</SheetDescription>
            </div>
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Users className="h-3.5 w-3.5" />
                {table.capacity}
              </span>
              {table.currentBooking && (
                <span className="flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5" />
                  {formatTime(table.currentBooking.scheduledAt)}
                </span>
              )}
            </div>
          </div>
          {table.currentBooking && (
            <p className="text-sm font-medium text-foreground mt-1">
              👤 {table.currentBooking.guestName} · {table.currentBooking.guestCount} khách
            </p>
          )}
        </SheetHeader>

        {/* Scrollable orders list */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
          {/* Sub-header */}
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-foreground">
              Đơn hàng ({orders.length})
            </p>
            <button
              onClick={handleRefresh}
              className="flex items-center gap-1.5 text-xs text-muted-foreground tap-opacity"
              aria-label="Làm mới"
            >
              <RefreshCw className={cn('h-3.5 w-3.5', refreshing && 'animate-spin')} />
              Làm mới
            </button>
          </div>

          {isLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-28 rounded-xl" />
              <Skeleton className="h-28 rounded-xl" />
            </div>
          ) : orders.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground gap-2">
              <UtensilsCrossed className="h-8 w-8 opacity-30" />
              <p className="text-sm">Chưa có đơn hàng nào</p>
            </div>
          ) : (
            <>
              {orders.map((o: MockOrder) => <OrderRow key={o.id} order={o} />)}
              {/* Bill summary only when there are served/active orders */}
              {isOccupied && orders.length > 0 && (
                <BillSummary orders={orders} />
              )}
            </>
          )}
        </div>

        {/* Fixed action bar */}
        <div className="shrink-0 border-t border-pos-border px-5 py-4 pb-safe space-y-2.5">
          {/* Add Order — always visible */}
          <Button
            variant="outline"
            size="lg"
            className="w-full gap-2"
            onClick={() => setAddOrderOpen(true)}
          >
            <UtensilsCrossed className="h-4 w-4" />
            Gọi thêm món
          </Button>

          {/* Mark Served — only when there are active (non-served) orders */}
          {hasActiveOrders && (
            <Button
              variant="secondary"
              size="lg"
              className="w-full gap-2"
              disabled={markServed.isPending || updateStatus.isPending}
              onClick={handleMarkServed}
            >
              {markServed.isPending ? (
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
              ) : (
                <CheckCheck className="h-4 w-4" />
              )}
              Đánh dấu Phục vụ xong
            </Button>
          )}

          {/* Checkout — visible when table is occupied or clearing */}
          {isOccupied && (
            <Button
              size="lg"
              className="w-full gap-2 bg-pos-green hover:bg-pos-green/90 text-white"
              onClick={handleCheckout}
            >
              <CreditCard className="h-4 w-4" />
              Thanh toán
            </Button>
          )}
        </div>
      </SheetContent>
    </Sheet>

    {/* Add-order sub-sheet — rendered outside main sheet to avoid stacking issues */}
    {table && (
      <AddOrderSheet
        tableId={table.id}
        tableNumber={table.number}
        open={addOrderOpen}
        onClose={() => setAddOrderOpen(false)}
      />
    )}
  </>
  );
}
