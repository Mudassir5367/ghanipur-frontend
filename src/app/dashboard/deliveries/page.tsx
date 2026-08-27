'use client';

import { useState } from 'react';
import { Card, CardBody } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { DeliveryForm } from '@/components/dashboard/deliveries/DeliveryForm';
import { DeliveryDetail } from '@/components/dashboard/deliveries/DeliveryDetail';
import { DeliveryStatusBadge, PaymentStatusBadge } from '@/components/dashboard/deliveries/status';
import { useDeliveries } from '@/features/delivery/hooks';
import { formatPKR } from '@/lib/utils';
import type { Delivery, DeliveryStatus, PaymentStatus } from '@/features/delivery/api';

const STATUS: (DeliveryStatus | 'ALL')[] = ['ALL', 'PENDING', 'CONFIRMED', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED'];
const PAY: (PaymentStatus | 'ALL')[] = ['ALL', 'PAID', 'PARTIALLY_PAID', 'DUE'];

export default function DeliveriesPage() {
  const [status, setStatus] = useState<DeliveryStatus | 'ALL'>('ALL');
  const [payStatus, setPayStatus] = useState<PaymentStatus | 'ALL'>('ALL');
  const [search, setSearch] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [detailId, setDetailId] = useState<string | null>(null);

  const { data, isLoading } = useDeliveries({
    status: status === 'ALL' ? undefined : status,
    paymentStatus: payStatus === 'ALL' ? undefined : payStatus,
    search: search || undefined,
  });

  const columns: Column<Delivery>[] = [
    { key: 'code', header: 'Delivery #', render: (d) => <span className="font-mono text-xs text-slate-600">{d.code}</span> },
    { key: 'customer', header: 'Customer', render: (d) => d.customerName || 'Walk-in' },
    { key: 'date', header: 'Date', render: (d) => new Date(d.createdAt).toLocaleDateString() },
    { key: 'products', header: 'Products', render: (d) => <span className="text-slate-500">{d.lines.map((l) => `${l.name}×${l.quantity}`).join(', ')}</span> },
    { key: 'total', header: 'Total', align: 'right', render: (d) => formatPKR(d.grandTotalMinor) },
    { key: 'paid', header: 'Paid', align: 'right', render: (d) => formatPKR(d.paidMinor) },
    { key: 'remaining', header: 'Remaining', align: 'right', render: (d) => d.remainingMinor > 0 ? <span className="text-red-600">{formatPKR(d.remainingMinor)}</span> : '—' },
    { key: 'pay', header: 'Payment', render: (d) => <PaymentStatusBadge status={d.paymentStatus} /> },
    { key: 'status', header: 'Delivery', render: (d) => <DeliveryStatusBadge status={d.status} /> },
    { key: 'actions', header: '', align: 'right', render: (d) => <Button size="sm" variant="outline" onClick={() => setDetailId(d._id)}>View</Button> },
  ];

  const Pills = <T extends string>({ items, value, onChange }: { items: T[]; value: T; onChange: (v: T) => void }) => (
    <div className="flex flex-wrap gap-1 rounded-lg border border-slate-200 bg-white p-1">
      {items.map((f) => (
        <button key={f} onClick={() => onChange(f)} className={`rounded-md px-3 py-1.5 text-xs font-medium ${value === f ? 'bg-brand-50 text-brand-700' : 'text-slate-500 hover:text-slate-800'}`}>
          {f.replace(/_/g, ' ')}
        </button>
      ))}
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Deliveries</h1>
          <p className="text-sm text-slate-500">Create deliveries with pricing, track payments and confirm to deduct stock.</p>
        </div>
        <Button onClick={() => setFormOpen(true)}>New Delivery</Button>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Pills items={STATUS} value={status} onChange={setStatus} />
        <Pills items={PAY} value={payStatus} onChange={setPayStatus} />
        <Input placeholder="Search # or customer…" className="max-w-xs" value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      <Card><CardBody className="p-0">
        <DataTable columns={columns} data={data?.deliveries} isLoading={isLoading} rowKey={(d) => d._id} onRowClick={(d) => setDetailId(d._id)} empty="No deliveries yet." />
      </CardBody></Card>

      <DeliveryForm open={formOpen} onClose={() => setFormOpen(false)} />
      <DeliveryDetail id={detailId} onClose={() => setDetailId(null)} />
    </div>
  );
}
