'use client';

import { useTransition } from 'react';
import { getOrCreateConversation } from '@/app/messages/actions';

export function MessageSellerButton({ listingId, sellerId }: { listingId: string; sellerId: string }) {
  const [pending, startTransition] = useTransition();
  return <button type="button" disabled={pending} onClick={() => startTransition(() => getOrCreateConversation(listingId, sellerId))} className="mt-5 inline-flex w-full items-center justify-center rounded-lg bg-adire px-4 py-3 font-semibold text-white transition-transform duration-100 active:scale-95 disabled:opacity-60 motion-reduce:transition-none motion-reduce:active:scale-100">{pending ? 'Opening chat…' : 'Message Me'}</button>;
}
