// 'use client';

// import Link from 'next/link';
// import { useEffect, useRef, useState } from 'react';
// import { createClient } from '@/lib/supabase/client';
// import { UserAvatar } from '@/components/user-avatar';
// import type { Database } from '@/types/database';

// type Message = Database['public']['Tables']['messages']['Row'];
// type ChatWindowProps = {
//   conversationId: string;
//   currentUserId: string;
//   initialMessages: Message[];
//   counterparty: { id: string; name: string; avatarUrl: string | null };
//   listing?: { id: string; title: string };
// };

// function dateLabel(value: string) {
//   return new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }).format(new Date(value));
// }

// export function ChatWindow({ conversationId, currentUserId, initialMessages, counterparty, listing }: ChatWindowProps) {
//   const [messages, setMessages] = useState<Message[]>(initialMessages);
//   const [content, setContent] = useState('');
//   const [sending, setSending] = useState(false);
//   const endRef = useRef<HTMLDivElement>(null);
//   const supabase = createClient();

//   useEffect(() => {
//     endRef.current?.scrollIntoView({ behavior: 'smooth' });
//   }, [messages]);

//   useEffect(() => {
//     const channel = supabase
//       .channel(`messages:${conversationId}`)
//       .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `conversation_id=eq.${conversationId}` }, (payload) => {
//         const incoming = payload.new as Message;
//         setMessages((current) => (current.some((message) => message.id === incoming.id) ? current : [...current, incoming]));
//       })
//       .subscribe();

//     return () => {
//       void supabase.removeChannel(channel);
//     };
//   }, [conversationId, supabase]);

//   async function sendMessage(event: React.FormEvent) {
//     event.preventDefault();
//     const trimmed = content.trim();
//     if (!trimmed || sending) return;
//     setSending(true);

//     const { data, error: insertError } = await supabase
//       .from('messages')
//       .insert({ conversation_id: conversationId, sender_id: currentUserId, content: trimmed })
//       .select()
//       .single();

//     if (!insertError && data) {
//       setMessages((current) => (current.some((message) => message.id === data.id) ? current : [...current, data]));
//       setContent('');
//     }
//     setSending(false);
//   }

//   return (
//     <div className="mx-auto flex min-h-[calc(100vh-120px)] max-w-2xl flex-col bg-slate-50 text-slate-900 border-x border-slate-200">
//       <div className="flex-1 space-y-3 overflow-y-auto px-4 py-6" aria-live="polite">
//         <section className="mb-8 flex flex-col items-center text-center">
//           <UserAvatar id={counterparty.id} name={counterparty.name} avatarUrl={counterparty.avatarUrl} className="h-24 w-24 text-2xl" />
//           <h2 className="mt-3 text-xl font-bold text-slate-900">{counterparty.name}</h2>
//           <p className="mt-1 text-sm text-slate-500">You&apos;re connected on Kobo Circle</p>
//           <Link
//             href={listing ? `/listings/${listing.id}` : `/sellers/${counterparty.id}`}
//             className="mt-4 rounded-lg bg-slate-200 px-4 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-300 transition-colors"
//           >
//             {listing ? 'View listing' : 'View profile'}
//           </Link>
//         </section>

//         {messages.map((message, index) => {
//           const outgoing = message.sender_id === currentUserId;
//           const previous = messages[index - 1];
//           const showDate = !previous || new Date(previous.created_at).toDateString() !== new Date(message.created_at).toDateString();

//           return (
//             <div key={message.id}>
//               {showDate && <p className="my-6 text-center text-xs font-medium text-slate-400">{dateLabel(message.created_at)}</p>}
//               <div className={`flex items-end gap-2 ${outgoing ? 'justify-end' : 'justify-start'}`}>
//                 {!outgoing && <UserAvatar id={counterparty.id} name={counterparty.name} avatarUrl={counterparty.avatarUrl} className="h-7 w-7" />}
//                 <div className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${outgoing ? 'bg-blue-600 text-white rounded-br-none' : 'bg-white border border-slate-200 text-slate-800 rounded-bl-none shadow-xs'}`}>
//                   <p className="whitespace-pre-wrap break-words">{message.content}</p>
//                 </div>
//               </div>
//             </div>
//           );
//         })}
//         <div ref={endRef} />
//       </div>

//       <form onSubmit={sendMessage} className="sticky bottom-0 border-t border-slate-200 bg-white px-3 py-2.5">
//         <div className="flex items-center gap-2">
//           <button type="button" aria-label="Attach gallery media" className="p-1.5 text-blue-600 hover:text-blue-700 hover:bg-slate-100 rounded-full transition-colors">
//             <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
//               <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
//             </svg>
//           </button>
//           <button type="button" aria-label="Audio note" className="p-1.5 text-blue-600 hover:text-blue-700 hover:bg-slate-100 rounded-full transition-colors">
//             <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
//               <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 003-3V4.5a3 3 0 10-6 0v8.25a3 3 0 003 3z" />
//             </svg>
//           </button>
//           <input
//             value={content}
//             onChange={(event) => setContent(event.target.value)}
//             placeholder="Message"
//             className="flex-1 rounded-full border border-slate-200 bg-slate-100 px-4 py-2 text-sm text-slate-900 placeholder-slate-400 outline-none focus:border-blue-500 focus:bg-white focus:ring-1 focus:ring-blue-500"
//           />
//           <button type="submit" disabled={sending || !content.trim()} className="p-1.5 text-blue-600 hover:text-blue-700 disabled:opacity-40 transition-colors">
//             <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
//               <path strokeLinecap="round" strokeLinejoin="round" d="M6.633 10.5c.806 0 1.533-.446 2.031-1.08a9.041 9.041 0 012.861-2.4c.723-.384 1.35-.956 1.653-1.715a4.498 4.498 0 00.322-1.672V3a.75.75 0 01.75-.75A2.25 2.25 0 0116.5 4.5c0 1.152-.26 2.243-.723 3.218-.266.558.107 1.282.725 1.282h3.126c1.026 0 1.945.694 2.054 1.715.045.422.068.85.068 1.285a11.95 11.95 0 01-2.649 7.521c-.888 1.041-2.183 1.679-3.596 1.679H11.25a4.5 4.5 0 01-4.5-4.5V10.5z" />
//             </svg>
//           </button>
//         </div>
//       </form>
//     </div>
//   );
// }





'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useRef, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { UserAvatar } from '@/components/user-avatar';
import type { Database } from '@/types/database';

type Message = Database['public']['Tables']['messages']['Row'];
type ChatWindowProps = {
  conversationId: string;
  currentUserId: string;
  initialMessages: Message[];
  counterparty: { id: string; name: string; avatarUrl: string | null };
  listing?: { id: string; title: string };
};

function dateLabel(value: string) {
  return new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(value));
}

export function ChatWindow({
  conversationId,
  currentUserId,
  initialMessages,
  counterparty,
  listing,
}: ChatWindowProps) {
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [content, setContent] = useState('');
  const [sending, setSending] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);
  const supabase = useMemo(() => createClient(), []);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    async function markReceivedMessagesAsRead() {
      const { error } = await supabase
        .from('messages')
        .update({ read_at: new Date().toISOString() })
        .eq('conversation_id', conversationId)
        .neq('sender_id', currentUserId)
        .is('read_at', null);

      if (error) {
        console.error('Could not mark received messages as read:', error.message);
        return;
      }

      router.refresh();
    }

    void markReceivedMessagesAsRead();
  }, [conversationId, currentUserId, router, supabase]);

  useEffect(() => {
    const channel = supabase
      .channel(`messages:${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          const incoming = payload.new as Message;
          setMessages((current) =>
            current.some((message) => message.id === incoming.id)
              ? current
              : [...current, incoming]
          );
        }
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [conversationId, supabase]);

  async function handleSend(textToSend?: string) {
    const text = textToSend ?? content.trim();
    if (!text || sending) return;
    setSending(true);

    const { data, error: insertError } = await supabase
      .from('messages')
      .insert({
        conversation_id: conversationId,
        sender_id: currentUserId,
        content: text,
      })
      .select()
      .single();

    if (!insertError && data) {
      setMessages((current) =>
        current.some((message) => message.id === data.id)
          ? current
          : [...current, data]
      );
      if (!textToSend) setContent('');
    }
    setSending(false);
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (content.trim()) {
      void handleSend();
    } else {
      void handleSend('👍');
    }
  }

  const hasText = content.trim().length > 0;

  return (
    <div className="mx-auto flex h-[calc(100vh-64px)] max-w-2xl flex-col overflow-hidden border-x border-slate-200 bg-slate-50 text-slate-900">
      {/* Sticky Header positioned directly below top navbar */}
      <div className="sticky top-0 z-10 flex shrink-0 items-center justify-between border-b border-slate-200 bg-white px-4 py-3 shadow-2xs">
        <div className="flex min-w-0 items-center gap-3">
          <button
            type="button"
            onClick={() => router.back()}
            className="rounded-full p-1.5 text-slate-600 hover:bg-slate-100 transition-colors"
            aria-label="Go back"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
            </svg>
          </button>
          
          <Link
            href={`/sellers/${counterparty.id}`}
            className="flex min-w-0 items-center gap-2.5 transition-opacity hover:opacity-80"
          >
            <UserAvatar
              id={counterparty.id}
              name={counterparty.name}
              avatarUrl={counterparty.avatarUrl}
              className="h-8 w-8 shrink-0 text-xs"
            />
            <span className="truncate font-semibold text-slate-900">
              {counterparty.name}
            </span>
          </Link>
        </div>

        {listing && (
          <Link
            href={`/listings/${listing.id}`}
            className="shrink-0 text-xs font-semibold text-blue-600 hover:underline"
          >
            View listing
          </Link>
        )}
      </div>

      {/* Internal Scrollable Message Feed */}
      <div className="flex-1 space-y-3 overflow-y-auto px-4 py-6" aria-live="polite">
        <section className="mb-8 flex flex-col items-center text-center">
          <UserAvatar
            id={counterparty.id}
            name={counterparty.name}
            avatarUrl={counterparty.avatarUrl}
            className="h-20 w-20 text-xl"
          />
          <h2 className="mt-3 text-lg font-bold text-slate-900">{counterparty.name}</h2>
          <p className="mt-0.5 text-xs text-slate-500">Connected on Kobo Circle</p>
        </section>

        {messages.map((message, index) => {
          const outgoing = message.sender_id === currentUserId;
          const previous = messages[index - 1];
          const showDate =
            !previous ||
            new Date(previous.created_at).toDateString() !==
              new Date(message.created_at).toDateString();

          return (
            <div key={message.id}>
              {showDate && (
                <p className="my-6 text-center text-xs font-medium text-slate-400">
                  {dateLabel(message.created_at)}
                </p>
              )}
              <div className={`flex items-end gap-2 ${outgoing ? 'justify-end' : 'justify-start'}`}>
                {!outgoing && (
                  <UserAvatar
                    id={counterparty.id}
                    name={counterparty.name}
                    avatarUrl={counterparty.avatarUrl}
                    className="h-7 w-7 shrink-0"
                  />
                )}
                <div
                  className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                    outgoing
                      ? 'rounded-br-none bg-blue-600 text-white'
                      : 'rounded-bl-none border border-slate-200 bg-white text-slate-800 shadow-2xs'
                  }`}
                >
                  <p className="whitespace-pre-wrap break-words">{message.content}</p>
                </div>
              </div>
            </div>
          );
        })}
        <div ref={endRef} />
      </div>

      {/* Input Form Footer */}
      <form onSubmit={handleSubmit} className="shrink-0 border-t border-slate-200 bg-white px-3 py-2.5">
        <div className="flex items-center gap-2">
          <input
            value={content}
            onChange={(event) => setContent(event.target.value)}
            placeholder="Message"
            className="flex-1 rounded-full border border-slate-200 bg-slate-100 px-4 py-2 text-sm text-slate-900 placeholder-slate-400 outline-none focus:border-blue-500 focus:bg-white focus:ring-1 focus:ring-blue-500"
          />
          <button
            type="submit"
            disabled={sending}
            aria-label={hasText ? 'Send message' : 'Send like'}
            className="p-1.5 text-blue-600 transition-colors hover:text-blue-700 disabled:opacity-40"
          >
            {hasText ? (
              <svg className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
              </svg>
            ) : (
              <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M7.466 22H3.05A1.05 1.05 0 012 20.95V10.45C2 9.87 2.47 9.4 3.05 9.4h4.416V22zm2.1-12.6V20.95c0 .58.47 1.05 1.05 1.05h6.394c.95 0 1.76-.67 1.93-1.6l1.64-9.02a2.003 2.003 0 00-1.97-2.36h-4.32a.5.5 0 01-.48-.64l1.1-4.4a1.85 1.85 0 00-1.78-2.38 1.44 1.44 0 00-1.12.52L9.566 9.4z" />
              </svg>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
