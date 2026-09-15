'use client';

import { useMemo, useState } from 'react';
import { Card, CardHeader, CardTitle, CardBody } from '@/components/ui/Card';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { QuickSale } from '@/components/dashboard/sales/QuickSale';
import { SaleEditModal } from '@/components/dashboard/sales/SaleEditModal';
import { useSales } from '@/features/sales/hooks';
import { useAuthStore } from '@/store/auth';
import { formatPKR } from '@/lib/utils';
import { customerName, type Sale } from '@/types/sales';

const pad = (n: number) => String(n).padStart(2, '0');
/** YYYY-MM-DD for the local calendar day (what <input type="date"> uses). */
const dayKey = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const parseDay = (key: string) => {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y!, (m ?? 1) - 1, d ?? 1);
};
const shiftDay = (key: string, days: number) => {
  const d = parseDay(key);
  d.setDate(d.getDate() + days);
  return dayKey(d);
};

export default function SalesPage() {
  const today = dayKey(new Date());
  const [day, setDay] = useState(today);
  const [page, setPage] = useState(1);
  const [editing, setEditing] = useState<Sale | null>(null);

  // Recent sales are shown one day at a time (local day boundaries).
  const range = useMemo(() => {
    const start = parseDay(day);
    const end = new Date(start);
    end.setHours(23, 59, 59, 999);
    return { from: start.toISOString(), to: end.toISOString() };
  }, [day]);
  const { data, isLoading } = useSales({ page, ...range });

  // Correcting a confirmed sale needs the same authority as reversing one.
  const user = useAuthStore((s) => s.user);
  const canEdit = user?.role === 'SUPER_ADMIN' || !!user?.permissions?.includes('SALE_REVERSE');

  const goTo = (next: string) => { setDay(next > today ? today : next); setPage(1); };

  const columns: Column<Sale>[] = [
    {
      key: 'customer', header: 'Customer', render: (s) => {
        const cust = typeof s.customerId === 'object' && s.customerId ? s.customerId : null;
        const phone = cust?.phone || s.customerPhone;
        return (
          <div>
            <div className="text-slate-800">{customerName(s.customerId)}</div>
            {phone && <div className="text-xs text-slate-400">{phone}</div>}
          </div>
        );
      },
    },
    {
      key: 'items', header: 'Products', render: (s) =>
        s.items && s.items.length > 0
          ? <span className="text-slate-700">{s.items.map((it) => it.name).join(', ')}</span>
          : <span className="text-slate-300">—</span>,
    },
    { key: 'type', header: 'Type', render: (s) => <Badge tone={s.type === 'CASH' ? 'green' : 'amber'}>{s.type === 'CASH' ? 'Cash' : 'Credit'}</Badge> },
    { key: 'total', header: 'Total', align: 'right', render: (s) => formatPKR(s.totalMinor) },
    { key: 'due', header: 'Due', align: 'right', render: (s) => s.dueMinor > 0 ? <span className="text-red-600">{formatPKR(s.dueMinor)}</span> : '—' },
    {
      key: 'date', header: 'Time', render: (s) => (
        <div>
          <div>{new Date(s.soldAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
          {s.editedAt && <div className="text-[10px] font-medium text-slate-400">edited</div>}
        </div>
      ),
    },
    { key: 'status', header: 'Status', render: (s) => <Badge tone={s.status === 'COMPLETED' ? 'green' : 'slate'}>{s.status}</Badge> },
    ...(canEdit ? [{
      key: 'actions', header: '', align: 'right' as const, render: (s: Sale) =>
        s.status === 'COMPLETED' ? <Button size="sm" variant="outline" onClick={() => setEditing(s)}>Edit</Button> : null,
    }] : []),
  ];

  const total = data?.meta?.total ?? 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Sales</h1>
        <p className="text-sm text-slate-500">Record cash and credit sales.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        <div className="lg:col-span-2"><QuickSale /></div>
        <div className="lg:col-span-3">
          <Card>
            <CardHeader>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <CardTitle>Recent sales</CardTitle>
                  <p className="text-xs text-slate-500">
                    {day === today ? 'Today' : parseDay(day).toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
                    {' · '}{total} {total === 1 ? 'sale' : 'sales'}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  <Button size="sm" variant="outline" onClick={() => goTo(shiftDay(day, -1))} aria-label="Previous day">←</Button>
                  <input
                    type="date" value={day} max={today}
                    onChange={(e) => e.target.value && goTo(e.target.value)}
                    className="h-8 rounded-lg border border-slate-300 px-2 text-sm focus:border-brand-500 focus:outline-none"
                  />
                  <Button size="sm" variant="outline" onClick={() => goTo(shiftDay(day, 1))} disabled={day >= today} aria-label="Next day">→</Button>
                  {day !== today && <Button size="sm" variant="outline" onClick={() => goTo(today)}>Today</Button>}
                </div>
              </div>
            </CardHeader>
            <CardBody className="p-0">
              <DataTable columns={columns} data={data?.sales} isLoading={isLoading} rowKey={(s) => s._id}
                empty={day === today ? 'No sales yet today.' : 'No sales on this day.'}
                pagination={{ meta: data?.meta, onPageChange: setPage }} />
            </CardBody>
          </Card>
        </div>
      </div>

      <SaleEditModal sale={editing} onClose={() => setEditing(null)} />
    </div>
  );
}
