'use client';
import { useState, useMemo } from 'react';
import { MobileAppLayout } from '@/components/layout/MobileAppLayout';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { EditMenuItemSheet } from '@/components/menu/EditMenuItemSheet';
import { useAdminMenu, useToggle86 } from '@/hooks/use-menu';
import { useToast } from '@/components/shared/Toast';
import { formatVND, cn } from '@/lib/utils';
import { Plus, Pencil, Search } from 'lucide-react';
import type { AdminMenuItem, AdminCategory } from '@/mock/seed';
import { memo, useCallback } from 'react';

export default function MenuPage() {
  const { data: categories = [], isLoading, isError } = useAdminMenu();
  const [search, setSearch]       = useState('');
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editing, setEditing]     = useState<AdminMenuItem | null>(null);

  const filtered: AdminCategory[] = useMemo(() => {
    if (!search.trim()) return categories;
    const q = search.toLowerCase();
    return categories
      .map((cat) => ({
        ...cat,
        items: cat.items.filter(
          (i) =>
            i.name.toLowerCase().includes(q) ||
            i.description.toLowerCase().includes(q),
        ),
      }))
      .filter((cat) => cat.items.length > 0);
  }, [categories, search]);

  function openCreate() {
    setEditing(null);
    setSheetOpen(true);
  }
  function openEdit(item: AdminMenuItem) {
    setEditing(item);
    setSheetOpen(true);
  }

  return (
    <MobileAppLayout
      title="Thực đơn"
      headerRight={
        <Button
          size="icon"
          variant="ghost"
          className="text-white"
          aria-label="Thêm món mới"
          onClick={openCreate}
        >
          <Plus className="h-5 w-5" />
        </Button>
      }
    >
      {/* Search bar */}
      <div className="sticky top-0 z-10 bg-pos-bg px-4 pt-4 pb-3 border-b border-white/10">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40 pointer-events-none" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm món…"
            className={cn(
              'w-full h-11 pl-9 pr-4 rounded-xl text-sm',
              'bg-white/10 border border-white/10 text-white placeholder:text-white/30',
              'focus:outline-none focus:ring-2 focus:ring-pos-brand',
            )}
          />
        </div>
      </div>

      <div className="px-4 pt-3 pb-32 space-y-6">
        {isError && (
          <div className="flex flex-col items-center justify-center py-16 gap-4 text-white/50 text-center px-4">
            <div className="h-16 w-16 rounded-2xl bg-white/10 flex items-center justify-center text-3xl">
              🍽️
            </div>
            <div>
              <p className="text-sm font-semibold text-white/70">Chưa có thực đơn</p>
              <p className="text-xs mt-1 leading-relaxed">
                Nhấn <span className="text-pos-brand font-medium">+</span> để thêm món đầu tiên,
                hoặc bật Demo để xem mẫu.
              </p>
            </div>
          </div>
        )}

        {isLoading && <MenuSkeleton />}

        {!isLoading &&
          filtered.map((cat) => (
            <CategorySection
              key={cat.id}
              category={cat}
              allCategories={categories}
              onEdit={openEdit}
            />
          ))}

        {!isLoading && filtered.length === 0 && search && (
          <p className="text-center text-white/40 text-sm py-10">
            Không tìm thấy món "{search}"
          </p>
        )}
      </div>

      <EditMenuItemSheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        categories={categories}
        item={editing}
      />
    </MobileAppLayout>
  );
}

// ── Category section ──────────────────────────────────────────────────────────
function CategorySection({
  category,
  allCategories,
  onEdit,
}: {
  category:      AdminCategory;
  allCategories: AdminCategory[];
  onEdit:        (item: AdminMenuItem) => void;
}) {
  const soldOutCount = category.items.filter((i) => !i.isAvailable).length;

  return (
    <section>
      {/* Section header — "X hết hàng" is category-level count, not per row */}
      <div className="flex items-center justify-between gap-2 mb-2">
        <h2 className="text-pos-brand text-xs font-bold tracking-wider uppercase">
          {category.name}
        </h2>
        {soldOutCount > 0 && (
          <span className="text-xs text-pos-red/80 font-medium shrink-0">
            {soldOutCount} hết hàng
          </span>
        )}
      </div>
      <p className="sr-only">
        {soldOutCount > 0
          ? `Trong mục ${category.name} có ${soldOutCount} món đang hết hàng.`
          : `Mục ${category.name}: tất cả món đang bán.`}
      </p>

      {/* Items */}
      <div className="rounded-2xl bg-pos-surface overflow-hidden divide-y divide-white/5">
        {category.items.map((item) => (
          <MenuItemRow
            key={item.id}
            item={item}
            allCategories={allCategories}
            onEdit={onEdit}
          />
        ))}
      </div>
    </section>
  );
}

// ── Individual item row with 86 toggle ────────────────────────────────────────
const MenuItemRow = memo(function MenuItemRow({
  item,
  allCategories,
  onEdit,
}: {
  item:          AdminMenuItem;
  allCategories: AdminCategory[];
  onEdit:        (item: AdminMenuItem) => void;
}) {
  const { toast }  = useToast();
  const toggle86   = useToggle86();

  const handleToggle = useCallback(async () => {
    const next = !item.isAvailable;
    try {
      await toggle86.mutateAsync({ itemId: item.id, isAvailable: next });
      toast(
        next ? `"${item.name}" đang bán trở lại` : `"${item.name}" đã 86 (hết hàng)`,
        next ? 'success' : 'info',
      );
    } catch {
      toast('Cập nhật thất bại', 'error');
    }
  }, [item, toggle86, toast]);

  return (
    <div
      className={cn(
        'flex items-center gap-3 px-4 py-3',
        !item.isAvailable && 'opacity-50',
      )}
    >
      {/* Thumbnail */}
      {item.imageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={item.imageUrl}
          alt={item.name}
          className="h-12 w-12 rounded-xl object-cover object-center flex-shrink-0"
        />
      ) : (
        <div className="h-12 w-12 rounded-xl bg-white/10 flex-shrink-0 flex items-center justify-center">
          <span className="text-lg">🍽</span>
        </div>
      )}

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p
          className={cn(
            'text-sm font-semibold truncate',
            item.isAvailable ? 'text-white' : 'line-through text-white/40',
          )}
        >
          {item.name}
        </p>
        <p className="text-xs text-white/40 truncate mt-0.5">{item.description}</p>
        <p className="text-xs font-medium text-pos-brand mt-1">
          {formatVND(item.priceSatang)}
        </p>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 flex-shrink-0">
        {/* 86 Toggle
            Track: w-11 (44px) × h-6 (24px), padding: 2px each side
            Thumb: w-5 (20px) × h-5 (20px)
            OFF translate = 2px (left edge + padding)
            ON  translate = 44 - 20 - 2×2 = 20px = translate-x-5
        */}
        <button
          type="button"
          role="switch"
          onClick={handleToggle}
          aria-checked={item.isAvailable}
          aria-label={item.isAvailable ? 'Đánh dấu hết hàng (86)' : 'Mở bán lại'}
          className={[
            'relative inline-flex h-6 w-11 flex-shrink-0 rounded-full p-[2px]',
            'transition-colors duration-200 focus-visible:outline-none',
            item.isAvailable ? 'bg-[#22C55E]' : 'bg-red-500/70',
          ].join(' ')}
        >
          <span
            className={[
              'inline-block h-5 w-5 rounded-full bg-white shadow',
              'transition-transform duration-200',
              item.isAvailable ? 'translate-x-5' : 'translate-x-0',
            ].join(' ')}
          />
        </button>

        {/* Edit button */}
        <Button
          size="icon"
          variant="ghost"
          className="h-9 w-9 text-white/50 hover:text-white"
          aria-label="Sửa món"
          onClick={() => onEdit(item)}
        >
          <Pencil className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
});

// ── Skeleton ──────────────────────────────────────────────────────────────────
function MenuSkeleton() {
  return (
    <div className="space-y-6 pt-2">
      {[1, 2].map((s) => (
        <div key={s}>
          <Skeleton className="h-4 w-24 mb-3 rounded-md" />
          <div className="rounded-2xl bg-pos-surface overflow-hidden divide-y divide-white/5">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-3 px-4 py-3">
                <Skeleton className="h-12 w-12 rounded-xl" />
                <div className="flex-1 space-y-1.5">
                  <Skeleton className="h-4 w-3/4 rounded" />
                  <Skeleton className="h-3 w-1/2 rounded" />
                </div>
                <Skeleton className="h-7 w-12 rounded-full" />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
