'use client';

import { useState } from 'react';
import { updateNotificationPreferences } from '@/app/profile/actions';

type Preferences = { vouch_enabled: boolean; message_enabled: boolean; listing_enabled: boolean };
const labels: Array<[keyof Preferences, string]> = [['vouch_enabled', 'Vouches'], ['message_enabled', 'Messages'], ['listing_enabled', 'Nearby listings']];

export function NotificationPreferences({ initial }: { initial: Preferences }) {
  const [preferences, setPreferences] = useState(initial);
  const [status, setStatus] = useState('');
  async function save(next: Preferences) { setPreferences(next); const result = await updateNotificationPreferences(next); setStatus(result.error ?? 'Saved'); }
  async function enablePush() {
    if (!('Notification' in window) || !('serviceWorker' in navigator) || !process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY) { setStatus('Push notifications are not configured on this device.'); return; }
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') { setStatus('Browser notifications were not enabled.'); return; }
    const registration = await navigator.serviceWorker.register('/service-worker.js');
    const key = Uint8Array.from(atob(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY.replace(/-/g, '+').replace(/_/g, '/')), (char) => char.charCodeAt(0));
    const subscription = await registration.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: key });
    await fetch('/api/push/subscribe', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(subscription) });
    setStatus('Browser notifications enabled.');
  }
  return <section className="mt-5 border-t border-slate-200 pt-5"><p className="text-xs font-bold uppercase tracking-[.16em] text-adire">Notifications</p><div className="mt-3 space-y-3">{labels.map(([key, label]) => <label key={key} className="flex items-center justify-between text-sm font-medium text-ink"><span>{label}</span><input aria-label={`${label} notifications`} type="checkbox" checked={preferences[key]} onChange={(event) => void save({ ...preferences, [key]: event.target.checked })} className="h-5 w-5 accent-adire" /></label>)}</div><button type="button" onClick={() => void enablePush()} className="mt-4 rounded-lg border border-adire px-3 py-2 text-sm font-semibold text-adire transition-colors hover:bg-slate-100">Enable browser notifications</button>{status && <p role="status" className="mt-2 text-xs text-slate-600">{status}</p>}</section>;
}
