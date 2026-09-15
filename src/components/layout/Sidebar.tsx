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
  { href: '/dashboard/conversions/history', label: 'Conversion History' },
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
        // Only the most specific match is active (so /conversions/history doesn't also light up /conversions).
        const matches = (href: string) => pathname === href || (href !== '/dashboard' && pathname.startsWith(`${href}/`));
        const active = matches(item.href) && !nav.some((o) => o.href.length > item.href.length && matches(o.href));
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
