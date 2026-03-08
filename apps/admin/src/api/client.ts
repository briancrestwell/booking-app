// Admin API client — switches between real NestJS API and mock layer.
// pick() is a lazy wrapper: it checks getMockMode() on every call,
// so toggling mock mode via localStorage takes effect immediately after reload.

import { mockAdminApi } from '@/mock/mock-admin-api';
import type { TableStatus, KitchenOrderStatus } from '@/mock/seed';
import { getMockMode } from '@booking/shared';

/** IS_MOCK — re-evaluated on every access so it respects localStorage overrides. */
export const IS_MOCK: boolean = getMockMode();

const BASE = '/api/v1';

async function fetcher<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...init?.headers },
    credentials: 'include',
    ...init,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(err.message ?? 'Request failed');
  }
  return res.json() as Promise<T>;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyFn = (...args: any[]) => any;

/**
 * Lazy pick — returns a wrapper that checks getMockMode() on EVERY call.
 * This ensures toggling localStorage + reloading always picks the correct branch.
 */
function pick<T extends AnyFn>(real: T, mock: T): T {
  return ((...args: Parameters<T>) =>
    getMockMode() ? mock(...args) : real(...args)) as T;
}

export const adminApi = {
  tables: {
    list: pick(
      (branchId: string) => fetcher(`/tables?branchId=${branchId}`),
      mockAdminApi.tables.list,
    ),
    updateStatus: pick(
      (tableId: string, status: TableStatus) =>
        fetcher(`/tables/${tableId}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }),
      mockAdminApi.tables.updateStatus,
    ),
  },
  orders: {
    byTable: pick(
      (tableId: string) => fetcher(`/orders?tableId=${tableId}`),
      mockAdminApi.orders.byTable,
    ),
    updateStatus: pick(
      (orderId: string, _tableId: string, status: string) =>
        fetcher(`/orders/${orderId}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }),
      mockAdminApi.orders.updateStatus,
    ),
    markTableServed: pick(
      (tableId: string) =>
        fetcher(`/orders/table/${tableId}/serve-all`, { method: 'PATCH' }),
      mockAdminApi.orders.markTableServed,
    ),
    addToTable: pick(
      (tableId: string, items: { menuItemId: string; name: string; quantity: number; unitSatang: number; notes?: string }[]) =>
        fetcher(`/orders`, { method: 'POST', body: JSON.stringify({ tableId, items }) }),
      mockAdminApi.orders.addToTable,
    ),
  },
  checkout: {
    confirmPayment: pick(
      (tableId: string) =>
        fetcher(`/checkout`, { method: 'POST', body: JSON.stringify({ tableId }) }),
      mockAdminApi.checkout.confirmPayment,
    ),
  },
  kitchen: {
    listActive: pick(
      () => fetcher('/orders?status=PENDING,CONFIRMED,PREPARING,READY'),
      mockAdminApi.kitchen.listActive,
    ),
    updateStatus: pick(
      (orderId: string, status: KitchenOrderStatus) =>
        fetcher(`/orders/${orderId}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }),
      mockAdminApi.kitchen.updateStatus,
    ),
  },
  menu: {
    listCategories: pick(
      () => fetcher('/menu/admin/categories'),
      mockAdminApi.menu.listCategories,
    ),
    toggle86: pick(
      (itemId: string, isAvailable: boolean) =>
        fetcher(`/menu/${itemId}/availability`, { method: 'PATCH', body: JSON.stringify({ isAvailable }) }),
      mockAdminApi.menu.toggle86,
    ),
    updateItem: pick(
      (itemId: string, data: object) =>
        fetcher(`/menu/${itemId}`, { method: 'PATCH', body: JSON.stringify(data) }),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (itemId: string, data: any) => mockAdminApi.menu.updateItem(itemId, data),
    ),
    createItem: pick(
      (data: object) =>
        fetcher('/menu', { method: 'POST', body: JSON.stringify(data) }),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (data: any) => mockAdminApi.menu.createItem(data),
    ),
    createCategory: pick(
      (name: string) =>
        fetcher('/menu/categories', { method: 'POST', body: JSON.stringify({ name }) }),
      mockAdminApi.menu.createCategory,
    ),
    deleteCategory: pick(
      (catId: string) =>
        fetcher(`/menu/categories/${catId}`, { method: 'DELETE' }),
      mockAdminApi.menu.deleteCategory,
    ),
  },
  _mock: mockAdminApi,
};
