'use client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '@/api/client';
import { useAuditedMutation } from '@/hooks/use-audited-mutation';
import { emitMenuUpdated } from '@/hooks/use-admin-socket';
import type { AdminCategory, AdminMenuItem } from '@/mock/seed';
import type { MenuItemFormValues } from '@booking/shared';

const MENU_KEY  = ['admin', 'menu'] as const;
const BRANCH_ID = 'demo-branch';

// ── Fetch all categories with items ──────────────────────────────────────────
export function useAdminMenu() {
  return useQuery<AdminCategory[]>({
    queryKey: MENU_KEY,
    queryFn:  () => adminApi.menu.listCategories() as Promise<AdminCategory[]>,
    staleTime: 60_000,
  });
}

// ── Toggle 86 (out-of-stock) ──────────────────────────────────────────────────
export function useToggle86() {
  const queryClient = useQueryClient();
  return useAuditedMutation({
    mutationFn: ({ itemId, isAvailable }: { itemId: string; isAvailable: boolean }) =>
      adminApi.menu.toggle86(itemId, isAvailable),

    audit: ({ itemId, isAvailable }, _data, error) => ({
      category:   'MENU',
      action:     isAvailable ? 'ITEM_AVAILABLE' : 'ITEM_86',
      label:      isAvailable ? `Mở bán món ${itemId}` : `"86" món ${itemId} (hết hàng)`,
      targetId:   itemId,
      targetType: 'MenuItem',
      outcome:    error ? 'FAILURE' : 'SUCCESS',
      meta:       { isAvailable },
    }),

    // Optimistic update — flip availability immediately in UI
    onMutate: async ({ itemId, isAvailable }) => {
      await queryClient.cancelQueries({ queryKey: MENU_KEY });
      const prev = queryClient.getQueryData<AdminCategory[]>(MENU_KEY);
      queryClient.setQueryData<AdminCategory[]>(MENU_KEY, (old = []) =>
        old.map((cat) => ({
          ...cat,
          items: cat.items.map((item) =>
            item.id === itemId ? { ...item, isAvailable } : item,
          ),
        })),
      );
      return { prev };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prev) queryClient.setQueryData(MENU_KEY, ctx.prev);
    },
    onSuccess: (_data, { itemId }) => {
      // Broadcast to all subscribers (web menu cache will invalidate too)
      emitMenuUpdated({ branchId: BRANCH_ID, itemId, type: 'toggle86' });
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: MENU_KEY }),
  });
}

// ── Update a menu item ────────────────────────────────────────────────────────
export function useUpdateMenuItem() {
  const queryClient = useQueryClient();
  return useAuditedMutation({
    mutationFn: ({ itemId, data }: { itemId: string; data: Partial<MenuItemFormValues> }) =>
      adminApi.menu.updateItem(itemId, data),
    audit: ({ itemId, data }, _res, error) => ({
      category:   'MENU',
      action:     'ITEM_UPDATED',
      label:      `Cập nhật món "${(data as { name?: string }).name ?? itemId}"`,
      targetId:   itemId,
      targetType: 'MenuItem',
      outcome:    error ? 'FAILURE' : 'SUCCESS',
      meta:       { fields: Object.keys(data) },
    }),
    onSuccess: (_data, { itemId }) => {
      emitMenuUpdated({ branchId: BRANCH_ID, itemId, type: 'update' });
      queryClient.invalidateQueries({ queryKey: MENU_KEY });
    },
  });
}

// ── Create a new menu item ────────────────────────────────────────────────────
export function useCreateMenuItem() {
  const queryClient = useQueryClient();
  return useAuditedMutation({
    mutationFn: (data: MenuItemFormValues) => adminApi.menu.createItem(data),
    audit: (data, _res, error) => ({
      category:   'MENU',
      action:     'ITEM_CREATED',
      label:      `Thêm món mới "${data.name}"`,
      targetType: 'MenuItem',
      outcome:    error ? 'FAILURE' : 'SUCCESS',
      meta:       { name: data.name, categoryId: data.categoryId },
    }),
    onSuccess: () => {
      emitMenuUpdated({ branchId: BRANCH_ID, type: 'create' });
      queryClient.invalidateQueries({ queryKey: MENU_KEY });
    },
  });
}

// ── Create a new category ─────────────────────────────────────────────────────
export function useCreateCategory() {
  const queryClient = useQueryClient();
  return useAuditedMutation({
    mutationFn: (name: string) => adminApi.menu.createCategory(name),
    audit: (name, _res, error) => ({
      category:   'MENU',
      action:     'CATEGORY_CREATED',
      label:      `Tạo danh mục "${name}"`,
      targetType: 'Category',
      outcome:    error ? 'FAILURE' : 'SUCCESS',
      meta:       { name },
    }),
    onSuccess: () => {
      emitMenuUpdated({ branchId: BRANCH_ID, type: 'category' });
      queryClient.invalidateQueries({ queryKey: MENU_KEY });
    },
  });
}

// ── Flat list of all items for quick search ───────────────────────────────────
export function useMenuItemById(categories: AdminCategory[], itemId: string): AdminMenuItem | null {
  for (const cat of categories) {
    const found = cat.items.find((i) => i.id === itemId);
    if (found) return found;
  }
  return null;
}
