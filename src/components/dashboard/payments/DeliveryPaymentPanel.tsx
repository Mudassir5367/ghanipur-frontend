'use client';

import { useEffect, useMemo, useState } from 'react';
import { Card, CardHeader, CardTitle, CardBody } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { PaymentStatusBadge } from '@/components/dashboard/deliveries/status';
import { useAllCustomers } from '@/features/sales/hooks';
import { useSettings } from '@/features/shop/hooks';
import { useCustomerDeliverySummary, useAddDeliveryPayment } from '@/features/delivery/hooks';
import { formatPKR } from '@/lib/utils';

/**
 * The single payment surface for deliveries. Reads the live delivery record (the
 * source of truth) — never a stale stored balance — so it always shows the true
 * Total / Paid / Outstanding and paying updates the same record everywhere.
 */
export function DeliveryPaymentPanel({ presetCustomerId }: { presetCustomerId?: string }) {
  const { data: customerData } = useAllCustomers(); // every customer, not one page
  const { data: settings } = useSettings();
  const [customerId, setCustomerId] = useState(presetCustomerId ?? '');
  const { data: summary, isLoading } = useCustomerDeliverySummary(customerId || null);
  const addPayment = useAddDeliveryPayment();

  const ALL = 'ALL';
  const [deliveryId, setDeliveryId] = useState('');
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState('CASH');

  const methods = settings?.paymentMethods ?? ['CASH'];
  const payable = useMemo(
    () => (summary?.deliveries ?? []).filter((d) => d.status !== 'CANCELLED' && d.remainingMinor > 0),
    [summary],
  );
  const isAll = deliveryId === ALL;
  const selected = useMemo(() => payable.find((d) => d._id === deliveryId), [payable, deliveryId]);
  const totalPayableMinor = useMemo(() => payable.reduce((s, d) => s + d.remainingMinor, 0), [payable]);
  // Max payable = the whole customer's outstanding when "All", else the one delivery's.
  const maxMinor = isAll ? totalPayableMinor : (selected?.remainingMinor ?? 0);
  // A payment can never exceed the outstanding balance (whole customer or one delivery).
  const amountMinor = Math.round((Number(amount) || 0) * 100);
  const exceeds = amountMinor > maxMinor;

  // Default to "All deliveries" when there are several; the single delivery otherwise.
  useEffect(() => {
    if (payable.length === 0) { setDeliveryId(''); return; }
    if (deliveryId === ALL) return;
    if (!payable.some((d) => d._id === deliveryId)) setDeliveryId(payable.length > 1 ? ALL : payable[0]._id);
  }, [payable, deliveryId]);

  const pay = async () => {
    const amt = Number(amount);
    if (!amt || amt <= 0) return;
    if (amountMinor > maxMinor) return; // never pay more than what's owed
    if (isAll) {
      // Spread the amount across the customer's deliveries, oldest first.
      let remainingMinor = Math.round(amt * 100);
      const oldestFirst = [...payable].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
      for (const d of oldestFirst) {
        if (remainingMinor <= 0) break;
        const portion = Math.min(remainingMinor, d.remainingMinor);
        await addPayment.mutateAsync({ id: d._id, payload: { amount: portion / 100, method } });
        remainingMinor -= portion;
      }
      setAmount('');
    } else if (selected) {
      await addPayment.mutateAsync({ id: selected._id, payload: { amount: amt, method } });
      setAmount('');
    }
  };

  return (
    <Card>
      <CardHeader><CardTitle>Receive Payment</CardTitle></CardHeader>
      <CardBody className="space-y-4">
        {!presetCustomerId && (
          <Select
            label="Customer" placeholder="Select customer…" value={customerId} onChange={(e) => { setCustomerId(e.target.value); setDeliveryId(''); }} required
            options={(customerData?.customers ?? []).map((c) => ({ value: c._id, label: c.name }))}
          />
        )}

        {customerId && (
          <>
            {isLoading ? (
              <div className="h-16 animate-pulse rounded-lg bg-slate-100" />
            ) : summary && summary.deliveryCount > 0 ? (
              <div className="grid grid-cols-3 gap-2 rounded-lg bg-slate-50 px-3 py-2 text-center text-sm">
                <div><p className="text-slate-400">Total</p><p className="font-semibold">{formatPKR(summary.totalPurchasesMinor)}</p></div>
                <div><p className="text-slate-400">Paid</p><p className="font-semibold text-brand-700">{formatPKR(summary.totalPaidMinor)}</p></div>
                <div><p className="text-slate-400">Outstanding</p><p className="font-semibold text-red-600">{formatPKR(summary.outstandingMinor)}</p></div>
              </div>
            ) : (
              <p className="rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-500">This customer has no deliveries with a balance.</p>
            )}

            {payable.length > 0 && (
              <>
                <Select
                  label="Delivery" value={deliveryId} onChange={(e) => setDeliveryId(e.target.value)}
                  options={[
                    // Pay the whole customer at once (split across deliveries) when there are several.
                    ...(payable.length > 1 ? [{ value: ALL, label: `All deliveries — Outstanding ${formatPKR(totalPayableMinor)}` }] : []),
                    ...payable.map((d) => ({ value: d._id, label: `${d.code} — Outstanding ${formatPKR(d.remainingMinor)}` })),
                  ]}
                />
                {isAll ? (
                  <div className="rounded-lg border border-slate-200 px-4 py-3 text-sm text-slate-600">
                    Paying across <span className="font-medium text-slate-800">{payable.length} deliveries</span> — the amount is applied to the oldest outstanding delivery first.
                  </div>
                ) : selected ? (
                  <div className="space-y-1 rounded-lg border border-slate-200 px-4 py-3 text-sm">
                    <div className="flex justify-between"><span className="text-slate-500">Delivery total</span><span>{formatPKR(selected.grandTotalMinor)}</span></div>
                    <div className="flex justify-between"><span className="text-slate-500">Paid</span><span className="text-brand-700">{formatPKR(selected.paidMinor)}</span></div>
                    <div className="flex justify-between font-semibold"><span>Outstanding</span><span className="text-red-600">{formatPKR(selected.remainingMinor)}</span></div>
                    <div className="flex justify-between pt-1"><span className="text-slate-500">Status</span><PaymentStatusBadge status={selected.paymentStatus} /></div>
                  </div>
                ) : null}
                <Input label="Amount (Rs)" type="number" step="0.01" min="0" max={maxMinor / 100} value={amount} onChange={(e) => setAmount(e.target.value)} required hint={`Max ${formatPKR(maxMinor)}`} />
                {exceeds && (
                  <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
                    Amount exceeds the outstanding balance of {formatPKR(maxMinor)}.
                  </div>
                )}
                <Select label="Method" value={method} onChange={(e) => setMethod(e.target.value)} options={methods.map((m) => ({ value: m, label: m }))} />
                <Button className="w-full" onClick={pay} loading={addPayment.isPending} disabled={(!isAll && !selected) || !amount || exceeds}>Record payment</Button>
              </>
            )}
          </>
        )}
      </CardBody>
    </Card>
  );
}
