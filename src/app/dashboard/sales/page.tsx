'use client';

import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardBody } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { Badge } from '@/components/ui/Badge';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { QuickSale } from '@/components/dashboard/sales/QuickSale';
import { useSales, useReverseSale } from '@/features/sales/hooks';
import { formatPKR } from '@/lib/utils';
import { customerName, type Sale } from '@/types/sales';

export default function SalesPage() {
  const { data, isLoading } = useSales({});
  const reverse = useReverseSale();
  const [toReverse, setToReverse] = useState<Sale | null>(null);

  const columns: Column<Sale>[] = [
    { key: 'code', header: 'Code', render: (s) => <span className="font-mono text-xs text-slate-500">{s.code}</span> },
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
    { key: 'date', header: 'Date', render: (s) => new Date(s.soldAt).toLocaleString() },
    { key: 'status', header: 'Status', render: (s) => <Badge tone={s.status === 'COMPLETED' ? 'green' : 'slate'}>{s.status}</Badge> },
    { key: 'actions', header: '', align: 'right', render: (s) => s.status === 'COMPLETED' ? <Button size="sm" variant="ghost" onClick={() => setToReverse(s)}>Reverse</Button> : null },
  ];

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
            <CardHeader><CardTitle>Recent sales</CardTitle></CardHeader>
            <CardBody className="p-0">
              <DataTable columns={columns} data={data?.sales} isLoading={isLoading} rowKey={(s) => s._id} empty="No sales yet." />
            </CardBody>
          </Card>
        </div>
      </div>

      <ConfirmDialog
        open={!!toReverse}
        title="Reverse sale"
        message={`Reverse ${toReverse?.code}? Stock will be restored and any credit reversed. This is recorded, not deleted.`}
        confirmLabel="Reverse" danger loading={reverse.isPending}
        onClose={() => setToReverse(null)}
        onConfirm={() => toReverse && reverse.mutate(toReverse._id, { onSuccess: () => setToReverse(null) })}
      />
    </div>
  );
}
