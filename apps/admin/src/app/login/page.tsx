'use client';
import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Eye, EyeOff, Lock, Mail, AlertCircle, ChefHat,
  FlaskConical, Wifi, Rocket, UserPlus, Check,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/store/auth.store';
import { useAuditLogStore } from '@/store/audit-log.store';
import { getMockMode, setMockMode } from '@booking/shared';
import { useOnboardingStore } from '@/store/onboarding.store';

// ── Validation schemas ─────────────────────────────────────────────────────────
const loginSchema = z.object({
  email:    z.string().email('Email không hợp lệ'),
  password: z.string().min(4, 'Mật khẩu tối thiểu 4 ký tự'),
});
type LoginFormValues = z.infer<typeof loginSchema>;

const setupSchema = z.object({
  name:            z.string().min(2, 'Tên tối thiểu 2 ký tự'),
  email:           z.string().email('Email không hợp lệ'),
  password:        z.string().min(6, 'Mật khẩu tối thiểu 6 ký tự'),
  confirmPassword: z.string(),
}).refine((d) => d.password === d.confirmPassword, {
  message: 'Mật khẩu xác nhận không khớp',
  path:    ['confirmPassword'],
});
type SetupFormValues = z.infer<typeof setupSchema>;

// ── localStorage key for local admin account ──────────────────────────────────
const LOCAL_ADMIN_KEY = 'local_admin_account';
interface LocalAdmin { name: string; email: string; passwordHash: string; branchId: string }

function simpleHash(s: string): string {
  let h = 0;
  for (let i = 0; i < s.length; i++) { h = (Math.imul(31, h) + s.charCodeAt(i)) | 0; }
  return String(h >>> 0);
}

function getLocalAdmin(): LocalAdmin | null {
  try { return JSON.parse(localStorage.getItem(LOCAL_ADMIN_KEY) ?? 'null'); }
  catch { return null; }
}

function saveLocalAdmin(admin: LocalAdmin) {
  localStorage.setItem(LOCAL_ADMIN_KEY, JSON.stringify(admin));
}

// ── Lookup staff member from persisted store ──────────────────────────────────
interface StoredStaff {
  id: string; name: string; email: string; role: string;
  pin: string; active: boolean; branchId: string;
}
function getStaffByEmail(email: string): StoredStaff | null {
  try {
    const raw = localStorage.getItem('admin-staff-v2');
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { state?: { members?: StoredStaff[] } };
    const members = parsed?.state?.members ?? [];
    return members.find((m) => m.email === email.toLowerCase() && m.active) ?? null;
  } catch { return null; }
}
function makeToken(payload: Record<string, unknown>): string {
  const toB64 = (obj: unknown) => {
    const bytes = new TextEncoder().encode(JSON.stringify(obj));
    let bin = '';
    bytes.forEach((b) => { bin += String.fromCharCode(b); });
    return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
  };
  return `${toB64({ alg: 'HS256', typ: 'JWT' })}.${toB64(payload)}.local_sig`;
}

// ── Mock accounts ─────────────────────────────────────────────────────────────
const MOCK_ACCOUNTS: Record<string, { sub: string; name: string; role: string }> = {
  'admin@restaurant.vn':    { sub: 'staff-001', name: 'Nguyễn Văn A',  role: 'SUPER_ADMIN' },
  'manager@restaurant.vn':  { sub: 'staff-002', name: 'Trần Thị Bình', role: 'MANAGER'     },
  'kitchen@restaurant.vn':  { sub: 'staff-003', name: 'Lê Văn Cường',  role: 'KITCHEN'     },
  'cashier@restaurant.vn':  { sub: 'staff-004', name: 'Phạm Thị Dung', role: 'CASHIER'     },
  'waiter@restaurant.vn':   { sub: 'staff-005', name: 'Hoàng Văn Em',  role: 'WAITER'      },
};

const DEMO_ACCOUNTS = [
  { email: 'admin@restaurant.vn',   label: 'Super Admin', color: 'text-yellow-400' },
  { email: 'manager@restaurant.vn', label: 'Quản lý',     color: 'text-purple-400' },
  { email: 'cashier@restaurant.vn', label: 'Thu ngân',    color: 'text-green-400'  },
  { email: 'kitchen@restaurant.vn', label: 'Bếp',         color: 'text-amber-400'  },
  { email: 'waiter@restaurant.vn',  label: 'Phục vụ',     color: 'text-blue-400'   },
];

async function mockLogin(email: string): Promise<string> {
  await new Promise((r) => setTimeout(r, 600));
  const account = MOCK_ACCOUNTS[email.toLowerCase()] ?? {
    sub: 'mock-staff-001', name: email.split('@')[0], role: 'WAITER',
  };
  return makeToken({
    sub: account.sub, name: account.name, email,
    role: account.role, branchId: 'mock-branch-001',
    exp: Math.floor(Date.now() / 1000) + 8 * 3600,
  });
}

// ── First-time setup form (Live mode, no backend yet) ─────────────────────────
function SetupForm({ onDone }: { onDone: (email: string, password: string) => void }) {
  const [showPw, setShowPw] = useState(false);
  const [showCp, setShowCp] = useState(false);
  const [done, setDone]     = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<SetupFormValues>({
    resolver: zodResolver(setupSchema),
    defaultValues: { email: 'admin@restaurant.vn' },
  });

  function onSubmit(values: SetupFormValues) {
    saveLocalAdmin({
      name:         values.name,
      email:        values.email.toLowerCase(),
      passwordHash: simpleHash(values.password),
      branchId:     `branch-${Date.now()}`,
    });
    setDone(true);
    setTimeout(() => onDone(values.email, values.password), 1000);
  }

  if (done) {
    return (
      <div className="flex flex-col items-center gap-3 py-6 text-center">
        <div className="h-14 w-14 rounded-full bg-emerald-500/15 flex items-center justify-center">
          <Check className="h-7 w-7 text-emerald-500" />
        </div>
        <p className="text-sm font-semibold text-emerald-400">Tài khoản đã được tạo!</p>
        <p className="text-xs text-muted-foreground">Đang chuyển về trang đăng nhập…</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="w-full max-w-sm space-y-4" noValidate>
      <div className="rounded-2xl border border-primary/20 bg-primary/5 px-4 py-3 mb-2">
        <p className="text-xs text-muted-foreground leading-relaxed">
          Tạo tài khoản <span className="text-primary font-semibold">Super Admin</span> để bắt đầu.
          Tài khoản lưu cục bộ cho đến khi kết nối backend.
        </p>
      </div>

      <div className="space-y-1.5">
        <label className="text-sm font-medium">Họ và tên <span className="text-destructive">*</span></label>
        <Input placeholder="Nguyễn Văn A" {...register('name')} autoFocus />
        {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
      </div>

      <div className="space-y-1.5">
        <label className="text-sm font-medium">Email <span className="text-destructive">*</span></label>
        <div className="relative">
          <Mail className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input type="email" className="pl-10" placeholder="admin@restaurant.vn" {...register('email')} />
        </div>
        {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
      </div>

      <div className="space-y-1.5">
        <label className="text-sm font-medium">Mật khẩu <span className="text-destructive">*</span></label>
        <div className="relative">
          <Lock className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input type={showPw ? 'text' : 'password'} className="pl-10 pr-12"
            placeholder="Tối thiểu 6 ký tự" {...register('password')} />
          <button type="button" onClick={() => setShowPw((v) => !v)}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground">
            {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
        {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
      </div>

      <div className="space-y-1.5">
        <label className="text-sm font-medium">Xác nhận mật khẩu <span className="text-destructive">*</span></label>
        <div className="relative">
          <Lock className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input type={showCp ? 'text' : 'password'} className="pl-10 pr-12"
            placeholder="Nhập lại mật khẩu" {...register('confirmPassword')} />
          <button type="button" onClick={() => setShowCp((v) => !v)}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground">
            {showCp ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
        {errors.confirmPassword && <p className="text-xs text-destructive">{errors.confirmPassword.message}</p>}
      </div>

      <Button type="submit" size="lg" className="w-full mt-2">
        <UserPlus className="h-4 w-4 mr-2" /> Tạo tài khoản Super Admin
      </Button>
    </form>
  );
}

// ── Inner form ────────────────────────────────────────────────────────────────
function LoginForm() {
  const router   = useRouter();
  const params   = useSearchParams();
  const setToken = useAuthStore((s) => s.setToken);
  const isAuth   = useAuthStore((s) => s.isAuthenticated);
  const auditLog = useAuditLogStore((s) => s.log);

  const [showPw, setShowPw]           = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [loading, setLoading]         = useState(false);
  const [, rerender]                  = useState(0);
  const [showSetup, setShowSetup]     = useState(false);
  const [hasLocalAdmin, setHasLocalAdmin] = useState(false);
  const isMock               = typeof window !== 'undefined' ? getMockMode() : false;
  const isOnboardingComplete = useOnboardingStore((s) => s.isComplete);

  useEffect(() => {
    rerender(1);
    setHasLocalAdmin(!!getLocalAdmin());
    // Clear any stale session so "expired" reason doesn't persist after setup
    if (typeof document !== 'undefined') {
      document.cookie = 'admin_token=; path=/; max-age=0';
    }
  }, []);

  const needsSetup = !isMock && !hasLocalAdmin;

  const from   = params.get('from') ?? '/tables';
  const reason = params.get('reason');

  // Auto-clear "expired" reason from URL after showing it once
  useEffect(() => {
    if (reason === 'expired' && typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      url.searchParams.delete('reason');
      window.history.replaceState({}, '', url.toString());
    }
  }, [reason]);

  useEffect(() => {
    if (isAuth()) router.replace(from);
  }, [isAuth, router, from]);

  const { register, handleSubmit, setValue, formState: { errors } } = useForm<LoginFormValues>({
    resolver:      zodResolver(loginSchema),
    defaultValues: { email: 'admin@restaurant.vn', password: '1234' },
  });

  async function onSubmit(values: LoginFormValues) {
    setLoading(true);
    setServerError(null);
    try {
      let token: string;

      if (isMock) {
        token = await mockLogin(values.email);
      } else {
        const localAdmin = getLocalAdmin();
        if (localAdmin && localAdmin.email === values.email.toLowerCase()) {
          // ── Super Admin local account ──────────────────────────────────────
          if (simpleHash(values.password) !== localAdmin.passwordHash) {
            throw new Error('Mật khẩu không đúng');
          }
          await new Promise((r) => setTimeout(r, 400));
          token = makeToken({
            sub: 'local-admin-001', name: localAdmin.name,
            email: localAdmin.email, role: 'SUPER_ADMIN',
            branchId: localAdmin.branchId,
            exp: Math.floor(Date.now() / 1000) + 8 * 3600,
          });
        } else {
          // ── Staff account added by admin (PIN login) ───────────────────────
          const staffMember = getStaffByEmail(values.email.toLowerCase());
          if (staffMember) {
            if (values.password !== staffMember.pin) {
              throw new Error('PIN không đúng');
            }
            await new Promise((r) => setTimeout(r, 400));
            token = makeToken({
              sub:      staffMember.id,
              name:     staffMember.name,
              email:    staffMember.email,
              role:     staffMember.role,
              branchId: staffMember.branchId,
              exp:      Math.floor(Date.now() / 1000) + 8 * 3600,
            });
          } else {
            // ── Real backend API ─────────────────────────────────────────────
            const res = await fetch('/api/v1/auth/login', {
              method:  'POST',
              headers: { 'Content-Type': 'application/json' },
              body:    JSON.stringify(values),
              credentials: 'include',
            });
            if (!res.ok) {
              const data = await res.json().catch(() => ({}));
              throw new Error(data.message ?? 'Đăng nhập thất bại');
            }
            const data = await res.json();
            token = data.accessToken;
          }
        }
      }

      setToken(token);

      const { decodeJwtPayload } = await import('@/lib/utils');
      const payload = decodeJwtPayload<Record<string, unknown>>(token);
      auditLog({
        category: 'AUTH', action: 'LOGIN',
        label:    `Đăng nhập: ${payload?.name ?? values.email}`,
        outcome: 'SUCCESS',
        actorId:   String(payload?.sub ?? 'unknown'),
        actorName: String(payload?.name ?? values.email),
        actorRole: String(payload?.role ?? 'WAITER'),
        meta: { email: values.email, mockMode: isMock },
      });

      document.cookie = `admin_token=${token}; path=/; max-age=${8 * 3600}; SameSite=Strict`;

      const role = String(payload?.role ?? '');
      const defaultFrom = params.get('from') ?? '';
      let dest = defaultFrom || '/tables';
      if (!defaultFrom || defaultFrom === '/tables') {
        if (role === 'KITCHEN') dest = '/kitchen';
        else if (!['SUPER_ADMIN', 'MANAGER', 'CASHIER', 'WAITER'].includes(role)) dest = '/settings';
      }
      router.replace(dest);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Đăng nhập thất bại';
      auditLog({
        category: 'AUTH', action: 'LOGIN_FAILED',
        label:    `Đăng nhập thất bại: ${values.email}`,
        outcome: 'FAILURE', actorId: 'anonymous',
        actorName: values.email, actorRole: 'UNKNOWN',
        meta: { error: msg },
      });
      setServerError(msg);
    } finally {
      setLoading(false);
    }
  }

  const reasonMessages: Record<string, string> = {
    expired:   'Phiên làm việc đã hết hạn. Vui lòng đăng nhập lại.',
    forbidden: 'Bạn không có quyền truy cập trang này.',
  };

  return (
    <div className="flex min-h-screen-safe flex-col items-center justify-center bg-background px-5 pb-safe">

      {/* ── Brand ─────────────────────────────────────────────── */}
      <div className="mb-8 flex flex-col items-center gap-3">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
          <ChefHat className="h-9 w-9 text-primary" strokeWidth={1.5} />
        </div>
        <div className="text-center">
          <h1 className="text-2xl font-bold tracking-tight text-foreground">POS Admin</h1>
          <p className="mt-1 text-sm text-muted-foreground">Hệ thống quản lý nhà hàng</p>
        </div>
      </div>

      {/* ── Mock Mode Toggle ──────────────────────────────────── */}
      <div className={cn(
        'mb-6 w-full max-w-sm rounded-2xl border p-4 transition-colors',
        isMock ? 'border-violet-500/40 bg-violet-500/10' : 'border-border bg-secondary/30',
      )}>
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            {isMock
              ? <FlaskConical className="h-5 w-5 text-violet-400 shrink-0" />
              : <Wifi className="h-5 w-5 text-muted-foreground shrink-0" />
            }
            <div>
              <p className={cn('text-sm font-semibold', isMock ? 'text-violet-300' : 'text-foreground')}>
                {isMock ? 'Chế độ Demo' : 'Chế độ Live'}
              </p>
              <p className="text-xs text-muted-foreground leading-snug mt-0.5">
                {isMock ? 'Dữ liệu giả lập, không cần server' : 'Kết nối API thật, cần backend'}
              </p>
            </div>
          </div>
          <button
            type="button" role="switch" aria-checked={isMock}
            onClick={() => setMockMode(!getMockMode())}
            className={cn(
              'relative inline-flex h-7 w-12 shrink-0 rounded-full p-[3px]',
              'transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400',
              isMock ? 'bg-violet-500' : 'bg-muted',
            )}
          >
            <span className={cn(
              'inline-block h-[22px] w-[22px] rounded-full bg-white shadow-sm transition-transform duration-200',
              isMock ? 'translate-x-5' : 'translate-x-0',
            )} />
          </button>
        </div>

        {isMock && (
          <div className="mt-3 pt-3 border-t border-violet-500/20">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-violet-400 mb-2">
              Chọn tài khoản demo
            </p>
            <div className="grid grid-cols-1 gap-1">
              {DEMO_ACCOUNTS.map(({ email, label, color }) => (
                <button key={email} type="button"
                  onClick={() => setValue('email', email, { shouldValidate: true })}
                  className="flex items-center justify-between rounded-lg px-3 py-2 text-left hover:bg-white/5 transition-colors tap-scale">
                  <span className="text-xs text-muted-foreground">{email}</span>
                  <span className={cn('text-[11px] font-bold ml-2 shrink-0', color)}>{label}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── Live mode: first-time setup ───────────────────────── */}
      {needsSetup ? (
        showSetup ? (
          <SetupForm onDone={(email, password) => {
            setHasLocalAdmin(true);
            setShowSetup(false);
            // Call onSubmit directly with the new credentials — bypass form entirely
            onSubmit({ email, password });
          }} />
        ) : (
          <div className="w-full max-w-sm mb-5 rounded-2xl border border-amber-500/30 bg-amber-500/10 px-4 py-4">
            <div className="flex items-start gap-3">
              <Rocket className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-semibold text-amber-300">Lần đầu sử dụng?</p>
                <p className="text-xs text-muted-foreground leading-relaxed mt-1 mb-3">
                  Chưa có tài khoản nào. Tạo tài khoản{' '}
                  <span className="text-amber-300 font-medium">Super Admin</span>{' '}
                  để bắt đầu quản lý nhà hàng.
                </p>
                <button
                  type="button"
                  onClick={() => setShowSetup(true)}
                  className="w-full flex items-center justify-center gap-2 rounded-xl bg-amber-500 py-2.5 text-sm font-semibold text-black tap-scale"
                >
                  <UserPlus className="h-4 w-4" /> Tạo tài khoản ngay
                </button>
              </div>
            </div>
          </div>
        )
      ) : !isMock && !isOnboardingComplete ? (
        <div className="mb-5 w-full max-w-sm rounded-2xl border border-amber-500/30 bg-amber-500/10 px-4 py-3.5">
          <div className="flex items-start gap-3">
            <Rocket className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
            <p className="text-xs text-muted-foreground leading-relaxed mt-0.5">
              Sau khi đăng nhập với tài khoản{' '}
              <span className="text-amber-300 font-medium">Super Admin</span>,
              hệ thống sẽ hướng dẫn thiết lập nhà hàng.
            </p>
          </div>
        </div>
      ) : null}

      {/* ── Reason banner ─────────────────────────────────────── */}
      {reason && reasonMessages[reason] && (
        <div className="mb-5 flex w-full max-w-sm items-center gap-2.5 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3">
          <AlertCircle className="h-4 w-4 shrink-0 text-destructive" />
          <p className="text-sm text-destructive">{reasonMessages[reason]}</p>
        </div>
      )}

      {/* ── Login form — hidden while setup is open ───────────── */}
      {!showSetup && (
        <form onSubmit={handleSubmit(onSubmit)} className="w-full max-w-sm space-y-4" noValidate>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground" htmlFor="email">Email nhân viên</label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input id="email" type="email" placeholder="staff@restaurant.vn"
                autoComplete="email" inputMode="email" className="pl-10" {...register('email')} />
            </div>
            {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground" htmlFor="password">
              {isMock ? 'Mật khẩu' : 'Mật khẩu / PIN'}
            </label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input id="password" type={showPw ? 'text' : 'password'}
                placeholder={isMock ? 'Bất kỳ (demo)' : 'Mật khẩu hoặc PIN nhân viên'}
                autoComplete="current-password" className="pl-10 pr-12" {...register('password')} />
              <button type="button" onClick={() => setShowPw((v) => !v)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground"
                aria-label={showPw ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}>
                {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
          </div>

          {serverError && (
            <div className="flex items-center gap-2 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3">
              <AlertCircle className="h-4 w-4 shrink-0 text-destructive" />
              <p className="text-sm text-destructive">{serverError}</p>
            </div>
          )}

          <Button type="submit" id="login-submit-btn" size="lg" disabled={loading || needsSetup}            className={cn('w-full mt-2 transition-colors',
              isMock ? 'bg-violet-600 hover:bg-violet-700 focus-visible:ring-violet-500' : '')}>
            {loading ? (
              <span className="flex items-center gap-2">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                {isMock ? 'Đang vào demo…' : 'Đang xác thực…'}
              </span>
            ) : (
              <span className="flex items-center gap-2">
                {isMock && <FlaskConical className="h-4 w-4" />}
                {isMock ? 'Vào Demo' : 'Đăng nhập'}
              </span>
            )}
          </Button>
        </form>
      )}
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
