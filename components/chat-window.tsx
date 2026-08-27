'use client';

import { FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { UserAvatar } from '@/components/user-avatar';
import type { Database } from '@/types/database';

type Message = Database['public']['Tables']['messages']['Row'];
type ChatWindowProps = { conversationId: string; currentUserId: string; initialMessages: Message[]; counterparty: { id: string; name: string; avatarUrl: string | null }; listing?: { id: string; title: string } };

function dateLabel(value: string) { return new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }).format(new Date(value)); }

export function ChatWindow({ conversationId, currentUserId, initialMessages, counterparty, listing }: ChatWindowProps) {
  const [messages, setMessages] = useState(initialMessages);
  const [content, setContent] = useState('');
  const [error, setError] = useState('');
  const [sending, setSending] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);
  const supabase = useMemo(() => createClient(), []);

  useEffect(() => { setMessages(initialMessages); }, [conversationId, initialMessages]);
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);
  useEffect(() => {
    const channel = supabase.channel(`messages:${conversationId}`).on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `conversation_id=eq.${conversationId}` }, (payload) => {
      const incoming = payload.new as Message;
      setMessages((current) => current.some((message) => message.id === incoming.id) ? current : [...current, incoming]);
    }).subscribe();
    return () => { void supabase.removeChannel(channel); };
  }, [conversationId, supabase]);

  async function sendMessage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); const trimmed = content.trim(); if (!trimmed || sending) return;
    setSending(true); setError('');
    const { data, error: insertError } = await supabase.from('messages').insert({ conversation_id: conversationId, sender_id: currentUserId, content: trimmed }).select().single();
    if (insertError) setError('Your message could not be sent. Please try again.');
    else if (data) { setMessages((current) => current.some((message) => message.id === data.id) ? current : [...current, data]); setContent(''); }
    setSending(false);
  }

  return <div className="flex min-h-[calc(100dvh-12rem)] flex-col bg-white">
    <div className="flex-1 space-y-3 overflow-y-auto px-4 py-5" aria-live="polite">
      <section className="mb-8 flex flex-col items-center text-center"><UserAvatar id={counterparty.id} name={counterparty.name} avatarUrl={counterparty.avatarUrl} className="h-24 w-24 text-3xl" /><h2 className="mt-3 font-heading text-xl font-bold text-ink">{counterparty.name}</h2><p className="mt-1 text-sm text-slate-500">Estate neighbour</p><Link href={listing ? `/listings/${listing.id}` : `/sellers/${counterparty.id}`} className="mt-3 rounded-full bg-gray-100 px-4 py-2 text-sm font-semibold text-adire hover:bg-gray-200">{listing ? 'View Listing' : 'View Profile'}</Link></section>
      {messages.length === 0 && <p className="py-8 text-center text-sm text-slate-500">Send a message to start this conversation.</p>}
      {messages.map((message, index) => { const outgoing = message.sender_id === currentUserId; const previous = messages[index - 1]; const showDate = !previous || new Date(previous.created_at).toDateString() !== new Date(message.created_at).toDateString(); const isLatestOutgoing = outgoing && !messages.slice(index + 1).some((item) => item.sender_id === currentUserId); return <div key={message.id}>{showDate && <p className="my-5 text-center text-xs text-slate-400">{dateLabel(message.created_at)}</p>}<div className={`flex items-end gap-2 ${outgoing ? 'justify-end' : 'justify-start'}`}>{!outgoing && <UserAvatar id={counterparty.id} name={counterparty.name} avatarUrl={counterparty.avatarUrl} className="h-7 w-7 text-[10px]" />}<div className={`max-w-[78%] rounded-2xl px-4 py-2.5 text-sm leading-6 ${outgoing ? 'rounded-tr-sm bg-adire text-white' : 'rounded-tl-sm bg-gray-100 text-gray-900'}`}><p className="whitespace-pre-wrap break-words">{message.content}</p></div></div>{outgoing && isLatestOutgoing && <p className="mr-1 mt-1 text-right text-[10px] text-slate-400">{message.read_at ? 'Seen' : dateLabel(message.created_at)}</p>}</div>; })}<div ref={endRef} /></div>
    <form onSubmit={sendMessage} className="sticky bottom-0 border-t border-slate-200 bg-white p-3">{error && <p role="alert" className="mb-2 text-sm text-brick">{error}</p>}<div className="flex items-center gap-2"><button type="button" aria-label="Attach media" className="rounded-full p-2 text-xl text-adire hover:bg-slate-100">＋</button><textarea value={content} onChange={(event) => setContent(event.target.value)} maxLength={1000} rows={1} placeholder="Aa" className="min-h-10 flex-1 resize-none rounded-full bg-gray-100 px-4 py-2 text-sm outline-none ring-adire focus:ring-2" /><button type="submit" aria-label="Send message" disabled={sending || !content.trim()} className="rounded-full bg-adire p-2 text-white disabled:opacity-50">➤</button></div></form>
  </div>;
}
