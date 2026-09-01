'use client';

import { listingPriceLabel } from '@/lib/listing-price';
import type { ListingType } from '@/types/database';

type Props = { id: string; title: string; price: string | null; type: ListingType; className?: string };
export function WhatsAppShareButton({ id, title, price, type, className = '' }: Props) {
  function share() {
    const message = `${title} — ${listingPriceLabel(type, price)}\n${window.location.origin}/listings/${id}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank', 'noopener,noreferrer');
  }
  return <button type="button" onClick={share} className={`inline-flex rounded-lg border border-adire px-3 py-2 text-sm font-semibold text-adire transition-transform duration-100 active:scale-95 motion-reduce:transition-none motion-reduce:active:scale-100 ${className}`}>Share to WhatsApp</button>;
}
