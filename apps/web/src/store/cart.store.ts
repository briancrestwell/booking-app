import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface CartItem {
  menuItemId: string;
  name: string;
  imageUrl?: string | null;
  priceSatang: number;
  quantity: number;
  notes?: string;
  variantLabel?: string;
}

interface CartStore {
  tableId: string | null;
  bookingId: string | null;
  items: CartItem[];

  setContext: (tableId: string, bookingId?: string) => void;
  addItem: (item: Omit<CartItem, 'quantity'> & { quantity?: number }) => void;
  removeItem: (menuItemId: string) => void;
  updateQuantity: (menuItemId: string, qty: number) => void;
  updateNotes: (menuItemId: string, notes: string) => void;
  clearCart: () => void;

  // Derived
  totalItems: () => number;
  totalSatang: () => number;
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      tableId: null,
      bookingId: null,
      items: [],

      setContext: (tableId, bookingId) => set({ tableId, bookingId: bookingId ?? null }),

      addItem: (item) => {
        const existing = get().items.find((i) => i.menuItemId === item.menuItemId);
        if (existing) {
          set((s) => ({
            items: s.items.map((i) =>
              i.menuItemId === item.menuItemId
                ? { ...i, quantity: i.quantity + (item.quantity ?? 1) }
                : i,
            ),
          }));
        } else {
          set((s) => ({ items: [...s.items, { ...item, quantity: item.quantity ?? 1 }] }));
        }
      },

      removeItem: (menuItemId) =>
        set((s) => ({ items: s.items.filter((i) => i.menuItemId !== menuItemId) })),

      updateQuantity: (menuItemId, qty) => {
        if (qty <= 0) {
          get().removeItem(menuItemId);
          return;
        }
        set((s) => ({
          items: s.items.map((i) => (i.menuItemId === menuItemId ? { ...i, quantity: qty } : i)),
        }));
      },

      updateNotes: (menuItemId, notes) =>
        set((s) => ({
          items: s.items.map((i) => (i.menuItemId === menuItemId ? { ...i, notes } : i)),
        })),

      clearCart: () => set({ items: [] }),

      totalItems: () => get().items.reduce((sum, i) => sum + i.quantity, 0),
      totalSatang: () => get().items.reduce((sum, i) => sum + i.priceSatang * i.quantity, 0),
    }),
    { name: 'booking-cart' },
  ),
);
