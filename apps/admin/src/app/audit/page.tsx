'use client';
import { useState, useMemo } from 'react';
import { MobileAppLayout } from '@/components/layout/MobileAppLayout';
import { useAuditLogStore, type AuditEntry, type AuditCategory } from '@/store/audit-log.store';
import { useToast } from '@/components/shared/Toast';
import { cn } from '@/lib/utils';
import {
  Search, Download, Trash2, ShieldAlert, Check, X,
  LogIn, LogOut, LayoutGrid, ShoppingCart, CreditCard,
  UtensilsCrossed, ChefHat, Store, Settings2,
} from 'lucide-react';

// ── Category config ───────────────────────────────────────────────────────────
const CATEGORY_CONFIG: Record<AuditCategory, {
  label: string;
  color: string;
  bg:    string;
  Icon:  React.ElementType;
}> = {
  AUTH:       { label: 'Auth',       color: 'text-blue-400',   bg: 'bg-blue-400/15',   Icon: LogIn         },
  TABLE:      { label: 'Bàn',        color: 'text-pos-amber',  bg: 'bg-pos-amber/15',  Icon: LayoutGrid    },
  ORDER:      { label: 'Đơn hàng',   color: 'text-primary',    bg: 'bg-primary/15',    Icon: ShoppingCart  },
  PAYMENT:    { label: 'Thanh toán', color: 'text-pos-green',  bg: 'bg-pos-green/15',  Icon: CreditCard    },
  MENU:       { label: 'Menu',       color: 'text-orange-400', bg: 'bg-orange-400/15', Icon: UtensilsCrossed},
  KDS:        { label: 'Bếp',        color: 'text-pos-amber',  bg: 'bg-pos-amber/15',  Icon: ChefHat       },
  RESTAURANT: { label: 'Nhà hàng',   color: 'text-purple-400', bg: 'bg-purple-400/15', Icon: Store         },
  SYSTEM:     { label: 'Hệ thống',   color: 'text-muted-foreground', bg: 'bg-white/10', Icon: Settings2    },
};

const ALL_CATEGORIES: AuditCategory[] = ['AUTH','TABLE','ORDER','PAYMENT','MENU','KDS','RESTAURANT','SYSTEM'];

// ── CSV export ────────────────────────────────────────────────────────────────
function exportCSV(entries: AuditEntry[]) {
  const header = 'Thời gian,Loại,Hành động,Mô tả,Kết quả,Nhân viên,Vai trò,Đối tượng\n';
  const rows = entries.map((e) => [
    new Date(e.timestamp).toLocaleString('vi-VN'),
    e.category,
    e.action,
    `"${e.label.replace(/"/g, '""')}"`,
    e.outcome === 'SUCCESS' ? 'Thành công' : 'Thất bại',
    e.actorName,
    e.actorRole,
    e.targetId ?? '',
  ].join(',')).join('\n');

  const blob = new Blob(['\uFEFF' + header + rows], { type: 'text/csv;charset=utf-8;' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = `audit-log-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

// ── Relative time ─────────────────────────────────────────────────────────────
function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const s = Math.floor(diff / 1000);
  if (s < 60)  return `${s}s trước`;
  const m = Math.floor(s / 60);
  if (m < 60)  return `${m}ph trước`;
  const h = Math.floor(m / 60);
  if (h < 24)  return `${h}h trước`;
  return new Date(iso).toLocaleDateString('vi-VN');
}

// ── Entry row ────────────────────────────────────────────────────────────────
function EntryRow({ entry }: { entry: AuditEntry }) {
  const cfg     = CATEGORY_CONFIG[entry.category] ?? CATEGORY_CONFIG.SYSTEM;
  const Icon    = cfg.Icon;
  const isOk    = entry.outcome === 'SUCCESS';
  const isAuth  = entry.category === 'AUTH';
  const isLogout = entry.action === 'LOGOUT' || entry.action === 'LOGIN_FAILED';

  return (
    <div className={cn(
      'flex items-start gap-3 px-4 py-3.5',
      'border-b border-white/5 last:border-0',
      !isOk && 'bg-pos-red/5',
    )}>
      {/* Category icon */}
      <span className={cn(
        'mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full',
        cfg.bg,
      )}>
        {isAuth && !isLogout
          ? <LogIn  className={cn('h-4 w-4', cfg.color)} />
          : isAuth
          ? <LogOut className={cn('h-4 w-4', cfg.color)} />
          : <Icon   className={cn('h-4 w-4', cfg.color)} />
        }
      </span>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <p className="text-sm text-white leading-snug">{entry.label}</p>
          {isOk
            ? <Check className="h-3.5 w-3.5 text-pos-green shrink-0 mt-0.5" />
            : <X     className="h-3.5 w-3.5 text-pos-red   shrink-0 mt-0.5" />
          }
        </div>
        <div className="flex items-center gap-2 mt-1 flex-wrap">
          <span className={cn('text-[10px] font-bold px-1.5 py-0.5 rounded-full', cfg.bg, cfg.color)}>
            {cfg.label}
          </span>
          <span className="text-[10px] text-white/40 font-mono">{entry.action}</span>
          <span className="text-[10px] text-white/30">•</span>
          <span className="text-[10px] text-white/40">{entry.actorName}</span>
          <span className="text-[10px] text-white/30">•</span>
          <span className="text-[10px] text-white/30">{relativeTime(entry.timestamp)}</span>
        </div>
      </div>
    </div>
  );
}

// ── Main page ────────────────────────────────────────────────────────────────
export default function AuditPage() {
  const entries = useAuditLogStore((s) => s.entries);
  const clear   = useAuditLogStore((s) => s.clear);
  const { toast } = useToast();

  const [search,   setSearch]   = useState('');
  const [catFilter, setCatFilter] = useState<AuditCategory | 'ALL'>('ALL');
  const [outcome,  setOutcome]  = useState<'ALL' | 'SUCCESS' | 'FAILURE'>('ALL');
  const [confirmClear, setConfirmClear] = useState(false);

  const filtered = useMemo(() => {
    return entries.filter((e) => {
      if (catFilter !== 'ALL' && e.category !== catFilter) return false;
      if (outcome   !== 'ALL' && e.outcome  !== outcome)   return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        return (
          e.label.toLowerCase().includes(q) ||
          e.action.toLowerCase().includes(q) ||
          e.actorName.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [entries, catFilter, outcome, search]);

  function handleClear() {
    if (!confirmClear) { setConfirmClear(true); setTimeout(() => setConfirmClear(false), 3000); return; }
    clear();
    setConfirmClear(false);
    toast('Đã xóa toàn bộ hoạt động theo dõi hệ thống', 'info');
  }

  const successCount = entries.filter((e) => e.outcome === 'SUCCESS').length;
  const failCount    = entries.filter((e) => e.outcome === 'FAILURE').length;

  return (
    <MobileAppLayout
      title="Audit Log"
      headerRight={
        <div className="flex items-center gap-2">
          <button
            onClick={() => exportCSV(filtered)}
            disabled={filtered.length === 0}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 tap-scale disabled:opacity-30"
            title="Xuất CSV"
          >
            <Download className="h-4 w-4 text-white/70" />
          </button>
          <button
            onClick={handleClear}
            className={cn(
              'flex h-8 items-center gap-1.5 rounded-full px-3 text-xs font-medium tap-scale',
              confirmClear
                ? 'bg-pos-red/20 text-pos-red border border-pos-red/30'
                : 'bg-white/10 text-white/50',
            )}
            title="Xóa log"
          >
            <Trash2 className="h-3.5 w-3.5" />
            {confirmClear ? 'Xác nhận?' : ''}
          </button>
        </div>
      }
    >
      {/* ── Stats row ───────────────────────────────────────────── */}
      <div className="px-4 pt-4 pb-3 grid grid-cols-3 gap-3">
        {[
          { label: 'Tổng',       value: entries.length, color: 'text-white' },
          { label: 'Thành công', value: successCount,   color: 'text-pos-green' },
          { label: 'Thất bại',   value: failCount,      color: failCount > 0 ? 'text-pos-red' : 'text-white/30' },
        ].map((s) => (
          <div key={s.label} className="rounded-xl bg-pos-surface p-3 text-center">
            <p className={cn('text-xl font-bold tabular-nums', s.color)}>{s.value}</p>
            <p className="text-[10px] text-white/40 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* ── Search ───────────────────────────────────────────────── */}
      <div className="px-4 pb-2">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30 pointer-events-none" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm theo mô tả, action, nhân viên…"
            className="w-full h-10 pl-9 pr-4 rounded-xl text-sm bg-white/8 border border-white/10 text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-pos-brand"
          />
        </div>
      </div>

      {/* ── Outcome filter ───────────────────────────────────────── */}
      <div className="px-4 pb-2 flex gap-2">
        {(['ALL', 'SUCCESS', 'FAILURE'] as const).map((o) => (
          <button
            key={o}
            onClick={() => setOutcome(o)}
            className={cn(
              'flex-1 h-8 rounded-full text-xs font-semibold tap-scale transition-colors',
              outcome === o
                ? o === 'SUCCESS' ? 'bg-pos-green text-white'
                  : o === 'FAILURE' ? 'bg-pos-red text-white'
                  : 'bg-pos-brand text-white'
                : 'bg-white/8 text-white/50 border border-white/10',
            )}
          >
            {o === 'ALL' ? 'Tất cả' : o === 'SUCCESS' ? '✓ Thành công' : '✗ Thất bại'}
          </button>
        ))}
      </div>

      {/* ── Category filter chips ────────────────────────────────── */}
      <div className="px-4 pb-3 flex gap-2 overflow-x-auto scrollbar-none">
        <CategoryChip label="Tất cả" active={catFilter === 'ALL'} onClick={() => setCatFilter('ALL')} />
        {ALL_CATEGORIES.map((cat) => {
          const cfg = CATEGORY_CONFIG[cat];
          return (
            <CategoryChip
              key={cat}
              label={cfg.label}
              active={catFilter === cat}
              color={cfg.color}
              onClick={() => setCatFilter(cat)}
            />
          );
        })}
      </div>

      {/* ── Log timeline ─────────────────────────────────────────── */}
      <div className="px-4 pb-6">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3 text-white/30">
            <ShieldAlert className="h-10 w-10 opacity-30" />
            <p className="text-sm">
              {entries.length === 0 ? 'Chưa có hoạt động nào được ghi lại' : 'Không có kết quả phù hợp'}
            </p>
          </div>
        ) : (
          <div className="rounded-2xl bg-pos-surface overflow-hidden">
            {/* Result count */}
            <div className="px-4 py-2.5 border-b border-white/5">
              <p className="text-[11px] text-white/30">
                {filtered.length} / {entries.length} mục
                {(search || catFilter !== 'ALL' || outcome !== 'ALL') && (
                  <button
                    onClick={() => { setSearch(''); setCatFilter('ALL'); setOutcome('ALL'); }}
                    className="ml-2 text-pos-brand underline"
                  >
                    Xóa bộ lọc
                  </button>
                )}
              </p>
            </div>
            {filtered.map((entry) => (
              <EntryRow key={entry.id} entry={entry} />
            ))}
          </div>
        )}
      </div>
    </MobileAppLayout>
  );
}

function CategoryChip({ label, active, color, onClick }: {
  label: string; active: boolean; color?: string; onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'shrink-0 h-7 px-3 rounded-full text-xs font-medium tap-scale transition-colors',
        active
          ? cn('bg-pos-brand text-white', color)
          : 'bg-white/8 text-white/50 border border-white/10',
      )}
    >
      {label}
    </button>
  );
}
