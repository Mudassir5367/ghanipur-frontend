'use client';

import { useState, type FormEvent } from 'react';
import Link from 'next/link';
import { Card, CardBody } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Modal } from '@/components/ui/Modal';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { useCustomers, useCreateCustomer } from '@/features/sales/hooks';
import { useSettings } from '@/features/shop/hooks';
import { formatPKR } from '@/lib/utils';
import type { Customer } from '@/types/sales';

type RangePreset = 'ALL' | 'TODAY' | 'YESTERDAY' | 'WEEK' | 'TWO_WEEK' | 'MONTH';
const RANGE_LABELS: [RangePreset, string][] = [
  ['ALL', 'All'], ['TODAY', 'Today'], ['YESTERDAY', 'Yesterday'], ['WEEK', 'Weekly'], ['TWO_WEEK', '2 Weeks'], ['MONTH', 'Monthly'],
];
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
const lastActivity = (c: Customer): string | undefined => {
  const dates = [c.lastSaleAt, c.lastPaymentAt, c.createdAt].filter(Boolean) as string[];
  if (!dates.length) return undefined;
  return dates.reduce((a, b) => (new Date(a) > new Date(b) ? a : b));
};

export default function CustomersPage() {
  const [filters, setFilters] = useState<{ search?: string; hasDue?: string }>({});
  const [range, setRange] = useState<RangePreset>('ALL');
  const { data, isLoading } = useCustomers({ ...filters, ...rangeFor(range) });
  const { data: settings } = useSettings();
  const create = useCreateCustomer();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: '', phone: '', type: '', openingBalance: '', address: '' });

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    create.mutate(
      {
        name: form.name,
        phone: form.phone || undefined,
        type: form.type || undefined,
        address: form.address || undefined,
        openingBalance: form.openingBalance ? Number(form.openingBalance) : undefined,
      },
      { onSuccess: () => { setOpen(false); setForm({ name: '', phone: '', type: '', openingBalance: '', address: '' }); } },
    );
  };

  const columns: Column<Customer>[] = [
    { key: 'name', header: 'Customer', render: (c) => (
      <Link href={`/dashboard/customers/${c._id}`} className="font-medium text-brand-700 hover:underline">{c.name}</Link>
    ) },
    { key: 'phone', header: 'Phone', render: (c) => c.phone || '—' },
    { key: 'type', header: 'Type', render: (c) => c.type },
    { key: 'lastActivity', header: 'Last activity', render: (c) => {
      const d = lastActivity(c);
      return d ? <span className="text-slate-600">{new Date(d).toLocaleDateString()}</span> : <span className="text-slate-300">—</span>;
    } },
    { key: 'balance', header: 'Outstanding', align: 'right', render: (c) => {
      const outstanding = c.totalOutstandingMinor ?? c.currentBalanceMinor;
      return outstanding > 0 ? <span className="font-medium text-red-600">{formatPKR(outstanding)}</span>
        : outstanding < 0 ? <span className="text-brand-700">Advance {formatPKR(-outstanding)}</span>
        : <span className="text-slate-400">Clear</span>;
    } },
    { key: 'actions', header: '', align: 'right', render: (c) => (
      <Link href={`/dashboard/customers/${c._id}`}><Button size="sm" variant="ghost">Ledger</Button></Link>
    ) },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Customers</h1>
          <p className="text-sm text-slate-500">Manage customers and their credit ledgers.</p>
        </div>
        <Button onClick={() => setOpen(true)}>Add customer</Button>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Input placeholder="Search name or phone…" className="max-w-xs" value={filters.search ?? ''} onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value || undefined }))} />
        <label className="flex h-10 items-center gap-2 text-sm text-slate-600">
          <input type="checkbox" checked={filters.hasDue === 'true'} onChange={(e) => setFilters((f) => ({ ...f, hasDue: e.target.checked ? 'true' : undefined }))} />
          Only those who owe
        </label>
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

      <Card><CardBody className="p-0">
        <DataTable columns={columns} data={data?.customers} isLoading={isLoading} rowKey={(c) => c._id} empty="No customers yet." />
      </CardBody></Card>

      <Modal open={open} onClose={() => setOpen(false)} title="Add customer">
        <form onSubmit={onSubmit} className="space-y-4">
          <Input label="Name" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} required />
          <Input label="Phone (optional)" hint="Leave empty for walk-in customers" value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} />
          <Select label="Type" placeholder="Select…" value={form.type} onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}
            options={(settings?.customerTypes ?? []).map((t) => ({ value: t, label: t }))} />
          <Input label="Address" value={form.address} onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))} />
          <Input label="Opening balance (Rs)" type="number" step="0.01" value={form.openingBalance} onChange={(e) => setForm((f) => ({ ...f, openingBalance: e.target.value }))} hint="Amount the customer already owes (optional)" />
          <Button type="submit" className="w-full" loading={create.isPending}>Create customer</Button>
        </form>
      </Modal>
    </div>
  );
}
