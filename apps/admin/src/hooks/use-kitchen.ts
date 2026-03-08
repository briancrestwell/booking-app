'use client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '@/api/client';
import { useAuditedMutation } from '@/hooks/use-audited-mutation';
import { useKdsStore } from '@/store/kds.store';
import type { KitchenOrder, KitchenOrderStatus } from '@/mock/seed';

const KDS_KEY = ['admin', 'kds'] as const;

const KDS_STATUS_LABEL: Record<KitchenOrderStatus, string> = {
  PENDING:   'Chờ xác nhận',
  CONFIRMED: 'Đã xác nhận',
  PREPARING: 'Đang nấu',
  READY:     'Sẵn sàng phục vụ',
};

// ── Fetch active kitchen orders ────────────────────────────────────────────────
export function useKdsOrders() {
  return useQuery<KitchenOrder[]>({
    queryKey: KDS_KEY,
    queryFn:  () => adminApi.kitchen.listActive() as Promise<KitchenOrder[]>,
    staleTime: 10_000,
    refetchInterval: 30_000,
  });
}

// ── Update a single order status ──────────────────────────────────────────────
export function useKitchenUpdateStatus() {
  const queryClient = useQueryClient();
  const clearFlash  = useKdsStore((s) => s.clearFlash);

  return useAuditedMutation({
    mutationFn: ({ orderId, status }: { orderId: string; status: KitchenOrderStatus }) =>
      adminApi.kitchen.updateStatus(orderId, status) as Promise<KitchenOrder>,

    audit: ({ orderId, status }, data, error) => {
      const tableNumber = (data as KitchenOrder | undefined)?.tableNumber ?? '?';
      return {
        category:   'KDS',
        action:     `KDS_${status}`,
        label:      `Bàn ${tableNumber} — ${KDS_STATUS_LABEL[status] ?? status}`,
        targetId:   orderId,
        targetType: 'Order',
        outcome:    error ? 'FAILURE' : 'SUCCESS',
        meta:       { status },
      };
    },

    onMutate: async ({ orderId, status }) => {
      await queryClient.cancelQueries({ queryKey: KDS_KEY });
      const prev = queryClient.getQueryData<KitchenOrder[]>(KDS_KEY);
      queryClient.setQueryData<KitchenOrder[]>(KDS_KEY, (old = []) =>
        old.map((o) => o.id === orderId ? { ...o, status, isNew: false } : o),
      );
      clearFlash(orderId);
      return { prev };
    },

    onError: (_err, _vars, ctx) => {
      if (ctx?.prev) queryClient.setQueryData(KDS_KEY, ctx.prev);
    },

    onSettled: () => queryClient.invalidateQueries({ queryKey: KDS_KEY }),
  });
}
