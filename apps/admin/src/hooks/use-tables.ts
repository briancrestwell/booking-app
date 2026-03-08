'use client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { adminApi, IS_MOCK } from '@/api/client';
import { useAuditedMutation } from '@/hooks/use-audited-mutation';
import { MOCK_BRANCH_ID } from '@/mock/seed';
import type { TableStatus, MockTable, MockOrder } from '@/mock/seed';

const BRANCH_ID = IS_MOCK
  ? MOCK_BRANCH_ID
  : (process.env.NEXT_PUBLIC_DEMO_BRANCH_ID ?? 'demo-branch');

// ── Table queries ─────────────────────────────────────────────────────────────
export function useTables() {
  return useQuery<MockTable[]>({
    queryKey: ['admin', 'tables', BRANCH_ID],
    queryFn:  () => adminApi.tables.list(BRANCH_ID) as Promise<MockTable[]>,
    staleTime: 30_000,
    refetchInterval: 60_000,
  });
}

export function useUpdateTableStatus() {
  const queryClient = useQueryClient();
  return useAuditedMutation({
    mutationFn: ({ tableId, status }: { tableId: string; status: TableStatus }) =>
      adminApi.tables.updateStatus(tableId, status),
    audit: ({ tableId, status }, _data, error) => ({
      category:   'TABLE',
      action:     'STATUS_CHANGED',
      label:      `Bàn ${tableId} → ${status}`,
      targetId:   tableId,
      targetType: 'Table',
      outcome:    error ? 'FAILURE' : 'SUCCESS',
      meta:       { status },
    }),
    onMutate: async ({ tableId, status }) => {
      await queryClient.cancelQueries({ queryKey: ['admin', 'tables', BRANCH_ID] });
      const prev = queryClient.getQueryData(['admin', 'tables', BRANCH_ID]);
      queryClient.setQueryData<unknown[]>(['admin', 'tables', BRANCH_ID], (old) =>
        old?.map((t: unknown) => {
          const table = t as { id: string };
          return table.id === tableId ? { ...table, status } : t;
        }) ?? [],
      );
      return { prev };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prev) queryClient.setQueryData(['admin', 'tables', BRANCH_ID], ctx.prev);
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['admin', 'tables', BRANCH_ID] }),
  });
}

// ── Order queries ─────────────────────────────────────────────────────────────
export function useTableOrders(tableId: string | null) {
  return useQuery<MockOrder[]>({
    queryKey: ['admin', 'orders', tableId],
    queryFn:  () => adminApi.orders.byTable(tableId!) as Promise<MockOrder[]>,
    enabled:  !!tableId,
    staleTime: 10_000,
    refetchInterval: 15_000,
  });
}

export function useMarkTableServed() {
  const queryClient = useQueryClient();
  return useAuditedMutation({
    mutationFn: (tableId: string) => adminApi.orders.markTableServed(tableId),
    audit: (tableId, _data, error) => ({
      category:   'ORDER',
      action:     'TABLE_SERVED',
      label:      `Đánh dấu phục vụ xong — Bàn ${tableId}`,
      targetId:   tableId,
      targetType: 'Table',
      outcome:    error ? 'FAILURE' : 'SUCCESS',
    }),
    onSuccess: (_data, tableId) => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'orders', tableId] });
    },
  });
}

export function useUpdateOrderStatus() {
  const queryClient = useQueryClient();
  return useAuditedMutation({
    mutationFn: ({ orderId, tableId, status }: { orderId: string; tableId: string; status: string }) =>
      adminApi.orders.updateStatus(orderId, tableId, status),
    audit: ({ orderId, status }, _data, error) => ({
      category:   'ORDER',
      action:     'STATUS_CHANGED',
      label:      `Đơn ${orderId.slice(-6).toUpperCase()} → ${status}`,
      targetId:   orderId,
      targetType: 'Order',
      outcome:    error ? 'FAILURE' : 'SUCCESS',
      meta:       { status },
    }),
    onSuccess: (_data, { tableId }) => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'orders', tableId] });
    },
  });
}

// ── Add order ─────────────────────────────────────────────────────────────────
export function useAddOrder() {
  const queryClient = useQueryClient();
  return useAuditedMutation({
    mutationFn: ({
      tableId,
      items,
    }: {
      tableId: string;
      items: { menuItemId: string; name: string; quantity: number; unitSatang: number; notes?: string }[];
    }) => adminApi.orders.addToTable(tableId, items),
    audit: ({ tableId, items }, _data, error) => ({
      category:   'ORDER',
      action:     'ORDER_CREATED',
      label:      `Gọi ${items.length} món cho Bàn ${tableId}`,
      targetId:   tableId,
      targetType: 'Table',
      outcome:    error ? 'FAILURE' : 'SUCCESS',
      meta:       { itemCount: items.length, items: items.map((i) => `${i.quantity}× ${i.name}`) },
    }),
    onSuccess: (_data, { tableId }) => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'orders', tableId] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'kds'] });
    },
  });
}

// ── Checkout ──────────────────────────────────────────────────────────────────
export function useConfirmPayment() {
  const queryClient = useQueryClient();
  return useAuditedMutation({
    mutationFn: (tableId: string) => adminApi.checkout.confirmPayment(tableId),
    audit: (tableId, _data, error) => ({
      category:   'PAYMENT',
      action:     'PAYMENT_CONFIRMED',
      label:      `Thanh toán — Bàn ${tableId}`,
      targetId:   tableId,
      targetType: 'Table',
      outcome:    error ? 'FAILURE' : 'SUCCESS',
    }),
    onSuccess: (_data, tableId) => {
      queryClient.setQueryData<unknown[]>(['admin', 'tables', BRANCH_ID], (old) =>
        old?.map((t: unknown) => {
          const table = t as { id: string };
          return table.id === tableId
            ? { ...table, status: 'AVAILABLE', currentBooking: null }
            : t;
        }) ?? [],
      );
      queryClient.invalidateQueries({ queryKey: ['admin', 'tables', BRANCH_ID] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'orders', tableId] });
    },
  });
}
