import { z } from 'zod';

export const OrderStatusEnum = z.enum([
  'PENDING',
  'CONFIRMED',
  'PREPARING',
  'READY',
  'SERVED',
  'CANCELLED',
]);
export type OrderStatus = z.infer<typeof OrderStatusEnum>;

export const OrderItemInputSchema = z.object({
  menuItemId: z.string().uuid(),
  quantity: z.number().int().min(1).max(50),
  notes: z.string().max(200).optional(),
});
export type OrderItemInput = z.infer<typeof OrderItemInputSchema>;

export const PlaceOrderSchema = z.object({
  tableId: z.string().uuid(),
  bookingId: z.string().uuid().optional(),
  items: z.array(OrderItemInputSchema).min(1, 'Order must contain at least one item'),
  notes: z.string().max(500).optional(),
});
export type PlaceOrderDto = z.infer<typeof PlaceOrderSchema>;

export const UpdateOrderStatusSchema = z.object({
  status: OrderStatusEnum.exclude(['PENDING']),
});
export type UpdateOrderStatusDto = z.infer<typeof UpdateOrderStatusSchema>;
