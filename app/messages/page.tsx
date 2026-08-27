import Link from 'next/link';
import { redirect } from 'next/navigation';
import { ChatWindow } from '@/components/chat-window';
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
    rows.some((conversation) => conversation.listing_id) ? supabase.from('listings').select('id, title, price, photo_url').in('id', rows.flatMap((conversation) => conversation.listing_id ? [conversation.listing_id] : [])) : Promise.resolve({ data: [] }),
  ]);
  const personById = new Map((people ?? []).map((person) => [person.id, person]));
  const latestByConversation = new Map((latestMessages ?? []).map((message) => [message.conversation_id, message]));
  const listingById = new Map((listings ?? []).map((listing) => [listing.id, listing]));
  const selected = rows.find((conversation) => conversation.id === selectedId);
  const selectedListing = selected?.listing_id ? listingById.get(selected.listing_id) : undefined;

  return <main className="mx-auto min-h-screen max-w-5xl px-4 py-6 md:px-6 md:py-10"><a href="/feed" className="text-sm font-semibold text-adire">← Back to feed</a><h1 className="mt-3 font-heading text-3xl font-bold text-ink">Messages</h1>
    <div className="mt-5 grid overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200 md:grid-cols-[19rem_1fr]">
      <aside className={`${selected ? 'hidden md:block' : ''} border-b border-slate-200 md:border-b-0 md:border-r`}><h2 className="px-5 py-4 font-heading text-lg font-bold">Conversations</h2><div className="max-h-[65vh] overflow-y-auto">{rows.length === 0 ? <p className="px-5 pb-5 text-sm text-slate-500">No conversations yet. Open a listing to message its seller.</p> : rows.map((conversation) => { const otherId = conversation.participant_one === user.id ? conversation.participant_two : conversation.participant_one; const person = personById.get(otherId); const latest = latestByConversation.get(conversation.id); const unread = latest && latest.sender_id !== user.id && !latest.read_at; return <Link key={conversation.id} href={`/messages?conversationId=${conversation.id}`} className={`relative block border-t border-slate-100 px-5 py-4 hover:bg-[#F6F1E7] ${conversation.id === selectedId ? 'bg-[#F6F1E7]' : ''}`}><p className="truncate font-semibold text-ink">{person?.name ?? 'Neighbour'}</p><p className="mt-1 truncate text-sm text-slate-600">{latest?.content ?? 'No messages yet'}</p>{latest && <p className="mt-1 text-xs text-slate-500">{new Date(latest.created_at).toLocaleDateString()}</p>}{unread && <span aria-label="Unread message" className="absolute right-4 top-5 h-2.5 w-2.5 rounded-full bg-brick" />}</Link>; })}</div></aside>
      <section className={selected ? '' : 'hidden md:block'}>{selected ? <><div className="border-b border-slate-200 px-5 py-4"><Link href="/messages" className="text-sm font-semibold text-adire md:hidden">← Conversations</Link><p className="font-semibold text-ink">{personById.get(selected.participant_one === user.id ? selected.participant_two : selected.participant_one)?.name ?? 'Neighbour'}</p>{selectedListing && <Link href={`/listings/${selectedListing.id}`} className="mt-2 block rounded-lg bg-[#F6F1E7] p-3 text-sm text-slate-700"><span className="font-semibold">About: {selectedListing.title}</span>{selectedListing.price && <span className="ml-2 text-adire">{selectedListing.price}</span>}</Link>}</div><ChatWindow conversationId={selected.id} currentUserId={user.id} initialMessages={selectedMessages ?? []} /></> : <div className="flex min-h-[360px] items-center justify-center p-8 text-center text-sm text-slate-500">Choose a conversation to view messages.</div>}</section>
    </div>
  </main>;
}
