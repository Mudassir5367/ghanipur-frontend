'use client';

import { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardBody } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { DeliveryPaymentPanel } from '@/components/dashboard/payments/DeliveryPaymentPanel';
import { DeliveryDetail } from '@/components/dashboard/deliveries/DeliveryDetail';
import { PaymentStatusBadge, DeliveryStatusBadge } from '@/components/dashboard/deliveries/status';
import { useDeliveries } from '@/features/delivery/hooks';
import { formatPKR } from '@/lib/utils';
import type { Delivery } from '@/features/delivery/api';

type RangePreset = 'ALL' | 'TODAY' | 'YESTERDAY' | 'WEEK' | 'TWO_WEEK' | 'MONTH';
const RANGE_LABELS: [RangePreset, string][] = [
  ['ALL', 'All'], ['TODAY', 'Today'], ['YESTERDAY', 'Yesterday'], ['WEEK', 'Weekly'], ['TWO_WEEK', '2 Weeks'], ['MONTH', 'Monthly'],
];

/** Turn a preset into an ISO from/to range (local-day boundaries). */
function rangeFor(preset: RangePreset): { from?: string; to?: string } {
  const now = new Date();
  const startOfDay = (d: Date) => { const x = new Date(d); x.setHours(0, 0, 0, 0); return x; };
  const endOfDay = (d: Date) => { const x = new Date(d); x.setHours(23, 59, 59, 999); return x; };
  const daysAgo = (n: number) => { const x = new Date(now); x.setDate(now.getDate() - n); return x; };
  switch (preset) {
    case 'TODAY': return { from: startOfDay(now).toISOString(), to: endOfDay(now).toISOString() };
    case 'YESTERDAY': return { from: startOfDay(daysAgo(1)).toISOString(), to: endOfDay(daysAgo(1)).toISOString() };
    case 'WEEK': return { from: startOfDay(daysAgo(6)).toISOString(), to: endOfDay(now).toISOString() };
    case 'TWO_WEEK': return { from: startOfDay(daysAgo(13)).toISOString(), to: endOfDay(now).toISOString() };
    case 'MONTH': return { from: startOfDay(daysAgo(29)).toISOString(), to: endOfDay(now).toISOString() };
    default: return {};
  }
}

export default function PaymentsPage() {
  const [search, setSearch] = useState('');
  const [range, setRange] = useState<RangePreset>('ALL');
  const [page, setPage] = useState(1);
  useEffect(() => { setPage(1); }, [search, range]);
  const { data, isLoading } = useDeliveries({ ...(search ? { search } : {}), ...rangeFor(range), page });
  const [detailId, setDetailId] = useState<string | null>(null);

  const columns: Column<Delivery>[] = [
    { key: 'code', header: 'Delivery #', render: (d) => <span className="font-mono text-xs text-slate-600">{d.code}</span> },
    { key: 'customer', header: 'Customer', render: (d) => d.customerName || 'Walk-in' },
    { key: 'total', header: 'Total', align: 'right', render: (d) => formatPKR(d.grandTotalMinor) },
    { key: 'paid', header: 'Paid', align: 'right', render: (d) => formatPKR(d.paidMinor) },
    { key: 'remaining', header: 'Outstanding', align: 'right', render: (d) => d.remainingMinor > 0 ? <span className="text-red-600">{formatPKR(d.remainingMinor)}</span> : '—' },
    { key: 'pay', header: 'Payment', render: (d) => <PaymentStatusBadge status={d.paymentStatus} /> },
    { key: 'status', header: 'Delivery', render: (d) => <DeliveryStatusBadge status={d.status} /> },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Payments</h1>
        <p className="text-sm text-slate-500">Record payments against a customer&apos;s deliveries. Balances update everywhere instantly.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        <div className="lg:col-span-2"><DeliveryPaymentPanel /></div>
        <div className="lg:col-span-3">
          <Card>
            <CardHeader className="flex items-center justify-between">
              <CardTitle>Deliveries & balances</CardTitle>
            </CardHeader>
            <CardBody className="space-y-3">
              <div className="flex flex-wrap items-center gap-3">
                <Input placeholder="Search # or customer…" className="max-w-xs" value={search} onChange={(e) => setSearch(e.target.value)} />
                <div className="flex flex-wrap gap-1 rounded-lg border border-slate-200 bg-white p-1">
                  {RANGE_LABELS.map(([key, label]) => (
                    <button
                      key={key}
                      onClick={() => setRange(key)}
                      className={`rounded-md px-3 py-1.5 text-sm font-medium ${range === key ? 'bg-brand-50 text-brand-700' : 'text-slate-500 hover:text-slate-800'}`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="-mx-5">
                <DataTable columns={columns} data={data?.deliveries} isLoading={isLoading} rowKey={(d) => d._id} onRowClick={(d) => setDetailId(d._id)} empty="No deliveries yet." pagination={{ meta: data?.meta, onPageChange: setPage }} />
              </div>
            </CardBody>
          </Card>
        </div>
      </div>

      <DeliveryDetail id={detailId} onClose={() => setDetailId(null)} />
    </div>
  );
}
