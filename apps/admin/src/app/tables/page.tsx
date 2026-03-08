'use client';
import { useState, useMemo } from 'react';
import { RefreshCw, Wifi, WifiOff } from 'lucide-react';
import { MobileAppLayout } from '@/components/layout/MobileAppLayout';
import { TableCard } from '@/components/tables/TableCard';
import { TableDrawer } from '@/components/tables/TableDrawer';
import { CheckoutSheet } from '@/components/checkout/CheckoutSheet';
import { StatusLegend, SectionFilter } from '@/components/tables/TableFilters';
import { Skeleton } from '@/components/ui/skeleton';
import { useTables } from '@/hooks/use-tables';
import { useAdminSocket } from '@/hooks/use-admin-socket';
import { useToast } from '@/components/shared/Toast';
import { MOCK_BRANCH_ID } from '@/mock/seed';
import type { MockTable, TableStatus } from '@/mock/seed';
import { cn } from '@/lib/utils';
import { IS_MOCK } from '@/api/client';

const BRANCH_ID = IS_MOCK
  ? MOCK_BRANCH_ID
  : (process.env.NEXT_PUBLIC_DEMO_BRANCH_ID ?? 'demo-branch');

export default function TablesPage() {
  const { toast } = useToast();

  // ── Data ────────────────────────────────────────────────────────────────────
  const { data: tables = [], isLoading, isError, refetch, isFetching } = useTables();

  // ── Real-time socket ────────────────────────────────────────────────────────
  useAdminSocket(BRANCH_ID);

  // ── Local UI state ──────────────────────────────────────────────────────────
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const [drawerTable,   setDrawerTable]   = useState<MockTable | null>(null);
  const [checkoutTable, setCheckoutTable] = useState<MockTable | null>(null);
  const [drawerOpen,    setDrawerOpen]    = useState(false);
  const [checkoutOpen,  setCheckoutOpen]  = useState(false);

  // ── Derived values ───────────────────────────────────────────────────────────
  const sections = useMemo(() =>
    [...new Set((tables as MockTable[]).map((t) => t.section))],
    [tables],
  );

  const filtered = useMemo(() =>
    (tables as MockTable[]).filter((t) =>
      activeSection === null || t.section === activeSection,
    ),
    [tables, activeSection],
  );

  const counts = useMemo(() => {
    const c: Partial<Record<TableStatus, number>> = {};
    (tables as MockTable[]).forEach((t) => { c[t.status] = (c[t.status] ?? 0) + 1; });
    return c;
  }, [tables]);

  // ── Handlers ─────────────────────────────────────────────────────────────────
  function openDrawer(table: MockTable) {
    setDrawerTable(table);
    setDrawerOpen(true);
  }

  function openCheckout(table: MockTable) {
    setDrawerOpen(false);
    // Small delay so the drawer finishes closing before checkout opens
    setTimeout(() => {
      setCheckoutTable(table);
      setCheckoutOpen(true);
    }, 180);
  }

  function closeDrawer()   { setDrawerOpen(false); }
  function closeCheckout() { setCheckoutOpen(false); }

  async function handleRefresh() {
    try {
      await refetch();
      toast('Đã làm mới sơ đồ bàn', 'info');
    } catch {
      toast('Không thể tải lại dữ liệu', 'error');
    }
  }

  // ── Render ────────────────────────────────────────────────────────────────────
  return (
    <>
      <MobileAppLayout
        title="Sơ đồ bàn"
        headerRight={
          <button
            onClick={handleRefresh}
            className="flex h-9 w-9 items-center justify-center rounded-full tap-scale"
            aria-label="Làm mới"
          >
            <RefreshCw className={cn('h-4 w-4 text-muted-foreground', isFetching && 'animate-spin')} />
          </button>
        }
      >
        <div className="px-4 pt-3 pb-2 space-y-3">
          {/* Connection indicator */}
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
              {IS_MOCK ? (
                <><WifiOff className="h-3 w-3 text-pos-amber" /> Mock mode</>
              ) : (
                <><Wifi className="h-3 w-3 text-pos-green" /> Kết nối thực</>
              )}
            </span>
            <span className="text-xs text-muted-foreground">
              {(tables as MockTable[]).length} bàn
            </span>
          </div>

          {/* Status legend */}
          <StatusLegend counts={counts} />

          {/* Section filter pills */}
          {sections.length > 1 && (
            <SectionFilter
              sections={sections}
              active={activeSection}
              onChange={setActiveSection}
            />
          )}
        </div>

        {/* ── Table grid ─────────────────────────────────────────────────────── */}
        <div className="px-4 pb-6">
          {isLoading ? (
            <div className="grid grid-cols-3 gap-3">
              {Array.from({ length: 9 }).map((_, i) => (
                <Skeleton key={i} className="h-28 rounded-2xl" />
              ))}
            </div>
          ) : isError ? (
            // In Live mode with no backend yet, show a friendly setup prompt
            // rather than a technical error message
            IS_MOCK ? (
              <div className="flex flex-col items-center justify-center py-16 gap-3 text-muted-foreground">
                <p className="text-sm">Không thể tải danh sách bàn.</p>
                <button onClick={handleRefresh} className="text-xs text-primary underline tap-scale">
                  Thử lại
                </button>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-16 gap-4 text-muted-foreground px-4 text-center">
                <div className="h-16 w-16 rounded-2xl bg-secondary flex items-center justify-center text-3xl">
                  🪑
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">Chưa có bàn nào</p>
                  <p className="text-xs mt-1 leading-relaxed">
                    Khi kết nối backend, danh sách bàn sẽ hiển thị ở đây.
                    <br />Hoặc bật chế độ Demo để xem thử.
                  </p>
                </div>
                <button onClick={handleRefresh} className="text-xs text-primary underline tap-scale">
                  Thử kết nối lại
                </button>
              </div>
            )
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center py-16 gap-4 text-muted-foreground text-center px-4">
              <div className="h-16 w-16 rounded-2xl bg-secondary flex items-center justify-center text-3xl">
                🪑
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">Chưa có bàn nào</p>
                <p className="text-xs mt-1">
                  {activeSection
                    ? `Không có bàn trong khu "${activeSection}"`
                    : 'Danh sách bàn trống. Liên hệ quản trị để thêm bàn.'}
                </p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-3">
              {filtered.map((table) => (
                <TableCard
                  key={(table as MockTable).id}
                  table={table as MockTable}
                  onClick={openDrawer}
                />
              ))}
            </div>
          )}
        </div>
      </MobileAppLayout>

      {/* ── Table detail drawer ─────────────────────────────────────────────── */}
      <TableDrawer
        table={drawerTable}
        open={drawerOpen}
        onClose={closeDrawer}
        onCheckout={openCheckout}
      />

      {/* ── Checkout sheet ──────────────────────────────────────────────────── */}
      <CheckoutSheet
        table={checkoutTable}
        open={checkoutOpen}
        onClose={closeCheckout}
      />
    </>
  );
}
