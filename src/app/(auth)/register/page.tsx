'use client';

import { useState, type FormEvent } from 'react';
import Link from 'next/link';
import { Card, CardBody } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { useRegister } from '@/features/auth/hooks';
import { apiErrorMessage } from '@/lib/api';

export default function RegisterPage() {
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '' });
  const register = useRegister();

  const update = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    register.mutate({ name: form.name, email: form.email, phone: form.phone || undefined, password: form.password });
  };

  return (
    <Card>
      <CardBody className="space-y-5 p-6">
        <div className="text-center">
          <h1 className="text-xl font-semibold text-slate-900">Create your account</h1>
          <p className="mt-1 text-sm text-slate-500">Sign up to browse shops and order.</p>
        </div>

        {register.isError && (
          <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{apiErrorMessage(register.error)}</div>
        )}

        <form onSubmit={onSubmit} className="space-y-4">
          <Input name="name" label="Full name" value={form.name} onChange={update('name')} required />
          <Input name="email" type="email" label="Email" value={form.email} onChange={update('email')} required autoComplete="email" />
          <Input name="phone" label="Phone (optional)" value={form.phone} onChange={update('phone')} />
          <Input name="password" type="password" label="Password" value={form.password} onChange={update('password')} required hint="At least 8 characters" autoComplete="new-password" />
          <Button type="submit" className="w-full" loading={register.isPending}>Create account</Button>
        </form>

        <p className="text-center text-sm text-slate-500">
          Already have an account?{' '}
          <Link href="/login" className="font-medium text-brand-700 hover:underline">Log in</Link>
        </p>
      </CardBody>
    </Card>
  );
}
