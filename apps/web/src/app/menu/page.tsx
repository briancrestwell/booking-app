'use client';
import { useState, useRef, useEffect } from 'react';
import { ArrowLeft, Menu, Search, X } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { useMenu, useMenuSearch } from '@/hooks/use-queries';
import { useCartStore } from '@/store/cart.store';
import { useSocket } from '@/hooks/use-socket';
import { Skeleton } from '@/components/ui/skeleton';
import { formatVND } from '@/lib/utils';
import { cn } from '@/lib/utils';
import { ItemDetailSheet } from '@/components/menu/item-detail-sheet';
import { CartBar } from '@/components/cart/cart-bar';

import { MOCK_BRANCH_ID } from '@/mock/seed';
import { IS_MOCK } from '@/api/client';

const BRANCH_ID = IS_MOCK ? MOCK_BRANCH_ID : (process.env.NEXT_PUBLIC_DEMO_BRANCH_ID ?? 'demo-branch');

type MenuItem = {
  id: string;
  name: string;
  description?: string;
  imageUrl?: string;
  priceSatang: number;
  isAvailable: boolean;
  tags: string[];
};

type Category = {
  id: string;
  name: string;
  menuItems: MenuItem[];
};

export default function MenuPage() {
  const [query, setQuery]             = useState('');
  const [catMenuOpen, setCatMenuOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
  const [activeCat, setActiveCat]     = useState<string>('');
  const categoryRefs = useRef<Record<string, HTMLElement | null>>({});
  const observerRef  = useRef<IntersectionObserver | null>(null);

  // Subscribe to menu:updated socket event so availability changes propagate instantly
  useSocket(BRANCH_ID, 'customer');

  const { data: catalog, isLoading } = useMenu(BRANCH_ID);
  const { data: searchResults }      = useMenuSearch(BRANCH_ID, query);
  const totalItems   = useCartStore((s) => s.totalItems());
  const totalSatang  = useCartStore((s) => s.totalSatang());

  const categories: Category[] = (catalog as Category[]) ?? [];
  const displayList: Category[] = query.length >= 2 && searchResults
    ? [{ id: '_search', name: 'Kết quả tìm kiếm', menuItems: searchResults as MenuItem[] }]
    : categories;

  /* Scrollspy — update active category pill as user scrolls */
  useEffect(() => {
    if (categories.length === 0) return;
    observerRef.current?.disconnect();

    const obs = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting);
        if (visible.length > 0) {
          const topmost = visible.reduce((a, b) =>
            a.boundingClientRect.top < b.boundingClientRect.top ? a : b,
          );
          setActiveCat((topmost.target as HTMLElement).dataset.catId ?? '');
        }
      },
      { rootMargin: '-100px 0px -60% 0px', threshold: 0 },
    );

    Object.values(categoryRefs.current).forEach((el) => el && obs.observe(el));
    observerRef.current = obs;
    return () => obs.disconnect();
  }, [categories]);

  function scrollToCategory(catId: string) {
    categoryRefs.current[catId]?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    setCatMenuOpen(false);
  }

  return (
    <div className="flex h-screen-safe flex-col bg-[#f2f3f7] select-none">

      {/* ── Sticky header ─────────────────────────────── */}
      <header className="sticky top-0 z-30 bg-white shadow-sm">
        {/* Title row */}
        <div className="flex h-14 items-center gap-2 px-4">
          <Link
            href="/"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full active:bg-muted tap-scale"
            aria-label="Quay lại"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <h1 className="flex-1 text-center text-[17px] font-semibold">Thực đơn</h1>
          <div className="h-11 w-11 shrink-0" />
        </div>

        {/* Search row */}
        <div className="flex items-center gap-2 px-4 pb-3">
          <button
            onClick={() => setCatMenuOpen(true)}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-border bg-white tap-scale"
            aria-label="Danh mục"
          >
            <Menu className="h-[18px] w-[18px]" />
          </button>
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Tìm tên món"
              inputMode="search"
              className="h-10 w-full rounded-xl border border-border bg-muted/40 pl-9 pr-9 text-sm outline-none focus:ring-2 focus:ring-primary"
            />
            {query && (
              <button
                onClick={() => setQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        {/* Category scrollspy pill tabs */}
        {!query && categories.length > 0 && (
          <div className="scroll-x-snap px-4 pb-3 pt-0 gap-2">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => scrollToCategory(cat.id)}
                className={cn(
                  'rounded-full px-3.5 py-1.5 text-xs font-semibold whitespace-nowrap tap-scale transition-colors',
                  activeCat === cat.id
                    ? 'bg-[#1B6FEB] text-white'
                    : 'bg-muted text-muted-foreground',
                )}
              >
                {cat.name}
              </button>
            ))}
          </div>
        )}
      </header>

      {/* ── Category drawer ───────────────────────────── */}
      {catMenuOpen && (
        <div className="fixed inset-0 z-50 flex" onClick={() => setCatMenuOpen(false)}>
          <div
            className="w-56 bg-white shadow-2xl overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex h-14 items-center justify-between border-b border-border px-4">
              <span className="text-[15px] font-bold">Thực đơn</span>
              <button onClick={() => setCatMenuOpen(false)} className="flex h-8 w-8 items-center justify-center rounded-full bg-muted tap-scale">
                <X className="h-4 w-4" />
              </button>
            </div>
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => scrollToCategory(cat.id)}
                className={cn(
                  'flex w-full items-center justify-between px-4 py-4 text-sm font-medium tap-opacity',
                  activeCat === cat.id ? 'text-[#1B6FEB] bg-blue-50' : 'text-foreground',
                )}
              >
                <span>{cat.name}</span>
                <span className="text-xs text-muted-foreground">{cat.menuItems.length}</span>
              </button>
            ))}
          </div>
          <div className="flex-1 bg-black/40" />
        </div>
      )}

      {/* ── Menu list ─────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto pb-32 no-scrollbar">
        {isLoading
          ? Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="mx-4 my-3 flex gap-3">
                <Skeleton className="h-[72px] w-[72px] rounded-2xl shrink-0" />
                <div className="flex-1 space-y-2 py-1">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                  <Skeleton className="h-4 w-1/4" />
                </div>
              </div>
            ))
          : displayList.map((cat) => (
              <section
                key={cat.id}
                ref={(el) => { categoryRefs.current[cat.id] = el; }}
                data-cat-id={cat.id}
              >
                {/* Category header */}
                <div className="bg-[#f2f3f7] px-4 py-2.5">
                  <h2 className="text-[11px] font-extrabold uppercase tracking-[0.12em] text-muted-foreground">
                    {cat.name} ({cat.menuItems.length})
                  </h2>
                </div>
                {/* Items */}
                <div className="bg-white">
                  {cat.menuItems.map((item, idx) => (
                    <MenuItemRow
                      key={item.id}
                      item={item}
                      isLast={idx === cat.menuItems.length - 1}
                      onSelect={() => setSelectedItem(item)}
                    />
                  ))}
                </div>
              </section>
            ))}
      </div>

      {/* ── Bottom cart bar ─────────────────────────────── */}
      {totalItems > 0 && <CartBar totalItems={totalItems} totalSatang={totalSatang} />}

      {/* ── Item detail sheet ───────────────────────────── */}
      {selectedItem && (
        <ItemDetailSheet
          item={selectedItem}
          open={!!selectedItem}
          onClose={() => setSelectedItem(null)}
        />
      )}
    </div>
  );
}

/* ── Menu item row ───────────────────────────────────── */
function MenuItemRow({
  item, isLast, onSelect,
}: { item: MenuItem; isLast: boolean; onSelect: () => void }) {
  const cartItems    = useCartStore((s) => s.items);
  const updateQty    = useCartStore((s) => s.updateQuantity);
  const cartItem     = cartItems.find((c) => c.menuItemId === item.id);
  const qty          = cartItem?.quantity ?? 0;

  return (
    <div className={cn(
      'flex items-center gap-3 px-4 py-3.5',
      !isLast && 'border-b border-border/50',
    )}>
      {/* Thumbnail */}
      <div className="relative h-[72px] w-[72px] shrink-0 overflow-hidden rounded-2xl bg-muted">
        {item.imageUrl ? (
          <Image src={item.imageUrl} alt={item.name} fill className="object-cover" sizes="72px" />
        ) : (
          <div className="h-full w-full bg-gradient-to-br from-orange-100 to-amber-200" />
        )}
        {qty > 0 && (
          <span className="absolute -bottom-0.5 -right-0.5 flex h-[22px] w-[22px] items-center justify-center rounded-full bg-emerald-500 text-[11px] font-bold text-white shadow-sm">
            ✓
          </span>
        )}
        {!item.isAvailable && (
          <div className="absolute inset-0 flex items-center justify-center rounded-2xl bg-black/40">
            <span className="text-[10px] font-bold text-white">Hết</span>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold leading-snug line-clamp-2 text-foreground">{item.name}</p>
        {item.description && (
          <p className="mt-0.5 text-xs text-muted-foreground line-clamp-1">{item.description}</p>
        )}
        <p className="mt-1.5 text-sm font-bold text-foreground">{formatVND(item.priceSatang)}</p>
      </div>

      {/* Controls */}
      {qty === 0 ? (
        <button
          onClick={onSelect}
          disabled={!item.isAvailable}
          aria-label={`Thêm ${item.name}`}
          className="flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-full bg-[#1B6FEB] text-white shadow-sm tap-scale disabled:opacity-30"
        >
          <span className="text-[22px] leading-none font-light">+</span>
        </button>
      ) : (
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={() => updateQty(item.id, qty - 1)}
            className="flex h-[34px] w-[34px] items-center justify-center rounded-full border-2 border-[#1B6FEB] text-[#1B6FEB] tap-scale"
            aria-label="Bớt 1"
          >
            <span className="text-xl leading-none">−</span>
          </button>
          <span className="w-5 text-center text-sm font-bold">{qty}</span>
          <button
            onClick={onSelect}
            className="flex h-[34px] w-[34px] items-center justify-center rounded-full bg-[#1B6FEB] text-white tap-scale"
            aria-label="Thêm 1"
          >
            <span className="text-xl leading-none">+</span>
          </button>
        </div>
      )}
    </div>
  );
}
