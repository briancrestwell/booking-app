'use client';
import { ArrowLeft, RefreshCw } from 'lucide-react';
import Link from 'next/link';
import { useTableOrders } from '@/hooks/use-queries';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { formatVND, formatTime, cn } from '@/lib/utils';
import { useSocket } from '@/hooks/use-socket';

import { MOCK_TABLE_ID, MOCK_BRANCH_ID } from '@/mock/seed';
import { IS_MOCK } from '@/api/client';

const TABLE_ID  = IS_MOCK ? MOCK_TABLE_ID : 'demo-table-id';
const BRANCH_ID = IS_MOCK ? MOCK_BRANCH_ID : (process.env.NEXT_PUBLIC_DEMO_BRANCH_ID ?? 'demo-branch');

type OrderItem = { menuItem: { name: string }; quantity: number; notes?: string };
type Order = { id: string; status: string; totalSatang: number; createdAt: string; items: OrderItem[] };

const STATUS_MAP: Record<string, {
  label: string;
  variant: 'pending' | 'confirmed' | 'preparing' | 'ready' | 'served' | 'cancelled';
  dot: string;
}> = {
  PENDING:   { label: 'Chờ nhận đơn',  variant: 'pending',   dot: 'bg-orange-400' },
  CONFIRMED: { label: 'Đã xác nhận',   variant: 'confirmed', dot: 'bg-emerald-400' },
  PREPARING: { label: 'Đang chuẩn bị', variant: 'preparing', dot: 'bg-blue-400' },
  READY:     { label: 'Sẵn sàng',      variant: 'ready',     dot: 'bg-emerald-500' },
  SERVED:    { label: 'Đã phục vụ',    variant: 'served',    dot: 'bg-gray-400' },
  CANCELLED: { label: 'Đã huỷ',        variant: 'cancelled', dot: 'bg-red-400' },
};

export default function OrderHistoryPage() {
  useSocket(BRANCH_ID);
  const { data: orders, isLoading, refetch, isFetching } = useTableOrders(TABLE_ID);

  return (
    <div className="flex h-screen-safe flex-col bg-[#f2f3f7] select-none">

      {/* ── Header ─────────────────────────────────── */}
      <header className="flex h-14 items-center gap-2 bg-white px-4 shadow-sm">
        <Link
          href="/"
          className="flex h-11 w-11 items-center justify-center rounded-full tap-scale"
          aria-label="Quay lại"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="flex-1 text-center text-[17px] font-semibold">Lịch sử gọi món</h1>
        <button
          onClick={() => refetch()}
          className="flex h-11 w-11 items-center justify-center rounded-full tap-scale"
          aria-label="Tải lại"
        >
          <RefreshCw className={cn('h-4 w-4 text-muted-foreground', isFetching && 'animate-spin')} />
        </button>
      </header>

      {/* ── Content ────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto no-scrollbar">
        <div className="p-4 space-y-3">
          {isLoading
            ? Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="rounded-2xl bg-white p-4 space-y-3 shadow-sm">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-full" />
                  <Skeleton className="h-3 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              ))
            : (orders as Order[] | undefined)?.length === 0
              ? (
                <div className="mt-20 flex flex-col items-center gap-3 text-muted-foreground">
                  <span className="text-4xl">🍽️</span>
                  <p className="text-sm font-medium">Chưa có đơn hàng nào.</p>
                </div>
              )
              : (orders as Order[]).map((order) => {
                  const s = STATUS_MAP[order.status] ?? { label: order.status, variant: 'pending' as const, dot: 'bg-gray-400' };
                  return (
                    <div key={order.id} className="overflow-hidden rounded-2xl bg-white shadow-sm">
                      {/* Card header */}
                      <div className="flex items-center gap-2 border-b border-border/60 px-4 py-3">
                        <span className={cn('h-2 w-2 shrink-0 rounded-full', s.dot)} />
                        <span className="flex-1 text-sm font-semibold text-[#1B6FEB]">
                          Gọi món {formatTime(order.createdAt)}
                        </span>
                        <Badge variant={s.variant} className="text-[11px]">
                          {s.label}
                        </Badge>
                      </div>
                      {/* Items */}
                      <div className="px-4 py-3 space-y-2.5">
                        {order.items.map((item, idx) => (
                          <div key={idx} className="flex items-start justify-between gap-2 text-sm">
                            <div className="min-w-0">
                              <p className="font-semibold text-foreground leading-snug">
                                {item.menuItem.name}
                                <span className="font-normal text-muted-foreground"> (x{item.quantity})</span>
                              </p>
                              {item.notes && (
                                <p className="mt-0.5 text-xs text-muted-foreground">Topping: {item.notes}</p>
                              )}
                            </div>
                          </div>
                        ))}
                        {/* Total */}
                        <div className="flex items-center justify-between border-t border-border/60 pt-2.5 text-sm">
                          <span className="font-medium text-muted-foreground">Tổng tạm tính</span>
                          <span className="font-bold text-foreground">{formatVND(order.totalSatang)}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
        </div>
      </div>
    </div>
  );
}
