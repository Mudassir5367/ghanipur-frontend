'use client';

import { useAuthStore } from '@/store/auth';
import { useLogout } from '@/features/auth/hooks';
import { Button } from '@/components/ui/Button';

export function AdminLogout() {
  const user = useAuthStore((s) => s.user);
  const logout = useLogout();
  return (
    <div className="flex items-center gap-3">
      <span className="text-sm text-slate-500">{user?.email}</span>
      <Button variant="outline" size="sm" onClick={() => logout.mutate()} loading={logout.isPending}>
        Log out
      </Button>
    </div>
  );
}
