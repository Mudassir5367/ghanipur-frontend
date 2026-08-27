'use client';

import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardBody } from '@/components/ui/Card';
import { StatCard } from '@/components/ui/StatCard';
import { Input } from '@/components/ui/Input';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { useDaily, useMonthly, useDailyMilk } from '@/features/reports/hooks';
import { formatPKR } from '@/lib/utils';
import type { ProductStat, MilkRow } from '@/features/reports/api';

type Tab = 'daily' | 'monthly' | 'milk';
const today = new Date().toISOString().slice(0, 10);
const thisMonth = new Date().toISOString().slice(0, 7);

export default function ReportsPage() {
  const [tab, setTab] = useState<Tab>('daily');
  const [date, setDate] = useState(today);
  const [month, setMonth] = useState(thisMonth);

  const daily = useDaily(tab === 'daily' ? date : undefined);
  const monthly = useMonthly(tab === 'monthly' ? month : undefined);
  const milk = useDailyMilk(tab === 'milk' ? date : undefined);

  const productCols: Column<ProductStat>[] = [
    { key: 'name', header: 'Product', render: (p) => <span className="font-medium text-slate-800">{p.name}</span> },
    { key: 'qty', header: 'Qty sold', align: 'right', render: (p) => p.qty },
    { key: 'rev', header: 'Revenue', align: 'right', render: (p) => formatPKR(p.revenueMinor) },
  ];

  const milkCols: Column<MilkRow>[] = [
    { key: 'name', header: 'Product', render: (r) => <span className="font-medium text-slate-800">{r.name}</span> },
    { key: 'opening', header: 'Opening', align: 'right', render: (r) => `${r.opening} ${r.unit}` },
    { key: 'in', header: 'New / In', align: 'right', render: (r) => `+${r.stockIn}` },
    { key: 'sold', header: 'Sold', align: 'right', render: (r) => `-${r.sold}` },
    { key: 'wastage', header: 'Wastage', align: 'right', render: (r) => r.wastage ? `-${r.wastage}` : '—' },
    { key: 'closing', header: 'Closing', align: 'right', render: (r) => <span className="font-semibold text-brand-700">{r.closing} {r.unit}</span> },
  ];

  const tabs: { key: Tab; label: string }[] = [
    { key: 'daily', label: 'Daily' },
    { key: 'monthly', label: 'Monthly' },
    { key: 'milk', label: 'Daily Milk' },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-900">Reports</h1>

      <div className="flex flex-wrap items-center gap-3">
        <div className="flex gap-1 rounded-lg border border-slate-200 bg-white p-1">
          {tabs.map((t) => (
            <button key={t.key} onClick={() => setTab(t.key)} className={`rounded-md px-4 py-1.5 text-sm font-medium ${tab === t.key ? 'bg-brand-50 text-brand-700' : 'text-slate-500 hover:text-slate-800'}`}>
              {t.label}
            </button>
          ))}
        </div>
        {tab === 'monthly' ? (
          <Input type="month" value={month} onChange={(e) => setMonth(e.target.value)} className="max-w-[12rem]" />
        ) : (
          <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="max-w-[12rem]" />
        )}
      </div>

      {tab === 'daily' && (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard label="Total Sales" value={formatPKR(daily.data?.sales.totalMinor ?? 0)} tone="green" />
            <StatCard label="Cash" value={formatPKR(daily.data?.sales.cashMinor ?? 0)} tone="blue" />
            <StatCard label="Credit" value={formatPKR(daily.data?.sales.creditMinor ?? 0)} tone="amber" />
            <StatCard label="Payments Received" value={formatPKR(daily.data?.paymentsReceivedMinor ?? 0)} />
            <StatCard label="Outstanding" value={formatPKR(daily.data?.outstandingMinor ?? 0)} tone="red" />
            <StatCard label="Qty Sold" value={String(daily.data?.qtySold ?? 0)} />
            <StatCard label="Wastage" value={String(daily.data?.wastageQty ?? 0)} tone="amber" />
            <StatCard label="Deliveries" value={String(daily.data?.deliveries ?? 0)} />
          </div>
          <Card><CardHeader><CardTitle>Product breakdown</CardTitle></CardHeader><CardBody className="p-0">
            <DataTable columns={productCols} data={daily.data?.products} isLoading={daily.isLoading} rowKey={(p) => p._id} empty="No sales on this day." />
          </CardBody></Card>
        </div>
      )}

      {tab === 'monthly' && (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard label="Revenue" value={formatPKR(monthly.data?.revenueMinor ?? 0)} tone="green" />
            <StatCard label="Cash" value={formatPKR(monthly.data?.sales.cashMinor ?? 0)} tone="blue" />
            <StatCard label="Credit" value={formatPKR(monthly.data?.sales.creditMinor ?? 0)} tone="amber" />
            <StatCard label="Payments Received" value={formatPKR(monthly.data?.paymentsReceivedMinor ?? 0)} />
          </div>
          <Card><CardHeader><CardTitle>Product breakdown</CardTitle></CardHeader><CardBody className="p-0">
            <DataTable columns={productCols} data={monthly.data?.products} isLoading={monthly.isLoading} rowKey={(p) => p._id} empty="No sales this month." />
          </CardBody></Card>
        </div>
      )}

      {tab === 'milk' && (
        <Card>
          <CardHeader><CardTitle>Daily milk management — {milk.data?.date}</CardTitle></CardHeader>
          <CardBody className="p-0">
            <DataTable columns={milkCols} data={milk.data?.rows} isLoading={milk.isLoading} rowKey={(r) => r.productId} empty="No tracked products." />
          </CardBody>
        </Card>
      )}
    </div>
  );
}
