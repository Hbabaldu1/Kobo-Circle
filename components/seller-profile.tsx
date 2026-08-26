'use client';

import { useCallback, useState } from 'react';
import { TrustRing } from '@/components/feed-list';
import { VouchButton } from '@/components/vouch-button';
import { buildWhatsAppListingLink } from '@/lib/whatsapp';

export function SellerProfile({ sellerId, name, streetName, initialVouchCount, initialTrustRatio, notes, isOwner, phone, listingTitle }: { sellerId: string; name: string; streetName: string; initialVouchCount: number; initialTrustRatio: number; phone: string | null; listingTitle: string | null; notes: Array<{ id: string; note: string | null; created_at: string }>; isOwner: boolean }) {
  const [vouchCount, setVouchCount] = useState(initialVouchCount);
  const [trustRatio, setTrustRatio] = useState(initialTrustRatio);
  const handleVouched = useCallback(() => {
    setVouchCount((count) => count + 1);
    setTrustRatio((ratio) => Math.min(ratio + (1 / 12), 1));
  }, []);
  const percentage = trustRatio * 100;
  const whatsappLink = listingTitle ? buildWhatsAppListingLink(phone, listingTitle) : null;
  return <main className="mx-auto min-h-screen max-w-lg px-5 py-10"><a href="/feed" className="text-sm font-semibold text-adire">← Back to feed</a><section className="mt-5 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200"><div className="flex items-center gap-4"><TrustRing name={name} percentage={percentage} /><div><h1 className="font-heading text-2xl font-bold text-ink">{name}</h1><p className="text-sm text-slate-600">{streetName}</p></div><span className="ml-auto font-mono text-lg font-bold text-adire">{Math.round(percentage)}%</span></div><p className="mt-4 text-sm text-slate-600">{vouchCount} {vouchCount === 1 ? 'vouch' : 'vouches'} from neighbours</p>{whatsappLink ? <a href={whatsappLink} target="_blank" rel="noreferrer" className="mt-5 inline-flex w-full items-center justify-center rounded-lg bg-[#25D366] px-4 py-3 font-semibold text-white">Message on WhatsApp</a> : <p className="mt-5 rounded-lg bg-slate-100 p-3 text-sm text-slate-500">This neighbour hasn&apos;t shared a phone number yet</p>}{!isOwner && <VouchButton sellerId={sellerId} onVouched={handleVouched} />}</section><section className="mt-6"><h2 className="font-heading text-xl font-bold text-ink">Vouch notes</h2>{notes.length ? <ul className="mt-3 space-y-3">{notes.map((vouch) => <li key={vouch.id} className="rounded-xl bg-white p-4 text-sm text-ink shadow-sm ring-1 ring-slate-200">{vouch.note || 'A neighbour vouched for this seller.'}</li>)}</ul> : <p className="mt-3 rounded-xl bg-white p-4 text-sm text-slate-600 ring-1 ring-slate-200">No vouch notes yet.</p>}</section></main>;
}
