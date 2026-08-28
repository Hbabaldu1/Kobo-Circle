import Link from 'next/link';
import { redirect } from 'next/navigation';
import { UserAvatar } from '@/components/user-avatar';
import { createAuthServerClient } from '@/lib/supabase/auth-server';
import type { Database } from '@/types/database';

type Message = Database['public']['Tables']['messages']['Row'];

export default async function MessagesPage({ searchParams }: { searchParams: { conversationId?: string } }) {
  const supabase = createAuthServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  // Preserve existing shared links while keeping active chats on their own route.
  if (searchParams.conversationId) redirect(`/messages/${searchParams.conversationId}`);

  const { data: conversations } = await supabase
    .from('conversations')
    .select('id, participant_one, participant_two, listing_id, created_at, updated_at')
    .order('updated_at', { ascending: false });

  const rows = conversations ?? [];
  const participantIds = Array.from(new Set(rows.flatMap((item) => [item.participant_one, item.participant_two])));

  const [{ data: persons }, { data: latestMessages }] = await Promise.all([
    participantIds.length ? supabase.from('users').select('id, name, avatar_url').in('id', participantIds) : Promise.resolve({ data: [] }),
    rows.length ? supabase.from('messages').select('*').in('conversation_id', rows.map((conversation) => conversation.id)).order('created_at', { ascending: false }) : Promise.resolve({ data: [] }),
  ]);

  const personById = new Map((persons ?? []).map((person) => [person.id, person]));
  const latestByConversation = new Map<string, Message>();

  (latestMessages ?? []).forEach((message) => {
    if (!latestByConversation.has(message.conversation_id)) {
      latestByConversation.set(message.conversation_id, message as Message);
    }
  });

  // Inbox View
  return (
    <main className="mx-auto min-h-screen max-w-2xl px-4 py-4 text-slate-900">
      <div className="flex gap-4 overflow-x-auto py-2 scrollbar-none">
        {/* <div className="flex flex-col items-center gap-1.5 min-w-[64px]">
          <div className="relative flex h-14 w-14 items-center justify-center rounded-full bg-slate-200 text-slate-500 font-semibold text-sm">
            <span>+</span>
          </div>
          <span className="text-xs text-slate-500 truncate w-16 text-center">Your note</span>
        </div> */}
        {rows.map((conversation) => {
          const otherId = conversation.participant_one === user.id ? conversation.participant_two : conversation.participant_one;
          const person = personById.get(otherId);
          return (
            <Link 
              key={conversation.id} 
              href={`/messages/${conversation.id}`}
              className="flex flex-col items-center gap-1.5 min-w-[64px] outline-none focus:outline-none"
            >
              <div className="relative rounded-full ring-2 ring-blue-500 p-0.5">
                <UserAvatar id={otherId} name={person?.name ?? 'User'} avatarUrl={person?.avatar_url} className="h-14 w-14" />
              </div>
              <span className="text-xs text-slate-700 font-medium truncate w-16 text-center">
                {person?.name?.split(' ')[0] ?? 'User'}
              </span>
            </Link>
          );
        })}
      </div>

      <div className="mt-4 space-y-1">
        {rows.length === 0 ? (
          <p className="py-10 text-center text-sm text-slate-500">No conversations yet.</p>
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
                href={`/messages/${conversation.id}`}
                className="flex items-center gap-3 rounded-xl p-3 hover:bg-slate-100 transition-colors"
              >
                <UserAvatar id={otherId} name={person?.name ?? 'User'} avatarUrl={person?.avatar_url} className="h-14 w-14" />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold text-base text-slate-900">{person?.name ?? 'User'}</p>
                  <p className={`mt-0.5 truncate text-sm ${unread ? 'font-bold text-blue-600' : 'text-slate-500'}`}>{preview}</p>
                </div>
                {unread && <span className="h-2.5 w-2.5 rounded-full bg-blue-600" />}
              </Link>
            );
          })
        )}
      </div>
    </main>
  );
}
