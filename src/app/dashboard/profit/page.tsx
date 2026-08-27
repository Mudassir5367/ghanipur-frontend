'use client';

import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardBody } from '@/components/ui/Card';
import { StatCard } from '@/components/ui/StatCard';
import { useProfitLoss } from '@/features/reports/hooks';
import { formatPKR } from '@/lib/utils';
import type { ProfitEntry } from '@/features/reports/api';

const signed = (v = 0) => (v < 0 ? `– ${formatPKR(Math.abs(v))}` : formatPKR(v));

function PeriodRow({ label, entry }: { label: string; entry?: ProfitEntry }) {
  const p = entry?.profitMinor ?? 0;
  return (
    <div className="flex items-center justify-between border-b border-slate-50 py-3 last:border-0">
      <div>
        <p className="font-medium text-slate-800">{label}</p>
        <p className="text-xs text-slate-400">Revenue {formatPKR(entry?.revenueMinor ?? 0)} · Cost {formatPKR(entry?.costMinor ?? 0)}</p>
      </div>
      <span className={`text-lg font-bold ${p < 0 ? 'text-red-600' : 'text-brand-700'}`}>{signed(p)}</span>
    </div>
  );
}

export default function ProfitPage() {
  const { data, isLoading } = useProfitLoss();
  const overall = data?.overall.profitMinor ?? 0;

  return (
    <div className="space-y-6">
      <div>
        <Link href="/dashboard" className="text-sm text-slate-500 hover:text-slate-800">← Dashboard</Link>
        <h1 className="mt-1 text-2xl font-bold text-slate-900">Profit &amp; Loss</h1>
        <p className="text-sm text-slate-500">Across all products — sales revenue minus cost of goods sold.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label={overall < 0 ? 'Overall Loss' : 'Overall Profit'} value={isLoading ? '…' : signed(overall)} tone={overall < 0 ? 'red' : 'green'} />
        <StatCard label="Total Revenue" value={isLoading ? '…' : formatPKR(data?.overall.revenueMinor ?? 0)} tone="blue" />
        <StatCard label="Total Cost" value={isLoading ? '…' : formatPKR(data?.overall.costMinor ?? 0)} tone="amber" />
      </div>

      <Card>
        <CardHeader><CardTitle>Breakdown by period</CardTitle></CardHeader>
        <CardBody>
          {isLoading ? (
            <div className="h-40 animate-pulse rounded-lg bg-slate-100" />
          ) : (
            <div>
              <PeriodRow label="Today" entry={data?.daily} />
              <PeriodRow label="This week (last 7 days)" entry={data?.weekly} />
              <PeriodRow label="This month (last 30 days)" entry={data?.monthly} />
              <PeriodRow label="Overall (all time)" entry={data?.overall} />
            </div>
          )}
          <p className="mt-4 text-xs text-slate-400">
            Profit = sales revenue − cost of goods sold (quantity sold × each product&apos;s purchase cost). Updates live with sales and product costs.
          </p>
        </CardBody>
      </Card>
    </div>
  );
}
