'use client';
import { useState, useCallback, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { SOCKET_EVENTS, queryKeys, getMockMode, setMockMode } from '@booking/shared';
import { IS_MOCK, api } from '@/api/client';
import { mockEmit } from '@/hooks/use-socket';
import { MOCK_TABLE_ID } from '@/mock/seed';

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  PENDING:   { label: 'Chờ xác nhận', color: 'bg-yellow-400 text-yellow-900' },
  CONFIRMED: { label: 'Đã xác nhận',  color: 'bg-blue-400 text-blue-900'    },
  PREPARING: { label: 'Đang nấu',     color: 'bg-orange-400 text-orange-900' },
  READY:     { label: 'Sẵn sàng',     color: 'bg-green-400 text-green-900'  },
  SERVED:    { label: 'Đã phục vụ',   color: 'bg-gray-400 text-gray-900'    },
};

const TABLE_STATUS_CYCLE = ['AVAILABLE', 'LOCKED', 'OCCUPIED', 'AVAILABLE'];

export default function MockBanner() {
  const queryClient  = useQueryClient();
  const [tableStatusIdx, setTableStatusIdx] = useState(0);
  const [busy, setBusy]   = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [open, setOpen]   = useState(false);
  const [, rerender]      = useState(0);

  // isMock always reads live from localStorage — no stale state
  const isMock = typeof window !== 'undefined' ? getMockMode() : false;

  // Trigger client-side render so isMock reflects localStorage after hydration
  useEffect(() => { rerender(1); }, []);

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  }

  const advanceOrder = useCallback(async () => {
    setBusy(true);
    try {
      const updated = api._mock._advanceFirstOrder();
      if (!updated) { showToast('Không có đơn nào để cập nhật'); return; }
      queryClient.invalidateQueries({ queryKey: queryKeys.orders.all() });
      mockEmit(SOCKET_EVENTS.ORDER_STATUS_CHANGED, {
        orderId: updated.id,
        tableId: updated.tableId,
        status:  updated.status,
      });
      const lbl = STATUS_LABELS[updated.status] ?? { label: updated.status, color: '' };
      showToast(`Đơn ${updated.id.slice(-4).toUpperCase()} → ${lbl.label}`);
    } finally {
      setBusy(false);
    }
  }, [queryClient]);

  const cycleTableStatus = useCallback(() => {
    const next = (tableStatusIdx + 1) % TABLE_STATUS_CYCLE.length;
    setTableStatusIdx(next);
    const status = TABLE_STATUS_CYCLE[next];
    mockEmit(SOCKET_EVENTS.TABLE_STATUS_CHANGED, {
      tableId: MOCK_TABLE_ID, branchId: 'mock-branch-001', status,
    });
    showToast(`Bàn 4 → ${status}`);
  }, [tableStatusIdx]);

  const reset = useCallback(() => {
    api._mock._reset();
    queryClient.invalidateQueries();
    setTableStatusIdx(0);
    showToast('Đã reset mock data');
  }, [queryClient]);

  const currentTableStatus = TABLE_STATUS_CYCLE[tableStatusIdx];

  return (
    <>
      {/* Switch to admin app */}
      <a
        href="http://localhost:3002"
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-[148px] right-3 z-50 flex h-11 w-11 items-center justify-center rounded-full bg-gray-900 border border-white/15 text-white shadow-lg text-base active:scale-95 transition-transform"
        title="Mở POS Admin"
      >
        🧑‍💼
      </a>

      {/* Floating toggle button */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="fixed bottom-24 right-3 z-50 flex h-11 w-11 items-center justify-center rounded-full bg-violet-600 text-white shadow-lg text-lg active:scale-95 transition-transform"
        aria-label="Demo controls"
      >
        🎬
      </button>

      {/* Toast */}
      {toast && (
        <div className="fixed top-[calc(env(safe-area-inset-top)+8px)] left-1/2 z-[60] -translate-x-1/2 whitespace-nowrap rounded-full bg-gray-800 px-4 py-2 text-sm text-white shadow-lg">
          {toast}
        </div>
      )}

      {/* Panel */}
      {open && (
        <div className="fixed bottom-[calc(env(safe-area-inset-bottom)+88px)] right-3 z-50 w-72 rounded-2xl bg-white shadow-2xl ring-1 ring-black/10 overflow-hidden">
          <div className="flex items-center justify-between bg-violet-600 px-4 py-3">
            <span className="text-sm font-semibold text-white">🎬 DEMO CONTROLS</span>
            <button onClick={() => setOpen(false)} className="text-white/80 hover:text-white text-xl leading-none">×</button>
          </div>

          <div className="divide-y divide-gray-100">

            {/* Mock mode toggle — always visible */}
            <div className="px-4 py-3">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">Chế độ dữ liệu</p>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-800">
                    {isMock ? '🧪 Demo (mock)' : '🌐 Live (API)'}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {isMock ? 'Không cần server' : 'Kết nối API thật'}
                  </p>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={isMock}
                  onClick={() => setMockMode(!getMockMode())}
                  className={`relative inline-flex h-6 w-11 rounded-full p-[2px] transition-colors ${isMock ? 'bg-violet-500' : 'bg-gray-300'}`}
                >
                  <span className={`inline-block h-5 w-5 rounded-full bg-white shadow transition-transform ${isMock ? 'translate-x-5' : 'translate-x-0'}`} />
                </button>
              </div>
            </div>

            {/* Demo controls — only show when mock is active */}
            {IS_MOCK && (
              <>
                <div className="px-4 py-3">
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">Trạng thái đơn hàng</p>
                  <div className="grid grid-cols-2 gap-1 mb-3">
                    {Object.entries(STATUS_LABELS).map(([k, v]) => (
                      <span key={k} className={`rounded-full px-2 py-0.5 text-xs font-medium text-center ${v.color}`}>
                        {v.label}
                      </span>
                    ))}
                  </div>
                  <button
                    onClick={advanceOrder}
                    disabled={busy}
                    className="w-full rounded-xl bg-violet-600 py-2.5 text-sm font-semibold text-white active:scale-95 transition-transform disabled:opacity-50"
                  >
                    {busy ? 'Đang xử lý…' : '▶ Chuyển trạng thái đơn'}
                  </button>
                </div>

                <div className="px-4 py-3">
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">Trạng thái bàn</p>
                  <p className="mb-3 text-xs text-gray-500">
                    Bàn 4 — đang: <span className="font-semibold text-gray-700">{currentTableStatus}</span>
                  </p>
                  <button
                    onClick={cycleTableStatus}
                    className="w-full rounded-xl bg-teal-600 py-2.5 text-sm font-semibold text-white active:scale-95 transition-transform"
                  >
                    🔄 Đổi trạng thái bàn
                  </button>
                </div>

                <div className="px-4 py-3">
                  <button
                    onClick={reset}
                    className="w-full rounded-xl bg-red-50 py-2.5 text-sm font-semibold text-red-600 ring-1 ring-red-200 active:scale-95 transition-transform"
                  >
                    🗑 Reset toàn bộ mock data
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
