'use client';

import Link from 'next/link';
import { FormEvent, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

export function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setLoading(true);
    const validation = await fetch('/api/auth/validate-login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password }) });
    if (!validation.ok) { setError((await validation.json() as { error?: string }).error ?? 'Check your email and password.'); setLoading(false); return; }
    const { error: signInError } = await createClient().auth.signInWithPassword({ email, password });
    setLoading(false);
    if (signInError) {
      setError('We could not sign you in with those details. Confirm your email first, then try again.');
      return;
    }
    window.location.assign('/feed');
  }

  return <AuthShell title="Welcome home" description="Sign in to your estate marketplace.">
    <form onSubmit={submit} className="mt-6 space-y-4">
      <Field id="email" label="Email address" type="email" value={email} onChange={setEmail} autoComplete="email" />
      <Field id="password" label="Password" type="password" value={password} onChange={setPassword} autoComplete="current-password" />
      <button disabled={loading} className="w-full rounded-lg bg-adire px-4 py-3 font-semibold text-white transition-transform duration-100 active:scale-95 disabled:opacity-60 motion-reduce:transition-none motion-reduce:active:scale-100">{loading ? 'Signing in…' : 'Sign in'}</button>
    </form>
    {error && <p role="alert" className="mt-4 text-sm text-brick">{error}</p>}
    <p className="mt-6 text-center text-sm text-slate-600">New to Kobo Circle? <Link href="/signup" className="font-semibold text-adire underline">Create an account</Link></p>
  </AuthShell>;
}

export function SignupForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const passwordIsValid = password.length >= 8 && /\d/.test(password);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    if (!passwordIsValid) { setError('Use at least 8 characters and include at least one number.'); return; }
    setLoading(true);
    const validation = await fetch('/api/auth/validate-signup', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password }) });
    if (!validation.ok) { setError((await validation.json() as { error?: string }).error ?? 'Check your email and password.'); setLoading(false); return; }
    const { error: signUpError } = await createClient().auth.signUp({ email, password, options: { emailRedirectTo: `${window.location.origin}/login` } });
    setLoading(false);
    if (signUpError) { setError(signUpError.message); return; }
    window.location.assign('/check-email');
  }

  return <AuthShell title="Create your account" description="Use your email to join Kobo Circle.">
    <form onSubmit={submit} className="mt-6 space-y-4">
      <Field id="email" label="Email address" type="email" value={email} onChange={setEmail} autoComplete="email" />
      <div><Field id="password" label="Password" type="password" value={password} onChange={setPassword} autoComplete="new-password" /><p className={`mt-1 text-xs ${password && !passwordIsValid ? 'text-brick' : 'text-slate-500'}`}>At least 8 characters and one number.</p></div>
      <button disabled={loading} className="w-full rounded-lg bg-adire px-4 py-3 font-semibold text-white transition-transform duration-100 active:scale-95 disabled:opacity-60 motion-reduce:transition-none motion-reduce:active:scale-100">{loading ? 'Creating account…' : 'Create account'}</button>
    </form>
    {error && <p role="alert" className="mt-4 text-sm text-brick">{error}</p>}
    <p className="mt-6 text-center text-sm text-slate-600">Already have an account? <Link href="/login" className="font-semibold text-adire underline">Sign in</Link></p>
  </AuthShell>;
}

function AuthShell({ title, description, children }: { title: string; description: string; children: React.ReactNode }) {
  return <main className="mx-auto flex min-h-screen max-w-md items-center px-4 py-8"><section className="w-full rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200"><p className="font-heading text-sm font-bold uppercase tracking-[0.18em] text-adire">Kobo Circle</p><h1 className="mt-3 font-heading text-3xl font-bold text-ink">{title}</h1><p className="mt-2 text-sm leading-6 text-slate-600">{description}</p>{children}</section></main>;
}

function Field({ id, label, type, value, onChange, autoComplete }: { id: string; label: string; type: 'email' | 'password'; value: string; onChange: (value: string) => void; autoComplete: string }) {
  return <div><label className="block text-sm font-semibold" htmlFor={id}>{label}</label><input id={id} type={type} required value={value} onChange={(event) => onChange(event.target.value)} autoComplete={autoComplete} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-3 text-base" /></div>;
}
