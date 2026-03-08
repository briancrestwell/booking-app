// Mock API client — mirrors the shape of src/api/client.ts but returns
// in-memory seed data with realistic network delays.
// Activated when NEXT_PUBLIC_MOCK_MODE=true.

import {
  MOCK_BRANCH_ID,
  MOCK_TABLE_ID,
  MOCK_USER_ID,
  MOCK_CATALOG,
  MOCK_BOOKINGS,
  makeMockOrders,
} from '@/mock/seed';
import { MockBridge } from '@booking/shared';

// Mutable runtime state so mutations are reflected immediately in the same session
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let _orders: any[] = makeMockOrders();
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let _bookings: any[] = [...MOCK_BOOKINGS];

const delay = (ms = 400) => new Promise<void>((r) => setTimeout(r, ms));

function randomId() {
  return Math.random().toString(36).slice(2, 10);
}

export const mockApi = {
  menu: {
    getCatalog: async (_branchId: string) => {
      await delay(600);
      // Return a deep clone so admin 86 mutations don't bleed into web cache
      return MOCK_CATALOG.map((c) => ({ ...c, menuItems: c.menuItems.map((m) => ({ ...m })) }));
    },
    search: async (_branchId: string, q: string) => {
      await delay(300);
      const lc = q.toLowerCase();
      return MOCK_CATALOG.flatMap((cat) =>
        cat.menuItems.filter(
          (i) => i.name.toLowerCase().includes(lc) || i.description.toLowerCase().includes(lc),
        ),
      );
    },
  },
  orders: {
    placeOrder: async (body: {
      tableId: string;
      bookingId?: string;
      items: { menuItemId: string; quantity: number; notes?: string }[];
      notes?: string;
    }) => {
      await delay(700);
      const allItems = MOCK_CATALOG.flatMap((c) => c.menuItems);
      const orderItems = body.items.map((i) => {
        const mi = allItems.find((m) => m.id === i.menuItemId)!;
        return {
          id: `oi-${randomId()}`,
          orderId: '',
          menuItemId: mi.id,
          quantity: i.quantity,
          unitSatang: mi.priceSatang,
          notes: i.notes ?? null,
          menuItem: { id: mi.id, name: mi.name, imageUrl: mi.imageUrl },
        };
      });
      const total = orderItems.reduce((s, it) => s + it.unitSatang * it.quantity, 0);
      const newOrder = {
        id: `order-${randomId()}`,
        tableId: body.tableId ?? MOCK_TABLE_ID,
        bookingId: body.bookingId ?? null,
        userId: MOCK_USER_ID,
        status: 'PENDING',
        totalSatang: total,
        notes: body.notes ?? null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        table: { id: MOCK_TABLE_ID, number: 4, section: 'Trong nhà' },
        items: orderItems.map((i) => ({ ...i, orderId: '' })),
      };
      _orders.unshift(newOrder);

      // ── Notify admin KDS via BroadcastChannel bridge ──────────────────────
      MockBridge.emit('ORDER_NEW', {
        id:          newOrder.id,
        tableId:     newOrder.tableId,
        tableNumber: 4,
        section:     'Trong nhà',
        status:      'PENDING',
        placedAt:    newOrder.createdAt,
        isNew:       true,
        items: orderItems.map((i) => ({
          id:       i.id,
          name:     allItems.find((m) => m.id === i.menuItemId)?.name ?? i.menuItemId,
          quantity: i.quantity,
          notes:    i.notes,
        })),
      });

      return newOrder;
    },

    updateStatus: async (orderId: string, status: string) => {
      await delay(300);
      const order = _orders.find((o) => o.id === orderId);
      if (order) { order.status = status; order.updatedAt = new Date().toISOString(); }

      // Notify admin of order status change
      if (order) {
        MockBridge.emit('ORDER_STATUS', {
          orderId: order.id,
          tableId: order.tableId,
          status,
        });
      }
      return order;
    },

    byTable: async (_tableId: string) => {
      await delay(400);
      return _orders;
    },

    byBooking: async (_bookingId: string) => {
      await delay(400);
      return _orders.filter((o) => o.bookingId === _bookingId);
    },
  },

  bookings: {
    create: async (body: {
      branchId: string;
      tableId: string;
      slotId: string;
      guestCount: number;
      specialRequests?: string;
      scheduledAt: string;
    }) => {
      await delay(800);
      const newBooking = {
        id: `booking-${randomId()}`,
        branchId: body.branchId ?? MOCK_BRANCH_ID,
        tableId: body.tableId ?? MOCK_TABLE_ID,
        slotId: body.slotId ?? 'slot-001',
        userId: MOCK_USER_ID,
        guestCount: body.guestCount,
        scheduledAt: body.scheduledAt,
        status: 'CONFIRMED',
        specialRequests: body.specialRequests ?? null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        table: { number: 4, section: 'Trong nhà' },
        slot: {
          label: 'Tối — 18:00',
          startTime: body.scheduledAt,
          endTime: new Date(new Date(body.scheduledAt).getTime() + 2 * 60 * 60 * 1000).toISOString(),
        },
      };
      _bookings.unshift(newBooking);

      // Notify admin: table is now LOCKED (booking confirmed)
      MockBridge.emit('BOOKING_CONFIRMED', {
        tableId: newBooking.tableId,
        booking: newBooking,
      });

      return newBooking;
    },

    mine: async () => {
      await delay(400);
      return _bookings;
    },

    get: async (id: string) => {
      await delay(200);
      return _bookings.find((b) => b.id === id) ?? null;
    },

    cancel: async (id: string) => {
      await delay(400);
      const b = _bookings.find((b) => b.id === id);
      if (b) b.status = 'CANCELLED';

      // Notify admin: table is released
      if (b) {
        MockBridge.emit('BOOKING_CANCELLED', { tableId: b.tableId, bookingId: b.id });
      }
      return b;
    },
  },

  // Helper: advance first PENDING/CONFIRMED/PREPARING/READY order to the next status
  _advanceFirstOrder: () => {
    const flow = ['PENDING', 'CONFIRMED', 'PREPARING', 'READY', 'SERVED'];
    const order = _orders.find((o) => flow.indexOf(o.status) < flow.indexOf('SERVED'));
    if (!order) return null;
    const next = flow[flow.indexOf(order.status) + 1];
    order.status = next;
    order.updatedAt = new Date().toISOString();

    // Notify admin KDS of status change
    MockBridge.emit('ORDER_STATUS', {
      orderId: order.id,
      tableId: order.tableId,
      status:  next,
    });

    return { ...order };
  },

  // Mark all orders for a table as PAID (called by admin checkout via bridge)
  _applyPayment: (tableId: string) => {
    _orders
      .filter((o) => o.tableId === tableId && o.status !== 'CANCELLED')
      .forEach((o) => { o.status = 'SERVED'; o.updatedAt = new Date().toISOString(); });
  },

  // Reset to initial mock state
  _reset: () => {
    _orders = makeMockOrders();
    _bookings = [...MOCK_BOOKINGS];
  },

  // Expose for bridge handler (admin sends new orders → web sees them)
  _pushOrder: (order: unknown) => { _orders.unshift(order); },
};
