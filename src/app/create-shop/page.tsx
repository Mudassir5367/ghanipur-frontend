'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { RequireAuth } from '@/components/auth/RequireAuth';
import { Card, CardBody } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { BrandMark } from '@/components/ui/BrandMark';
import { useAuthStore } from '@/store/auth';
import { useCreateMyShop } from '@/features/shop/hooks';

function CreateShopForm() {
  const user = useAuthStore((s) => s.user);
  const router = useRouter();
  const create = useCreateMyShop();
  const [form, setForm] = useState({ shopName: '', phone: '' });

  // If the admin already has a shop, send them to the dashboard.
  useEffect(() => {
    if (user?.role === 'SHOP_ADMIN' && user.shopId) router.replace('/dashboard');
  }, [user, router]);

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    create.mutate({ shopName: form.shopName, phone: form.phone || undefined });
  };

  return (
    <div className="flex min-h-screen flex-col bg-cream">
      <header className="mx-auto w-full max-w-6xl px-6 py-5">
        <Link href="/"><BrandMark /></Link>
      </header>
      <main className="flex flex-1 items-center justify-center px-6 py-10">
        <Card className="w-full max-w-md">
          <CardBody className="space-y-5 p-6">
            <div className="text-center">
              <h1 className="text-xl font-semibold text-slate-900">Create your shop</h1>
              <p className="mt-1 text-sm text-slate-500">Set up your dairy shop to start selling.</p>
            </div>
            <form onSubmit={onSubmit} className="space-y-4">
              <Input label="Shop name" placeholder="e.g. Ali Dairy" value={form.shopName} onChange={(e) => setForm((f) => ({ ...f, shopName: e.target.value }))} required />
              <Input label="Phone (optional)" value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} />
              <Button type="submit" className="w-full" loading={create.isPending}>Create shop</Button>
            </form>
            <p className="text-center text-xs text-slate-400">Your shop starts with a set of default categories you can edit anytime.</p>
          </CardBody>
        </Card>
      </main>
    </div>
  );
}

export default function CreateShopPage() {
  return (
    <RequireAuth roles={['SHOP_ADMIN']}>
      <CreateShopForm />
    </RequireAuth>
  );
}
