'use client';

import { useMemo, useState, type FormEvent } from 'react';
import { Card, CardHeader, CardTitle, CardBody } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { useCustomers, useRecordPayment } from '@/features/sales/hooks';
import { useSettings } from '@/features/shop/hooks';
import { formatPKR } from '@/lib/utils';

export function QuickPayment({ presetCustomerId }: { presetCustomerId?: string }) {
  const { data: customerData } = useCustomers({});
  const { data: settings } = useSettings();
  const record = useRecordPayment();
  const [customerId, setCustomerId] = useState(presetCustomerId ?? '');
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState('');
  const [reference, setReference] = useState('');

  const customers = customerData?.customers ?? [];
  const selected = useMemo(() => customers.find((c) => c._id === customerId), [customers, customerId]);
  const methods = settings?.paymentMethods ?? ['CASH'];
  // A payment can never exceed what the customer owes.
  const outstandingMinor = selected ? Math.max(0, selected.currentBalanceMinor) : 0;
  const amountMinor = Math.round((Number(amount) || 0) * 100);
  const exceeds = !!selected && amountMinor > outstandingMinor;

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (exceeds) return;
    record.mutate(
      { customerId, amount: Number(amount), method: method || methods[0], reference: reference || undefined },
      { onSuccess: () => { setAmount(''); setReference(''); } },
    );
  };

  return (
    <Card>
      <CardHeader><CardTitle>Receive Payment</CardTitle></CardHeader>
      <CardBody>
        <form onSubmit={onSubmit} className="space-y-4">
          {!presetCustomerId && (
            <Select
              label="Customer" placeholder="Select customer…" value={customerId} onChange={(e) => setCustomerId(e.target.value)} required
              options={customers.map((c) => ({ value: c._id, label: `${c.name}${c.currentBalanceMinor > 0 ? ` — owes ${formatPKR(c.currentBalanceMinor)}` : ''}` }))}
            />
          )}
          {selected && (
            <div className="rounded-lg bg-amber-50 px-4 py-2 text-sm text-amber-800">
              Outstanding: <span className="font-semibold">{formatPKR(Math.max(0, selected.currentBalanceMinor))}</span>
            </div>
          )}
          <Input label="Amount (Rs)" type="number" step="0.01" min="0" max={selected ? outstandingMinor / 100 : undefined}
            value={amount} onChange={(e) => setAmount(e.target.value)} required
            hint={selected ? `Max ${formatPKR(outstandingMinor)}` : undefined} />
          {exceeds && (
            <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
              Amount exceeds the outstanding balance of {formatPKR(outstandingMinor)}.
            </div>
          )}
          <div className="grid grid-cols-2 gap-4">
            <Select label="Method" value={method} onChange={(e) => setMethod(e.target.value)} options={methods.map((m) => ({ value: m, label: m }))} />
            <Input label="Reference (optional)" value={reference} onChange={(e) => setReference(e.target.value)} />
          </div>
          <Button type="submit" className="w-full" loading={record.isPending} disabled={!customerId || !amount || exceeds}>Record payment</Button>
        </form>
      </CardBody>
    </Card>
  );
}
