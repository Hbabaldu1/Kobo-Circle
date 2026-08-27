'use client';

import { FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { Database } from '@/types/database';

type Message = Database['public']['Tables']['messages']['Row'];

export function ChatWindow({ conversationId, currentUserId, initialMessages }: { conversationId: string; currentUserId: string; initialMessages: Message[] }) {
  const [messages, setMessages] = useState(initialMessages);
  const [content, setContent] = useState('');
  const [error, setError] = useState('');
  const [sending, setSending] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);
  const supabase = useMemo(() => createClient(), []);

  useEffect(() => { setMessages(initialMessages); }, [conversationId, initialMessages]);
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);
  useEffect(() => {
    const channel = supabase.channel(`messages:${conversationId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `conversation_id=eq.${conversationId}` }, (payload) => {
        const incoming = payload.new as Message;
        setMessages((current) => current.some((message) => message.id === incoming.id) ? current : [...current, incoming]);
      })
      .subscribe();
    return () => { void supabase.removeChannel(channel); };
  }, [conversationId, supabase]);

  async function sendMessage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = content.trim();
    if (!trimmed || sending) return;
    setSending(true); setError('');
    const { data, error: insertError } = await supabase.from('messages').insert({ conversation_id: conversationId, sender_id: currentUserId, content: trimmed }).select().single();
    if (insertError) setError('Your message could not be sent. Please try again.');
    else if (data) setMessages((current) => current.some((message) => message.id === data.id) ? current : [...current, data]);
    if (!insertError) setContent('');
    setSending(false);
  }

  return <div className="flex min-h-[360px] flex-col">
    <div className="flex-1 space-y-3 overflow-y-auto px-5 py-4" aria-live="polite">
      {messages.length === 0 && <p className="py-12 text-center text-sm text-slate-500">Send a message to start this conversation.</p>}
      {messages.map((message) => <div key={message.id} className={`flex ${message.sender_id === currentUserId ? 'justify-end' : 'justify-start'}`}><div className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-6 ${message.sender_id === currentUserId ? 'rounded-br-sm bg-adire text-white' : 'rounded-bl-sm bg-[#EFE7D6] text-ink'}`}><p className="whitespace-pre-wrap break-words">{message.content}</p><p className={`mt-1 text-right text-[10px] ${message.sender_id === currentUserId ? 'text-white/70' : 'text-slate-500'}`}>{new Date(message.created_at).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}</p></div></div>)}
      <div ref={endRef} />
    </div>
    <form onSubmit={sendMessage} className="border-t border-slate-200 p-3">
      {error && <p role="alert" className="mb-2 text-sm text-brick">{error}</p>}
      <div className="flex gap-2"><textarea value={content} onChange={(event) => setContent(event.target.value)} maxLength={1000} rows={2} placeholder="Write a message…" className="min-h-11 flex-1 resize-none rounded-lg border border-slate-300 px-3 py-2 text-sm" /><button type="submit" disabled={sending || !content.trim()} className="rounded-lg bg-adire px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">{sending ? 'Sending…' : 'Send'}</button></div>
    </form>
  </div>;
}
