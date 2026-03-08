'use client';
import { cn } from '@/lib/utils';
import type { TableStatus } from '@/mock/seed';

const LEGEND: { status: TableStatus; label: string; color: string }[] = [
  { status: 'AVAILABLE', label: 'Trống',     color: 'bg-pos-green' },
  { status: 'LOCKED',    label: 'Đặt trước', color: 'bg-pos-amber' },
  { status: 'OCCUPIED',  label: 'Đang dùng', color: 'bg-pos-red'   },
  { status: 'CLEARING',  label: 'Dọn bàn',   color: 'bg-muted-foreground' },
];

interface StatusLegendProps {
  counts: Partial<Record<TableStatus, number>>;
}

export function StatusLegend({ counts }: StatusLegendProps) {
  return (
    <div className="flex flex-wrap gap-x-4 gap-y-1.5">
      {LEGEND.map(({ status, label, color }) => {
        const count = counts[status] ?? 0;
        return (
          <span key={status} className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <span className={cn('h-2 w-2 rounded-full', color)} />
            {label}
            <span className="font-semibold text-foreground">{count}</span>
          </span>
        );
      })}
    </div>
  );
}

interface SectionFilterProps {
  sections:       string[];
  active:         string | null;
  onChange:       (s: string | null) => void;
}

export function SectionFilter({ sections, active, onChange }: SectionFilterProps) {
  return (
    <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
      <button
        onClick={() => onChange(null)}
        className={cn(
          'shrink-0 rounded-full px-3.5 py-1.5 text-xs font-semibold tap-scale',
          'border transition-colors',
          active === null
            ? 'border-primary bg-primary/15 text-primary'
            : 'border-pos-border bg-background text-muted-foreground',
        )}
      >
        Tất cả
      </button>
      {sections.map((s) => (
        <button
          key={s}
          onClick={() => onChange(s)}
          className={cn(
            'shrink-0 rounded-full px-3.5 py-1.5 text-xs font-semibold tap-scale',
            'border transition-colors',
            active === s
              ? 'border-primary bg-primary/15 text-primary'
              : 'border-pos-border bg-background text-muted-foreground',
          )}
        >
          {s}
        </button>
      ))}
    </div>
  );
}
