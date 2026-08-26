'use client';

type Props = { id: string; title: string; price: string | null; className?: string };
export function WhatsAppShareButton({ id, title, price, className = '' }: Props) {
  function share() {
    const message = `${title} — ${price ? price : 'Looking to buy'}\n${window.location.origin}/listings/${id}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank', 'noopener,noreferrer');
  }
  return <button type="button" onClick={share} className={`inline-flex rounded-lg border border-adire px-3 py-2 text-sm font-semibold text-adire ${className}`}>Share to WhatsApp</button>;
}
