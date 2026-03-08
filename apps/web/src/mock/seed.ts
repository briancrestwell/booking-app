// ─────────────────────────────────────────────────────────────────────────────
// Mock seed data — Vietnamese F&B restaurant "Bánh Tráng Nhím - Chùa Láng"
// All prices in VND (not satang) for display convenience in mock layer.
// ─────────────────────────────────────────────────────────────────────────────

export const MOCK_BRANCH_ID = 'mock-branch-001';
export const MOCK_TABLE_ID  = 'mock-table-004';
export const MOCK_USER_ID   = 'mock-user-001';

// ── Menu catalog ─────────────────────────────────────────────────────────────
export const MOCK_CATALOG = [
  {
    id: 'cat-1',
    name: 'KHAI VỊ',
    sortOrder: 1,
    menuItems: [
      {
        id: 'item-101',
        name: 'Khoai tây chiên',
        description: 'Khoai tây chiên giòn, phục vụ kèm tương cà',
        imageUrl: 'https://images.unsplash.com/photo-1630384060421-cb20d0e0649d?w=300&q=80',
        priceSatang: 3500000,
        isAvailable: true,
        tags: ['crispy', 'vegetarian'],
      },
      {
        id: 'item-102',
        name: 'Nộm xoài bò khô',
        description: 'Xoài xanh chua ngọt, bò khô đậm đà, lạc rang',
        imageUrl: 'https://images.unsplash.com/photo-1618449840665-9ed506d73a34?w=300&q=80',
        priceSatang: 3500000,
        isAvailable: true,
        tags: ['spicy', 'popular'],
      },
      {
        id: 'item-103',
        name: 'Xoài dầm',
        description: 'Xoài chín dầm với nước mắm ớt đặc biệt',
        imageUrl: 'https://images.unsplash.com/photo-1553279768-865429fa0078?w=300&q=80',
        priceSatang: 3000000,
        isAvailable: true,
        tags: ['sweet', 'vegetarian'],
      },
      {
        id: 'item-104',
        name: 'Bánh mì muối ớt',
        description: 'Bánh mì nướng giòn chấm muối ớt xanh',
        imageUrl: 'https://images.unsplash.com/photo-1549931319-a545dcf3bc7b?w=300&q=80',
        priceSatang: 3500000,
        isAvailable: true,
        tags: ['spicy'],
      },
    ],
  },
  {
    id: 'cat-2',
    name: 'BÁNH TRÁNG',
    sortOrder: 2,
    menuItems: [
      {
        id: 'item-201',
        name: 'Bánh tráng nướng',
        description: 'Bánh tráng nướng trên than hoa, phết mỡ hành',
        imageUrl: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=300&q=80',
        priceSatang: 2500000,
        isAvailable: true,
        tags: ['popular', 'grilled'],
      },
      {
        id: 'item-202',
        name: 'Bánh tráng trộn',
        description: 'Bánh tráng trộn với xoài, tôm khô, trứng cút, sa tế',
        imageUrl: 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=300&q=80',
        priceSatang: 3000000,
        isAvailable: true,
        tags: ['spicy', 'popular', 'chef-special'],
      },
      {
        id: 'item-203',
        name: 'Bánh tráng cuộn',
        description: 'Bánh tráng cuộn với rau sống, thịt nướng, bún',
        imageUrl: 'https://images.unsplash.com/photo-1552611052-33e04de081de?w=300&q=80',
        priceSatang: 3000000,
        isAvailable: true,
        tags: ['fresh'],
      },
      {
        id: 'item-204',
        name: 'Bánh tráng phô mai',
        description: 'Bánh tráng nướng phủ phô mai tan chảy',
        imageUrl: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=300&q=80',
        priceSatang: 3500000,
        isAvailable: true,
        tags: ['cheese', 'popular'],
      },
      {
        id: 'item-205',
        name: 'Bánh tráng nem chua',
        description: 'Bánh tráng cuộn nem chua, tỏi ớt, rau thơm',
        imageUrl: 'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=300&q=80',
        priceSatang: 3200000,
        isAvailable: true,
        tags: ['sour', 'spicy'],
      },
      {
        id: 'item-206',
        name: 'Bánh tráng bơ tỏi',
        description: 'Bánh tráng nướng bơ tỏi thơm lừng',
        imageUrl: 'https://images.unsplash.com/photo-1555126634-323283e090fa?w=300&q=80',
        priceSatang: 3200000,
        isAvailable: false,
        tags: ['garlic'],
      },
      {
        id: 'item-207',
        name: 'Bánh tráng sate tôm',
        description: 'Bánh tráng phết sa tế tôm chua cay',
        imageUrl: 'https://images.unsplash.com/photo-1567620832903-9fc6debc209f?w=300&q=80',
        priceSatang: 3000000,
        isAvailable: true,
        tags: ['spicy', 'seafood'],
      },
      {
        id: 'item-208',
        name: 'Bánh tráng trứng cút',
        description: 'Bánh tráng nướng phủ trứng cút, hành lá',
        imageUrl: 'https://images.unsplash.com/photo-1482049016688-2d3e1b311543?w=300&q=80',
        priceSatang: 3000000,
        isAvailable: true,
        tags: ['egg'],
      },
      {
        id: 'item-209',
        name: 'Bánh tráng rong biển',
        description: 'Bánh tráng kết hợp rong biển kiểu Nhật',
        imageUrl: 'https://images.unsplash.com/photo-1496116218417-1a781b1c416c?w=300&q=80',
        priceSatang: 3500000,
        isAvailable: true,
        tags: ['seaweed'],
      },
    ],
  },
  {
    id: 'cat-3',
    name: 'COMBO',
    sortOrder: 3,
    menuItems: [
      {
        id: 'item-301',
        name: 'Combo Truyền Thống Tặng 1 đồ uống',
        description: 'Bánh tráng nướng + Bánh tráng trộn + Bánh tráng cuộn + Bánh Trứng cút nướng + 1 cốc trà',
        imageUrl: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=300&q=80',
        priceSatang: 13500000,
        isAvailable: true,
        tags: ['combo', 'value', 'popular'],
      },
      {
        id: 'item-302',
        name: 'Combo Best Seller Tặng 1 đồ uống',
        description: 'Bánh tráng nướng Phô mai + Bánh tráng cuộn + Bánh Trứng cút nướng + Nem chua rán nhỏ + 1 cốc trà',
        imageUrl: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=300&q=80',
        priceSatang: 14500000,
        isAvailable: true,
        tags: ['combo', 'bestseller', 'chef-special'],
      },
    ],
  },
  {
    id: 'cat-4',
    name: 'ĐỒ UỐNG',
    sortOrder: 4,
    menuItems: [
      {
        id: 'item-401',
        name: 'Trà chanh',
        description: 'Trà chanh đường tươi mát lạnh',
        imageUrl: 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=300&q=80',
        priceSatang: 2000000,
        isAvailable: true,
        tags: ['cold', 'refreshing'],
      },
      {
        id: 'item-402',
        name: 'Trà quất (Giá thường)',
        description: 'Trà quất tươi ngọt thanh, thêm topping tùy chọn',
        imageUrl: 'https://images.unsplash.com/photo-1544145945-f90425340c7e?w=300&q=80',
        priceSatang: 2000000,
        isAvailable: true,
        tags: ['cold', 'popular'],
      },
      {
        id: 'item-403',
        name: 'Soda chanh muối',
        description: 'Soda lạnh với chanh muối giải nhiệt',
        imageUrl: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=300&q=80',
        priceSatang: 2500000,
        isAvailable: true,
        tags: ['soda', 'cold'],
      },
      {
        id: 'item-404',
        name: 'Nước dừa tươi',
        description: 'Nước dừa tươi nguyên chất',
        imageUrl: 'https://images.unsplash.com/photo-1585442530994-c2099b6888e4?w=300&q=80',
        priceSatang: 3000000,
        isAvailable: true,
        tags: ['fresh', 'natural'],
      },
      {
        id: 'item-405',
        name: 'Sinh tố xoài',
        description: 'Sinh tố xoài chín thơm ngọt',
        imageUrl: 'https://images.unsplash.com/photo-1623065422902-30a2d299bbe4?w=300&q=80',
        priceSatang: 3500000,
        isAvailable: true,
        tags: ['smoothie', 'fresh'],
      },
      {
        id: 'item-406',
        name: 'Pepsi',
        description: 'Pepsi lon lạnh',
        imageUrl: 'https://images.unsplash.com/photo-1530328342429-24316a6c81e4?w=300&q=80',
        priceSatang: 1500000,
        isAvailable: true,
        tags: ['soda'],
      },
      {
        id: 'item-407',
        name: 'COCA',
        description: 'Coca Cola lon lạnh',
        imageUrl: 'https://images.unsplash.com/photo-1621506289937-a8e4df240d0b?w=300&q=80',
        priceSatang: 1500000,
        isAvailable: true,
        tags: ['soda'],
      },
      {
        id: 'item-408',
        name: 'Nước lọc',
        description: 'Nước lọc đóng chai',
        imageUrl: 'https://images.unsplash.com/photo-1548839140-29a749e1cf4d?w=300&q=80',
        priceSatang: 500000,
        isAvailable: true,
        tags: ['still'],
      },
      {
        id: 'item-409',
        name: 'Bia Hà Nội',
        description: 'Bia Hà Nội lon',
        imageUrl: 'https://images.unsplash.com/photo-1608270586620-248524c67de9?w=300&q=80',
        priceSatang: 2000000,
        isAvailable: true,
        tags: ['beer', 'alcohol'],
      },
      {
        id: 'item-410',
        name: 'Cà phê đen đá',
        description: 'Cà phê đen pha phin chính thống',
        imageUrl: 'https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=300&q=80',
        priceSatang: 2500000,
        isAvailable: true,
        tags: ['coffee', 'hot', 'cold'],
      },
    ],
  },
];

// ── Order status flow for demo ────────────────────────────────────────────────
export const ORDER_STATUS_FLOW = [
  'PENDING', 'CONFIRMED', 'PREPARING', 'READY', 'SERVED',
] as const;

// ── Pre-built mock orders (shown on order-history + feedback pages) ───────────
export function makeMockOrders() {
  const now = Date.now();
  return [
    {
      id: 'order-001',
      tableId:    MOCK_TABLE_ID,
      bookingId:  null,
      userId:     MOCK_USER_ID,
      status:     'CONFIRMED',
      totalSatang: 13500000 + 2000000,
      notes:      null,
      createdAt:  new Date(now - 4 * 60 * 1000).toISOString(),
      updatedAt:  new Date(now - 3 * 60 * 1000).toISOString(),
      table: { id: MOCK_TABLE_ID, number: 4, section: 'Trong nhà' },
      items: [
        {
          id: 'oi-001',
          orderId:    'order-001',
          menuItemId: 'item-301',
          quantity: 1,
          unitSatang: 13500000,
          notes: null,
          menuItem: { id: 'item-301', name: 'Combo Truyền Thống Tặng 1 đồ uống', imageUrl: null },
        },
        {
          id: 'oi-002',
          orderId:    'order-001',
          menuItemId: 'item-402',
          quantity: 1,
          unitSatang: 2000000,
          notes: 'Truyền thống',
          menuItem: { id: 'item-402', name: 'Trà quất (Giá thường)', imageUrl: null },
        },
      ],
    },
  ];
}

// ── Mock bookings ─────────────────────────────────────────────────────────────
export const MOCK_BOOKINGS = [
  {
    id: 'booking-001',
    branchId:   MOCK_BRANCH_ID,
    tableId:    MOCK_TABLE_ID,
    slotId:     'slot-001',
    userId:     MOCK_USER_ID,
    guestCount: 4,
    scheduledAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
    status: 'CONFIRMED',
    specialRequests: 'Ghế trẻ em cho 1 bé',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    table: { number: 4, section: 'Trong nhà' },
    slot: { label: 'Tối — 18:00', startTime: new Date(Date.now() + 60 * 60 * 1000).toISOString(), endTime: new Date(Date.now() + 3 * 60 * 60 * 1000).toISOString() },
  },
];
