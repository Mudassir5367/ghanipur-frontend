'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { BrandMark } from '@/components/ui/BrandMark';
import { useAuthStore } from '@/store/auth';
import { useLogout } from '@/features/auth/hooks';

export function StoreHeader() {
  const { status, user } = useAuthStore();
  const logout = useLogout();
  const authed = status === 'authenticated' && user;

  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link href="/"><BrandMark /></Link>
        <nav className="flex items-center gap-3">
          <Link href="/shops" className="text-sm font-medium text-slate-600 hover:text-slate-900">Shops</Link>
          {authed ? (
            <>
              {(user.role === 'SHOP_ADMIN' || user.role === 'SHOP_STAFF') && (
                <Link href="/dashboard" className="text-sm font-medium text-slate-600 hover:text-slate-900">Dashboard</Link>
              )}
              {user.role === 'SUPER_ADMIN' && (
                <Link href="/admin" className="text-sm font-medium text-slate-600 hover:text-slate-900">Admin</Link>
              )}
              <span className="hidden text-sm text-slate-500 sm:inline">Hi, {user.name.split(' ')[0]}</span>
              <Button variant="outline" size="sm" onClick={() => logout.mutate()} loading={logout.isPending}>Log out</Button>
            </>
          ) : (
            <>
              <Link href="/login"><Button variant="outline" size="sm">Log in</Button></Link>
              <Link href="/register"><Button size="sm">Sign up</Button></Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
