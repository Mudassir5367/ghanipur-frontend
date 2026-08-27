import Link from 'next/link';
import { RequireAuth } from '@/components/auth/RequireAuth';
import { AdminLogout } from '@/components/admin/AdminLogout';
import { BrandMark } from '@/components/ui/BrandMark';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <RequireAuth roles={['SUPER_ADMIN']}>
      <div className="min-h-screen bg-slate-50">
        <header className="border-b border-slate-200 bg-white">
          <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
            <div className="flex items-center gap-6">
              <Link href="/"><BrandMark suffix="· Platform" textClassName="text-lg font-bold text-brand-700" /></Link>
              <nav className="flex gap-4 text-sm font-medium text-slate-600">
                <Link href="/admin" className="hover:text-slate-900">Overview</Link>
                <Link href="/admin/shops" className="hover:text-slate-900">Shops</Link>
              </nav>
            </div>
            <AdminLogout />
          </div>
        </header>
        <main className="mx-auto max-w-7xl px-6 py-6">{children}</main>
      </div>
    </RequireAuth>
  );
}
