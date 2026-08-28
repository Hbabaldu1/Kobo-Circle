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
    /* 
      1. h-[100dvh] locks the layout to the exact dynamic viewport.
      2. flex flex-col & overflow-hidden prevents the outer page/layout from scrolling.
    */
    <div className="fixed inset-x-0 bottom-0 top-14 z-10 flex flex-col overflow-hidden bg-slate-50 text-slate-900 md:relative md:top-0 md:h-[calc(100vh-64px)]">
      
      {/* Header / Sub-header info if needed */}
      
      {/* Message Feed - scrollable area only */}
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-3 oversustain-contain">
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

      {/* Input Form Footer - Pinned directly above keyboard/bottom edge */}
      <form
        onSubmit={handleSubmit}
        className="shrink-0 border-t border-slate-200 bg-white px-3 py-2.5 pb-[max(0.625rem,env(safe-area-inset-bottom))]"
      >
        <div className="flex items-center gap-2">
          <button
            type="button"
            aria-label="Attach gallery media"
            className="p-1.5 text-blue-600 hover:text-blue-700 hover:bg-slate-100 rounded-full transition-colors"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
            </svg>
          </button>

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
