'use client';
import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuthStore } from '@/store/auth.store';
import { useToast } from '@/components/shared/Toast';
import { cn } from '@/lib/utils';

const profileSchema = z.object({
  name:        z.string().min(2, 'Tên tối thiểu 2 ký tự').max(60),
  email:       z.string().email('Email không hợp lệ'),
  newPassword: z
    .string()
    .min(6, 'Mật khẩu tối thiểu 6 ký tự')
    .optional()
    .or(z.literal('')),
  confirmPassword: z.string().optional().or(z.literal('')),
}).refine(
  (d) => !d.newPassword || d.newPassword === d.confirmPassword,
  { message: 'Mật khẩu xác nhận không khớp', path: ['confirmPassword'] },
);
type ProfileForm = z.infer<typeof profileSchema>;

interface Props { open: boolean; onClose: () => void }

export function ProfileSheet({ open, onClose }: Props) {
  const user     = useAuthStore((s) => s.user);
  const setToken = useAuthStore((s) => s.setToken);
  const { toast } = useToast();
  const [showPw, setShowPw] = useState(false);

  const { register, handleSubmit, reset, formState: { errors, isSubmitting, isDirty } } =
    useForm<ProfileForm>({
      resolver: zodResolver(profileSchema),
      defaultValues: { name: user?.name ?? '', email: user?.email ?? '', newPassword: '', confirmPassword: '' },
    });

  // Sync when user changes
  useEffect(() => {
    reset({ name: user?.name ?? '', email: user?.email ?? '', newPassword: '', confirmPassword: '' });
  }, [user, reset]);

  async function onSubmit(data: ProfileForm) {
    // Mock: update Zustand store directly (real implementation calls API)
    await new Promise((r) => setTimeout(r, 500));
    // Re-issue mock token with updated name
    const currentToken = useAuthStore.getState().token;
    if (currentToken) {
      // Patch name in the decoded payload and re-encode
      try {
        const [header, payloadB64] = currentToken.split('.');
        const b64 = payloadB64.replace(/-/g, '+').replace(/_/g, '/');
        const padded = b64 + '=='.slice((b64.length % 4) || 4);
        const bytes = Uint8Array.from(atob(padded), (c) => c.charCodeAt(0));
        const payload = JSON.parse(new TextDecoder().decode(bytes));
        payload.name  = data.name;
        payload.email = data.email;
        const newPayloadJson = JSON.stringify(payload);
        const newBytes = new TextEncoder().encode(newPayloadJson);
        let bin = '';
        newBytes.forEach((b) => { bin += String.fromCharCode(b); });
        const newB64 = btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
        const newToken = `${header}.${newB64}.mock_sig`;
        setToken(newToken);
        document.cookie = `admin_token=${newToken}; path=/; max-age=${8 * 3600}; SameSite=Strict`;
      } catch { /* silently ignore patch error */ }
    }
    toast(data.newPassword ? 'Đã cập nhật hồ sơ và mật khẩu' : 'Đã cập nhật hồ sơ', 'success');
    onClose();
  }

  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent className="flex flex-col">
        <SheetHeader className="px-5 pb-3">
          <SheetTitle className="text-white text-lg font-semibold">Hồ sơ cá nhân</SheetTitle>
          <SheetDescription className="text-white/50 text-sm sr-only">Chỉnh sửa thông tin cá nhân</SheetDescription>
        </SheetHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="flex-1 overflow-y-auto px-5 space-y-4 pb-8">
          {/* Avatar preview */}
          <div className="flex justify-center py-2">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/20 text-primary text-2xl font-bold">
              {user?.name?.charAt(0)?.toUpperCase() ?? 'S'}
            </div>
          </div>

          <Field label="Tên hiển thị" error={errors.name?.message}>
            <Input {...register('name')} placeholder="Nguyễn Văn A" className="pos-input" />
          </Field>

          <Field label="Email" error={errors.email?.message}>
            <Input {...register('email')} type="email" placeholder="staff@restaurant.vn" className="pos-input" />
          </Field>

          <div className="border-t border-white/10 pt-4">
            <p className="text-xs text-white/40 mb-3">Đổi mật khẩu — để trống nếu không muốn đổi</p>

            <div className="space-y-3">
              <Field label="Mật khẩu mới" error={errors.newPassword?.message}>
                <div className="relative">
                  <Input
                    {...register('newPassword')}
                    type={showPw ? 'text' : 'password'}
                    placeholder="••••••••"
                    className="pos-input pr-12"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw((v) => !v)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/40 hover:text-white"
                  >
                    {showPw ? '🙈' : '👁'}
                  </button>
                </div>
              </Field>

              <Field label="Xác nhận mật khẩu mới" error={errors.confirmPassword?.message}>
                <Input
                  {...register('confirmPassword')}
                  type={showPw ? 'text' : 'password'}
                  placeholder="••••••••"
                  className="pos-input"
                />
              </Field>
            </div>
          </div>

          <div className="pt-2">
            <Button
              type="submit"
              disabled={isSubmitting || !isDirty}
              className="w-full h-14 text-base font-semibold bg-pos-brand hover:bg-pos-brand/90"
            >
              {isSubmitting ? (
                <span className="flex items-center gap-2">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Đang lưu…
                </span>
              ) : 'Lưu thay đổi'}
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className={cn('block text-sm font-medium', error ? 'text-red-400' : 'text-white/70')}>{label}</label>
      {children}
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  );
}
