'use client';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { MobileAppLayout } from '@/components/layout/MobileAppLayout';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useRestaurantStore, type OpeningHour } from '@/store/restaurant.store';
import { useToast } from '@/components/shared/Toast';
import { useAuditLog } from '@/hooks/use-audit-log';
import { cn } from '@/lib/utils';
import { Clock, RotateCcw, Check, Store } from 'lucide-react';

// ── Validation schema ─────────────────────────────────────────────────────────
const Schema = z.object({
  name:         z.string().min(1, 'Bắt buộc'),
  subtitle:     z.string(),
  description:  z.string(),
  phone:        z.string(),
  address:      z.string(),
  logoUrl:      z.string().url('URL không hợp lệ').optional().or(z.literal('')),
  coverUrl:     z.string().url('URL không hợp lệ').optional().or(z.literal('')),
  brandColor:   z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Màu hex không hợp lệ'),
  heroGradient: z.string(),
});
type FormValues = z.infer<typeof Schema>;

// ── Gradient presets ──────────────────────────────────────────────────────────
const GRADIENT_PRESETS = [
  { label: 'Hổ phách', value: 'from-amber-900 via-amber-700 to-amber-500' },
  { label: 'Lửa',      value: 'from-red-900 via-red-700 to-orange-500'    },
  { label: 'Rừng',     value: 'from-green-900 via-green-700 to-emerald-500'},
  { label: 'Đại dương',value: 'from-blue-900 via-blue-700 to-cyan-500'    },
  { label: 'Hoàng hôn',value: 'from-purple-900 via-pink-700 to-rose-500'  },
  { label: 'Đêm',      value: 'from-gray-900 via-gray-800 to-gray-700'    },
];

export default function RestaurantPage() {
  const { info, update, updateHour, reset } = useRestaurantStore();
  const { toast } = useToast();
  const { log }   = useAuditLog();
  const [hoursOpen, setHoursOpen] = useState(false);
  const [saved, setSaved]         = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isDirty },
  } = useForm<FormValues>({
    resolver: zodResolver(Schema),
    defaultValues: {
      name:         info.name,
      subtitle:     info.subtitle,
      description:  info.description,
      phone:        info.phone,
      address:      info.address,
      logoUrl:      info.logoUrl,
      coverUrl:     info.coverUrl,
      brandColor:   info.brandColor,
      heroGradient: info.heroGradient,
    },
  });

  const watchedValues = watch();
  const brandHex      = watchedValues.brandColor || '#1B6FEB';

  function onSubmit(data: FormValues) {
    update(data);
    log({
      category: 'RESTAURANT', action: 'INFO_UPDATED',
      label:    `Cập nhật thông tin nhà hàng: ${data.name}`,
      outcome:  'SUCCESS', targetType: 'Restaurant',
      meta:     { name: data.name, subtitle: data.subtitle },
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
    toast('Đã lưu thông tin nhà hàng', 'success');
  }

  function handleReset() {
    reset();
    log({
      category: 'RESTAURANT', action: 'INFO_RESET',
      label:    'Khôi phục thông tin nhà hàng về mặc định',
      outcome:  'SUCCESS', targetType: 'Restaurant',
    });
    toast('Đã khôi phục mặc định', 'info');
    window.location.reload();
  }

  // ── Fixed footer (save button) ──────────────────────────────────────────────
  const footer = (
    <form id="restaurant-form" onSubmit={handleSubmit(onSubmit)}>
      {/* hidden — actual form is below; this footer just submits it */}
    </form>
  );

  return (
    <MobileAppLayout
      title="Thông tin nhà hàng"
      subheader={
        /* Fixed save bar — always visible, never scrolls */
        <div className="flex items-center gap-3">
          <Button
            type="submit"
            form="restaurant-form"
            disabled={!isDirty && !saved}
            className={cn(
              'flex-1 h-11 text-sm font-semibold transition-all',
              saved
                ? 'bg-pos-green hover:bg-pos-green/90'
                : 'bg-pos-brand hover:bg-pos-brand/90',
            )}
          >
            {saved
              ? <span className="flex items-center gap-2"><Check className="h-4 w-4" /> Đã lưu!</span>
              : <span className="flex items-center gap-2"><Store className="h-4 w-4" /> Lưu thông tin</span>
            }
          </Button>
          <button
            type="button"
            onClick={handleReset}
            title="Khôi phục mặc định"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/8 border border-white/10 text-white/40 hover:text-white/70 tap-scale transition-colors"
          >
            <RotateCcw className="h-4 w-4" />
          </button>
        </div>
      }
    >
      <form
        id="restaurant-form"
        onSubmit={handleSubmit(onSubmit)}
        className="px-4 pt-4 pb-8 space-y-5"
      >
        {/* ── Live hero preview ──────────────────────────────────────────── */}
        <section>
          <p className="text-[10px] font-bold uppercase tracking-wider text-pos-brand mb-2">
            Xem trước — App khách
          </p>
          <div
            className={cn(
              'relative h-36 w-full overflow-hidden rounded-2xl',
              `bg-gradient-to-br ${watchedValues.heroGradient || info.heroGradient}`,
            )}
            /* brandColor applied as CSS variable so sub-elements can use it */
            style={{ '--brand': brandHex } as React.CSSProperties}
          >
            {watchedValues.coverUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={watchedValues.coverUrl}
                alt="Cover"
                className="absolute inset-0 h-full w-full object-cover"
                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
              />
            )}
            {/* Pattern overlay */}
            <div
              className="absolute inset-0 opacity-20"
              style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")" }}
            />
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-1.5">
              {/* Brand color dot indicator */}
              <div
                className="w-3 h-3 rounded-full shadow-lg ring-2 ring-white/30 mb-1"
                style={{ background: brandHex }}
              />
              <span className="text-xl font-extrabold tracking-widest text-white drop-shadow-lg text-center px-4">
                {watchedValues.name || '—'}
              </span>
              <span className="text-[11px] font-medium tracking-[0.2em] text-white/80 uppercase">
                {watchedValues.subtitle || '—'}
              </span>
              {/* Brand color swatch bar at bottom */}
              <div
                className="absolute bottom-0 left-0 right-0 h-1"
                style={{ background: brandHex }}
              />
            </div>
          </div>
        </section>

        {/* ── Basic info ────────────────────────────────────────────────── */}
        <Section title="Thông tin cơ bản">
          <Field label="Tên nhà hàng" required error={errors.name?.message}>
            <Input {...register('name')} placeholder="BÁNH TRÁNG NHÍM" className="pos-input" />
          </Field>
          <Field label="Phụ đề (địa chỉ ngắn)" error={errors.subtitle?.message}>
            <Input {...register('subtitle')} placeholder="Chùa Láng — Hà Nội" className="pos-input" />
          </Field>
          <Field label="Mô tả ngắn" error={errors.description?.message}>
            <textarea
              {...register('description')}
              rows={2}
              placeholder="Thiên đường bánh tráng đặc trưng Hà Nội"
              className="w-full resize-none rounded-xl px-3 py-3 text-sm bg-white/10 border border-white/10 text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-pos-brand"
            />
          </Field>
          <Field label="Số điện thoại" error={errors.phone?.message}>
            <Input {...register('phone')} placeholder="0912 345 678" className="pos-input" type="tel" />
          </Field>
          <Field label="Địa chỉ đầy đủ" error={errors.address?.message}>
            <Input {...register('address')} placeholder="123 Chùa Láng, Đống Đa, Hà Nội" className="pos-input" />
          </Field>
        </Section>

        {/* ── Branding ──────────────────────────────────────────────────── */}
        <Section title="Hình ảnh & Thương hiệu">
          <Field label="URL ảnh bìa (hero)" error={errors.coverUrl?.message}>
            <Input {...register('coverUrl')} placeholder="https://... (để trống = dùng gradient)" className="pos-input" type="url" />
          </Field>
          <Field label="URL logo" error={errors.logoUrl?.message}>
            <Input {...register('logoUrl')} placeholder="https://..." className="pos-input" type="url" />
          </Field>

          {/* Gradient picker */}
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-white/70">Màu nền Hero</label>
            <div className="grid grid-cols-3 gap-2">
              {GRADIENT_PRESETS.map((p) => (
                <button
                  key={p.value}
                  type="button"
                  onClick={() => setValue('heroGradient', p.value, { shouldDirty: true })}
                  className={cn(
                    'relative h-14 rounded-xl overflow-hidden border-2 transition-all tap-scale',
                    `bg-gradient-to-br ${p.value}`,
                    watchedValues.heroGradient === p.value
                      ? 'border-white scale-[1.04]'
                      : 'border-transparent',
                  )}
                >
                  {watchedValues.heroGradient === p.value && (
                    <Check className="absolute top-1 right-1 h-3.5 w-3.5 text-white drop-shadow" />
                  )}
                  <span className="absolute bottom-1 left-0 right-0 text-center text-[9px] font-bold text-white/90">
                    {p.label}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Brand color — shows live usage example */}
          <Field label="Màu chủ đạo" error={errors.brandColor?.message}>
            <div className="flex items-center gap-3">
              <input
                type="color"
                {...register('brandColor')}
                className="h-10 w-14 cursor-pointer rounded-xl border-0 bg-transparent p-0"
              />
              <Input
                {...register('brandColor')}
                placeholder="#1B6FEB"
                className="pos-input flex-1 font-mono"
                maxLength={7}
              />
            </div>
            {/* Live preview of where brandColor is used in web app */}
            <div className="mt-2 rounded-xl overflow-hidden border border-white/10">
              <div className="px-3 py-2 bg-white/5 text-[10px] text-white/40 font-medium uppercase tracking-wider">
                Xem trước màu chủ đạo
              </div>
              <div className="px-3 py-3 flex items-center gap-3 bg-black/20">
                <div className="w-8 h-8 rounded-full flex-shrink-0" style={{ background: brandHex }} />
                <div className="flex-1 space-y-1.5">
                  <div className="h-2 rounded-full w-3/4" style={{ background: brandHex }} />
                  <div className="h-2 rounded-full w-1/2 opacity-50" style={{ background: brandHex }} />
                </div>
                <div
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold text-white"
                  style={{ background: brandHex }}
                >
                  Đặt bàn
                </div>
              </div>
              <div className="px-3 py-2 bg-white/5 text-[10px] text-white/40">
                Dùng cho nút CTA, icon, badge và link trên App khách
              </div>
            </div>
          </Field>
        </Section>

        {/* ── Opening hours ──────────────────────────────────────────────── */}
        <Section title="Giờ mở cửa">
          <button
            type="button"
            onClick={() => setHoursOpen((v) => !v)}
            className="w-full flex items-center justify-between px-4 py-3 rounded-xl bg-white/10 border border-white/10 text-sm text-white tap-scale"
          >
            <span className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-white/50" />
              {hoursOpen ? 'Thu gọn' : 'Chỉnh sửa giờ mở cửa'}
            </span>
            <svg
              className={cn('h-4 w-4 text-white/50 transition-transform duration-200', hoursOpen && 'rotate-180')}
              fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {hoursOpen && (
            <div className="rounded-2xl bg-white/5 border border-white/10 overflow-hidden divide-y divide-white/5 mt-2">
              {info.hours.map((h, i) => (
                <HourRow key={h.day} hour={h} index={i} onUpdate={updateHour} />
              ))}
            </div>
          )}
        </Section>
      </form>
    </MobileAppLayout>
  );
}

// ── Opening hour row ──────────────────────────────────────────────────────────
// Layout: [Day label fixed-w] [flex-1 spacer] [time controls right-aligned] [open/closed badge]
function HourRow({
  hour, index, onUpdate,
}: {
  hour:     OpeningHour;
  index:    number;
  onUpdate: (i: number, h: Partial<OpeningHour>) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-3 px-4 py-3">
      {/* Day label — fixed width so inputs align perfectly */}
      <span className="w-[4.5rem] shrink-0 text-sm font-medium text-white/80">
        {hour.day}
      </span>

      {/* Time controls OR closed label — pushed to the right */}
      {hour.closed ? (
        <span className="flex-1 text-xs text-white/30 italic">Đóng cửa</span>
      ) : (
        <div className="flex flex-1 items-center justify-end gap-2">
          <input
            type="time"
            value={hour.open}
            onChange={(e) => onUpdate(index, { open: e.target.value })}
            className="w-[90px] rounded-lg bg-white/10 border border-white/10 px-2 py-1.5 text-sm text-white text-center focus:outline-none focus:ring-1 focus:ring-pos-brand"
          />
          <span className="text-white/30 text-sm select-none">–</span>
          <input
            type="time"
            value={hour.close}
            onChange={(e) => onUpdate(index, { close: e.target.value })}
            className="w-[90px] rounded-lg bg-white/10 border border-white/10 px-2 py-1.5 text-sm text-white text-center focus:outline-none focus:ring-1 focus:ring-pos-brand"
          />
        </div>
      )}

      {/* Open / Closed toggle badge */}
      <button
        type="button"
        onClick={() => onUpdate(index, { closed: !hour.closed })}
        className={cn(
          'shrink-0 text-[10px] font-bold px-2.5 py-1 rounded-full border transition-colors',
          hour.closed
            ? 'bg-pos-red/15 text-pos-red border-pos-red/30'
            : 'bg-white/10 text-white/40 border-white/10 hover:border-white/20',
        )}
      >
        {hour.closed ? 'Đóng' : 'Mở'}
      </button>
    </div>
  );
}

// ── Reusable components ────────────────────────────────────────────────────────
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3">
      <p className="text-[10px] font-bold uppercase tracking-wider text-pos-brand">{title}</p>
      <div className="rounded-2xl bg-pos-surface p-4 space-y-4">
        {children}
      </div>
    </section>
  );
}

function Field({ label, required, error, children }: {
  label: string; required?: boolean; error?: string; children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label className="block text-sm font-medium text-white/70">
        {label}{required && <span className="text-red-400 ml-0.5"> *</span>}
      </label>
      {children}
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  );
}
