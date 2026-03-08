'use client';
/**
 * useMockBridge
 *
 * Subscribes to cross-tab BroadcastChannel events from the admin app and
 * translates them into TanStack Query cache invalidations / optimistic updates
 * so the web app reflects admin actions (checkout, menu changes, table status)
 * without a page reload — even in cross-origin dev (localhost:3002 → :3000).
 *
 * Only active when NEXT_PUBLIC_MOCK_MODE=true.
 */
import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { MockBridge } from '@booking/shared';
import { queryKeys } from '@booking/shared';
import { mockApi } from '@/mock/mock-client';
import { IS_MOCK } from '@/api/client';

export function useMockBridge(branchId: string) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!IS_MOCK) return;

    // ORDER_NEW from admin POS or SimulateNewOrder button → refresh order list
    const offOrderNew = MockBridge.on('ORDER_NEW', (payload) => {
      const p = payload as { id: string; tableId: string };
      // Push into web mock state so order-history page shows the new order
      mockApi._pushOrder(payload);
      queryClient.invalidateQueries({ queryKey: queryKeys.orders.all() });
      if (p.tableId) {
        queryClient.invalidateQueries({ queryKey: queryKeys.orders.byBooking(p.tableId) });
      }
    });

    // ORDER_STATUS from admin KDS status update → update web order cache
    const offOrderStatus = MockBridge.on('ORDER_STATUS', (payload) => {
      const p = payload as { orderId: string; tableId: string; status: string };
      queryClient.setQueryData(
        queryKeys.orders.detail(p.orderId),
        (old: Record<string, unknown> | undefined) =>
          old ? { ...old, status: p.status } : old,
      );
      queryClient.invalidateQueries({ queryKey: queryKeys.orders.all() });
    });

    // PAYMENT_COMPLETED from admin checkout → mark orders SERVED + release table
    const offPayment = MockBridge.on('PAYMENT_COMPLETED', (payload) => {
      const p = payload as { tableId: string };
      // Apply payment in web mock state
      mockApi._applyPayment(p.tableId);
      queryClient.invalidateQueries({ queryKey: queryKeys.orders.all() });
      // Release table
      queryClient.setQueryData(
        queryKeys.tables.detail(p.tableId),
        (old: Record<string, unknown> | undefined) =>
          old ? { ...old, status: 'AVAILABLE' } : old,
      );
      queryClient.invalidateQueries({ queryKey: queryKeys.tables.all() });
    });

    // TABLE_STATUS from admin → update table status in web cache
    const offTableStatus = MockBridge.on('TABLE_STATUS', (payload) => {
      const p = payload as { tableId: string; status: string };
      queryClient.setQueryData(
        queryKeys.tables.detail(p.tableId),
        (old: Record<string, unknown> | undefined) =>
          old ? { ...old, status: p.status } : old,
      );
      queryClient.invalidateQueries({ queryKey: queryKeys.tables.all() });
    });

    // MENU_UPDATED from admin → invalidate web menu catalog immediately
    const offMenu = MockBridge.on('MENU_UPDATED', () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.menu.items(branchId) });
    });

    // BOOKING_CONFIRMED from web itself (round-trip) → lock table in cache
    const offBookingConfirmed = MockBridge.on('BOOKING_CONFIRMED', (payload) => {
      const p = payload as { tableId: string };
      queryClient.setQueryData(
        queryKeys.tables.detail(p.tableId),
        (old: Record<string, unknown> | undefined) =>
          old ? { ...old, status: 'LOCKED' } : old,
      );
      queryClient.invalidateQueries({ queryKey: queryKeys.tables.all() });
    });

    // BOOKING_CANCELLED → release table
    const offBookingCancelled = MockBridge.on('BOOKING_CANCELLED', (payload) => {
      const p = payload as { tableId: string };
      queryClient.setQueryData(
        queryKeys.tables.detail(p.tableId),
        (old: Record<string, unknown> | undefined) =>
          old ? { ...old, status: 'AVAILABLE' } : old,
      );
      queryClient.invalidateQueries({ queryKey: queryKeys.tables.all() });
    });

    return () => {
      offOrderNew();
      offOrderStatus();
      offPayment();
      offTableStatus();
      offMenu();
      offBookingConfirmed();
      offBookingCancelled();
    };
  }, [branchId, queryClient]);
}
