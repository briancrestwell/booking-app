import { z } from 'zod';

export const MenuItemSchema = z.object({
  name: z
    .string()
    .min(2, 'Tên món tối thiểu 2 ký tự')
    .max(120, 'Tên món tối đa 120 ký tự'),
  description: z
    .string()
    .max(500, 'Mô tả tối đa 500 ký tự')
    .optional()
    .or(z.literal('')),
  priceSatang: z
    .number({ invalid_type_error: 'Giá phải là số' })
    .int('Giá phải là số nguyên')
    .min(100_000, 'Giá tối thiểu 1.000đ (100 satang)'),
  imageUrl: z
    .string()
    .url('URL ảnh không hợp lệ')
    .optional()
    .or(z.literal('')),
  isAvailable: z.boolean(),
  categoryId: z
    .string()
    .min(1, 'Vui lòng chọn danh mục'),
  tags: z
    .array(z.string())
    .optional()
    .default([]),
});

export type MenuItemFormValues = z.infer<typeof MenuItemSchema>;

// Partial update schema (for PATCH requests)
export const UpdateMenuItemSchema = MenuItemSchema.partial();
export type UpdateMenuItemDto = z.infer<typeof UpdateMenuItemSchema>;

// "86" toggle — single field for fastest mutation
export const Toggle86Schema = z.object({
  isAvailable: z.boolean(),
});
export type Toggle86Dto = z.infer<typeof Toggle86Schema>;
