'use client';

import { Suspense, useState, type FormEvent } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Card, CardBody } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { useLogin } from '@/features/auth/hooks';
import { apiErrorMessage } from '@/lib/api';

function LoginForm() {
  const params = useSearchParams();
  const redirect = params.get('redirect');
  // Set when a logged-in session was ended because the shop/account was suspended.
  const reason = params.get('reason');
  const forcedOutMessage = reason === 'suspended'
    ? 'Your shop has been suspended, so you have been logged out. Please contact the platform administrator.'
    : reason === 'disabled' ? 'Your account has been disabled, so you have been logged out.' : null;
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const login = useLogin(redirect);

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    login.mutate({ email, password });
  };

  return (
    <Card>
      <CardBody className="space-y-5 p-6">
        <div className="text-center">
          <h1 className="text-xl font-semibold text-slate-900">Welcome back</h1>
          <p className="mt-1 text-sm text-slate-500">Log in to your Ghanipur account.</p>
        </div>

        {forcedOutMessage && !login.isError && (
          <div className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800">{forcedOutMessage}</div>
        )}

        {login.isError && (
          <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{apiErrorMessage(login.error)}</div>
        )}

        <form onSubmit={onSubmit} className="space-y-4">
          <Input name="email" type="email" label="Email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" />
          <Input name="password" type="password" label="Password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required autoComplete="current-password" />
          <div className="text-right">
            <Link href="/forgot-password" className="text-sm font-medium text-brand-700 hover:underline">Forgot password?</Link>
          </div>
          <Button type="submit" className="w-full" loading={login.isPending}>Log in</Button>
        </form>

        <p className="text-center text-sm text-slate-500">
          New to Ghanipur?{' '}
          <Link href="/register" className="font-medium text-brand-700 hover:underline">Create an account</Link>
        </p>
      </CardBody>
    </Card>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="h-64" />}>
      <LoginForm />
    </Suspense>
  );
}
