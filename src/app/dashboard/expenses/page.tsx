'use client';

import { useEffect, useMemo, useState, type FormEvent } from 'react';
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardBody } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { Badge } from '@/components/ui/Badge';
import { useExpenses, useCreateExpense, useUpdateExpense, useDeleteExpense } from '@/features/expenses/hooks';
import { EXPENSE_CATEGORIES, type Expense } from '@/features/expenses/api';
import { useAuthStore } from '@/store/auth';
import { formatPKR } from '@/lib/utils';

const pad = (n: number) => String(n).padStart(2, '0');
const dayKey = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const parseDay = (key: string) => { const [y, m, d] = key.split('-').map(Number); return new Date(y!, (m ?? 1) - 1, d ?? 1); };
const shiftDay = (key: string, n: number) => { const d = parseDay(key); d.setDate(d.getDate() + n); return dayKey(d); };

const emptyForm = { category: '', amount: '', date: '', description: '' };

export default function ExpensesPage() {
  const today = dayKey(new Date());
  const [day, setDay] = useState(today);
  // Arriving from the dashboard / Net Profit page with ?date=YYYY-MM-DD opens that day.
  useEffect(() => {
    const d = new URLSearchParams(window.location.search).get('date');
    if (d && /^\d{4}-\d{2}-\d{2}$/.test(d)) setDay(d > today ? today : d);
  }, [today]);

  const range = useMemo(() => {
    const start = parseDay(day);
    const end = new Date(start);
    end.setHours(23, 59, 59, 999);
    return { from: start.toISOString(), to: end.toISOString() };
  }, [day]);
  const { data: rows, isLoading } = useExpenses(range);

  const user = useAuthStore((s) => s.user);
  const canManage = user?.role === 'SUPER_ADMIN' || !!user?.permissions?.includes('EXPENSE_CREATE');

  const create = useCreateExpense();
  const update = useUpdateExpense();
  const del = useDeleteExpense();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Expense | null>(null);
  const [toDelete, setToDelete] = useState<Expense | null>(null);
  const [form, setForm] = useState(emptyForm);

  const total = (rows ?? []).reduce((s, e) => s + e.amountMinor, 0);
  const byCategory = useMemo(() => {
    const m = new Map<string, number>();
    for (const e of rows ?? []) m.set(e.category, (m.get(e.category) ?? 0) + e.amountMinor);
    return [...m.entries()].sort((a, b) => b[1] - a[1]);
  }, [rows]);

  const openAdd = () => { setEditing(null); setForm({ ...emptyForm, date: day }); setOpen(true); };
  const openEdit = (e: Expense) => {
    setEditing(e);
    setForm({ category: e.category, amount: String(e.amountMinor / 100), date: dayKey(new Date(e.incurredAt)), description: e.description ?? '' });
    setOpen(true);
  };
  const close = () => { setOpen(false); setEditing(null); };

  /** Today keeps the current time; any other day is recorded at midday, safely inside that day. */
  const instantFor = (key: string) => {
    if (key === today) return new Date().toISOString();
    const d = parseDay(key);
    d.setHours(12, 0, 0, 0);
    return d.toISOString();
  };

  const onSubmit = (ev: FormEvent) => {
    ev.preventDefault();
    const base = { category: form.category.trim(), amount: Number(form.amount), description: form.description.trim() };
    if (editing) {
      const dateChanged = form.date !== dayKey(new Date(editing.incurredAt));
      update.mutate({ id: editing._id, payload: { ...base, ...(dateChanged ? { incurredAt: instantFor(form.date) } : {}) } }, { onSuccess: close });
    } else {
      create.mutate({ ...base, description: base.description || undefined, incurredAt: instantFor(form.date || day) }, { onSuccess: close });
    }
  };

  // Suggestions: the standard categories plus any custom ones already used today.
  const categoryOptions = [...new Set([...EXPENSE_CATEGORIES, ...(rows ?? []).map((e) => e.category)])];

  const columns: Column<Expense>[] = [
    { key: 'time', header: 'Time', render: (e) => new Date(e.incurredAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) },
    { key: 'category', header: 'Category', render: (e) => <Badge tone="slate">{e.category}</Badge> },
    { key: 'description', header: 'Description', render: (e) => e.description || '—' },
    { key: 'amount', header: 'Amount', align: 'right', render: (e) => <span className="font-medium text-red-600">{formatPKR(e.amountMinor)}</span> },
    ...(canManage ? [{
      key: 'actions', header: '', align: 'right' as const, render: (e: Expense) => (
        <div className="flex justify-end gap-1">
          <Button size="sm" variant="outline" onClick={() => openEdit(e)}>Edit</Button>
          <Button size="sm" variant="outline" onClick={() => setToDelete(e)}>Delete</Button>
        </div>
      ),
    }] : []),
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Expenses</h1>
          <p className="text-sm text-slate-500">Daily expenditure — subtracted from each day&apos;s profit for <Link href="/dashboard/net-profit" className="text-brand-700 hover:underline">Net Profit</Link>.</p>
        </div>
        {canManage && <Button onClick={openAdd}>Add expense</Button>}
      </div>

      <div className="flex flex-wrap items-center gap-1">
        <Button size="sm" variant="outline" onClick={() => setDay(shiftDay(day, -1))} aria-label="Previous day">←</Button>
        <input type="date" value={day} max={today} onChange={(e) => e.target.value && setDay(e.target.value > today ? today : e.target.value)}
          className="h-8 rounded-lg border border-slate-300 px-2 text-sm focus:border-brand-500 focus:outline-none" />
        <Button size="sm" variant="outline" onClick={() => setDay(shiftDay(day, 1))} disabled={day >= today} aria-label="Next day">→</Button>
        {day !== today && <Button size="sm" variant="outline" onClick={() => setDay(today)}>Today</Button>}
        <span className="ml-2 text-sm text-slate-500">
          {day === today ? 'Today' : parseDay(day).toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
        </span>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card><CardBody>
          <p className="text-sm font-medium text-slate-500">Total expenditure</p>
          <p className="mt-2 text-2xl font-bold tracking-tight text-amber-600">{isLoading ? '…' : formatPKR(total)}</p>
          <p className="mt-1 text-xs text-slate-400">{(rows ?? []).length} {(rows ?? []).length === 1 ? 'expense' : 'expenses'}</p>
        </CardBody></Card>
        <Card className="lg:col-span-2">
          <CardHeader><CardTitle>By category</CardTitle></CardHeader>
          <CardBody>
            {byCategory.length === 0 ? (
              <p className="text-sm text-slate-400">No expenses on this day.</p>
            ) : (
              <div className="divide-y divide-slate-50">
                {byCategory.map(([category, amount]) => (
                  <div key={category} className="flex items-center justify-between py-2 text-sm">
                    <span className="text-slate-700">{category}</span>
                    <span className="font-medium text-slate-900">{formatPKR(amount)}</span>
                  </div>
                ))}
              </div>
            )}
          </CardBody>
        </Card>
      </div>

      <Card><CardBody className="p-0">
        <DataTable columns={columns} data={rows} isLoading={isLoading} rowKey={(e) => e._id} empty="No expenses recorded on this day." />
      </CardBody></Card>

      <Modal open={open} onClose={close} title={editing ? 'Edit expense' : 'Add expense'}>
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">Category</label>
            <input list="expense-categories" value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))} required maxLength={40}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200" placeholder="e.g. Rent, Electricity Bill, Employee Pay" />
            <datalist id="expense-categories">{categoryOptions.map((c) => <option key={c} value={c} />)}</datalist>
            <p className="mt-1 text-xs text-slate-500">Pick one or type your own.</p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input label="Amount (Rs)" type="number" step="0.01" min="0.01" value={form.amount} onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))} required />
            <Input label="Date" type="date" max={today} value={form.date} onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))} required />
          </div>
          <Input label="Description (optional)" value={form.description} maxLength={300} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
          <Button type="submit" className="w-full" loading={create.isPending || update.isPending}>{editing ? 'Save changes' : 'Record expense'}</Button>
        </form>
      </Modal>

      <ConfirmDialog
        open={!!toDelete}
        title="Delete expense"
        message={`Delete ${toDelete ? `${toDelete.category} — ${formatPKR(toDelete.amountMinor)}` : 'this expense'}? Net Profit for that day will go up by this amount.`}
        confirmLabel="Delete" danger loading={del.isPending}
        onClose={() => setToDelete(null)}
        onConfirm={() => toDelete && del.mutate(toDelete._id, { onSuccess: () => setToDelete(null) })}
      />
    </div>
  );
}
