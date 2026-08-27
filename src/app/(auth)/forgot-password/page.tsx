'use client';

import { useEffect, useRef, useState, type FormEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Card, CardBody } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { forgotPassword, verifyResetOtp, resetPassword } from '@/features/auth/api';
import { apiErrorMessage } from '@/lib/api';

type Step = 'email' | 'otp' | 'password' | 'done';
const RESEND_COOLDOWN = 60; // seconds — mirror of the server-side cooldown

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [devOtp, setDevOtp] = useState<string | undefined>();
  const [cooldown, setCooldown] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const timer = useRef<ReturnType<typeof setInterval>>();

  const startCooldown = () => {
    setCooldown(RESEND_COOLDOWN);
    clearInterval(timer.current);
    timer.current = setInterval(() => {
      setCooldown((c) => {
        if (c <= 1) { clearInterval(timer.current); return 0; }
        return c - 1;
      });
    }, 1000);
  };
  useEffect(() => () => clearInterval(timer.current), []);

  const sendCode = async () => {
    setError(''); setBusy(true);
    try {
      const res = await forgotPassword(email);
      setDevOtp(res.devOtp);
      setNotice(res.message);
      startCooldown();
      return true;
    } catch (e) {
      setError(apiErrorMessage(e));
      return false;
    } finally {
      setBusy(false);
    }
  };

  const onEmail = async (e: FormEvent) => {
    e.preventDefault();
    if (await sendCode()) setStep('otp');
  };

  const onVerify = async (e: FormEvent) => {
    e.preventDefault();
    setError(''); setBusy(true);
    try {
      const { resetToken: tok } = await verifyResetOtp(email, otp);
      setResetToken(tok);
      setNotice('');
      setStep('password');
    } catch (err) {
      setError(apiErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const onReset = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    if (password.length < 8) { setError('Password must be at least 8 characters.'); return; }
    if (password !== confirm) { setError('Passwords do not match.'); return; }
    setBusy(true);
    try {
      await resetPassword({ email, resetToken, password });
      setStep('done');
      setTimeout(() => router.push('/login'), 2500);
    } catch (err) {
      setError(apiErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card>
      <CardBody className="space-y-5 p-6">
        <div className="text-center">
          <h1 className="text-xl font-semibold text-slate-900">
            {step === 'email' && 'Reset your password'}
            {step === 'otp' && 'Enter the code'}
            {step === 'password' && 'Set a new password'}
            {step === 'done' && 'Password updated'}
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            {step === 'email' && "We'll email a 6-digit verification code to your account."}
            {step === 'otp' && <>Enter the 6-digit code sent to <span className="font-medium text-slate-700">{email}</span>.</>}
            {step === 'password' && 'Choose a new password for your account.'}
            {step === 'done' && 'You can now log in with your new password.'}
          </p>
        </div>

        {error && <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}
        {notice && step !== 'done' && <div className="rounded-lg bg-brand-50 px-3 py-2 text-sm text-brand-700">{notice}</div>}
        {devOtp && step === 'otp' && (
          <div className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-700">
            Dev mode — your code is <span className="font-mono font-bold">{devOtp}</span> (no email is sent locally).
          </div>
        )}

        {step === 'email' && (
          <form onSubmit={onEmail} className="space-y-4">
            <Input name="email" type="email" label="Email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" />
            <Button type="submit" className="w-full" loading={busy}>Send code</Button>
          </form>
        )}

        {step === 'otp' && (
          <form onSubmit={onVerify} className="space-y-4">
            <Input
              name="otp" label="Verification code" inputMode="numeric" placeholder="123456"
              className="text-center tracking-[0.4em]" value={otp}
              onChange={(e) => { const v = e.target.value.replace(/\D/g, '').slice(0, 6); setOtp(v); }}
              required autoComplete="one-time-code"
            />
            <Button type="submit" className="w-full" loading={busy} disabled={otp.length !== 6}>Verify code</Button>
            <div className="flex items-center justify-between text-sm">
              <button type="button" onClick={() => { setStep('email'); setOtp(''); setError(''); }} className="text-slate-500 hover:text-slate-800">← Change email</button>
              <button type="button" onClick={sendCode} disabled={cooldown > 0 || busy} className="font-medium text-brand-700 hover:underline disabled:text-slate-400 disabled:no-underline">
                {cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend code'}
              </button>
            </div>
          </form>
        )}

        {step === 'password' && (
          <form onSubmit={onReset} className="space-y-4">
            <Input name="password" type="password" label="New password" value={password} onChange={(e) => setPassword(e.target.value)} required hint="At least 8 characters" autoComplete="new-password" />
            <Input name="confirm" type="password" label="Confirm new password" value={confirm} onChange={(e) => setConfirm(e.target.value)} required autoComplete="new-password" />
            <Button type="submit" className="w-full" loading={busy}>Update password</Button>
          </form>
        )}

        {step === 'done' && (
          <div className="space-y-4 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-brand-100 text-2xl">✓</div>
            <Link href="/login"><Button className="w-full">Go to login</Button></Link>
          </div>
        )}

        {step !== 'done' && (
          <p className="text-center text-sm text-slate-500">
            Remembered it?{' '}
            <Link href="/login" className="font-medium text-brand-700 hover:underline">Back to login</Link>
          </p>
        )}
      </CardBody>
    </Card>
  );
}
