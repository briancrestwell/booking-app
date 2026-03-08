'use client';
/**
 * useAdminBridge
 *
 * Subscribes to BroadcastChannel bridge events originating from the web
 * customer app and updates admin's TanStack Query caches accordingly.
 *
 * Only active in mock mode. In production, the NestJS backend handles
 * all cross-client communication via Socket.IO.
 */
import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { MockBridge } from '@booking/shared';
import { IS_MOCK } from '@/api/client';
import { mockAdminApi } from '@/mock/mock-admin-api';
import { mockEmitAdmin } from '@/hooks/use-admin-socket';
import { useKdsStore } from '@/store/kds.store';
import type { KitchenOrder } from '@/mock/seed';

export function useAdminBridge(branchId: string) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!IS_MOCK || !branchId) return;

    // Web customer places order → push to admin KDS
    const offOrderNew = MockBridge.on('ORDER_NEW', (payload) => {
      const order = payload as KitchenOrder;
      // Avoid duplicates (SimulateNewOrder already pushes directly)
      if (order.id?.startsWith('kds-sim-')) return;
      mockAdminApi._pushKdsOrder({
        ...order,
        tableNumber: order.tableNumber ?? 0,
        section:     order.section     ?? '',
        placedAt:    (order as { createdAt?: string }).createdAt ?? new Date().toISOString(),
        isNew:       true,
        status:      'PENDING',
        items:       (order.items ?? []).map((i: { id: string; name: string; quantity: number }) => ({
          id:       i.id,
          name:     i.name,
          quantity: i.quantity,
        })),
      });
      // Fire through admin bus so KDS page re-renders with flash
      mockEmitAdmin('order:new', order);
      useKdsStore.getState().markFlashing(order.id);
      setTimeout(() => useKdsStore.getState().clearFlash(order.id), 4000);
      queryClient.invalidateQueries({ queryKey: ['admin', 'kds'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'orders'] });
    });

    // Web customer confirms booking → lock table in admin
    const offBookingConfirmed = MockBridge.on('BOOKING_CONFIRMED', (payload) => {
      const p = payload as { tableId: string; booking: unknown };
      queryClient.setQueryData<unknown[]>(
        ['admin', 'tables', branchId],
        (old) => {
          if (!Array.isArray(old)) return old;
          return old.map((t: unknown) => {
            const table = t as { id: string };
            if (table.id !== p.tableId) return t;
            return { ...table, status: 'LOCKED', currentBooking: p.booking };
          });
        },
      );
      queryClient.invalidateQueries({ queryKey: ['admin', 'tables', branchId] });
    });

    // Web customer cancels booking → release table
    const offBookingCancelled = MockBridge.on('BOOKING_CANCELLED', (payload) => {
      const p = payload as { tableId: string };
      queryClient.setQueryData<unknown[]>(
        ['admin', 'tables', branchId],
        (old) => {
          if (!Array.isArray(old)) return old;
          return old.map((t: unknown) => {
            const table = t as { id: string };
            if (table.id !== p.tableId) return t;
            return { ...table, status: 'AVAILABLE', currentBooking: null };
          });
        },
      );
      queryClient.invalidateQueries({ queryKey: ['admin', 'tables', branchId] });
    });

    // Web advances order status (via MockBanner) → update admin orders cache
    const offOrderStatus = MockBridge.on('ORDER_STATUS', (payload) => {
      const p = payload as { orderId: string; status: string };
      queryClient.invalidateQueries({ queryKey: ['admin', 'orders'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'kds'] });
      // Also update KDS status in-memory
      const order = mockAdminApi._getKdsOrders().find((o) => o.id === p.orderId);
      if (order) (order as { status: string }).status = p.status;
    });

    return () => {
      offOrderNew();
      offBookingConfirmed();
      offBookingCancelled();
      offOrderStatus();
    };
  }, [branchId, queryClient]);
}
