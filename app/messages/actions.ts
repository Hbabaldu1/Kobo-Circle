'use server';

import { redirect } from 'next/navigation';
import { createAuthServerClient } from '@/lib/supabase/auth-server';

export async function getOrCreateConversation(listingId: string, sellerId: string) {
  const supabase = createAuthServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');
  if (user.id === sellerId) throw new Error('You cannot message yourself.');

  const [participantOne, participantTwo] = [user.id, sellerId].sort();
  const { data: existing, error: lookupError } = await supabase
    .from('conversations')
    .select('id')
    .eq('participant_one', participantOne)
    .eq('participant_two', participantTwo)
    .eq('listing_id', listingId)
    .maybeSingle();

  if (lookupError) throw new Error('Could not open this conversation.');
  if (existing) redirect(`/messages?conversationId=${existing.id}`);

  const { data: conversation, error: insertError } = await supabase
    .from('conversations')
    .insert({ participant_one: participantOne, participant_two: participantTwo, listing_id: listingId })
    .select('id')
    .single();

  if (insertError || !conversation) throw new Error('Could not start this conversation.');
  redirect(`/messages?conversationId=${conversation.id}`);
}
