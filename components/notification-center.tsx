'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

type EventType = 'vouch' | 'message' | 'listing';
type Notice = { type: EventType; text: string; href: string };
type Preferences = { vouch_enabled: boolean; message_enabled: boolean; listing_enabled: boolean };
const defaults: Preferences = { vouch_enabled: true, message_enabled: true, listing_enabled: true };

function playChime(type: EventType) {
  if (document.visibilityState !== 'visible') return;
  const context = new AudioContext(); const oscillator = context.createOscillator(); const gain = context.createGain();
  const frequency = type === 'vouch' ? 660 : type === 'message' ? 740 : 520;
  oscillator.frequency.value = frequency; oscillator.type = type === 'listing' ? 'triangle' : 'sine'; gain.gain.setValueAtTime(0.0001, context.currentTime); gain.gain.exponentialRampToValueAtTime(0.08, context.currentTime + 0.015); gain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + (type === 'vouch' ? 0.18 : 0.12)); oscillator.connect(gain).connect(context.destination); oscillator.start(); oscillator.stop(context.currentTime + (type === 'vouch' ? 0.2 : 0.14));
  if (type === 'vouch') { const second = context.createOscillator(); second.frequency.value = 880; second.connect(gain); second.start(context.currentTime + 0.1); second.stop(context.currentTime + 0.22); }
  window.setTimeout(() => void context.close(), 350);
}

export function NotificationCenter() {
  const router = useRouter(); const supabase = useMemo(() => createClient(), []); const [notice, setNotice] = useState<Notice>();
  useEffect(() => { if (!notice) return; const timeout = window.setTimeout(() => setNotice(undefined), 4000); return () => window.clearTimeout(timeout); }, [notice]);
  useEffect(() => {
    let profile: { id: string; lga_id: string; ward_id: string | null } | null = null; let preferences = defaults;
    function show(type: EventType, text: string, href: string) { const enabled = preferences[`${type}_enabled` as keyof Preferences]; if (!enabled) return; playChime(type); setNotice({ type, text, href }); }
    async function connect() {
      const { data: { user } } = await supabase.auth.getUser(); if (!user) return;
      const [{ data: person }, { data: saved }] = await Promise.all([supabase.from('users').select('id,lga_id,ward_id').eq('id', user.id).maybeSingle(), supabase.from('notification_preferences').select('vouch_enabled,message_enabled,listing_enabled').eq('user_id', user.id).maybeSingle()]);
      profile = person; preferences = saved ?? defaults;
      const channel = supabase.channel('foreground-notifications')
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'vouches', filter: `vouched_for_id=eq.${user.id}` }, () => show('vouch', 'A neighbour vouched for you.', '/profile'))
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, (payload) => { const message = payload.new as { sender_id: string; conversation_id: string }; if (message.sender_id !== user.id) show('message', 'You received a new message.', `/messages/${message.conversation_id}`); })
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'listings' }, (payload) => { const listing = payload.new as { user_id: string; lga_id: string; ward_id: string | null }; if (profile && listing.user_id !== user.id && listing.lga_id === profile.lga_id && (!profile.ward_id || listing.ward_id === profile.ward_id)) show('listing', 'A new listing was posted near you.', '/feed'); })
        .subscribe();
      return () => { void supabase.removeChannel(channel); };
    }
    let cleanup: (() => void) | undefined; void connect().then((dispose) => { cleanup = dispose; }); return () => cleanup?.();
  }, [supabase]);
  if (!notice) return null;
  return <button type="button" onClick={() => { setNotice(undefined); router.push(notice.href); }} className="fixed inset-x-4 top-4 z-[60] mx-auto max-w-md rounded-xl bg-ink px-4 py-3 text-left text-sm font-semibold text-white shadow-lg transition-transform motion-reduce:transition-none md:top-20"><span className="mr-2">{notice.type === 'vouch' ? '🤝' : notice.type === 'message' ? '💬' : '📍'}</span>{notice.text}</button>;
}
