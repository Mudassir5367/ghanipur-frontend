import { RequireAuth } from '@/components/auth/RequireAuth';
import { DashboardShell } from '@/components/layout/DashboardShell';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <RequireAuth roles={['SHOP_ADMIN', 'SHOP_STAFF']} requireShop>
      <DashboardShell>{children}</DashboardShell>
    </RequireAuth>
  );
}
