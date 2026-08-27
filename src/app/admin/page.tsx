'use client';

import Link from 'next/link';
import { StatCard } from '@/components/ui/StatCard';
import { Button } from '@/components/ui/Button';
import { usePlatformOverview } from '@/features/reports/hooks';
import { formatPKR } from '@/lib/utils';

/** Super-admin overview (§29), backed by /reports/platform/overview. */
export default function AdminOverviewPage() {
  const { data, isLoading } = usePlatformOverview();
  const num = (v?: number) => (isLoading ? '…' : String(v ?? 0));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Platform overview</h1>
        <Link href="/admin/shops"><Button variant="outline">Manage shops</Button></Link>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard label="Total Shops" value={num(data?.totalShops)} sublabel="Manage all shops" href="/admin/shops" />
        <StatCard label="Active Shops" value={num(data?.activeShops)} tone="green" sublabel="View active" href="/admin/shops?status=ACTIVE" />
        <StatCard label="Pending Approval" value={num(data?.pendingShops)} tone="amber" sublabel="Review & approve" href="/admin/shops?status=PENDING" />
        <StatCard label="Suspended" value={num(data?.suspendedShops)} tone="red" sublabel="View suspended" href="/admin/shops?status=SUSPENDED" />
        <StatCard label="Total Sales" value={num(data?.totalSales)} tone="blue" />
        <StatCard label="Platform Revenue" value={isLoading ? '…' : formatPKR(data?.totalRevenueMinor ?? 0)} tone="green" />
      </div>
    </div>
  );
}
