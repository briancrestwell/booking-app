'use client';
import { useState, useEffect, memo } from 'react';
import { Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ElapsedTimerProps {
  placedAt:        string;
  /** When provided, timer freezes once status reaches READY */
  status?:         string;
  warnAfterMin?:   number;
  dangerAfterMin?: number;
}

const FROZEN_STATUSES = new Set(['READY', 'SERVED', 'CANCELLED']);

export const ElapsedTimer = memo(function ElapsedTimer({
  placedAt,
  status,
  warnAfterMin   = 8,
  dangerAfterMin = 15,
}: ElapsedTimerProps) {
  const calc = () => Math.floor((Date.now() - new Date(placedAt).getTime()) / 1000);

  const [elapsed, setElapsed] = useState(calc);

  const frozen = status ? FROZEN_STATUSES.has(status) : false;

  useEffect(() => {
    // Snap to current value when status changes (e.g. card re-renders with READY)
    setElapsed(calc());

    if (frozen) return; // no interval needed

    const id = setInterval(() => setElapsed(calc()), 1000);
    return () => clearInterval(id);
  }, [placedAt, frozen]); // eslint-disable-line react-hooks/exhaustive-deps

  const mins    = Math.floor(elapsed / 60);
  const secs    = elapsed % 60;
  const display = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;

  const isDanger = !frozen && mins >= dangerAfterMin;
  const isWarn   = !frozen && !isDanger && mins >= warnAfterMin;

  return (
    <span
      className={cn(
        'flex items-center gap-1 text-xs font-mono font-semibold tabular-nums',
        frozen   ? 'text-pos-green' :
        isDanger ? 'text-pos-red animate-pulse-dot' :
        isWarn   ? 'text-pos-amber' :
                   'text-muted-foreground',
      )}
      aria-label={`Đã chờ ${display}`}
    >
      <Clock className="h-3 w-3 shrink-0" />
      {display}
    </span>
  );
});
