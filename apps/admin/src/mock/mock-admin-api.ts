// Admin mock API — mirrors the real NestJS endpoints.
// Activated when NEXT_PUBLIC_MOCK_MODE=true.

import {
  INITIAL_TABLES,
  INITIAL_ORDERS,
  INITIAL_KDS_ORDERS,
  MOCK_ADMIN_MENU,
  type MockTable,
  type MockOrder,
  type TableStatus,
  type KitchenOrder,
  type KitchenOrderStatus,
  type AdminMenuItem,
  type AdminCategory,
} from './seed';
import { MockBridge } from '@booking/shared';

const delay = (ms = 350) => new Promise<void>((r) => setTimeout(r, ms));

// Mutable runtime state
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let _tables: MockTable[] = INITIAL_TABLES.map((t) => ({ ...t }));
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const _orders: Record<string, MockOrder[]> = Object.fromEntries(
  Object.entries(INITIAL_ORDERS).map(([k, v]) => [k, v.map((o) => ({ ...o }))]),
);
let _kdsOrders: KitchenOrder[] = INITIAL_KDS_ORDERS.map((o) => ({ ...o }));

// Deep-clone menu to allow mutations
let _menu: AdminCategory[] = MOCK_ADMIN_MENU.map((cat) => ({
  ...cat,
  items: cat.items.map((i) => ({ ...i })),
}));

function flatItems(): AdminMenuItem[] {
  return _menu.flatMap((c) => c.items);
}

export const mockAdminApi = {
  tables: {
    list: async (_branchId: string) => {
      await delay(500);
      return [..._tables];
    },
    updateStatus: async (tableId: string, status: TableStatus) => {
      await delay(300);
      const t = _tables.find((t) => t.id === tableId);
      if (t) {
        t.status = status;
        if (status === 'AVAILABLE') t.currentBooking = null;
      }
      // Notify web app of table status change
      MockBridge.emit('TABLE_STATUS', {
        tableId,
        branchId: 'mock-branch-001',
        status,
      });
      return t;
    },
  },
  orders: {
    byTable: async (tableId: string) => {
      await delay(400);
      return _orders[tableId] ?? [];
    },
    updateStatus: async (orderId: string, tableId: string, status: string) => {
      await delay(300);
      const order = (_orders[tableId] ?? []).find((o) => o.id === orderId);
      if (order) order.status = status;
      return order;
    },
    markTableServed: async (tableId: string) => {
      await delay(400);
      const orders = _orders[tableId] ?? [];
      orders.forEach((o) => { if (o.status !== 'CANCELLED') o.status = 'SERVED'; });
      return orders;
    },
    addToTable: async (
      tableId: string,
      items: { menuItemId: string; name: string; quantity: number; unitSatang: number; notes?: string }[],
    ) => {
      await delay(500);
      const totalSatang = items.reduce((s, i) => s + i.quantity * i.unitSatang, 0);
      const newOrder = {
        id:          `order-${Date.now()}`,
        tableId,
        status:      'PENDING' as const,
        totalSatang,
        createdAt:   new Date().toISOString(),
        items: items.map((i, idx) => ({
          id:         `oi-${Date.now()}-${idx}`,
          menuItemId: i.menuItemId,
          name:       i.name,
          quantity:   i.quantity,
          unitSatang: i.unitSatang,
          notes:      i.notes ?? null,
        })),
      };
      if (!_orders[tableId]) _orders[tableId] = [];
      _orders[tableId].push(newOrder);
      // Also push to KDS queue
      _kdsOrders.unshift({
        id:          newOrder.id,
        tableId,
        tableNumber: _tables.find((t) => t.id === tableId)?.number ?? 0,
        section:     _tables.find((t) => t.id === tableId)?.section ?? '',
        status:      'PENDING',
        placedAt:    newOrder.createdAt,
        isNew:       true,
        items: items.map((i, idx) => ({
          id:       `oi-${Date.now()}-${idx}`,
          name:     i.name,
          quantity: i.quantity,
          notes:    i.notes,
        })),
      });

      // Notify web app: new order placed from POS
      MockBridge.emit('ORDER_NEW', {
        id:          newOrder.id,
        tableId,
        status:      'PENDING',
        totalSatang: newOrder.totalSatang,
        createdAt:   newOrder.createdAt,
        items:       newOrder.items,
      });

      return newOrder;
    },
  },
  checkout: {
    confirmPayment: async (tableId: string) => {
      await delay(700);
      // Mark all orders served, release table
      const orders = _orders[tableId] ?? [];
      orders.forEach((o) => { if (o.status !== 'CANCELLED') o.status = 'SERVED'; });
      const t = _tables.find((t) => t.id === tableId);
      if (t) {
        t.status = 'AVAILABLE';
        t.currentBooking = null;
      }
      // Clear orders for this table after checkout
      _orders[tableId] = [];

      // Notify web app: payment completed → show SERVED status, release table
      MockBridge.emit('PAYMENT_COMPLETED', { tableId });

      // Also notify table status change
      MockBridge.emit('TABLE_STATUS', {
        tableId,
        branchId: 'mock-branch-001',
        status: 'AVAILABLE',
      });

      return { success: true, tableId };
    },
  },
  kitchen: {
    listActive: async () => {
      await delay(450);
      // Active = everything except SERVED / CANCELLED
      return _kdsOrders.filter((o) =>
        ['PENDING', 'CONFIRMED', 'PREPARING', 'READY'].includes(o.status),
      );
    },
    updateStatus: async (orderId: string, status: KitchenOrderStatus) => {
      await delay(280);
      const order = _kdsOrders.find((o) => o.id === orderId);
      if (order) { order.status = status; order.isNew = false; }
      return order;
    },
  },
  menu: {
    listCategories: async () => {
      await delay(400);
      return _menu.map((cat) => ({ ...cat, items: cat.items.map((i) => ({ ...i })) }));
    },
    toggle86: async (itemId: string, isAvailable: boolean) => {
      await delay(180);
      const item = flatItems().find((i) => i.id === itemId);
      if (item) item.isAvailable = isAvailable;
      MockBridge.emit('MENU_UPDATED', { itemId, type: 'toggle86' });
      return item;
    },
    updateItem: async (itemId: string, data: Partial<AdminMenuItem>) => {
      await delay(400);
      const item = flatItems().find((i) => i.id === itemId);
      if (item) Object.assign(item, data);
      MockBridge.emit('MENU_UPDATED', { itemId, type: 'update' });
      return item;
    },
    createItem: async (data: Omit<AdminMenuItem, 'id'>) => {
      await delay(500);
      const newItem: AdminMenuItem = { ...data, id: `item-${Date.now()}` };
      const cat = _menu.find((c) => c.id === data.categoryId);
      if (cat) cat.items.push(newItem);
      MockBridge.emit('MENU_UPDATED', { itemId: newItem.id, type: 'create' });
      return newItem;
    },
    createCategory: async (name: string) => {
      await delay(300);
      const newCat: AdminCategory = {
        id:        `cat-${Date.now()}`,
        name:      name.toUpperCase().trim(),
        sortOrder: _menu.length + 1,
        items:     [],
      };
      _menu.push(newCat);
      MockBridge.emit('MENU_UPDATED', { type: 'category' });
      return newCat;
    },
    deleteCategory: async (catId: string) => {
      await delay(300);
      _menu = _menu.filter((c) => c.id !== catId);
      MockBridge.emit('MENU_UPDATED', { type: 'category' });
      return { success: true };
    },
  },
  // Reset everything
  _reset: () => {
    _tables = INITIAL_TABLES.map((t) => ({ ...t }));
    Object.assign(_orders, Object.fromEntries(
      Object.entries(INITIAL_ORDERS).map(([k, v]) => [k, v.map((o) => ({ ...o }))]),
    ));
    _kdsOrders = INITIAL_KDS_ORDERS.map((o) => ({ ...o }));
    _menu = MOCK_ADMIN_MENU.map((cat) => ({ ...cat, items: cat.items.map((i) => ({ ...i })) }));
  },
  // Expose mutable state for socket simulation
  _getTable:    (id: string)    => _tables.find((t) => t.id === id),
  _getKdsOrders: ()             => _kdsOrders,
  // Add a brand-new KDS order (called by mock socket simulation)
  _pushKdsOrder: (order: KitchenOrder) => { _kdsOrders.unshift(order); },
};
