// Socket.IO event payload types — shared between apps/api and apps/web

export interface TableStatusChangedPayload {
  tableId:   string;
  status:    string;    // TableStatus enum value
  bookingId?: string;
  branchId?: string;
}

export interface BookingConfirmedPayload {
  bookingId: string;
  tableId:   string;
  branchId:  string;
}

export interface BookingCancelledPayload {
  bookingId: string;
  tableId:   string;
  branchId:  string;
}

export interface PaymentCompletedPayload {
  tableId:     string;
  paymentId:   string;
  totalSatang: number;
}

export interface MenuUpdatedPayload {
  action:       'created' | 'updated' | 'deleted' | 'toggle86';
  itemId:       string;
  isAvailable?: boolean;
}

export interface NewOrderKitchenItem {
  name: string;
  quantity: number;
  notes?: string;
}

export interface NewOrderKitchenPayload {
  orderId: string;
  tableId: string;
  tableNumber: number;
  tableSection?: string;
  items: NewOrderKitchenItem[];
  totalSatang: number;
  createdAt: string;
}

export interface OrderStatusChangedPayload {
  orderId: string;
  tableId: string;
  status: string;       // OrderStatus enum value
}
