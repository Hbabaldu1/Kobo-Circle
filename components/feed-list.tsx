'use client';

import { useState } from 'react';
import type { ListingType } from '@/types/database';
import { WhatsAppShareButton } from '@/components/whatsapp-share-button';
import { ListingPhoto } from '@/components/listing-photo';

export type FeedListing = { id: string; user_id: string; type: ListingType; title: string; price: string | null; photo_url: string | null; seller_name: string; street_name: string; vouch_count: number; trust_ratio: number };
const filters: Array<{ label: string; type: ListingType | 'all' }> = [{ label: 'All', type: 'all' }, { label: 'For sale', type: 'sale' }, { label: 'Services', type: 'service' }, { label: 'Requests', type: 'request' }];

export function FeedList({ listings, currentUserId, postedListingId }: { listings: FeedListing[]; currentUserId: string; postedListingId: string | null }) {
  const [filter, setFilter] = useState<ListingType | 'all'>('all');
  const visible = filter === 'all' ? listings : listings.filter((listing) => listing.type === filter);
  const posted = postedListingId ? listings.find((listing) => listing.id === postedListingId) : undefined;
  return <>{posted && <section className="mt-5 rounded-xl bg-[#EFE7D6] p-4"><p className="font-semibold text-ink">Your listing is live.</p><WhatsAppShareButton id={posted.id} title={posted.title} price={posted.price} className="mt-3 bg-white" /></section>}<div className="mt-6 flex gap-2 overflow-x-auto pb-1">{filters.map(({ label, type }) => <button key={type} type="button" onClick={() => setFilter(type)} className={`shrink-0 rounded-full px-4 py-2 text-sm font-semibold ${filter === type ? 'bg-adire text-white' : 'bg-[#EFE7D6] text-ink'}`}>{label}</button>)}</div>
    <section className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3" aria-live="polite">{visible.length ? visible.map((listing) => <ListingCard key={listing.id} listing={listing} isOwner={listing.user_id === currentUserId} />) : <p className="rounded-xl bg-white p-5 text-sm text-slate-600 ring-1 ring-slate-200">No {filter === 'all' ? '' : filters.find((item) => item.type === filter)?.label.toLowerCase()} listings yet.</p>}</section></>;
}

function ListingCard({ listing, isOwner }: { listing: FeedListing; isOwner: boolean }) {
  const percentage = Number(listing.trust_ratio) * 100;
  const label = listing.type === 'sale' ? 'For sale' : listing.type === 'service' ? 'Service' : 'Request';
  return <article className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200"><ListingPhoto photoUrl={listing.photo_url} type={listing.type} title={listing.title} /><p className="mt-4 text-xs font-bold uppercase tracking-[0.16em] text-brick">{label}</p><h2 className="mt-2 font-heading text-xl font-bold text-ink"><a href={`/listings/${listing.id}`} className="hover:underline">{listing.title}</a></h2><p className="mt-1 font-semibold text-adire">{listing.type === 'request' || !listing.price ? 'Looking to buy' : listing.price}</p><div className="mt-4 flex items-center gap-3 border-t border-[#EFE7D6] pt-4"><TrustRing name={listing.seller_name} percentage={percentage} /><a href={`/sellers/${listing.user_id}`}><p className="font-semibold text-ink">{listing.seller_name}</p><p className="text-sm text-slate-600">{listing.street_name}</p></a><span className="ml-auto font-mono text-sm font-semibold text-adire">{Math.round(percentage)}%</span></div>{isOwner && <WhatsAppShareButton id={listing.id} title={listing.title} price={listing.price} className="mt-4" />}</article>;
}

export function TrustRing({ id, name, percentage, animate = false }: { id: string; name: string; percentage: number; animate?: boolean }) {
  return <div aria-label={`${Math.round(percentage)}% neighbour trust`} className={`grid h-12 w-12 shrink-0 place-items-center rounded-full transition-[background] duration-150 motion-reduce:transition-none ${animate ? 'animate-success-pop motion-reduce:animate-none' : ''}`} style={{ background: `conic-gradient(#D9A441 ${percentage * 3.6}deg, #EFE7D6 0deg)` }}><div className="grid h-9 w-9 place-items-center rounded-full bg-paper"><UserAvatar id={id} name={name} className="h-8 w-8 text-sm" /></div></div>;
}
