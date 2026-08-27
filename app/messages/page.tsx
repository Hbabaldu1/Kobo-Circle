import Link from 'next/link';
import { redirect } from 'next/navigation';
import { ChatHeader } from '@/components/chat-header';
import { ChatWindow } from '@/components/chat-window';
import { UserAvatar } from '@/components/user-avatar';
import { createAuthServerClient } from '@/lib/supabase/auth-server';

type MessagesPageProps = { searchParams: { conversationId?: string } };

export default async function MessagesPage({ searchParams }: MessagesPageProps) {
  const supabase = createAuthServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: conversations } = await supabase.from('conversations').select('id, participant_one, participant_two, listing_id, created_at, updated_at').order('updated_at', { ascending: false });
  const rows = conversations ?? [];
  const selectedId = rows.some((conversation) => conversation.id === searchParams.conversationId) ? searchParams.conversationId! : rows[0]?.id;
  const participantIds = Array.from(new Set(rows.map((conversation) => conversation.participant_one === user.id ? conversation.participant_two : conversation.participant_one)));
  const [{ data: people }, { data: latestMessages }, { data: selectedMessages }, { data: listings }] = await Promise.all([
    participantIds.length ? supabase.from('users').select('id, name, avatar_url').in('id', participantIds) : Promise.resolve({ data: [] }),
    rows.length ? supabase.from('messages').select('conversation_id, content, created_at, sender_id, read_at').in('conversation_id', rows.map((conversation) => conversation.id)).order('created_at', { ascending: false }) : Promise.resolve({ data: [] }),
    selectedId ? supabase.from('messages').select('id, conversation_id, sender_id, content, read_at, created_at').eq('conversation_id', selectedId).order('created_at') : Promise.resolve({ data: [] }),
    rows.some((conversation) => conversation.listing_id) ? supabase.from('listings').select('id, title, price').in('id', rows.flatMap((conversation) => conversation.listing_id ? [conversation.listing_id] : [])) : Promise.resolve({ data: [] }),
  ]);
  const personById = new Map((people ?? []).map((person) => [person.id, person]));
  const latestByConversation = new Map((latestMessages ?? []).map((message) => [message.conversation_id, message]));
  const listingById = new Map((listings ?? []).map((listing) => [listing.id, listing]));
  const selected = rows.find((conversation) => conversation.id === selectedId);
  const selectedOtherId = selected && (selected.participant_one === user.id ? selected.participant_two : selected.participant_one);
  const counterparty = selectedOtherId ? personById.get(selectedOtherId) : undefined;
  const selectedListing = selected?.listing_id ? listingById.get(selected.listing_id) : undefined;

  return <main className="mx-auto min-h-screen max-w-6xl px-0 py-0 md:px-6 md:py-8">
    <div className="grid overflow-hidden bg-white md:rounded-2xl md:shadow-sm md:ring-1 md:ring-slate-200 md:grid-cols-[20rem_1fr]">
      <aside className={`${selected ? 'hidden md:block' : ''} border-b border-slate-200 md:border-b-0 md:border-r`}>
        <div className="flex items-center justify-between px-5 py-5"><h1 className="font-heading text-2xl font-bold text-ink">Messages</h1><Link href="/feed" className="text-sm font-semibold text-adire">Feed</Link></div>
        <div className="max-h-[calc(100dvh-10rem)] overflow-y-auto">{rows.length === 0 ? <p className="px-5 pb-5 text-sm text-slate-500">No conversations yet. Open a listing to message its seller.</p> : rows.map((conversation) => {
          const otherId = conversation.participant_one === user.id ? conversation.participant_two : conversation.participant_one;
          const person = personById.get(otherId); const latest = latestByConversation.get(conversation.id); const unread = latest && latest.sender_id !== user.id && !latest.read_at;
          return <Link key={conversation.id} href={`/messages?conversationId=${conversation.id}`} className={`relative flex gap-3 border-t border-slate-100 px-5 py-4 hover:bg-[#F6F1E7] ${conversation.id === selectedId ? 'bg-[#F6F1E7]' : ''}`}><UserAvatar id={otherId} name={person?.name ?? 'Neighbour'} avatarUrl={person?.avatar_url} className="h-11 w-11 text-sm" /><div className="min-w-0 flex-1"><p className="truncate font-semibold text-ink">{person?.name ?? 'Neighbour'}</p><p className="mt-1 truncate text-sm text-slate-600">{latest?.content ?? 'No messages yet'}</p><p className="mt-1 text-xs text-slate-500">{latest ? new Date(latest.created_at).toLocaleDateString() : ''}</p></div>{unread && <span aria-label="Unread message" className="mt-2 h-2.5 w-2.5 rounded-full bg-brick" />}</Link>;
        })}</div>
      </aside>
      <section className={selected ? '' : 'hidden md:block'}>{selected && counterparty ? <><ChatHeader name={counterparty.name} avatarUrl={counterparty.avatar_url} profileId={counterparty.id} listingId={selectedListing?.id} /><ChatWindow conversationId={selected.id} currentUserId={user.id} initialMessages={selectedMessages ?? []} counterparty={{ id: counterparty.id, name: counterparty.name, avatarUrl: counterparty.avatar_url }} listing={selectedListing ? { id: selectedListing.id, title: selectedListing.title } : undefined} /></> : <div className="flex min-h-[360px] items-center justify-center p-8 text-center text-sm text-slate-500">Choose a conversation to view messages.</div>}</section>
    </div>
  </main>;
}
