'use client';
import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import { X, CheckCircle2, AlertCircle, Info } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useKdsStore } from '@/store/kds.store';

// ── Types ─────────────────────────────────────────────────────────────────────
type ToastVariant = 'success' | 'error' | 'info';

interface Toast {
  id:      string;
  message: string;
  variant: ToastVariant;
}

interface ToastContextValue {
  toast: (message: string, variant?: ToastVariant, opts?: { force?: boolean }) => void;
}

// ── Context ───────────────────────────────────────────────────────────────────
const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used inside ToastProvider');
  return ctx;
}

// ── Individual toast item ─────────────────────────────────────────────────────
function ToastItem({ toast, onDismiss }: { toast: Toast; onDismiss: (id: string) => void }) {
  const icons = {
    success: <CheckCircle2 className="h-4 w-4 shrink-0 text-pos-green" />,
    error:   <AlertCircle  className="h-4 w-4 shrink-0 text-destructive" />,
    info:    <Info         className="h-4 w-4 shrink-0 text-primary" />,
  };
  const borders = {
    success: 'border-pos-green/30',
    error:   'border-destructive/30',
    info:    'border-primary/30',
  };
  return (
    <div
      role="alert"
      aria-live="polite"
      className={cn(
        'flex items-start gap-3 rounded-2xl border bg-card px-4 py-3.5 shadow-2xl',
        'animate-slide-up',
        borders[toast.variant],
      )}
    >
      {icons[toast.variant]}
      <p className="flex-1 text-sm text-foreground leading-snug">{toast.message}</p>
      <button
        onClick={() => onDismiss(toast.id)}
        className="shrink-0 text-muted-foreground hover:text-foreground tap-scale"
        aria-label="Đóng thông báo"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}

// ── Provider + portal ─────────────────────────────────────────────────────────
export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const timerRef      = useRef<Record<string, ReturnType<typeof setTimeout>>>({});
  const bannerEnabled = useKdsStore((s) => s.bannerEnabled);

  const dismiss = useCallback((id: string) => {
    clearTimeout(timerRef.current[id]);
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback((
    message: string,
    variant: ToastVariant = 'info',
    opts?: { force?: boolean },
  ) => {
    // Always show 'error' — critical failures must be visible regardless of pref.
    // Suppress success/info banners when bannerEnabled is off (unless forced).
    if (!bannerEnabled && variant !== 'error' && !opts?.force) return;

    const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    setToasts((prev) => [...prev.slice(-3), { id, message, variant }]);
    timerRef.current[id] = setTimeout(() => dismiss(id), 3500);
  }, [bannerEnabled, dismiss]);

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}

      {/* Fixed portal at top of screen, respects safe-area notch */}
      <div
        aria-live="polite"
        aria-atomic="false"
        className={cn(
          'fixed inset-x-0 z-[100] flex flex-col gap-2 px-4',
          'top-[max(env(safe-area-inset-top),12px)]',
          'mx-auto max-w-md',
        )}
      >
        {toasts.map((t) => (
          <ToastItem key={t.id} toast={t} onDismiss={dismiss} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}
