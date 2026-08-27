'use client';

import { useAuthStore } from '@/store/auth';
import { useLogout } from '@/features/auth/hooks';
import { Button } from '@/components/ui/Button';

export function Topbar({ onMenu }: { onMenu?: () => void }) {
  const user = useAuthStore((s) => s.user);
  const logout = useLogout();

  return (
    <header className="flex h-16 items-center justify-between border-b border-slate-200 bg-white px-4 sm:px-6">
      <button
        onClick={onMenu}
        className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 lg:hidden"
        aria-label="Open menu"
      >
        <span className="block h-0.5 w-5 bg-current" />
        <span className="mt-1 block h-0.5 w-5 bg-current" />
        <span className="mt-1 block h-0.5 w-5 bg-current" />
      </button>
      <div className="ml-auto flex items-center gap-4">
        <div className="text-right">
          <p className="text-sm font-medium text-slate-900">{user?.name}</p>
          <p className="text-xs text-slate-500">{user?.email}</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => logout.mutate()} loading={logout.isPending}>
          Log out
        </Button>
      </div>
    </header>
  );
}
