'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Image as ImageIcon, Send, ThumbsUp } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { ListingPhoto } from '@/components/listing-photo';
import { UserAvatar } from '@/components/user-avatar';
import { listingPriceLabel } from '@/lib/listing-price';
import type { Database, ListingType } from '@/types/database';

type Message = Database['public']['Tables']['messages']['Row'];
export type ReferencedListing = { id: string; title: string; price: string | null; photo_url: string | null; type: ListingType; status: string };
type ChatWindowProps = { conversationId: string; currentUserId: string; initialMessages: Message[]; initialReferencedListings: ReferencedListing[]; counterparty: { id: string; name: string; avatarUrl: string | null } };

function dateLabel(value: string) { return new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }).format(new Date(value)); }

function ListingReferenceCard({ message, listing }: { message: Message; listing?: ReferencedListing }) {
  if (!message.reference_listing_id || !listing) return <div className="my-5 rounded-xl border border-dashed border-slate-300 bg-white px-4 py-3 text-center text-sm text-slate-600 shadow-2xs dark:border-slate-600"><p>This listing is no longer available.</p>{message.content && <p className="mt-1 text-xs text-slate-500">{message.content}</p>}</div>;
  return <Link href={`/listings/${listing.id}`} className="my-5 flex w-full items-center gap-3 rounded-xl border border-[#EFE7D6] bg-white p-3 text-left shadow-2xs transition-colors hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-adire dark:border-slate-600 dark:hover:bg-slate-100" aria-label={`View listing: ${listing.title}`}>
    <ListingPhoto photoUrl={listing.photo_url} type={listing.type} title={listing.title} className="!h-16 !w-20 shrink-0 rounded-lg" />
    <span className="min-w-0 flex-1"><span className="block text-[11px] font-bold uppercase tracking-wider text-slate-500">Shared listing</span><span className="block truncate font-semibold text-slate-900">{listing.title}</span><span className="mt-0.5 block truncate text-sm font-semibold text-adire">{listingPriceLabel(listing.type, listing.price)}</span></span>
    <span className="shrink-0 rounded-full bg-leaf/10 px-2 py-1 text-xs font-semibold capitalize text-leaf">{listing.status}</span>
  </Link>;
}

export function ChatWindow({ conversationId, currentUserId, initialMessages, initialReferencedListings, counterparty }: ChatWindowProps) {
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [referencedListings, setReferencedListings] = useState<Record<string, ReferencedListing>>(() => Object.fromEntries(initialReferencedListings.map((listing) => [listing.id, listing])));
  const [content, setContent] = useState('');
  const [sending, setSending] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);
  const atBottomRef = useRef(true);
  const supabase = useMemo(() => createClient(), []);

  function scrollToNewest(behavior: ScrollBehavior = 'auto') { const list = listRef.current; if (list) list.scrollTo({ top: list.scrollHeight, behavior }); }
  function onScroll() { const list = listRef.current; if (list) atBottomRef.current = list.scrollHeight - list.scrollTop - list.clientHeight < 48; }
  const loadReferencedListing = useCallback(async (listingId: string) => {
    if (referencedListings[listingId]) return;
    const { data, error } = await supabase.from('listings').select('id, title, price, photo_url, type, status').eq('id', listingId).maybeSingle();
    if (!error && data) setReferencedListings((current) => ({ ...current, [data.id]: data as ReferencedListing }));
  }, [referencedListings, supabase]);

  useEffect(() => { scrollToNewest(); }, []);
  useEffect(() => { if (atBottomRef.current) requestAnimationFrame(() => scrollToNewest('smooth')); }, [messages]);
  useEffect(() => { setMessages(initialMessages); setReferencedListings(Object.fromEntries(initialReferencedListings.map((listing) => [listing.id, listing]))); }, [initialMessages, initialReferencedListings]);
  useEffect(() => { messages.forEach((message) => { if (message.message_type === 'listing_reference' && message.reference_listing_id) void loadReferencedListing(message.reference_listing_id); }); }, [loadReferencedListing, messages]); // References received live need their own listing metadata.
  useEffect(() => {
    async function markReceivedMessagesAsRead() {
      try {
        const { error } = await supabase.from('messages').update({ read_at: new Date().toISOString() }).eq('conversation_id', conversationId).neq('sender_id', currentUserId).is('read_at', null);
        if (error) throw error;
        router.refresh();
      } catch (error) { console.error('Could not mark received messages as read:', error); }
    }
    void markReceivedMessagesAsRead();
  }, [conversationId, currentUserId, router, supabase]);
  useEffect(() => {
    const channel = supabase.channel(`messages:${conversationId}`).on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `conversation_id=eq.${conversationId}` }, (payload) => {
      const incoming = payload.new as Message;
      setMessages((current) => current.some((message) => message.id === incoming.id) ? current : [...current, incoming]);
    }).subscribe();
    return () => { void supabase.removeChannel(channel); };
  }, [conversationId, supabase]);

  async function handleSend(textToSend?: string) {
    const text = textToSend ?? content.trim();
    if (!text || sending) return;
    setSending(true);
    try {
      const { data, error } = await supabase.from('messages').insert({ conversation_id: conversationId, sender_id: currentUserId, content: text }).select().single();
      if (error) throw error;
      if (data) setMessages((current) => current.some((message) => message.id === data.id) ? current : [...current, data]);
      if (data) void fetch('/api/push/send', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ conversationId, recipientId: counterparty.id }) });
      if (!textToSend) setContent('');
    } catch (error) { console.error('Could not send message:', error); } finally { setSending(false); }
  }

  return <section className="flex min-h-0 flex-1 flex-col overflow-hidden bg-slate-50 text-slate-900">
    <div ref={listRef} onScroll={onScroll} className="min-h-0 flex-1 space-y-3 overflow-y-auto px-4 py-4 overscroll-contain">
      <section className="mb-6 flex flex-col items-center text-center"><UserAvatar id={counterparty.id} name={counterparty.name} avatarUrl={counterparty.avatarUrl} className="h-16 w-16 text-lg" /><h2 className="mt-2 text-base font-bold">{counterparty.name}</h2><p className="text-xs text-slate-500">Connected on Kobo Circle</p></section>
      {messages.map((message, index) => {
        if (message.message_type === 'listing_reference') return <ListingReferenceCard key={message.id} message={message} listing={message.reference_listing_id ? referencedListings[message.reference_listing_id] : undefined} />;
        const outgoing = message.sender_id === currentUserId; const previous = messages[index - 1];
        const showDate = !previous || new Date(previous.created_at).toDateString() !== new Date(message.created_at).toDateString();
        return <div key={message.id} className={!outgoing ? 'animate-card-enter motion-reduce:animate-none' : ''}>{showDate && <p className="my-4 text-center text-xs font-medium text-slate-400">{dateLabel(message.created_at)}</p>}<div className={`flex items-end gap-2 ${outgoing ? 'justify-end' : 'justify-start'}`}>{!outgoing && <UserAvatar id={counterparty.id} name={counterparty.name} avatarUrl={counterparty.avatarUrl} className="h-7 w-7 shrink-0" />}<div className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed sm:max-w-[70%] ${outgoing ? 'rounded-br-none bg-adire text-white' : 'rounded-bl-none border border-slate-200 bg-white text-slate-800 shadow-2xs'}`}><p className="whitespace-pre-wrap break-words">{message.content}</p></div></div></div>;
      })}
    </div>
    <form onSubmit={(event) => { event.preventDefault(); void handleSend(content.trim() || '👍'); }} className="shrink-0 border-t border-slate-200 bg-white px-3 py-2.5 pb-[max(0.625rem,env(safe-area-inset-bottom))]"><div className="flex items-center gap-2"><button type="button" aria-label="Attach gallery media" className="rounded-full p-2 text-adire hover:bg-slate-100"><ImageIcon className="h-5 w-5" /></button><input value={content} onChange={(event) => setContent(event.target.value)} placeholder="Message" className="min-w-0 flex-1 rounded-full border border-slate-200 bg-slate-100 px-4 py-2 text-base text-slate-900 placeholder-slate-400 outline-none focus:border-adire focus:bg-white focus:ring-1 focus:ring-adire" /><button type="submit" disabled={sending} aria-label={content.trim() ? 'Send message' : 'Send like'} className="p-2 text-adire disabled:opacity-40">{content.trim() ? <Send className="h-5 w-5" /> : <ThumbsUp className="h-5 w-5" />}</button></div></form>
  </section>;
}
