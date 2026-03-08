import { z } from 'zod';

export const BookingStatusEnum = z.enum([
  'PENDING',
  'CONFIRMED',
  'SEATED',
  'COMPLETED',
  'CANCELLED',
  'NO_SHOW',
]);
export type BookingStatus = z.infer<typeof BookingStatusEnum>;

export const CreateBookingSchema = z.object({
  tableId: z.string().uuid(),
  slotId: z.string().uuid(),
  guestCount: z.number().int().min(1).max(20),
  specialRequests: z.string().max(500).optional(),
});
export type CreateBookingDto = z.infer<typeof CreateBookingSchema>;

export const UpdateBookingSchema = z.object({
  status: BookingStatusEnum
    .refine((s) => s !== 'PENDING', { message: 'Cannot set status back to PENDING' })
    .optional(),
  internalNotes: z.string().max(1000).optional(),
});
export type UpdateBookingDto = z.infer<typeof UpdateBookingSchema>;
