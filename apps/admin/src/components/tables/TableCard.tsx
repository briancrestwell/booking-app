'use client';
import { Users, Clock } from 'lucide-react';
import { cn, formatTime } from '@/lib/utils';
import type { MockTable, TableStatus } from '@/mock/seed';

// ── Status config ─────────────────────────────────────────────────────────────
const STATUS_CONFIG: Record<TableStatus, {
  label:    string;
  dotClass: string;
  bgClass:  string;
  borderClass: string;
  textClass:   string;
}> = {
  AVAILABLE: {
    label:       'Trống',
    dotClass:    'bg-pos-green animate-pulse-dot',
    bgClass:     'bg-pos-green/10 hover:bg-pos-green/20',
    borderClass: 'border-pos-green/40',
    textClass:   'text-pos-green',
  },
  LOCKED: {
    label:       'Đặt trước',
    dotClass:    'bg-pos-amber animate-pulse-dot',
    bgClass:     'bg-pos-amber/10 hover:bg-pos-amber/15',
    borderClass: 'border-pos-amber/40',
    textClass:   'text-pos-amber',
  },
  OCCUPIED: {
    label:       'Đang dùng',
    dotClass:    'bg-pos-red',
    bgClass:     'bg-pos-red/10 hover:bg-pos-red/15',
    borderClass: 'border-pos-red/40',
    textClass:   'text-pos-red',
  },
  CLEARING: {
    label:       'Dọn bàn',
    dotClass:    'bg-muted-foreground',
    bgClass:     'bg-muted/40 hover:bg-muted/60',
    borderClass: 'border-border',
    textClass:   'text-muted-foreground',
  },
};

// Extend tailwind config colours into pos-red for type safety
// (already defined as pos.red in tailwind.config.js)

interface TableCardProps {
  table:   MockTable;
  onClick: (table: MockTable) => void;
}

export function TableCard({ table, onClick }: TableCardProps) {
  const cfg = STATUS_CONFIG[table.status];

  return (
    <button
      onClick={() => onClick(table)}
      aria-label={`Bàn ${table.number} — ${cfg.label}`}
      className={cn(
        'relative flex flex-col gap-2 rounded-2xl border p-3.5',
        'w-full text-left transition-all duration-150',
        'tap-scale active:brightness-90',
        cfg.bgClass,
        cfg.borderClass,
        // CLEARING is non-interactive feel
        table.status === 'CLEARING' && 'opacity-60',
      )}
    >
      {/* Status dot */}
      <span className={cn('absolute right-3 top-3 h-2.5 w-2.5 rounded-full', cfg.dotClass)} />

      {/* Table number */}
      <span className="text-2xl font-extrabold text-foreground leading-none">
        {table.number}
      </span>

      {/* Capacity */}
      <span className="flex items-center gap-1 text-xs text-muted-foreground">
        <Users className="h-3 w-3" />
        {table.capacity}
      </span>

      {/* Booking info (occupied / locked) */}
      {table.currentBooking ? (
        <div className="mt-1 space-y-0.5">
          <p className="text-[11px] font-semibold text-foreground truncate leading-tight">
            {table.currentBooking.guestName}
          </p>
          <p className="flex items-center gap-1 text-[10px] text-muted-foreground">
            <Clock className="h-2.5 w-2.5" />
            {formatTime(table.currentBooking.scheduledAt)}
          </p>
        </div>
      ) : (
        <p className={cn('text-[11px] font-medium mt-0.5', cfg.textClass)}>
          {cfg.label}
        </p>
      )}
    </button>
  );
}
