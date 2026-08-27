'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth';
import { landingPath } from '@/features/auth/hooks';

/**
 * Guard for the auth pages (login / register). Once the session is known to be
 * authenticated, send the user to their home instead of showing the form again —
 * a logged-in user should not be able to sit on /login or /register. While the
 * auth bootstrap is still resolving we show a spinner so an authenticated user
 * never flashes the form.
 */
export function RedirectIfAuthed({ children }: { children: React.ReactNode }) {
  const { status, user } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (status === 'authenticated' && user) {
      // Honour ?redirect=… (read from the URL directly to avoid a useSearchParams
      // Suspense boundary in the layout) so this matches the login form's own
      // post-login target exactly — the two never send the user to different places.
      const redirect = typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('redirect') : null;
      router.replace(landingPath(user, redirect));
    }
  }, [status, user, router]);

  if (status === 'idle' || status === 'loading' || (status === 'authenticated' && user)) {
    return (
      <div className="flex min-h-[16rem] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
      </div>
    );
  }

  return <>{children}</>;
}
