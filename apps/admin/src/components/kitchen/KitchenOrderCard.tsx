'use client';
import { memo, useRef, useState, useCallback } from 'react';
import { ChefHat, Bell, CheckCheck, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ElapsedTimer } from './ElapsedTimer';
import { useKdsStore } from '@/store/kds.store';
import type { KitchenOrder } from '@/mock/seed';

// ── Status config ─────────────────────────────────────────────────────────────
const STATUS_CONFIG = {
  PENDING:   { label: 'Chờ xác nhận', borderColor: 'border-pos-amber',  bg: 'bg-pos-amber/5'  },
  CONFIRMED: { label: 'Đã xác nhận',  borderColor: 'border-primary/40', bg: 'bg-primary/5'    },
  PREPARING: { label: 'Đang nấu',     borderColor: 'border-pos-amber',  bg: 'bg-pos-amber/8'  },
  READY:     { label: 'Sẵn sàng',     borderColor: 'border-pos-green',  bg: 'bg-pos-green/8'  },
} as const;

const STATION_COLORS: Record<string, string> = {
  GRILL:  'text-pos-red',
  COLD:   'text-primary',
  DRINKS: 'text-pos-amber',
  ALL:    'text-muted-foreground',
};

// ── Swipe constants ───────────────────────────────────────────────────────────
const SWIPE_THRESHOLD  = 80;   // px before action fires
const SWIPE_MAX        = 130;  // px max drag

interface Props {
  order:           KitchenOrder;
  onStartCooking:  (id: string) => void;
  onReady:         (id: string) => void;
  isPending:       boolean;
}

export const KitchenOrderCard = memo(function KitchenOrderCard({
  order, onStartCooking, onReady, isPending,
}: Props) {
  const flashingIds = useKdsStore((s) => s.flashingIds);
  const isFlashing  = flashingIds.has(order.id);

  // ── Swipe state ──────────────────────────────────────────────────────────
  const [offsetX, setOffsetX] = useState(0);
  const [swiping, setSwiping] = useState(false);
  const startX = useRef(0);
  const cfg    = STATUS_CONFIG[order.status] ?? STATUS_CONFIG.PENDING;

  // Left swipe  → "Start Cooking" (PREPARING)
  // Right swipe → "Ready"

  const onPointerDown = useCallback((e: React.PointerEvent) => {
    if (isPending) return;
    setSwiping(true);
    startX.current = e.clientX;
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  }, [isPending]);

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    if (!swiping) return;
    const dx = Math.max(-SWIPE_MAX, Math.min(SWIPE_MAX, e.clientX - startX.current));
    setOffsetX(dx);
  }, [swiping]);

  const onPointerUp = useCallback(() => {
    if (!swiping) return;
    setSwiping(false);
    if (offsetX < -SWIPE_THRESHOLD && order.status === 'CONFIRMED') {
      onStartCooking(order.id);
    } else if (offsetX > SWIPE_THRESHOLD && (order.status === 'PREPARING' || order.status === 'CONFIRMED')) {
      onReady(order.id);
    }
    setOffsetX(0);
  }, [swiping, offsetX, order.id, order.status, onStartCooking, onReady]);

  const dragProgress = Math.abs(offsetX) / SWIPE_THRESHOLD;

  return (
    <div
      className={cn(
        'relative rounded-2xl border overflow-hidden',
        cfg.borderColor, cfg.bg,
        // Flash animation for new orders arriving via socket
        isFlashing && 'animate-[flash_0.6s_ease-in-out_6]',
        isPending && 'opacity-70',
        'transition-shadow',
      )}
    >
      {/* Swipe hint overlays */}
      {offsetX < -10 && order.status === 'CONFIRMED' && (
        <div
          className="absolute inset-y-0 right-0 flex items-center justify-end pr-4 bg-pos-amber/20 rounded-r-2xl"
          style={{ width: `${Math.abs(offsetX)}px` }}
        >
          <span className={cn('text-xs font-bold text-pos-amber opacity-0 transition-opacity', dragProgress >= 1 && 'opacity-100')}>
            Bắt đầu nấu
          </span>
        </div>
      )}
      {offsetX > 10 && ['PREPARING', 'CONFIRMED'].includes(order.status) && (
        <div
          className="absolute inset-y-0 left-0 flex items-center pl-4 bg-pos-green/20 rounded-l-2xl"
          style={{ width: `${offsetX}px` }}
        >
          <span className={cn('text-xs font-bold text-pos-green opacity-0 transition-opacity', dragProgress >= 1 && 'opacity-100')}>
            Sẵn sàng
          </span>
        </div>
      )}

      {/* ── Card body ──────────────────────────────────────────────────────── */}
      <div
        className="px-4 py-3.5 touch-pan-y"
        style={{
          transform: `translateX(${offsetX}px)`,
          transition: swiping ? 'none' : 'transform 0.25s ease',
          cursor:     swiping ? 'grabbing' : 'grab',
        }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={() => { setSwiping(false); setOffsetX(0); }}
      >
        {/* Header row */}
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              {isFlashing && (
                <span className="flex h-2 w-2 rounded-full bg-pos-amber animate-pulse-dot" />
              )}
              <span className="text-lg font-extrabold text-foreground">
                Bàn {order.tableNumber}
              </span>
              <span className="text-xs text-muted-foreground">{order.section}</span>
            </div>
            <span className="text-xs text-muted-foreground font-mono">
              #{order.id.slice(-6).toUpperCase()}
            </span>
          </div>
          <div className="flex flex-col items-end gap-1 shrink-0">
            <ElapsedTimer placedAt={order.placedAt} status={order.status} />
            <span className={cn(
              'rounded-full px-2 py-0.5 text-[10px] font-semibold',
              order.status === 'READY'     ? 'bg-pos-green/20 text-pos-green' :
              order.status === 'PREPARING' ? 'bg-pos-amber/20 text-pos-amber' :
              order.status === 'CONFIRMED' ? 'bg-primary/20 text-primary' :
                                             'bg-muted text-muted-foreground',
            )}>
              {cfg.label}
            </span>
          </div>
        </div>

        {/* Items list */}
        <ul className="space-y-1.5 mb-4">
          {order.items.map((item) => (
            <li
              key={item.id}
              className="flex items-start gap-2.5"
            >
              <span className="mt-0.5 text-base font-bold text-foreground w-5 text-right shrink-0">
                {item.quantity}×
              </span>
              <div className="flex-1 min-w-0">
                <span className="text-sm text-foreground leading-tight">{item.name}</span>
                {item.notes && (
                  <span className="flex items-center gap-1 text-xs text-pos-red mt-0.5">
                    <AlertCircle className="h-3 w-3 shrink-0" />
                    {item.notes}
                  </span>
                )}
              </div>
              {item.station && item.station !== 'ALL' && (
                <span className={cn('text-[10px] font-bold shrink-0 mt-0.5', STATION_COLORS[item.station])}>
                  {item.station}
                </span>
              )}
            </li>
          ))}
        </ul>

        {/* ── Action buttons ─────────────────────────────────────────────── */}
        <div className="flex gap-2">
          {/* Start Cooking — only when PENDING or CONFIRMED */}
          {(order.status === 'PENDING' || order.status === 'CONFIRMED') && (
            <button
              onClick={(e) => { e.stopPropagation(); onStartCooking(order.id); }}
              disabled={isPending}
              className={cn(
                'flex-1 flex items-center justify-center gap-2',
                'h-11 rounded-xl text-sm font-semibold tap-scale',
                'bg-pos-amber/15 text-pos-amber border border-pos-amber/30',
                'hover:bg-pos-amber/25 active:bg-pos-amber/30',
                'disabled:opacity-50',
              )}
            >
              {isPending
                ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                : <ChefHat className="h-4 w-4" />
              }
              Bắt đầu nấu
            </button>
          )}

          {/* Ready to Serve — only when PREPARING */}
          {order.status === 'PREPARING' && (
            <button
              onClick={(e) => { e.stopPropagation(); onReady(order.id); }}
              disabled={isPending}
              className={cn(
                'flex-1 flex items-center justify-center gap-2',
                'h-11 rounded-xl text-sm font-semibold tap-scale',
                'bg-pos-green/15 text-pos-green border border-pos-green/30',
                'hover:bg-pos-green/25 active:bg-pos-green/30',
                'disabled:opacity-50',
              )}
            >
              {isPending
                ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                : <Bell className="h-4 w-4" />
              }
              Sẵn sàng phục vụ
            </button>
          )}

          {/* Mark Done — only when READY */}
          {order.status === 'READY' && (
            <button
              onClick={(e) => { e.stopPropagation(); onReady(order.id); }}
              disabled={isPending}
              className={cn(
                'flex-1 flex items-center justify-center gap-2',
                'h-11 rounded-xl text-sm font-semibold tap-scale',
                'bg-muted/50 text-muted-foreground border border-pos-border',
                'disabled:opacity-50',
              )}
            >
              <CheckCheck className="h-4 w-4" />
              Đã giao
            </button>
          )}
        </div>

        {/* Swipe hint for touch devices */}
        {(order.status === 'CONFIRMED' || order.status === 'PREPARING') && (
          <p className="text-center text-[10px] text-muted-foreground/40 mt-2 select-none">
            ← Vuốt để thay đổi trạng thái →
          </p>
        )}
      </div>
    </div>
  );
});
