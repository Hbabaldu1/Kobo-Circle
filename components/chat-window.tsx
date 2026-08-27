// 'use client';

// import { FormEvent, useEffect, useMemo, useRef, useState } from 'react';
// import { createClient } from '@/lib/supabase/client';
// import type { Database } from '@/types/database';

// type Message = Database['public']['Tables']['messages']['Row'];

// export function ChatWindow({ conversationId, currentUserId, initialMessages }: { conversationId: string; currentUserId: string; initialMessages: Message[] }) {
//   const [messages, setMessages] = useState(initialMessages);
//   const [content, setContent] = useState('');
//   const [error, setError] = useState('');
//   const [sending, setSending] = useState(false);
//   const endRef = useRef<HTMLDivElement>(null);
//   const supabase = useMemo(() => createClient(), []);

//   useEffect(() => { setMessages(initialMessages); }, [conversationId, initialMessages]);
//   useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);
//   useEffect(() => {
//     const channel = supabase.channel(`messages:${conversationId}`)
//       .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `conversation_id=eq.${conversationId}` }, (payload) => {
//         const incoming = payload.new as Message;
//         setMessages((current) => current.some((message) => message.id === incoming.id) ? current : [...current, incoming]);
//       })
//       .subscribe();
//     return () => { void supabase.removeChannel(channel); };
//   }, [conversationId, supabase]);

//   async function sendMessage(event: FormEvent<HTMLFormElement>) {
//     event.preventDefault();
//     const trimmed = content.trim();
//     if (!trimmed || sending) return;
//     setSending(true); setError('');
//     const { data, error: insertError } = await supabase.from('messages').insert({ conversation_id: conversationId, sender_id: currentUserId, content: trimmed }).select().single();
//     if (insertError) setError('Your message could not be sent. Please try again.');
//     else if (data) setMessages((current) => current.some((message) => message.id === data.id) ? current : [...current, data]);
//     if (!insertError) setContent('');
//     setSending(false);
//   }

//   return <div className="flex min-h-[360px] flex-col">
//     <div className="flex-1 space-y-3 overflow-y-auto px-5 py-4" aria-live="polite">
//       {messages.length === 0 && <p className="py-12 text-center text-sm text-slate-500">Send a message to start this conversation.</p>}
//       {messages.map((message) => <div key={message.id} className={`flex ${message.sender_id === currentUserId ? 'justify-end' : 'justify-start'}`}><div className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-6 ${message.sender_id === currentUserId ? 'rounded-br-sm bg-adire text-white' : 'rounded-bl-sm bg-[#EFE7D6] text-ink'}`}><p className="whitespace-pre-wrap break-words">{message.content}</p><p className={`mt-1 text-right text-[10px] ${message.sender_id === currentUserId ? 'text-white/70' : 'text-slate-500'}`}>{new Date(message.created_at).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}</p></div></div>)}
//       <div ref={endRef} />
//     </div>
//     <form onSubmit={sendMessage} className="border-t border-slate-200 p-3">
//       {error && <p role="alert" className="mb-2 text-sm text-brick">{error}</p>}
//       <div className="flex gap-2"><textarea value={content} onChange={(event) => setContent(event.target.value)} maxLength={1000} rows={2} placeholder="Write a message…" className="min-h-11 flex-1 resize-none rounded-lg border border-slate-300 px-3 py-2 text-sm" /><button type="submit" disabled={sending || !content.trim()} className="rounded-lg bg-adire px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">{sending ? 'Sending…' : 'Send'}</button></div>
//     </form>
//   </div>;
// }



'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { Image as ImageIcon, Mic, ThumbsUp } from 'lucide-react';
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
    const trimmed = content.trim();
    if (!trimmed || sending) return;
    setSending(true);

    const { data, error: insertError } = await supabase
      .from('messages')
      .insert({ conversation_id: conversationId, sender_id: currentUserId, content: trimmed })
      .select()
      .single();

    if (!insertError && data) {
      setMessages((current) => (current.some((message) => message.id === data.id) ? current : [...current, data]));
      setContent('');
    }
    setSending(false);
  }

  return (
    <div className="flex min-h-[calc(100dvh-57px)] flex-col bg-[#121212] text-white">
      <div className="flex-1 space-y-3 overflow-y-auto px-4 py-6" aria-live="polite">
        <section className="mb-8 flex flex-col items-center text-center">
          <UserAvatar id={counterparty.id} name={counterparty.name} avatarUrl={counterparty.avatarUrl} className="h-28 w-28 text-3xl" />
          <h2 className="mt-3 font-heading text-2xl font-bold">{counterparty.name}</h2>
          <p className="mt-1 text-sm text-slate-400">You&apos;re connected on Kobo Circle</p>
          <Link
            href={listing ? `/listings/${listing.id}` : `/sellers/${counterparty.id}`}
            className="mt-4 rounded-lg bg-slate-800 px-5 py-2 text-sm font-semibold text-white hover:bg-slate-700 transition-colors"
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
              {showDate && <p className="my-6 text-center text-xs text-slate-500">{dateLabel(message.created_at)}</p>}
              <div className={`flex items-end gap-2 ${outgoing ? 'justify-end' : 'justify-start'}`}>
                {!outgoing && <UserAvatar id={counterparty.id} name={counterparty.name} avatarUrl={counterparty.avatarUrl} className="h-7 w-7" />}
                <div className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${outgoing ? 'bg-blue-600 text-white rounded-br-xs' : 'bg-slate-800 text-white rounded-bl-xs'}`}>
                  <p className="whitespace-pre-wrap break-words">{message.content}</p>
                </div>
              </div>
            </div>
          );
        })}
        <div ref={endRef} />
      </div>

      <form onSubmit={sendMessage} className="sticky bottom-0 border-t border-slate-800 bg-[#121212] px-3 py-2.5">
        <div className="flex items-center gap-2">
          <button type="button" aria-label="Attach gallery media" className="p-1 text-blue-500 hover:text-blue-400">
            <ImageIcon className="h-5 w-5" />
          </button>
          <button type="button" aria-label="Audio note" className="p-1 text-blue-500 hover:text-blue-400">
            <Mic className="h-5 w-5" />
          </button>
          <input
            value={content}
            onChange={(event) => setContent(event.target.value)}
            placeholder="Message"
            className="flex-1 rounded-full bg-slate-800 px-4 py-2 text-sm text-white placeholder-slate-400 outline-none focus:ring-1 focus:ring-blue-500"
          />
          <button type="submit" disabled={sending || !content.trim()} className="p-1 text-blue-500 disabled:opacity-40">
            <ThumbsUp className="h-5 w-5" />
          </button>
        </div>
      </form>
    </div>
  );
}
