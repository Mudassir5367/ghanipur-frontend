'use client';

import { useState, type FormEvent } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api, apiErrorMessage } from '@/lib/api';
import { Card, CardBody } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { Badge } from '@/components/ui/Badge';
import { toast } from '@/components/ui/toast';
import { formatPKR } from '@/lib/utils';
import type { ApiSuccess } from '@/types/api';

interface Expense { _id: string; category: string; amountMinor: number; method: string; description?: string; incurredAt: string }

const COMMON = ['Rent', 'Electricity', 'Salary', 'Transport', 'Packaging', 'Maintenance', 'Raw Material', 'Other'];

export default function ExpensesPage() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ['expenses'],
    queryFn: async () => (await api.get<ApiSuccess<Expense[]>>('/expenses', { params: { limit: 50 } })).data.data,
  });
  const create = useMutation({
    mutationFn: (payload: { category: string; amount: number; description?: string }) => api.post('/expenses', payload),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['expenses'] }); toast.success('Expense recorded'); setOpen(false); setForm({ category: '', amount: '', description: '' }); },
    onError: (e) => toast.error(apiErrorMessage(e)),
  });
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ category: '', amount: '', description: '' });

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    create.mutate({ category: form.category, amount: Number(form.amount), description: form.description || undefined });
  };

  const total = (data ?? []).reduce((s, e) => s + e.amountMinor, 0);

  const columns: Column<Expense>[] = [
    { key: 'date', header: 'Date', render: (e) => new Date(e.incurredAt).toLocaleDateString() },
    { key: 'category', header: 'Category', render: (e) => <Badge tone="slate">{e.category}</Badge> },
    { key: 'description', header: 'Description', render: (e) => e.description || '—' },
    { key: 'method', header: 'Method', render: (e) => e.method },
    { key: 'amount', header: 'Amount', align: 'right', render: (e) => <span className="font-medium text-red-600">{formatPKR(e.amountMinor)}</span> },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Expenses</h1>
          <p className="text-sm text-slate-500">Track shop expenses — the foundation for future profit analysis.</p>
        </div>
        <Button onClick={() => setOpen(true)}>Add expense</Button>
      </div>

      <Card><CardBody className="flex items-center justify-between">
        <span className="text-sm text-slate-500">Total (recent)</span>
        <span className="text-xl font-bold text-slate-900">{formatPKR(total)}</span>
      </CardBody></Card>

      <Card><CardBody className="p-0">
        <DataTable columns={columns} data={data} isLoading={isLoading} rowKey={(e) => e._id} empty="No expenses recorded yet." />
      </CardBody></Card>

      <Modal open={open} onClose={() => setOpen(false)} title="Add expense">
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">Category</label>
            <input list="expense-categories" value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))} required
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200" placeholder="e.g. Rent" />
            <datalist id="expense-categories">{COMMON.map((c) => <option key={c} value={c} />)}</datalist>
          </div>
          <Input label="Amount (Rs)" type="number" step="0.01" min="0" value={form.amount} onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))} required />
          <Input label="Description (optional)" value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
          <Button type="submit" className="w-full" loading={create.isPending}>Record expense</Button>
        </form>
      </Modal>
    </div>
  );
}
