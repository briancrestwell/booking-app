'use client';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowLeft, CheckCircle } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { CreateBookingSchema, type CreateBookingDto } from '@booking/shared';
import { useCreateBooking } from '@/hooks/use-queries';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

// Demo IDs — in production fetched from the availability API
const DEMO_TABLE_ID = 'demo-table-id';
const DEMO_SLOT_ID  = 'demo-slot-id';

export default function BookingPage() {
  const [success, setSuccess] = useState(false);
  const { mutateAsync: createBooking, isPending, error } = useCreateBooking();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CreateBookingDto>({
    resolver: zodResolver(CreateBookingSchema),
    defaultValues: {
      tableId: DEMO_TABLE_ID,
      slotId: DEMO_SLOT_ID,
      guestCount: 2,
    },
  });

  async function onSubmit(data: CreateBookingDto) {
    await createBooking(data);
    setSuccess(true);
  }

  if (success) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center gap-4 bg-background px-6 text-center">
        <CheckCircle className="h-20 w-20 text-brand-green" />
        <h2 className="text-xl font-bold">Đặt bàn thành công!</h2>
        <p className="text-sm text-muted-foreground">
          Yêu cầu của bạn đã được nhận. Nhân viên sẽ xác nhận trong ít phút.
        </p>
        <Link href="/" className="mt-4">
          <Button className="w-48">Về trang chủ</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-background">
      {/* Header */}
      <header className="flex items-center gap-3 bg-white px-4 py-3 shadow-sm">
        <Link href="/" className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-muted active:scale-90">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="flex-1 text-center text-base font-semibold">Đặt bàn</h1>
        <div className="h-10 w-10" />
      </header>

      <form onSubmit={handleSubmit(onSubmit)} className="p-5 space-y-5">
        {/* Guest count */}
        <div>
          <label className="mb-1.5 block text-sm font-medium text-foreground">
            Số khách <span className="text-destructive">*</span>
          </label>
          <Input
            type="number"
            min={1}
            max={20}
            {...register('guestCount', { valueAsNumber: true })}
            className={errors.guestCount ? 'border-destructive' : ''}
          />
          {errors.guestCount && (
            <p className="mt-1 text-xs text-destructive">{errors.guestCount.message}</p>
          )}
        </div>

        {/* Special requests */}
        <div>
          <label className="mb-1.5 block text-sm font-medium text-foreground">Yêu cầu đặc biệt</label>
          <textarea
            {...register('specialRequests')}
            rows={3}
            placeholder="Ví dụ: Ghế trẻ em, không hút thuốc, bàn gần cửa sổ..."
            className="w-full rounded-xl border border-input bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring resize-none placeholder:text-muted-foreground"
          />
          {errors.specialRequests && (
            <p className="mt-1 text-xs text-destructive">{errors.specialRequests.message}</p>
          )}
        </div>

        {/* Hidden fields shown for transparency */}
        <div className="rounded-xl bg-muted/50 p-4 space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Bàn</span>
            <span className="font-medium">Bàn 4 — Trong nhà</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Khung giờ</span>
            <span className="font-medium">18:00 – 20:00</span>
          </div>
        </div>

        {error && (
          <div className="rounded-xl bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {(error as Error).message}
          </div>
        )}

        <Button type="submit" className="w-full" size="lg" disabled={isPending}>
          {isPending ? 'Đang đặt bàn...' : 'Xác nhận đặt bàn'}
        </Button>
      </form>
    </div>
  );
}
