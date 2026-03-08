'use client';
import { useState } from 'react';
import Image from 'next/image';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { cn, formatVND } from '@/lib/utils';
import { useCartStore } from '@/store/cart.store';

type MenuItem = {
  id: string;
  name: string;
  imageUrl?: string;
  priceSatang: number;
  isAvailable: boolean;
  tags: string[];
};

const VARIANTS = [
  { id: 'traditional', label: 'Truyền thống', extraSatang: 0 },
  { id: 'cheese',      label: 'Phô mai',      extraSatang: 500 },
];

interface Props {
  item: MenuItem;
  open: boolean;
  onClose: () => void;
}

export function ItemDetailSheet({ item, open, onClose }: Props) {
  const [qty, setQty]         = useState(1);
  const [variant, setVariant] = useState(VARIANTS[0].id);
  const [notes, setNotes]     = useState('');
  const addItem = useCartStore((s) => s.addItem);

  const selectedVariant = VARIANTS.find((v) => v.id === variant) ?? VARIANTS[0];
  const unitSatang      = item.priceSatang + selectedVariant.extraSatang;
  const totalSatang     = unitSatang * qty;

  function handleAdd() {
    addItem({
      menuItemId:   item.id,
      name:         item.name,
      imageUrl:     item.imageUrl,
      priceSatang:  unitSatang,
      quantity:     qty,
      notes:        notes || undefined,
      variantLabel: selectedVariant.label,
    });
    onClose();
  }

  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
      <SheetContent side="bottom">

        {/* ── Hero image ──────────────────────────────── */}
        <div className="relative mx-5 mt-4 h-44 overflow-hidden rounded-2xl bg-muted">
          {item.imageUrl ? (
            <Image src={item.imageUrl} alt={item.name} fill className="object-cover" sizes="(max-width: 448px) 100vw, 448px" />
          ) : (
            <div className="h-full w-full bg-gradient-to-br from-orange-100 to-amber-200" />
          )}
          {!item.isAvailable && (
            <div className="absolute inset-0 flex items-center justify-center rounded-2xl bg-black/50">
              <span className="text-sm font-bold text-white">Tạm hết</span>
            </div>
          )}
        </div>

        {/* ── Item name + price ───────────────────────── */}
        <div className="px-5 pt-4 pb-3">
          <h2 className="text-[17px] font-bold leading-snug text-foreground">{item.name}</h2>
          <p className="mt-1 text-sm font-semibold text-[#1B6FEB]">{formatVND(item.priceSatang)}</p>
        </div>

        {/* ── Variant picker ──────────────────────────── */}
        <div className="border-t border-border">
          <div className="flex items-baseline gap-1.5 bg-muted/50 px-5 py-2.5">
            <span className="text-sm font-bold text-foreground">Vị</span>
            <span className="text-xs font-normal text-[#1B6FEB]">(Chọn 1)</span>
          </div>

          {VARIANTS.map((v) => (
            <button
              key={v.id}
              onClick={() => setVariant(v.id)}
              /* 48 px touch target */
              className="flex min-h-[48px] w-full items-center justify-between px-5 py-3 active:bg-muted/30 transition-colors"
            >
              <span className="text-sm text-foreground">
                {v.label}&nbsp;
                <span className="text-muted-foreground">
                  {v.extraSatang > 0 ? `+${formatVND(v.extraSatang)}` : '+0đ'}
                </span>
              </span>
              {/* Radio dot */}
              <span className={cn(
                'flex h-5 w-5 items-center justify-center rounded-full border-2 shrink-0',
                variant === v.id ? 'border-[#1B6FEB]' : 'border-muted-foreground/40',
              )}>
                {variant === v.id && (
                  <span className="h-2.5 w-2.5 rounded-full bg-[#1B6FEB]" />
                )}
              </span>
            </button>
          ))}
        </div>

        {/* ── Notes ───────────────────────────────────── */}
        <div className="border-t border-border px-5 py-4">
          <p className="mb-2 text-sm font-semibold">Ghi chú</p>
          <input
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Nhập ghi chú để nhà hàng phục vụ tốt hơn"
            inputMode="text"
            className="w-full rounded-xl border border-border bg-muted/30 px-3.5 py-3 text-base outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        {/* ── Fixed action bar ────────────────────────── */}
        <div className="border-t border-border bg-white px-5 py-4">
          <div className="flex items-center gap-3">
            {/* Qty stepper */}
            <div className="flex items-center gap-2 rounded-xl bg-muted p-1">
              <button
                onClick={() => setQty(Math.max(1, qty - 1))}
                className="flex h-9 w-9 items-center justify-center rounded-lg text-[#1B6FEB] tap-scale font-bold text-xl"
                aria-label="Bớt 1"
              >
                −
              </button>
              <span className="w-7 text-center text-sm font-bold tabular-nums">{qty}</span>
              <button
                onClick={() => setQty(qty + 1)}
                className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#1B6FEB] text-white tap-scale font-bold text-xl"
                aria-label="Thêm 1"
              >
                +
              </button>
            </div>

            {/* Add CTA */}
            <Button
              className="flex-1 h-12 bg-[#1B6FEB] text-[15px] font-bold shadow-md shadow-blue-300/30 tap-scale"
              onClick={handleAdd}
              disabled={!item.isAvailable}
            >
              {formatVND(totalSatang)} — Thêm vào giỏ
            </Button>
          </div>
        </div>

      </SheetContent>
    </Sheet>
  );
}
