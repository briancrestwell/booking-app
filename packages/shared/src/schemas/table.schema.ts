import { z } from 'zod';

export const TableStatusSchema = z.enum([
  'AVAILABLE',
  'RESERVED',
  'OCCUPIED',
  'MAINTENANCE',
]);
export type TableStatus = z.infer<typeof TableStatusSchema>;

export const TableSchema = z.object({
  id: z.string().uuid(),
  number: z.number().int().positive(),
  capacity: z.number().int().min(1).max(30),
  status: TableStatusSchema,
  section: z.string().optional(),
});
export type Table = z.infer<typeof TableSchema>;
