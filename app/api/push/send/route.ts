import { NextResponse } from 'next/server';
import { createAuthServerClient } from '@/lib/supabase/auth-server';
import { sendPushToUser } from '@/lib/push';

export async function POST(request: Request) {
  const body = await request.json() as { conversationId?: string; recipientId?: string };
  if (!body.conversationId || !body.recipientId) return NextResponse.json({ error: 'Invalid message notification.' }, { status: 400 });
  const supabase = createAuthServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  const { data: conversation } = await supabase.from('conversations').select('participant_one,participant_two').eq('id', body.conversationId).maybeSingle();
  if (!conversation || ![conversation.participant_one, conversation.participant_two].includes(user.id) || ![conversation.participant_one, conversation.participant_two].includes(body.recipientId) || body.recipientId === user.id) return NextResponse.json({ error: 'Forbidden.' }, { status: 403 });
  void sendPushToUser(body.recipientId, 'message', `/messages/${body.conversationId}`);
  return NextResponse.json({ ok: true });
}
