'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { userProfileSchema } from '@/lib/validation';

export function OnboardingForm({ streets }: { streets: Array<{ id: string; name: string }> }) {
  const router = useRouter();
  const [name, setName] = useState('');
  const [streetId, setStreetId] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault(); setError('');
    const validated = userProfileSchema.safeParse({ name, streetId });
    if (!validated.success) { setError('Enter your name using 2 to 60 characters and choose your street.'); return; }
    setLoading(true);
    const response = await fetch('/api/onboarding', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(validated.data) });
    const payload = await response.json() as { error?: string };
    setLoading(false);
    if (!response.ok) { setError(payload.error ?? 'We could not save your details. Please try again.'); return; }
    router.replace('/feed'); router.refresh();
  }

  return <main className="mx-auto flex min-h-screen max-w-md items-center px-4 py-8"><section className="w-full rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200"><p className="font-heading text-sm font-bold uppercase tracking-[0.18em] text-adire">Kobo Circle</p><h1 className="mt-3 font-heading text-3xl font-bold text-ink">Join your estate</h1><p className="mt-2 text-sm leading-6 text-slate-600">Tell neighbours how to find you. Your verified phone number stays private.</p><form onSubmit={submit} className="mt-6 space-y-4"><div><label htmlFor="name" className="block text-sm font-semibold">Your name</label><input id="name" value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" maxLength={60} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-3 text-base" /></div><div><label htmlFor="street" className="block text-sm font-semibold">Your street</label><select id="street" value={streetId} onChange={(e) => setStreetId(e.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-3 text-base"><option value="">Choose your street</option>{streets.map((street) => <option key={street.id} value={street.id}>{street.name}</option>)}</select></div><button disabled={loading || streets.length === 0} className="w-full rounded-lg bg-adire px-4 py-3 font-semibold text-white disabled:opacity-60">{loading ? 'Saving…' : 'Continue to Kobo Circle'}</button></form>{error && <p role="alert" className="mt-4 text-sm text-red-700">{error}</p>}</section></main>;
}
