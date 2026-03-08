'use client';
import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useKdsStore } from '@/store/kds.store';
import { IS_MOCK } from '@/api/client';
import type { KitchenOrder } from '@/mock/seed';

// ── Mock event bus ────────────────────────────────────────────────────────────
type Handler = (payload: unknown) => void;
const mockBus = new Map<string, Set<Handler>>();

export function mockEmitAdmin(event: string, payload: unknown) {
  mockBus.get(event)?.forEach((fn) => fn(payload));
}
function mockOn(event: string, h: Handler) {
  if (!mockBus.has(event)) mockBus.set(event, new Set());
  mockBus.get(event)!.add(h);
}
function mockOff(event: string, h: Handler) {
  mockBus.get(event)?.delete(h);
}

/**
 * emitMenuUpdated — called from use-menu.ts after any successful menu mutation.
 *
 * Mock mode: fires into the admin mock bus → all admin subscribers (KDS, menu
 *   list) invalidate their cache immediately.
 * Real mode: NestJS RestaurantGateway emits 'menu:updated' server-side after
 *   each DB write; this is a no-op on the frontend.
 */
export function emitMenuUpdated(payload: {
  branchId: string;
  itemId?:  string;
  type:     'toggle86' | 'update' | 'create' | 'delete' | 'category';
}) {
  if (IS_MOCK) {
    mockEmitAdmin('menu:updated', payload);
  }
}

// ── Real socket (lazy singleton) ──────────────────────────────────────────────
let _socket: import('socket.io-client').Socket | null = null;

async function getSocket() {
  if (!_socket) {
    const { io } = await import('socket.io-client');
    _socket = io(process.env.NEXT_PUBLIC_WS_URL ?? 'http://localhost:3001', {
      transports: ['websocket', 'polling'],
      autoConnect: false,
    });
  }
  return _socket;
}

// ── Payload types ─────────────────────────────────────────────────────────────
interface TableStatusPayload {
  tableId:  string;
  branchId: string;
  status:   string;
  booking?: unknown;
}

interface NewBookingPayload {
  tableId: string;
  booking: unknown;
}

// ── Hook ──────────────────────────────────────────────────────────────────────
export function useAdminSocket(branchId?: string) {
  const queryClient  = useQueryClient();
  const connectedRef = useRef(false);

  useEffect(() => {
    if (!branchId) return;

    const TABLE_STATUS_CHANGED = 'table:status_changed';
    const NEW_BOOKING          = 'booking:confirmed';
    const ORDER_CHANGED        = 'order:status_changed';
    const NEW_ORDER_KITCHEN    = 'order:new';
    const MENU_UPDATED         = 'menu:updated';

    const markFlashing = useKdsStore.getState().markFlashing;
    const KDS_KEY      = ['admin', 'kds'] as const;

    // ── Event handlers ────────────────────────────────────────────────────────
    const onTableStatus = (raw: unknown) => {
      const p = raw as TableStatusPayload;
      // Optimistic update then re-fetch
      queryClient.setQueryData<unknown[]>(['admin', 'tables', branchId], (old) => {
        if (!Array.isArray(old)) return old;
        return old.map((t: unknown) => {
          const table = t as { id: string; status: string };
          if (table.id !== p.tableId) return t;
          return { ...table, status: p.status, currentBooking: p.booking ?? null };
        });
      });
      queryClient.invalidateQueries({ queryKey: ['admin', 'tables', branchId] });
    };

    const onNewBooking = (raw: unknown) => {
      const p = raw as NewBookingPayload;
      queryClient.setQueryData<unknown[]>(['admin', 'tables', branchId], (old) => {
        if (!Array.isArray(old)) return old;
        return old.map((t: unknown) => {
          const table = t as { id: string };
          if (table.id !== p.tableId) return t;
          return { ...table, status: 'LOCKED', currentBooking: p.booking };
        });
      });
    };

    const onOrderChanged = () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'orders'] });
    };

    const onNewOrderKitchen = (raw: unknown) => {
      const order = raw as KitchenOrder;
      queryClient.setQueryData<KitchenOrder[]>(KDS_KEY, (old = []) => {
        if (old.some((o) => o.id === order.id)) return old;
        return [{ ...order, isNew: true }, ...old];
      });
      markFlashing(order.id);
      setTimeout(() => useKdsStore.getState().clearFlash(order.id), 4000);
    };

    // Invalidate admin menu cache immediately when any menu mutation completes
    const onMenuUpdated = () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'menu'] });
    };

    // ── Register ──────────────────────────────────────────────────────────────
    if (IS_MOCK) {
      mockOn(TABLE_STATUS_CHANGED, onTableStatus);
      mockOn(NEW_BOOKING,          onNewBooking);
      mockOn(ORDER_CHANGED,        onOrderChanged);
      mockOn(NEW_ORDER_KITCHEN,    onNewOrderKitchen);
      mockOn(MENU_UPDATED,         onMenuUpdated);
      return () => {
        mockOff(TABLE_STATUS_CHANGED, onTableStatus);
        mockOff(NEW_BOOKING,          onNewBooking);
        mockOff(ORDER_CHANGED,        onOrderChanged);
        mockOff(NEW_ORDER_KITCHEN,    onNewOrderKitchen);
        mockOff(MENU_UPDATED,         onMenuUpdated);
      };
    }

    let socket: import('socket.io-client').Socket;
    getSocket().then((s) => {
      socket = s;
      if (!connectedRef.current) {
        socket.connect();
        connectedRef.current = true;
      }
      socket.emit('join_branch', { branchId, role: 'admin' });
      socket.on(TABLE_STATUS_CHANGED, onTableStatus);
      socket.on(NEW_BOOKING,          onNewBooking);
      socket.on(ORDER_CHANGED,        onOrderChanged);
      socket.on(NEW_ORDER_KITCHEN,    onNewOrderKitchen);
      socket.on(MENU_UPDATED,         onMenuUpdated);
    });

    return () => {
      if (socket) {
        socket.off(TABLE_STATUS_CHANGED, onTableStatus);
        socket.off(NEW_BOOKING,          onNewBooking);
        socket.off(ORDER_CHANGED,        onOrderChanged);
        socket.off(NEW_ORDER_KITCHEN,    onNewOrderKitchen);
        socket.off(MENU_UPDATED,         onMenuUpdated);
        socket.emit('leave_branch', { branchId });
      }
    };
  }, [branchId, queryClient]);
}
