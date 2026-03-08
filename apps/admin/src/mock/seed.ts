// ─────────────────────────────────────────────────────────────────────────────
// Admin mock seed — Tables, Orders, Bookings for the POS dashboard.
// Mirrors the shape returned by the NestJS API so switching to real mode is
// a single env-var toggle.
// ─────────────────────────────────────────────────────────────────────────────

export const MOCK_BRANCH_ID = 'mock-branch-001';

// ── Menu types ────────────────────────────────────────────────────────────────
export interface AdminMenuItem {
  id:          string;
  categoryId:  string;
  name:        string;
  description: string;
  priceSatang: number;
  imageUrl:    string;
  isAvailable: boolean;
  tags:        string[];
}

export interface AdminCategory {
  id:        string;
  name:      string;
  sortOrder: number;
  items:     AdminMenuItem[];
}

export const MOCK_ADMIN_MENU: AdminCategory[] = [
  {
    id: 'cat-1', name: 'KHAI VỊ', sortOrder: 1,
    items: [
      { id: 'item-101', categoryId: 'cat-1', name: 'Khoai tây chiên',  description: 'Khoai tây chiên giòn, phục vụ kèm tương cà', priceSatang: 3_500_000, imageUrl: 'https://images.unsplash.com/photo-1630384060421-cb20d0e0649d?w=300&q=80', isAvailable: true,  tags: ['crispy', 'vegetarian'] },
      { id: 'item-102', categoryId: 'cat-1', name: 'Nộm xoài bò khô', description: 'Xoài xanh chua ngọt, bò khô đậm đà, lạc rang', priceSatang: 3_500_000, imageUrl: 'https://images.unsplash.com/photo-1618449840665-9ed506d73a34?w=300&q=80', isAvailable: true,  tags: ['spicy', 'popular'] },
      { id: 'item-103', categoryId: 'cat-1', name: 'Xoài dầm',        description: 'Xoài chín dầm với nước mắm ớt đặc biệt',    priceSatang: 3_000_000, imageUrl: 'https://images.unsplash.com/photo-1553279768-865429fa0078?w=300&q=80', isAvailable: true,  tags: ['sweet'] },
      { id: 'item-104', categoryId: 'cat-1', name: 'Bánh mì muối ớt', description: 'Bánh mì nướng giòn chấm muối ớt xanh',      priceSatang: 3_500_000, imageUrl: 'https://images.unsplash.com/photo-1549931319-a545dcf3bc7b?w=300&q=80', isAvailable: false, tags: ['spicy'] },
    ],
  },
  {
    id: 'cat-2', name: 'BÁNH TRÁNG', sortOrder: 2,
    items: [
      { id: 'item-201', categoryId: 'cat-2', name: 'Bánh tráng nướng',    description: 'Bánh tráng nướng trên than hoa, phết mỡ hành',          priceSatang: 2_500_000, imageUrl: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=300&q=80', isAvailable: true,  tags: ['popular', 'grilled'] },
      { id: 'item-202', categoryId: 'cat-2', name: 'Bánh tráng trộn',     description: 'Bánh tráng trộn với xoài, tôm khô, trứng cút, sa tế',   priceSatang: 3_000_000, imageUrl: 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=300&q=80', isAvailable: true,  tags: ['spicy', 'popular'] },
      { id: 'item-204', categoryId: 'cat-2', name: 'Bánh tráng phô mai',  description: 'Bánh tráng nướng phủ phô mai tan chảy',                  priceSatang: 3_500_000, imageUrl: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=300&q=80', isAvailable: true,  tags: ['cheese'] },
      { id: 'item-207', categoryId: 'cat-2', name: 'Bánh tráng sate tôm', description: 'Bánh tráng phết sa tế tôm chua cay',                     priceSatang: 3_000_000, imageUrl: 'https://images.unsplash.com/photo-1567620832903-9fc6debc209f?w=300&q=80', isAvailable: true,  tags: ['spicy'] },
    ],
  },
  {
    id: 'cat-3', name: 'COMBO', sortOrder: 3,
    items: [
      { id: 'item-301', categoryId: 'cat-3', name: 'Combo Truyền Thống',  description: 'Bánh tráng nướng + trộn + cuộn + Trứng cút + 1 trà',    priceSatang: 13_500_000, imageUrl: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=300&q=80', isAvailable: true,  tags: ['combo', 'value'] },
      { id: 'item-302', categoryId: 'cat-3', name: 'Combo Best Seller',   description: 'Phô mai + cuộn + Trứng cút + Nem chua + 1 trà',          priceSatang: 14_500_000, imageUrl: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=300&q=80', isAvailable: true,  tags: ['combo', 'bestseller'] },
    ],
  },
  {
    id: 'cat-4', name: 'ĐỒ UỐNG', sortOrder: 4,
    items: [
      { id: 'item-401', categoryId: 'cat-4', name: 'Trà chanh',      description: 'Trà chanh đường tươi mát lạnh',                priceSatang: 2_000_000, imageUrl: 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=300&q=80', isAvailable: true,  tags: ['cold'] },
      { id: 'item-402', categoryId: 'cat-4', name: 'Trà quất',       description: 'Trà quất tươi ngọt thanh',                     priceSatang: 2_000_000, imageUrl: 'https://images.unsplash.com/photo-1544145945-f90425340c7e?w=300&q=80', isAvailable: true,  tags: ['popular'] },
      { id: 'item-403', categoryId: 'cat-4', name: 'Soda chanh muối',description: 'Soda lạnh với chanh muối giải nhiệt',           priceSatang: 2_500_000, imageUrl: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=300&q=80', isAvailable: true,  tags: ['soda'] },
      { id: 'item-404', categoryId: 'cat-4', name: 'Nước dừa tươi',  description: 'Nước dừa tươi nguyên chất',                    priceSatang: 3_000_000, imageUrl: 'https://images.unsplash.com/photo-1585442530994-c2099b6888e4?w=300&q=80', isAvailable: true,  tags: ['fresh'] },
      { id: 'item-409', categoryId: 'cat-4', name: 'Bia Hà Nội',     description: 'Bia Hà Nội lon',                               priceSatang: 2_000_000, imageUrl: 'https://images.unsplash.com/photo-1608270586620-248524c67de9?w=300&q=80', isAvailable: true,  tags: ['beer'] },
      { id: 'item-410', categoryId: 'cat-4', name: 'Cà phê đen đá',  description: 'Cà phê đen pha phin chính thống',              priceSatang: 2_500_000, imageUrl: 'https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=300&q=80', isAvailable: false, tags: ['coffee'] },
    ],
  },
];

// ── Table status types ────────────────────────────────────────────────────────
export type TableStatus = 'AVAILABLE' | 'LOCKED' | 'OCCUPIED' | 'CLEARING';

export interface MockTable {
  id: string;
  branchId: string;
  number: number;
  section: string;
  capacity: number;
  status: TableStatus;
  currentBooking?: {
    id: string;
    guestName: string;
    guestCount: number;
    scheduledAt: string;
  } | null;
}

export interface MockOrderItem {
  id: string;
  menuItemId: string;
  name: string;
  quantity: number;
  unitSatang: number;
  notes?: string | null;
}

export interface MockOrder {
  id: string;
  tableId: string;
  status: string;
  totalSatang: number;
  createdAt: string;
  items: MockOrderItem[];
}

// ── Initial tables ────────────────────────────────────────────────────────────
function makeTable(
  num: number,
  section: string,
  capacity: number,
  status: TableStatus,
  booking?: MockTable['currentBooking'],
): MockTable {
  return {
    id: `table-${String(num).padStart(3, '0')}`,
    branchId: MOCK_BRANCH_ID,
    number: num,
    section,
    capacity,
    status,
    currentBooking: booking ?? null,
  };
}

const soon = (minFromNow: number) =>
  new Date(Date.now() + minFromNow * 60_000).toISOString();

export const INITIAL_TABLES: MockTable[] = [
  // Trong nhà
  makeTable(1,  'Trong nhà', 2, 'AVAILABLE'),
  makeTable(2,  'Trong nhà', 4, 'OCCUPIED', {
    id: 'bk-001', guestName: 'Nguyễn Minh', guestCount: 3,
    scheduledAt: soon(-25),
  }),
  makeTable(3,  'Trong nhà', 4, 'OCCUPIED', {
    id: 'bk-002', guestName: 'Trần Lan', guestCount: 4,
    scheduledAt: soon(-10),
  }),
  makeTable(4,  'Trong nhà', 6, 'LOCKED', {
    id: 'bk-003', guestName: 'Lê Tuấn', guestCount: 5,
    scheduledAt: soon(15),
  }),
  makeTable(5,  'Trong nhà', 2, 'AVAILABLE'),
  makeTable(6,  'Trong nhà', 2, 'CLEARING'),
  // Ngoài trời
  makeTable(7,  'Ngoài trời', 4, 'AVAILABLE'),
  makeTable(8,  'Ngoài trời', 4, 'OCCUPIED', {
    id: 'bk-004', guestName: 'Phạm Hương', guestCount: 2,
    scheduledAt: soon(-40),
  }),
  makeTable(9,  'Ngoài trời', 6, 'AVAILABLE'),
  makeTable(10, 'Ngoài trời', 8, 'LOCKED', {
    id: 'bk-005', guestName: 'Vũ Hội nhóm', guestCount: 7,
    scheduledAt: soon(5),
  }),
  // Phòng riêng
  makeTable(11, 'Phòng riêng', 8,  'OCCUPIED', {
    id: 'bk-006', guestName: 'Hoàng Gia đình', guestCount: 8,
    scheduledAt: soon(-50),
  }),
  makeTable(12, 'Phòng riêng', 10, 'AVAILABLE'),
];

// ── Kitchen-specific types ────────────────────────────────────────────────────
export type KitchenOrderStatus = 'PENDING' | 'CONFIRMED' | 'PREPARING' | 'READY';

export interface KitchenOrderItem {
  id:         string;
  name:       string;
  quantity:   number;
  notes?:     string | null;
  /** Station that should prepare this item */
  station?:   KitchenStation;
}

export type KitchenStation = 'GRILL' | 'COLD' | 'DRINKS' | 'ALL';

export interface KitchenOrder {
  id:         string;
  tableId:    string;
  tableNumber: number;
  section:    string;
  status:     KitchenOrderStatus;
  /** ISO timestamp when order was placed — used for elapsed timer */
  placedAt:   string;
  items:      KitchenOrderItem[];
  isNew?:     boolean; // flash-highlight for just-arrived orders
}

// ── Initial KDS queue ─────────────────────────────────────────────────────────
export const INITIAL_KDS_ORDERS: KitchenOrder[] = [
  {
    id: 'kds-001',
    tableId: 'table-003',
    tableNumber: 3,
    section: 'Trong nhà',
    status: 'PENDING',
    placedAt: soon(-3),
    items: [
      { id: 'ki-1', name: 'Bánh tráng trộn',  quantity: 3, station: 'COLD' },
      { id: 'ki-2', name: 'Bánh tráng nướng', quantity: 2, station: 'GRILL' },
    ],
  },
  {
    id: 'kds-002',
    tableId: 'table-002',
    tableNumber: 2,
    section: 'Trong nhà',
    status: 'PREPARING',
    placedAt: soon(-12),
    items: [
      { id: 'ki-3', name: 'Combo Truyền Thống', quantity: 1, station: 'ALL', notes: 'Ít ớt' },
      { id: 'ki-4', name: 'Trà chanh',          quantity: 2, station: 'DRINKS' },
    ],
  },
  {
    id: 'kds-003',
    tableId: 'table-008',
    tableNumber: 8,
    section: 'Ngoài trời',
    status: 'PREPARING',
    placedAt: soon(-22),
    items: [
      { id: 'ki-5', name: 'Combo Best Seller',  quantity: 1, station: 'ALL' },
      { id: 'ki-6', name: 'Nước dừa tươi',      quantity: 2, station: 'DRINKS' },
    ],
  },
  {
    id: 'kds-004',
    tableId: 'table-011',
    tableNumber: 11,
    section: 'Phòng riêng',
    status: 'READY',
    placedAt: soon(-35),
    items: [
      { id: 'ki-7', name: 'Bánh tráng phô mai', quantity: 3, station: 'GRILL' },
      { id: 'ki-8', name: 'Bia Hà Nội',         quantity: 4, station: 'DRINKS' },
    ],
  },
  {
    id: 'kds-005',
    tableId: 'table-003',
    tableNumber: 3,
    section: 'Trong nhà',
    status: 'CONFIRMED',
    placedAt: soon(-1),
    items: [
      { id: 'ki-9',  name: 'Bánh tráng sate tôm',   quantity: 2, station: 'GRILL', notes: 'Extra cay' },
      { id: 'ki-10', name: 'Sinh tố xoài',           quantity: 2, station: 'DRINKS' },
    ],
  },
];

export const INITIAL_ORDERS: Record<string, MockOrder[]> = {
  'table-002': [
    {
      id: 'ord-002-a',
      tableId: 'table-002',
      status: 'PREPARING',
      totalSatang: 13_500_000 + 2_000_000,
      createdAt: soon(-22),
      items: [
        { id: 'oi-1', menuItemId: 'item-301', name: 'Combo Truyền Thống', quantity: 1, unitSatang: 13_500_000 },
        { id: 'oi-2', menuItemId: 'item-401', name: 'Trà chanh', quantity: 2, unitSatang: 2_000_000 },
      ],
    },
  ],
  'table-003': [
    {
      id: 'ord-003-a',
      tableId: 'table-003',
      status: 'CONFIRMED',
      totalSatang: 3_500_000 * 3,
      createdAt: soon(-8),
      items: [
        { id: 'oi-3', menuItemId: 'item-202', name: 'Bánh tráng trộn', quantity: 3, unitSatang: 3_500_000 },
      ],
    },
    {
      id: 'ord-003-b',
      tableId: 'table-003',
      status: 'PENDING',
      totalSatang: 2_500_000 * 2,
      createdAt: soon(-2),
      items: [
        { id: 'oi-4', menuItemId: 'item-201', name: 'Bánh tráng nướng', quantity: 2, unitSatang: 2_500_000 },
      ],
    },
  ],
  'table-008': [
    {
      id: 'ord-008-a',
      tableId: 'table-008',
      status: 'READY',
      totalSatang: 14_500_000,
      createdAt: soon(-35),
      items: [
        { id: 'oi-5', menuItemId: 'item-302', name: 'Combo Best Seller', quantity: 1, unitSatang: 14_500_000 },
      ],
    },
  ],
  'table-011': [
    {
      id: 'ord-011-a',
      tableId: 'table-011',
      status: 'SERVED',
      totalSatang: 13_500_000 * 2 + 3_500_000 * 4,
      createdAt: soon(-45),
      items: [
        { id: 'oi-6', menuItemId: 'item-301', name: 'Combo Truyền Thống', quantity: 2, unitSatang: 13_500_000 },
        { id: 'oi-7', menuItemId: 'item-409', name: 'Bia Hà Nội', quantity: 4, unitSatang: 2_000_000 },
        { id: 'oi-8', menuItemId: 'item-405', name: 'Sinh tố xoài', quantity: 2, unitSatang: 3_500_000 },
      ],
    },
  ],
};
