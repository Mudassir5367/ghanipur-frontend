'use client';

import Link from 'next/link';
import { useAuthStore } from '@/store/auth';
import { Avatar } from '@/components/ui/Avatar';
import { StatCard } from '@/components/ui/StatCard';
import { ProfitCard } from '@/components/dashboard/ProfitCard';
import { Card, CardHeader, CardTitle, CardBody } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useDashboard } from '@/features/reports/hooks';
import { formatPKR } from '@/lib/utils';

export default function DashboardPage() {
  const user = useAuthStore((s) => s.user);
  const { data, isLoading } = useDashboard('today');

  const money = (v?: number) => (isLoading ? '…' : formatPKR(v ?? 0));
  const num = (v?: number) => (isLoading ? '…' : String(v ?? 0));

  // Quantity sold is reported per unit (L, kg, pcs) — summing across units is meaningless.
  const qtyUnits = data?.qtyByUnit ?? [];
  const qtyValue = isLoading ? '…' : qtyUnits.length ? `${qtyUnits[0].qty} ${qtyUnits[0].unit}` : '0';
  const qtySub = qtyUnits.length > 1 ? qtyUnits.slice(1).map((u) => `${u.qty} ${u.unit}`).join(' · ') : 'Sold today';

  // Remaining stock across all products, per unit (can't sum L + kg + pcs), with its price.
  const stockUnits = data?.stockByUnit ?? [];
  const stockValue = isLoading ? '…' : stockUnits.length ? `${stockUnits[0].qty} ${stockUnits[0].unit}` : '0';
  const otherUnits = stockUnits.length > 1 ? ' · ' + stockUnits.slice(1).map((u) => `${u.qty} ${u.unit}`).join(' · ') : '';
  const stockSub = isLoading ? '…' : `Worth ${money(data?.stockSellValueMinor)}${otherUnits}`;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Avatar name={user?.name} src={user?.avatarUrl} className="h-14 w-14 text-lg shadow-sm" />
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Welcome back, {user?.name?.split(' ')[0]} 👋</h1>
            <p className="text-sm text-slate-500">Here is today&apos;s summary.</p>
          </div>
        </div>
        <Link href="/dashboard/sales"><Button>New Sale</Button></Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Today's Sales value = today's sales + TODAY's outstanding dues only (not previous). */}
        <StatCard label="Today's Sales" value={money((data?.sales.totalMinor ?? 0) + (data?.todayOutstandingMinor ?? 0))} tone="green" sublabel={`${num(data?.sales.count)} sales + ${money(data?.todayOutstandingMinor)} outstanding today`} href="/dashboard/sales" />
        <StatCard label="Cash Sales" value={money(data?.sales.cashMinor)} tone="blue" sublabel="View sales" href="/dashboard/sales" />
        <StatCard label="Credit Sales" value={money(data?.sales.creditMinor)} tone="amber" sublabel="View sales" href="/dashboard/sales" />
        <StatCard label="Outstanding" value={money(data?.outstandingMinor)} tone="red" sublabel="Customers with dues" href="/dashboard/customers" />
        <ProfitCard />
        <StatCard label="Payments Received" value={money((data?.sales.cashMinor ?? 0) + (data?.sales.creditMinor ?? 0))} tone="green" sublabel="Cash + credit sales" href="/dashboard/payments" />
        <StatCard label="Quantity Sold" value={qtyValue} sublabel={qtySub} href="/dashboard/reports" />
        <StatCard label="Remaining Stock" value={stockValue} sublabel={stockSub} tone="blue" href="/dashboard/inventory" />
        <StatCard label="Deliveries" value={num(data?.deliveries)} sublabel="Today" href="/dashboard/deliveries" />
        <StatCard label="Low Stock" value={num(data?.lowStockCount)} tone={(data?.lowStockCount ?? 0) > 0 ? 'amber' : 'green'} sublabel="Products" href="/dashboard/inventory" />
      </div>

      <Card>
        <CardHeader><CardTitle>Top products today</CardTitle></CardHeader>
        <CardBody>
          {isLoading ? (
            <div className="h-24 animate-pulse rounded-lg bg-slate-100" />
          ) : data && data.topProducts.length > 0 ? (
            <div className="divide-y divide-slate-50">
              {data.topProducts.map((p) => (
                <div key={p._id} className="flex items-center justify-between py-2.5 text-sm">
                  <span className="font-medium text-slate-800">{p.name}</span>
                  <span className="text-slate-500">{p.qty} {p.unit ?? ''} sold · <span className="font-medium text-slate-800">{formatPKR(p.revenueMinor)}</span></span>
                </div>
              ))}
            </div>
          ) : (
            <p className="py-6 text-center text-sm text-slate-400">No sales yet today. Record your first sale.</p>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
