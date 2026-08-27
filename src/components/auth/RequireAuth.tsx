'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth';
import type { Role } from '@/types/api';

/**
 * Client-side route guard for protected layouts. Waits for the auth bootstrap to
 * resolve, then redirects unauthenticated (or wrong-role) users to /login.
 * Backend authorization is the real gate; this is UX only.
 */
export function RequireAuth({ roles, requireShop, children }: { roles?: Role[]; requireShop?: boolean; children: React.ReactNode }) {
  const { status, user } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (status === 'unauthenticated') {
      const here = typeof window !== 'undefined' ? window.location.pathname : '';
      router.replace(here && here !== '/login' ? `/login?redirect=${encodeURIComponent(here)}` : '/login');
    } else if (status === 'authenticated' && user) {
      const home =
        user.role === 'SUPER_ADMIN' ? '/admin'
          : user.role === 'SHOP_ADMIN' ? (user.shopId ? '/dashboard' : '/create-shop')
            : user.role === 'SHOP_STAFF' ? '/dashboard'
              : '/'; // normal user
      if (roles && !roles.includes(user.role)) router.replace(home);
      else if (requireShop && user.role === 'SHOP_ADMIN' && !user.shopId) router.replace('/create-shop');
    }
  }, [status, user, roles, requireShop, router]);

  if (status !== 'authenticated' || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
      </div>
    );
  }
  if (roles && !roles.includes(user.role)) return null;
  return <>{children}</>;
}
