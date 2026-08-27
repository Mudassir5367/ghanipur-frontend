'use client';

import { useEffect, useRef, useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/auth';
import { Toaster } from '@/components/ui/toast';
import type { ApiSuccess, AuthResponse } from '@/types/api';

/**
 * Bootstraps auth on load: the access token isn't persisted (§30), so we attempt
 * a silent refresh using the httpOnly cookie. Non-blocking — public pages render
 * immediately; protected layouts gate on auth `status` via <RequireAuth>.
 */
function AuthBootstrap({ children }: { children: React.ReactNode }) {
  const setAuth = useAuthStore((s) => s.setAuth);
  const setStatus = useAuthStore((s) => s.setStatus);
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    setStatus('loading');
    api
      .post<ApiSuccess<AuthResponse>>('/auth/refresh')
      .then((res) => setAuth(res.data.data.user, res.data.data.accessToken))
      .catch(() => {
        // Don't clobber a session established meanwhile (e.g. the user logged in
        // while this bootstrap refresh was still in flight).
        if (useAuthStore.getState().status !== 'authenticated') setStatus('unauthenticated');
      });
  }, [setAuth, setStatus]);

  return <>{children}</>;
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: { retry: 1, refetchOnWindowFocus: false, staleTime: 30_000 },
        },
      }),
  );

  return (
    <QueryClientProvider client={queryClient}>
      <AuthBootstrap>{children}</AuthBootstrap>
      <Toaster />
    </QueryClientProvider>
  );
}
