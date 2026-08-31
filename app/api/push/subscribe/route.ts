import { NextResponse } from 'next/server';
import { createAuthServerClient } from '@/lib/supabase/auth-server';

export async function POST(request: Request) {
  const subscription = await request.json() as { endpoint?: string; keys?: { p256dh?: string; auth?: string } };
  if (!subscription.endpoint || !subscription.keys?.p256dh || !subscription.keys.auth) return NextResponse.json({ error: 'Invalid push subscription.' }, { status: 400 });
  const supabase = createAuthServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  const keys = { p256dh: subscription.keys.p256dh, auth: subscription.keys.auth };
  const { error } = await supabase.from('push_subscriptions').upsert({ user_id: user.id, endpoint: subscription.endpoint, keys }, { onConflict: 'endpoint' });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
