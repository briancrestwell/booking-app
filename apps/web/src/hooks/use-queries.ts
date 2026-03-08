'use client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/api/client';
import { queryKeys } from '@booking/shared';
import type { PlaceOrderDto } from '@booking/shared';

export function useMenu(branchId: string) {
  return useQuery({
    queryKey: queryKeys.menu.items(branchId),
    queryFn: () => api.menu.getCatalog(branchId),
    staleTime: 5 * 60 * 1000,
    enabled: !!branchId,
  });
}

export function useMenuSearch(branchId: string, q: string) {
  return useQuery({
    queryKey: [...queryKeys.menu.items(branchId), 'search', q],
    queryFn: () => api.menu.search(branchId, q),
    enabled: q.length >= 2,
    staleTime: 30_000,
  });
}

export function usePlaceOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: PlaceOrderDto) => api.orders.placeOrder(dto),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.orders.all() });
      if (variables.tableId) {
        queryClient.invalidateQueries({ queryKey: queryKeys.tables.detail(variables.tableId) });
      }
    },
  });
}

export function useTableOrders(tableId: string) {
  return useQuery({
    queryKey: queryKeys.orders.byBooking(tableId),
    queryFn: () => api.orders.byTable(tableId),
    refetchInterval: 10_000,
    enabled: !!tableId,
  });
}

export function useMyBookings() {
  return useQuery({
    queryKey: queryKeys.bookings.list(),
    queryFn: api.bookings.mine,
    staleTime: 60_000,
  });
}

export function useCreateBooking() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.bookings.create,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.bookings.all() }),
  });
}
