'use client';

import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardBody } from '@/components/ui/Card';
import { DeliveryStatusBadge, PaymentStatusBadge } from './status';
import { DeliveryDetail } from './DeliveryDetail';
import { useCustomerDeliverySummary } from '@/features/delivery/hooks';
import { formatPKR } from '@/lib/utils';

/** Customer's delivery history + outstanding (§10). */
export function CustomerDeliveryCard({ customerId }: { customerId: string }) {
  const { data, isLoading } = useCustomerDeliverySummary(customerId);
  const [detailId, setDetailId] = useState<string | null>(null);

  if (isLoading) return <Card><CardBody className="h-24 animate-pulse bg-slate-50" /></Card>;
  if (!data || data.deliveryCount === 0) return null;

  return (
    <Card>
      <CardHeader><CardTitle>Deliveries</CardTitle></CardHeader>
      <CardBody className="space-y-4">
        <div className="grid grid-cols-3 gap-3 text-sm">
          <div><p className="text-slate-400">Total</p><p className="font-semibold text-slate-800">{formatPKR(data.totalPurchasesMinor)}</p></div>
          <div><p className="text-slate-400">Paid</p><p className="font-semibold text-brand-700">{formatPKR(data.totalPaidMinor)}</p></div>
          <div><p className="text-slate-400">Outstanding</p><p className="font-semibold text-red-600">{formatPKR(data.outstandingMinor)}</p></div>
        </div>
        <div className="divide-y divide-slate-50">
          {data.deliveries.map((d) => (
            <button key={d._id} onClick={() => setDetailId(d._id)} className="flex w-full items-center justify-between py-2 text-left text-sm hover:bg-slate-50">
              <span className="font-mono text-xs text-slate-500">{d.code}</span>
              <span className="flex items-center gap-2">
                <span>{formatPKR(d.grandTotalMinor)}</span>
                <PaymentStatusBadge status={d.paymentStatus} />
                <DeliveryStatusBadge status={d.status} />
              </span>
            </button>
          ))}
        </div>
      </CardBody>
      <DeliveryDetail id={detailId} onClose={() => setDetailId(null)} />
    </Card>
  );
}
