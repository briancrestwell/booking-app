// Re-export inferred TypeScript types.
// Schemas live in ../schemas/ — types are derived via z.infer<>.

export type { BookingStatus, CreateBookingDto, UpdateBookingDto } from '../schemas/booking.schema';
export type {
  OrderStatus,
  OrderItemInput,
  PlaceOrderDto,
  UpdateOrderStatusDto,
} from '../schemas/order.schema';
export type { TableStatus, Table } from '../schemas/table.schema';
