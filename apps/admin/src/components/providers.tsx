'use client';
import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { useState } from 'react';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { ToastProvider } from '@/components/shared/Toast';
import { useAdminBridge } from '@/hooks/use-admin-bridge';
import { MOCK_BRANCH_ID } from '@/mock/seed';

function AdminBridgeMount() {
  useAdminBridge(MOCK_BRANCH_ID);
  return null;
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30_000,
            retry: 1,
            refetchOnWindowFocus: true,
          },
        },
      }),
  );

  return (
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <AuthGuard>
          <AdminBridgeMount />
          {children}
        </AuthGuard>
      </ToastProvider>
      <ReactQueryDevtools initialIsOpen={false} buttonPosition="bottom-left" />
    </QueryClientProvider>
  );
}
