'use client';

import { useMemo, useState, type FormEvent } from 'react';
import { Card, CardBody } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Modal } from '@/components/ui/Modal';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { Badge } from '@/components/ui/Badge';
import { useCategories, useCreateCategory, useDeleteCategory } from '@/features/catalog/hooks';
import type { Category } from '@/types/catalog';

export default function CategoriesPage() {
  const { data: categories, isLoading } = useCategories();
  const create = useCreateCategory();
  const del = useDeleteCategory();
  const [open, setOpen] = useState(false);
  const [toDelete, setToDelete] = useState<Category | null>(null);
  const [form, setForm] = useState({ name: '', description: '', parentId: '' });

  const parentName = useMemo(() => {
    const map = new Map(categories?.map((c) => [c._id, c.name]));
    return (id?: string | null) => (id ? map.get(id) ?? '—' : '—');
  }, [categories]);

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    create.mutate(
      { name: form.name, description: form.description || undefined, parentId: form.parentId || null },
      { onSuccess: () => { setOpen(false); setForm({ name: '', description: '', parentId: '' }); } },
    );
  };

  const columns: Column<Category>[] = [
    { key: 'name', header: 'Name', render: (c) => <span className="font-medium text-slate-800">{c.name}</span> },
    { key: 'slug', header: 'Slug', render: (c) => <span className="text-slate-500">/{c.slug}</span> },
    { key: 'parent', header: 'Parent', render: (c) => parentName(c.parentId) },
    { key: 'status', header: 'Status', render: (c) => <Badge tone={c.status === 'ACTIVE' ? 'green' : 'slate'}>{c.status}</Badge> },
    {
      key: 'actions', header: '', align: 'right',
      render: (c) => <Button size="sm" variant="ghost" onClick={() => setToDelete(c)}>Delete</Button>,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Categories</h1>
          <p className="text-sm text-slate-500">Organise products into categories like Milk, Dahi, Ghee.</p>
        </div>
        <Button onClick={() => setOpen(true)}>Add category</Button>
      </div>

      <Card><CardBody className="p-0">
        <DataTable columns={columns} data={categories} isLoading={isLoading} rowKey={(c) => c._id} empty="No categories yet. Create your first one." />
      </CardBody></Card>

      <Modal open={open} onClose={() => setOpen(false)} title="Add category">
        <form onSubmit={onSubmit} className="space-y-4">
          <Input label="Name" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} required />
          <Input label="Description (optional)" value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
          <Select
            label="Parent category (optional)"
            placeholder="None (top level)"
            value={form.parentId}
            onChange={(e) => setForm((f) => ({ ...f, parentId: e.target.value }))}
            options={(categories ?? []).map((c) => ({ value: c._id, label: c.name }))}
          />
          <Button type="submit" className="w-full" loading={create.isPending}>Create category</Button>
        </form>
      </Modal>

      <ConfirmDialog
        open={!!toDelete}
        title="Delete category"
        message={`Delete "${toDelete?.name}"? This cannot be undone.`}
        confirmLabel="Delete"
        danger
        loading={del.isPending}
        onClose={() => setToDelete(null)}
        onConfirm={() => toDelete && del.mutate(toDelete._id, { onSuccess: () => setToDelete(null) })}
      />
    </div>
  );
}
