// Unified API client — switches between real HTTP and mock layer.
// pick() is a lazy wrapper: checks getMockMode() on every call,
// so toggling localStorage + reloading always picks the correct branch.

import { mockApi } from '@/mock/mock-client';
import { getMockMode } from '@booking/shared';

/** IS_MOCK — evaluated at module load time (after localStorage is readable). */
export const IS_MOCK: boolean = getMockMode();

const BASE = '/api/v1';

async function fetcher<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...init?.headers },
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
function pick<T extends AnyFn>(realFn: T, mockFn: T): T {
  return ((...args: Parameters<T>) =>
    getMockMode() ? mockFn(...args) : realFn(...args)) as T;
}

export const api = {
  menu: {
    getCatalog: pick(
      (branchId: string) => fetcher(`/menu/branch/${branchId}`),
      mockApi.menu.getCatalog,
    ),
    search: pick(
      (branchId: string, q: string) => fetcher(`/menu/branch/${branchId}/search?q=${q}`),
      mockApi.menu.search,
    ),
  },
  orders: {
    placeOrder: pick(
      (body: unknown) => fetcher('/orders', { method: 'POST', body: JSON.stringify(body) }),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (body: any) => mockApi.orders.placeOrder(body),
    ),
    updateStatus: pick(
      (orderId: string, status: string) =>
        fetcher(`/orders/${orderId}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }),
      mockApi.orders.updateStatus,
    ),
    byTable: pick(
      (tableId: string) => fetcher(`/orders?tableId=${tableId}`),
      mockApi.orders.byTable,
    ),
    byBooking: pick(
      (bookingId: string) => fetcher(`/orders/booking/${bookingId}`),
      mockApi.orders.byBooking,
    ),
  },
  bookings: {
    create: pick(
      (body: unknown) => fetcher('/bookings', { method: 'POST', body: JSON.stringify(body) }),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (body: any) => mockApi.bookings.create(body),
    ),
    mine: pick(
      () => fetcher('/bookings/my'),
      mockApi.bookings.mine,
    ),
    get: pick(
      (id: string) => fetcher(`/bookings/${id}`),
      mockApi.bookings.get,
    ),
    cancel: pick(
      (id: string) => fetcher(`/bookings/${id}/cancel`, { method: 'PATCH' }),
      mockApi.bookings.cancel,
    ),
  },
  // Exposed only in mock mode for the demo panel
  _mock: mockApi,
};
