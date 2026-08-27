'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { BrandMark } from '@/components/ui/BrandMark';

const nav = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/dashboard/sales', label: 'Sales' },
  { href: '/dashboard/inventory', label: 'Inventory' },
  { href: '/dashboard/conversions', label: 'Conversions' },
  { href: '/dashboard/products', label: 'Products' },
  { href: '/dashboard/categories', label: 'Categories' },
  { href: '/dashboard/customers', label: 'Customers' },
  { href: '/dashboard/payments', label: 'Payments' },
  { href: '/dashboard/deliveries', label: 'Deliveries' },
  { href: '/dashboard/expenses', label: 'Expenses' },
  { href: '/dashboard/reports', label: 'Reports' },
  { href: '/dashboard/settings', label: 'Settings' },
];

export function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  return (
    <nav className="flex h-full flex-col gap-1 p-3">
      <Link href="/" className="px-3 py-4">
        <BrandMark />
      </Link>
      {nav.map((item) => {
        const active = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={cn(
              'rounded-lg px-3 py-2 text-sm font-medium transition-colors',
              active ? 'bg-brand-50 text-brand-700' : 'text-slate-600 hover:bg-slate-100',
            )}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
