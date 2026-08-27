// import Link from 'next/link';
// import { redirect } from 'next/navigation';
// import { ChatWindow } from '@/components/chat-window';
// import { createAuthServerClient } from '@/lib/supabase/auth-server';

// type MessagesPageProps = { searchParams: { conversationId?: string } };

// export default async function MessagesPage({ searchParams }: MessagesPageProps) {
//   const supabase = createAuthServerClient();
//   const { data: { user } } = await supabase.auth.getUser();
//   if (!user) redirect('/login');
//   const { data: conversations } = await supabase.from('conversations').select('id, participant_one, participant_two, listing_id, created_at, updated_at').order('updated_at', { ascending: false });
//   const rows = conversations ?? [];
//   const selectedId = rows.some((conversation) => conversation.id === searchParams.conversationId) ? searchParams.conversationId! : rows[0]?.id;
//   const participantIds = Array.from(new Set(rows.map((conversation) => conversation.participant_one === user.id ? conversation.participant_two : conversation.participant_one)));
//   const [{ data: people }, { data: latestMessages }, { data: selectedMessages }, { data: listings }] = await Promise.all([
//     participantIds.length ? supabase.from('users').select('id, name, avatar_url').in('id', participantIds) : Promise.resolve({ data: [] }),
//     rows.length ? supabase.from('messages').select('conversation_id, content, created_at, sender_id, read_at').in('conversation_id', rows.map((conversation) => conversation.id)).order('created_at', { ascending: false }) : Promise.resolve({ data: [] }),
//     selectedId ? supabase.from('messages').select('id, conversation_id, sender_id, content, read_at, created_at').eq('conversation_id', selectedId).order('created_at') : Promise.resolve({ data: [] }),
//     rows.some((conversation) => conversation.listing_id) ? supabase.from('listings').select('id, title, price, photo_url').in('id', rows.flatMap((conversation) => conversation.listing_id ? [conversation.listing_id] : [])) : Promise.resolve({ data: [] }),
//   ]);
//   const personById = new Map((people ?? []).map((person) => [person.id, person]));
//   const latestByConversation = new Map((latestMessages ?? []).map((message) => [message.conversation_id, message]));
//   const listingById = new Map((listings ?? []).map((listing) => [listing.id, listing]));
//   const selected = rows.find((conversation) => conversation.id === selectedId);
//   const selectedListing = selected?.listing_id ? listingById.get(selected.listing_id) : undefined;

//   return <main className="mx-auto min-h-screen max-w-5xl px-4 py-6 md:px-6 md:py-10"><a href="/feed" className="text-sm font-semibold text-adire">← Back to feed</a><h1 className="mt-3 font-heading text-3xl font-bold text-ink">Messages</h1>
//     <div className="mt-5 grid overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200 md:grid-cols-[19rem_1fr]">
//       <aside className={`${selected ? 'hidden md:block' : ''} border-b border-slate-200 md:border-b-0 md:border-r`}><h2 className="px-5 py-4 font-heading text-lg font-bold">Conversations</h2><div className="max-h-[65vh] overflow-y-auto">{rows.length === 0 ? <p className="px-5 pb-5 text-sm text-slate-500">No conversations yet. Open a listing to message its seller.</p> : rows.map((conversation) => { const otherId = conversation.participant_one === user.id ? conversation.participant_two : conversation.participant_one; const person = personById.get(otherId); const latest = latestByConversation.get(conversation.id); const unread = latest && latest.sender_id !== user.id && !latest.read_at; return <Link key={conversation.id} href={`/messages?conversationId=${conversation.id}`} className={`relative block border-t border-slate-100 px-5 py-4 hover:bg-[#F6F1E7] ${conversation.id === selectedId ? 'bg-[#F6F1E7]' : ''}`}><p className="truncate font-semibold text-ink">{person?.name ?? 'Neighbour'}</p><p className="mt-1 truncate text-sm text-slate-600">{latest?.content ?? 'No messages yet'}</p>{latest && <p className="mt-1 text-xs text-slate-500">{new Date(latest.created_at).toLocaleDateString()}</p>}{unread && <span aria-label="Unread message" className="absolute right-4 top-5 h-2.5 w-2.5 rounded-full bg-brick" />}</Link>; })}</div></aside>
//       <section className={selected ? '' : 'hidden md:block'}>{selected ? <><div className="border-b border-slate-200 px-5 py-4"><Link href="/messages" className="text-sm font-semibold text-adire md:hidden">← Conversations</Link><p className="font-semibold text-ink">{personById.get(selected.participant_one === user.id ? selected.participant_two : selected.participant_one)?.name ?? 'Neighbour'}</p>{selectedListing && <Link href={`/listings/${selectedListing.id}`} className="mt-2 block rounded-lg bg-[#F6F1E7] p-3 text-sm text-slate-700"><span className="font-semibold">About: {selectedListing.title}</span>{selectedListing.price && <span className="ml-2 text-adire">{selectedListing.price}</span>}</Link>}</div><ChatWindow conversationId={selected.id} currentUserId={user.id} initialMessages={selectedMessages ?? []} /></> : <div className="flex min-h-[360px] items-center justify-center p-8 text-center text-sm text-slate-500">Choose a conversation to view messages.</div>}</section>
//     </div>
//   </main>;
// }



import Link from 'next/link';
import { redirect } from 'next/navigation';
import { ChatHeader } from '@/components/chat-header';
import { ChatWindow } from '@/components/chat-window';
import { UserAvatar } from '@/components/user-avatar';
import { createAuthServerClient } from '@/lib/supabase/auth-server';
import type { Database } from '@/types/database';

type Message = Database['public']['Tables']['messages']['Row'];

export default async function MessagesPage({ searchParams }: { searchParams: { conversationId?: string } }) {
  const supabase = createAuthServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const { data: conversations } = await supabase
    .from('conversations')
    .select('id, participant_one, participant_two, listing_id, created_at, updated_at')
    .order('updated_at', { ascending: false });

  const rows = conversations ?? [];
  const selectedId = rows.some((conversation) => conversation.id === searchParams.conversationId) ? searchParams.conversationId : undefined;
  const selected = rows.find((conversation) => conversation.id === selectedId);

  const participantIds = Array.from(new Set(rows.flatMap((item) => [item.participant_one, item.participant_two])));

  const [{ data: persons }, { data: listings }, { data: selectedMessages }, { data: latestMessages }] = await Promise.all([
    participantIds.length ? supabase.from('users').select('id, name, avatar_url').in('id', participantIds) : Promise.resolve({ data: [] }),
    rows.some((conversation) => conversation.listing_id)
      ? supabase.from('listings').select('id, title, price').in('id', rows.flatMap((conversation) => conversation.listing_id ? [conversation.listing_id] : []))
      : Promise.resolve({ data: [] }),
    selected ? supabase.from('messages').select('*').eq('conversation_id', selected.id).order('created_at', { ascending: true }) : Promise.resolve({ data: [] }),
    rows.length ? supabase.from('messages').select('*').in('conversation_id', rows.map((conversation) => conversation.id)).order('created_at', { ascending: false }) : Promise.resolve({ data: [] }),
  ]);

  const personById = new Map((persons ?? []).map((person) => [person.id, person]));
  const listingById = new Map((listings ?? []).map((listing) => [listing.id, listing]));
  const latestByConversation = new Map<string, Message>();

  (latestMessages ?? []).forEach((message) => {
    if (!latestByConversation.has(message.conversation_id)) {
      latestByConversation.set(message.conversation_id, message as Message);
    }
  });

  const selectedOtherId = selected && (selected.participant_one === user.id ? selected.participant_two : selected.participant_one);
  const counterparty = selectedOtherId ? personById.get(selectedOtherId) : undefined;
  const selectedListing = selected?.listing_id ? listingById.get(selected.listing_id) : undefined;

  // Active Chat View
  if (selected && counterparty) {
    return (
      <main className="min-h-[100dvh] bg-[#121212] text-white">
        <ChatHeader name={counterparty.name} avatarUrl={counterparty.avatar_url} profileId={counterparty.id} listingId={selectedListing?.id} />
        <ChatWindow
          conversationId={selected.id}
          currentUserId={user.id}
          initialMessages={(selectedMessages ?? []) as Message[]}
          counterparty={{ id: counterparty.id, name: counterparty.name, avatarUrl: counterparty.avatar_url }}
          listing={selectedListing ? { id: selectedListing.id, title: selectedListing.title } : undefined}
        />
      </main>
    );
  }

  // Inbox View
  return (
    <main className="mx-auto min-h-screen max-w-2xl bg-[#4A2E2B] px-4 py-3 text-white">
      <div className="flex items-center justify-between py-2">
        <div className="flex items-center gap-3">
          <Link href="/feed" className="text-xl">←</Link>
          <h1 className="text-2xl font-bold">Messages</h1>
        </div>
      </div>

      <div className="flex gap-4 overflow-x-auto py-4 scrollbar-none">
        <div className="flex flex-col items-center gap-1.5 min-w-[64px]">
          <div className="relative h-14 w-14 rounded-full bg-slate-800">
            <span className="absolute bottom-0 right-0 h-4 w-4 rounded-full bg-emerald-500 border-2 border-[#121212]" />
          </div>
          <span className="text-xs text-slate-400 truncate w-16 text-center">Your note</span>
        </div>
        {rows.map((conversation) => {
          const otherId = conversation.participant_one === user.id ? conversation.participant_two : conversation.participant_one;
          const person = personById.get(otherId);
          return (
            <Link key={conversation.id} href={`/messages?conversationId=${conversation.id}`} className="flex flex-col items-center gap-1.5 min-w-[64px]">
              <div className="relative">
                <UserAvatar id={otherId} name={person?.name ?? 'User'} avatarUrl={person?.avatar_url} className="h-14 w-14 ring-2 ring-blue-500" />
                <span className="absolute bottom-0 right-0 h-3.5 w-3.5 rounded-full bg-emerald-500 border-2 border-[#121212]" />
              </div>
              <span className="text-xs text-slate-300 truncate w-16 text-center">{person?.name?.split(' ')[0] ?? 'User'}</span>
            </Link>
          );
        })}
      </div>

      <div className="mt-2 space-y-1">
        {rows.length === 0 ? (
          <p className="py-10 text-center text-sm text-slate-400">No conversations yet.</p>
        ) : (
          rows.map((conversation) => {
            const otherId = conversation.participant_one === user.id ? conversation.participant_two : conversation.participant_one;
            const person = personById.get(otherId);
            const latest = latestByConversation.get(conversation.id);
            const unread = latest && latest.sender_id !== user.id && !latest.read_at;
            const preview = latest ? (latest.sender_id === user.id ? `You: ${latest.content}` : latest.content) : 'No messages yet';

            return (
              <Link
                key={conversation.id}
                href={`/messages?conversationId=${conversation.id}`}
                className="flex items-center gap-3 rounded-xl p-2.5 hover:bg-slate-800/50 transition-colors"
              >
                <div className="relative">
                  <UserAvatar id={otherId} name={person?.name ?? 'User'} avatarUrl={person?.avatar_url} className="h-14 w-14" />
                  <span className="absolute bottom-0 right-0 h-3.5 w-3.5 rounded-full bg-emerald-500 border-2 border-[#121212]" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold text-base">{person?.name ?? 'User'}</p>
                  <p className={`mt-0.5 truncate text-sm ${unread ? 'font-bold text-white' : 'text-slate-400'}`}>{preview}</p>
                </div>
                {unread && <span className="h-3 w-3 rounded-full bg-blue-500" />}
              </Link>
            );
          })
        )}
      </div>
    </main>
  );
}
