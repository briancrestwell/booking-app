'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutGrid,
  ChefHat,
  UtensilsCrossed,
  Settings,
  ExternalLink,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { usePermission, type Permission } from '@/hooks/use-permission';

// ── Tab definition ────────────────────────────────────────────────────────────
const ALL_TABS = [
  { href: '/tables',  label: 'Bàn',      icon: LayoutGrid,      perm: 'nav:tables'  as Permission },
  { href: '/kitchen', label: 'Bếp',      icon: ChefHat,         perm: 'nav:kitchen' as Permission },
  { href: '/menu',    label: 'Thực đơn', icon: UtensilsCrossed, perm: 'nav:menu'    as Permission },
  { href: '/settings', label: 'Cài đặt', icon: Settings,        perm: 'nav:settings' as Permission },
] as const;

// ── Bottom Nav Bar ────────────────────────────────────────────────────────────
function BottomNav({ badge }: { badge?: Partial<Record<string, number>> }) {
  const pathname = usePathname();
  const { can }  = usePermission();

  const tabs = ALL_TABS.filter((t) => can(t.perm));

  return (
    <nav
      aria-label="Điều hướng chính"
      className={cn(
        'shrink-0 z-40',
        'flex items-stretch',
        'bg-pos-surface border-t border-pos-border',
        'pb-safe',
      )}
      style={{ minHeight: 'calc(var(--nav-h) + env(safe-area-inset-bottom, 0px))' }}
    >
      {tabs.map((tab) => {
        const isActive = pathname.startsWith(tab.href);
        const Icon     = tab.icon;
        const count    = badge?.[tab.href] ?? 0;

        return (
          <Link
            key={tab.href}
            href={tab.href}
            aria-label={tab.label}
            aria-current={isActive ? 'page' : undefined}
            className={cn(
              // Equal-width columns, large touch target
              'relative flex flex-1 flex-col items-center justify-center gap-1',
              'min-h-[64px] tap-scale select-none',
              'transition-colors duration-150',
              isActive
                ? 'text-primary'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            {/* Active indicator pill */}
            {isActive && (
              <span className="absolute top-0 left-1/2 h-0.5 w-8 -translate-x-1/2 rounded-full bg-primary" />
            )}

            {/* Icon + optional badge */}
            <span className="relative">
              <Icon
                className={cn(
                  'h-6 w-6 transition-transform duration-150',
                  isActive && 'scale-110',
                )}
                strokeWidth={isActive ? 2 : 1.5}
              />
              {count > 0 && (
                <span className="absolute -right-1.5 -top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[9px] font-bold text-white">
                  {count > 99 ? '99+' : count}
                </span>
              )}
            </span>

            {/* Label */}
            <span
              className={cn(
                'text-[10px] font-medium leading-none',
                isActive ? 'text-primary' : 'text-muted-foreground',
              )}
            >
              {tab.label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}

// ── Layout ────────────────────────────────────────────────────────────────────
interface MobileAppLayoutProps {
  children:    React.ReactNode;
  /** Page-level header title rendered in the top bar */
  title?:      string;
  /** Right-side action slot in the header */
  headerRight?: React.ReactNode;
  /** Nav badge counts keyed by route href */
  navBadge?:   Partial<Record<string, number>>;
  /** Hide the sticky header (full-bleed pages) */
  noHeader?:   boolean;
  /** Fixed sub-header rendered between top bar and scroll area (e.g. filter tabs) */
  subheader?:  React.ReactNode;
}

export function MobileAppLayout({
  children,
  title,
  headerRight,
  navBadge,
  noHeader = false,
  subheader,
}: MobileAppLayoutProps) {
  return (
    <div className="flex h-dvh flex-col bg-background overflow-hidden">
      {/* ── Top header ───────────────────────────────────────────────────── */}
      {!noHeader && (
        <header
          className={cn(
            'shrink-0 z-30 flex items-center justify-between',
            'bg-pos-surface/90 backdrop-blur-md',
            'border-b border-pos-border',
            'px-4 pt-safe',
            'h-14',
          )}
        >
          <h1 className="text-base font-semibold text-foreground truncate">
            {title ?? 'POS Admin'}
          </h1>
          <div className="flex items-center gap-2 shrink-0">
            {headerRight}
            {/* Switch to customer app */}
            <a
              href="http://localhost:3000"
              target="_blank"
              rel="noopener noreferrer"
              title="Xem app khách hàng"
              className={cn(
                'flex items-center gap-1.5 h-8 px-2.5 rounded-lg text-xs font-medium',
                'bg-white/8 border border-white/10 text-white/60',
                'hover:bg-white/14 hover:text-white/90 active:scale-95',
                'transition-all duration-150 select-none',
              )}
            >
              <ExternalLink className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">App khách</span>
            </a>
          </div>
        </header>
      )}

      {/* ── Fixed sub-header (outside scroll, won't move with content) ───── */}
      {subheader && (
        <div className="shrink-0 z-20 bg-background/95 backdrop-blur-md border-b border-pos-border px-4 py-3">
          {subheader}
        </div>
      )}

      {/* ── Scrollable content area ───────────────────────────────────────── */}
      <main
        className={cn(
          'flex-1 overflow-y-auto overflow-x-hidden',
        )}
      >
        {children}
      </main>

      {/* ── Bottom navigation bar ─────────────────────────────────────────── */}
      <BottomNav badge={navBadge} />
    </div>
  );
}
