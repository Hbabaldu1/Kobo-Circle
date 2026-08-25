'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { createBrowserSupabaseClient } from '@/lib/supabase/client';
import { normalizeNigerianPhone } from '@/lib/phone';

type Phase = 'phone' | 'otp';

export function AuthCard() {
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>('phone');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  function beginCooldown() {
    setCooldown(30);
    const timer = window.setInterval(() => setCooldown((seconds) => {
      if (seconds <= 1) { window.clearInterval(timer); return 0; }
      return seconds - 1;
    }), 1000);
  }

  async function requestCode(event?: FormEvent) {
    event?.preventDefault();
    setError(''); setMessage('');
    const normalized = normalizeNigerianPhone(phone);
    if (!normalized) { setError('Enter a Nigerian number such as 08012345678.'); return; }
    setLoading(true);
    const response = await fetch('/api/auth/request-otp', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ phone: normalized }) });
    const payload = await response.json() as { phone?: string; error?: string };
    setLoading(false);
    if (!response.ok) { setError(payload.error ?? 'We could not send a code. Please try again.'); return; }
    setPhone(payload.phone ?? normalized); setPhase('otp'); setMessage(`We sent a 6-digit code to ${payload.phone ?? normalized}.`); beginCooldown();
  }

  async function verifyCode(event: FormEvent) {
    event.preventDefault(); setError(''); setLoading(true);
    if (!/^\d{6}$/.test(otp)) { setLoading(false); setError('Enter the 6-digit code from your SMS.'); return; }
    const supabase = createBrowserSupabaseClient();
    const { error: verifyError } = await supabase.auth.verifyOtp({ phone, token: otp, type: 'sms' });
    setLoading(false);
    if (verifyError) { setError('That code is incorrect or has expired. Request a new code and try again.'); return; }
    router.replace('/feed'); router.refresh();
  }

  return <main className="mx-auto flex min-h-screen max-w-md items-center px-4 py-8"><section className="w-full rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
    <p className="font-heading text-sm font-bold uppercase tracking-[0.18em] text-adire">Kobo Circle</p>
    <h1 className="mt-3 font-heading text-3xl font-bold text-ink">{phase === 'phone' ? 'Welcome home' : 'Check your SMS'}</h1>
    <p className="mt-2 text-sm leading-6 text-slate-600">{phase === 'phone' ? 'Enter your phone number to receive a secure sign-in code.' : `Enter the code sent to ${phone}.`}</p>
    {phase === 'phone' ? <form onSubmit={requestCode} className="mt-6 space-y-4"><label className="block text-sm font-semibold" htmlFor="phone">Phone number</label><input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} inputMode="tel" autoComplete="tel" placeholder="08012345678" className="w-full rounded-lg border border-slate-300 px-3 py-3 text-base" /><button disabled={loading} className="w-full rounded-lg bg-adire px-4 py-3 font-semibold text-white disabled:opacity-60">{loading ? 'Sending code…' : 'Send code'}</button></form>
      : <form onSubmit={verifyCode} className="mt-6 space-y-4"><label className="block text-sm font-semibold" htmlFor="otp">6-digit code</label><input id="otp" value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))} inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" className="w-full rounded-lg border border-slate-300 px-3 py-3 text-center text-xl tracking-[0.5em]" /><button disabled={loading} className="w-full rounded-lg bg-adire px-4 py-3 font-semibold text-white disabled:opacity-60">{loading ? 'Checking…' : 'Verify code'}</button><button type="button" disabled={cooldown > 0 || loading} onClick={() => requestCode()} className="w-full py-2 text-sm font-semibold text-adire disabled:text-slate-400">{cooldown > 0 ? `Resend available in ${cooldown}s` : 'Resend code'}</button></form>}
    {(error || message) && <p role="status" className={`mt-4 text-sm ${error ? 'text-red-700' : 'text-emerald-700'}`}>{error || message}</p>}
  </section></main>;
}
