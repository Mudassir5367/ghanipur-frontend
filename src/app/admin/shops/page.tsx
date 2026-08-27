'use client';

import { useState, type FormEvent } from 'react';
import { Card, CardBody } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { StatusBadge } from '@/components/ui/Badge';
import { useShops, useSetShopStatus, useCreateShopAdmin } from '@/features/shop/hooks';
import type { ShopStatus } from '@/types/shop';

const FILTERS: (ShopStatus | 'ALL')[] = ['ALL', 'PENDING', 'ACTIVE', 'SUSPENDED', 'INACTIVE'];

const isFilter = (v: string | null): v is ShopStatus | 'ALL' =>
  !!v && (FILTERS as string[]).includes(v);

export default function AdminShopsPage() {
  // Honour a ?status=… deep link (e.g. from the overview cards). Read from the URL
  // directly to avoid a useSearchParams Suspense boundary on this page.
  const [filter, setFilter] = useState<ShopStatus | 'ALL'>(() => {
    if (typeof window === 'undefined') return 'ALL';
    const s = new URLSearchParams(window.location.search).get('status');
    return isFilter(s) ? s : 'ALL';
  });
  const [search, setSearch] = useState('');
  const [open, setOpen] = useState(false);
  const { data, isLoading } = useShops({ status: filter === 'ALL' ? undefined : filter, search: search || undefined });
  const setStatus = useSetShopStatus();
  const create = useCreateShopAdmin();
  const [form, setForm] = useState({ shopName: '', ownerName: '', ownerEmail: '', ownerPassword: '' });

  const onCreate = (e: FormEvent) => {
    e.preventDefault();
    create.mutate(form, { onSuccess: () => { setOpen(false); setForm({ shopName: '', ownerName: '', ownerEmail: '', ownerPassword: '' }); } });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Shops</h1>
        <Button onClick={() => setOpen(true)}>Create shop</Button>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="flex gap-1 rounded-lg border border-slate-200 bg-white p-1">
          {FILTERS.map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`rounded-md px-3 py-1.5 text-sm font-medium ${filter === f ? 'bg-brand-50 text-brand-700' : 'text-slate-500 hover:text-slate-800'}`}
            >
              {f}
            </button>
          ))}
        </div>
        <Input placeholder="Search shops…" value={search} onChange={(e) => setSearch(e.target.value)} className="max-w-xs" />
      </div>

      <Card>
        <CardBody className="p-0">
          {isLoading ? (
            <div className="h-40 animate-pulse rounded-lg bg-slate-100 m-4" />
          ) : data && data.shops.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 text-left text-xs uppercase text-slate-400">
                    <th className="px-5 py-3 font-medium">Shop</th>
                    <th className="px-5 py-3 font-medium">Slug</th>
                    <th className="px-5 py-3 font-medium">Status</th>
                    <th className="px-5 py-3 font-medium">Created</th>
                    <th className="px-5 py-3 text-right font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {data.shops.map((shop) => (
                    <tr key={shop._id}>
                      <td className="px-5 py-3 font-medium text-slate-800">{shop.name}</td>
                      <td className="px-5 py-3 text-slate-500">/{shop.slug}</td>
                      <td className="px-5 py-3"><StatusBadge status={shop.status} /></td>
                      <td className="px-5 py-3 text-slate-500">{new Date(shop.createdAt).toLocaleDateString()}</td>
                      <td className="px-5 py-3">
                        <div className="flex justify-end gap-2">
                          {shop.status !== 'ACTIVE' && (
                            <Button size="sm" variant="outline" onClick={() => setStatus.mutate({ id: shop._id, status: 'ACTIVE' })}>
                              {shop.status === 'PENDING' ? 'Approve' : 'Activate'}
                            </Button>
                          )}
                          {shop.status === 'ACTIVE' && (
                            <Button size="sm" variant="danger" onClick={() => setStatus.mutate({ id: shop._id, status: 'SUSPENDED' })}>
                              Suspend
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="py-12 text-center text-sm text-slate-400">No shops found.</p>
          )}
        </CardBody>
      </Card>

      <Modal open={open} onClose={() => setOpen(false)} title="Create a shop">
        <form onSubmit={onCreate} className="space-y-4">
          <Input label="Shop name" value={form.shopName} onChange={(e) => setForm((f) => ({ ...f, shopName: e.target.value }))} required />
          <Input label="Owner name" value={form.ownerName} onChange={(e) => setForm((f) => ({ ...f, ownerName: e.target.value }))} required />
          <Input label="Owner email" type="email" value={form.ownerEmail} onChange={(e) => setForm((f) => ({ ...f, ownerEmail: e.target.value }))} required />
          <Input label="Owner password" type="password" value={form.ownerPassword} onChange={(e) => setForm((f) => ({ ...f, ownerPassword: e.target.value }))} required hint="At least 8 characters" />
          <Button type="submit" className="w-full" loading={create.isPending}>Create shop (pre-approved)</Button>
        </form>
      </Modal>
    </div>
  );
}
