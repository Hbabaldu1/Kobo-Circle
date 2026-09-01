import { notFound, redirect } from 'next/navigation';
import { ChatHeader } from '@/components/chat-header';
import { ChatWindow, type ReferencedListing } from '@/components/chat-window';
import { createAuthServerClient } from '@/lib/supabase/auth-server';
import type { Database } from '@/types/database';

type Message = Database['public']['Tables']['messages']['Row'];

export default async function ConversationPage({ params }: { params: { id: string } }) {
  const supabase = createAuthServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: conversation } = await supabase.from('conversations').select('id, participant_one, participant_two').eq('id', params.id).maybeSingle();
  if (!conversation) notFound();

  const counterpartyId = conversation.participant_one === user.id ? conversation.participant_two : conversation.participant_one;
  const [{ data: counterparty }, { data: messages }] = await Promise.all([
    supabase.from('users').select('id, name, avatar_url').eq('id', counterpartyId).maybeSingle(),
    supabase.from('messages').select('*').eq('conversation_id', conversation.id).order('created_at', { ascending: true }),
  ]);
  if (!counterparty) notFound();

  const listingIds = [...new Set((messages ?? []).flatMap((message) => message.reference_listing_id ? [message.reference_listing_id] : []))];
  const { data: listings } = listingIds.length
    ? await supabase.from('listings').select('id, title, price, photo_url, type, status').in('id', listingIds)
    : { data: [] };

  return (
    <main className="mx-auto flex h-full min-h-0 max-w-4xl flex-col overflow-hidden border-x border-slate-200 bg-transparent text-slate-900">
      <ChatHeader name={counterparty.name} avatarUrl={counterparty.avatar_url} profileId={counterparty.id} />
      <ChatWindow
        conversationId={conversation.id}
        currentUserId={user.id}
        initialMessages={(messages ?? []) as Message[]}
        initialReferencedListings={(listings ?? []) as ReferencedListing[]}
        counterparty={{ id: counterparty.id, name: counterparty.name, avatarUrl: counterparty.avatar_url }}
      />
    </main>
  );
}
