'use client';
import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuthStore } from '@/store/auth.store';
import { useOnboardingStore } from '@/store/onboarding.store';
import { getMockMode } from '@booking/shared';

const PUBLIC = new Set(['/login', '/onboarding']);

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router     = useRouter();
  const pathname   = usePathname();
  const isAuth     = useAuthStore((s) => s.isAuthenticated);
  const user       = useAuthStore((s) => s.user);
  const isComplete = useOnboardingStore((s) => s.isComplete);

  // Avoid running guard logic during SSR / first hydration tick
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!mounted) return;
    if (PUBLIC.has(pathname)) return;

    // ── 1. Auth check ────────────────────────────────────────────────────────
    if (!isAuth()) {
      router.replace(`/login?from=${encodeURIComponent(pathname)}&reason=expired`);
      return;
    }

    // ── 2. Onboarding gate — Live mode, admin roles, wizard not finished ─────
    // user can be null briefly on first mount while Zustand rehydrates from
    // localStorage, so we only redirect once user is actually loaded.
    const liveMode = !getMockMode();
    const isAdmin  = user?.role === 'SUPER_ADMIN' || user?.role === 'MANAGER';
    if (liveMode && user && isAdmin && !isComplete) {
      router.replace('/onboarding');
      return;
    }
  }, [mounted, pathname, isAuth, user, isComplete, router]);

  // Periodic re-check every 60 s
  useEffect(() => {
    if (!mounted) return;
    const id = setInterval(() => {
      if (!isAuth()) {
        router.replace(`/login?from=${encodeURIComponent(pathname)}&reason=expired`);
      }
    }, 60_000);
    return () => clearInterval(id);
  }, [mounted, pathname, isAuth, router]);

  return <>{children}</>;
}
