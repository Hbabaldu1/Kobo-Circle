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
import { useEffect, useRef, useState } from 'react';
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
  return new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }).format(new Date(value));
}

export function ChatWindow({ conversationId, currentUserId, initialMessages, counterparty, listing }: ChatWindowProps) {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [content, setContent] = useState('');
  const [sending, setSending] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);
  const supabase = createClient();

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    const channel = supabase
      .channel(`messages:${conversationId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `conversation_id=eq.${conversationId}` }, (payload) => {
        const incoming = payload.new as Message;
        setMessages((current) => (current.some((message) => message.id === incoming.id) ? current : [...current, incoming]));
      })
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [conversationId, supabase]);

  async function sendMessage(event: React.FormEvent) {
    event.preventDefault();
    if (sending) return;

    // Send text if typed, otherwise send thumbs up
    const textToSend = content.trim() || '👍';
    setSending(true);

    const { data, error: insertError } = await supabase
      .from('messages')
      .insert({ conversation_id: conversationId, sender_id: currentUserId, content: textToSend })
      .select()
      .single();

    if (!insertError && data) {
      setMessages((current) => (current.some((message) => message.id === data.id) ? current : [...current, data]));
      setContent('');
    }
    setSending(false);
  }

  const hasContent = content.trim().length > 0;

  return (
    <div className="mx-auto flex min-h-[calc(100vh-120px)] max-w-2xl flex-col bg-slate-50 text-slate-900 border-x border-slate-200">
      <div className="flex-1 space-y-3 overflow-y-auto px-4 py-6" aria-live="polite">
        <section className="mb-8 flex flex-col items-center text-center">
          <UserAvatar id={counterparty.id} name={counterparty.name} avatarUrl={counterparty.avatarUrl} className="h-24 w-24 text-2xl" />
          <h2 className="mt-3 text-xl font-bold text-slate-900">{counterparty.name}</h2>
          <p className="mt-1 text-sm text-slate-500">You&apos;re connected on Kobo Circle</p>
          <Link
            href={listing ? `/listings/${listing.id}` : `/sellers/${counterparty.id}`}
            className="mt-4 rounded-lg bg-slate-200 px-4 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-300 transition-colors"
          >
            {listing ? 'View listing' : 'View profile'}
          </Link>
        </section>

        {messages.map((message, index) => {
          const outgoing = message.sender_id === currentUserId;
          const previous = messages[index - 1];
          const showDate = !previous || new Date(previous.created_at).toDateString() !== new Date(message.created_at).toDateString();

          return (
            <div key={message.id}>
              {showDate && <p className="my-6 text-center text-xs font-medium text-slate-400">{dateLabel(message.created_at)}</p>}
              <div className={`flex items-end gap-2 ${outgoing ? 'justify-end' : 'justify-start'}`}>
                {!outgoing && <UserAvatar id={counterparty.id} name={counterparty.name} avatarUrl={counterparty.avatarUrl} className="h-7 w-7" />}
                <div className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${outgoing ? 'bg-blue-600 text-white rounded-br-none' : 'bg-white border border-slate-200 text-slate-800 rounded-bl-none shadow-xs'}`}>
                  <p className="whitespace-pre-wrap break-words">{message.content}</p>
                </div>
              </div>
            </div>
          );
        })}
        <div ref={endRef} />
      </div>

      <form onSubmit={sendMessage} className="sticky bottom-0 border-t border-slate-200 bg-white px-3 py-2.5">
        <div className="flex items-center gap-2">
          <input
            value={content}
            onChange={(event) => setContent(event.target.value)}
            placeholder="Message"
            className="flex-1 rounded-full border border-slate-300 bg-slate-100 px-4 py-2 text-sm text-slate-900 placeholder-slate-400 outline-none focus:border-blue-500 focus:bg-white focus:ring-1 focus:ring-blue-500"
          />
          <button
            type="submit"
            disabled={sending}
            aria-label={hasContent ? 'Send message' : 'Send thumbs up'}
            className="p-2 text-blue-600 hover:text-blue-700 transition-colors"
          >
            {hasContent ? (
              /* Send Arrow Icon */
              <svg className="h-6 w-6 transform rotate-45" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3 21l18-9L3 3l3 9zm0 0h75" />
              </svg>
            ) : (
              /* Thumbs Up (Like) Icon */
              <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M7.498 12.394a.5.5 0 01.354.854l-4.5 4.5a.5.5 0 01-.708 0l-2-2a.5.5 0 11.708-.708L3 16.793l4.146-4.147a.5.5 0 01.352-.252zM12 2a1 1 0 01.8.4l2.5 3.333H20a2 2 0 012 2v10a2 2 0 01-2 2h-9.28a2 2 0 01-1.6-.8l-4.12-5.493A2 2 0 014.6 12.16l1.9-4.75A2 2 0 018.36 6H10V3a1 1 0 011-1z" />
              </svg>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
