'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Store, UtensilsCrossed, Users, CheckCircle2,
  ArrowRight, ArrowLeft, Sparkles, ChevronRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useOnboardingStore } from '@/store/onboarding.store';
import { useAuthStore } from '@/store/auth.store';
import { getMockMode } from '@booking/shared';

// ── Schemas ────────────────────────────────────────────────────────────────────
const restaurantSchema = z.object({
  name:       z.string().min(2, 'Nhập tên nhà hàng (tối thiểu 2 ký tự)'),
  subtitle:   z.string().optional(),
  phone:      z.string().min(9, 'Số điện thoại không hợp lệ'),
  address:    z.string().min(5, 'Nhập địa chỉ'),
  brandColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Màu không hợp lệ').default('#1B6FEB'),
  openTime:   z.string().default('08:00'),
  closeTime:  z.string().default('22:00'),
});
type RestaurantForm = z.infer<typeof restaurantSchema>;

const menuSchema = z.object({
  categoryName: z.string().min(1, 'Nhập tên danh mục'),
  itemName:     z.string().min(1, 'Nhập tên món'),
  itemPrice:    z.coerce.number().min(1000, 'Nhập giá tối thiểu 1.000đ'),
});
type MenuForm = z.infer<typeof menuSchema>;

const staffSchema = z.object({
  name:     z.string().min(2, 'Nhập tên nhân viên'),
  pin:      z.string().length(4, 'PIN phải đúng 4 số').regex(/^\d+$/, 'Chỉ dùng chữ số'),
  role:     z.enum(['WAITER', 'KITCHEN', 'CASHIER', 'MANAGER']),
});
type StaffForm = z.infer<typeof staffSchema>;

// ── Step indicator ─────────────────────────────────────────────────────────────
const STEPS = [
  { id: 1, label: 'Nhà hàng',  icon: Store },
  { id: 2, label: 'Thực đơn', icon: UtensilsCrossed },
  { id: 3, label: 'Nhân viên', icon: Users },
];

function StepBar({ current }: { current: number }) {
  return (
    <div className="flex items-center justify-center gap-0 mb-8">
      {STEPS.map((s, i) => {
        const done    = current > s.id;
        const active  = current === s.id;
        const Icon    = s.icon;
        return (
          <div key={s.id} className="flex items-center">
            <div className="flex flex-col items-center gap-1.5">
              <div className={cn(
                'h-10 w-10 rounded-full flex items-center justify-center transition-all duration-300',
                done   ? 'bg-emerald-500 text-white'
                       : active ? 'bg-primary text-white ring-4 ring-primary/25'
                       : 'bg-secondary text-muted-foreground',
              )}>
                {done ? <CheckCircle2 className="h-5 w-5" /> : <Icon className="h-5 w-5" />}
              </div>
              <span className={cn(
                'text-[10px] font-medium',
                active ? 'text-primary' : done ? 'text-emerald-500' : 'text-muted-foreground',
              )}>
                {s.label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div className={cn(
                'h-0.5 w-12 mx-1 mb-5 rounded-full transition-colors duration-300',
                current > s.id ? 'bg-emerald-500' : 'bg-secondary',
              )} />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── Input helpers ──────────────────────────────────────────────────────────────
function Field({
  label, error, required = false, children,
}: { label: string; error?: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
        {label} {required && <span className="text-destructive">*</span>}
      </label>
      {children}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}

function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={cn(
        'w-full rounded-xl bg-secondary border border-pos-border px-3.5 py-3',
        'text-sm text-foreground placeholder:text-muted-foreground/50',
        'focus:outline-none focus:ring-2 focus:ring-primary/40',
        props.className,
      )}
    />
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Step 1 — Restaurant info
// ─────────────────────────────────────────────────────────────────────────────
function Step1({ onNext }: { onNext: (data: RestaurantForm) => void }) {
  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<RestaurantForm>({
    resolver: zodResolver(restaurantSchema),
    defaultValues: { brandColor: '#1B6FEB', openTime: '08:00', closeTime: '22:00' },
  });
  const brandColor = watch('brandColor', '#1B6FEB');

  return (
    <form onSubmit={handleSubmit(onNext)} className="space-y-4">
      <Field label="Tên nhà hàng" error={errors.name?.message} required>
        <Input {...register('name')} placeholder="VD: Nhà hàng Phố Xanh" autoFocus />
      </Field>
      <Field label="Slogan / Mô tả ngắn" error={errors.subtitle?.message}>
        <Input {...register('subtitle')} placeholder="VD: Hương vị truyền thống – Phục vụ tận tâm" />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Số điện thoại" error={errors.phone?.message} required>
          <Input {...register('phone')} placeholder="0901 234 567" inputMode="tel" />
        </Field>
        <Field label="Màu thương hiệu" error={errors.brandColor?.message} required>
          <div className="flex items-center gap-2">
            {/* Color swatch — updates RHF via setValue, NOT registered directly */}
            <div
              className="h-11 w-11 shrink-0 rounded-xl border border-pos-border cursor-pointer overflow-hidden relative"
              style={{ backgroundColor: brandColor }}
            >
              <input
                type="color"
                value={brandColor}
                onChange={(e) => setValue('brandColor', e.target.value, { shouldValidate: true })}
                className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
              />
            </div>
            <Input {...register('brandColor')} placeholder="#1B6FEB" className="font-mono text-xs" />
          </div>
        </Field>
      </div>
      <Field label="Địa chỉ" error={errors.address?.message} required>
        <Input {...register('address')} placeholder="123 Nguyễn Trãi, Q.1, TP.HCM" />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Giờ mở cửa" error={errors.openTime?.message}>
          <Input {...register('openTime')} type="time" />
        </Field>
        <Field label="Giờ đóng cửa" error={errors.closeTime?.message}>
          <Input {...register('closeTime')} type="time" />
        </Field>
      </div>
      <button
        type="submit"
        className="mt-2 w-full flex items-center justify-center gap-2 rounded-2xl bg-primary py-3.5 text-sm font-semibold text-white tap-scale"
      >
        Tiếp theo <ArrowRight className="h-4 w-4" />
      </button>
    </form>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Step 2 — First menu item
// ─────────────────────────────────────────────────────────────────────────────
function Step2({ onNext, onBack }: { onNext: (data: MenuForm) => void; onBack: () => void }) {
  const { register, handleSubmit, formState: { errors } } = useForm<MenuForm>({
    resolver: zodResolver(menuSchema),
    defaultValues: { categoryName: 'Món chính' },
  });

  return (
    <form onSubmit={handleSubmit(onNext)} className="space-y-4">
      <div className="rounded-2xl bg-secondary/60 border border-pos-border p-3.5 space-y-1">
        <p className="text-xs text-muted-foreground">
          Chỉ cần thêm <span className="text-foreground font-medium">1 danh mục</span> và{' '}
          <span className="text-foreground font-medium">1 món</span> để hoàn tất setup.
          Bạn có thể bổ sung đầy đủ thực đơn trong{' '}
          <span className="text-primary">Quản lý Menu</span> sau.
        </p>
      </div>

      <Field label="Tên danh mục" error={errors.categoryName?.message} required>
        <Input {...register('categoryName')} placeholder="VD: Món chính, Đồ uống, Tráng miệng…" autoFocus />
      </Field>

      <div className="h-px bg-pos-border" />

      <Field label="Tên món đầu tiên" error={errors.itemName?.message} required>
        <Input {...register('itemName')} placeholder="VD: Cơm tấm sườn bì chả" />
      </Field>
      <Field label="Giá (VNĐ)" error={errors.itemPrice?.message} required>
        <Input
          {...register('itemPrice')}
          type="number"
          inputMode="numeric"
          placeholder="VD: 65000"
          min={1000}
          step={500}
        />
      </Field>

      <div className="flex gap-3 mt-2">
        <button
          type="button"
          onClick={onBack}
          className="flex-1 flex items-center justify-center gap-2 rounded-2xl bg-secondary py-3.5 text-sm font-semibold tap-scale"
        >
          <ArrowLeft className="h-4 w-4" /> Quay lại
        </button>
        <button
          type="submit"
          className="flex-[2] flex items-center justify-center gap-2 rounded-2xl bg-primary py-3.5 text-sm font-semibold text-white tap-scale"
        >
          Tiếp theo <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </form>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Step 3 — First staff (optional)
// ─────────────────────────────────────────────────────────────────────────────
const ROLE_OPTIONS: { value: StaffForm['role']; label: string; color: string }[] = [
  { value: 'WAITER',   label: 'Phục vụ',   color: 'bg-blue-500/15 text-blue-400' },
  { value: 'KITCHEN',  label: 'Bếp',        color: 'bg-orange-500/15 text-orange-400' },
  { value: 'CASHIER',  label: 'Thu ngân',   color: 'bg-violet-500/15 text-violet-400' },
  { value: 'MANAGER',  label: 'Quản lý',   color: 'bg-emerald-500/15 text-emerald-400' },
];

function Step3({
  onFinish, onBack, onSkip,
}: {
  onFinish: (data: StaffForm) => void;
  onBack:   () => void;
  onSkip:   () => void;
}) {
  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<StaffForm>({
    resolver: zodResolver(staffSchema),
    defaultValues: { role: 'WAITER' },
  });
  const selectedRole = watch('role');

  return (
    <form onSubmit={handleSubmit(onFinish)} className="space-y-4">
      <div className="rounded-2xl bg-secondary/60 border border-pos-border p-3.5">
        <p className="text-xs text-muted-foreground">
          Thêm một nhân viên đầu tiên để có thể đăng nhập ngay. Bạn có thể quản lý toàn bộ đội ngũ trong{' '}
          <span className="text-primary">Quản lý nhân viên</span>.
        </p>
      </div>

      <Field label="Tên nhân viên" error={errors.name?.message} required>
        <Input {...register('name')} placeholder="VD: Nguyễn Văn An" autoFocus />
      </Field>

      <Field label="Vị trí" error={errors.role?.message} required>
        <div className="grid grid-cols-2 gap-2">
          {ROLE_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setValue('role', opt.value, { shouldValidate: true })}
              className={cn(
                'rounded-xl px-3 py-2.5 text-sm font-medium text-left transition-all tap-scale',
                selectedRole === opt.value
                  ? opt.color + ' ring-2 ring-current/40'
                  : 'bg-secondary text-muted-foreground',
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </Field>

      <Field label="PIN đăng nhập (4 số)" error={errors.pin?.message} required>
        <Input
          {...register('pin')}
          type="password"
          inputMode="numeric"
          placeholder="••••"
          maxLength={4}
          className="tracking-[0.5em] text-center text-lg"
        />
      </Field>

      <div className="flex gap-3 mt-2">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center justify-center gap-1 rounded-2xl bg-secondary px-4 py-3.5 text-sm font-semibold tap-scale"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={onSkip}
          className="flex-1 rounded-2xl bg-secondary py-3.5 text-sm font-semibold tap-scale"
        >
          Bỏ qua
        </button>
        <button
          type="submit"
          className="flex-[2] flex items-center justify-center gap-2 rounded-2xl bg-primary py-3.5 text-sm font-semibold text-white tap-scale"
        >
          Hoàn tất <Sparkles className="h-4 w-4" />
        </button>
      </div>
    </form>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Done screen
// ─────────────────────────────────────────────────────────────────────────────
function DoneScreen({ onGo }: { onGo: () => void }) {
  return (
    <div className="flex flex-col items-center text-center gap-6 py-6">
      <div className="relative">
        <div className="h-24 w-24 rounded-full bg-emerald-500/15 flex items-center justify-center">
          <CheckCircle2 className="h-12 w-12 text-emerald-500" />
        </div>
        <Sparkles className="absolute -top-1 -right-1 h-6 w-6 text-amber-400 animate-pulse" />
      </div>
      <div>
        <h2 className="text-xl font-bold">Sẵn sàng hoạt động!</h2>
        <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
          Nhà hàng của bạn đã được khởi tạo thành công.
          Hệ thống POS đang chờ đơn hàng đầu tiên.
        </p>
      </div>
      <div className="w-full space-y-3">
        <button
          type="button"
          onClick={onGo}
          className="w-full flex items-center justify-center gap-2 rounded-2xl bg-primary py-4 text-sm font-semibold text-white tap-scale"
        >
          Vào Dashboard <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────────────────────────────────────
export default function OnboardingPage() {
  const router          = useRouter();
  const { completeStep, markComplete } = useOnboardingStore();
  const isComplete      = useOnboardingStore((s) => s.isComplete);
  const user            = useAuthStore((s) => s.user);

  const [step, setStep]     = useState(1);
  const [done, setDone]     = useState(false);

  // If somehow already complete, go to tables
  useEffect(() => {
    if (isComplete) router.replace('/tables');
  }, [isComplete, router]);

  // If not an admin role, just skip onboarding
  useEffect(() => {
    if (user && user.role !== 'SUPER_ADMIN' && user.role !== 'MANAGER') {
      markComplete();
      router.replace('/tables');
    }
  }, [user, markComplete, router]);

  // In mock mode, skip onboarding (data already seeded)
  useEffect(() => {
    if (getMockMode()) {
      markComplete();
      router.replace('/tables');
    }
  }, [markComplete, router]);

  function handleStep1(data: RestaurantForm) {
    // Persist restaurant info to the same localStorage key as the restaurant store
    const existing = JSON.parse(localStorage.getItem('admin-restaurant-info-v1') ?? '{}');
    const updated  = {
      ...existing,
      state: {
        ...(existing.state ?? {}),
        name:        data.name,
        subtitle:    data.subtitle ?? '',
        phone:       data.phone,
        address:     data.address,
        brandColor:  data.brandColor,
        hours: (existing.state?.hours ?? []).length ? existing.state.hours : [
          { day: 'Thứ 2', open: data.openTime, close: data.closeTime, enabled: true },
          { day: 'Thứ 3', open: data.openTime, close: data.closeTime, enabled: true },
          { day: 'Thứ 4', open: data.openTime, close: data.closeTime, enabled: true },
          { day: 'Thứ 5', open: data.openTime, close: data.closeTime, enabled: true },
          { day: 'Thứ 6', open: data.openTime, close: data.closeTime, enabled: true },
          { day: 'Thứ 7', open: data.openTime, close: data.closeTime, enabled: true },
          { day: 'CN',    open: data.openTime, close: data.closeTime, enabled: true },
        ],
      },
    };
    localStorage.setItem('admin-restaurant-info-v1', JSON.stringify(updated));
    completeStep('restaurant');
    setStep(2);
  }

  function handleStep2(_data: MenuForm) {
    // Real API calls would go here once backend is live.
    // For now we just persist a signal that menu was set up.
    completeStep('menu');
    setStep(3);
  }

  function handleStep3(_data: StaffForm) {
    markComplete();
    setDone(true);
  }

  function handleSkipStaff() {
    markComplete();
    setDone(true);
  }

  function handleSkipAll() {
    markComplete();
    router.replace('/tables');
  }

  const TITLES = [
    'Thông tin nhà hàng',
    'Thực đơn đầu tiên',
    'Thêm nhân viên',
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-safe pt-4 pb-2">
        <div>
          <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
            Khởi tạo nhà hàng
          </p>
          {!done && (
            <h1 className="text-lg font-bold mt-0.5">{TITLES[step - 1]}</h1>
          )}
        </div>
        {!done && (
          <button
            type="button"
            onClick={handleSkipAll}
            className="text-xs text-muted-foreground underline underline-offset-2 tap-scale"
          >
            Bỏ qua tất cả
          </button>
        )}
      </div>

      {/* Step bar */}
      {!done && (
        <div className="px-4 pt-2">
          <StepBar current={step} />
        </div>
      )}

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4 pb-12">
        {done ? (
          <DoneScreen onGo={() => { markComplete(); router.replace('/tables'); }} />
        ) : step === 1 ? (
          <Step1 onNext={handleStep1} />
        ) : step === 2 ? (
          <Step2 onNext={handleStep2} onBack={() => setStep(1)} />
        ) : (
          <Step3 onFinish={handleStep3} onBack={() => setStep(2)} onSkip={handleSkipStaff} />
        )}
      </div>
    </div>
  );
}
