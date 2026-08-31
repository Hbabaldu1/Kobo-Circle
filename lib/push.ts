import 'server-only';
import webpush from 'web-push';
import { createServerSupabaseClient } from '@/lib/supabase/server';

type PushEvent = 'vouch' | 'message' | 'listing';

const payloads: Record<PushEvent, { title: string; body: string; url: string }> = {
  vouch: { title: 'New vouch', body: 'A neighbour vouched for you.', url: '/profile' },
  message: { title: 'New message', body: 'You have a new Kobo Circle message.', url: '/messages' },
  listing: { title: 'New nearby listing', body: 'A neighbour posted a listing near you.', url: '/feed' },
};

export async function sendPushToUser(userId: string, event: PushEvent, url?: string) {
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  const supabase = createServerSupabaseClient();
  if (!publicKey || !privateKey || !supabase) return;
  webpush.setVapidDetails('mailto:notifications@kobocircle.example', publicKey, privateKey);
  const { data: subscriptions } = await supabase.from('push_subscriptions').select('endpoint, keys').eq('user_id', userId);
  const payload = JSON.stringify({ ...payloads[event], url: url ?? payloads[event].url });
  await Promise.all((subscriptions ?? []).map(async (subscription) => {
    try { await webpush.sendNotification(subscription as webpush.PushSubscription, payload); }
    catch (error) { console.error('Could not send web push notification:', error); }
  }));
}
