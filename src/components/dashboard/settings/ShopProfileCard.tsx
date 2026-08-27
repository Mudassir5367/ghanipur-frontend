'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { Card, CardHeader, CardTitle, CardBody } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { StatusBadge } from '@/components/ui/Badge';
import { useMyShop, useUpdateShop } from '@/features/shop/hooks';

export function ShopProfileCard() {
  const { data: shop, isLoading } = useMyShop();
  const update = useUpdateShop();
  const [form, setForm] = useState({ name: '', description: '', phone: '', whatsapp: '', email: '', city: '', line: '' });

  useEffect(() => {
    if (shop) {
      setForm({
        name: shop.name ?? '',
        description: shop.description ?? '',
        phone: shop.phone ?? '',
        whatsapp: shop.whatsapp ?? '',
        email: shop.email ?? '',
        city: shop.address?.city ?? '',
        line: shop.address?.line ?? '',
      });
    }
  }, [shop]);

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    update.mutate({
      name: form.name,
      description: form.description,
      phone: form.phone,
      whatsapp: form.whatsapp,
      email: form.email || undefined,
      address: { city: form.city, line: form.line },
    });
  };

  return (
    <Card>
      <CardHeader className="flex items-center justify-between">
        <CardTitle>Shop profile</CardTitle>
        {shop && <StatusBadge status={shop.status} />}
      </CardHeader>
      <CardBody>
        {isLoading ? (
          <div className="h-40 animate-pulse rounded-lg bg-slate-100" />
        ) : (
          <form onSubmit={onSubmit} className="grid gap-4 sm:grid-cols-2">
            <Input label="Shop name" value={form.name} onChange={set('name')} required />
            <Input label="Public URL slug" value={shop?.slug ?? ''} disabled hint="Contact support to change" />
            <div className="sm:col-span-2">
              <label className="mb-1.5 block text-sm font-medium text-slate-700">Description</label>
              <textarea
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                rows={2}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200"
              />
            </div>
            <Input label="Phone" value={form.phone} onChange={set('phone')} />
            <Input label="WhatsApp" value={form.whatsapp} onChange={set('whatsapp')} />
            <Input label="Email" type="email" value={form.email} onChange={set('email')} />
            <Input label="City" value={form.city} onChange={set('city')} />
            <Input label="Address" value={form.line} onChange={set('line')} className="sm:col-span-2" />
            <div className="sm:col-span-2">
              <Button type="submit" loading={update.isPending}>Save changes</Button>
            </div>
          </form>
        )}
      </CardBody>
    </Card>
  );
}
