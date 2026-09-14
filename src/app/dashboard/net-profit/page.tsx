'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardBody } from '@/components/ui/Card';
import { StatCard } from '@/components/ui/StatCard';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { useNetProfit } from '@/features/reports/hooks';
import { useAuthStore } from '@/store/auth';
import { formatPKR } from '@/lib/utils';
import type { NetProfitDay } from '@/features/reports/api';

type Preset = 'WEEK' | 'MONTH_30' | 'THIS_MONTH';
const PRESETS: [Preset, string][] = [['WEEK', 'Last 7 days'], ['MONTH_30', 'Last 30 days'], ['THIS_MONTH', 'This month']];

const pad = (n: number) => String(n).padStart(2, '0');
const dayKey = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const signed = (v = 0) => (v < 0 ? `– ${formatPKR(Math.abs(v))}` : formatPKR(v));

function rangeFor(preset: Preset): { from: string; to: string } {
  const now = new Date();
  const back = (n: number) => { const d = new Date(now); d.setDate(d.getDate() - n); return dayKey(d); };
  if (preset === 'WEEK') return { from: back(6), to: dayKey(now) };
  if (preset === 'THIS_MONTH') return { from: dayKey(new Date(now.getFullYear(), now.getMonth(), 1)), to: dayKey(now) };
  return { from: back(29), to: dayKey(now) };
}

export default function NetProfitPage() {
  const [preset, setPreset] = useState<Preset>('WEEK');
  const range = useMemo(() => rangeFor(preset), [preset]);
  const { data, isLoading } = useNetProfit(range.from, range.to);

  const user = useAuthStore((s) => s.user);
  const canViewExpenses = user?.role === 'SUPER_ADMIN' || !!user?.permissions?.includes('EXPENSE_VIEW');
  const today = dayKey(new Date());

  const columns: Column<NetProfitDay>[] = [
    {
      key: 'date', header: 'Date', render: (d) => (
        <span className="font-medium text-slate-800">
          {d.date === today ? 'Today' : new Date(`${d.date}T12:00:00`).toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' })}
        </span>
      ),
    },
    { key: 'profit', header: 'Profit', align: 'right', render: (d) => <span className={d.profitMinor < 0 ? 'text-red-600' : 'text-slate-700'}>{signed(d.profitMinor)}</span> },
    {
      key: 'expenses', header: 'Expenditure', align: 'right', render: (d) => {
        const text = d.expensesMinor > 0 ? `– ${formatPKR(d.expensesMinor)}` : '—';
        return canViewExpenses && d.expenseCount > 0
          ? <Link href={`/dashboard/expenses?date=${d.date}`} className="text-amber-600 hover:underline">{text}</Link>
          : <span className="text-amber-600">{text}</span>;
      },
    },
    {
      key: 'net', header: 'Net Profit', align: 'right',
      render: (d) => <span className={`font-semibold ${d.netProfitMinor < 0 ? 'text-red-600' : 'text-brand-700'}`}>{signed(d.netProfitMinor)}</span>,
    },
  ];

  const totals = data?.totals;

  return (
    <div className="space-y-6">
      <div>
        <Link href="/dashboard" className="text-sm text-slate-500 hover:text-slate-800">← Dashboard</Link>
        <h1 className="mt-1 text-2xl font-bold text-slate-900">Net Profit</h1>
        <p className="text-sm text-slate-500">Each day&apos;s profit minus that day&apos;s expenditure.</p>
      </div>

      <div className="inline-flex gap-1 rounded-lg border border-slate-200 bg-white p-1">
        {PRESETS.map(([p, label]) => (
          <button key={p} onClick={() => setPreset(p)}
            className={`rounded-md px-3 py-1.5 text-xs font-medium ${preset === p ? 'bg-brand-50 text-brand-700' : 'text-slate-500 hover:text-slate-800'}`}>
            {label}
          </button>
        ))}
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Profit" value={isLoading ? '…' : signed(totals?.profitMinor)} tone={(totals?.profitMinor ?? 0) < 0 ? 'red' : 'blue'} />
        <StatCard label="Expenditure" value={isLoading ? '…' : formatPKR(totals?.expensesMinor ?? 0)} tone="amber" />
        <StatCard label={(totals?.netProfitMinor ?? 0) < 0 ? 'Net Loss' : 'Net Profit'} value={isLoading ? '…' : signed(totals?.netProfitMinor)} tone={(totals?.netProfitMinor ?? 0) < 0 ? 'red' : 'green'} />
      </div>

      <Card>
        <CardHeader><CardTitle>Daily breakdown</CardTitle></CardHeader>
        <CardBody className="p-0">
          <DataTable columns={columns} data={data?.days} isLoading={isLoading} rowKey={(d) => d.date} empty="No days in this range." />
        </CardBody>
      </Card>
      <p className="text-xs text-slate-400">
        Profit is the same figure as the Today&apos;s Profit card (sales and deliveries minus cost of goods). Net Profit subtracts that day&apos;s expenditure — rent, bills, employee pay and other expenses.
      </p>
    </div>
  );
}
