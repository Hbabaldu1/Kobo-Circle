'use server';

import { redirect } from 'next/navigation';
import { createAuthServerClient } from '@/lib/supabase/auth-server';

export async function getOrCreateConversation(sellerId: string, listingId?: string) {
  try {
    const supabase = createAuthServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) redirect('/login');
    if (user.id === sellerId) throw new Error('You cannot message yourself.');

    const [participantOne, participantTwo] = [user.id, sellerId].sort();
    const { data: existing, error: lookupError } = await supabase
      .from('conversations').select('id, listing_id')
      .eq('participant_one', participantOne).eq('participant_two', participantTwo).maybeSingle();
    if (lookupError) throw lookupError;

    const { data: listing, error: listingError } = listingId
      ? await supabase.from('listings').select('id, title').eq('id', listingId).maybeSingle()
      : { data: null, error: null };
    if (listingError) throw listingError;

    let conversationId = existing?.id;
    if (!conversationId) {
      const { data: conversation, error } = await supabase.from('conversations')
        .insert({ participant_one: participantOne, participant_two: participantTwo, listing_id: listingId ?? null }).select('id').single();
      if (error || !conversation) throw error ?? new Error('Conversation was not created.');
      conversationId = conversation.id;
    }

    if (listing && (!existing || existing.listing_id !== listing.id)) {
      const { data: previous, error: messageError } = await supabase.from('messages')
        .select('message_type, reference_listing_id')
        .eq('conversation_id', conversationId).order('created_at', { ascending: false }).limit(1).maybeSingle();
      if (messageError) throw messageError;
      if (previous?.message_type !== 'listing_reference' || previous.reference_listing_id !== listing.id) {
        const { error } = await supabase.from('messages').insert({
          conversation_id: conversationId,
          sender_id: user.id,
          content: `Shared listing: ${listing.title}`,
          message_type: 'listing_reference',
          reference_listing_id: listing.id,
        });
        if (error) throw error;
      }
    }
    redirect(`/messages/${conversationId}`);
  } catch (error) {
    if (error instanceof Error && 'digest' in error) throw error;
    console.error('Could not open conversation:', error);
    throw new Error('Could not open this conversation.');
  }
}
