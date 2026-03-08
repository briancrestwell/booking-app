'use client';
import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { useQueryClient } from '@tanstack/react-query';
import { SOCKET_EVENTS, type TableStatusChangedPayload, type OrderStatusChangedPayload } from '@booking/shared';
import { queryKeys } from '@booking/shared';
import { IS_MOCK } from '@/api/client';

let socketInstance: Socket | null = null;

function getSocket(): Socket {
  if (!socketInstance) {
    socketInstance = io(process.env.NEXT_PUBLIC_WS_URL ?? 'http://localhost:3001', {
      transports: ['websocket', 'polling'],
      autoConnect: false,
    });
  }
  return socketInstance;
}

// ── Mock event bus ────────────────────────────────────────────────────────────
type MockHandler = (payload: unknown) => void;
const mockBus = new Map<string, Set<MockHandler>>();

export function mockEmit(event: string, payload: unknown) {
  mockBus.get(event)?.forEach((fn) => fn(payload));
}

function mockOn(event: string, handler: MockHandler) {
  if (!mockBus.has(event)) mockBus.set(event, new Set());
  mockBus.get(event)!.add(handler);
}

function mockOff(event: string, handler: MockHandler) {
  mockBus.get(event)?.delete(handler);
}

// ── Hook ──────────────────────────────────────────────────────────────────────
export function useSocket(branchId?: string, role?: 'kitchen' | 'customer') {
  const queryClient = useQueryClient();
  const connectedRef = useRef(false);

  useEffect(() => {
    if (IS_MOCK) {
      // ── Mock handlers ─────────────────────────────────────────────────────
      const onTableStatus = (payload: unknown) => {
        const p = payload as TableStatusChangedPayload;
        queryClient.setQueryData(
          queryKeys.tables.detail(p.tableId),
          (old: Record<string, unknown> | undefined) =>
            old ? { ...old, status: p.status } : old,
        );
        queryClient.invalidateQueries({ queryKey: queryKeys.tables.all() });
      };

      const onOrderStatus = (payload: unknown) => {
        const p = payload as OrderStatusChangedPayload;
        queryClient.invalidateQueries({ queryKey: queryKeys.orders.all() });
        queryClient.setQueryData(
          queryKeys.orders.detail(p.orderId),
          (old: Record<string, unknown> | undefined) =>
            old ? { ...old, status: p.status } : old,
        );
      };

      // Menu updated by admin — invalidate menu cache immediately (0 s delay)
      const onMenuUpdated = () => {
        if (branchId) {
          queryClient.invalidateQueries({ queryKey: queryKeys.menu.items(branchId) });
        }
      };

      // Booking cancelled — release table in cache
      const onBookingCancelled = (payload: unknown) => {
        const p = payload as { tableId: string };
        queryClient.setQueryData(
          queryKeys.tables.detail(p.tableId),
          (old: Record<string, unknown> | undefined) =>
            old ? { ...old, status: 'AVAILABLE' } : old,
        );
        queryClient.invalidateQueries({ queryKey: queryKeys.tables.all() });
      };

      // Payment completed — invalidate all orders so status shows PAID
      const onPaymentCompleted = (payload: unknown) => {
        const p = payload as { tableId?: string; orderId?: string };
        queryClient.invalidateQueries({ queryKey: queryKeys.orders.all() });
        if (p.orderId) {
          queryClient.invalidateQueries({ queryKey: queryKeys.orders.detail(p.orderId) });
        }
        if (p.tableId) {
          queryClient.setQueryData(
            queryKeys.tables.detail(p.tableId),
            (old: Record<string, unknown> | undefined) =>
              old ? { ...old, status: 'AVAILABLE' } : old,
          );
          queryClient.invalidateQueries({ queryKey: queryKeys.tables.all() });
        }
      };

      mockOn(SOCKET_EVENTS.TABLE_STATUS_CHANGED, onTableStatus);
      mockOn(SOCKET_EVENTS.ORDER_STATUS_CHANGED,  onOrderStatus);
      mockOn(SOCKET_EVENTS.MENU_UPDATED,           onMenuUpdated);
      mockOn(SOCKET_EVENTS.BOOKING_CANCELLED,      onBookingCancelled);
      mockOn(SOCKET_EVENTS.PAYMENT_COMPLETED,      onPaymentCompleted);

      return () => {
        mockOff(SOCKET_EVENTS.TABLE_STATUS_CHANGED, onTableStatus);
        mockOff(SOCKET_EVENTS.ORDER_STATUS_CHANGED,  onOrderStatus);
        mockOff(SOCKET_EVENTS.MENU_UPDATED,           onMenuUpdated);
        mockOff(SOCKET_EVENTS.BOOKING_CANCELLED,      onBookingCancelled);
        mockOff(SOCKET_EVENTS.PAYMENT_COMPLETED,      onPaymentCompleted);
      };
    }

    // ── Real socket path ──────────────────────────────────────────────────────
    const socket = getSocket();

    if (!connectedRef.current) {
      socket.connect();
      connectedRef.current = true;
    }

    if (branchId) {
      socket.emit('join_branch', { branchId, role: role ?? 'customer' });
    }

    socket.on(SOCKET_EVENTS.TABLE_STATUS_CHANGED, (payload: TableStatusChangedPayload) => {
      queryClient.setQueryData(
        queryKeys.tables.detail(payload.tableId),
        (old: Record<string, unknown> | undefined) =>
          old ? { ...old, status: payload.status } : old,
      );
      queryClient.invalidateQueries({ queryKey: queryKeys.tables.all() });
    });

    socket.on(SOCKET_EVENTS.ORDER_STATUS_CHANGED, (payload: OrderStatusChangedPayload) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.orders.all() });
      queryClient.setQueryData(
        queryKeys.orders.detail(payload.orderId),
        (old: Record<string, unknown> | undefined) =>
          old ? { ...old, status: payload.status } : old,
      );
    });

    // Menu availability changed — force-refresh menu catalog immediately
    socket.on(SOCKET_EVENTS.MENU_UPDATED, () => {
      if (branchId) {
        queryClient.invalidateQueries({ queryKey: queryKeys.menu.items(branchId) });
      }
    });

    // Booking cancelled — mark table AVAILABLE again
    socket.on(SOCKET_EVENTS.BOOKING_CANCELLED, (payload: { tableId: string }) => {
      queryClient.setQueryData(
        queryKeys.tables.detail(payload.tableId),
        (old: Record<string, unknown> | undefined) =>
          old ? { ...old, status: 'AVAILABLE' } : old,
      );
      queryClient.invalidateQueries({ queryKey: queryKeys.tables.all() });
    });

    // Payment completed — invalidate orders and release table
    socket.on(SOCKET_EVENTS.PAYMENT_COMPLETED, (payload: { tableId?: string; orderId?: string }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.orders.all() });
      if (payload.orderId) {
        queryClient.invalidateQueries({ queryKey: queryKeys.orders.detail(payload.orderId) });
      }
      if (payload.tableId) {
        queryClient.setQueryData(
          queryKeys.tables.detail(payload.tableId),
          (old: Record<string, unknown> | undefined) =>
            old ? { ...old, status: 'AVAILABLE' } : old,
        );
        queryClient.invalidateQueries({ queryKey: queryKeys.tables.all() });
      }
    });

    return () => {
      socket.off(SOCKET_EVENTS.TABLE_STATUS_CHANGED);
      socket.off(SOCKET_EVENTS.ORDER_STATUS_CHANGED);
      socket.off(SOCKET_EVENTS.MENU_UPDATED);
      socket.off(SOCKET_EVENTS.BOOKING_CANCELLED);
      socket.off(SOCKET_EVENTS.PAYMENT_COMPLETED);
      if (branchId) socket.emit('leave_branch', { branchId });
    };
  }, [branchId, role, queryClient]);

  if (IS_MOCK) return null as unknown as Socket;
  return getSocket();
}
