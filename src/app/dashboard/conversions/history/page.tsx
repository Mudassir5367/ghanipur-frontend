'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { Card, CardBody } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { useConversions, useConversionSummary } from '@/features/conversion/hooks';
import { OUTPUT_LABEL, type Conversion } from '@/features/conversion/api';
import { periodLabel, periodRange, shiftPeriod, type Period } from '@/features/conversion/periods';
import { formatPKR } from '@/lib/utils';

const PERIODS: [Period, string][] = [['DAILY', 'Daily'], ['WEEKLY', 'Weekly'], ['MONTHLY', 'Monthly']];

const qtyList = (rows: { unitSymbol: string; quantity: number }[]) =>
  rows.length ? rows.map((r) => `${r.quantity} ${r.unitSymbol}`).join(' + ') : '0';

export default function ConversionHistoryPage() {
  const [period, setPeriod] = useState<Period>('DAILY');
  const [anchor, setAnchor] = useState(() => new Date());
  const [page, setPage] = useState(1);

  const range = useMemo(() => periodRange(period, anchor), [period, anchor]);
  const isCurrent = range.end.getTime() >= Date.now() && range.start.getTime() <= Date.now();
  const params = { from: range.from, to: range.to };

  const { data: list, isLoading } = useConversions({ ...params, page });
  const { data: summary } = useConversionSummary(params);

  const choose = (p: Period) => { setPeriod(p); setAnchor(new Date()); setPage(1); };
  const step = (n: number) => { setAnchor((a) => shiftPeriod(period, a, n)); setPage(1); };

  const produced = (kind: string) => qtyList((summary?.produced ?? []).filter((p) => p.outputKind === kind));

  const columns: Column<Conversion>[] = [
    {
      key: 'when', header: period === 'DAILY' ? 'Time' : 'Date', render: (c) => {
        const d = new Date(c.createdAt);
        return period === 'DAILY'
          ? d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          : d.toLocaleString([], { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
      },
    },
    { key: 'milk', header: 'Milk used', render: (c) => <span className="font-medium text-slate-800">{c.sourceQuantity} {c.unitSymbol} <span className="font-normal text-slate-500">{c.sourceName}</span></span> },
    {
      key: 'out', header: 'Output', render: (c) => (
        <span className="flex items-center gap-2">
          <Badge tone={c.outputKind === 'YOGURT' ? 'blue' : 'green'}>{OUTPUT_LABEL[c.outputKind ?? 'OTHER'] ?? c.outputKind}</Badge>
          <span className="font-medium text-brand-700">{c.convertedQuantity} {c.targetUnitSymbol ?? c.unitSymbol}</span>
        </span>
      ),
    },
    { key: 'yield', header: 'Yield', align: 'right', render: (c) => `${Math.round(c.rate * 100)}%` },
    { key: 'unitCost', header: 'Cost price / unit', align: 'right', render: (c) => formatPKR(c.convertedUnitPriceMinor) },
    { key: 'cost', header: 'Total cost', align: 'right', render: (c) => formatPKR(c.totalValueMinor) },
    { key: 'by', header: 'By', render: (c) => <span className="text-slate-500">{c.performedByName ?? '—'}</span> },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Conversion history</h1>
          <p className="text-sm text-slate-500">Milk converted into Sweet Milk and Yogurt, by day, week or month. Costs are for reference only.</p>
        </div>
        <Link href="/dashboard/conversions"><Button variant="outline">New conversion</Button></Link>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="flex gap-1 rounded-lg border border-slate-200 bg-white p-1">
          {PERIODS.map(([p, label]) => (
            <button key={p} onClick={() => choose(p)}
              className={`rounded-md px-3 py-1.5 text-xs font-medium ${period === p ? 'bg-brand-50 text-brand-700' : 'text-slate-500 hover:text-slate-800'}`}>
              {label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-1">
          <Button size="sm" variant="outline" onClick={() => step(-1)} aria-label="Previous period">←</Button>
          <span className="min-w-[11rem] text-center text-sm font-medium text-slate-700">{periodLabel(period, anchor)}</span>
          <Button size="sm" variant="outline" onClick={() => step(1)} disabled={isCurrent} aria-label="Next period">→</Button>
          {!isCurrent && <Button size="sm" variant="outline" onClick={() => choose(period)}>Current</Button>}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {[
          ['Conversions', String(summary?.count ?? 0)],
          ['Milk used', qtyList(summary?.milkUsed ?? [])],
          ['Sweet Milk made', produced('SWEET_MILK')],
          ['Yogurt made', produced('YOGURT')],
          ['Total cost (reference)', formatPKR(summary?.totalCostMinor ?? 0)],
        ].map(([label, value]) => (
          <Card key={label}>
            <CardBody>
              <p className="text-sm text-slate-500">{label}</p>
              <p className="mt-1 text-xl font-bold text-slate-900">{value}</p>
            </CardBody>
          </Card>
        ))}
      </div>

      <Card><CardBody className="p-0">
        <DataTable columns={columns} data={list?.conversions} isLoading={isLoading} rowKey={(c) => c._id}
          empty="No conversions in this period." pagination={{ meta: list?.meta, onPageChange: setPage }} />
      </CardBody></Card>
    </div>
  );
}
