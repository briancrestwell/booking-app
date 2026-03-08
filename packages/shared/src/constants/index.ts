// Shared application constants

export const BOOKING_LOCK_TTL_MS = 300_000; // 5 minutes

export const SOCKET_NAMESPACES = {
  KITCHEN: '/kitchen',
  POS: '/pos',
  TABLES: '/tables',
} as const;

export const SOCKET_EVENTS = {
  ORDER_NEW:            'order:new',
  ORDER_STATUS_CHANGED: 'order:status_changed',
  TABLE_STATUS_CHANGED: 'table:status_changed',
  BOOKING_CONFIRMED:    'booking:confirmed',
  BOOKING_CANCELLED:    'booking:cancelled',
  PAYMENT_COMPLETED:    'payment:completed',
  MENU_UPDATED:         'menu:updated',        // emitted after any menu mutation (admin)
} as const;

export const MAX_GUEST_COUNT = 20;
export const MAX_ADVANCE_BOOKING_DAYS = 90;
