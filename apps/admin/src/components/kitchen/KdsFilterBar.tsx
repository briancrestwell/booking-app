'use client';
import { Volume2, VolumeX } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useKdsStore } from '@/store/kds.store';
import type { KitchenOrderStatus } from '@/mock/seed';

const STATUS_FILTERS: { id: KitchenOrderStatus | 'ALL'; label: string; dot?: string }[] = [
  { id: 'ALL',       label: 'Tất cả' },
  { id: 'PENDING',   label: 'Chờ',      dot: 'bg-pos-amber' },
  { id: 'CONFIRMED', label: 'Xác nhận', dot: 'bg-primary' },
  { id: 'PREPARING', label: 'Đang nấu', dot: 'bg-pos-amber' },
  { id: 'READY',     label: 'Sẵn sàng', dot: 'bg-pos-green' },
];

interface KdsFilterBarProps {
  counts: Partial<Record<KitchenOrderStatus | 'ALL', number>>;
}

export function KdsFilterBar({ counts }: KdsFilterBarProps) {
  const statusFilter  = useKdsStore((s) => s.statusFilter);
  const setStatus     = useKdsStore((s) => s.setStatusFilter);
  const soundEnabled  = useKdsStore((s) => s.soundEnabled);
  const toggleSound   = useKdsStore((s) => s.toggleSound);

  return (
    <div className="flex items-center gap-2">
      {/* Filter pills */}
      <div className="flex-1 flex gap-2 overflow-x-auto no-scrollbar pb-0.5">
        {STATUS_FILTERS.map((f) => {
          const isActive = statusFilter === f.id;
          const count    = counts[f.id] ?? 0;
          return (
            <button
              key={f.id}
              onClick={() => setStatus(f.id)}
              className={cn(
                'shrink-0 flex items-center gap-1.5 rounded-full px-3.5 py-1.5',
                'text-xs font-semibold border tap-scale transition-colors',
                isActive
                  ? 'border-primary bg-primary/15 text-primary'
                  : 'border-pos-border bg-background text-muted-foreground',
              )}
            >
              {f.dot && <span className={cn('h-1.5 w-1.5 rounded-full', f.dot)} />}
              {f.label}
              {count > 0 && (
                <span className={cn(
                  'rounded-full px-1.5 py-0.5 text-[10px] font-bold',
                  isActive ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground',
                )}>
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Sound toggle */}
      <button
        onClick={toggleSound}
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-pos-border tap-scale"
        aria-label={soundEnabled ? 'Tắt âm thanh' : 'Bật âm thanh'}
      >
        {soundEnabled
          ? <Volume2 className="h-4 w-4 text-muted-foreground" />
          : <VolumeX  className="h-4 w-4 text-muted-foreground" />
        }
      </button>
    </div>
  );
}
