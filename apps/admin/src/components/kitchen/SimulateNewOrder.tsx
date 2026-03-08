'use client';
import { useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { mockEmitAdmin } from '@/hooks/use-admin-socket';
import { useKdsStore } from '@/store/kds.store';
import { adminApi } from '@/api/client';
import { IS_MOCK } from '@/api/client';
import { MockBridge } from '@booking/shared';
import type { KitchenOrder } from '@/mock/seed';

let _orderCounter = 100;

/**
 * Simulate a new order arriving from the customer app.
 * Exposed as a button in the KDS header for demo purposes.
 */
export function SimulateNewOrderButton() {
  const queryClient = useQueryClient();
  const markFlashing = useKdsStore((s) => s.markFlashing);

  const simulate = useCallback(() => {
    if (!IS_MOCK) return;
    _orderCounter++;
    const tables = [
      { tableId: 'table-001', tableNumber: 1, section: 'Trong nhà' },
      { tableId: 'table-005', tableNumber: 5, section: 'Trong nhà' },
      { tableId: 'table-009', tableNumber: 9, section: 'Ngoài trời' },
    ];
    const t = tables[_orderCounter % tables.length];
    const newOrder: KitchenOrder = {
      id:          `kds-sim-${_orderCounter}`,
      tableId:     t.tableId,
      tableNumber: t.tableNumber,
      section:     t.section,
      status:      'PENDING',
      placedAt:    new Date().toISOString(),
      isNew:       true,
      items: [
        { id: `si-${_orderCounter}-1`, name: 'Bánh tráng trộn', quantity: 2, station: 'COLD' },
        { id: `si-${_orderCounter}-2`, name: 'Trà chanh',       quantity: 2, station: 'DRINKS' },
      ],
    };
    // Push into admin mock store
    adminApi._mock._pushKdsOrder(newOrder);
    // Fire the event through the admin mock bus (updates React Query cache + flash)
    mockEmitAdmin('order:new', newOrder);
    markFlashing(newOrder.id);
    setTimeout(() => useKdsStore.getState().clearFlash(newOrder.id), 4000);
    queryClient.invalidateQueries({ queryKey: ['admin', 'kds'] });

    // Also notify web app tab via BroadcastChannel bridge
    MockBridge.emit('ORDER_NEW', {
      id:          newOrder.id,
      tableId:     t.tableId,
      status:      'PENDING',
      totalSatang: 0,
      createdAt:   newOrder.placedAt,
      items:       newOrder.items.map((i) => ({ id: i.id, name: i.name, quantity: i.quantity })),
    });
  }, [queryClient, markFlashing]);

  if (!IS_MOCK) return null;

  return (
    <button
      onClick={simulate}
      className="flex h-9 items-center gap-1.5 rounded-full border border-pos-amber/40 bg-pos-amber/10 px-3 text-xs font-semibold text-pos-amber tap-scale"
      aria-label="Giả lập đơn mới"
    >
      + Đơn mới
    </button>
  );
}
