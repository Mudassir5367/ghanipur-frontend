'use client';

import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { login, register, logout, type LoginPayload, type RegisterPayload } from './api';
import { useAuthStore } from '@/store/auth';
import type { AuthUser } from '@/types/api';

/** Where a user lands after authenticating, based on role + whether they have a shop. */
export function landingPath(user: AuthUser, redirect?: string | null): string {
  if (user.role === 'SUPER_ADMIN') return '/admin';
  if (user.role === 'SHOP_ADMIN') return user.shopId ? '/dashboard' : '/create-shop';
  if (user.role === 'SHOP_STAFF') return '/dashboard';
  return redirect || '/shops'; // normal user → storefront (shows their logged-in state)
}

export function useLogin(redirect?: string | null) {
  const setAuth = useAuthStore((s) => s.setAuth);
  const router = useRouter();
  return useMutation({
    mutationFn: (payload: LoginPayload) => login(payload),
    onSuccess: (res) => {
      setAuth(res.user, res.accessToken);
      router.push(landingPath(res.user, redirect));
    },
  });
}

export function useRegister(redirect?: string | null) {
  const setAuth = useAuthStore((s) => s.setAuth);
  const router = useRouter();
  return useMutation({
    mutationFn: (payload: RegisterPayload) => register(payload),
    onSuccess: (res) => {
      setAuth(res.user, res.accessToken);
      router.push(landingPath(res.user, redirect));
    },
  });
}

export function useLogout() {
  const clear = useAuthStore((s) => s.clear);
  const router = useRouter();
  return useMutation({
    mutationFn: () => logout(),
    onSettled: () => {
      clear();
      router.push('/login');
    },
  });
}
