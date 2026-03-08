'use client';
import { useMemo, useCallback } from 'react';
import { RefreshCw, ChefHat } from 'lucide-react';
import { MobileAppLayout } from '@/components/layout/MobileAppLayout';
import { KitchenOrderCard } from '@/components/kitchen/KitchenOrderCard';
import { KdsFilterBar } from '@/components/kitchen/KdsFilterBar';
import { SimulateNewOrderButton } from '@/components/kitchen/SimulateNewOrder';
import { Skeleton } from '@/components/ui/skeleton';
import { useKdsOrders, useKitchenUpdateStatus } from '@/hooks/use-kitchen';
import { useAdminSocket } from '@/hooks/use-admin-socket';
import { useKdsStore } from '@/store/kds.store';
import { useToast } from '@/components/shared/Toast';
import { IS_MOCK } from '@/api/client';
import { MOCK_BRANCH_ID } from '@/mock/seed';
import type { KitchenOrder, KitchenOrderStatus } from '@/mock/seed';
import { cn } from '@/lib/utils';

const BRANCH_ID = IS_MOCK
  ? MOCK_BRANCH_ID
  : (process.env.NEXT_PUBLIC_DEMO_BRANCH_ID ?? 'demo-branch');

// Status display ordering for the KDS queue
const STATUS_ORDER: Record<KitchenOrderStatus, number> = {
  PENDING:   0,
  CONFIRMED: 1,
  PREPARING: 2,
  READY:     3,
};

export default function KitchenPage() {
  const { toast }         = useToast();
  const statusFilter      = useKdsStore((s) => s.statusFilter);
  const soundEnabled      = useKdsStore((s) => s.soundEnabled);
  const vibrateEnabled    = useKdsStore((s) => s.vibrateEnabled);
  const notifyOrderNew    = useKdsStore((s) => s.notifyOrderNew);
  const notifyOrderReady  = useKdsStore((s) => s.notifyOrderReady);

  // ── Data ────────────────────────────────────────────────────────────────────
  const { data: orders = [], isLoading, isFetching, refetch } = useKdsOrders();
  const updateStatus = useKitchenUpdateStatus();

  // ── Socket (also handles new_order_kitchen) ─────────────────────────────────
  useAdminSocket(BRANCH_ID);

  // ── Filtered + sorted orders ────────────────────────────────────────────────
  const filtered = useMemo(() => {
    const list = statusFilter === 'ALL'
      ? [...orders]
      : orders.filter((o: KitchenOrder) => o.status === statusFilter);

    return list.sort((a: KitchenOrder, b: KitchenOrder) => {
      // Sort by status priority first, then by oldest first (longest waiting at top)
      const statusDiff = STATUS_ORDER[a.status] - STATUS_ORDER[b.status];
      if (statusDiff !== 0) return statusDiff;
      return new Date(a.placedAt).getTime() - new Date(b.placedAt).getTime();
    });
  }, [orders, statusFilter]);

  // ── Badge counts ─────────────────────────────────────────────────────────────
  const counts = useMemo(() => {
    const c: Partial<Record<KitchenOrderStatus | 'ALL', number>> = { ALL: orders.length };
    orders.forEach((o: KitchenOrder) => {
      c[o.status] = (c[o.status] ?? 0) + 1;
    });
    return c;
  }, [orders]);

  // ── Action handlers ────────────────────────────────────────────────────────
  const handleStartCooking = useCallback(async (orderId: string) => {
    const order = orders.find((o: KitchenOrder) => o.id === orderId);
    try {
      await updateStatus.mutateAsync({ orderId, status: 'PREPARING' });
      // notifyOrderNew controls "bắt đầu chế biến" banner (it's a new-order action)
      if (notifyOrderNew) {
        toast(`Bàn ${order?.tableNumber ?? ''} — Bắt đầu chế biến`, 'info');
      }
      if (vibrateEnabled && 'vibrate' in navigator) navigator.vibrate(40);
    } catch {
      toast('Không thể cập nhật trạng thái', 'error');
    }
  }, [orders, updateStatus, toast, notifyOrderNew, vibrateEnabled]);

  const handleReady = useCallback(async (orderId: string) => {
    const order = orders.find((o: KitchenOrder) => o.id === orderId);
    try {
      await updateStatus.mutateAsync({ orderId, status: 'READY' });
      if (notifyOrderReady) {
        toast(`Bàn ${order?.tableNumber ?? ''} — Món đã sẵn sàng! Gọi phục vụ.`, 'success');
      }
      if (vibrateEnabled && 'vibrate' in navigator) navigator.vibrate([60, 30, 60]);
      if (soundEnabled) console.log('[KDS] 🔔 Ready bell');
    } catch {
      toast('Không thể cập nhật trạng thái', 'error');
    }
  }, [orders, updateStatus, toast, notifyOrderReady, vibrateEnabled, soundEnabled]);

  // ── Render ─────────────────────────────────────────────────────────────────
  const pendingCount = counts['PENDING'] ?? 0;

  return (
    <MobileAppLayout
      title="Màn hình bếp"
      navBadge={{ '/kitchen': pendingCount > 0 ? pendingCount : undefined }}
      subheader={<KdsFilterBar counts={counts} />}
      headerRight={
        <div className="flex items-center gap-2">
          <SimulateNewOrderButton />
          <button
            onClick={() => refetch()}
            className="flex h-9 w-9 items-center justify-center rounded-full tap-scale"
            aria-label="Làm mới"
          >
            <RefreshCw className={cn('h-4 w-4 text-muted-foreground', isFetching && 'animate-spin')} />
          </button>
        </div>
      }
    >
      {/* ── Order queue ────────────────────────────────────────────────────── */}
      <div className="px-4 pt-4 pb-6 space-y-3">
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-44 rounded-2xl" />
          ))
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3 text-muted-foreground">
            <ChefHat className="h-12 w-12 opacity-20" />
            <p className="text-sm">
              {statusFilter === 'ALL' ? 'Không có đơn hàng nào' : 'Không có đơn hàng trong bộ lọc này'}
            </p>
          </div>
        ) : (
          filtered.map((order: KitchenOrder) => (
            <KitchenOrderCard
              key={order.id}
              order={order}
              onStartCooking={handleStartCooking}
              onReady={handleReady}
              isPending={updateStatus.isPending && updateStatus.variables?.orderId === order.id}
            />
          ))
        )}
      </div>
    </MobileAppLayout>
  );
}
