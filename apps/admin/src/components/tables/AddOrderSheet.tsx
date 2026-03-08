'use client';
import { useState, useMemo } from 'react';
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useAdminMenu } from '@/hooks/use-menu';
import { useAddOrder } from '@/hooks/use-tables';
import { useToast } from '@/components/shared/Toast';
import { formatVND, cn } from '@/lib/utils';
import { Plus, Minus, ShoppingCart, Search, UtensilsCrossed } from 'lucide-react';
import type { AdminMenuItem, AdminCategory } from '@/mock/seed';
import { memo, useCallback } from 'react';

// ── Cart item shape ───────────────────────────────────────────────────────────
interface CartItem {
  menuItemId:  string;
  name:        string;
  unitSatang:  number;
  quantity:    number;
}

interface Props {
  tableId:     string;
  tableNumber: number;
  open:        boolean;
  onClose:     () => void;
}

export function AddOrderSheet({ tableId, tableNumber, open, onClose }: Props) {
  const { data: categories = [], isLoading } = useAdminMenu();
  const addOrder  = useAddOrder();
  const { toast } = useToast();

  const [cart,   setCart]   = useState<Record<string, CartItem>>({});
  const [search, setSearch] = useState('');

  // ── Cart helpers ────────────────────────────────────────────────────────────
  const addItem = useCallback((item: AdminMenuItem) => {
    setCart((prev) => {
      const existing = prev[item.id];
      return {
        ...prev,
        [item.id]: {
          menuItemId:  item.id,
          name:        item.name,
          unitSatang:  item.priceSatang,
          quantity:    (existing?.quantity ?? 0) + 1,
        },
      };
    });
  }, []);

  const removeItem = useCallback((itemId: string) => {
    setCart((prev) => {
      const existing = prev[itemId];
      if (!existing || existing.quantity <= 1) {
        const next = { ...prev };
        delete next[itemId];
        return next;
      }
      return { ...prev, [itemId]: { ...existing, quantity: existing.quantity - 1 } };
    });
  }, []);

  const cartItems  = Object.values(cart);
  const cartCount  = cartItems.reduce((s, i) => s + i.quantity, 0);
  const cartTotal  = cartItems.reduce((s, i) => s + i.quantity * i.unitSatang, 0);
  const hasItems   = cartCount > 0;

  // ── Filtered menu ────────────────────────────────────────────────────────────
  const filtered: AdminCategory[] = useMemo(() => {
    const available = categories.map((cat) => ({
      ...cat,
      items: cat.items.filter((i) => i.isAvailable),
    })).filter((cat) => cat.items.length > 0);

    if (!search.trim()) return available;
    const q = search.toLowerCase();
    return available.map((cat) => ({
      ...cat,
      items: cat.items.filter((i) => i.name.toLowerCase().includes(q)),
    })).filter((cat) => cat.items.length > 0);
  }, [categories, search]);

  // ── Confirm order ─────────────────────────────────────────────────────────
  async function handleConfirm() {
    if (!hasItems) return;
    try {
      await addOrder.mutateAsync({ tableId, items: cartItems });
      toast(`Đã gọi ${cartCount} món cho Bàn ${tableNumber}`, 'success');
      setCart({});
      setSearch('');
      onClose();
    } catch {
      toast('Gọi món thất bại, thử lại.', 'error');
    }
  }

  function handleClose() {
    setCart({});
    setSearch('');
    onClose();
  }

  return (
    <Sheet open={open} onOpenChange={(v) => !v && handleClose()}>
      <SheetContent className="flex flex-col">

        <SheetHeader className="px-5 pb-2 shrink-0">
          <SheetTitle className="text-white text-lg font-semibold">
            Gọi thêm món — Bàn {tableNumber}
          </SheetTitle>
          <SheetDescription className="sr-only">Chọn món từ thực đơn</SheetDescription>
        </SheetHeader>

        {/* Search */}
        <div className="px-5 pb-3 shrink-0">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40 pointer-events-none" />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm món…"
              className={cn(
                'w-full h-10 pl-9 pr-4 rounded-xl text-sm',
                'bg-white/10 border border-white/10 text-white placeholder:text-white/30',
                'focus:outline-none focus:ring-2 focus:ring-pos-brand',
              )}
            />
          </div>
        </div>

        {/* Cart summary bar — visible when items selected */}
        {hasItems && (
          <div className="mx-5 mb-2 shrink-0 flex items-center justify-between rounded-xl bg-pos-brand/15 border border-pos-brand/30 px-4 py-2.5">
            <span className="flex items-center gap-2 text-sm text-pos-brand font-medium">
              <ShoppingCart className="h-4 w-4" />
              {cartCount} món
            </span>
            <span className="text-sm font-bold text-white">{formatVND(cartTotal)}</span>
          </div>
        )}

        {/* Menu list — scrollable */}
        <div className="flex-1 overflow-y-auto px-5 pb-4 space-y-5">
          {isLoading && <MenuSkeleton />}

          {!isLoading && filtered.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 gap-2 text-white/40">
              <UtensilsCrossed className="h-8 w-8 opacity-30" />
              <p className="text-sm">{search ? `Không tìm thấy "${search}"` : 'Không có món nào'}</p>
            </div>
          )}

          {filtered.map((cat) => (
            <section key={cat.id}>
              <p className="text-[10px] font-bold uppercase tracking-wider text-pos-brand mb-2">
                {cat.name}
              </p>
              <div className="rounded-2xl bg-pos-surface overflow-hidden divide-y divide-white/5">
                {cat.items.map((item) => (
                  <MenuItemPickerRow
                    key={item.id}
                    item={item}
                    quantity={cart[item.id]?.quantity ?? 0}
                    onAdd={() => addItem(item)}
                    onRemove={() => removeItem(item.id)}
                  />
                ))}
              </div>
            </section>
          ))}
        </div>

        {/* Fixed CTA */}
        <div className="shrink-0 border-t border-white/10 px-5 pt-3 pb-safe space-y-2.5">
          <Button
            size="lg"
            disabled={!hasItems || addOrder.isPending}
            onClick={handleConfirm}
            className="w-full h-14 text-base font-semibold bg-pos-brand hover:bg-pos-brand/90 disabled:opacity-40"
          >
            {addOrder.isPending ? (
              <span className="flex items-center gap-2">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                Đang gọi món…
              </span>
            ) : hasItems ? (
              <span className="flex items-center gap-2">
                <ShoppingCart className="h-4 w-4" />
                Xác nhận gọi {cartCount} món · {formatVND(cartTotal)}
              </span>
            ) : 'Chọn món để gọi'}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}

// ── Item row with +/- controls ────────────────────────────────────────────────
const MenuItemPickerRow = memo(function MenuItemPickerRow({
  item,
  quantity,
  onAdd,
  onRemove,
}: {
  item:     AdminMenuItem;
  quantity: number;
  onAdd:    () => void;
  onRemove: () => void;
}) {
  return (
    <div className="flex items-center gap-3 px-4 py-3">
      {/* Thumbnail */}
      {item.imageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={item.imageUrl}
          alt={item.name}
          className="h-11 w-11 rounded-xl object-cover object-center flex-shrink-0"
        />
      ) : (
        <div className="h-11 w-11 rounded-xl bg-white/10 flex-shrink-0 flex items-center justify-center text-base">
          🍽
        </div>
      )}

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-white truncate">{item.name}</p>
        <p className="text-xs font-medium text-pos-brand mt-0.5">{formatVND(item.priceSatang)}</p>
      </div>

      {/* Quantity controls */}
      <div className="flex items-center gap-2 shrink-0">
        {quantity > 0 ? (
          <>
            <button
              type="button"
              onClick={onRemove}
              aria-label="Giảm"
              className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-white tap-scale active:bg-white/20"
            >
              <Minus className="h-3.5 w-3.5" />
            </button>
            <span className="w-6 text-center text-sm font-bold text-white tabular-nums">
              {quantity}
            </span>
          </>
        ) : (
          <span className="w-[4.5rem]" /> /* spacer to keep layout stable */
        )}
        <button
          type="button"
          onClick={onAdd}
          aria-label="Thêm"
          className={cn(
            'flex h-8 w-8 items-center justify-center rounded-full tap-scale',
            quantity > 0
              ? 'bg-pos-brand text-white'
              : 'bg-white/10 text-white active:bg-pos-brand/50',
          )}
        >
          <Plus className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
});

// ── Skeleton ──────────────────────────────────────────────────────────────────
function MenuSkeleton() {
  return (
    <div className="space-y-5">
      {[1, 2].map((s) => (
        <div key={s}>
          <Skeleton className="h-3 w-20 mb-2 rounded" />
          <div className="rounded-2xl bg-pos-surface overflow-hidden divide-y divide-white/5">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-3 px-4 py-3">
                <Skeleton className="h-11 w-11 rounded-xl shrink-0" />
                <div className="flex-1 space-y-1.5">
                  <Skeleton className="h-4 w-3/4 rounded" />
                  <Skeleton className="h-3 w-1/3 rounded" />
                </div>
                <Skeleton className="h-8 w-8 rounded-full" />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
