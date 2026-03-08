// Re-exports from @booking/shared — api modules import from here.
// This keeps the import path concise within the monorepo before path aliases are wired.
export {
  CreateBookingSchema,
  UpdateBookingSchema,
} from '@booking/shared';
export type { CreateBookingDto, UpdateBookingDto } from '@booking/shared';
