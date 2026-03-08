'use client';
import { useEffect, useRef } from 'react';
import { ArrowLeft, ClipboardList } from 'lucide-react';
import Link from 'next/link';
import { useTableOrders } from '@/hooks/use-queries';
import { formatTime } from '@/lib/utils';
import { useSocket } from '@/hooks/use-socket';
import { Skeleton } from '@/components/ui/skeleton';

const TABLE_ID  = 'demo-table-id';
const BRANCH_ID = process.env.NEXT_PUBLIC_DEMO_BRANCH_ID ?? 'demo-branch';

type OrderItem = { menuItem: { name: string }; quantity: number; notes?: string };
type Order     = { id: string; status: string; createdAt: string; items: OrderItem[] };

const STATUS_RESPONSES: Record<string, string> = {
  PENDING:   'Nhà hàng đã nhận được yêu cầu',
  CONFIRMED: 'Đơn hàng của bạn đã được nhà hàng xác nhận',
  PREPARING: 'Nhà hàng đang chuẩn bị món ăn cho bạn',
  READY:     'Món ăn của bạn đã sẵn sàng, nhân viên sẽ phục vụ ngay 🍽️',
  SERVED:    'Nhà hàng đã phục vụ xong. Chúc bạn ngon miệng! 😊',
};

export default function FeedbackPage() {
  useSocket(BRANCH_ID);
  const { data: orders, isLoading } = useTableOrders(TABLE_ID);
  const orderList = (orders as Order[] | undefined) ?? [];
  const bottomRef = useRef<HTMLDivElement | null>(null);

  /* Auto-scroll to latest message whenever list updates */
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [orderList.length]);

  return (
    <div className="flex h-screen-safe flex-col bg-[#f2f3f7] select-none">

      {/* ── Header ─────────────────────────────────── */}
      <header className="flex h-14 shrink-0 items-center gap-2 bg-white px-4 shadow-sm">
        <Link
          href="/"
          className="flex h-11 w-11 items-center justify-center rounded-full tap-scale"
          aria-label="Quay lại"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="flex-1 text-center text-[17px] font-semibold">Phản hồi của nhà hàng</h1>
        <Link
          href="/order-history"
          className="flex h-11 w-11 items-center justify-center rounded-full tap-scale"
          aria-label="Lịch sử gọi món"
        >
          <ClipboardList className="h-5 w-5 text-[#1B6FEB]" />
        </Link>
      </header>

      {/* History link */}
      <Link
        href="/order-history"
        className="flex justify-center py-2.5 text-sm font-semibold text-[#1B6FEB] tap-opacity shrink-0"
      >
        ≡ Lịch sử gọi món
      </Link>

      {/* ── Chat timeline ──────────────────────────── */}
      <div className="flex-1 overflow-y-auto no-scrollbar px-4 pb-6 space-y-3">

        {isLoading && (
          <>
            <div className="flex justify-end">
              <Skeleton className="h-16 w-3/4 rounded-2xl" />
            </div>
            <div className="flex justify-start">
              <Skeleton className="h-10 w-2/3 rounded-2xl" />
            </div>
          </>
        )}

        {!isLoading && orderList.length === 0 && (
          <div className="mt-20 flex flex-col items-center gap-3 text-muted-foreground">
            <span className="text-4xl">💬</span>
            <p className="text-sm font-medium">Chưa có phản hồi nào.</p>
          </div>
        )}

        {orderList.map((order) => (
          <OrderConversation key={order.id} order={order} />
        ))}

        {/* Anchor for auto-scroll */}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}

function OrderConversation({ order }: { order: Order }) {
  const time            = formatTime(order.createdAt);
  const responseMessage = STATUS_RESPONSES[order.status];

  return (
    <>
      {/* ── Customer bubble (right) ─── */}
      <div className="flex justify-end">
        <div className="max-w-[80%] rounded-2xl rounded-tr-md bg-[#1B6FEB]/[0.12] px-4 py-3">
          <p className="mb-1.5 text-[11px] font-bold uppercase tracking-wide text-[#1B6FEB]">
            Gọi món · {time}
          </p>
          <div className="space-y-1.5">
            {order.items.map((item, i) => (
              <div key={i}>
                <p className="text-sm font-semibold leading-snug text-foreground">
                  {item.menuItem.name}
                  <span className="font-normal text-muted-foreground"> (x{item.quantity})</span>
                </p>
                {item.notes && (
                  <p className="text-xs text-muted-foreground">Topping: {item.notes}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Restaurant bubble (left) ─── */}
      {responseMessage && (
        <div className="flex items-end gap-2 justify-start">
          {/* Avatar */}
          <div className="mb-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#1B6FEB] text-white text-xs font-bold">
            NV
          </div>
          <div className="max-w-[75%] rounded-2xl rounded-bl-md bg-white px-4 py-3 shadow-sm">
            <p className="mb-1 text-[11px] font-bold uppercase tracking-wide text-[#1B6FEB]">
              Phản hồi · {time}
            </p>
            <p className="text-sm leading-relaxed text-foreground">{responseMessage}</p>
          </div>
        </div>
      )}
    </>
  );
}
