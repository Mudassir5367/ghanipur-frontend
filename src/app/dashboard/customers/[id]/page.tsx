'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardBody } from '@/components/ui/Card';
import { StatCard } from '@/components/ui/StatCard';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { Badge } from '@/components/ui/Badge';
import { DeliveryPaymentPanel } from '@/components/dashboard/payments/DeliveryPaymentPanel';
import { CustomerDeliveryCard } from '@/components/dashboard/deliveries/CustomerDeliveryCard';
import { useCustomerLedger } from '@/features/sales/hooks';
import { useCustomerDeliverySummary } from '@/features/delivery/hooks';
import { formatPKR } from '@/lib/utils';
import type { LedgerEntry } from '@/types/sales';

const entryTone: Record<string, 'green' | 'red' | 'amber' | 'slate' | 'blue'> = {
  CREDIT_SALE: 'red', PAYMENT: 'green', OPENING: 'amber', ADJUSTMENT: 'blue', REVERSAL: 'slate',
};

type LedgerRange = 'ALL' | 'WEEK' | 'MONTH';
const RANGE_TABS: [LedgerRange, string][] = [['ALL', 'All time'], ['WEEK', 'This week'], ['MONTH', 'This month']];
function rangeFor(r: LedgerRange): { from?: string; to?: string } {
  if (r === 'ALL') return {};
  const now = new Date();
  const from = new Date(now);
  from.setDate(now.getDate() - (r === 'WEEK' ? 6 : 29));
  from.setHours(0, 0, 0, 0);
  return { from: from.toISOString(), to: now.toISOString() };
}

export default function CustomerLedgerPage() {
  const params = useParams();
  const id = params.id as string;
  const [range, setRange] = useState<LedgerRange>('ALL');
  const { data, isLoading } = useCustomerLedger(id, rangeFor(range));
  const { data: delivery } = useCustomerDeliverySummary(id);

  const columns: Column<LedgerEntry>[] = [
    { key: 'date', header: 'Date', render: (e) => new Date(e.occurredAt).toLocaleString() },
    { key: 'type', header: 'Type', render: (e) => <Badge tone={entryTone[e.entryType] ?? 'slate'}>{e.entryType.replace('_', ' ')}</Badge> },
    { key: 'note', header: 'Note', render: (e) => <span className="text-slate-500">{e.note || '—'}</span> },
    { key: 'debit', header: 'Debit (Charged)', align: 'right', render: (e) => e.debitMinor ? <span className="text-red-600">{formatPKR(e.debitMinor)}</span> : '—' },
    { key: 'credit', header: 'Credit (Paid)', align: 'right', render: (e) => e.creditMinor ? <span className="text-brand-700">{formatPKR(e.creditMinor)}</span> : '—' },
    { key: 'balance', header: 'Balance', align: 'right', render: (e) => <span className="font-medium">{formatPKR(e.balanceAfterMinor)}</span> },
  ];

  const customer = data?.customer;
  const ledgerOutstanding = Math.max(0, data?.summary?.outstandingMinor ?? 0);
  const deliveryOutstanding = delivery?.outstandingMinor ?? 0;
  // Unified outstanding = delivery dues + any sales-ledger dues (§10, one source of truth).
  const outstanding = ledgerOutstanding + deliveryOutstanding;
  // Headline totals reflect deliveries (the primary flow); the sales ledger, if any,
  // is shown separately below so the two are never double-counted.
  const totalPurchased = delivery?.totalPurchasesMinor ?? 0;
  const totalPaid = delivery?.totalPaidMinor ?? 0;
  // Show the ledger card if the customer has ANY sales-ledger history (a range with
  // no rows still shows the card, so switching weeks/months stays consistent).
  const hasLedger = (data?.summary?.totalDebitMinor ?? 0) > 0 || (data?.summary?.totalCreditMinor ?? 0) > 0;
  const period = data?.period;

  return (
    <div className="space-y-6">
      <div>
        <Link href="/dashboard/customers" className="text-sm text-slate-500 hover:text-slate-800">← Customers</Link>
        <h1 className="mt-1 text-2xl font-bold text-slate-900">{customer?.name ?? 'Customer'}</h1>
        <p className="text-sm text-slate-500">{customer?.phone} · {customer?.type}</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Outstanding" value={formatPKR(outstanding)} tone="red" />
        <StatCard label="Total Purchased" value={formatPKR(totalPurchased)} />
        <StatCard label="Total Paid" value={formatPKR(totalPaid)} tone="green" />
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        <div className="lg:col-span-2"><DeliveryPaymentPanel presetCustomerId={id} /></div>
        <div className="lg:col-span-3"><CustomerDeliveryCard customerId={id} /></div>
      </div>

      {hasLedger && (
        <Card>
          <CardHeader className="flex flex-wrap items-center justify-between gap-3">
            <CardTitle>Sales credit ledger</CardTitle>
            <div className="flex gap-1 rounded-lg border border-slate-200 bg-white p-1">
              {RANGE_TABS.map(([key, label]) => (
                <button
                  key={key}
                  onClick={() => setRange(key)}
                  className={`rounded-md px-3 py-1.5 text-sm font-medium ${range === key ? 'bg-brand-50 text-brand-700' : 'text-slate-500 hover:text-slate-800'}`}
                >
                  {label}
                </button>
              ))}
            </div>
          </CardHeader>
          <CardBody className="space-y-4">
            {/* Period totals for the selected week/month/all range. */}
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-lg border border-slate-100 bg-slate-50 p-3">
                <p className="text-xs text-slate-500">Charged{range !== 'ALL' ? ` (${range === 'WEEK' ? 'this week' : 'this month'})` : ''}</p>
                <p className="mt-0.5 text-lg font-bold text-red-600">{formatPKR(period?.debitMinor ?? 0)}</p>
              </div>
              <div className="rounded-lg border border-slate-100 bg-slate-50 p-3">
                <p className="text-xs text-slate-500">Paid</p>
                <p className="mt-0.5 text-lg font-bold text-brand-700">{formatPKR(period?.creditMinor ?? 0)}</p>
              </div>
              <div className="rounded-lg border border-slate-100 bg-slate-50 p-3">
                <p className="text-xs text-slate-500">Entries</p>
                <p className="mt-0.5 text-lg font-bold text-slate-800">{period?.count ?? 0}</p>
              </div>
            </div>
            <div className="-mx-5">
              <DataTable columns={columns} data={data?.entries} isLoading={isLoading} rowKey={(e) => e._id} empty="No transactions in this period." />
            </div>
          </CardBody>
        </Card>
      )}
    </div>
  );
}
