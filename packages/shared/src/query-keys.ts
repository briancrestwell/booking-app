// TanStack Query key factory — single source of truth for all cache keys.
// Import this in apps/web; NEVER write raw string arrays in components.

export const queryKeys = {
  bookings: {
    all: () => ['bookings'] as const,
    list: (filters?: Record<string, unknown>) => ['bookings', 'list', filters] as const,
    detail: (id: string) => ['bookings', id] as const,
  },
  tables: {
    all: () => ['tables'] as const,
    list: (filters?: Record<string, unknown>) => ['tables', 'list', filters] as const,
    detail: (id: string) => ['tables', id] as const,
    availability: (date: string, slotId?: string) => ['tables', 'availability', date, slotId] as const,
  },
  orders: {
    all: () => ['orders'] as const,
    byBooking: (bookingId: string) => ['orders', 'booking', bookingId] as const,
    detail: (id: string) => ['orders', id] as const,
  },
  menu: {
    all: () => ['menu'] as const,
    categories: () => ['menu', 'categories'] as const,
    items: (categoryId?: string) => ['menu', 'items', categoryId] as const,
  },
} as const;
